import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { burnText, cutVideo, extractFrame, localMediaPath, probeVideo, renderVertical } from './mediaTools';
import { runEditAgent } from './editAgent';
import { type ChatMessage } from './agnes';
const exec = promisify(execFile);

test('real media tools preserve audio, cut in requested order, render 9:16 and burn Chinese captions', async () => {
  fs.mkdirSync('public/assets/uploads', { recursive: true });
  const sourceUrl = `/assets/uploads/test-${randomUUID()}.mp4`;
  const sourcePath = path.join('public', sourceUrl.slice(1));
  const created = [sourcePath];
  const remember = (result: { artifacts: Array<{ url: string }> }) => {
    created.push(...result.artifacts.map(a => path.join('public', a.url.slice(1))));
  };
  try {
    await exec('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=0x1040a0:s=320x240:r=25:d=4',
      '-f', 'lavfi', '-i', 'sine=frequency=440:duration=4', '-vf', "drawbox=color=red:t=fill:enable='gte(t,2)'", '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', sourcePath]);
    const cut = await cutVideo(sourceUrl, [{ start: 2, end: 3 }, { start: 0, end: 1 }]); remember(cut);
    const info = await probeVideo(cut.videoUrl);
    assert.ok(Math.abs(info.duration - 2) < 0.2);
    assert.equal(info.hasAudio, true);
    for (const [time, redFirst] of [[0.5, true], [1.5, false]] as const) {
      const { stdout: pixel } = await exec('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-ss', String(time), '-i', localMediaPath(cut.videoUrl), '-frames:v', '1', '-vf', 'scale=1:1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { encoding: 'buffer' });
      assert.equal(pixel[0] > pixel[2], redFirst, 'Output segments must follow the requested order');
    }
    const vertical = await renderVertical(cut.videoUrl); remember(vertical);
    const verticalInfo = await probeVideo(vertical.videoUrl);
    assert.deepEqual([verticalInfo.width, verticalInfo.height], [720, 1280]);
    const captioned = await burnText(vertical.videoUrl, [{ start: 0, end: 1.8, text: '中文测试：剪切与字幕', yPercent: 50, fontSize: 48 }]); remember(captioned);
    assert.equal((await probeVideo(captioned.videoUrl)).hasAudio, true);
    const { stdout } = await exec('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-ss', '0.5', '-i', localMediaPath(captioned.videoUrl), '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { encoding: 'buffer', maxBuffer: 8 * 1024 * 1024 });
    let yellow = 0;
    for (let i = 0; i < stdout.length; i += 3) if (stdout[i] > 180 && stdout[i + 1] > 130 && stdout[i + 2] < 100) yellow++;
    assert.ok(yellow > 300, `Expected real yellow subtitle pixels, got ${yellow}`);
    const frame = await extractFrame(captioned.videoUrl, 0.5); remember(frame);
    assert.ok(frame.imageDataUrl.startsWith('data:image/jpeg;base64,'));

    let calls = 0;
    const result = await runEditAgent('检查视频', sourceUrl, async (messages, tools) => {
      assert.ok(tools?.length);
      if (calls++ === 0) return { role: 'assistant', content: null, tool_calls: [{ id: 'probe-1', type: 'function', function: { name: 'probe_video', arguments: JSON.stringify({ videoUrl: sourceUrl }) } }] };
      const reply = messages.find(m => m.role === 'tool' && m.tool_call_id === 'probe-1');
      assert.equal(JSON.parse(reply!.content as string).hasAudio, true);
      return { role: 'assistant', content: '真实视频检查完成。' } as ChatMessage;
    });
    assert.equal(result.ok, true);
    assert.equal(result.steps[0].tool, 'probe_video');
    assert.equal(calls, 2);
    await assert.rejects(cutVideo(sourceUrl, [{ start: 2, end: 1 }]), /终点/);
    assert.throws(() => localMediaPath('/assets/../../.env'), /不存在|超出/);
    assert.throws(() => localMediaPath('https://example.com/video.mp4'), /上传/);
  } finally {
    for (const file of created) if (fs.existsSync(file)) fs.unlinkSync(file);
  }
});

test('agent rejects unknown tools and records their failure without pretending success', async () => {
  const fixture = '/assets/uploads/tool-test.mp4';
  fs.mkdirSync('public/assets/uploads', { recursive: true });
  const file = path.join('public', fixture.slice(1));
  fs.writeFileSync(file, 'fixture');
  try {
    let turn = 0;
    const result = await runEditAgent('测试', fixture, async messages => {
      if (turn++ === 0) return { role: 'assistant', content: null, tool_calls: [{ id: 'bad', type: 'function', function: { name: 'run_shell', arguments: '{}' } }] };
      assert.match(messages.find(m => m.role === 'tool')?.content as string, /未授权/);
      return { role: 'assistant', content: '工具不可用。' };
    });
    assert.equal(result.ok, false);
    assert.deepEqual(result.artifacts, []);
  } finally { fs.unlinkSync(file); }
});
