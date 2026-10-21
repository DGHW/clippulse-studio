import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeMainFrameRect,
  formatYellowQuote,
  getActiveSubtitleAtTime,
  compressLongVideoToStoryline,
  buildCodexCliCommand,
  generateTailoredScriptForVideo,
  buildJianyingDraftJson,
  DEFAULT_MAIN_FRAME_CONFIG,
  DEFAULT_CODEX_CONFIG,
  DEFAULT_TEMPLATE_LAYERS,
  STANDARD_CATERPILLAR_BEATS,
  STANDARD_GIRAFFE_TTS_BEATS,
  DUNG_BEETLE_CRAWLED_BEATS,
  MATERIAL_SOURCES,
  type RawCandidateScene,
} from './pipelineLogic';

test('computeMainFrameRect calculates 4:3 main frame inside 9:16 Douyin canvas accurately', () => {
  const rect = computeMainFrameRect({
    canvasRatio: '9:16',
    mainFrameRatio: '4:3',
    verticalOffsetPercent: 0,
    scalePercent: 100,
    objectFit: 'cover',
  });

  assert.equal(rect.widthPercent, 100);
  assert.equal(rect.heightPercent, 42.19);
  assert.equal(rect.leftPercent, 0);
  assert.equal(rect.topPercent, 28.91);
});

test('formatYellowQuote wraps text in Chinese double quotes without duplicating', () => {
  assert.equal(formatYellowQuote('回家睡觉', 'double-quotes'), '“回家睡觉”');
  assert.equal(formatYellowQuote('“居然还放屁”', 'double-quotes'), '“居然还放屁”');
  assert.equal(formatYellowQuote('吃到打嗝', 'brackets'), '【吃到打嗝】');
  assert.equal(formatYellowQuote('“好家伙”', 'plain'), '好家伙');
});

test('getActiveSubtitleAtTime returns matching yellow subtitle and template anchor coordinates', () => {
  const atHook = getActiveSubtitleAtTime(
    STANDARD_CATERPILLAR_BEATS,
    1.5,
    { xPercent: 52, yPercent: 68.5, useQuotes: true },
    'double-quotes'
  );
  assert.ok(atHook.activeSubtitleBeat);
  assert.equal(atHook.formattedText, '“回家睡觉”');
  assert.equal(atHook.xPercent, 52);
  assert.equal(atHook.yPercent, 68.5);
});

test('generateTailoredScriptForVideo produces different scripts for Caterpillar, Giraffe, and Dung Beetle across modes', () => {
  const catSilent = generateTailoredScriptForVideo(
    'source-minuscule-apple',
    'silent-yellow',
    '小朋友都爱看的纪录片',
    STANDARD_CATERPILLAR_BEATS
  );
  const girTts = generateTailoredScriptForVideo(
    'source-giraffe-tts',
    'tts-voiceover',
    '这才是孩子爱看的纪录片！长颈鹿为什么不怕刺',
    STANDARD_GIRAFFE_TTS_BEATS
  );
  const dbTts = generateTailoredScriptForVideo(
    'crawled-dung-beetle',
    'tts-voiceover',
    '这才是孩子爱看的纪录片！屎壳郎为什么要倒着推球',
    DUNG_BEETLE_CRAWLED_BEATS
  );
  const dbSilent = generateTailoredScriptForVideo(
    'crawled-dung-beetle',
    'silent-yellow',
    '这才是孩子爱看的纪录片！屎壳郎为什么要倒着推球',
    DUNG_BEETLE_CRAWLED_BEATS
  );

  assert.notEqual(catSilent[0].yellowSubtitle, dbSilent[0].yellowSubtitle);
  assert.notEqual(girTts[0].ttsNarrationText, dbTts[0].ttsNarrationText);
  assert.notEqual(dbTts[0].yellowSubtitle, dbSilent[0].yellowSubtitle);
});

test('buildJianyingDraftJson generates valid 1080x1920 Jianying draft structure from crawled material', () => {
  const draft = buildJianyingDraftJson(
    {
      ...MATERIAL_SOURCES[0],
      id: 'crawled-dung-beetle',
      title: '《屎壳郎推球》儿童科普纪录片',
      videoUrl: '/assets/crawled/dung_beetle_doc.mp4',
      beats: DUNG_BEETLE_CRAWLED_BEATS,
    },
    DEFAULT_MAIN_FRAME_CONFIG,
    DEFAULT_TEMPLATE_LAYERS,
    DUNG_BEETLE_CRAWLED_BEATS,
    'tts-voiceover'
  );

  const canvasConfig = draft.canvas_config as { width: number; height: number; ratio: string };
  assert.equal(canvasConfig.width, 1080);
  assert.equal(canvasConfig.height, 1920);
  assert.equal(canvasConfig.ratio, '9:16');
  const tracks = draft.tracks as Array<{ type: string; segments: unknown[] }>;
  assert.equal(tracks.length, 2);
  assert.equal(tracks[0].segments.length, 6);
  assert.equal(tracks[1].segments.length, 6);
});

test('compressLongVideoToStoryline places highest visual hook in first 3 seconds and orders storyline', () => {
  const candidates: RawCandidateScene[] = [
    {
      id: 'scene-late-climax',
      sourceEpisodeTime: '00:55:00',
      durationSec: 10,
      visualHookScore: 92,
      narrativeOrder: 5,
      storyPhase: '神级反转',
      frameObservation: '啃断果柄拆房子',
      suggestedYellowSubtitle: '一气之下把邻居房子拆了',
    },
    {
      id: 'scene-best-hook',
      sourceEpisodeTime: '00:08:14',
      durationSec: 6,
      visualHookScore: 99,
      narrativeOrder: 1,
      storyPhase: '黄金前3秒抓眼球',
      frameObservation: '钻进红苹果透视洞口睡觉',
      suggestedYellowSubtitle: '回家睡觉',
    },
  ];

  const storyline = compressLongVideoToStoryline(candidates, 25, true);
  assert.equal(storyline[0].id, 'scene-best-hook');
});

test('buildCodexCliCommand includes narration mode and template context', () => {
  const cmd = buildCodexCliCommand(
    { ...DEFAULT_CODEX_CONFIG, narrationMode: 'tts-voiceover' },
    DEFAULT_MAIN_FRAME_CONFIG,
    '屎壳郎推球',
    '这才是孩子爱看的纪录片'
  );
  assert.ok(cmd.includes('TTS全程语音解说模式'));
  assert.ok(cmd.includes('屎壳郎推球'));
});
