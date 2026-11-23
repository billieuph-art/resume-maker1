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

-- 批量生成激活码（只能在 SQL Editor / 管理后台用 service_role 执行，网页端调不到）
create or replace function public.generate_codes(n int default 100)
returns setof text
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea;
  s text;
begin
  if n is null or n < 1 or n > 2000 then
    raise exception 'n must be between 1 and 2000';
  end if;
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

-- 管理：统计
create or replace function public.admin_stats()
returns json
language sql stable security definer
set search_path = public
as $$
  select json_build_object(
    'total', count(*),
    'unused', count(*) filter (where first_used_at is null and not revoked),
    'used', count(*) filter (where first_used_at is not null and not revoked),
    'revoked', count(*) filter (where revoked)
  )
  from public.activation_codes
$$;

-- 管理：列表（filter: unused / used / revoked / all）
create or replace function public.admin_list_codes(p_filter text default 'all', p_limit int default 200)
returns table (
  code text,
  status text,
  devices int,
  created_at timestamptz,
  first_used_at timestamptz,
  note text
)
language sql stable security definer
set search_path = public
as $$
  select
    c.code,
    case
      when c.revoked then 'revoked'
      when c.first_used_at is null then 'unused'
      else 'used'
    end as status,
    cardinality(c.devices) as devices,
    c.created_at,
    c.first_used_at,
    c.note
  from public.activation_codes c
  where
    case lower(coalesce(p_filter, 'all'))
      when 'unused' then c.first_used_at is null and not c.revoked
      when 'used' then c.first_used_at is not null and not c.revoked
      when 'revoked' then c.revoked
      else true
    end
  order by c.created_at desc
  limit least(greatest(coalesce(p_limit, 200), 1), 2000)
$$;

-- 管理：作废
create or replace function public.admin_revoke(p_code text)
returns json
language plpgsql security definer
set search_path = public
as $$
begin
  update public.activation_codes
  set revoked = true
  where code = public._normalize_code(p_code);
  if not found then
    return json_build_object('ok', false, 'reason', 'invalid');
  end if;
  return json_build_object('ok', true);
end $$;

-- 管理：解绑设备（买家换手机时用）
create or replace function public.admin_unbind(p_code text)
returns json
language plpgsql security definer
set search_path = public
as $$
begin
  update public.activation_codes
  set devices = '{}', first_used_at = null
  where code = public._normalize_code(p_code) and not revoked;
  if not found then
    return json_build_object('ok', false, 'reason', 'invalid');
  end if;
  return json_build_object('ok', true);
end $$;

revoke all on function public.generate_codes(int) from public, anon, authenticated;
revoke all on function public._normalize_code(text) from public, anon, authenticated;
revoke all on function public.admin_stats() from public, anon, authenticated;
revoke all on function public.admin_list_codes(text, int) from public, anon, authenticated;
revoke all on function public.admin_revoke(text) from public, anon, authenticated;
revoke all on function public.admin_unbind(text) from public, anon, authenticated;
revoke all on function public.redeem_code(text, text) from public;
revoke all on function public.check_code(text, text) from public;

grant execute on function public.redeem_code(text, text) to anon, authenticated;
grant execute on function public.check_code(text, text) to anon, authenticated;

-- Supabase 的 service_role 可调用管理函数；本地 PostgREST 测试时也会创建同名角色
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.generate_codes(int) to service_role;
    grant execute on function public.admin_stats() to service_role;
    grant execute on function public.admin_list_codes(text, int) to service_role;
    grant execute on function public.admin_revoke(text) to service_role;
    grant execute on function public.admin_unbind(text) to service_role;
  end if;
end $$;
