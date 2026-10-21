import React, { useEffect, useState } from 'react';

type Status = { configured: boolean; model: string; baseUrl: string; ffmpegInstalled: boolean; ffprobeInstalled: boolean };
type Result = { ok: boolean; summary: string; steps: Array<{ tool: string; ok: boolean; detail: string }>; artifacts: Array<{ url: string; kind: string; label: string }> };
export function EditingAgent({ videoUrl }: { videoUrl: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [instruction, setInstruction] = useState('保留前10秒，转成9:16竖屏，顶部加标题“精彩瞬间”，前3秒加黄色字幕“故事开始了”。');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const loadStatus = async () => {
    try {
      const response = await fetch('/api/agent/status');
      if (!response.ok) throw new Error('无法读取 AI 配置，请确认服务已启动。');
      setStatus(await response.json());
    } catch (e) { setError(e instanceof Error ? e.message : '无法读取配置'); }
  };
  useEffect(() => { void loadStatus(); }, []);
  const run = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setResult(null);
    try {
      const response = await fetch('/api/agent/run', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction, videoUrl }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '任务执行失败');
      setResult(data);
    } catch (e) { setError(e instanceof Error ? e.message : '任务执行失败'); }
    finally { setBusy(false); void loadStatus(); }
  };
  return <section className="bg-white border border-blue-200 rounded-2xl p-5 space-y-3 shadow-xs" aria-label="Agnes 剪辑 Agent">
    <div className="flex justify-between items-start gap-3">
      <div><h2 className="font-bold text-blue-900">Agnes 剪辑 Agent</h2>
        <p className="text-xs text-slate-500 mt-1">视频信息 · 抽帧看图 · 精确剪切拼接 · 标题与字幕烧录 · 竖屏导出</p></div>
      <button type="button" onClick={loadStatus} className="text-xs text-blue-700 underline shrink-0">刷新配置</button>
    </div>
    <p className="text-xs text-slate-600 break-all">模型：{status?.model || '读取中'} · {status?.configured ? 'Key 已配置' : '请填写 .env 中的 AGNES_API_KEY'}<br/>
      {status?.baseUrl}<br/>FFmpeg / FFprobe：{status?.ffmpegInstalled && status?.ffprobeInstalled ? '已就绪' : '检查中或未安装'} · 朗读使用浏览器语音</p>
    <p className="text-xs text-slate-500">先上传本机视频。Agent 会在本机执行工具；抽帧分析会将所选画面发送给 Agnes。保存 Key 后点击刷新配置即可。</p>
    <form onSubmit={run} className="space-y-2">
      <label className="text-sm font-medium" htmlFor="edit-agent-instruction">告诉 Agent 怎么剪</label>
      <textarea id="edit-agent-instruction" rows={3} maxLength={6000} value={instruction} onChange={e => setInstruction(e.target.value)}
        className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-blue-500" />
      <button disabled={busy || !status?.configured || !instruction.trim()} className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50">
        {busy ? 'Agent 正在执行剪辑，请稍候…' : '执行剪辑任务'}
      </button>
    </form>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {result && <div className="space-y-2 text-sm">
      <p className={result.ok ? 'text-blue-900' : 'text-amber-800'}>{result.ok ? '任务结束' : '任务未全部完成'}：{result.summary}</p>
      <ol className="text-xs text-slate-500 space-y-1">{result.steps.map((step, i) => <li key={i}>{i + 1}. {step.tool}：{step.ok ? '已完成' : step.detail}</li>)}</ol>
      <div className="flex gap-2 flex-wrap">{result.artifacts.map(file => <a key={file.url} href={file.url} target="_blank" rel="noreferrer" download className="text-blue-700 underline">下载{file.label}</a>)}</div>
      {result.artifacts.filter(a => a.kind === 'video').slice(-1).map(file => <video key={file.url} src={file.url} controls className="w-full max-h-96 rounded-lg bg-black" />)}
    </div>}
  </section>;
}
