import React, { useState } from 'react';
import {
  Upload,
  Globe,
  VolumeX,
  Mic,
  Sliders,
  Type as TypeIcon,
  RotateCcw,
} from 'lucide-react';
import {
  type MainFrameRatio,
  type MainFrameConfig,
  type TemplateLayer,
  type MaterialSourceItem,
  type NarrationMode,
  type CodexCliConfig,
  DEFAULT_MAIN_FRAME_CONFIG,
} from '../utils/pipelineLogic';

interface LeftTemplateConfigProps {
  materials: MaterialSourceItem[];
  selectedMaterialId: string;
  onSelectMaterial: (id: string) => void;
  narrationMode: NarrationMode;
  onChangeNarrationMode: (mode: NarrationMode) => void;
  ttsVoiceName: CodexCliConfig['ttsVoiceName'];
  onChangeTtsVoice: (voice: CodexCliConfig['ttsVoiceName']) => void;
  onAgentCrawlMaterial: (query: string) => Promise<void>;
  onUploadLocalVideo: (file: File) => void;
  isCrawling: boolean;
  mainFrameConfig: MainFrameConfig;
  onChangeMainFrameConfig: (config: MainFrameConfig) => void;
  templateLayers: TemplateLayer[];
  onUpdateLayer: (id: string, patch: Partial<TemplateLayer>) => void;
  onResetTemplate: () => void;
  onApplyPresetTemplate: (preset: 'kids-doc' | 'giraffe-science' | 'suspense-hook') => void;
}

