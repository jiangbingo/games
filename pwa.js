/* 游戏中心 PWA 注册 + 更新横幅（vanilla，无依赖）。
 * 语义与迷宫 T1-1 对齐：新 SW 安装完成后只弹横幅，用户点击才 SKIP_WAITING；
 * controllerchange 只收横幅、绝不 reload——更新不打断进行中的游戏，
 * 新版本在下次打开时生效，进度本就持久化在 localStorage，零丢失。
 */
(function () {
  "use strict";

  if (!("serviceWorker" in navigator)) return;
  var isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  if (location.protocol !== "https:" && !isLocal) return;

  var banner = null;
  var swReg = null;

  function showUpdateBannerIfWaiting() {
    /* 新 SW 已安装且页面已被旧 SW 控制 → 本次会话结束后可无缝换版 */
    if (swReg && swReg.waiting && navigator.serviceWorker.controller) {
      ensureBanner().style.display = "flex";
    }
  }

  function ensureBanner() {
    if (banner) return banner;
    banner = document.createElement("div");
    banner.setAttribute("role", "status");
    banner.style.cssText =
      "position:fixed;left:50%;transform:translateX(-50%);" +
      "bottom:calc(16px + env(safe-area-inset-bottom, 0px));z-index:2147483000;" +
      "display:none;align-items:center;gap:10px;padding:10px 12px 10px 16px;" +
      "border-radius:999px;background:rgba(28,28,40,.92);color:#fff;" +
      "font:14px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" +
      "box-shadow:0 6px 24px rgba(0,0,0,.35);" +
      "-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);";

    var text = document.createElement("span");
    text.textContent = "新版本已就绪";

    var updateBtn = document.createElement("button");
    updateBtn.type = "button";
    updateBtn.textContent = "更新";
    updateBtn.style.cssText =
      "border:0;border-radius:999px;padding:6px 16px;font:inherit;font-weight:600;" +
      "background:#667eea;color:#fff;cursor:pointer;";
    updateBtn.addEventListener("click", function () {
      updateBtn.disabled = true;
      updateBtn.textContent = "更新中…";
      /* 必须发给等待中的新 SW；发给 controller（旧 SW）的 skipWaiting 是空操作 */
      var target = (swReg && swReg.waiting) || navigator.serviceWorker.controller;
      if (target) target.postMessage({ type: "SKIP_WAITING" });
    });

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "×";
    closeBtn.setAttribute("aria-label", "暂不更新");
    closeBtn.style.cssText =
      "border:0;background:transparent;color:rgba(255,255,255,.6);" +
      "font:18px/1 inherit;cursor:pointer;padding:2px 6px;";
    closeBtn.addEventListener("click", function () {
      banner.style.display = "none";
    });

    banner.appendChild(text);
    banner.appendChild(updateBtn);
    banner.appendChild(closeBtn);
    document.body.appendChild(banner);
    return banner;
  }

  navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .then(function (reg) {
      swReg = reg;
      /* 上次访问留下的等待中更新：打开页面就弹横幅（与迷宫 pwa.ts 同语义） */
      showUpdateBannerIfWaiting();
      reg.addEventListener("updatefound", function () {
        var installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", function () {
          if (installing.state === "installed") showUpdateBannerIfWaiting();
        });
      });
      /* 页面停留期间每 60 分钟主动查一次新版本 */
      setInterval(function () {
        reg.update().catch(function () {});
      }, 60 * 60 * 1000);
    })
    .catch(function () {
      /* 注册失败（隐私模式/离线首访）不影响游戏本身 */
    });

  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (banner) banner.style.display = "none";
  });
})();
