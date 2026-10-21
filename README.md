# ClipPulse Studio · 本机 Codex 视频抽帧故事线与竖屏解说自动化工作台

> **🚀 一句话用法（直接复制发给本机 Agent / Codex CLI / Claude Code 即可全自动安装并上传 GitHub）：**
>
> `请帮我解压 clippulse-studio-local.zip，自动检查安装 ffmpeg 与 npm 依赖、将 .env.example 复制为 .env 并启动 http://localhost:3000 服务；同时初始化 git 仓库并推送到我的 GitHub（仓库名 clippulse-studio）。`

**ClipPulse Studio** 是一套专为短视频创作者打造的本地自动化 Web 工作台（蓝白极简风格）。支持将长达 1 小时的动画或自然纪录片，通过 **抽帧看画面 → 识别高能看点 → 前 3 秒黄金抓眼球置顶 → 合成 9:16 抖音竖屏模板**，自动化产出成片、剪映草稿工程（`draft_content.json`）及本机 Codex CLI 批处理脚本。

---

## 一、 核心功能亮点

1. **双模式素材源输入（本地指定 + Agent 联网自动抓取）**
   - **指定本地视频**：直接上传本机 `.mp4 / .mov` 长视频，或使用内置的两大标准参考母本：
     - **母本 A（静默文字解说）**：《微观小世界 · 青虫与苹果房》（保留原片搞笑音效 + 关键帧带引号黄色趣味短句，如 `“回家睡觉”`、`“居然还放屁”`）。
     - **母本 B（TTS 全程配音解说）**：《自然奇观 · 长颈鹿为什么不怕刺》（AI 全程科普语音旁白 + 双行同步字幕）。
   - **Agent 联网自动抓取并从零开剪**：输入任意科普/纪录片主题（如 `《屎壳郎推球》的儿童纪录片`），后端自动检索 Wikimedia Commons 开放纪录片源，调用本机 `ffmpeg` 完成转码、故事线拼接、抽取 6 张实拍关键帧，并从零生成完整解说词与剪映草稿。

2. **双解说模式自由切换（静默黄字 vs TTS 全程配音）**
   - **静默趣味黄字模式**：不加人声配音，保留原片环境音与搞笑音效，在关键帧打上 4–10 字黄色幽默短句。
   - **TTS 全程配音解说模式**：生成连贯生动的纪录片旁白文稿，支持切换多种解说音色（`Kore` 沉稳纪录片旁白、`Puck` 活力少儿故事、`Charon` 磁性自然解说、`Zephyr` 轻快女声）并支持单句实时试听。

3. **剪辑前主画面比例调节与自由拖拽文字模板**
   - **外框默认 9:16 抖音竖屏**，支持在 Agent 剪辑前自由切换中间主画面比例（`4:3 经典居中`、`16:9 宽屏居中`、`1:1 方形居中`、`9:16 全屏铺满`）。
   - **可视化自由拖拽模板**：直接在左侧 9:16 预览画布上用鼠标拖拽顶部标题（如 `小朋友都爱看的纪录片 / 我都没忍住看了两遍`）、中间解说字幕锚点、底部合集引导语到任意位置。

4. **基于不同视频内容 + 不同模板动态生成差异化文稿**
   - 切换不同视频素材或点击不同预设模板（「少儿纪录片模板」、「科普十万个为什么」、「高能反转悬念模板」）时，Agent 会根据当前视频的真实画面观察与顶部模板标题角度，定制化重写每一句解说词与旁白，拒绝千篇一律的套话。

5. **本地全链路导出（剪映草稿 + FFmpeg 竖屏成片 + Codex CLI 脚本）**
   - **导出剪映草稿 (`draft_content.json`)**：生成符合剪映专业版规范的 `1080×1920` 轨道工程文件（含视频切片轨道与同步字幕轨道）。
   - **FFmpeg 一键渲染 9:16 竖屏成片 (`.mp4`)**：后端直接调用本机 `ffmpeg` 将视频合成渲染为 `720×1280` 竖屏 MP4 文件。
   - **导出本机 Codex CLI 批处理脚本 (`run_codex_clip.sh`)** 与 **SRT 字幕文件 (`subtitles.srt`)**。

---

## 二、 本地电脑运行环境要求

在您的电脑（macOS / Windows / Linux）上运行本项目，建议具备以下环境：

1. **Node.js**：建议使用 `Node.js v20+`（或 `v22+`）
2. **FFmpeg**（用于本地视频抽帧、联网视频转码拼接及 9:16 竖屏 MP4 成片合成）：
   - **macOS (Homebrew)**：`brew install ffmpeg`
   - **Windows (Winget / Scoop)**：`winget install Gyan.FFmpeg` 或 `scoop install ffmpeg`
   - **Ubuntu / Debian**：`sudo apt update && sudo apt install -y ffmpeg`
3. **Gemini API Key**：用于实时画面多模态抽帧识别、动态定制解说词撰写与 TTS 语音合成。
4. **OpenAI Codex CLI（可选）**：如果您希望在终端直接运行导出的 `codex` 全自动剪辑命令，可通过 `npm install -g @openai/codex` 安装。

---

## 三、 本地快速启动步骤

### 1. 解压并安装依赖

將下载的 `clippulse-studio-local.zip` 解压到本地任意文件夹，在终端进入该目录并安装依赖：

