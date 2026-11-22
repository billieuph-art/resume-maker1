#!/usr/bin/env node
// 用法: node tools/gen-codes.js 100 > codes.txt
// 生成的激活码可以批量导入闲鱼/面包多的「自动发货」卡密库
const crypto = require("crypto");

const SALT = "jlkz-2026-change-me";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function checksum(body) {
  const hex = crypto.createHash("sha256").update(SALT + body).digest("hex");
  let out = "";
  for (let i = 0; i < 4; i++) out += ALPHABET[parseInt(hex.substr(i * 2, 2), 16) % ALPHABET.length];
  return out;
}

function makeCode() {
  let body = "";
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) body += ALPHABET[bytes[i] % ALPHABET.length];
  return `${body.slice(0, 4)}-${body.slice(4)}-${checksum(body)}`;
}

const n = parseInt(process.argv[2] || "20", 10);
for (let i = 0; i < n; i++) console.log(makeCode());
