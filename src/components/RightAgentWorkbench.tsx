import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  Plus,
  Mic,
  Terminal,
  FileCode,
  FileText,
  Film,
  Scissors,
} from 'lucide-react';
import {
  type CodexCliConfig,
  type MainFrameConfig,
  type MaterialSourceItem,
  type StoryBeat,
  type TemplateLayer,
  buildCodexCliCommand,
  buildJianyingDraftJson,
  formatYellowQuote,
} from '../utils/pipelineLogic';

interface RightAgentWorkbenchProps {
  codexConfig: CodexCliConfig;
  mainFrameConfig: MainFrameConfig;
  templateLayers: TemplateLayer[];
  currentMaterial: MaterialSourceItem;
  beats: StoryBeat[];
  selectedBeatId: string;
  onSelectBeat: (beat: StoryBeat) => void;
  onSeekToBeat: (beat: StoryBeat) => void;
  onUpdateBeat: (id: string, patch: Partial<StoryBeat>) => void;
  onAddBeatAtCurrentTime: (yellowText: string, observation: string) => void;
  onRunAgentPipeline: () => Promise<void>;
  isRunningPipeline: boolean;
  pipelineSummary: string;
  currentTimeSec: number;
  onPlayTtsForBeat: (beat: StoryBeat) => Promise<void>;
  isPlayingTts: boolean;
  onOpenBundleModal: () => void;
}