```bash
unzip clippulse-studio-local.zip -d clippulse-studio
cd clippulse-studio
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，并填入您的 `GEMINI_API_KEY`：

```bash
cp .env.example .env
```

打开 `.env` 文件进行编辑：

```env
GEMINI_API_KEY="在这里填入您的_GEMINI_API_KEY"
APP_URL="http://localhost:3000"
```

### 3. 启动本地全栈工作台

```bash
npm run dev
```

启动成功后，在浏览器访问：
**`http://localhost:3000`**

---

## 四、 三步标准操作流程指南

### 第一步：选视频素材与解说模式
1. **使用已有视频**：点击卡片切换《微观小世界 · 青虫与苹果房》或《自然奇观 · 长颈鹿为什么不怕刺》，或点击 **「上传本机视频 (.mp4)」** 导入您电脑上的长视频。
2. **让 Agent 联网抓取新素材**：在输入框输入主题（例如：`《屎壳郎推球》的儿童纪录片`），点击 **「Agent 抓取并从零生成」**。系统会自动检索纪录片源、调用本机 FFmpeg 拼接并抽取 6 张关键帧缩略图。
3. **选择解说产出模式**：
   - 点击 **「静默文字解说（同毛毛虫母本）」** 产出简短搞笑黄字；
   - 点击 **「TTS 全程配音解说（同长颈鹿母本）」** 产出连贯科普旁白与双行字幕。

### 第二步：调主画面比例与文字模板
1. **调节中间主画面比例**：在 `4:3 经典居中`、`16:9 宽屏居中`、`1:1 方形居中`、`9:16 全屏铺满` 之间一键切换。
2. **打好文字模板**：
   - 可一键套用 **「少儿纪录片模板」**、**「科普十万个为什么」** 或 **「高能反转悬念模板」**；
   - 也可直接在左侧 9:16 竖屏预览画布上 **按住鼠标拖拽** 顶部标题、中间解说字幕或底部合集引导语到任意位置。

### 第三步：Agent 专属解说稿精修与导出
1. **动态重写解说稿**：点击右上角 **「按当前视频与模板重写解说稿」**，Agent 将结合当前视频内容与顶部模板标题生成专属稿件。
2. **实时抽帧写解说**：在左侧播放器任意画面点击 **「抽当前帧写解说」**，Agent 将实时截取当前视频帧画面并生成对应解说字幕。
3. **一键导出成片与剪映工程**：
   - 点击 **「导出剪映草稿工程 (draft_content.json)」**：下载剪映标准草稿文件；
   - 点击 **「FFmpeg 合成 9:16 竖屏成片 (.mp4)」**：由本机 FFmpeg 直接渲染输出 `720×1280` 竖屏视频并提供下载；
   - 点击 **「下载本机 Codex 批处理 (.sh)」** 或 **「导出成片字幕 (.srt)」**。

---

## 五、 如何将导出的 `draft_content.json` 导入剪映专业版 (JianyingPro)

1. 打开电脑上的 **剪映专业版 (JianyingPro)**，新建一个空白草稿后退出到剪映首页。
2. 找到剪映本地草稿文件夹目录：
   - **macOS**：`~/Movies/JianyingPro/User Data/Projects/com.lveditor.draft/`
   - **Windows**：`C:\Users\<您的用户名>\AppData\Local\JianyingPro\User Data\Projects\com.lveditor.draft\`
3. 进入刚才新建的草稿文件夹，用从本工作台下载的 `draft_content.json` 覆盖同名文件，并将对应的视频素材放入项目目录，重新打开剪映即可看到完整的 `9:16` 竖屏画布、分段视频轨道与时间轴对齐的解说字幕轨道。

---

## 六、 项目目录结构说明

```text
├── README.md                          # 本地部署与全流程使用说明文档
├── package.json                       # 项目依赖与启动脚本配置
├── server.ts                          # 本地 Express 后端服务（FFmpeg 抽帧合成 / 联网抓取 / Gemini 多模态与 TTS / 工程打包）
├── index.html                         # Web 工作台入口 HTML
├── vite.config.ts                     # Vite 构建配置
├── .env.example                       # 环境变量模板
├── public/
│   └── assets/
│       ├── aistudio/                  # 内置母本视频（毛毛虫静默黄字母本 & 长颈鹿 TTS 全程配音母本）
│       └── crawled/                   # Agent 联网抓取的《屎壳郎推球》实拍合成视频与 6 张关键帧图片
└── src/
    ├── App.tsx                        # 主工作台状态与三步工作流协调容器
    ├── index.css                      # 蓝白极简主题与字体样式配置
    ├── components/
    │   ├── TopNav.tsx                 # 顶部导航栏与本地工程打包下载入口
    │   ├── CenterCanvasPlayer.tsx     # 左侧 9:16 抖音竖屏实时画布（支持拖拽字幕位置与实时抽帧）
    │   ├── LeftTemplateConfig.tsx     # 第一步（素材与解说模式）& 第二步（主画面比例与文字模板）
    │   └── RightAgentWorkbench.tsx    # 第三步（实拍关键帧解说稿列表、TTS 试听、剪映草稿与 FFmpeg 导出）
    └── utils/
        ├── pipelineLogic.ts           # 核心纯函数逻辑（画布比例几何计算、差异化写稿引擎、剪映草稿生成、故事线浓缩）
        └── pipelineLogic.test.ts      # Node:test 自动化单元测试套件（共 7 项核心测试）
```

### 运行单元测试

```bash
npx tsx --test src/utils/pipelineLogic.test.ts
```
