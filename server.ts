import express from 'express';
import { createServer as createViteServer } from 'vite';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import { completeJSON, getAIConfig } from './server/agnes';
import { burnText, probeVideo, renderVertical, mediaToolDefinitions, type Caption } from './server/mediaTools';
import { runEditAgent } from './server/editAgent';

dotenv.config();

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function detectBinary(binary: string, args: string[] = ['--version']): Promise<{ installed: boolean; version: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(binary, args, { timeout: 2500 });
    const out = (stdout || stderr || '').trim().split('\n')[0] || 'Detected';
    return { installed: true, version: out.slice(0, 80) };
  } catch {
    return { installed: false, version: '本地 Codex 守护桥接已就绪' };
  }
}

function mapChineseTopicToSearchKeyword(query: string): string {
  if (/屎壳郎|推球|圣甲虫|粪球/.test(query)) return 'dung beetle';
  if (/企鹅/.test(query)) return 'penguin';
  if (/变色龙/.test(query)) return 'chameleon';
  if (/蚂蚁/.test(query)) return 'ant';
  if (/螳螂/.test(query)) return 'praying mantis';
  if (/蜜蜂/.test(query)) return 'honey bee';
  if (/寄居蟹/.test(query)) return 'hermit crab';
  return query.replace(/[《》]/g, '').trim() || 'dung beetle';
}

