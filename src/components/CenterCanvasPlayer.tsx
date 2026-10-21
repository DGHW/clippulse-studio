import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Camera,
  SkipBack,
  Eye,
  Mic,
} from 'lucide-react';
import {
  type MainFrameConfig,
  type TemplateLayer,
  type StoryBeat,
  type CodexCliConfig,
  type NarrationMode,
  computeMainFrameRect,
  getActiveSubtitleAtTime,
  formatYellowQuote,
} from '../utils/pipelineLogic';

interface CenterCanvasPlayerProps {
  videoUrl: string;
  hasBakedInBars?: boolean;
  narrationMode: NarrationMode;
  mainFrameConfig: MainFrameConfig;
  templateLayers: TemplateLayer[];
  selectedLayerId: string;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, patch: Partial<TemplateLayer>) => void;
  beats: StoryBeat[];
  selectedBeatId: string;
  onSelectBeat: (beat: StoryBeat) => void;
  currentTimeSec: number;
  onTimeUpdate: (sec: number) => void;
  yellowQuoteStyle: CodexCliConfig['yellowQuoteStyle'];
  onCaptureFrameForAgent: (imageBase64: string, timestampSec: number) => Promise<void>;
  isAnalyzingFrame: boolean;
  onPlayTtsForBeat: (beat: StoryBeat) => Promise<void>;
  isPlayingTts: boolean;
  externalSeekRequest: { timeSec: number; nonce: number } | null;
}

