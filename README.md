# 简历快做

免费在线简历生成器：多套模板、实时预览、下载 PDF / 保存图片，手机和微信内都能用。高级模板通过激活码付费解锁。

- `site/`：网站本体（纯静态，可直接部署）
- `site/config.js`：价格、购买链接、收款码、激活码 salt
- `tools/gen-codes.js`：批量生成激活码，`node tools/gen-codes.js 500 > codes.txt`（SALT 要和 `config.js` 一致）
- `promo/推广素材.md`：闲鱼商品文案、小红书笔记选题、推广节奏