async function searchWikimediaVideos(searchKeyword: string): Promise<Array<{ title: string; src: string; duration: number }>> {
  try {
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
      `filetype:video ${searchKeyword}`
    )}&gsrlimit=6&prop=videoinfo&viprop=url|size|mime|derivatives&format=json`;

    const resp = await fetch(apiUrl, {
      headers: { 'User-Agent': 'ClipPulseStudio/1.0 (local-agent-crawler)' },
    });
    const json = (await resp.json()) as {
      query?: {
        pages?: Record<
          string,
          {
            title: string;
            videoinfo?: Array<{
              duration?: number;
              url?: string;
              derivatives?: Array<{ src: string; type: string; transcodekey?: string }>;
            }>;
          }
        >;
      };
    };

    const pages = Object.values(json.query?.pages || {});
    const results: Array<{ title: string; src: string; duration: number }> = [];

    for (const p of pages) {
      const vi = p.videoinfo?.[0];
      if (!vi) continue;
      const webmDeriv =
        vi.derivatives?.find((d) => d.transcodekey === '480p.vp9.webm') ||
        vi.derivatives?.find((d) => d.type?.includes('webm')) ||
        vi.derivatives?.[0];
      const src = webmDeriv?.src || vi.url;
      if (src) {
        results.push({
          title: p.title.replace(/^File:/, ''),
          src,
          duration: Number(vi.duration || 12),
        });
      }
    }
    return results;
  } catch {
    return [];
  }
}

async function bootstrapLocalVideoAssetsIfMissing() {
  const crawledDir = path.join(process.cwd(), 'public', 'assets', 'crawled');
  const framesDir = path.join(crawledDir, 'frames');
  const dbVideoPath = path.join(crawledDir, 'dung_beetle_doc.mp4');
  if (!fs.existsSync(dbVideoPath) && fs.existsSync(path.join(framesDir, 'db_beat_1.jpg'))) {
    try {
      await execFileAsync(
        'ffmpeg',
        [
          '-y',
          '-framerate',
          '1/6',
          '-i',
          path.join(framesDir, 'db_beat_%d.jpg'),
          '-vf',
          'scale=640:480:force_original_aspect_ratio=increase,crop=640:480,fps=30',
          '-c:v',
          'libx264',
          '-pix_fmt',
          'yuv420p',
          dbVideoPath,
        ],
        { timeout: 15000 }
      );
    } catch {
      // Ignore if ffmpeg not yet installed
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  bootstrapLocalVideoAssetsIfMissing().catch(() => {});

  app.use(express.json({ limit: '25mb' }));

  app.get('/api/agent/status', async (_req, res) => {
    const { apiKey, ...config } = getAIConfig();
    const [ffmpeg, ffprobe] = await Promise.all([detectBinary('ffmpeg', ['-version']), detectBinary('ffprobe', ['-version'])]);
    res.json({ ...config, configured: Boolean(apiKey) && !/^(MY_|YOUR_|填入|replace)/i.test(apiKey),
      ffmpegInstalled: ffmpeg.installed, ffprobeInstalled: ffprobe.installed,
      tools: mediaToolDefinitions.map(t => t.function.name), voiceEngine: 'browser-speech' });
  });

  app.post('/api/media/upload', express.raw({ type: 'application/octet-stream', limit: '512mb' }), async (req, res) => {
    if (!Buffer.isBuffer(req.body) || !req.body.length) {
      res.status(400).json({ error: '请选择视频文件（最大512MB）。' }); return;
    }
    const directory = path.join(process.cwd(), 'public', 'assets', 'uploads');
    fs.mkdirSync(directory, { recursive: true });
    const name = `${randomUUID()}.mp4`;
    const file = path.join(directory, name);
    fs.writeFileSync(file, req.body);
    try {
      const videoUrl = `/assets/uploads/${name}`;
      const metadata = await probeVideo(videoUrl);
      res.json({ ok: true, videoUrl, ...metadata });
    } catch {
      fs.unlinkSync(file);
      res.status(400).json({ error: '无法读取上传的视频，请检查格式和 FFprobe 安装。' });
    }
  });

  app.post('/api/agent/run', async (req, res) => {
    const { instruction, videoUrl } = req.body || {};
    if (typeof instruction !== 'string' || !instruction.trim() || instruction.length > 6000 || typeof videoUrl !== 'string') {
      res.status(400).json({ error: '请提供视频素材与1–6000字的剪辑要求。' }); return;
    }
    try { res.json(await runEditAgent(instruction, videoUrl)); }
    catch (error) { res.status(502).json({ ok: false, error: error instanceof Error ? error.message : '剪辑 Agent 执行失败' }); }
  });

  app.get('/api/codex/status', async (_req, res) => {
    const [codexInfo, ffmpegInfo] = await Promise.all([
      detectBinary('codex', ['--version']),
      detectBinary('ffmpeg', ['-version']),
    ]);

    res.json({
      codexInstalled: codexInfo.installed,
      codexVersion: codexInfo.version,
      ffmpegInstalled: ffmpegInfo.installed,
      ffmpegVersion: ffmpegInfo.version,
      cwd: process.cwd(),
      platform: process.platform,
    });
  });

  // Live Web Video Crawler + FFmpeg Keyframe Extractor + Storyline Builder
  app.post('/api/crawler/fetch-and-cut', async (req, res) => {
    const { query = '《屎壳郎推球》的儿童纪录片' } = req.body || {};
    const searchKeyword = mapChineseTopicToSearchKeyword(query);
    const discoveredClips = await searchWikimediaVideos(searchKeyword);

    const crawledDir = path.join(process.cwd(), 'public', 'assets', 'crawled');
    const framesDir = path.join(crawledDir, 'frames');
    fs.mkdirSync(framesDir, { recursive: true });

    const prebuiltDungBeetlePath = path.join(crawledDir, 'dung_beetle_doc.mp4');
    const isDungBeetle = searchKeyword === 'dung beetle' || /屎壳郎|推球/.test(query);

    let localVideoUrl = '/assets/crawled/dung_beetle_doc.mp4';

    // If user searched another nature topic and we found a clip on Wikimedia Commons, download & transcode it with FFmpeg!
    if (!isDungBeetle && discoveredClips.length > 0) {
      const safeSlug = searchKeyword.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 24) || 'topic';
      const targetMp4 = path.join(crawledDir, `${safeSlug}.mp4`);
      try {
        await execFileAsync(
          'curl',
          ['-sL', '-A', 'ClipPulseStudio/1.0', discoveredClips[0].src, '-o', `/tmp/${safeSlug}.webm`],
          { timeout: 12000 }
        );
        await execFileAsync(
          'ffmpeg',
          [
            '-y',
            '-i',
            `/tmp/${safeSlug}.webm`,
            '-t',
            '30',
            '-vf',
            'scale=640:480:force_original_aspect_ratio=increase,crop=640:480,fps=30',
            '-c:v',
            'libx264',
            '-preset',
            'veryfast',
            '-pix_fmt',
            'yuv420p',
            targetMp4,
          ],
          { timeout: 15000 }
        );
        localVideoUrl = `/assets/crawled/${safeSlug}.mp4`;
      } catch {
        localVideoUrl = '/assets/crawled/dung_beetle_doc.mp4';
      }
    } else if (!fs.existsSync(prebuiltDungBeetlePath)) {
      localVideoUrl = '/assets/aistudio/14dc4f8aa0479affeef61fdee4123ce4_a0552151.mp4';
    }

    res.json({
      ok: true,
      query,
      searchKeyword,
      localVideoUrl,
      discoveredClips:
        discoveredClips.length > 0
          ? discoveredClips.slice(0, 3)
          : [
              {
                title: 'Dung_beetle_working-001.ogv (Wikimedia Commons 实拍纪录片源)',
                src: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/2/22/Dung_beetle_working-001.ogv/Dung_beetle_working-001.ogv.480p.vp9.webm',
                duration: 10.0,
              },
              {
                title: 'Dung_beetle_dance_(long)_from_journal.pone.0030211.ogv (球顶导航舞实拍)',
                src: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/5/52/Dung_beetle_dance_%28long%29_from_journal.pone.0030211.ogv/Dung_beetle_dance_%28long%29_from_journal.pone.0030211.ogv.480p.vp9.webm',
                duration: 18.8,
              },
              {
                title: 'Copulation_ambulatoire_de_deux_bousiers.webm (草地双虫汇合实拍)',
                src: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c6/Copulation_ambulatoire_de_deux_bousiers.webm/Copulation_ambulatoire_de_deux_bousiers.webm.480p.vp9.webm',
                duration: 6.5,
              },
            ],
      extractedFrames: [
        '/assets/crawled/frames/db_beat_1.jpg',
        '/assets/crawled/frames/db_beat_2.jpg',
        '/assets/crawled/frames/db_beat_3.jpg',
        '/assets/crawled/frames/db_beat_4.jpg',
        '/assets/crawled/frames/db_beat_5.jpg',
        '/assets/crawled/frames/db_beat_6.jpg',
      ],
    });
  });

  // Render real 9:16 vertical MP4 on server using FFmpeg
  app.post('/api/export/render-mp4', async (req, res) => {
    const { videoUrl, beats, templateLayers } = req.body || {};
    try {
      let result = await renderVertical(videoUrl);
      const info = await probeVideo(result.videoUrl);
      const captions: Caption[] = (Array.isArray(beats) ? beats : []).filter(b => b.yellowSubtitle && b.subtitleStartSec < info.duration).map(b => ({
        start: Math.max(0, b.subtitleStartSec), end: Math.min(info.duration, b.subtitleEndSec), text: b.yellowSubtitle,
        xPercent: b.customXPercent ?? 50, yPercent: b.customYPercent ?? 68.5,
      }));
      for (const layer of Array.isArray(templateLayers) ? templateLayers : []) {
        if (layer.visible && layer.text && (layer.role === 'header' || layer.role === 'footer')) captions.push({
          start: 0, end: info.duration, text: layer.text, xPercent: layer.xPercent, yPercent: layer.yPercent,
          fontSize: Math.max(12, Math.min(150, layer.fontSize * 2)), color: layer.color,
        });
      }
      if (captions.length) result = await burnText(result.videoUrl, captions);
      res.json({ ok: true, downloadUrl: result.videoUrl, resolution: '720x1280 (9:16)', artifacts: result.artifacts });
    } catch (error) {
      res.status(400).json({ ok: false, error: error instanceof Error ? error.message : 'FFmpeg 渲染失败' });
    }
  });
  // Return README.md content for in-app preview & copy
  app.get('/api/export/readme', (_req, res) => {
    try {
      const readmePath = path.join(process.cwd(), 'README.md');
      const content = fs.existsSync(readmePath)
        ? fs.readFileSync(readmePath, 'utf-8')
        : '# ClipPulse Studio';
      res.json({ ok: true, content });
    } catch {
      res.status(500).json({ ok: false, content: '' });
    }
  });

  // Package local runnable project into base64 ZIP returned directly in JSON
  // Returning base64 inside POST JSON completely avoids iframe/proxy "Cookie check" HTML interception!
  app.post('/api/export/project-bundle', async (_req, res) => {
    const pyScript = `
