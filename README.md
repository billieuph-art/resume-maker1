# 简历快做

免费在线简历生成器：多套模板、实时预览、下载 PDF / 保存图片，手机和微信内都能用。高级模板通过激活码付费解锁，**一码一设备**。

线上地址：https://billieuph-art.github.io/resume-maker1/

## 目录

- `site/`：网站本体（纯静态，部署到 GitHub Pages）
- `site/config.js`：价格、购买链接、收款码、Supabase URL 和 **anon** key
- `supabase/setup.sql`：激活码数据库，在 Supabase SQL Editor 执行一次
- `admin/index.html`：激活码管理后台（本地打开，用 **service_role** key；不要部署到公开网站）
- `promo/推广素材.md`：闲鱼文案、小红书选题
- `上线配置指南.md`：从零接上数据库并开卖的步骤

## 快速开卖

按 [`上线配置指南.md`](./上线配置指南.md) 做完三步：创建 Supabase → 填购买链接 → 用管理后台生成激活码导入闲鱼。
