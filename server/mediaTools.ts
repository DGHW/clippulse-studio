import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);
const publicRoot = path.resolve('public');
const outputRoot = path.join(publicRoot, 'assets', 'agent');
export type Artifact = { url: string; kind: 'video' | 'image' | 'subtitles'; label: string };

export function localMediaPath(url: unknown) {
  if (typeof url !== 'string' || !url.startsWith('/assets/') || /[?#\0\\]/.test(url)) {
    throw new Error('请先上传本地视频，工具仅处理当前工程 /assets/ 下的素材。');
  }
  const target = path.resolve(publicRoot, '.' + url);
  if (!target.startsWith(publicRoot + path.sep) || !fs.existsSync(target)) throw new Error('素材文件不存在，请上传本地视频。');
  const real = fs.realpathSync(target);
  if (!real.startsWith(fs.realpathSync(publicRoot) + path.sep)) throw new Error('素材路径超出工程目录。');
  return real;
}

function output(extension: string) {
  fs.mkdirSync(outputRoot, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  return { file: path.join(outputRoot, filename), url: `/assets/agent/${filename}` };
}

export async function probeVideo(videoUrl: unknown) {
  const input = localMediaPath(videoUrl);
  const { stdout } = await exec('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', input], { timeout: 15000 });
  const data = JSON.parse(stdout);
  const video = data.streams?.find((s: { codec_type: string }) => s.codec_type === 'video');
  if (!video) throw new Error('素材中没有视频轨道。');
  return { duration: Number(data.format?.duration || video.duration || 0), width: Number(video.width), height: Number(video.height),
    hasAudio: data.streams.some((s: { codec_type: string }) => s.codec_type === 'audio') };
}

async function ffmpeg(args: string[]) {
  try { await exec('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', ...args], { timeout: 300000, maxBuffer: 2 * 1024 * 1024 }); }
  catch { throw new Error('FFmpeg 处理失败，请检查素材、时间范围以及本机 FFmpeg 字幕滤镜是否可用。'); }
}
function number(value: unknown, min: number, max: number, label: string) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`${label} 超出有效范围。`);
  return value;
}
function text(value: unknown) {
  if (typeof value !== 'string' || !value.trim() || value.length > 2000) throw new Error('文字须为 1–2000 个字符。');
  // Prevent ASS tag/line injection while preserving literal user text.
  return value.replace(/\\/g, '＼').replace(/{/g, '｛').replace(/}/g, '｝').replace(/\r?\n/g, '\\N');
}
function assTime(sec: number) {
  const centis = Math.round(sec * 100);
  return `${Math.floor(centis / 360000)}:${String(Math.floor(centis / 6000) % 60).padStart(2, '0')}:${String(Math.floor(centis / 100) % 60).padStart(2, '0')}.${String(centis % 100).padStart(2, '0')}`;
}
export type Caption = { start: number; end: number; text: string; xPercent?: number; yPercent?: number; fontSize?: number; color?: string };