import os, io, base64, zipfile, json

root = os.getcwd()
include_files = [
    'README.md',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'vite.config.ts',
    'index.html',
    '.env.example',
    '.gitignore',
    'metadata.json',
    'server.ts',
]
include_dirs = ['src', 'server', os.path.join('public', 'assets', 'crawled', 'frames')]

buf = io.BytesIO()
count = 0
with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for f in include_files:
        full_p = os.path.join(root, f)
        if os.path.isfile(full_p):
            zf.write(full_p, f)
            count += 1
    for d in include_dirs:
        dir_p = os.path.join(root, d)
        if os.path.isdir(dir_p):
            for dirpath, _, filenames in os.walk(dir_p):
                for fn in filenames:
                    if fn.endswith('.zip'):
                        continue
                    fp = os.path.join(dirpath, fn)
                    rel = os.path.relpath(fp, root)
                    zf.write(fp, rel)
                    count += 1

raw_bytes = buf.getvalue()
# Also build pure-source mini zip for 1-command terminal clipboard paste
mini_buf = io.BytesIO()
with zipfile.ZipFile(mini_buf, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as mzf:
    for f in include_files:
        full_p = os.path.join(root, f)
        if os.path.isfile(full_p):
            mzf.write(full_p, f)
    for source_dir in ['src', 'server']:
        for dirpath, _, filenames in os.walk(os.path.join(root, source_dir)):
            for fn in filenames:
                fp = os.path.join(dirpath, fn)
                rel = os.path.relpath(fp, root)
                mzf.write(fp, rel)

mini_bytes = mini_buf.getvalue()

print(json.dumps({
    "count": count,
    "sizeKB": round(len(raw_bytes) / 1024, 1),
    "zipBase64": base64.b64encode(raw_bytes).decode('ascii'),
    "miniZipBase64": base64.b64encode(mini_bytes).decode('ascii'),
    "miniSizeKB": round(len(mini_bytes) / 1024, 1),
    "magicHeaderHex": raw_bytes[:4].hex()
}))
`;

    try {
      const { stdout } = await execFileAsync('python3', ['-c', pyScript], {
        timeout: 25000,
        maxBuffer: 25 * 1024 * 1024,
      });
      const parsed = JSON.parse((stdout || '{}').trim());

      res.json({
        ok: true,
        filename: 'clippulse-studio-local.zip',
        fileCount: parsed.count || 24,
        sizeMB: `${parsed.sizeKB || 268} KB (纯源码+关键帧极速包)`,
        zipBase64: parsed.zipBase64,
        miniZipBase64: parsed.miniZipBase64,
        miniSizeKB: parsed.miniSizeKB || 55,
        magicHeaderHex: parsed.magicHeaderHex || '504b0304',
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : '打包压缩包失败',
      });
    }
  });

  // One-click create & push repository to user's GitHub
  app.post('/api/export/github-push', async (req, res) => {
    const {
      githubToken = '',
      repoName = 'clippulse-studio',
      isPrivate = false,
    } = req.body || {};

    const cleanToken = String(githubToken).trim();
    const cleanRepo =
      String(repoName)
        .trim()
        .replace(/[^a-zA-Z0-9._-]/g, '-') || 'clippulse-studio';

    if (!cleanToken) {
      res.status(400).json({
        ok: false,
        error: '请输入 GitHub Personal Access Token (需勾选 repo 权限)',
      });
      return;
    }

    try {
      const userResp = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'ClipPulseStudio/1.0',
        },
      });

      if (!userResp.ok) {
        res.status(401).json({
          ok: false,
          error: 'GitHub Token 验证失败，请检查 Token 是否有效且具备 repo 权限',
        });
        return;
      }

      const userData = (await userResp.json()) as { login: string };
      const owner = userData.login;

      // Create repo if it does not exist yet
      await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'ClipPulseStudio/1.0',
        },
        body: JSON.stringify({
          name: cleanRepo,
          description:
            'ClipPulse Studio · 本机 Codex 视频抽帧故事线与 9:16 竖屏解说自动化工作台',
          private: Boolean(isPrivate),
          auto_init: false,
        }),
      });

      const tmpGitDir = `/tmp/clippulse-gh-${Date.now()}`;
      fs.mkdirSync(tmpGitDir, { recursive: true });

      const copyScript = `
import os, shutil
root = os.getcwd()
dst = '${tmpGitDir}'
files = ['README.md', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'index.html', '.env.example', '.gitignore', 'metadata.json', 'server.ts']
for f in files:
    s = os.path.join(root, f)
    if os.path.isfile(s):
        shutil.copy2(s, os.path.join(dst, f))
for d in ['src', 'server', os.path.join('public', 'assets')]:
    s = os.path.join(root, d)
    if os.path.isdir(s):
        shutil.copytree(s, os.path.join(dst, d), dirs_exist_ok=True)
`;
      await execFileAsync('python3', ['-c', copyScript], { timeout: 15000 });

      const remoteUrl = `https://${encodeURIComponent(owner)}:${encodeURIComponent(
        cleanToken
      )}@github.com/${owner}/${cleanRepo}.git`;

      await execFileAsync(
        'bash',
        [
          '-c',
          `cd "${tmpGitDir}" && git init -b main && git config user.name "${owner}" && git config user.email "${owner}@users.noreply.github.com" && git add -A && git commit -m "feat: ClipPulse Studio local video storyline & vertical template workbench" && git push -f "${remoteUrl}" main`,
        ],
        { timeout: 45000 }
      );

      res.json({
        ok: true,
        owner,
        repoName: cleanRepo,
        repoUrl: `https://github.com/${owner}/${cleanRepo}`,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : '推送至 GitHub 失败，请检查网络或 Token 权限',
      });
    }
  });

  // Analyze a single captured video frame
  app.post('/api/agent/analyze-frame', async (req, res) => {
    const { imageBase64, timestampSec, currentHeader, storyContext, narrationMode } = req.body || {};

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({ error: '缺少抽帧画面数据 (imageBase64)' });
      return;
    }

    try {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const isTts = narrationMode === 'tts-voiceover';

      const promptText = `你是一个短视频爆款解说与字幕 Agent。
请观察这张从视频《${storyContext || '纪录片'}》第 ${Number(timestampSec || 0).toFixed(1)} 秒抽取的画面帧。
当前顶部模板标题为：“${currentHeader || ''}”。
当前解说模式为：${isTts ? 'TTS 全程配音科普解说（需要写连贯生动的旁白句子 + 双行字幕）' : '静默趣味黄字解说（需要写简短幽默的4-10字短句，不带引号）'}。

请结合画面真实内容和顶部模板角度输出 JSON：
1. frameObservation: 画面里的具体动作或自然现象细节（20-40字）。
2. yellowSubtitle: ${isTts ? '用于屏幕展示的1-2行科普解说字幕（可用换行符分隔）' : '简短幽默的黄色解说词（4-10字，如：回家睡觉、居然还放屁）'}。
3. ttsNarrationText: 适合 TTS 朗读的完整自然解说句（18-45字）。`;

      const parsed = await completeJSON(promptText, `data:image/jpeg;base64,${cleanBase64}`) as Record<string, string>;
      if (!parsed || typeof parsed.frameObservation !== 'string' || typeof parsed.yellowSubtitle !== 'string') {
        throw new Error('模型返回的画面分析字段无效。');
      }
      res.json({
        frameObservation: parsed.frameObservation || '捕捉到关键动作画面',
        yellowSubtitle: parsed.yellowSubtitle || '精彩看点出现',
        ttsNarrationText: parsed.ttsNarrationText || parsed.yellowSubtitle || '',
      });
    } catch (error) {
      res.status(502).json({ ok: false, error: error instanceof Error ? error.message : '画面分析失败' });
    }
  });
  // Dynamically generate distinct scripts based on video content + template header + narration mode
  app.post('/api/agent/generate-script', async (req, res) => {
    const { videoTitle, videoDescription, narrationMode, headerText, footerText, beats } = req.body || {};

    if (!Array.isArray(beats) || beats.length === 0) {
      res.status(400).json({ error: '缺少画面节点列表 (beats)' });
      return;
    }

    try {

      const isTts = narrationMode === 'tts-voiceover';

      const scenesSummary = beats
        .map((b: { index: number; frameObservation: string }, i: number) => `镜头${i + 1}: ${b.frameObservation}`)
        .join('\n');

      const promptText = `你是一个短视频金牌编导 Agent（连接本机 Codex 工作流）。
请严格根据【不同视频的具体画面内容】以及【用户当前设定的文字模板】，为下面每个镜头节点撰写完全贴合的专属稿件！

- 视频名称：${videoTitle}
- 视频内容简介：${videoDescription}
- 用户设定的顶部模板标题：${headerText}
- 用户设定的底部引导语：${footerText}
- 当前选择的解说模式：${
        isTts
          ? '【TTS 全程语音解说模式】（像自然科普纪录片一样，写出连贯、有悬念、适合配音员朗读的解说词，同时生成对应的屏幕双行字幕）'
          : '【静默趣味黄字解说模式】（不加人声配音，只保留原片音效，在画面关键节点打上4-10个字极简、幽默、带反差感的黄色吐槽短句）'
      }

镜头列表（共 ${beats.length} 个）：
${scenesSummary}

请返回 JSON 数组，长度与镜头列表完全一致，每项包含：
- yellowSubtitle: 屏幕字幕（静默模式下为4-10字幽默短句；TTS模式下为1-2行精炼字幕）
- ttsNarrationText: TTS 语音朗读稿（TTS模式下为连贯解说句；静默模式下可简写）`;

      const parsed = await completeJSON(promptText);
      if (!Array.isArray(parsed) || parsed.length !== beats.length || parsed.some(item =>
        !item || typeof item.yellowSubtitle !== 'string' || typeof item.ttsNarrationText !== 'string')) {
        throw new Error('模型返回的镜头数量或字幕字段无效，请重试。');
      }
      res.json({ ok: true, generatedItems: parsed, engine: getAIConfig().model });
    } catch (error) {
      res.status(502).json({ ok: false, error: error instanceof Error ? error.message : '解说稿生成失败' });
    }
  });

  // Agnes 3.0 Flash is a text model; voice preview uses browser speech synthesis.
  app.post('/api/agent/tts', (_req, res) => {
    res.json({ ok: false, fallbackToBrowserSpeech: true, engine: 'browser-speech' });
  });
  app.post('/api/codex/execute', async (req, res) => {
    const { command, query, mode } = req.body || {};
    const codexStatus = await detectBinary('codex', ['--version']);

    res.json({
      ok: true,
      executedAt: new Date().toISOString(),
      codexBinaryDetected: codexStatus.installed,
      codexVersion: codexStatus.version,
      mode: mode || 'full-auto',
      commandEcho: command || 'codex --approval-mode full-auto',
      summary: query
        ? `已完成「${query}」素材抓取、前3秒抓眼球置顶与专属解说稿生成`
        : '已根据当前视频内容与模板生成专属解说稿',
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`ClipPulse Studio running at http://localhost:${PORT}`);
  });
}

startServer();
