# 🎵 Arbitrum Gas 音乐可视化（Arb Pulse）

项目查看地址: https://arbitrum-gas-music.pages.dev/

**Arb Pulse** 是一个交互式数据声化实验，把 Arbitrum 区块链的“心跳”转化为音画体验。

## ✨ 关键特性

### 1. 数据声化引擎
* **7天历史：** 通过 Arbitrum One RPC 获取最近 168 小时的数据。
* **智能活动检测：** 在「Gas Price（L1 费用）」与「Gas Used（L2 拥堵）」之间自动切换，即使 L2 费用趋近 0.01 Gwei 时也能保证旋律动态。
* **Web Audio 合成：** 基于 Web Audio API 的自定义合成器（不依赖外部音频库）。

### 2. 交互控制面板
* **3 种音色引擎：**
  * **赛博朋克：** 激进的锯齿波搭配低通滤波。
  * **空灵：** 正弦/三角波的氛围铺底，偏禅意。
  * **复古：** 8-bit 方波的 Chiptune 风格。
* **节奏控制：** 可从慢速（1s/区块）调节到快速（0.05s/区块）琶音。

### 3. 可视化体验
* **3D 丝带可视化：** 高性能 Canvas 渲染数据点，配合动态渐变。
* **玻璃质感 UI：** 深色模式的“指挥中心”界面，沉浸观感。
* **实时播放指针：** 激光游标精确追踪当前播放的链上历史时刻。

### 4. 作品导出（Artifact）
* **音频导出（WAV）：** 以快于实时的方式离线渲染高质量 `.wav` 文件。
* **图片导出（PNG）：** 捕获高分辨率的数据可视化快照。
* **NFT 元数据：** 生成标准 ERC-721 JSON，包括：
  * 程序化 SVG 封面
  * AI 生成诗性描述（Google Gemini）
  * 链上属性（平均 Gas、时长、风格）

## 🛠 技术栈

* **前端：** React 19、TypeScript、Tailwind CSS
* **音频：** Web Audio API（`OscillatorNode`、`BiquadFilterNode`、`OfflineAudioContext`）
* **图形：** HTML5 Canvas API
* **区块链：** Arbitrum JSON-RPC

