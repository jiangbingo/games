/* 涂色画工坊 —— 涂色引擎：网页涂色（蜡笔/油漆桶/橡皮）、撤销重做、
 * 进度自动保存与断点续涂、作品相册。依赖 window.CS 共享层（coloring-studio.js 注入）
 * 与 ColoringLineart（coloring-lineart.js）。
 */
(function () {
  "use strict";

  var BRUSH_SIZES = [10, 24, 44];
  var BRUSH_REF_EDGE = 1600;
  var CRAYON_ALPHA = 0.85;
  var CRAYON_GRAIN_ALPHA = 0.08;
  var FILL_TOLERANCE_SQ = 40 * 40;
  var LEAK_RATIO = 0.95;
  var BOUNDARY_DILATE = 4;
  var UNDO_LIMIT = 15;
  var UNDO_AREA_REF = 1200 * 1200;
  var GALLERY_LIMIT = 12;
  var GALLERY_KEEP_MIN = 3;
  var AUTOSAVE_DELAY_MS = 700;
  var LS_CURRENT = "coloringStudio.current";
  var LS_GALLERY = "coloringStudio.gallery";

  var PALETTE = [
    "#e53935", "#ff7043", "#ffca28", "#8bc34a",
    "#2e7d32", "#26c6aa", "#29b6f6", "#1565c0",
    "#5c6bc0", "#ab47bc", "#ec407a", "#f48fb1",
    "#ffab91", "#a1887f", "#b0bec5", "#37474f",
  ];

  var CS = null;
  var dom = {};
  var gallery = [];
  var quotaWarned = false;
  var openToken = 0;

  var coloring = {
    item: null,
    paint: null,
    line: null,
    ctxP: null,
    lineImg: null,
    bm: null,
    tool: "crayon",
    color: PALETTE[0],
    sizeIndex: 1,
    undo: [],
    redo: [],
    drawing: false,
    activePointerId: null,
    lastX: 0,
    lastY: 0,
    pressure: 1,
    hasPainted: false,
  };

  /* ---------- 打开 / 关闭涂色 ---------- */
  function openColoring(item, opts) {
    opts = opts || {};
    var token = ++openToken;
    CS.loadImg(item.lineURL)
      .then(function (lineImg) {
        if (token !== openToken) return;
        coloring.item = item;
        coloring.lineImg = lineImg;
        coloring.undo = [];
        coloring.redo = [];
        coloring.hasPainted = false;

        coloring.paint = dom.paintCanvas;
        coloring.line = dom.lineCanvas;
        coloring.paint.width = item.w;
        coloring.paint.height = item.h;
        coloring.line.width = item.w;
        coloring.line.height = item.h;
        coloring.ctxP = coloring.paint.getContext("2d");
        coloring.ctxP.clearRect(0, 0, item.w, item.h);
        coloring.line.getContext("2d").drawImage(lineImg, 0, 0);

        var lineData = coloring.line.getContext("2d").getImageData(0, 0, item.w, item.h);
        coloring.bm = ColoringLineart.boundaryMask(lineData, BOUNDARY_DILATE);

        dom.colorTitle.textContent = item.name;
        dom.refFloatImg.src = item.srcFull || "";
        dom.refBtn.hidden = !item.srcFull;
        dom.refFloat.classList.remove("show");
        CS.showView("color");
        layoutColorStage();
        updateHistoryButtons();

        if (opts.restorePaintURL) {
          CS.loadImg(opts.restorePaintURL).then(function (pimg) {
            if (token !== openToken) return;
            coloring.ctxP.drawImage(pimg, 0, 0);
            coloring.hasPainted = true;
          });
        }
      })
      .catch(function () {
        CS.toast("线稿加载失败，请重试");
      });
  }

  function closeColoring() {
    if (coloring.hasPainted) saveCurrentWork();
    CS.showView("studio");
    checkResumeBanner();
  }

  function layoutColorStage() {
    if (!coloring.item || dom.colorView.hidden) return;
    var availW = window.innerWidth - 24;
    var availH = window.innerHeight - dom.colorTopbar.offsetHeight - dom.colorToolbar.offsetHeight - 24;
    var scale = Math.min(availW / coloring.item.w, availH / coloring.item.h);
    dom.colorStage.style.width = Math.round(coloring.item.w * scale) + "px";
    dom.colorStage.style.height = Math.round(coloring.item.h * scale) + "px";
  }

  /* ---------- 蜡笔 / 橡皮 ---------- */
  function canvasPos(e) {
    var r = coloring.paint.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (coloring.paint.width / r.width),
      y: (e.clientY - r.top) * (coloring.paint.height / r.height),
    };
  }

  function brushWidth() {
    var base = BRUSH_SIZES[coloring.sizeIndex] * Math.max(coloring.paint.width, coloring.paint.height) / BRUSH_REF_EDGE;
    var isPen = coloring.pressure > 0 && coloring.pressure < 1;
    return base * (isPen ? 0.45 + 1.1 * coloring.pressure : 1);
  }

  function drawSegment(x0, y0, x1, y1) {
    var ctx = coloring.ctxP;
    var isEraser = coloring.tool === "eraser";
    ctx.save();
    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    ctx.globalAlpha = isEraser ? 1 : CRAYON_ALPHA;
    ctx.strokeStyle = ctx.fillStyle = coloring.color;
    ctx.lineWidth = brushWidth();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    if (!isEraser) sprinkleGrain(ctx, x0, y0, x1, y1);
    ctx.restore();
  }

  function sprinkleGrain(ctx, x0, y0, x1, y1) {
    ctx.globalAlpha = CRAYON_GRAIN_ALPHA;
    var w = ctx.lineWidth;
    var steps = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (w * 0.35)));
    for (var s = 0; s < steps; s++) {
      var t = Math.random();
      var ang = Math.random() * Math.PI * 2;
      var rad = Math.random() * w * 0.55;
      ctx.beginPath();
      ctx.arc(
        x0 + (x1 - x0) * t + Math.cos(ang) * rad,
        y0 + (y1 - y0) * t + Math.sin(ang) * rad,
        w * (0.05 + Math.random() * 0.08),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  /* ---------- 油漆桶 ---------- */
  function doFill(x, y) {
    var w = coloring.paint.width, h = coloring.paint.height;
    var px = Math.round(x), py = Math.round(y);
    if (px < 0 || py < 0 || px >= w || py >= h) return;
    var data = coloring.ctxP.getImageData(0, 0, w, h);
    var count = ColoringLineart.floodFill(data, coloring.bm, px, py, CS.hexToRgb(coloring.color), FILL_TOLERANCE_SQ);
    if (!count) return;
    if (count > w * h * LEAK_RATIO) {
      CS.toast("这里涂不进去哦，换个地方试试");
      return;
    }
    pushUndo();
    coloring.ctxP.putImageData(data, 0, 0);
    coloring.hasPainted = true;
    scheduleAutosave();
  }

  /* ---------- 撤销 / 重做 ---------- */
  function undoDepth() {
    return Math.max(4, Math.round((UNDO_LIMIT * UNDO_AREA_REF) / (coloring.paint.width * coloring.paint.height)));
  }

  function pushUndo() {
    coloring.undo.push(coloring.paint.toDataURL("image/png"));
    if (coloring.undo.length > undoDepth()) coloring.undo.shift();
    coloring.redo.length = 0;
    updateHistoryButtons();
  }

  function restorePaint(url) {
    CS.loadImg(url).then(function (img) {
      coloring.ctxP.clearRect(0, 0, coloring.paint.width, coloring.paint.height);
      coloring.ctxP.drawImage(img, 0, 0);
    });
  }

  function doUndo() {
    if (!coloring.undo.length) return;
    coloring.redo.push(coloring.paint.toDataURL("image/png"));
    restorePaint(coloring.undo.pop());
    updateHistoryButtons();
    scheduleAutosave();
  }

  function doRedo() {
    if (!coloring.redo.length) return;
    coloring.undo.push(coloring.paint.toDataURL("image/png"));
    restorePaint(coloring.redo.pop());
    updateHistoryButtons();
    scheduleAutosave();
  }

  function updateHistoryButtons() {
    dom.undoBtn.disabled = !coloring.undo.length;
    dom.redoBtn.disabled = !coloring.redo.length;
  }

  function clearPaint() {
    pushUndo();
    coloring.ctxP.clearRect(0, 0, coloring.paint.width, coloring.paint.height);
    CS.toast("已清空（可撤销）");
    scheduleAutosave();
  }

  /* ---------- 导出合成（白底 + 颜色层 × 线稿） ---------- */
  function compositeDataURL(type, quality, maxEdge) {
    var scale = Math.min(1, maxEdge / Math.max(coloring.item.w, coloring.item.h));
    var w = Math.round(coloring.item.w * scale);
    var h = Math.round(coloring.item.h * scale);
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(coloring.paint, 0, 0, w, h);
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(coloring.lineImg, 0, 0, w, h);
    return c.toDataURL(type, quality);
  }

  /* ---------- 进行中作品自动保存 / 断点续涂 ---------- */
  var autosaveTimer = null;
  function scheduleAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(saveCurrentWork, AUTOSAVE_DELAY_MS);
  }

  function saveCurrentWork() {
    if (!coloring.item || !coloring.hasPainted) return;
    try {
      localStorage.setItem(LS_CURRENT, JSON.stringify({
        name: coloring.item.name,
        lineURL: coloring.item.lineURL,
        paintURL: coloring.paint.toDataURL("image/png"),
        w: coloring.item.w,
        h: coloring.item.h,
        at: Date.now(),
      }));
    } catch (e) {
      if (!quotaWarned) {
        quotaWarned = true;
        CS.toast("存储空间不足，进度无法自动保存");
      }
    }
  }

  function checkResumeBanner() {
    var data = null;
    try {
      var raw = localStorage.getItem(LS_CURRENT);
      if (raw) data = JSON.parse(raw);
    } catch (e) {
      data = null;
    }
    dom.resumeBar.hidden = !(data && data.lineURL);
    if (!data || !data.lineURL) return;
    dom.resumeName.textContent = data.name || "未命名";
    dom.resumeGo.onclick = function () {
      openColoring(
        { name: data.name, lineURL: data.lineURL, srcFull: null, w: data.w, h: data.h },
        { restorePaintURL: data.paintURL },
      );
    };
    dom.resumeDrop.onclick = function () {
      try { localStorage.removeItem(LS_CURRENT); } catch (e) { /* 忽略 */ }
      dom.resumeBar.hidden = true;
    };
  }

  /* ---------- 作品相册 ---------- */
  function loadGallery() {
    try {
      var raw = localStorage.getItem(LS_GALLERY);
      gallery = raw ? JSON.parse(raw) : [];
    } catch (e) {
      gallery = [];
    }
  }

  function persistGallery() {
    while (true) {
      try {
        localStorage.setItem(LS_GALLERY, JSON.stringify(gallery));
        return true;
      } catch (e) {
        if (gallery.length > GALLERY_KEEP_MIN) {
          gallery.pop();
          CS.toast("空间不足，已移除最旧作品");
        } else {
          CS.toast("保存失败：浏览器存储已满");
          return false;
        }
      }
    }
  }

  function saveWorkToGallery() {
    var entry = {
      id: CS.uid(),
      name: (coloring.item.name || "作品") + " · 我的涂色",
      at: Date.now(),
      full: compositeDataURL("image/jpeg", 0.86, 960),
      thumb: compositeDataURL("image/jpeg", 0.75, 260),
    };
    gallery.unshift(entry);
    if (gallery.length > GALLERY_LIMIT) {
      gallery = gallery.slice(0, GALLERY_LIMIT);
      CS.toast("相册已满，最早的作品被移除");
    }
    persistGallery();
    renderGallery();
    CS.toast("已存入「我的作品」✨");
  }

  function renderGallery() {
    dom.galleryBadge.textContent = gallery.length || "";
    dom.galleryGrid.innerHTML = "";
    if (!gallery.length) {
      dom.galleryGrid.appendChild(CS.el("p", "empty-tip", "还没有作品。去涂一幅，点「💾 存作品」吧！"));
      return;
    }
    gallery.forEach(function (work) {
      var card = CS.el("article", "work-card");
      card.dataset.id = work.id;
      var img = CS.el("img");
      img.src = work.thumb;
      img.alt = work.name;
      card.appendChild(img);
      var bar = CS.el("div", "work-bar");
      [["view", "🔍 查看"], ["download", "⬇️"], ["print", "🖨"], ["remove", "🗑"]].forEach(function (pair) {
        var b = CS.el("button", "chip", pair[1]);
        b.dataset.action = pair[0];
        bar.appendChild(b);
      });
      card.appendChild(bar);
      card.appendChild(CS.el("div", "work-name", work.name));
      dom.galleryGrid.appendChild(card);
    });
  }

  function onGalleryClick(e) {
    var btn = e.target.closest("[data-action]");
    var card = e.target.closest(".work-card");
    if (!btn || !card) return;
    var work = gallery.filter(function (w) { return w.id === card.dataset.id; })[0];
    if (!work) return;
    if (btn.dataset.action === "view") {
      dom.workModalImg.src = work.full;
      dom.workModal.showModal();
    }
    if (btn.dataset.action === "download") CS.triggerDownload(work.full, work.name + ".jpg");
    if (btn.dataset.action === "print") CS.printURLs([work.full], 1, false);
    if (btn.dataset.action === "remove") {
      gallery = gallery.filter(function (w) { return w !== work; });
      persistGallery();
      renderGallery();
    }
  }

  /* ---------- 指针输入 ---------- */
  function onPointerDown(e) {
    if (e.button > 0) return;
    /* 儿童多指/手掌误触：只认第一支落下的手指或笔 */
    if (coloring.activePointerId !== null) return;
    e.preventDefault();
    coloring.activePointerId = e.pointerId;
    dom.colorStage.setPointerCapture(e.pointerId);
    coloring.drawing = true;
    coloring.pressure = e.pointerType === "pen" && e.pressure > 0 ? e.pressure : 1;
    var p = canvasPos(e);
    coloring.lastX = p.x;
    coloring.lastY = p.y;
    if (coloring.tool === "bucket") {
      coloring.drawing = false;
      doFill(p.x, p.y);
    } else {
      pushUndo();
      coloring.hasPainted = true;
      drawSegment(p.x, p.y, p.x, p.y);
    }
  }

  function onPointerMove(e) {
    if (!coloring.drawing || e.pointerId !== coloring.activePointerId) return;
    e.preventDefault();
    coloring.pressure = e.pointerType === "pen" && e.pressure > 0 ? e.pressure : 1;
    var p = canvasPos(e);
    drawSegment(coloring.lastX, coloring.lastY, p.x, p.y);
    coloring.lastX = p.x;
    coloring.lastY = p.y;
  }

  function onPointerUp(e) {
    if (e.pointerId !== coloring.activePointerId) return;
    coloring.activePointerId = null;
    if (coloring.drawing) scheduleAutosave();
    coloring.drawing = false;
  }

  /* ---------- 事件绑定 ---------- */
  function cacheDom() {
    dom.colorView = document.getElementById("colorView");
    dom.colorStage = document.getElementById("colorStage");
    dom.paintCanvas = document.getElementById("paintCanvas");
    dom.lineCanvas = document.getElementById("lineCanvas");
    dom.colorTitle = document.getElementById("colorTitle");
    dom.colorTopbar = document.getElementById("colorTopbar");
    dom.colorToolbar = document.querySelector(".color-toolbar");
    dom.paletteBox = document.getElementById("palette");
    dom.undoBtn = document.getElementById("undoBtn");
    dom.redoBtn = document.getElementById("redoBtn");
    dom.clearBtn = document.getElementById("clearBtn");
    dom.refBtn = document.getElementById("refBtn");
    dom.refFloat = document.getElementById("refFloat");
    dom.refFloatImg = document.querySelector("#refFloat img");
    dom.saveWorkBtn = document.getElementById("saveWorkBtn");
    dom.dlWorkBtn = document.getElementById("dlWorkBtn");
    dom.colorBack = document.getElementById("colorBack");
    dom.galleryView = document.getElementById("galleryView");
    dom.galleryGrid = document.getElementById("galleryGrid");
    dom.galleryBadge = document.getElementById("galleryBadge");
    dom.galleryBack = document.getElementById("galleryBack");
    dom.galleryBtn = document.getElementById("galleryBtn");
    dom.workModal = document.getElementById("workModal");
    dom.workModalImg = document.querySelector("#workModal img");
    dom.resumeBar = document.getElementById("resumeBar");
    dom.resumeName = document.getElementById("resumeName");
    dom.resumeGo = document.getElementById("resumeGo");
    dom.resumeDrop = document.getElementById("resumeDrop");
  }

  function renderPalette() {
    PALETTE.forEach(function (hex, i) {
      var b = CS.el("button", "swatch" + (i === 0 ? " active" : ""));
      b.dataset.color = hex;
      b.style.background = hex;
      b.setAttribute("aria-label", "颜色 " + hex);
      dom.paletteBox.appendChild(b);
    });
  }

  function wireColoring() {
    dom.colorStage.addEventListener("pointerdown", onPointerDown);
    dom.colorStage.addEventListener("pointermove", onPointerMove);
    ["pointerup", "pointercancel"].forEach(function (evt) {
      dom.colorStage.addEventListener(evt, onPointerUp);
    });
    dom.colorStage.addEventListener("contextmenu", function (e) { e.preventDefault(); });

    document.querySelectorAll(".tool-btn[data-tool]").forEach(function (b) {
      b.addEventListener("click", function () {
        coloring.tool = b.dataset.tool;
        document.querySelectorAll(".tool-btn[data-tool]").forEach(function (x) { x.classList.toggle("active", x === b); });
      });
    });
    dom.paletteBox.addEventListener("click", function (e) {
      var b = e.target.closest("[data-color]");
      if (!b) return;
      coloring.color = b.dataset.color;
      document.querySelectorAll("#palette .swatch").forEach(function (x) { x.classList.toggle("active", x === b); });
    });
    document.querySelectorAll(".brush-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        coloring.sizeIndex = Number(b.dataset.size);
        document.querySelectorAll(".brush-btn").forEach(function (x) { x.classList.toggle("active", x === b); });
      });
    });

    dom.undoBtn.addEventListener("click", doUndo);
    dom.redoBtn.addEventListener("click", doRedo);
    dom.clearBtn.addEventListener("click", clearPaint);
    dom.refBtn.addEventListener("click", function () {
      dom.refFloat.classList.toggle("show");
    });
    dom.saveWorkBtn.addEventListener("click", saveWorkToGallery);
    dom.dlWorkBtn.addEventListener("click", function () {
      CS.triggerDownload(compositeDataURL("image/png", undefined, 1600), coloring.item.name + "-涂色.png");
    });
    dom.colorBack.addEventListener("click", closeColoring);

    dom.galleryBtn.addEventListener("click", function () { CS.showView("gallery"); });
    dom.galleryBack.addEventListener("click", function () { CS.showView("studio"); });
    dom.galleryGrid.addEventListener("click", onGalleryClick);

    window.addEventListener("pagehide", saveCurrentWork);
    window.addEventListener("resize", layoutColorStage);
  }

  function init(shared) {
    CS = shared;
    cacheDom();
    renderPalette();
    wireColoring();
    loadGallery();
    renderGallery();
    checkResumeBanner();
  }

  window.ColoringPaint = { init: init, open: openColoring };
})();
