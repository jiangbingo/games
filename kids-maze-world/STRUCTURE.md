# Game Structure

游戏使用React作为全屏宿主、Babylon作为2D画布、`client/src/game`作为与React解耦的游戏逻辑层。

```text
client/src/
  components/
    GameCanvas.tsx        # Babylon生命周期与可访问的HTML交互壳
  game/
    types.ts              # 关卡、坐标、方向、主题等共享类型
    levels.ts             # 120个数据驱动关卡与主题元数据
    maze.ts               # 可重现迷宫生成、BFS验证、求解与路径辅助
    input.ts               # 键盘、触屏滑动与按钮语义动作
    GameWorld.ts          # 游戏状态、移动队列、撤销、提示、完成事件
    scene.ts               # Babylon场景、网格、角色、渲染和资源释放
  pages/
    Home.tsx              # 游戏宿主路由
```

## 所有权与状态

`GameWorld`拥有当前关卡、玩家位置、步数、历史操作和自动演示状态；它不直接依赖React。`scene.ts`创建`GameWorld`、订阅状态并拥有Babylon网格、镜头和动画。`GameCanvas`仅负责启动、停止、尺寸变化和将用户语义动作传递给场景句柄。

## Asset Hints

世界地图与森林装饰在React界面中以本地`/assets`资源展示。实时迷宫元素优先用Babylon的平面、圆角线条与标准材质绘制，避免将小尺寸AI图像缩小后造成识别困难。视觉目标图只用于设计校准，不作为实时迷宫背景，以确保道路和互动信息的清晰度。