export const CenterCanvasPlayer: React.FC<CenterCanvasPlayerProps> = ({
  videoUrl,
  hasBakedInBars = true,
  narrationMode,
  mainFrameConfig,
  templateLayers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  beats,
  currentTimeSec,
  onTimeUpdate,
  yellowQuoteStyle,
  onCaptureFrameForAgent,
  isAnalyzingFrame,
  onPlayTtsForBeat,
  isPlayingTts,
  externalSeekRequest,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasStageRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [durationSec, setDurationSec] = useState(71.5);
  const [cleanCropMode, setCleanCropMode] = useState(true);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);

  const frameRect = computeMainFrameRect(mainFrameConfig);

  const subtitleAnchorLayer = templateLayers.find(
    (l) => l.role === 'subtitle-anchor'
  );

  // In TTS mode, do not wrap subtitles in quotes unless explicitly requested
  const effectiveQuoteStyle =
    narrationMode === 'tts-voiceover' ? 'plain' : yellowQuoteStyle;

  const activeSubInfo = getActiveSubtitleAtTime(
    beats,
    currentTimeSec,
    subtitleAnchorLayer,
    effectiveQuoteStyle
  );

  useEffect(() => {
    if (externalSeekRequest && videoRef.current) {
      videoRef.current.currentTime = externalSeekRequest.timeSec;
      onTimeUpdate(externalSeekRequest.timeSec);
    }
  }, [externalSeekRequest]);

  // Reset play state when switching video URL
  useEffect(() => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    onTimeUpdate(0);
  }, [videoUrl]);

  // Dragging text layers directly on the 9:16 preview
  useEffect(() => {
    if (!draggingLayerId) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!canvasStageRef.current) return;
      const rect = canvasStageRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const rawX = ((e.clientX - rect.left) / rect.width) * 100;
      const rawY = ((e.clientY - rect.top) / rect.height) * 100;

      const clampedX = Math.min(92, Math.max(8, Number(rawX.toFixed(1))));
      const clampedY = Math.min(94, Math.max(6, Number(rawY.toFixed(1))));

      onUpdateLayer(draggingLayerId, {
        xPercent: clampedX,
        yPercent: clampedY,
      });
    };

    const handlePointerUp = () => {
      setDraggingLayerId(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingLayerId, onUpdateLayer]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const seekTo = (sec: number) => {
    const v = videoRef.current;
    const clamped = Math.max(0, Math.min(durationSec, sec));
    if (v) {
      v.currentTime = clamped;
    }
    onTimeUpdate(clamped);
  };

  const handleCaptureCurrentFrame = async () => {
    const v = videoRef.current;
    let base64 = '';
    if (v && v.videoWidth > 0 && v.videoHeight > 0) {
      try {
        const offscreen = document.createElement('canvas');
        offscreen.width = 480;
        offscreen.height = Math.round((480 * v.videoHeight) / v.videoWidth);
        const ctx = offscreen.getContext('2d');
        if (ctx) {
          ctx.drawImage(v, 0, 0, offscreen.width, offscreen.height);
          base64 = offscreen.toDataURL('image/jpeg', 0.82);
        }
      } catch {
        // Ignore cross-origin fallback
      }
    }
    if (!base64) {
      base64 =
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    }
    await onCaptureFrameForAgent(base64, currentTimeSec);
  };

  const formatTimecode = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getCanvasDimensionsStyle = (): React.CSSProperties => {
    switch (mainFrameConfig.canvasRatio) {
      case '9:16':
        return { width: '324px', height: '576px' };
      case '3:4':
        return { width: '360px', height: '480px' };
      case '16:9':
        return { width: '480px', height: '270px' };
      case '1:1':
        return { width: '360px', height: '360px' };
    }
  };

  const displayedSubtitle =
    activeSubInfo.formattedText ||
    (activeSubInfo.beat
      ? formatYellowQuote(activeSubInfo.beat.yellowSubtitle, effectiveQuoteStyle)
      : subtitleAnchorLayer?.text || '');

  const currentBeat = activeSubInfo.beat || beats[0];

  return (
    <section
      id="canvas-preview"
      aria-label="竖屏成片实时预览画布"
      className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs flex flex-col gap-4 sticky top-20"
    >
      {/* Clean Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            竖屏成片实时预演
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            可直接用鼠标在黑框画布上拖拽标题或字幕位置
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCleanCropMode((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
              cleanCropMode
                ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{cleanCropMode ? '实时模板合成' : '原片对比'}</span>
          </button>

          <button
            type="button"
            onClick={handleCaptureCurrentFrame}
            disabled={isAnalyzingFrame}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isAnalyzingFrame ? '看画面写稿中...' : '抽当前帧写解说'}</span>
          </button>
        </div>
      </div>

      {/* Mode & Ratio Info Line */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        <span>
          模式：
          <strong className="text-blue-700">
            {narrationMode === 'tts-voiceover'
              ? 'TTS 全程语音解说（配音+双行字幕）'
              : '静默文字解说（无配音+搞笑黄字）'}
          </strong>
        </span>
        <span className="font-mono-tabular text-slate-500">
          外框 {mainFrameConfig.canvasRatio} · 主画面 {mainFrameConfig.mainFrameRatio}
        </span>
      </div>

      {/* Center 9:16 Video Canvas Container */}
      <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-xl border border-slate-200/80">
        <div
          ref={canvasStageRef}
          data-testid="douyin-template-canvas"
          style={getCanvasDimensionsStyle()}
          className="relative bg-black rounded-xl overflow-hidden shadow-lg border border-slate-300 select-none"
        >
          {/* Inner Main Video Viewport */}
          <div
            data-testid="main-video-viewport"
            style={{
              left: `${frameRect.leftPercent}%`,
              top: `${frameRect.topPercent}%`,
              width: `${frameRect.widthPercent}%`,
              height: `${frameRect.heightPercent}%`,
            }}
            className="absolute overflow-hidden bg-slate-950 transition-all duration-150"
          >
            <video
              ref={videoRef}
              src={videoUrl}
              muted={isMuted}
              playsInline
              loop
              onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => {
                if (e.currentTarget.duration && Number.isFinite(e.currentTarget.duration)) {
                  setDurationSec(e.currentTarget.duration);
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={togglePlay}
              style={{
                transform: cleanCropMode ? 'scale(1.18) translateY(5.5%)' : 'scale(1)',
                transformOrigin: 'center center',
              }}
              className="w-full h-full object-cover cursor-pointer"
            />
          </div>

          {/* Draggable Template Text & Subtitle Overlays */}
          {cleanCropMode &&
            templateLayers.map((layer) => {
              if (!layer.visible) return null;
              const isSelected = layer.id === selectedLayerId;
              const isSubtitleAnchor = layer.role === 'subtitle-anchor';

              const displayText = isSubtitleAnchor ? displayedSubtitle : layer.text;
              const posX = isSubtitleAnchor ? activeSubInfo.xPercent : layer.xPercent;
              const posY = isSubtitleAnchor ? activeSubInfo.yPercent : layer.yPercent;

              return (
                <div
                  key={layer.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`拖拽调整 ${layer.name} 位置`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onSelectLayer(layer.id);
                    setDraggingLayerId(layer.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectLayer(layer.id);
                    }
                  }}
                  style={{
                    left: `${posX}%`,
                    top: `${posY}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${layer.fontSize}px`,
                    color: layer.color,
                    fontWeight: layer.fontWeight,
                    textShadow:
                      '0 2px 4px rgba(0,0,0,0.95), -1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000',
                  }}
                  className={`absolute z-20 w-[92%] text-center whitespace-pre-line leading-snug cursor-grab active:cursor-grabbing px-1.5 py-0.5 rounded transition-shadow ${
                    isSelected
                      ? 'ring-2 ring-blue-400 bg-black/25'
                      : 'hover:ring-1 hover:ring-white/60'
                  }`}
                >
                  {displayText}
                </div>
              );
            })}
        </div>

        {/* Simple Video Transport Controls */}
        <div className="w-full max-w-md mt-4 px-3 space-y-2">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? '暂停视频' : '播放视频'}
              className="w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => seekTo(0)}
              className="px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <SkipBack className="w-3.5 h-3.5 text-blue-600" />
              <span>前3秒开头</span>
            </button>

            <input
              type="range"
              aria-label="视频播放进度条"
              min={0}
              max={durationSec}
              step={0.1}
              value={currentTimeSec}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="flex-1 accent-blue-600 cursor-pointer"
            />

            <span className="text-xs font-mono-tabular text-slate-600 whitespace-nowrap shrink-0">
              {formatTimecode(currentTimeSec)} / {formatTimecode(durationSec)}
            </span>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? '开启原片声音' : '静音原片'}
              className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer shrink-0"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-slate-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-blue-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Current Active Narration / TTS Preview Box */}
      {currentBeat && (
        <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-blue-900">
              当前镜头 #{currentBeat.index}（{currentBeat.storyPhase}）
            </div>
            <div className="text-xs text-slate-700 mt-0.5 truncate">
              {narrationMode === 'tts-voiceover'
                ? `TTS 旁白稿：${currentBeat.ttsNarrationText || currentBeat.yellowSubtitle.replace(/\n/g, '，')}`
                : `静默黄字：${formatYellowQuote(currentBeat.yellowSubtitle, yellowQuoteStyle)}`}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onPlayTtsForBeat(currentBeat)}
            disabled={isPlayingTts}
            className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
          >
            <Mic className="w-3.5 h-3.5 text-blue-600" />
            <span>{isPlayingTts ? '正在朗读...' : '试听本句TTS配音'}</span>
          </button>
        </div>
      )}
    </section>
  );
};
