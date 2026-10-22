# ClipPulse Studio · 本机 Codex 视频抽帧故事线与竖屏解说自动化工作台

## 本地 Agnes 剪辑 Agent（2026-10-21）

当前 AI 接口使用 Agnes OpenAI 兼容 Chat Completions，模型 ID 已按[官方文档](https://agnes-ai.com/zh-Hans/docs/agnes-30-flash)核对为 `agnes-3.0-flash`。

将 `.env.example` 复制为 `.env`，填写 `AGNES_API_KEY`：

```env
AGNES_BASE_URL="https://apihub.agnes-ai.com/v1"
AGNES_MODEL="agnes-3.0-flash"
AGNES_API_KEY="在此填写你的 API Key"
APP_URL="http://localhost:3000"
```

Key 仅由服务端读取，不使用 `VITE_` 前缀，不提交 `.env`。保存后在界面点击“刷新配置”即可，无须重启。

运行 `npm install`、`npm run dev`，打开 http://localhost:3000。先在“选素材与模式”上传本机视频（最大512MB），再在“Agnes 剪辑 Agent”输入要求，例如“取0到8秒和12到18秒拼接，转9:16，顶部加标题‘旅行日记’，前3秒添加黄色字幕‘出发了’”。

工具由后端真实执行：`probe_video` 读取时长/分辨率/音轨；`extract_frame` 抽帧看图；`cut_video` 精确剪切和顺序拼接；`render_vertical` 输出720×1280竖屏；`add_text` 烧录中文标题和定时字幕并输出ASS字幕文件。每次任务最多10次工具调用，文件保存在 `public/assets/agent/`，原视频保留，结果可预览下载。抽帧视觉理解会发送相应画面给 Agnes；本地 FFmpeg 处理不上传视频到其他平台。

Agnes 3.0 Flash 的输出模态为文本，TTS试听使用浏览器语音，不提供导出配音音轨。官方文档列出图像URL输入，当前工程按OpenAI兼容格式发送本地抽帧Data URL；待填写Key后验证网关是否接受该输入。接口或Key错误会明确显示，不再伪造AI生成成功。

本包未附带母本示例视频，请上传自己的视频。

验证：`npm run lint`、`npm test`、`npm run build`。测试会调用本机 FFmpeg/FFprobe 生成短测试视频，检查真实剪切时长、音轨保留、中文文字烧录以及工具调用结果回传。需要 FFmpeg 的 `ass` 滤镜和中文字体（Windows默认使用Microsoft YaHei）。

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
3. **Agnes API Key**：用于画面理解、解说词撰写与剪辑工具编排。语音试听使用浏览器朗读。
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

复制 `.env.example` 为 `.env`，并填入您的 `AGNES_API_KEY`：

```bash
cp .env.example .env
```

打开 `.env` 文件进行编辑：

```env
AGNES_BASE_URL="https://apihub.agnes-ai.com/v1"
AGNES_MODEL="agnes-3.0-flash"
AGNES_API_KEY="在这里填入您的_AGNES_API_KEY"
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
├── server.ts                          # 本地 Express 后端服务（FFmpeg / 联网抓取 / Agnes / 工程打包）
├── server/                            # Agnes 接口、剪辑 Agent 与 FFmpeg 工具
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

### ChatGPT 站点与本机工具

云端工作台：https://clippulse-studio-dghw.dgfd81.chatgpt.site （账号私有访问）。
云端的画面分析和字幕生成使用站点服务端的 Agnes 密钥；视频素材、剪辑 Agent 和 FFmpeg 工具保留在本机。
配置非空随机 `LOCAL_BRIDGE_TOKEN` 后，本机额外监听 `127.0.0.1:3001`，只接受 Bearer 认证的视频相关接口，不开放 GitHub 推送或终端。

Windows 后台启动：`./scripts/start-cloud-local.ps1`。脚本输出的 `LOCAL_BACKEND_URL` 必须同步到站点同名密钥，并重新部署已有版本。当前使用临时 Cloudflare Tunnel，重建连接可能更换地址。电脑需保持开机联网；日志在忽略提交的 `.runtime` 目录。
长视频先在本机 `http://localhost:3000` 导入，再从云端顶部“本机素材”选择。云端单次上传限制95MB。