export async function burnText(videoUrl: unknown, captions: Caption[]) {
  const info = await probeVideo(videoUrl);
  if (!Array.isArray(captions) || captions.length < 1 || captions.length > 300) throw new Error('需要 1–300 条字幕或文字。');
  const lines = captions.map(c => {
    const start = number(c.start, 0, info.duration, '文字开始时间');
    const end = number(c.end, 0, info.duration + 0.05, '文字结束时间');
    if (end <= start) throw new Error('文字结束时间必须晚于开始时间。');
    const x = number(c.xPercent ?? 50, 0, 100, '文字横向位置') * 7.2;
    const y = number(c.yPercent ?? 75, 0, 100, '文字纵向位置') * 12.8;
    const size = number(c.fontSize ?? 42, 12, 150, '文字大小');
    const color = c.color ?? '#FFE600';
    if (!/^#[\da-f]{6}$/i.test(color)) throw new Error('文字颜色应为 #RRGGBB。');
    const bgr = color.slice(5, 7) + color.slice(3, 5) + color.slice(1, 3);
    return `Dialogue: 0,${assTime(start)},${assTime(end)},Default,,0,0,0,,{\\an5\\pos(${x},${y})\\fs${size}\\c&H${bgr}&}${text(c.text)}`;
  });
  const ass = output('ass');
  fs.writeFileSync(ass.file, `[Script Info]\nScriptType: v4.00+\nPlayResX: 720\nPlayResY: 1280\nWrapStyle: 0\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Microsoft YaHei,42,&H0000E6FF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,0,5,25,25,25,1\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${lines.join('\n')}\n`, 'utf8');
  const result = output('mp4');
  // Relative generated filename avoids Windows drive-colon filter escaping.
  const relativeAss = path.relative(process.cwd(), ass.file).split(path.sep).join('/');
  await ffmpeg(['-i', localMediaPath(videoUrl), '-vf', `ass=filename='${relativeAss}'`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart', result.file]);
  return { videoUrl: result.url, artifacts: [
    { url: result.url, kind: 'video', label: '添加文字后的成片' },
    { url: ass.url, kind: 'subtitles', label: 'ASS 字幕文件' },
  ] as Artifact[] };
}

export async function cutVideo(videoUrl: unknown, segments: Array<{ start: number; end: number }>) {
  const info = await probeVideo(videoUrl);
  if (!Array.isArray(segments) || !segments.length || segments.length > 30) throw new Error('剪切需要 1–30 个片段。');
  const filters: string[] = [];
  segments.forEach((s, i) => {
    const start = number(s.start, 0, info.duration, '片段起点');
    const end = number(s.end, 0, info.duration + 0.05, '片段终点');
    if (end <= start) throw new Error('片段终点必须晚于起点。');
    filters.push(`[0:v]trim=start=${start}:end=${end},setpts=PTS-STARTPTS[v${i}]`);
    if (info.hasAudio) filters.push(`[0:a]atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS[a${i}]`);
  });
  filters.push(segments.map((_, i) => `[v${i}]${info.hasAudio ? `[a${i}]` : ''}`).join('') + `concat=n=${segments.length}:v=1:a=${info.hasAudio ? 1 : 0}[v]${info.hasAudio ? '[a]' : ''}`);
  const result = output('mp4');
  await ffmpeg(['-i', localMediaPath(videoUrl), '-filter_complex', filters.join(';'), '-map', '[v]', ...(info.hasAudio ? ['-map', '[a]'] : []), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart', result.file]);
  return { videoUrl: result.url, artifacts: [{ url: result.url, kind: 'video', label: '剪切拼接视频' }] as Artifact[] };
}

export async function renderVertical(videoUrl: unknown) {
  const result = output('mp4');
  await ffmpeg(['-i', localMediaPath(videoUrl), '-vf', 'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:black,setsar=1', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart', result.file]);
  return { videoUrl: result.url, artifacts: [{ url: result.url, kind: 'video', label: '9:16 竖屏成片' }] as Artifact[] };
}

export async function extractFrame(videoUrl: unknown, time: unknown) {
  const info = await probeVideo(videoUrl);
  const sec = number(time, 0, Math.max(0, info.duration - 0.05), '抽帧时间');
  const result = output('jpg');
  await ffmpeg(['-ss', String(sec), '-i', localMediaPath(videoUrl), '-frames:v', '1', '-vf', 'scale=640:-2', result.file]);
  return { imageUrl: result.url, imageDataUrl: `data:image/jpeg;base64,${fs.readFileSync(result.file).toString('base64')}`,
    artifacts: [{ url: result.url, kind: 'image', label: `${sec} 秒画面` }] as Artifact[] };
}

const schema = (name: string, description: string, properties: object, required: string[]) => ({ type: 'function', function: {
  name, description, parameters: { type: 'object', properties: { videoUrl: { type: 'string', description: '输入素材 URL，使用当前素材或前一工具返回的 videoUrl。' }, ...properties }, required: ['videoUrl', ...required], additionalProperties: false },
} });
const n = { type: 'number' };
export const mediaToolDefinitions = [
  schema('probe_video', '读取真实视频时长、宽高和音轨；剪辑前先调用。', {}, []),
  schema('extract_frame', '抽取指定秒数的真实画面供观察，不能凭空编造画面。', { time: n }, ['time']),
  schema('cut_video', '按 segments 顺序精确剪切并拼接，保留音轨。时间均为输入视频的秒数。', { segments: { type: 'array', items: { type: 'object', properties: { start: n, end: n }, required: ['start', 'end'] } } }, ['segments']),
  schema('render_vertical', '将素材等比缩放居中加黑边为 720x1280 竖屏，保留音轨。应先转竖屏再加文字。', {}, []),
  schema('add_text', '烧录标题或字幕到实际视频像素。captions 的时间基于当前输入视频，x/y 是百分比，字号以720x1280为基准；可同时加顶部标题和多条字幕。', {
    captions: { type: 'array', items: { type: 'object', properties: { start: n, end: n, text: { type: 'string' }, xPercent: n, yPercent: n, fontSize: n, color: { type: 'string', description: '#RRGGBB' } }, required: ['start', 'end', 'text'] } },
  }, ['captions']),
];

export async function executeMediaTool(name: string, args: Record<string, any>) {
  switch (name) {
    case 'probe_video': return probeVideo(args.videoUrl);
    case 'extract_frame': return extractFrame(args.videoUrl, args.time);
    case 'cut_video': return cutVideo(args.videoUrl, args.segments);
    case 'render_vertical': return renderVertical(args.videoUrl);
    case 'add_text': return burnText(args.videoUrl, args.captions);
    default: throw new Error('未授权的工具名称。');
  }
}
