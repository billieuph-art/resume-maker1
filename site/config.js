// 上线前只需改这个文件
window.APP_CONFIG = {
  siteName: "简历快做",
  price: "9.9",
  // 买家付款后拿激活码的地方：闲鱼 / 小红书 / 面包多 / 爱发电 商品链接
  buyUrl: "https://www.goofish.com/",
  buyHint: "在闲鱼搜索「简历快做 激活码」，付款后自动发货",
  // 收款二维码图片（放到同目录，例如 pay.png），留空则不显示
  payQrImage: "",
  // 必须与 tools/gen-codes.js 里的 SALT 一致；改了之后旧码全部失效
  salt: "jlkz-2026-change-me",
};
