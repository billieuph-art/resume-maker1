-- 简历快做 · 激活码系统
-- 用法：Supabase 控制台 → SQL Editor → New query → 粘贴整个文件 → Run
-- 可以重复执行，不会删除已有的激活码

create extension if not exists pgcrypto;

create table if not exists public.activation_codes (
  code          text primary key,
  created_at    timestamptz not null default now(),
  max_devices   int         not null default 1,
  devices       text[]      not null default '{}',
  first_used_at timestamptz,
  revoked       boolean     not null default false,
  note          text
);

-- 开启行级安全且不建任何策略：网页端无法直接读写这张表，只能调用下面两个函数
alter table public.activation_codes enable row level security;
revoke all on public.activation_codes from anon, authenticated;

create or replace function public._normalize_code(p_code text)
returns text language sql immutable as $$
  select substr(c, 1, 4) || '-' || substr(c, 5, 4) || '-' || substr(c, 9, 4)
  from (select upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')) as c) t
$$;

-- 激活：码存在、没作废、绑定设备数没超上限 → 成功并绑定当前设备
create or replace function public.redeem_code(p_code text, p_device text)
returns json
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  r public.activation_codes%rowtype;
begin
  if p_device is null or length(p_device) not between 8 and 64 then
    return json_build_object('ok', false, 'reason', 'bad_device');
  end if;

  select * into r from public.activation_codes
  where code = public._normalize_code(p_code)
  for update;

  if not found or r.revoked then
    return json_build_object('ok', false, 'reason', 'invalid');
  end if;
  if p_device = any(r.devices) then
    return json_build_object('ok', true);
  end if;
  if cardinality(r.devices) >= r.max_devices then
    return json_build_object('ok', false, 'reason', 'used');
  end if;

  update public.activation_codes
  set devices = array_append(devices, p_device),
      first_used_at = coalesce(first_used_at, now())
  where code = r.code;
  return json_build_object('ok', true);
end $$;

-- 打开网页时复查：码仍然有效且绑定了这台设备
create or replace function public.check_code(p_code text, p_device text)
returns json
language sql stable security definer
set search_path = public, extensions
as $$
  select json_build_object('ok', exists (
    select 1 from public.activation_codes
    where code = public._normalize_code(p_code)
      and not revoked
      and p_device = any(devices)
  ))
$$;

-- 批量生成激活码（只能在 SQL Editor 里执行，网页端调不到）
create or replace function public.generate_codes(n int default 100)
returns setof text
language plpgsql
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea;
  s text;
begin
  for i in 1..n loop
    loop
      bytes := gen_random_bytes(12);
      s := '';
      for j in 0..11 loop
        s := s || substr(alphabet, 1 + get_byte(bytes, j) % 32, 1);
      end loop;
      s := public._normalize_code(s);
      begin
        insert into public.activation_codes (code) values (s);
        exit;
      exception when unique_violation then
        -- 极小概率重复，重新生成
      end;
    end loop;
    return next s;
  end loop;
end $$;

revoke all on function public.generate_codes(int) from public, anon, authenticated;
revoke all on function public._normalize_code(text) from public, anon, authenticated;
revoke all on function public.redeem_code(text, text) from public;
revoke all on function public.check_code(text, text) from public;
grant execute on function public.redeem_code(text, text) to anon, authenticated;
grant execute on function public.check_code(text, text) to anon, authenticated;