export const LeftTemplateConfig: React.FC<LeftTemplateConfigProps> = ({
  materials,
  selectedMaterialId,
  onSelectMaterial,
  narrationMode,
  onChangeNarrationMode,
  ttsVoiceName,
  onChangeTtsVoice,
  onAgentCrawlMaterial,
  onUploadLocalVideo,
  isCrawling,
  mainFrameConfig,
  onChangeMainFrameConfig,
  templateLayers,
  onUpdateLayer,
  onResetTemplate,
  onApplyPresetTemplate,
}) => {
  const [crawlQuery, setCrawlQuery] = useState('《屎壳郎推球》的儿童纪录片');
  const [crawlError, setCrawlError] = useState('');

  const selectedMaterial =
    materials.find((m) => m.id === selectedMaterialId) || materials[0];

  const headerLayer = templateLayers.find((l) => l.role === 'header') || templateLayers[0];
  const footerLayer = templateLayers.find((l) => l.role === 'footer') || templateLayers[2];
  const subtitleLayer = templateLayers.find((l) => l.role === 'subtitle-anchor') || templateLayers[1];

  const handleCrawlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlQuery.trim()) {
      setCrawlError('请输入想要 Agent 抓取的视频主题或关键词');
      return;
    }
    setCrawlError('');
    await onAgentCrawlMaterial(crawlQuery.trim());
  };

  const mainFrameRatios: { value: MainFrameRatio; label: string }[] = [
    { value: '4:3', label: '4:3 经典居中' },
    { value: '16:9', label: '16:9 宽屏居中' },
    { value: '1:1', label: '1:1 方形居中' },
    { value: '9:16', label: '9:16 全屏铺满' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Step 1: Select Video & Narration Mode */}
      <section
        id="step-source"
        aria-label="第一步：选择视频素材与解说模式"
        className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs"
      >
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <h2 className="text-base font-bold text-slate-900">
            第一步：选视频素材与解说模式
          </h2>
          <span className="text-xs text-blue-600 font-medium">
            支持联网抓取纪录片源并从零生成剪映成片
          </span>
        </div>

        {/* Material Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {materials.map((item) => {
            const active = item.id === selectedMaterialId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectMaterial(item.id)}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  active
                    ? 'bg-blue-50/90 border-blue-600 ring-1 ring-blue-600'
                    : 'bg-slate-50/70 border-slate-200 hover:border-blue-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {item.title}
                  </span>
                </div>
                <div className="text-xs text-blue-700 font-medium mt-1">
                  {item.targetOutputLabel}
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Quick Upload or Agent Live Web Crawl Bar */}
        <div className="flex flex-col sm:flex-row gap-2 mb-3 pt-3 border-t border-slate-100">
          <label
            htmlFor="local-video-upload"
            className="flex items-center justify-center gap-1.5 py-2 px-3.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>上传本机视频 (.mp4)</span>
            <input
              id="local-video-upload"
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadLocalVideo(file);
              }}
            />
          </label>

          <form onSubmit={handleCrawlSubmit} className="flex-1 flex gap-2" noValidate>
            <input
              type="text"
              aria-label="输入关键词让 Agent 抓取视频"
              value={crawlQuery}
              onChange={(e) => {
                setCrawlQuery(e.target.value);
                if (crawlError) setCrawlError('');
              }}
              placeholder="输入主题让 Agent 联网抓取纪录片源（如：《屎壳郎推球》的儿童纪录片）"
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
            <button
              type="submit"
              disabled={isCrawling}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isCrawling ? '联网抓取抽帧中...' : 'Agent 抓取并从零生成'}</span>
            </button>
          </form>
        </div>
        {crawlError && (
          <p role="alert" className="text-xs text-rose-600 mb-3">
            {crawlError}
          </p>
        )}

        {/* Show Real Discovered Video Sources when a crawled material is active */}
        {selectedMaterial.crawlOriginUrls && selectedMaterial.crawlOriginUrls.length > 0 && (
          <div className="mb-3 p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs text-slate-700 space-y-1">
            <div className="font-semibold text-blue-900">
              Agent 已联网检索并通过 FFmpeg 拼接抽帧的实拍片源：
            </div>
            <ul className="space-y-0.5 text-[11px] font-mono-tabular text-slate-600">
              {selectedMaterial.crawlOriginUrls.map((src, i) => (
                <li key={i} className="truncate">
                  {i + 1}. {src}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Narration Mode Switch (Silent Yellow vs Full TTS) */}
        <div className="pt-3 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-700 mb-2">
            选择解说产出模式（切换后 Agent 会改写对应风格的稿子）：
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onChangeNarrationMode('silent-yellow')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                narrationMode === 'silent-yellow'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
              }`}
            >
              <VolumeX className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold">
                  静默文字解说（同毛毛虫母本）
                </div>
                <div
                  className={`text-[11px] mt-0.5 ${
                    narrationMode === 'silent-yellow' ? 'text-blue-100' : 'text-slate-500'
                  }`}
                >
                  无配音，保留原片音效 + 关键帧搞笑黄字（如“回家睡觉”）
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onChangeNarrationMode('tts-voiceover')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                narrationMode === 'tts-voiceover'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
              }`}
            >
              <Mic className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold">
                  TTS 全程配音解说（同长颈鹿母本）
                </div>
                <div
                  className={`text-[11px] mt-0.5 ${
                    narrationMode === 'tts-voiceover' ? 'text-blue-100' : 'text-slate-500'
                  }`}
                >
                  全程 AI 语音旁白朗读 + 科普叙事双行字幕
                </div>
              </div>
            </button>
          </div>

          {narrationMode === 'tts-voiceover' && (
            <div className="mt-3 flex items-center justify-between gap-3 bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-2">
              <label htmlFor="tts-voice-select" className="text-xs font-medium text-blue-900">
                TTS 全程配音音色选择：
              </label>
              <select
                id="tts-voice-select"
                value={ttsVoiceName}
                onChange={(e) =>
                  onChangeTtsVoice(e.target.value as CodexCliConfig['ttsVoiceName'])
                }
                className="px-2.5 py-1 text-xs bg-white border border-blue-200 rounded-md text-slate-800 font-medium"
              >
                <option value="Kore">Kore · 沉稳纪录片旁白（默认）</option>
                <option value="Puck">Puck · 活力少儿故事科普</option>
                <option value="Charon">Charon · 磁性自然解说</option>
                <option value="Zephyr">Zephyr · 轻快亲切女声</option>
              </select>
            </div>
          )}
        </div>
      </section>

      {/* Step 2: Simplified Main Frame Ratio & Text Template */}
      <section
        id="step-template"
        aria-label="第二步：调整主画面比例与文字模板"
        className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs"
      >
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              第二步：调主画面比例与文字模板
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              onChangeMainFrameConfig(DEFAULT_MAIN_FRAME_CONFIG);
              onResetTemplate();
            }}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复默认</span>
          </button>
        </div>

        {/* Main Frame Aspect Ratio Row */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">
              中间主画面比例（默认外框 9:16 抖音竖屏）：
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {mainFrameRatios.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() =>
                  onChangeMainFrameConfig({
                    ...mainFrameConfig,
                    mainFrameRatio: r.value,
                  })
                }
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                  mainFrameConfig.mainFrameRatio === r.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template Quick Presets */}
        <div className="mb-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <TypeIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>一键套用模板风格（不同模板将触发不同写稿角度）：</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onApplyPresetTemplate('kids-doc')}
              className="py-1.5 px-2.5 text-xs font-medium bg-blue-50/70 hover:bg-blue-100/80 text-blue-800 border border-blue-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              少儿纪录片模板
            </button>
            <button
              type="button"
              onClick={() => onApplyPresetTemplate('giraffe-science')}
              className="py-1.5 px-2.5 text-xs font-medium bg-blue-50/70 hover:bg-blue-100/80 text-blue-800 border border-blue-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              科普十万个为什么
            </button>
            <button
              type="button"
              onClick={() => onApplyPresetTemplate('suspense-hook')}
              className="py-1.5 px-2.5 text-xs font-medium bg-blue-50/70 hover:bg-blue-100/80 text-blue-800 border border-blue-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              高能反转悬念模板
            </button>
          </div>
        </div>

        {/* Simple Direct Text Inputs for Header & Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label
              htmlFor="header-template-input"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              顶部标题文字（可在左侧画布直接拖拽位置）
            </label>
            <textarea
              id="header-template-input"
              rows={2}
              value={headerLayer.text}
              onChange={(e) => onUpdateLayer(headerLayer.id, { text: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label
              htmlFor="footer-template-input"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              底部合集引导语（可在左侧画布直接拖拽位置）
            </label>
            <textarea
              id="footer-template-input"
              rows={2}
              value={footerLayer.text}
              onChange={(e) => onUpdateLayer(footerLayer.id, { text: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Subtitle Y-position quick slider */}
        {subtitleLayer && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4">
            <label
              htmlFor="subtitle-y-slider"
              className="text-xs font-medium text-slate-600 whitespace-nowrap"
            >
              解说字幕上下位置 ({subtitleLayer.yPercent}%)：
            </label>
            <input
              id="subtitle-y-slider"
              type="range"
              min={20}
              max={85}
              step={0.5}
              value={subtitleLayer.yPercent}
              onChange={(e) =>
                onUpdateLayer(subtitleLayer.id, { yPercent: Number(e.target.value) })
              }
              className="flex-1 accent-blue-600 cursor-pointer"
            />
          </div>
        )}
      </section>
    </div>
  );
};
