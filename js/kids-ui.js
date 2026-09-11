/* KidsUI —— 逻辑游戏合集共享底座（蜡笔纸艺设计系统，配套 css/kids.css）。
 * 纯 vanilla、零依赖、普通 script 标签加载，离线/无网络可运行。
 * 提供：SFX（音效+静音持久化）/ haptic（震动）/ Progress（进度存档）/
 *       Celebrate（结算庆祝层）/ Header（游戏顶栏）/ Touch（防误触）/ TTS（中文语音）。
 */
(function () {
  "use strict";

  var LS_PROGRESS = "kids_hub_progress";
  var LS_SOUND = "kids_hub_sound";
  var LS_VOLUME = "kids_hub_volume";
  var STAR_HIGH = 0.9;
  var STAR_MID = 0.7;

  function syncSoundIcons() {
    var nodes = document.querySelectorAll("[data-kui-sound]");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = SFX.enabled ? "🔊" : "🔇";
      nodes[i].setAttribute("aria-pressed", SFX.enabled ? "true" : "false");
    }
  }

  function syncVolumeIcons() {
    var nodes = document.querySelectorAll("[data-kui-volume]");
    var percent = Math.round(SFX.volume * 100) + "%";
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].value = String(Math.round(SFX.volume * 100));
      nodes[i].setAttribute("aria-valuetext", percent);
    }
  }

  // ── 音效：AudioContext 惰性创建（所有调用都发生在用户手势里，iOS 可播放） ──
  // volume 为主音量 0-1，与静音开关相互独立：静音只静音效、滑杆不解除静音；
  // TTS 等内容音频只随音量（与 animal-sounds 的约定一致）。
  var MIN_GAIN = 0.001;
  var SFX = {
    _ctx: null,
    enabled: true,
    volume: 1,
    _ensure() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!this._ctx) this._ctx = new AC();
      if (this._ctx.state === "suspended") this._ctx.resume();
      return this._ctx;
    },
    _tone(freq, dur, type, vol, delay) {
      var ctx = this._ensure();
      if (!ctx) return;
      var peak = (vol || 0.18) * this.volume;
      if (peak < MIN_GAIN) return;
      var t0 = ctx.currentTime + (delay || 0);
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(peak, t0);
      gain.gain.exponentialRampToValueAtTime(MIN_GAIN, t0 + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    },
    tap() {
      if (!this.enabled) return;
      this._tone(660, 0.06, "sine", 0.1);
    },
    correct() {
      if (!this.enabled) return;
      this._tone(523.25, 0.12, "sine", 0.2);
      this._tone(783.99, 0.18, "sine", 0.2, 0.1);
    },
    wrong() {
      if (!this.enabled) return;
      this._tone(196, 0.25, "triangle", 0.22);
    },
    celebrate() {
      if (!this.enabled) return;
      var notes = [523.25, 659.25, 783.99, 1046.5];
      for (var i = 0; i < notes.length; i++) {
        this._tone(notes[i], 0.22, "sine", 0.2, i * 0.13);
      }
    },
    setEnabled(on) {
      this.enabled = on;
      try {
        localStorage.setItem(LS_SOUND, on ? "on" : "off");
      } catch (e) {
        /* 隐私模式下仅本次会话生效 */
      }
      syncSoundIcons();
    },
    setVolume(v) {
      var next = Number(v);
      if (!isFinite(next)) return;
      /* 只改响度，不动静音开关：家长按下的静音不能被滑杆的一次误触撤销 */
      this.volume = Math.min(1, Math.max(0, next));
      try {
        localStorage.setItem(LS_VOLUME, String(this.volume));
      } catch (e) {
        /* 隐私模式下仅本次会话生效 */
      }
      syncVolumeIcons();
    }
  };
  try {
    SFX.enabled = localStorage.getItem(LS_SOUND) !== "off";
    var savedVolume = localStorage.getItem(LS_VOLUME);
    if (savedVolume) {
      var parsedVolume = Number(savedVolume);
      if (isFinite(parsedVolume)) SFX.volume = Math.min(1, Math.max(0, parsedVolume));
    }
  } catch (e) {
    /* 默认开、默认满音量 */
  }

  function haptic(kind) {
    if (!navigator.vibrate) return;
    try {
      navigator.vibrate(kind === "bad" ? [40, 40, 60] : 25);
    } catch (e) {
      /* 忽略 */
    }
  }

  // ── 进度存档：{gameId: {stars, best, lastPlayed, settings}} ──
  var Progress = {
    _all() {
      var raw = {};
      try {
        raw = JSON.parse(localStorage.getItem(LS_PROGRESS)) || {};
      } catch (e) {
        return {};
      }
      // localStorage 是用户可写边界：非对象条目丢弃，stars 钳到 0-3
      //（枢纽 "⭐".repeat(p.stars) 遇 1e9 量级脏数据会直接 OOM 掉整个 hub）
      var clean = {};
      for (var k in raw) {
        var v = raw[k];
        if (typeof v !== "object" || v === null) continue;
        v.stars = Math.min(3, Math.max(0, Math.floor(Number(v.stars) || 0)));
        v.best = Math.max(0, Math.floor(Number(v.best) || 0));
        if (typeof v.settings !== "object" || v.settings === null) v.settings = {};
        clean[k] = v;
      }
      return clean;
    },
    _save(data) {
      try {
        localStorage.setItem(LS_PROGRESS, JSON.stringify(data));
        return true;
      } catch (e) {
        return false;
      }
    },
    get(gameId) {
      return this._all()[gameId] || null;
    },
    // patch: {stars?, best?, settings?}；stars/best 只升不降
    record(gameId, patch) {
      var all = this._all();
      var cur = all[gameId] || { stars: 0, best: 0, settings: {} };
      if (patch.stars != null) cur.stars = Math.max(cur.stars, patch.stars);
      if (patch.best != null) cur.best = Math.max(cur.best, patch.best);
      if (patch.settings) cur.settings = patch.settings;
      cur.lastPlayed = new Date().toISOString();
      all[gameId] = cur;
      return this._save(all);
    },
    starsTotal() {
      var all = this._all();
      var n = 0;
      for (var k in all) n += all[k].stars || 0;
      return n;
    },
    // 正确率 0-1 → 1-3 星
    starsFor(accuracy) {
      return accuracy >= STAR_HIGH ? 3 : accuracy >= STAR_MID ? 2 : 1;
    }
  };

  // ── 中文语音（不可用静默降级） ──
  var TTS = {
    speak(text) {
      if (!("speechSynthesis" in window)) return;
      /* 约定：静音开关只静音效；TTS/动物叫声等内容音频只随主音量。
         音量 0 直接不发声（部分 iOS 忽略 utterance.volume） */
      if (SFX.volume <= 0) return;
      try {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = "zh-CN";
        u.rate = 0.95;
        u.volume = SFX.volume;
        var zh = window.speechSynthesis
          .getVoices()
          .filter(function (v) {
            return v.lang && v.lang.indexOf("zh") === 0;
          })[0];
        if (zh) u.voice = zh;
        window.speechSynthesis.speak(u);
      } catch (e) {
        /* 忽略 */
      }
    }
  };

  // ── 游戏顶栏：返回主页 / 标题 / 音效开关 / 重玩 ──
  var Header = {
    render(opts) {
      var el = document.createElement("header");
      el.className = "kui-header";
      if (opts.accent) el.style.setProperty("--game-accent", opts.accent);

      var back = document.createElement("a");
      back.className = "kui-btn kui-back";
      /* 枢纽页 iframe 壳按 id 拦截此按钮（见 index.html），直达时 href="/" 生效 */
      back.id = "home-btn";
      back.href = "/";
      back.setAttribute("aria-label", "返回主页");
      back.textContent = "🏠";

      var title = document.createElement("h1");
      title.className = "kui-title";
      title.textContent = opts.title || "";

      var actions = document.createElement("div");
      actions.className = "kui-actions";
      var sound = document.createElement("button");
      sound.type = "button";
      sound.className = "kui-btn kui-sound";
      sound.setAttribute("data-kui-sound", "");
      sound.setAttribute("aria-label", "音效开关");
      sound.textContent = SFX.enabled ? "🔊" : "🔇";
      sound.addEventListener("click", function () {
        if (SFX.enabled) {
          SFX.setEnabled(false);
          return;
        }
        /* 音量被拖到 0 时，重新开声要先回到听得见的响度，否则「开了也没声」 */
        if (SFX.volume === 0) SFX.setVolume(1);
        SFX.setEnabled(true);
        SFX.tap();
      });
      actions.appendChild(sound);
      var volume = document.createElement("input");
      volume.type = "range";
      volume.className = "kui-vol";
      volume.min = "0";
      volume.max = "100";
      volume.step = "5";
      volume.value = String(Math.round(SFX.volume * 100));
      volume.setAttribute("data-kui-volume", "");
      volume.setAttribute("aria-label", "音量");
      volume.addEventListener("input", function () {
        SFX.setVolume(Number(volume.value) / 100);
      });
      /* 松手试听一声，家长立刻知道调到什么响度 */
      volume.addEventListener("change", function () {
        SFX.tap();
      });
      actions.appendChild(volume);
      if (opts.showReplay !== false) {
        var replay = document.createElement("button");
        replay.type = "button";
        replay.className = "kui-btn kui-replay";
        replay.setAttribute("aria-label", "重新开始");
        replay.textContent = "↻";
        replay.addEventListener("click", function () {
          if (opts.onReplay) opts.onReplay();
        });
        actions.appendChild(replay);
      }

      el.appendChild(back);
      el.appendChild(title);
      el.appendChild(actions);
      document.body.insertBefore(el, document.body.firstChild);
      document.body.classList.add("kui-has-header");
      syncSoundIcons();
      syncVolumeIcons();
      return el;
    }
  };

  // ── 结算庆祝层：彩带 + 星星 + 按钮 ──
  var Celebrate = {
    el: null,
    // {title, sub, stars(0-3), primaryLabel, onPrimary, secondaryLabel, onSecondary, announce}
    show(opts) {
      this.hide();
      var overlay = document.createElement("div");
      overlay.className = "kui-celebrate";
      var card = document.createElement("div");
      card.className = "kui-celebrate-card";

      var stars = document.createElement("div");
      stars.className = "kui-stars";
      stars.setAttribute("aria-hidden", "true");
      for (var i = 0; i < 3; i++) {
        var s = document.createElement("span");
        s.className = "kui-star" + (i < (opts.stars || 0) ? " on" : "");
        s.textContent = "★";
        s.style.animationDelay = 0.15 + i * 0.18 + "s";
        stars.appendChild(s);
      }
      var h = document.createElement("h2");
      h.className = "kui-celebrate-title";
      h.textContent = opts.title || "太棒了！";
      card.appendChild(stars);
      card.appendChild(h);
      if (opts.sub) {
        var sub = document.createElement("p");
        sub.className = "kui-celebrate-sub";
        sub.textContent = opts.sub;
        card.appendChild(sub);
      }
      var btns = document.createElement("div");
      btns.className = "kui-btnrow";
      var mkBtn = function (label, primary, fn) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "kui-btn kui-big" + (primary ? " kui-primary" : "");
        b.textContent = label;
        b.addEventListener("click", function () {
          SFX.tap();
          Celebrate.hide();
          if (fn) fn();
        });
        btns.appendChild(b);
      };
      mkBtn(opts.primaryLabel || "继续", true, opts.onPrimary);
      if (opts.onSecondary) {
        mkBtn(opts.secondaryLabel || "回主页", false, opts.onSecondary);
      }
      card.appendChild(btns);
      overlay.appendChild(card);
      this._confetti(overlay, opts.stars || 0);
      document.body.appendChild(overlay);
      this.el = overlay;
      requestAnimationFrame(function () {
        overlay.classList.add("in");
      });
      SFX.celebrate();
      haptic("good");
      if (opts.announce) TTS.speak(opts.announce);
      return overlay;
    },
    _confetti(overlay, stars) {
      if (!stars) return;
      var colors = ["#ff6b4a", "#ffd166", "#3fa574", "#4f8ff7", "#c86bfa"];
      var n = 24 + stars * 10;
      var frag = document.createDocumentFragment();
      for (var i = 0; i < n; i++) {
        var c = document.createElement("i");
        c.className = "kui-confetti";
        c.style.left = Math.random() * 100 + "%";
        c.style.background = colors[i % colors.length];
        c.style.animationDelay = Math.random() * 0.5 + "s";
        c.style.animationDuration = 1.6 + Math.random() * 1.2 + "s";
        frag.appendChild(c);
      }
      overlay.appendChild(frag);
    },
    hide() {
      if (this.el) {
        this.el.remove();
        this.el = null;
      }
    }
  };

  // ── 防误触：双击缩放 / 双指手势。
  // 注意：不拦 touchend——各页 CSS touch-action: manipulation 已原生禁用双击缩放，
  // 文档级拦截会吞掉 300ms 内的快速连点（幼儿操作节奏常落在此区间）。 ──
  var Touch = {
    guard() {
      document.addEventListener("dblclick", function (e) {
        e.preventDefault();
      });
      document.addEventListener("gesturestart", function (e) {
        e.preventDefault();
      });
    }
  };

  window.KidsUI = {
    SFX: SFX,
    Progress: Progress,
    TTS: TTS,
    Header: Header,
    Celebrate: Celebrate,
    Touch: Touch,
    haptic: haptic
  };
})();