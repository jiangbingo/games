/**
 * 森林邮差日记设计：每个主题都有清晰的角色任务、终点物和一组小而温和的互动音色。
 * 宽幅视觉仅在当前主题使用，以避免12张插画同时加载影响首屏速度。
 */
export type ThemePresentation = {
  assetUrl: string;
  companion: string;
  goal: string;
  props: string;
  sound: { base: number; bright: number; texture: "sine" | "triangle" | "soft" };
  story: { title: string; line: string; action: string; mark: string };
};

export const THEME_PRESENTATION: Record<number, ThemePresentation> = {
  0: { assetUrl: "/assets/theme-flower-rain-assets.png", companion: "花田小狐狸", goal: "橡果邮筒", props: "花瓣、瓢虫与绿芽", sound: { base: 540, bright: 760, texture: "sine" }, story: { title: "花田信使出发啦", line: "瓢虫把一枚叶片印章轻轻盖在邮包上。", action: "花瓣绕着邮筒转了一圈", mark: "✿" } },
  1: { assetUrl: "/assets/theme-blueberry-assets.png", companion: "水洼小狐狸", goal: "蓝莓篮", props: "蓝莓、水纹与芦苇", sound: { base: 480, bright: 690, texture: "soft" }, story: { title: "蓝莓篮满满当当", line: "水面冒出圆圆的泡泡，说谢谢你送来小信。", action: "三颗蓝莓跳进了篮子", mark: "●" } },
  2: { assetUrl: "/assets/theme-honey-assets.png", companion: "蜂蜜邮差", goal: "小熊蜂蜜屋", props: "小蜜蜂、花朵与蜂巢", sound: { base: 610, bright: 850, texture: "triangle" }, story: { title: "蜂蜜香香的", line: "小熊端来一小勺蜂蜜，给邮差一个拥抱。", action: "小蜜蜂围着花朵嗡嗡唱", mark: "✦" } },
  3: { assetUrl: "/assets/theme-mushroom-assets.png", companion: "灯笼小狐狸", goal: "蘑菇灯", props: "蕨叶、蘑菇与微光", sound: { base: 430, bright: 670, texture: "soft" }, story: { title: "蘑菇灯亮起来", line: "晚风吹过，林间的小灯为你照亮回家的路。", action: "萤光在帽檐上轻轻闪烁", mark: "☾" } },
  4: { assetUrl: "/assets/theme-kite-assets.png", companion: "风筝邮差", goal: "彩带风筝", props: "云朵、风线与山花", sound: { base: 590, bright: 900, texture: "sine" }, story: { title: "风筝飞上云朵", line: "彩带带着你的问候，飞向软绵绵的天空。", action: "风线画出弯弯的笑脸", mark: "⌁" } },
  5: { assetUrl: "/assets/theme-acorn-library-assets.png", companion: "书屋小狐狸", goal: "橡果书屋", props: "书页、木梯与树叶", sound: { base: 390, bright: 580, texture: "soft" }, story: { title: "书屋收到新故事", line: "小书鼠把信放进故事夹，悄悄点点头。", action: "书页翻出沙沙的声音", mark: "⌂" } },
  6: { assetUrl: "/assets/theme-firefly-night-assets.png", companion: "萤火邮差", goal: "夜邮筒", props: "星点、萤火与蕨影", sound: { base: 520, bright: 940, texture: "sine" }, story: { title: "夜空收到问候", line: "萤火虫排成一列，把星星消息送到邮筒。", action: "星点在夜里轻轻眨眼", mark: "✧" } },
  7: { assetUrl: "/assets/theme-rainbow-umbrella-assets.png", companion: "雨伞小狐狸", goal: "伞下邮筒", props: "彩虹、雨点与水纹", sound: { base: 470, bright: 780, texture: "soft" }, story: { title: "彩虹在说谢谢", line: "雨停啦，彩虹给邮包系上一条亮亮的丝带。", action: "水洼荡开一圈圈彩色波纹", mark: "⌒" } },
  8: { assetUrl: "/assets/theme-strawberry-tea-assets.png", companion: "茶会邮差", goal: "草莓茶桌", props: "请帖、茶壶与花瓣", sound: { base: 560, bright: 830, texture: "triangle" }, story: { title: "茶会请帖送到啦", line: "草莓茶壶冒出甜甜的香气，留给你一张小座位。", action: "花瓣落进茶杯里转呀转", mark: "♡" } },
  9: { assetUrl: "/assets/theme-seashell-assets.png", companion: "海边小狐狸", goal: "贝壳篮", props: "潮泡、沙堡与贝壳", sound: { base: 440, bright: 720, texture: "soft" }, story: { title: "贝壳听见大海", line: "浪花把谢谢装进一枚小贝壳，送到你手边。", action: "潮泡在沙滩上跳跳舞", mark: "◌" } },
  10: { assetUrl: "/assets/theme-maple-train-assets.png", companion: "车票邮差", goal: "枫叶小火车", props: "落叶、时钟与行李", sound: { base: 500, bright: 800, texture: "triangle" }, story: { title: "小火车鸣笛啦", line: "枫叶列车收好车票，准备带着问候出发。", action: "落叶像车票一样飘呀飘", mark: "♧" } },
  11: { assetUrl: "/assets/theme-cedar-cabin-assets.png", companion: "冬日小狐狸", goal: "雪松小屋", props: "松枝、雪点与木雪橇", sound: { base: 410, bright: 640, texture: "soft" }, story: { title: "雪松小屋暖暖的", line: "屋里亮起一盏灯，把冬日问候放在窗边。", action: "松枝上的雪花慢慢飘落", mark: "❄" } },
};

export const getThemePresentation = (themeId: number) => THEME_PRESENTATION[themeId] ?? THEME_PRESENTATION[0];
