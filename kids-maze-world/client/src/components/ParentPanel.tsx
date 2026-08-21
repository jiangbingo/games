/* 森林邮差日记设计：家长面板是干净的观察便签，不打断儿童主游戏的温暖绘本语气。 */
import { Clock3, RotateCcw, ShieldCheck, Volume2, VolumeX, X } from "lucide-react";
import type { WeeklyDay } from "@/game/activity";

type ParentPanelProps = {
  completedCount: number;
  stickerCount: number;
  dailySeconds: number;
  dailyLimit: number;
  soundEnabled: boolean;
  ambientEnabled: boolean;
  onClose: () => void;
  onDailyLimitChange: (minutes: number) => void;
  onToggleSound: () => void;
  onToggleAmbient: () => void;
  onResetProgress: () => void;
  resetArmed: boolean;
  weeklyDays: WeeklyDay[];
};

const minutes = (seconds: number) => Math.max(0, Math.floor(seconds / 60));

export default function ParentPanel({ completedCount, stickerCount, dailySeconds, dailyLimit, soundEnabled, ambientEnabled, onClose, onDailyLimitChange, onToggleSound, onToggleAmbient, onResetProgress, resetArmed, weeklyDays }: ParentPanelProps) {
  const timeReached = dailySeconds >= dailyLimit * 60;
  const totalSeconds = weeklyDays.reduce((sum, day) => sum + day.seconds, 0);
  const totalCompleted = weeklyDays.reduce((sum, day) => sum + day.completed, 0);
  const totalStickers = weeklyDays.reduce((sum, day) => sum + day.stickers, 0);
  const activeDays = weeklyDays.filter((day) => day.seconds > 0 || day.completed > 0).length;
  const maximumSeconds = Math.max(60, ...weeklyDays.map((day) => day.seconds));
  const weeklyNote = totalCompleted > 0 ? `这周完成了 ${totalCompleted} 封小信，${activeDays} 天留下了探索足迹。` : "本周还没有新的探索记录，下一封小信会从这里开始。";
  return (
    <div className="parent-modal" role="dialog" aria-modal="true" aria-label="家长小面板">
      <section className="parent-panel">
        <button className="close-map" onClick={onClose} aria-label="关闭家长小面板"><X size={22} /></button>
        <div className="parent-heading"><span><ShieldCheck size={20} /></span><div><p className="eyebrow">森林观察记录</p><h2>家长小面板</h2></div></div>
        <p className="parent-intro">在这里查看今天的探索进度，给小朋友安排一段舒服的游戏时间。</p>
        <div className="parent-summary-grid">
          <div><Clock3 size={18} /><span>今天探索</span><strong>{minutes(dailySeconds)} 分钟</strong></div>
          <div><span className="summary-dot">●</span><span>送达邮包</span><strong>{completedCount} 封</strong></div>
          <div><span className="summary-sticker">✦</span><span>森林贴纸</span><strong>{stickerCount} 枚</strong></div>
        </div>
        <div className="parent-setting-row"><div><strong>每日温柔提醒</strong><small>{timeReached ? "今天已经达到建议时长，可以休息一会儿。" : `还可安心玩约 ${Math.max(0, dailyLimit - minutes(dailySeconds))} 分钟。`}</small></div><select value={dailyLimit} onChange={(event) => onDailyLimitChange(Number(event.target.value))} aria-label="每日建议游戏时长"><option value={10}>10 分钟</option><option value={15}>15 分钟</option><option value={20}>20 分钟</option><option value={30}>30 分钟</option></select></div>
        <div className="parent-toggle-grid">
          <button onClick={onToggleSound} aria-pressed={soundEnabled}><span>{soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}</span><div><strong>互动音效</strong><small>{soundEnabled ? "已开启" : "已静音"}</small></div></button>
          <button onClick={onToggleAmbient} aria-pressed={ambientEnabled}><span>♬</span><div><strong>森林环境音</strong><small>{ambientEnabled ? "触摸后轻声播放" : "已关闭"}</small></div></button>
        </div>
        <section className="weekly-report" aria-label="最近7天探索报告">
          <div className="weekly-report-heading"><strong>最近7天的探索报告</strong><small>只保存在这台设备</small></div>
          <div className="weekly-chart">
            {weeklyDays.map((day, index) => {
              const height = day.seconds ? Math.max(8, Math.round((day.seconds / maximumSeconds) * 100)) : 0;
              return <div className={`weekly-day ${index === weeklyDays.length - 1 ? "is-today" : ""}`} key={day.date} title={`${day.label}：${minutes(day.seconds)}分钟，完成${day.completed}关`}><div className="weekly-bar-track"><div className="weekly-bar" style={{ height: `${height}%` }} /></div><span>{day.label}</span></div>;
            })}
          </div>
          <div className="weekly-totals"><span>⌛ {minutes(totalSeconds)} 分钟</span><span>✉ {totalCompleted} 封</span><span>✦ {totalStickers} 枚</span></div>
          <p className="weekly-note">{weeklyNote}</p>
        </section>
        <div className="parent-reset"><div><strong>重置孩子的进度</strong><small>将清空已送达关卡、贴纸和当前关卡，不影响每日时长设置。</small></div><button className={resetArmed ? "is-confirming" : ""} onClick={onResetProgress}><RotateCcw size={16} />{resetArmed ? "再次确认清空" : "重置进度"}</button></div>
      </section>
    </div>
  );
}
