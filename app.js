(() => {
  const CFG = window.APP_CONFIG;
  const STORE_KEY = "jlkz_resume_v1";
  const PRO_KEY = "jlkz_pro_code_v2";
  const DEVICE_KEY = "jlkz_device_v1";

  const TEMPLATES = [
    { id: "classic", name: "经典", pro: false },
    { id: "simple", name: "简约", pro: false },
    { id: "twocol", name: "双栏", pro: false },
    { id: "business", name: "商务", pro: true },
    { id: "creative", name: "创意", pro: true },
    { id: "elegant", name: "精英", pro: true },
    { id: "timeline", name: "时间轴", pro: true },
  ];
  const COLORS = ["#2563eb", "#0f766e", "#7c3aed", "#be123c", "#c2410c", "#334155"];

  const LIST_FIELDS = {
    education: [["school", "学校"], ["major", "专业 / 学历"], ["start", "开始时间"], ["end", "结束时间"], ["desc", "主修课程、GPA、在校经历（可选）", true]],
    work: [["company", "公司"], ["role", "职位"], ["start", "开始时间"], ["end", "结束时间"], ["desc", "工作内容和成果，每行一条，尽量写数字", true]],
    projects: [["name", "项目名称"], ["role", "担任角色"], ["start", "开始时间"], ["end", "结束时间"], ["desc", "项目背景、你做了什么、结果如何", true]],
  };

  const empty = () => ({
    template: "classic", color: COLORS[0], photo: "",
    name: "", title: "", phone: "", email: "", city: "", extra: "", summary: "",
    education: [{}], work: [{}], projects: [], skills: "", awards: "",
  });

  const SAMPLE = {
    template: "classic", color: COLORS[0], photo: "",
    name: "李明", title: "新媒体运营专员", phone: "138 0000 0000", email: "liming@example.com",
    city: "杭州", extra: "2 年经验",
    summary: "2 年新媒体运营经验，独立运营过 10 万粉丝的小红书账号；擅长选题策划和数据复盘，单篇笔记最高 5 万点赞。",
    education: [{ school: "浙江工商大学", major: "市场营销 · 本科", start: "2018.09", end: "2022.06", desc: "GPA 3.6/4.0，校学生会宣传部部长" }],
    work: [
      { company: "杭州某电商公司", role: "新媒体运营", start: "2022.07", end: "至今", desc: "负责品牌小红书、抖音账号日常运营，粉丝从 8000 涨到 10.2 万\n建立选题库和数据周报机制，笔记平均互动率提升 65%\n策划 618 种草活动，带来站外引流成交 32 万元" },
      { company: "某 MCN 机构", role: "运营实习生", start: "2021.07", end: "2021.12", desc: "协助 5 位达人内容排期，整理竞品数据报告 20 余份" },
    ],
    projects: [{ name: "品牌双 11 内容营销", role: "项目负责人", start: "2023.10", end: "2023.11", desc: "统筹 30 位 KOC 投放，总曝光 800 万，ROI 达到 1:4.2" }],
    skills: "熟练使用剪映、醒图、Canva 制作图文视频\n熟悉小红书、抖音推荐机制和投流工具\n熟练使用 Excel 数据透视表做数据分析",
    awards: "CET-6（562 分）\n2023 年度公司优秀员工",
  };

  let state = load();
  let pro = !!localStorage.getItem(PRO_KEY);

  function load() {
    try { return Object.assign(empty(), JSON.parse(localStorage.getItem(STORE_KEY)) || {}); }
    catch { return empty(); }
  }
  function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const lines = (s) => String(s || "").split("\n").map((x) => x.trim()).filter(Boolean);

  // ---------- 编辑器 ----------
  function bindSimpleFields() {
    $$("[data-k]").forEach((el) => {
      el.value = state[el.dataset.k] || "";
      el.oninput = () => { state[el.dataset.k] = el.value; update(); };
    });
    const box = $("#photoBox");
    box.style.backgroundImage = state.photo ? `url(${state.photo})` : "";
    box.classList.toggle("has", !!state.photo);
  }

  function renderLists() {
    Object.keys(LIST_FIELDS).forEach((key) => {
      const wrap = $(`[data-list="${key}"] .items`);
      wrap.innerHTML = "";
      state[key].forEach((item, idx) => {
        const div = document.createElement("div");
        div.className = "item";
        const fields = LIST_FIELDS[key];
        div.innerHTML = `<button class="del" title="删除">删除</button><div class="grid2">${
          fields.filter((f) => !f[2]).map(([k, p]) => `<input data-f="${k}" placeholder="${p}" value="${esc(item[k])}">`).join("")
        }</div>${fields.filter((f) => f[2]).map(([k, p]) => `<textarea data-f="${k}" rows="3" placeholder="${p}">${esc(item[k])}</textarea>`).join("")}`;
        $$("[data-f]", div).forEach((el) => {
          el.oninput = () => { state[key][idx][el.dataset.f] = el.value; update(); };
        });
        $(".del", div).onclick = () => { state[key].splice(idx, 1); renderLists(); update(); };
        wrap.appendChild(div);
      });
    });
  }

  function renderPickers() {
    $("#templates").innerHTML = TEMPLATES.map((t) =>
      `<button class="tpl ${state.template === t.id ? "active" : ""}" data-t="${t.id}">${t.name}${t.pro && !pro ? '<span class="badge">高级</span>' : ""}</button>`
    ).join("");
    $$(".tpl").forEach((b) => (b.onclick = () => { state.template = b.dataset.t; renderPickers(); update(); }));

    $("#colors").innerHTML = COLORS.map((c) => `<button class="color ${state.color === c ? "active" : ""}" data-c="${c}" style="background:${c}"></button>`).join("");
    $$(".color").forEach((b) => (b.onclick = () => { state.color = b.dataset.c; renderPickers(); update(); }));

    $("#proStatus").innerHTML = pro
      ? `已解锁全部高级模板<span class="pro-code">（${esc(formatCodeInput(localStorage.getItem(PRO_KEY) || ""))}）</span> · <a id="logoutPro">退出激活</a>`
      : `带「高级」标记的模板可以免费预览，导出前需要解锁。<a id="openPay">¥${CFG.price} 解锁全部</a>`;
    const op = $("#openPay");
    if (op) op.onclick = openPay;
    const lo = $("#logoutPro");
    if (lo) lo.onclick = () => {
      if (!confirm("只是退出本机的激活状态，不会作废激活码。同一台设备可以再次输入激活码。确定退出吗？")) return;
      localStorage.removeItem(PRO_KEY);
      pro = false;
      renderPickers(); update();
      toast("已退出激活");
    };
  }

  // ---------- 简历渲染 ----------
  function contactHtml(s) {
    return `<div class="contact">${[s.phone, s.email, s.city, s.extra].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join("")}</div>`;
  }
  function photoHtml(s) { return s.photo ? `<img class="photo" src="${s.photo}" alt="">` : ""; }
  function entry(title, sub, start, end, desc) {
    const date = [start, end].filter(Boolean).join(" - ");
    const d = lines(desc);
    return `<div class="row"><span>${esc(title)}${sub ? ` <span class="sub">｜${esc(sub)}</span>` : ""}</span><span class="date">${esc(date)}</span></div>${
      d.length > 1 ? `<ul class="desc">${d.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : d.length ? `<div class="desc">${esc(d[0])}</div>` : ""}`;
  }
  const sec = (title, inner) => (inner ? `<div class="sec"><div class="sec-title">${title}</div>${inner}</div>` : "");
  const filled = (arr, k) => arr.filter((x) => Object.values(x).some((v) => String(v || "").trim()));

  function sections(s, { skipSkills = false } = {}) {
    const ul = (t) => (lines(t).length ? `<ul>${lines(t).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
    return [
      sec("个人简介", s.summary ? `<div class="desc">${esc(s.summary)}</div>` : ""),
      sec("工作经历", filled(s.work).map((w) => entry(w.company, w.role, w.start, w.end, w.desc)).join("")),
      sec("项目经历", filled(s.projects).map((p) => entry(p.name, p.role, p.start, p.end, p.desc)).join("")),
      sec("教育经历", filled(s.education).map((e) => entry(e.school, e.major, e.start, e.end, e.desc)).join("")),
      skipSkills ? "" : sec("专业技能", ul(s.skills)),
      skipSkills ? "" : sec("证书荣誉", ul(s.awards)),
    ].join("");
  }
  function sideSkills(s) {
    const ul = (t) => (lines(t).length ? `<ul>${lines(t).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
    return sec("专业技能", ul(s.skills)) + sec("证书荣誉", ul(s.awards));
  }

  function renderResume(s) {
    const name = `<h1>${esc(s.name || "你的姓名")}</h1>${s.title ? `<div class="job">${esc(s.title)}</div>` : ""}`;
    switch (s.template) {
      case "twocol":
      case "creative":
        return `<div class="r t-${s.template}"><div class="side">${photoHtml(s)}${name}${contactHtml(s)}${sideSkills(s)}</div><div class="main">${sections(s, { skipSkills: true })}</div></div>`;
      case "business":
        return `<div class="r t-business"><div class="banner head"><div>${name}${contactHtml(s)}</div>${photoHtml(s)}</div><div class="body">${sections(s)}</div></div>`;
      default:
        return `<div class="r t-${s.template}"><div class="head"><div>${name}${contactHtml(s)}</div>${photoHtml(s)}</div>${sections(s)}</div>`;
    }
  }

  function softColor(hex) {
    const n = parseInt(hex.slice(1), 16);
    const mix = (c) => Math.round(c * 0.12 + 255 * 0.88);
    return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
  }

  const isProTpl = () => TEMPLATES.find((t) => t.id === state.template)?.pro;

  function update() {
    save();
    const paper = $("#paper");
    paper.style.setProperty("--accent", state.color);
    paper.style.setProperty("--accent-soft", softColor(state.color));
    paper.innerHTML = renderResume(state) +
      (isProTpl() && !pro ? `<div class="watermark">${`<span>${esc(CFG.siteName)} 预览</span>`.repeat(15)}</div>` : "");
  }

  // ---------- 激活码 ----------
  function deviceId() {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      id = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  }

  async function callRpc(fn, code) {
    if (!CFG.supabaseUrl || !CFG.supabaseKey) throw new Error("not_configured");
    const res = await fetch(`${CFG.supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: CFG.supabaseKey },
      body: JSON.stringify({ p_code: code, p_device: deviceId() }),
    });
    if (!res.ok) throw new Error("http_" + res.status);
    return res.json();
  }

  const normalizeCode = (raw) => raw.toUpperCase().replace(/[^A-Z0-9]/g, "");

  async function redeem(raw) {
    const code = normalizeCode(raw);
    if (code.length !== 12) return { ok: false, reason: "invalid" };
    try { return await callRpc("redeem_code", code); }
    catch (e) { return { ok: false, reason: e.message === "not_configured" ? "not_configured" : "network" }; }
  }

  // 已激活的设备每次打开页面复查一次；网络出错时保留激活状态，只有服务器明确说无效才取消
  async function recheck() {
    const code = localStorage.getItem(PRO_KEY);
    if (!code) return;
    try {
      const r = await callRpc("check_code", code);
      if (r && r.ok === false) {
        localStorage.removeItem(PRO_KEY);
        pro = false;
        renderPickers(); update();
      }
    } catch {}
  }

  const REDEEM_ERRORS = {
    invalid: "激活码无效，请检查后重试。",
    used: "这个激活码已经在其他设备上使用过了。一个激活码只能激活一台设备。",
    network: "网络异常，请稍后重试。",
    not_configured: "激活系统还没配置好，请联系卖家。",
    bad_device: "浏览器异常，请刷新页面后重试。",
  };

  function openPay() { $("#payModal").hidden = false; $("#codeMsg").textContent = ""; }
  function closePay() { $("#payModal").hidden = true; }

  function formatCodeInput(raw) {
    const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    return s.replace(/(.{4})(?=.)/g, "$1-");
  }

  function initPay() {
    $("#price").textContent = CFG.price;
    $("#buyLink").href = CFG.buyUrl;
    $("#buyHint").textContent = CFG.buyHint;
    if (CFG.payQrImage) { $("#payQr").src = CFG.payQrImage; $("#payQr").hidden = false; }
    $("#payClose").onclick = closePay;
    $("#payModal").onclick = (e) => { if (e.target.id === "payModal") closePay(); };
    const codeInput = $("#codeInput");
    codeInput.oninput = () => {
      const start = codeInput.selectionStart;
      const before = codeInput.value;
      codeInput.value = formatCodeInput(before);
      // 尽量保持光标位置，避免每敲一个字就跳到末尾
      const diff = codeInput.value.length - before.length;
      const pos = Math.max(0, (start || 0) + diff);
      codeInput.setSelectionRange(pos, pos);
    };
    codeInput.onkeydown = (e) => { if (e.key === "Enter") $("#codeBtn").click(); };
    $("#codeBtn").onclick = async () => {
      const msg = $("#codeMsg");
      const btn = $("#codeBtn");
      if (btn.disabled) return;
      btn.disabled = true;
      msg.style.color = "#64748b";
      msg.textContent = "正在验证…";
      const r = await redeem($("#codeInput").value);
      btn.disabled = false;
      if (r.ok) {
        pro = true;
        localStorage.setItem(PRO_KEY, normalizeCode($("#codeInput").value));
        msg.style.color = "#16a34a";
        msg.textContent = "激活成功！全部高级模板已解锁。";
        renderPickers(); update();
        setTimeout(closePay, 1200);
      } else {
        msg.style.color = "#ef4444";
        msg.textContent = REDEEM_ERRORS[r.reason] || REDEEM_ERRORS.invalid;
      }
    };
  }

  // ---------- 顶部按钮 ----------
  function initTop() {
    document.title = `${CFG.siteName} - 免费在线简历生成器，3 分钟做出专业简历`;
    $("#siteName").textContent = CFG.siteName;
    $("#btnSample").onclick = () => {
      if (state.name && !confirm("会覆盖当前内容，确定吗？")) return;
      state = Object.assign(empty(), JSON.parse(JSON.stringify(SAMPLE)), { template: state.template, color: state.color });
      refreshAll();
    };
    $("#btnClear").onclick = () => {
      if (!confirm("确定清空全部内容吗？")) return;
      state = Object.assign(empty(), { template: state.template, color: state.color });
      refreshAll();
    };
    $("#btnExport").onclick = () => guarded(exportPdf);
    $("#btnImage").onclick = () => guarded(exportImage);
    $("#imgClose").onclick = () => ($("#imgModal").hidden = true);
    const fab = $("#fab");
    const previewVisible = () => $(".preview-wrap").getBoundingClientRect().top < innerHeight * 0.5;
    fab.onclick = () => {
      if (previewVisible()) return scrollTo({ top: 0, behavior: "smooth" });
      const top = $(".preview-wrap").getBoundingClientRect().top + scrollY - $(".topbar").offsetHeight;
      scrollTo({ top, behavior: "smooth" });
    };
    addEventListener("scroll", () => { fab.textContent = previewVisible() ? "回编辑" : "看预览"; }, { passive: true });
    $$("[data-add]").forEach((b) => (b.onclick = () => { state[b.dataset.add].push({}); renderLists(); update(); }));
    $("#photoInput").onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        const scale = Math.min(1, 400 / img.width);
        c.width = img.width * scale; c.height = img.height * scale;
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        state.photo = c.toDataURL("image/jpeg", 0.85);
        URL.revokeObjectURL(img.src);
        bindSimpleFields(); update();
      };
      img.src = URL.createObjectURL(f);
    };
  }

  // ---------- 导出 ----------
  const inApp = /MicroMessenger|QQ\/|Weibo|xhsdiscover|DingTalk/i.test(navigator.userAgent);
  const fileBase = () => `${state.name || "我的"}简历${state.title ? "-" + state.title : ""}`;
  let busy = false;

  function toast(msg, ms = 2500) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.timer);
    if (ms) toast.timer = setTimeout(() => (t.hidden = true), ms);
  }

  async function guarded(fn) {
    if (isProTpl() && !pro) return openPay();
    if (busy) return;
    busy = true;
    toast("正在生成，请稍候…", 0);
    try { await fn(); }
    catch (e) { console.error(e); toast("生成失败，请刷新页面后重试"); }
    finally { busy = false; }
  }

  // 在屏幕外按原始 A4 尺寸重新渲染一份，避免手机端缩放影响清晰度
  async function renderCanvas() {
    const stage = document.createElement("div");
    stage.className = "export-stage";
    const paper = $("#paper").cloneNode(true);
    paper.removeAttribute("id");
    stage.appendChild(paper);
    document.body.appendChild(stage);
    try {
      await document.fonts?.ready;
      return await html2canvas(paper, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
    } finally {
      stage.remove();
    }
  }

  async function exportPdf() {
    if (inApp) {
      $("#toast").hidden = true;
      toast("微信/小红书里不能直接下载文件：请点右上角「···」选择「在浏览器打开」，或者先用「保存图片」", 6000);
      return;
    }
    const canvas = await renderCanvas();
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
    const pageW = 210, pageH = 297;
    const pagePx = Math.floor(canvas.width * (pageH / pageW));
    const pages = Math.max(1, Math.ceil((canvas.height - 4) / pagePx));
    for (let i = 0; i < pages; i++) {
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = Math.min(pagePx, canvas.height - i * pagePx);
      const ctx = slice.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, -i * pagePx);
      if (i) pdf.addPage();
      pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageW, (slice.height / canvas.width) * pageW);
    }
    pdf.save(`${fileBase()}.pdf`);
    toast("PDF 已开始下载");
  }

  async function exportImage() {
    const canvas = await renderCanvas();
    const url = canvas.toDataURL("image/png");
    $("#imgOut").src = url;
    $("#imgDownload").href = url;
    $("#imgDownload").download = `${fileBase()}.png`;
    $("#imgDownload").hidden = inApp;
    $("#imgHint").textContent = inApp ? "长按图片，选择「保存图片」即可存到相册。" : "手机上长按图片可以保存到相册；电脑上点下面的按钮下载。";
    $("#toast").hidden = true;
    $("#imgModal").hidden = false;
  }

  function refreshAll() { bindSimpleFields(); renderLists(); renderPickers(); update(); }

  initTop();
  initPay();
  refreshAll();
  recheck();
})();
