import type { Level, MazeTheme } from "./types";

const themes: MazeTheme[] = [
  { id: 0, name: "花雨邮路", shortName: "花雨", mission: "把橡果邮包送到花田尽头。", stamp: "花瓣邮票", palette: { sky: "#DFF0E6", paper: "#FFF8E9", wall: "#2F725C", trail: "#B8DAB8", fox: "#F36E3B", goal: "#E9B94B", accent: "#E87455", ink: "#1D493B" } },
  { id: 1, name: "蓝莓水洼", shortName: "蓝莓", mission: "沿着凉凉的小路找到蓝莓篮。", stamp: "水滴邮票", palette: { sky: "#DCEEFF", paper: "#F8FCFF", wall: "#356D98", trail: "#BFDCF0", fox: "#F18245", goal: "#5964B8", accent: "#5B9BD5", ink: "#214E70" } },
  { id: 2, name: "蜂蜜花田", shortName: "蜂蜜", mission: "绕过花丛，把蜂蜜罐送到小熊家。", stamp: "蜂巢邮票", palette: { sky: "#FFF2B9", paper: "#FFFDF3", wall: "#8B6A21", trail: "#F5D77F", fox: "#E76F3D", goal: "#E6A62B", accent: "#D98E2B", ink: "#5F4818" } },
  { id: 3, name: "蘑菇灯笼", shortName: "蘑菇", mission: "跟着蘑菇灯的光，把信送出去。", stamp: "蘑菇邮票", palette: { sky: "#F5DFD8", paper: "#FFF9F5", wall: "#8D4A47", trail: "#E9B8AA", fox: "#F08A42", goal: "#D55755", accent: "#B86255", ink: "#633535" } },
  { id: 4, name: "风筝山坡", shortName: "风筝", mission: "穿过风吹过的山坡，送出彩带信。", stamp: "风筝邮票", palette: { sky: "#D9EDFF", paper: "#FFFCF2", wall: "#4B7A7C", trail: "#B7D8D5", fox: "#F46D43", goal: "#DE5A72", accent: "#5D9FBF", ink: "#315A5C" } },
  { id: 5, name: "橡果书屋", shortName: "书屋", mission: "找到书屋门口那枚圆圆的橡果。", stamp: "书页邮票", palette: { sky: "#EFE0CA", paper: "#FFF8EF", wall: "#74543B", trail: "#DCC4A6", fox: "#D96C3D", goal: "#B78338", accent: "#A46B48", ink: "#4B3626" } },
  { id: 6, name: "萤火虫夜邮", shortName: "萤火", mission: "借一盏萤火，找到夜里的邮筒。", stamp: "萤火邮票", palette: { sky: "#D7DFE9", paper: "#F5F7F2", wall: "#425B70", trail: "#A9C4B8", fox: "#E97C47", goal: "#DABD46", accent: "#5C89A1", ink: "#2C4356" } },
  { id: 7, name: "彩虹雨伞", shortName: "雨伞", mission: "雨点停一停，把小信封送到伞下。", stamp: "雨伞邮票", palette: { sky: "#EEE5F8", paper: "#FFFCFF", wall: "#735A8F", trail: "#D3C4EA", fox: "#EF7547", goal: "#C85D8D", accent: "#8B75B5", ink: "#513D6C" } },
  { id: 8, name: "草莓茶会", shortName: "草莓", mission: "去茶会前，把草莓请帖送到桌上。", stamp: "草莓邮票", palette: { sky: "#F9DFE1", paper: "#FFF9F8", wall: "#9C4F5B", trail: "#E7B8BF", fox: "#E97844", goal: "#D85165", accent: "#C55B70", ink: "#6B3740" } },
  { id: 9, name: "海盐贝壳", shortName: "贝壳", mission: "沿着潮水的弯弯路，找到贝壳包裹。", stamp: "贝壳邮票", palette: { sky: "#DDF1F1", paper: "#FBFFFC", wall: "#397878", trail: "#B6DDDA", fox: "#ED7B45", goal: "#E5A45A", accent: "#4E9C9D", ink: "#26585A" } },
  { id: 10, name: "枫叶小火车", shortName: "枫叶", mission: "把车票送到枫叶车站。", stamp: "车票邮票", palette: { sky: "#F4DFCB", paper: "#FFF9F2", wall: "#9C5941", trail: "#E7B999", fox: "#E8743E", goal: "#C24836", accent: "#C87241", ink: "#683827" } },
  { id: 11, name: "雪松小屋", shortName: "雪松", mission: "穿过雪松路，把冬日问候送到小屋。", stamp: "松果邮票", palette: { sky: "#DFEEF0", paper: "#FBFEFC", wall: "#416D68", trail: "#BED8D3", fox: "#E9804A", goal: "#6E9D90", accent: "#5D8B83", ink: "#2A504D" } },
];

const styleNames = ["晨光版", "露珠版", "微风版", "云朵版", "叶影版", "小雨版", "晚霞版", "星点版", "节日版", "藏宝版"];

export const LEVELS: Level[] = Array.from({ length: 120 }, (_, index) => {
  const id = index + 1;
  const theme = themes[Math.floor(index / 10)];
  const size = 8 + Math.min(7, Math.floor(index / 12));

  return {
    id,
    title: `第 ${id} 封邮包`,
    styleName: `${theme.name} · ${styleNames[index % styleNames.length]}`,
    size,
    seed: 2789 + id * 7919,
    theme,
  };
});

export const getLevel = (id: number) => LEVELS.find((level) => level.id === id) ?? LEVELS[0];
export const getNextLevel = (id: number) => getLevel(id === LEVELS.length ? 1 : id + 1);
export const THEMES = themes;
