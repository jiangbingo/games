/* 森林邮差日记设计：终点剧情是一张轻盈的绘本明信片，先肯定努力，再交给贴纸奖励。 */
import type { ThemePresentation } from "@/game/themePresentation";

type ThemeStoryProps = { presentation: ThemePresentation; onContinue: () => void };

export default function ThemeStory({ presentation, onContinue }: ThemeStoryProps) {
  const { story } = presentation;
  return (
    <div className="story-layer" role="dialog" aria-modal="true" aria-label={`${story.title}通关剧情`}>
      <div className="story-sparkles" aria-hidden="true"><span>{story.mark}</span><span>{story.mark}</span><span>{story.mark}</span></div>
      <section className="theme-story-card">
        <div className="story-art-frame"><img src={presentation.assetUrl} alt="" aria-hidden="true" /></div>
        <p className="story-kicker">小小邮差的送达故事</p>
        <h2>{story.title}</h2>
        <p className="story-line">{story.line}</p>
        <div className="story-action"><span>{story.mark}</span>{story.action}</div>
        <button onClick={onContinue}>收下故事礼物 <kbd>Enter</kbd><kbd>Space</kbd></button>
      </section>
    </div>
  );
}
