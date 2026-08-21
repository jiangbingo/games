/* 森林邮差日记设计：自然观察绘本、纸张质感和大尺寸儿童操作区。 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Engine } from "@babylonjs/core/Engines/engine";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BookOpen, Check, Flower2, Keyboard, Lightbulb, Map, MoonStar, PackageOpen, RotateCcw, Settings2, Sparkles, Undo2, Volume2, VolumeX, Wind, X } from "lucide-react";
import ParentPanel from "@/components/ParentPanel";
import ThemeStory from "@/components/ThemeStory";
import { createGameScene, type GameHandle } from "@/game/scene";
import { readWeeklyActivity, recordDailyActivity } from "@/game/activity";
import { LEVELS, getNextLevel } from "@/game/levels";
import { SoundManager, type SoundEffect } from "@/game/SoundManager";
import { getThemePresentation } from "@/game/themePresentation";
import type { Direction, GameSnapshot, Level } from "@/game/types";

const LOGO_URL = "/assets/maze-leaf-compass-logo.png";
const STICKERS = [
  { id: "acorn", name: "橡果邮包", hint: "送好第一封信", icon: PackageOpen },
  { id: "mushroom", name: "蘑菇灯笼", hint: "收集3枚邮票", icon: Flower2 },
  { id: "kite", name: "风筝彩带", hint: "收集6枚邮票", icon: Wind },
  { id: "firefly", name: "萤火小灯", hint: "收集10枚邮票", icon: MoonStar },
] as const;

type StickerId = (typeof STICKERS)[number]["id"];

const readCompleted = () => {
  try {
    return JSON.parse(localStorage.getItem("maze-completed-levels") ?? "[]") as number[];
  } catch {
    return [];
  }
};

const readStickers = () => {
  try {
    return JSON.parse(localStorage.getItem("maze-sticker-book") ?? "[]") as StickerId[];
  } catch {
    return [];
  }
};

const readSoundEnabled = () => localStorage.getItem("maze-sound-enabled") !== "false";
const readAmbientEnabled = () => localStorage.getItem("maze-ambient-enabled") !== "false";
const readDailyLimit = () => Number(localStorage.getItem("maze-daily-limit")) || 15;
const todayPlaytimeKey = () => `maze-playtime-${new Date().toISOString().slice(0, 10)}`;
const readDailySeconds = () => Number(localStorage.getItem(todayPlaytimeKey())) || 0;

const stickerForLevel = (level: Level): StickerId => STICKERS[level.theme.id % STICKERS.length].id;

function getDirectionFromSwipe(start: { x: number; y: number }, end: { x: number; y: number }): Direction | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const minimumTravel = window.innerWidth >= 768 ? 44 : 34;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < minimumTravel) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);
  const handleRef = useRef<GameHandle | null>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const completionRef = useRef(new Set<number>(readCompleted()));
  const stickerRef = useRef(new Set<StickerId>(readStickers()));
  const completionEpisodeRef = useRef<number | null>(null);
  const soundRef = useRef(new SoundManager(readSoundEnabled(), readAmbientEnabled()));
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [completed, setCompleted] = useState<number[]>(() => Array.from(completionRef.current));
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isStickerBookOpen, setIsStickerBookOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(readSoundEnabled);
  const [ambientEnabled, setAmbientEnabled] = useState(readAmbientEnabled);
  const [stickers, setStickers] = useState<StickerId[]>(() => Array.from(stickerRef.current));
  const [celebrationSticker, setCelebrationSticker] = useState<StickerId | null>(null);
  const [storyThemeId, setStoryThemeId] = useState<number | null>(null);
  const [queuedSticker, setQueuedSticker] = useState<StickerId | null>(null);
  const [isParentOpen, setIsParentOpen] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  const [dailySeconds, setDailySeconds] = useState(readDailySeconds);
  const [dailyLimit, setDailyLimit] = useState(readDailyLimit);
  const [isKeyboardHelpOpen, setIsKeyboardHelpOpen] = useState(false);
  const [notice, setNotice] = useState("轻点方向石，带小狐狸去送邮包。 ");

  const level = snapshot?.level ?? LEVELS[0];
  const palette = level.theme.palette;
  const completionCount = completed.length;
  const isDemo = useMemo(() => new URLSearchParams(window.location.search).has("demo"), []);
  const presentation = getThemePresentation(level.theme.id);
  const weeklyDays = useMemo(() => readWeeklyActivity(), [dailySeconds, completed, stickers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || startedRef.current) return;
    startedRef.current = true;
    const engine = new Engine(canvas, true, { alpha: true, preserveDrawingBuffer: true, stencil: true, adaptToDeviceRatio: true });
    let handle: GameHandle | null = null;
    let disposed = false;

    createGameScene(engine, canvas, {
      demo: isDemo,
      onStateChange: (nextSnapshot) => {
        if (!disposed) setSnapshot(nextSnapshot);
      },
    }).then((gameHandle) => {
      if (disposed) {
        gameHandle.dispose();
        return;
      }
      handle = gameHandle;
      handleRef.current = gameHandle;
      engine.runRenderLoop(() => gameHandle.scene.render());
    });

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      handle?.dispose();
      engine.dispose();
      soundRef.current.dispose();
      handleRef.current = null;
      startedRef.current = false;
    };
  }, [isDemo]);

  useEffect(() => {
    const openedAt = Date.now();
    const initialSeconds = readDailySeconds();
    const updatePlaytime = () => {
      const next = initialSeconds + Math.floor((Date.now() - openedAt) / 1000);
      localStorage.setItem(todayPlaytimeKey(), String(next));
      setDailySeconds(next);
    };
    const timer = window.setInterval(updatePlaytime, 5000);
    return () => { window.clearInterval(timer); updatePlaytime(); };
  }, []);

  useEffect(() => {
    if (!snapshot) return;
    localStorage.setItem("maze-last-level", String(snapshot.level.id));
    if (!snapshot.isComplete) {
      completionEpisodeRef.current = null;
      return;
    }
    if (completionEpisodeRef.current === snapshot.level.id) return;
    completionEpisodeRef.current = snapshot.level.id;
    let newSticker: StickerId | null = null;
    if (!completionRef.current.has(snapshot.level.id)) {
      completionRef.current.add(snapshot.level.id);
      const next = Array.from(completionRef.current).sort((a, b) => a - b);
      localStorage.setItem("maze-completed-levels", JSON.stringify(next));
      setCompleted(next);
      recordDailyActivity("completed", snapshot.level.id);
      const stickerId = stickerForLevel(snapshot.level);
      if (!stickerRef.current.has(stickerId)) {
        stickerRef.current.add(stickerId);
        const nextStickers = Array.from(stickerRef.current);
        localStorage.setItem("maze-sticker-book", JSON.stringify(nextStickers));
        setStickers(nextStickers);
        recordDailyActivity("sticker", stickerId);
        newSticker = stickerId;
      }
    }
    setQueuedSticker(newSticker);
    setStoryThemeId(snapshot.level.theme.id);
    soundRef.current.play("celebrate", getThemePresentation(snapshot.level.theme.id).sound);
  }, [snapshot]);

  useEffect(() => {
    if (!snapshot) return;
    if (snapshot.isComplete) setNotice("邮包送到啦！树叶邮票已经盖好。 ");
    else if (snapshot.collisionTick > 0) setNotice("这是一道树篱，我们换条小路看看。 ");
  }, [snapshot?.collisionTick, snapshot?.isComplete]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const isNativeControl = Boolean(target?.closest("button, a, input, select, textarea, [contenteditable='true'], [role='button']"));
      const desktopKeyboard = window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.innerWidth >= 1024;
      if (!desktopKeyboard || event.repeat) return;
      if (event.key === "Escape") {
        const didClose = isKeyboardHelpOpen ? (setIsKeyboardHelpOpen(false), true)
          : storyThemeId !== null ? (setStoryThemeId(null), setQueuedSticker(null), setCelebrationSticker(null), true)
          : celebrationSticker ? (setCelebrationSticker(null), true)
          : isStickerBookOpen ? (setIsStickerBookOpen(false), true)
          : isParentOpen ? (setIsParentOpen(false), true)
          : isMapOpen ? (setIsMapOpen(false), true)
          : false;
        if (didClose) event.preventDefault();
        return;
      }
      if (isNativeControl) return;
      if ((event.key === "Enter" || event.key === " ") && !isMapOpen && !isStickerBookOpen && !isParentOpen && !isKeyboardHelpOpen) {
        event.preventDefault();
        if (storyThemeId !== null) { finishStory(); return; }
        if (celebrationSticker) { setCelebrationSticker(null); return; }
        if (snapshot?.isComplete) { nextLevel(); return; }
      }
      const keys: Record<string, Direction> = { ArrowUp: "up", ArrowRight: "right", ArrowDown: "down", ArrowLeft: "left", w: "up", d: "right", s: "down", a: "left" };
      const keyboardKey = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const direction = keys[keyboardKey];
      if (!direction || isMapOpen || isStickerBookOpen || isParentOpen || isKeyboardHelpOpen || storyThemeId !== null || celebrationSticker) return;
      event.preventDefault();
      const didMove = handleRef.current?.move(direction);
      playSound(didMove ? "move" : "bump");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMapOpen, isStickerBookOpen, isParentOpen, isKeyboardHelpOpen, storyThemeId, celebrationSticker, snapshot?.isComplete]);

  const playSound = (effect: SoundEffect) => {
    soundRef.current.unlock();
    soundRef.current.play(effect, presentation.sound);
  };
  const move = (direction: Direction) => {
    const didMove = handleRef.current?.move(direction);
    playSound(didMove ? "move" : "bump");
  };
  const undo = () => { handleRef.current?.undo(); playSound("undo"); };
  const restart = () => {
    handleRef.current?.restart();
    playSound("restart");
    setNotice("重新铺好小路啦，再试一次。 ");
  };
  const hint = () => {
    handleRef.current?.showHint();
    playSound("hint");
    setNotice("萤火虫照亮了前面几步。 ");
  };
  const chooseLevel = (nextLevel: Level) => {
    handleRef.current?.loadLevel(nextLevel.id);
    setIsMapOpen(false);
    playSound("click");
    setNotice(`准备好啦，去 ${nextLevel.theme.name} 送信。 `);
  };
  const nextLevel = () => chooseLevel(getNextLevel(level.id));
  const finishStory = () => {
    setStoryThemeId(null);
    if (queuedSticker) setCelebrationSticker(queuedSticker);
    setQueuedSticker(null);
  };
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("maze-sound-enabled", String(next));
    soundRef.current.setEnabled(next);
    if (next) soundRef.current.play("click");
  };
  const toggleAmbient = () => {
    const next = !ambientEnabled;
    setAmbientEnabled(next);
    localStorage.setItem("maze-ambient-enabled", String(next));
    soundRef.current.setAmbientEnabled(next);
  };
  const setNewDailyLimit = (minutes: number) => {
    setDailyLimit(minutes);
    localStorage.setItem("maze-daily-limit", String(minutes));
  };
  const resetProgress = () => {
    if (!resetArmed) { setResetArmed(true); return; }
    ["maze-completed-levels", "maze-sticker-book", "maze-last-level"].forEach((key) => localStorage.removeItem(key));
    completionRef.current = new Set();
    stickerRef.current = new Set();
    setCompleted([]);
    setStickers([]);
    setCelebrationSticker(null);
    handleRef.current?.loadLevel(1);
    setResetArmed(false);
    setIsParentOpen(false);
    setNotice("森林邮局整理好啦，从第一封小信重新出发。 ");
  };

  const themeStyle = {
    "--maze-sky": palette.sky,
    "--maze-paper": palette.paper,
    "--maze-wall": palette.wall,
    "--maze-ink": palette.ink,
    "--maze-accent": palette.accent,
    "--maze-goal": palette.goal,
  } as React.CSSProperties;

  return (
    <main className="maze-shell" style={themeStyle}>
      <div className="observation-table" aria-hidden="true">
        <div className="paper-tape tape-one" />
        <div className="paper-tape tape-two" />
        <span className="board-seal seal-one">●</span>
        <span className="board-seal seal-two">●</span>
        <span className="acorn-parcel">◆</span>
      </div>
      <canvas
        ref={canvasRef}
        className="maze-canvas"
        aria-label="可操作的森林迷宫"
        onPointerDown={(event) => { soundRef.current.unlock(); swipeRef.current = { x: event.clientX, y: event.clientY }; }}
        onPointerUp={(event) => {
          if (!swipeRef.current) return;
          const direction = getDirectionFromSwipe(swipeRef.current, { x: event.clientX, y: event.clientY });
          swipeRef.current = null;
          if (direction) move(direction);
        }}
      />

      <header className="maze-header">
        <div className="brand-lockup">
          <img src={LOGO_URL} alt="叶片罗盘" className="brand-mark" />
          <div>
            <p className="eyebrow">森林邮局 · 120封小信</p>
            <h1>迷宫小小探险家</h1>
          </div>
        </div>
        <div className="header-actions">
          <button className="parent-trigger" onClick={() => { setIsParentOpen(true); setResetArmed(false); playSound("click"); }} aria-label="打开家长小面板"><Settings2 size={20} strokeWidth={2.6} /><span>家长</span></button>
          <button className="sticker-trigger" onClick={() => { setIsStickerBookOpen(true); playSound("click"); }} aria-label="打开奖励贴纸册"><BookOpen size={20} strokeWidth={2.6} /><span>贴纸册</span></button>
          <button className="sound-trigger" onClick={toggleSound} aria-label={soundEnabled ? "关闭音效" : "打开音效"} aria-pressed={soundEnabled}>{soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}</button>
          <button className="keyboard-help-trigger" onClick={() => { setIsKeyboardHelpOpen((open) => !open); playSound("click"); }} aria-label="打开键盘操作说明" aria-expanded={isKeyboardHelpOpen}><Keyboard size={20} strokeWidth={2.6} /><span>按键</span></button>
          <button className="map-trigger" onClick={() => { setIsMapOpen(true); playSound("click"); }} aria-label="打开120关地图"><Map size={20} strokeWidth={2.6} /><span>小站地图</span></button>
        </div>
      </header>

      <aside className="progress-card glass-card">
        <div className="progress-card-top">
          <span className="tiny-label">正在送</span>
          <span className="level-number">{level.id} / 120</span>
        </div>
        <strong>{level.styleName}</strong>
        <small className="companion-label">小伙伴：{presentation.companion}</small>
        <div className="stamp-row" aria-label={`已完成 ${completionCount} 个关卡`}>
          {Array.from({ length: 4 }).map((_, index) => <span className={`leaf-stamp ${index < Math.min(4, completionCount % 5) ? "is-earned" : ""}`} key={index}>●</span>)}
          <span className="stamp-count">已收 {completionCount}</span>
        </div>
      </aside>

      <section className="mission-card glass-card" aria-live="polite">
        <img className="theme-mission-art" src={presentation.assetUrl} alt="" aria-hidden="true" />
        <span className="mission-stamp">{level.theme.stamp}</span>
        <p>{level.theme.mission}</p>
        <div className="mission-status"><Sparkles size={15} /> {notice}</div><small className="goal-label">终点：{presentation.goal}</small>
      </section>

      <section className="game-tools glass-card">
        <div className="tool-stat"><span>走了</span><strong>{snapshot?.moves ?? 0} 步</strong></div>
        <div className="tool-divider" />
        <button onClick={undo} className="tool-button" aria-label="撤销上一步"><Undo2 size={18} />撤销</button>
        <button onClick={restart} className="tool-button" aria-label="重新开始本关"><RotateCcw size={18} />重来</button>
        <button onClick={hint} className="tool-button is-accent" aria-label="使用萤火虫提示"><Lightbulb size={18} />提示</button>
      </section>

      <section className="direction-pad" aria-label="迷宫方向控制">
        <button className="direction-button up" onClick={() => move("up")} aria-label="向上走"><ArrowUp size={26} /></button>
        <button className="direction-button left" onClick={() => move("left")} aria-label="向左走"><ArrowLeft size={26} /></button>
        <div className="fox-center" aria-hidden="true"><span>●</span></div>
        <button className="direction-button right" onClick={() => move("right")} aria-label="向右走"><ArrowRight size={26} /></button>
        <button className="direction-button down" onClick={() => move("down")} aria-label="向下走"><ArrowDown size={26} /></button>
      </section>

      {isKeyboardHelpOpen && (
        <aside className="keyboard-help-card" aria-label="桌面键盘操作说明">
          <button className="keyboard-help-close" onClick={() => setIsKeyboardHelpOpen(false)} aria-label="关闭键盘操作说明"><X size={17} /></button>
          <div className="keyboard-help-heading"><Keyboard size={19} /><div><span>桌面小帮手</span><strong>键盘操作</strong></div></div>
          <div className="keyboard-help-row"><span>移动迷宫</span><div><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd><em>或</em><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div></div>
          <div className="keyboard-help-row"><span>确认下一步</span><div><kbd>Enter</kbd><em>或</em><kbd>Space</kbd></div></div>
          <div className="keyboard-help-row"><span>关闭弹层</span><div><kbd>Esc</kbd></div></div>
          <p>点一下右上角“按键”或按 <kbd>Esc</kbd> 都能收起这张小卡。</p>
        </aside>
      )}

      {snapshot?.isComplete && (
        <section className="success-banner glass-card" aria-live="assertive">
          <div className="success-icon"><Check size={26} /></div>
          <div><strong>邮包准时送到！</strong><span>这枚 {level.theme.stamp} 归你啦。</span></div>
          <button onClick={() => { setCelebrationSticker(null); nextLevel(); }}>下一封信 <kbd>Enter</kbd><kbd>Space</kbd></button>
        </section>
      )}

      {storyThemeId !== null && <ThemeStory presentation={getThemePresentation(storyThemeId)} onContinue={finishStory} />}

      {celebrationSticker && (
        <div className="celebration-layer" role="dialog" aria-modal="true" aria-label="获得奖励贴纸">
          <div className="confetti-field" aria-hidden="true">{Array.from({ length: 14 }).map((_, index) => <span key={index} style={{ "--confetti-index": index } as React.CSSProperties} />)}</div>
          <section className="sticker-reveal">
            <p>叮！奖励贴纸送到啦</p>
            {STICKERS.filter((sticker) => sticker.id === celebrationSticker).map((sticker) => {
              const Icon = sticker.icon;
              return <div className="big-sticker" key={sticker.id}><Icon size={62} strokeWidth={1.7} /></div>;
            })}
            <strong>{STICKERS.find((sticker) => sticker.id === celebrationSticker)?.name}</strong>
            <span>贴进你的森林贴纸册吧。</span>
            <button onClick={() => setCelebrationSticker(null)}>收下贴纸 <kbd>Enter</kbd><kbd>Space</kbd></button>
          </section>
        </div>
      )}

      {isStickerBookOpen && (
        <div className="sticker-modal" role="dialog" aria-modal="true" aria-label="森林奖励贴纸册">
          <section className="sticker-book-panel">
            <button className="close-map" onClick={() => setIsStickerBookOpen(false)} aria-label="关闭贴纸册"><X size={22} /></button>
            <p className="eyebrow">已经收下 {stickers.length} / {STICKERS.length} 枚</p>
            <h2>我的森林贴纸册</h2>
            <p className="sticker-book-copy">送好一封信，就会得到一枚会发光的森林贴纸。</p>
            <div className="sticker-grid">
              {STICKERS.map((sticker) => {
                const unlocked = stickers.includes(sticker.id);
                const Icon = sticker.icon;
                return <div className={`sticker-card ${unlocked ? "is-unlocked" : ""}`} key={sticker.id}><div className="sticker-icon">{unlocked ? <Icon size={37} strokeWidth={1.8} /> : <span>?</span>}</div><strong>{unlocked ? sticker.name : "神秘贴纸"}</strong><small>{unlocked ? "已经贴好啦" : sticker.hint}</small></div>;
              })}
            </div>
          </section>
        </div>
      )}

      {isParentOpen && <ParentPanel completedCount={completionCount} stickerCount={stickers.length} dailySeconds={dailySeconds} dailyLimit={dailyLimit} soundEnabled={soundEnabled} ambientEnabled={ambientEnabled} onClose={() => setIsParentOpen(false)} onDailyLimitChange={setNewDailyLimit} onToggleSound={toggleSound} onToggleAmbient={toggleAmbient} onResetProgress={resetProgress} resetArmed={resetArmed} weeklyDays={weeklyDays} />}

      {isMapOpen && (
        <div className="map-modal" role="dialog" aria-modal="true" aria-label="120关迷宫地图">
          <section className="world-map-panel">
            <button className="close-map" onClick={() => setIsMapOpen(false)} aria-label="关闭地图"><X size={22} /></button>
            <div className="map-intro">
              <p className="eyebrow">你已盖好 {completionCount} 枚树叶邮票</p>
              <h2>120座森林小站</h2>
              <p>每一封邮包都有一条不一样的小路。想去哪里，就轻轻点一下。</p>
            </div>
            <div className="chapter-tabs">
              {Array.from({ length: 12 }).map((_, index) => {
                const firstLevel = LEVELS[index * 10];
                return <button key={firstLevel.id} onClick={() => document.getElementById(`chapter-${index + 1}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}>{index + 1}. {firstLevel.theme.shortName}</button>;
              })}
            </div>
            <div className="level-browser">
              {Array.from({ length: 12 }).map((_, chapterIndex) => {
                const chapterLevels = LEVELS.slice(chapterIndex * 10, chapterIndex * 10 + 10);
                return (
                  <div className="level-chapter" id={`chapter-${chapterIndex + 1}`} key={chapterIndex}>
                    <div className="chapter-heading"><span>{String(chapterIndex + 1).padStart(2, "0")}</span><strong>{chapterLevels[0].theme.name}</strong><small>{chapterLevels[0].theme.mission}</small></div>
                    <div className="level-grid">
                      {chapterLevels.map((item) => {
                        const isDone = completed.includes(item.id);
                        const isCurrent = item.id === level.id;
                        return <button key={item.id} className={`level-node ${isDone ? "is-done" : ""} ${isCurrent ? "is-current" : ""}`} style={{ "--node-color": item.theme.palette.accent } as React.CSSProperties} onClick={() => chooseLevel(item)} aria-label={`进入第${item.id}关，${item.styleName}`}><span>{item.id}</span>{isDone && <Check size={13} />}</button>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
