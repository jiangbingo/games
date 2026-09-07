/* 涂色画工坊 —— 工作台：批量图片转线稿（DoG）、参数调整、A4 批量打印。
 * 涂色引擎在 js/coloring-paint.js（经 window.ColoringPaint 注入），
 * 算法在 js/coloring-lineart.js。图片全程不出浏览器。
 */
(function () {
  "use strict";

  var MAX_EDGE = 1600;
  var ITEM_LIMIT = 40;
  var JPEG_SRC_QUALITY = 0.9;
  var REPROCESS_DEBOUNCE_MS = 300;
  var PRINT_CLEANUP_FALLBACK_MS = 8000;

  /* DoG 台阶边缘实测峰值 ≈ Δs×0.085（Δs 为边界两侧信号差，典型 0.05~0.4），
   * 中等对比（Δs≈0.13）峰值仅 ~0.011，故 t 必须压到千分位、φ 需数百 */
  var PRESETS = {
    simple: { label: "简洁 · 3-4岁", sigma: 2.0, density: 4, phi: 350 },
    standard: { label: "标准 · 4-6岁", sigma: 1.2, density: 8, phi: 300 },
    fine: { label: "精细 · 6岁+", sigma: 0.7, density: 10, phi: 260 },
  };
  var DENSITY_T_MAX = 0.022;
  var DENSITY_T_SPAN = 0.019;

  var SAMPLES = [
    {
      name: "示例·花朵",
      svg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">' +
        '<rect width="900" height="700" fill="#eef8ee"/>' +
        '<rect x="432" y="360" width="36" height="290" rx="18" fill="#4caf50"/>' +
        '<path d="M450 480 Q320 430 285 505 Q350 570 450 525 Z" fill="#81c784" stroke="#eef8ee" stroke-width="6"/>' +
        '<path d="M450 565 Q575 515 612 590 Q545 655 450 610 Z" fill="#81c784" stroke="#eef8ee" stroke-width="6"/>' +
        '<g fill="#f48fb1" stroke="#eef8ee" stroke-width="8">' +
        '<ellipse cx="450" cy="120" rx="62" ry="88"/>' +
        '<g transform="rotate(60 450 245)"><ellipse cx="450" cy="120" rx="62" ry="88"/></g>' +
        '<g transform="rotate(120 450 245)"><ellipse cx="450" cy="120" rx="62" ry="88"/></g>' +
        '<g transform="rotate(180 450 245)"><ellipse cx="450" cy="120" rx="62" ry="88"/></g>' +
        '<g transform="rotate(240 450 245)"><ellipse cx="450" cy="120" rx="62" ry="88"/></g>' +
        '<g transform="rotate(300 450 245)"><ellipse cx="450" cy="120" rx="62" ry="88"/></g>' +
        "</g>" +
        '<circle cx="450" cy="245" r="80" fill="#ffb300"/>' +
        '<circle cx="450" cy="245" r="34" fill="#ff8a65"/>' +
        "</svg>",
    },
    {
      name: "示例·小鱼",
      svg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">' +
        '<rect width="900" height="700" fill="#e3f2fd"/>' +
        '<path d="M120 640 C100 560 160 520 130 440" stroke="#66bb6a" stroke-width="18" fill="none" stroke-linecap="round"/>' +
        '<path d="M780 640 C800 560 740 520 770 440" stroke="#66bb6a" stroke-width="18" fill="none" stroke-linecap="round"/>' +
        '<path d="M0 600 Q225 565 450 600 T900 600 L900 700 L0 700 Z" fill="#ffcc80"/>' +
        '<path d="M660 330 L845 205 L845 455 Z" fill="#ffb74d"/>' +
        '<path d="M400 175 Q475 85 565 162 Z" fill="#ffb74d"/>' +
        '<path d="M420 487 Q475 562 565 492 Z" fill="#ffb74d"/>' +
        '<ellipse cx="430" cy="330" rx="270" ry="172" fill="#4fc3f7"/>' +
        '<path d="M330 185 Q362 330 330 475" stroke="#0288d1" stroke-width="26" fill="none" stroke-linecap="round"/>' +
        '<path d="M440 172 Q472 330 440 488" stroke="#0288d1" stroke-width="26" fill="none" stroke-linecap="round"/>' +
        '<circle cx="250" cy="290" r="46" fill="#ffffff"/>' +
        '<circle cx="262" cy="292" r="20" fill="#37474f"/>' +
        '<path d="M168 372 Q205 398 242 380" stroke="#0288d1" stroke-width="14" fill="none" stroke-linecap="round"/>' +
        '<circle cx="120" cy="180" r="26" fill="#ffffff"/>' +
        '<circle cx="172" cy="108" r="16" fill="#ffffff"/>' +
        '<circle cx="90" cy="98" r="12" fill="#ffffff"/>' +
        "</svg>",
    },
    {
      name: "示例·小汽车",
      svg:
        '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">' +
        '<rect width="900" height="700" fill="#fff8e1"/>' +
        '<rect y="560" width="900" height="140" fill="#b0bec5"/>' +
        '<path d="M240 300 L290 210 Q300 190 325 190 L560 190 Q585 190 595 210 L645 300 Z" fill="#ef5350" stroke="#fff8e1" stroke-width="8"/>' +
        '<path d="M320 220 L300 290 L430 290 L430 220 Z" fill="#90caf9"/>' +
        '<path d="M470 220 L470 290 L600 290 L580 220 Z" fill="#90caf9"/>' +
        '<path d="M120 480 L150 340 Q165 300 210 300 L660 300 Q700 300 730 340 L770 480 Z" fill="#ef5350"/>' +
        '<circle cx="150" cy="430" r="26" fill="#ffee58"/>' +
        '<circle cx="740" cy="430" r="26" fill="#ffee58"/>' +
        '<circle cx="270" cy="490" r="80" fill="#37474f"/>' +
        '<circle cx="270" cy="490" r="34" fill="#cfd8dc"/>' +
        '<circle cx="630" cy="490" r="80" fill="#37474f"/>' +
        '<circle cx="630" cy="490" r="34" fill="#cfd8dc"/>' +
        "</svg>",
    },
  ];

  var state = {
    items: [],
    sigma: PRESETS.standard.sigma,
    density: PRESETS.standard.density,
    phi: PRESETS.standard.phi,
    printPerPage: 1,
    printLabel: false,
    gen: 0,
  };

  var dom = {};

  /* ---------- 小工具（部分经 window.CS 共享给涂色引擎） ---------- */
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function debounce(fn, ms) {
    var timer = null;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }
  function nextFrame() { return new Promise(function (r) { requestAnimationFrame(function () { r(); }); }); }
  function toast(msg) {
    var t = dom.toast;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }
  function hexToRgb(hex) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }
  function loadImg(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error("图片解码失败")); };
      img.src = src;
    });
  }
  function imgToCanvas(img, maxEdge) {
    var scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    var c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.naturalWidth * scale));
    c.height = Math.max(1, Math.round(img.naturalHeight * scale));
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c;
  }
  function fileToCanvas(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("无法解码该图片")); };
      img.src = url;
    }).then(function (img) { return imgToCanvas(img, MAX_EDGE); });
  }
  function triggerDownload(dataURL, filename) {
    var a = document.createElement("a");
    a.href = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  function densityToT(density) {
    return DENSITY_T_MAX - ((density - 1) / 9) * DENSITY_T_SPAN;
  }

  /* ---------- 批量管线 ---------- */
  function addFiles(fileList) {
    var files = Array.prototype.slice.call(fileList).filter(function (f) { return /^image\//.test(f.type); });
    var skipped = fileList.length - files.length;
    if (skipped > 0) toast("已跳过 " + skipped + " 个非图片文件");
    if (!files.length) return;
    if (state.items.length + files.length > ITEM_LIMIT) {
      files = files.slice(0, ITEM_LIMIT - state.items.length);
      toast("最多同时处理 " + ITEM_LIMIT + " 张");
    }
    files.forEach(function (f) {
      fileToCanvas(f)
        .then(function (canvas) {
          if (state.items.length >= ITEM_LIMIT) {
            toast("最多同时处理 " + ITEM_LIMIT + " 张，已忽略多余的图片");
            return;
          }
          state.items.push({
            id: uid(),
            name: f.name.replace(/\.[^.]+$/, "").slice(0, 24) || "图片",
            srcFull: canvas.toDataURL("image/jpeg", JPEG_SRC_QUALITY),
            w: canvas.width,
            h: canvas.height,
            lineURL: null,
            status: "pending",
            checked: true,
          });
          renderGrid();
          updateSummary();
          reprocessSoon();
        })
        .catch(function () {
          toast("「" + f.name + "」无法解码（HEIC 请先转 JPG/PNG）");
        });
    });
  }

  function addCanvasAsItem(name, canvas) {
    state.items.push({
      id: uid(),
      name: name,
      srcFull: canvas.toDataURL("image/jpeg", JPEG_SRC_QUALITY),
      w: canvas.width,
      h: canvas.height,
      lineURL: null,
      status: "pending",
      checked: true,
    });
  }

  var reprocessSoon = debounce(function () { reprocessAll(); }, REPROCESS_DEBOUNCE_MS);

  async function reprocessAll() {
    state.gen++;
    var gen = state.gen;
    var params = { sigma: state.sigma, t: densityToT(state.density), phi: state.phi };
    var todo = state.items.filter(function (it) { return it.status !== "failed"; });
    var doneCount = 0;
    for (var i = 0; i < todo.length; i++) {
      if (gen !== state.gen) return;
      var it = todo[i];
      it.status = "processing";
      renderCard(it);
      updateSummary(todo.length - doneCount);
      try {
        var img = await loadImg(it.srcFull);
        var c = imgToCanvas(img, MAX_EDGE);
        var lines = ColoringLineart.extractLines(c, params);
        var lc = document.createElement("canvas");
        lc.width = c.width;
        lc.height = c.height;
        lc.getContext("2d").putImageData(lines, 0, 0);
        var lineURL = lc.toDataURL("image/png");
        if (gen !== state.gen) return;
        it.w = c.width;
        it.h = c.height;
        it.lineURL = lineURL;
        it.status = "done";
      } catch (e) {
        it.status = "failed";
      }
      doneCount++;
      renderCard(it);
      updateSummary();
      await nextFrame();
    }
  }

  /* ---------- 工作台渲染 ---------- */
  function renderGrid() {
    dom.grid.innerHTML = "";
    state.items.forEach(function (it) { dom.grid.appendChild(buildCard(it)); });
    dom.studio.classList.toggle("has-items", state.items.length > 0);
  }

  function renderCard(item) {
    var old = dom.grid.querySelector('[data-id="' + item.id + '"]');
    if (old) dom.grid.replaceChild(buildCard(item), old);
    else renderGrid();
  }

  function buildCard(it) {
    var card = el("article", "card" + (it.status === "processing" ? " busy" : ""));
    card.dataset.id = it.id;

    var thumb = el("div", "thumb");
    var img = el("img");
    img.alt = it.name;
    img.src = it.lineURL || it.srcFull;
    if (!it.lineURL) img.classList.add("raw");
    thumb.appendChild(img);
    if (it.status === "processing") thumb.appendChild(el("span", "badge", "转换中…"));
    else if (it.status === "failed") thumb.appendChild(el("span", "badge bad", "失败"));
    else if (it.status === "pending") thumb.appendChild(el("span", "badge", "排队中"));
    card.appendChild(thumb);

    card.appendChild(el("div", "card-name", it.name));

    var actions = el("div", "card-actions");
    var check = el("label", "chip check");
    var box = document.createElement("input");
    box.type = "checkbox";
    box.checked = it.checked;
    box.disabled = it.status !== "done";
    check.appendChild(box);
    check.appendChild(document.createTextNode("打印"));
    actions.appendChild(check);
    if (it.status === "done") {
      var paintBtn = el("button", "chip primary", "🖍 涂色");
      paintBtn.dataset.action = "paint";
      actions.appendChild(paintBtn);
      var dl = el("button", "chip", "⬇️");
      dl.dataset.action = "download";
      actions.appendChild(dl);
    }
    var del = el("button", "chip danger", "🗑");
    del.dataset.action = "remove";
    actions.appendChild(del);
    card.appendChild(actions);
    return card;
  }

  function updateSummary(remaining) {
    var done = state.items.filter(function (i) { return i.status === "done"; }).length;
    var checked = state.items.filter(function (i) { return i.status === "done" && i.checked; }).length;
    var parts = [];
    if (state.items.length) parts.push("已转换 " + done + "/" + state.items.length + " 张");
    if (remaining) parts.push("正在处理 " + remaining + " 张");
    if (checked) parts.push("选中打印 " + checked + " 张");
    dom.summary.textContent = parts.join(" · ");
    dom.printBtn.disabled = checked === 0;
    dom.printBtn.textContent = "🖨 打印选中的 " + checked + " 张";
  }

  function onGridClick(e) {
    var btn = e.target.closest("[data-action]");
    var card = e.target.closest(".card");
    if (!card) return;
    var it = state.items.filter(function (i) { return i.id === card.dataset.id; })[0];
    if (!it || !btn) return;
    if (btn.dataset.action === "paint") ColoringPaint.open(it);
    if (btn.dataset.action === "download") triggerDownload(it.lineURL, it.name + "-线稿.png");
    if (btn.dataset.action === "remove") {
      state.items = state.items.filter(function (i) { return i !== it; });
      renderGrid();
      updateSummary();
    }
  }

  function onGridChange(e) {
    var card = e.target.closest(".card");
    if (!card || e.target.type !== "checkbox") return;
    var it = state.items.filter(function (i) { return i.id === card.dataset.id; })[0];
    if (it) it.checked = e.target.checked;
    updateSummary();
  }

  /* ---------- 打印 ---------- */
  function isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  async function printURLs(urls, perPage, withLabel) {
    /* 顺序预解码，避免大批量时 40 张位图同时存活 */
    for (var u = 0; u < urls.length; u++) {
      try {
        await loadImg(urls[u]);
      } catch (e) {
        toast("有图片加载失败，无法打印");
        return;
      }
    }
    var area = dom.printArea;
    area.innerHTML = "";
    for (var i = 0; i < urls.length; i += perPage) {
      var sheet = el("div", "sheet s" + perPage);
      if (withLabel) sheet.appendChild(el("div", "namebar", "姓名：____________　日期：____________"));
      for (var k = i; k < Math.min(i + perPage, urls.length); k++) {
        var cell = el("div", "cell");
        var img = el("img");
        img.src = urls[k];
        cell.appendChild(img);
        sheet.appendChild(cell);
      }
      area.appendChild(sheet);
    }
    document.body.classList.add("is-printing");
    /* iOS PWA standalone 下 window.print() 是 no-op 且不触发 afterprint，
     * 兜底定时器保证 is-printing 不会把界面永久藏成白屏 */
    var cleaned = false;
    var fallbackTimer = null;
    var cleanup = function () {
      if (cleaned) return;
      cleaned = true;
      clearTimeout(fallbackTimer);
      document.body.classList.remove("is-printing");
      area.innerHTML = "";
      window.removeEventListener("afterprint", cleanup);
    };
    fallbackTimer = setTimeout(cleanup, PRINT_CLEANUP_FALLBACK_MS);
    window.addEventListener("afterprint", cleanup);
    if (isStandalone()) toast("如未弹出打印窗口，请用 Safari 打开本页再打印");
    window.print();
  }

  function printSelection() {
    var urls = state.items
      .filter(function (i) { return i.status === "done" && i.checked && i.lineURL; })
      .map(function (i) { return i.lineURL; });
    if (!urls.length) return;
    printURLs(urls, state.printPerPage, state.printLabel);
  }

  function downloadAll() {
    var items = state.items.filter(function (i) { return i.status === "done" && i.lineURL; });
    if (!items.length) {
      toast("还没有转换好的线稿");
      return;
    }
    toast("开始下载 " + items.length + " 张线稿…（若浏览器拦截，请逐张下载）");
    items.forEach(function (it, i) {
      setTimeout(function () { triggerDownload(it.lineURL, it.name + "-线稿.png"); }, i * 350);
    });
  }

  /* ---------- 视图切换 ---------- */
  function showView(name) {
    dom.studio.hidden = name !== "studio";
    document.getElementById("colorView").hidden = name !== "color";
    document.getElementById("galleryView").hidden = name !== "gallery";
    document.body.classList.toggle("coloring", name === "color");
  }

  /* ---------- 工作台控件 ---------- */
  function applyPreset(key) {
    var p = PRESETS[key];
    if (!p) return;
    state.sigma = p.sigma;
    state.density = p.density;
    state.phi = p.phi;
    dom.sigmaInput.value = p.sigma;
    dom.densityInput.value = p.density;
    $all(".preset-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.preset === key); });
    reprocessSoon();
  }

  function wireStudio() {
    dom.fileInput.addEventListener("change", function () {
      addFiles(dom.fileInput.files);
      dom.fileInput.value = "";
    });
    ["dragover", "dragenter"].forEach(function (evt) {
      dom.dropzone.addEventListener(evt, function (e) {
        e.preventDefault();
        dom.dropzone.classList.add("drag");
      });
    });
    ["dragleave", "drop"].forEach(function (evt) {
      dom.dropzone.addEventListener(evt, function (e) {
        e.preventDefault();
        dom.dropzone.classList.remove("drag");
        if (evt === "drop") addFiles(e.dataTransfer.files);
      });
    });
    dom.dropzone.addEventListener("click", function () { dom.fileInput.click(); });

    dom.samplesBox.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-sample]");
      if (!btn) return;
      var sample = SAMPLES[Number(btn.dataset.sample)];
      loadImg("data:image/svg+xml;charset=utf-8," + encodeURIComponent(sample.svg)).then(function (img) {
        addCanvasAsItem(sample.name, imgToCanvas(img, MAX_EDGE));
        renderGrid();
        updateSummary();
        reprocessSoon();
      });
    });

    $all(".preset-btn").forEach(function (b) {
      b.addEventListener("click", function () { applyPreset(b.dataset.preset); });
    });
    dom.sigmaInput.addEventListener("input", function () {
      state.sigma = Number(dom.sigmaInput.value);
      reprocessSoon();
    });
    dom.densityInput.addEventListener("input", function () {
      state.density = Number(dom.densityInput.value);
      reprocessSoon();
    });

    $all(".perpage-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        state.printPerPage = Number(b.dataset.perpage);
        $all(".perpage-btn").forEach(function (x) { x.classList.toggle("active", x === b); });
      });
    });
    dom.labelCheck.addEventListener("change", function () {
      state.printLabel = dom.labelCheck.checked;
    });
    dom.printBtn.addEventListener("click", printSelection);
    dom.downloadAllBtn.addEventListener("click", downloadAll);

    dom.grid.addEventListener("click", onGridClick);
    dom.grid.addEventListener("change", onGridChange);
  }

  function cacheDom() {
    dom.studio = $("#studio");
    dom.grid = $("#grid");
    dom.summary = $("#summary");
    dom.dropzone = $("#dropzone");
    dom.fileInput = $("#fileInput");
    dom.samplesBox = $("#samples");
    dom.sigmaInput = $("#sigmaInput");
    dom.densityInput = $("#densityInput");
    dom.printBtn = $("#printBtn");
    dom.downloadAllBtn = $("#downloadAllBtn");
    dom.labelCheck = $("#labelCheck");
    dom.printArea = $("#printArea");
    dom.toast = $("#toast");
  }

  function init() {
    cacheDom();
    wireStudio();
    ColoringPaint.init({
      toast: toast,
      loadImg: loadImg,
      hexToRgb: hexToRgb,
      showView: showView,
      printURLs: printURLs,
      triggerDownload: triggerDownload,
      el: el,
      uid: uid,
    });
    updateSummary();
    applyPreset("standard");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
