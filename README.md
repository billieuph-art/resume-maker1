# 简历快做

免费在线简历生成器：多套模板、实时预览、下载 PDF / 保存图片，手机和微信内都能用。高级模板通过激活码付费解锁。

- `site/`：网站本体（纯静态，可直接部署）
- `site/config.js`：价格、购买链接、收款码、Supabase 地址和公开 key
- `supabase/setup.sql`：激活码数据库（一码一设备），在 Supabase SQL Editor 执行一次；生成激活码用 `select * from generate_codes(500);`
- `promo/推广素材.md`：闲鱼商品文案、小红书笔记选题、推广节奏