export const RightAgentWorkbench: React.FC<RightAgentWorkbenchProps> = ({
  codexConfig,
  mainFrameConfig,
  templateLayers,
  currentMaterial,
  beats,
  selectedBeatId,
  onSelectBeat,
  onSeekToBeat,
  onUpdateBeat,
  onAddBeatAtCurrentTime,
  onRunAgentPipeline,
  isRunningPipeline,
  pipelineSummary,
  currentTimeSec,
  onPlayTtsForBeat,
  isPlayingTts,
  onOpenBundleModal,
}) => {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [newBeatText, setNewBeatText] = useState('');
  const [newBeatError, setNewBeatError] = useState('');
  const [isRenderingMp4, setIsRenderingMp4] = useState(false);
  const [renderedMp4Url, setRenderedMp4Url] = useState<string | null>(null);

  const headerLayer = templateLayers.find((l) => l.role === 'header');
  const cliCommand = buildCodexCliCommand(
    codexConfig,
    mainFrameConfig,
    currentMaterial.title,
    headerLayer?.text || ''
  );

  const isTtsMode = codexConfig.narrationMode === 'tts-voiceover';

  const handleCopyCommand = () => {
    navigator.clipboard?.writeText(cliCommand).catch(() => {});
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 1800);
  };

  const handleAddBeatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBeatText.trim()) {
      setNewBeatError('请输入解说字幕内容');
      return;
    }
    setNewBeatError('');
    onAddBeatAtCurrentTime(
      newBeatText.trim(),
      `第 ${currentTimeSec.toFixed(1)} 秒关键画面节点`
    );
    setNewBeatText('');
  };

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJianyingDraft = () => {
    const draftJson = buildJianyingDraftJson(
      currentMaterial,
      mainFrameConfig,
      templateLayers,
      beats,
      codexConfig.narrationMode
    );
    downloadFile(
      'draft_content.json',
      JSON.stringify(draftJson, null, 2),
      'application/json'
    );
  };

  const handleRenderMp4 = async () => {
    setIsRenderingMp4(true);
    try {
      const res = await fetch('/api/export/render-mp4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: currentMaterial.videoUrl }),
      });
      const data = await res.json();
      if (data.ok && data.downloadUrl) {
        setRenderedMp4Url(data.downloadUrl);
      }
    } finally {
      setIsRenderingMp4(false);
    }
  };

  const handleExportShellScript = () => {
    const scriptLines = [
      '#!/usr/bin/env bash',
      `# ClipPulse Studio - 本机 Codex CLI 自动化剪辑脚本 (${isTtsMode ? 'TTS全程配音解说' : '静默趣味黄字'})`,
      `# 视频源: ${currentMaterial.title}`,
      'set -e',
      'INPUT_VIDEO="${1:-./input_video.mp4}"',
      `OUTPUT_DIR="${codexConfig.workspaceDir}"`,
      'mkdir -p "$OUTPUT_DIR"',
      cliCommand,
    ];
    downloadFile('run_codex_clip.sh', scriptLines.join('\n'), 'text/x-shellscript');
  };

  const handleExportSrt = () => {
    const toSrtTime = (sec: number) => {
      const hrs = Math.floor(sec / 3600);
      const mins = Math.floor((sec % 3600) / 60);
      const secs = Math.floor(sec % 60);
      const ms = Math.floor((sec % 1) * 1000);
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    };

    const srtBlocks = beats.map((b, idx) => {
      const text = isTtsMode
        ? b.yellowSubtitle
        : formatYellowQuote(b.yellowSubtitle, codexConfig.yellowQuoteStyle);
      return `${idx + 1}\n${toSrtTime(b.subtitleStartSec)} --> ${toSrtTime(b.subtitleEndSec)}\n${text}\n`;
    });

    downloadFile('subtitles.srt', srtBlocks.join('\n'), 'text/plain');
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <section
      id="step-script"
      aria-label="第三步：Agent 专属解说稿与一键导出"
      className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs flex flex-col gap-4"
    >
      {/* Header & 1-Click Tailored Script Generator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            第三步：Agent 专属解说稿与剪映成片导出
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            当前为「{currentMaterial.title}」· {isTtsMode ? 'TTS 全程配音科普稿' : '静默趣味黄字吐槽稿'}
          </p>
        </div>

        <button
          type="button"
          onClick={onRunAgentPipeline}
          disabled={isRunningPipeline}
          className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {isRunningPipeline
              ? 'Agent 正在根据视频与模板写稿...'
              : '按当前视频与模板重写解说稿'}
          </span>
        </button>
      </div>

      {/* Status Summary Banner */}
      {pipelineSummary && (
        <div className="px-3.5 py-2.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-900 leading-relaxed">
          {pipelineSummary}
        </div>
      )}

      {/* Clean Interactive Script Beats List (with real extracted keyframe thumbnails when crawled) */}
      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
        {beats.map((beat) => {
          const isSelected = beat.id === selectedBeatId;
          return (
            <div
              key={beat.id}
              onClick={() => {
                onSelectBeat(beat);
                onSeekToBeat(beat);
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                isSelected
                  ? 'bg-blue-50/60 border-blue-500 ring-1 ring-blue-500'
                  : 'bg-slate-50/60 border-slate-200 hover:border-blue-300 hover:bg-white'
              }`}
            >
              {/* Extracted Keyframe Thumbnail if available */}
              {beat.frameThumbnailUrl && (
                <div className="w-24 h-18 rounded-lg overflow-hidden bg-slate-900 border border-slate-200 shrink-0 self-start">
                  <img
                    src={beat.frameThumbnailUrl}
                    alt={`关键帧 #${beat.index}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 text-xs font-mono-tabular text-slate-500">
                    <span className="font-bold text-blue-700">#{beat.index}</span>
                    <span>
                      {formatSec(beat.subtitleStartSec)} - {formatSec(beat.subtitleEndSec)}
                    </span>
                    {beat.isThreeSecHook && (
                      <span className="text-blue-600 font-sans font-semibold">
                        · 前3秒抓眼球开头
                      </span>
                    )}
                  </div>

                  {isTtsMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTtsForBeat(beat);
                      }}
                      disabled={isPlayingTts}
                      className="px-2 py-0.5 text-[11px] font-medium bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-md flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Mic className="w-3 h-3 text-blue-600" />
                      <span>朗读本句</span>
                    </button>
                  )}
                </div>

                {/* Frame Visual Observation */}
                <div className="text-[11px] text-slate-500 mb-1.5">
                  画面识别：{beat.frameObservation}
                </div>

                {/* Editable Script Input */}
                <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    aria-label={`编辑镜头 #${beat.index} 屏幕字幕`}
                    value={beat.yellowSubtitle.replace(/\n/g, ' ')}
                    onChange={(e) =>
                      onUpdateBeat(beat.id, { yellowSubtitle: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600"
                  />

                  {isTtsMode && (
                    <input
                      type="text"
                      aria-label={`编辑镜头 #${beat.index} TTS旁白配音词`}
                      value={beat.ttsNarrationText || beat.yellowSubtitle.replace(/\n/g, '，')}
                      onChange={(e) =>
                        onUpdateBeat(beat.id, { ttsNarrationText: e.target.value })
                      }
                      placeholder="TTS 全程旁白朗读词..."
                      className="w-full px-2.5 py-1.5 text-xs bg-blue-50/40 border border-blue-200/80 rounded-lg text-blue-950 focus:outline-none focus:border-blue-600"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Beat Inline Form */}
      <form onSubmit={handleAddBeatSubmit} className="pt-2 border-t border-slate-100" noValidate>
        <div className="flex gap-2">
          <input
            type="text"
            aria-label="在当前时间点新增解说词"
            value={newBeatText}
            onChange={(e) => {
              setNewBeatText(e.target.value);
              if (newBeatError) setNewBeatError('');
            }}
            placeholder={`在当前进度 (${currentTimeSec.toFixed(1)}s) 插入新解说字幕...`}
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
          />
          <button
            type="submit"
            className="flex items-center gap-1 px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>新增一句</span>
          </button>
        </div>
        {newBeatError && (
          <p role="alert" className="text-xs text-rose-600 mt-1">
            {newBeatError}
          </p>
        )}
      </form>

      {/* Jianying Draft, FFmpeg Render, and Local Codex CLI Export */}
      <div className="pt-3 border-t border-slate-100 space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleExportJianyingDraft}
            className="py-2.5 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>导出剪映草稿工程 (draft_content.json)</span>
          </button>

          <button
            type="button"
            onClick={handleRenderMp4}
            disabled={isRenderingMp4}
            className="py-2.5 px-3 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Film className="w-3.5 h-3.5" />
            <span>
              {isRenderingMp4 ? 'FFmpeg 正在合成竖屏成片...' : 'FFmpeg 合成 9:16 竖屏成片 (.mp4)'}
            </span>
          </button>
        </div>

        {renderedMp4Url && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
            <span>FFmpeg 已完成 9:16 竖屏视频渲染合成（720×1280 MP4）</span>
            <a
              href={renderedMp4Url}
              download="clippulse_9x16_output.mp4"
              className="font-semibold text-blue-700 hover:underline whitespace-nowrap"
            >
              点击下载 .mp4 成片
            </a>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <Terminal className="w-4 h-4 text-blue-600 shrink-0" />
            <code className="text-[11px] font-mono-tabular text-slate-600 truncate">
              {cliCommand}
            </code>
          </div>
          <button
            type="button"
            onClick={handleCopyCommand}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer whitespace-nowrap shrink-0"
          >
            {copiedCmd ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>复制 Codex 命令</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleExportShellScript}
            className="py-2 px-3 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-600" />
            <span>下载本机 Codex 批处理 (.sh)</span>
          </button>

          <button
            type="button"
            onClick={handleExportSrt}
            className="py-2 px-3 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>导出成片字幕 (.srt)</span>
            <Download className="w-3 h-3" />
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenBundleModal}
          className="w-full py-2.5 px-3.5 text-xs font-semibold bg-blue-50/90 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>打包下载本地运行完整工程压缩包 (clippulse-studio-local.zip + README.md)</span>
        </button>
      </div>
    </section>
  );
};
