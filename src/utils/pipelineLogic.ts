export type CanvasRatio = '9:16' | '3:4' | '16:9' | '1:1';
export type MainFrameRatio = '4:3' | '16:9' | '1:1' | '9:16';
export type NarrationMode = 'silent-yellow' | 'tts-voiceover';
export type StoryPhase = '黄金前3秒抓眼球' | '铺垫日常' | '矛盾升级' | '高能笑点' | '神级反转';

export interface TemplateLayer {
  id: string;
  name: string;
  role: 'header' | 'footer' | 'subtitle-anchor' | 'custom';
  text: string;
  xPercent: number;
  yPercent: number;
  fontSize: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  fontWeight: number;
  visible: boolean;
  useQuotes?: boolean;
}

export interface MainFrameConfig {
  canvasRatio: CanvasRatio;
  mainFrameRatio: MainFrameRatio;
  verticalOffsetPercent: number;
  scalePercent: number;
  objectFit: 'cover' | 'contain';
}

export interface MainFrameRect {
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
  aspectNumeric: number;
}

export interface StoryBeat {
  id: string;
  index: number;
  sourceEpisodeTime: string;
  clipStartSec: number;
  clipEndSec: number;
  subtitleStartSec: number;
  subtitleEndSec: number;
  isThreeSecHook: boolean;
  storyPhase: StoryPhase;
  frameObservation: string;
  yellowSubtitle: string;
  ttsNarrationText?: string;
  funnyPointScore: number;
  customXPercent?: number;
  customYPercent?: number;
  thumbnailTimeSec: number;
  frameThumbnailUrl?: string;
}

export interface RawCandidateScene {
  id: string;
  sourceEpisodeTime: string;
  durationSec: number;
  visualHookScore: number;
  narrativeOrder: number;
  storyPhase: StoryPhase;
  frameObservation: string;
  suggestedYellowSubtitle: string;
}

export interface CodexCliConfig {
  connectionMode: 'local-codex-cli' | 'codex-plus-vision';
  binaryPath: string;
  modelName: string;
  approvalMode: 'suggest' | 'auto-edit' | 'full-auto';
  frameSampleIntervalSec: number;
  targetDurationRange: '60-90s' | '120-180s' | '180-240s';
  enforceThreeSecHook: boolean;
  yellowQuoteStyle: 'double-quotes' | 'plain' | 'brackets';
  workspaceDir: string;
  narrationMode: NarrationMode;
  ttsVoiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
}

export interface MaterialSourceItem {
  id: string;
  title: string;
  shortLabel: string;
  originType: 'reference-standard' | 'agent-crawled' | 'user-specified';
  defaultNarrationMode: NarrationMode;
  rawDurationLabel: string;
  targetOutputLabel: string;
  videoUrl: string;
  hasBakedInBars?: boolean;
  sourceQuery?: string;
  crawlOriginUrls?: string[];
  description: string;
  defaultHeaderText: string;
  defaultHeaderColor: string;
  defaultFooterText: string;
  defaultSubtitleColor: string;
  defaultUseQuotes: boolean;
  beats: StoryBeat[];
}

export const DEFAULT_MAIN_FRAME_CONFIG: MainFrameConfig = {
  canvasRatio: '9:16',
  mainFrameRatio: '4:3',
  verticalOffsetPercent: 1,
  scalePercent: 100,
  objectFit: 'cover',
};

export const DEFAULT_TEMPLATE_LAYERS: TemplateLayer[] = [
  {
    id: 'layer-header',
    name: '顶部吸睛标题',
    role: 'header',
    text: '小朋友都爱看的纪录片\n我都没忍住看了两遍',
    xPercent: 50,
    yPercent: 11.5,
    fontSize: 21,
    color: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 4,
    fontWeight: 900,
    visible: true,
    useQuotes: false,
  },
  {
    id: 'layer-subtitle-anchor',
    name: '解说字幕位置',
    role: 'subtitle-anchor',
    text: '“回家睡觉”',
    xPercent: 50,
    yPercent: 68.5,
    fontSize: 17,
    color: '#FFE600',
    strokeColor: '#000000',
    strokeWidth: 4,
    fontWeight: 800,
    visible: true,
    useQuotes: true,
  },
  {
    id: 'layer-footer',
    name: '底部引导文字',
    role: 'footer',
    text: '适合2-6岁宝宝观看 4000+完整合集（支持电视投屏）',
    xPercent: 50,
    yPercent: 81.5,
    fontSize: 11,
    color: '#FACC15',
    strokeColor: '#000000',
    strokeWidth: 3,
    fontWeight: 700,
    visible: true,
    useQuotes: false,
  },
];

export const GIRAFFE_TTS_TEMPLATE_LAYERS: TemplateLayer[] = [
  {
    id: 'layer-header',
    name: '顶部吸睛标题',
    role: 'header',
    text: '这才是孩子爱看的纪录片！\n长颈鹿为什么不怕刺',
    xPercent: 50,
    yPercent: 11.5,
    fontSize: 21,
    color: '#FFE600',
    strokeColor: '#000000',
    strokeWidth: 4,
    fontWeight: 900,
    visible: true,
    useQuotes: false,
  },
  {
    id: 'layer-subtitle-anchor',
    name: '解说字幕位置',
    role: 'subtitle-anchor',
    text: '兽群在吃草的同时\n长颈鹿的目光则落在了树上',
    xPercent: 50,
    yPercent: 66.5,
    fontSize: 14,
    color: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 4,
    fontWeight: 700,
    visible: true,
    useQuotes: false,
  },
  {
    id: 'layer-footer',
    name: '底部引导文字',
    role: 'footer',
    text: '适合2-12岁孩子观看 1500部完整合集\n支持手机/平板/电脑/学习机/电视投屏观看',
    xPercent: 50,
    yPercent: 79.5,
    fontSize: 11,
    color: '#FFE600',
    strokeColor: '#000000',
    strokeWidth: 3,
    fontWeight: 700,
    visible: true,
    useQuotes: false,
  },
];

export const DUNG_BEETLE_TEMPLATE_LAYERS: TemplateLayer[] = [
  {
    id: 'layer-header',
    name: '顶部吸睛标题',
    role: 'header',
    text: '这才是孩子爱看的纪录片！\n屎壳郎为什么要倒着推球',
    xPercent: 50,
    yPercent: 11.5,
    fontSize: 21,
    color: '#FFE600',
    strokeColor: '#000000',
    strokeWidth: 4,
    fontWeight: 900,
    visible: true,
    useQuotes: false,
  },
  {
    id: 'layer-subtitle-anchor',
    name: '解说字幕位置',
    role: 'subtitle-anchor',
    text: '大自然的超级清洁工\n把圆球拍得比乒乓球还圆',
    xPercent: 50,
    yPercent: 66.5,
    fontSize: 14,
    color: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 4,
    fontWeight: 700,
    visible: true,
    useQuotes: false,
  },
  {
    id: 'layer-footer',
    name: '底部引导文字',
    role: 'footer',
    text: '适合2-12岁孩子观看 昆虫科普完整合集\n支持手机/平板/电脑/学习机/电视投屏观看',
    xPercent: 50,
    yPercent: 79.5,
    fontSize: 11,
    color: '#FFE600',
    strokeColor: '#000000',
    strokeWidth: 3,
    fontWeight: 700,
    visible: true,
    useQuotes: false,
  },
];

export const DEFAULT_CODEX_CONFIG: CodexCliConfig = {
  connectionMode: 'local-codex-cli',
  binaryPath: 'codex',
  modelName: 'codex-mini-latest',
  approvalMode: 'full-auto',
  frameSampleIntervalSec: 2,
  targetDurationRange: '120-180s',
  enforceThreeSecHook: true,
  yellowQuoteStyle: 'double-quotes',
  workspaceDir: './workspace/clips_output',
  narrationMode: 'silent-yellow',
  ttsVoiceName: 'Kore',
};

export const STANDARD_CATERPILLAR_BEATS: StoryBeat[] = [
  {
    id: 'cat-beat-1',
    index: 1,
    sourceEpisodeTime: '00:08:14',
    clipStartSec: 0.0,
    clipEndSec: 8.2,
    subtitleStartSec: 0.0,
    subtitleEndSec: 3.2,
    isThreeSecHook: true,
    storyPhase: '黄金前3秒抓眼球',
    frameObservation: '绿色小青虫钻进红苹果圆洞蜷成一团准备睡觉',
    yellowSubtitle: '回家睡觉',
    ttsNarrationText: '吃饱喝足的小青虫钻进红彤彤的苹果屋里，蜷成一团准备美美睡上一觉。',
    funnyPointScore: 98,
    thumbnailTimeSec: 1.2,
  },
  {
    id: 'cat-beat-2',
    index: 2,
    sourceEpisodeTime: '00:15:40',
    clipStartSec: 8.2,
    clipEndSec: 12.4,
    subtitleStartSec: 8.3,
    subtitleEndSec: 9.8,
    isThreeSecHook: false,
    storyPhase: '铺垫日常',
    frameObservation: '夜空升起弯月，虫鸣声中青虫熟睡打呼',
    yellowSubtitle: '到了夜晚',
    ttsNarrationText: '夜幕降临，弯月升上树梢，小青虫在苹果窝里睡得正香。',
    funnyPointScore: 84,
    thumbnailTimeSec: 9.0,
  },
  {
    id: 'cat-beat-3',
    index: 3,
    sourceEpisodeTime: '00:19:05',
    clipStartSec: 12.4,
    clipEndSec: 16.0,
    subtitleStartSec: 12.5,
    subtitleEndSec: 15.6,
    isThreeSecHook: false,
    storyPhase: '矛盾升级',
    frameObservation: '隔壁传来剧烈啃苹果声，熟睡的小青虫被吵醒',
    yellowSubtitle: '被邻居吵醒',
    ttsNarrationText: '谁知半夜隔壁突然传来咔嚓咔嚓的啃咬声，把睡梦中的小青虫硬生生吵醒了。',
    funnyPointScore: 91,
    thumbnailTimeSec: 14.0,
  },
  {
    id: 'cat-beat-4',
    index: 4,
    sourceEpisodeTime: '00:23:18',
    clipStartSec: 16.0,
    clipEndSec: 20.0,
    subtitleStartSec: 16.2,
    subtitleEndSec: 19.6,
    isThreeSecHook: false,
    storyPhase: '高能笑点',
    frameObservation: '隔壁苹果里的邻居大口咀嚼后打了一个响嗝',
    yellowSubtitle: '吃到打嗝',
    ttsNarrationText: '隔壁这位吃货邻居不仅大半夜偷吃果肉，甚至还吃得打起了响嗝。',
    funnyPointScore: 93,
    thumbnailTimeSec: 17.5,
  },
  {
    id: 'cat-beat-5',
    index: 5,
    sourceEpisodeTime: '00:26:42',
    clipStartSec: 20.0,
    clipEndSec: 24.8,
    subtitleStartSec: 20.4,
    subtitleEndSec: 23.6,
    isThreeSecHook: false,
    storyPhase: '高能笑点',
    frameObservation: '隔壁青虫对着洞口噗地放了一个响屁',
    yellowSubtitle: '居然还放屁',
    ttsNarrationText: '更过分的是，它居然还把屁股对着洞口放了个响屁，实在太不讲武德了。',
    funnyPointScore: 97,
    thumbnailTimeSec: 21.8,
  },
  {
    id: 'cat-beat-6',
    index: 6,
    sourceEpisodeTime: '00:31:10',
    clipStartSec: 24.8,
    clipEndSec: 30.8,
    subtitleStartSec: 25.4,
    subtitleEndSec: 29.4,
    isThreeSecHook: false,
    storyPhase: '矛盾升级',
    frameObservation: '隔壁青虫吃完倒头就睡，呼噜声震天响',
    yellowSubtitle: '好家伙，吃饱就睡了',
    ttsNarrationText: '折腾完半宿之后，隔壁邻居倒头就睡，留下一脸怨气的主角彻夜难眠。',
    funnyPointScore: 92,
    thumbnailTimeSec: 27.0,
  },
  {
    id: 'cat-beat-7',
    index: 7,
    sourceEpisodeTime: '00:38:55',
    clipStartSec: 30.8,
    clipEndSec: 35.2,
    subtitleStartSec: 31.4,
    subtitleEndSec: 34.5,
    isThreeSecHook: false,
    storyPhase: '铺垫日常',
    frameObservation: '清晨阳光洒向苹果树，小青虫还在补觉',
    yellowSubtitle: '第二天清晨',
    ttsNarrationText: '转眼到了第二天清晨，晨光洒满果园，困了一整晚的小青虫刚想补个回笼觉。',
    funnyPointScore: 85,
    thumbnailTimeSec: 32.0,
  },
  {
    id: 'cat-beat-8',
    index: 8,
    sourceEpisodeTime: '00:42:19',
    clipStartSec: 35.2,
    clipEndSec: 47.0,
    subtitleStartSec: 35.6,
    subtitleEndSec: 39.2,
    isThreeSecHook: false,
    storyPhase: '矛盾升级',
    frameObservation: '大清早隔壁又开始咔嚓狂炫苹果',
    yellowSubtitle: '又在吃',
    ttsNarrationText: '结果一大早隔壁又传来了熟悉的咀嚼声，两边的邻居都忍不住探出头来。',
    funnyPointScore: 90,
    thumbnailTimeSec: 37.5,
  },
  {
    id: 'cat-beat-9',
    index: 9,
    sourceEpisodeTime: '00:47:02',
    clipStartSec: 47.0,
    clipEndSec: 58.8,
    subtitleStartSec: 47.8,
    subtitleEndSec: 52.2,
    isThreeSecHook: false,
    storyPhase: '铺垫日常',
    frameObservation: '胖青虫吃饱后顺着树枝爬下树干出门',
    yellowSubtitle: '吃饱喝足，出门',
    ttsNarrationText: '吃饱喝足之后，这只圆滚滚的胖虫子慢悠悠地顺着树干爬下地面出门去了。',
    funnyPointScore: 89,
    thumbnailTimeSec: 49.5,
  },
  {
    id: 'cat-beat-10',
    index: 10,
    sourceEpisodeTime: '00:52:48',
    clipStartSec: 58.8,
    clipEndSec: 63.2,
    subtitleStartSec: 59.5,
    subtitleEndSec: 62.5,
    isThreeSecHook: false,
    storyPhase: '高能笑点',
    frameObservation: '树下两只胖虫子开心地贴贴扭动约会',
    yellowSubtitle: '居然跑去约会了',
    ttsNarrationText: '仔细一看，好家伙，原来它是下楼找心仪的小伙伴约会去了。',
    funnyPointScore: 95,
    thumbnailTimeSec: 60.8,
  },
  {
    id: 'cat-beat-11',
    index: 11,
    sourceEpisodeTime: '00:56:30',
    clipStartSec: 63.2,
    clipEndSec: 71.5,
    subtitleStartSec: 64.5,
    subtitleEndSec: 69.5,
    isThreeSecHook: false,
    storyPhase: '神级反转',
    frameObservation: '主角青虫趁邻居不在，直接啃断隔壁苹果果柄让苹果掉下树',
    yellowSubtitle: '一气之下把邻居房子拆了',
    ttsNarrationText: '忍无可忍的主角趁着邻居不在家，三两下咬断了隔壁苹果的果蒂，直接把邻居房子给拆了！',
    funnyPointScore: 99,
    thumbnailTimeSec: 66.8,
  },
];

export const STANDARD_GIRAFFE_TTS_BEATS: StoryBeat[] = [
  {
    id: 'gir-beat-1',
    index: 1,
    sourceEpisodeTime: '00:03:10',
    clipStartSec: 0.0,
    clipEndSec: 14.0,
    subtitleStartSec: 0.5,
    subtitleEndSec: 5.8,
    isThreeSecHook: true,
    storyPhase: '黄金前3秒抓眼球',
    frameObservation: '斑马群在草原低头吃草，高大的长颈鹿迈步仰望树冠寻找嫩叶',
    yellowSubtitle: '兽群在吃草的同时\n长颈鹿的目光则落在了树上',
    ttsNarrationText: '兽群在吃草的同时，长颈鹿的目光则落在了树上。',
    funnyPointScore: 96,
    thumbnailTimeSec: 2.0,
  },
  {
    id: 'gir-beat-2',
    index: 2,
    sourceEpisodeTime: '00:11:25',
    clipStartSec: 14.0,
    clipEndSec: 22.5,
    subtitleStartSec: 14.8,
    subtitleEndSec: 21.0,
    isThreeSecHook: false,
    storyPhase: '铺垫日常',
    frameObservation: '洋槐树枝上长出嫩绿新叶，但树枝间布满了锋利的白色长刺',
    yellowSubtitle: '洋槐长出了茂盛的新叶子\n也有长长的尖刺保护',
    ttsNarrationText: '洋槐长出了茂盛的新叶子，也有长长的尖刺保护。',
    funnyPointScore: 88,
    thumbnailTimeSec: 18.0,
  },
  {
    id: 'gir-beat-3',
    index: 3,
    sourceEpisodeTime: '00:18:40',
    clipStartSec: 22.5,
    clipEndSec: 34.0,
    subtitleStartSec: 23.0,
    subtitleEndSec: 28.0,
    isThreeSecHook: false,
    storyPhase: '矛盾升级',
    frameObservation: '长颈鹿伸出半米长的灵活舌头绕开尖刺卷食洋槐嫩叶',
    yellowSubtitle: '面对长达半米的舌头\n它们的作用微乎其微',
    ttsNarrationText: '面对长达半米的舌头，它们的作用微乎其微。',
    funnyPointScore: 93,
    thumbnailTimeSec: 25.0,
  },
  {
    id: 'gir-beat-4',
    index: 4,
    sourceEpisodeTime: '00:25:12',
    clipStartSec: 34.0,
    clipEndSec: 49.5,
    subtitleStartSec: 34.5,
    subtitleEndSec: 38.5,
    isThreeSecHook: false,
    storyPhase: '矛盾升级',
    frameObservation: '微距镜头聚焦洋槐树膨大的空心刺圆孔，一只红腹洋槐蚁从洞口钻出警戒',
    yellowSubtitle: '但是洋槐还有第二道防线',
    ttsNarrationText: '但是洋槐还有第二道防线。',
    funnyPointScore: 94,
    thumbnailTimeSec: 36.0,
  },
  {
    id: 'gir-beat-5',
    index: 5,
    sourceEpisodeTime: '00:34:05',
    clipStartSec: 49.5,
    clipEndSec: 57.5,
    subtitleStartSec: 50.5,
    subtitleEndSec: 54.0,
    isThreeSecHook: false,
    storyPhase: '高能笑点',
    frameObservation: '成群结队的洋槐蚁从空心刺堡垒中涌出，顺着树枝冲向长颈鹿嘴边',
    yellowSubtitle: '一群洋槐蚁前来营救',
    ttsNarrationText: '一群洋槐蚁前来营救。',
    funnyPointScore: 95,
    thumbnailTimeSec: 52.0,
  },
  {
    id: 'gir-beat-6',
    index: 6,
    sourceEpisodeTime: '00:41:30',
    clipStartSec: 57.5,
    clipEndSec: 70.5,
    subtitleStartSec: 58.0,
    subtitleEndSec: 61.5,
    isThreeSecHook: false,
    storyPhase: '高能笑点',
    frameObservation: '洋槐蚁爬满长颈鹿的嘴唇和鼻子，张开大颚一顿猛咬',
    yellowSubtitle: '爬到长颈鹿身上一顿乱咬',
    ttsNarrationText: '爬到长颈鹿身上一顿乱咬。',
    funnyPointScore: 97,
    thumbnailTimeSec: 59.5,
  },
  {
    id: 'gir-beat-7',
    index: 7,
    sourceEpisodeTime: '00:48:15',
    clipStartSec: 70.5,
    clipEndSec: 84.5,
    subtitleStartSec: 71.0,
    subtitleEndSec: 82.0,
    isThreeSecHook: false,
    storyPhase: '神级反转',
    frameObservation: '长颈鹿被蚂蚁叮咬得受不了转身离开，镜头展示空心刺内部的蚁群军营',
    yellowSubtitle: '洋槐长有特殊的尖刺 其内部空间膨大\n就是为了让这支忠实的军队驻扎',
    ttsNarrationText: '直到长颈鹿走开为止。洋槐长有特殊的尖刺，其内部空间膨大，就是为了让这支忠实的军队驻扎。',
    funnyPointScore: 98,
    thumbnailTimeSec: 76.0,
  },
  {
    id: 'gir-beat-8',
    index: 8,
    sourceEpisodeTime: '00:54:50',
    clipStartSec: 84.5,
    clipEndSec: 98.0,
    subtitleStartSec: 85.5,
    subtitleEndSec: 96.0,
    isThreeSecHook: false,
    storyPhase: '神级反转',
    frameObservation: '洋槐树分泌杯状花蜜喂养蚂蚁，蚂蚁与大树互利共生击退巨兽',
    yellowSubtitle: '通过合作 小小的生物\n也能对抗巨大的动物',
    ttsNarrationText: '还长有蚂蚁大小的杯状结构，里面盛着喂养蚂蚁的花蜜。通过合作，小小的生物也能对抗巨大的动物。',
    funnyPointScore: 99,
    thumbnailTimeSec: 92.0,
  },
];

/**
 * Video 3: Real Agent-Crawled & FFmpeg-Cut 《屎壳郎推球》 儿童科普纪录片
 * Built from real Wikimedia Commons documentary clips (/assets/crawled/dung_beetle_doc.mp4)
 * and 6 real extracted JPEG keyframes (/assets/crawled/frames/db_beat_1.jpg ... db_beat_6.jpg)
 */
export const DUNG_BEETLE_CRAWLED_BEATS: StoryBeat[] = [
  {
    id: 'db-beat-1',
    index: 1,
    sourceEpisodeTime: '00:02:15',
    clipStartSec: 0.0,
    clipEndSec: 5.5,
    subtitleStartSec: 0.2,
    subtitleEndSec: 5.2,
    isThreeSecHook: true,
    storyPhase: '黄金前3秒抓眼球',
    frameObservation: '屎壳郎趴在比自己身体还大的浑圆粪球上，用前足反复拍打塑形（沙砾地面实拍帧）',
    yellowSubtitle: '大自然的超级清洁工\n把圆球搓得比乒乓球还圆',
    ttsNarrationText: '别小看这位大自然的超级清洁工，它能用坚硬的前足，把粪球搓得比乒乓球还要圆。',
    funnyPointScore: 98,
    thumbnailTimeSec: 1.5,
    frameThumbnailUrl: '/assets/crawled/frames/db_beat_1.jpg',
  },
  {
    id: 'db-beat-2',
    index: 2,
    sourceEpisodeTime: '00:09:40',
    clipStartSec: 5.5,
    clipEndSec: 10.5,
    subtitleStartSec: 5.8,
    subtitleEndSec: 10.2,
    isThreeSecHook: false,
    storyPhase: '铺垫日常',
    frameObservation: '屎壳郎头朝下支撑地面，用强壮的后腿蹬住圆球倒着往前快速推行',
    yellowSubtitle: '为什么它总是头朝下\n用后腿倒着推球走？',
    ttsNarrationText: '可奇怪的是，为什么它总是头朝下撑着地面，用两条后腿倒着推球狂奔呢？',
    funnyPointScore: 95,
    thumbnailTimeSec: 7.0,
    frameThumbnailUrl: '/assets/crawled/frames/db_beat_2.jpg',
  },
  {
    id: 'db-beat-3',
    index: 3,
    sourceEpisodeTime: '00:18:12',
    clipStartSec: 10.5,
    clipEndSec: 16.5,
    subtitleStartSec: 10.8,
    subtitleEndSec: 16.0,
    isThreeSecHook: false,
    storyPhase: '矛盾升级',
    frameObservation: '科学高速摄像机特写：屎壳郎爬上球顶停下脚步，仰头朝向天空观察偏振光',
    yellowSubtitle: '爬上球顶并不是在休息\n而是在观察太阳偏振光看路',
    ttsNarrationText: '原来倒着走看不清前方，所以它每隔一段路就要爬上球顶，抬头看太阳来校准方向。',
    funnyPointScore: 94,
    thumbnailTimeSec: 12.5,
    frameThumbnailUrl: '/assets/crawled/frames/db_beat_3.jpg',
  },
  {
    id: 'db-beat-4',
    index: 4,
    sourceEpisodeTime: '00:27:30',
    clipStartSec: 16.5,
    clipEndSec: 22.5,
    subtitleStartSec: 16.8,
    subtitleEndSec: 22.0,
    isThreeSecHook: false,
    storyPhase: '高能笑点',
    frameObservation: '屎壳郎在球顶原地360度转圈跳起“导航舞”，确定路线后立刻下球继续推',
    yellowSubtitle: '在球顶原地转圈跳导航舞\n就能精准锁定回家的直线',
    ttsNarrationText: '它在球顶原地转上一圈跳起导航舞，就能精准锁定一条直线，绝不会在草原上迷路。',
    funnyPointScore: 96,
    thumbnailTimeSec: 18.0,
    frameThumbnailUrl: '/assets/crawled/frames/db_beat_4.jpg',
  },
  {
    id: 'db-beat-5',
    index: 5,
    sourceEpisodeTime: '00:39:05',
    clipStartSec: 22.5,
    clipEndSec: 28.8,
    subtitleStartSec: 23.0,
    subtitleEndSec: 28.4,
    isThreeSecHook: false,
    storyPhase: '矛盾升级',
    frameObservation: '屎壳郎从球顶迅速爬下，赶在同行过来争抢前加速转移战利品',
    yellowSubtitle: '必须赶在别的甲虫抢球前\n把比自己重50倍的球运回家',
    ttsNarrationText: '它必须争分夺秒，赶在别的甲虫过来抢球之前，把比自己重五十倍的圆球安全运回家。',
    funnyPointScore: 93,
    thumbnailTimeSec: 24.0,
    frameThumbnailUrl: '/assets/crawled/frames/db_beat_5.jpg',
  },
  {
    id: 'db-beat-6',
    index: 6,
    sourceEpisodeTime: '00:46:50',
    clipStartSec: 28.8,
    clipEndSec: 35.3,
    subtitleStartSec: 29.2,
    subtitleEndSec: 35.0,
    isThreeSecHook: false,
    storyPhase: '神级反转',
    frameObservation: '草丛枯叶间两只屎壳郎汇合，共同将圆球推入地下洞穴作为幼虫育儿房',
    yellowSubtitle: '埋进土里既能给土壤施肥\n更是宝宝出生的温暖育儿房',
    ttsNarrationText: '最后两只屎壳郎齐心协力把球埋进土里，这既能给草原施肥，更是小宝宝出生的温暖育儿房。',
    funnyPointScore: 99,
    thumbnailTimeSec: 31.0,
    frameThumbnailUrl: '/assets/crawled/frames/db_beat_6.jpg',
  },
];

export const MATERIAL_SOURCES: MaterialSourceItem[] = [
  {
    id: 'source-minuscule-apple',
    title: '《微观小世界 · 青虫与苹果房》',
    shortLabel: '毛毛虫 · 静默黄字母本',
    originType: 'reference-standard',
    defaultNarrationMode: 'silent-yellow',
    rawDurationLabel: '58分20秒原片',
    targetOutputLabel: '01分11秒 · 静默黄字',
    videoUrl: '/assets/aistudio/7a337936538c4062e828b7fb05baeaa7_e2f74ace.mp4',
    hasBakedInBars: true,
    description: '静默文字解说模式：不加人声配音，保留原片打呼、啃苹果、放屁等搞笑音效，在关键帧打上带引号的黄色趣味短句。',
    defaultHeaderText: '小朋友都爱看的纪录片\n我都没忍住看了两遍',
    defaultHeaderColor: '#FFFFFF',
    defaultFooterText: '适合2-6岁宝宝观看 4000+完整合集（支持电视投屏）',
    defaultSubtitleColor: '#FFE600',
    defaultUseQuotes: true,
    beats: STANDARD_CATERPILLAR_BEATS,
  },
  {
    id: 'source-giraffe-tts',
    title: '《自然奇观 · 长颈鹿为什么不怕刺》',
    shortLabel: '长颈鹿 · TTS 全程配音母本',
    originType: 'reference-standard',
    defaultNarrationMode: 'tts-voiceover',
    rawDurationLabel: '52分10秒原片',
    targetOutputLabel: '01分38秒 · TTS全程解说',
    videoUrl: '/assets/aistudio/14dc4f8aa0479affeef61fdee4123ce4_a0552151.mp4',
    hasBakedInBars: true,
    description: 'TTS 全程配音解说模式：Agent 根据画面与科普模板撰写连贯解说词，自动合成全程语音旁白与同步双行字幕。',
    defaultHeaderText: '这才是孩子爱看的纪录片！\n长颈鹿为什么不怕刺',
    defaultHeaderColor: '#FFE600',
    defaultFooterText: '适合2-12岁孩子观看 1500部完整合集\n支持手机/平板/电脑/学习机/电视投屏观看',
    defaultSubtitleColor: '#FFFFFF',
    defaultUseQuotes: false,
    beats: STANDARD_GIRAFFE_TTS_BEATS,
  },
];

const ASPECT_MAP: Record<CanvasRatio | MainFrameRatio, number> = {
  '9:16': 9 / 16,
  '3:4': 3 / 4,
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '1:1': 1,
};

export function computeMainFrameRect(config: MainFrameConfig): MainFrameRect {
  const canvasAspect = ASPECT_MAP[config.canvasRatio] ?? 9 / 16;
  const frameAspect = ASPECT_MAP[config.mainFrameRatio] ?? 4 / 3;
  const clampedScale = Math.min(100, Math.max(60, config.scalePercent)) / 100;

  let widthPercent = 100 * clampedScale;
  let heightPercent = widthPercent * (canvasAspect / frameAspect);

  if (heightPercent > 100 * clampedScale) {
    heightPercent = 100 * clampedScale;
    widthPercent = heightPercent * (frameAspect / canvasAspect);
  }

  const leftPercent = (100 - widthPercent) / 2;
  const rawTop = (100 - heightPercent) / 2 + config.verticalOffsetPercent;
  const topPercent = Math.min(Math.max(0, rawTop), 100 - heightPercent);

  return {
    leftPercent: Number(leftPercent.toFixed(2)),
    topPercent: Number(topPercent.toFixed(2)),
    widthPercent: Number(widthPercent.toFixed(2)),
    heightPercent: Number(heightPercent.toFixed(2)),
    aspectNumeric: Number(frameAspect.toFixed(4)),
  };
}

export function formatYellowQuote(
  rawText: string,
  style: CodexCliConfig['yellowQuoteStyle'] = 'double-quotes'
): string {
  const cleaned = rawText
    .trim()
    .replace(/^[“"「【]+/, '')
    .replace(/[”"」】]+$/, '')
    .trim();

  if (!cleaned) return '';
  if (style === 'plain') return cleaned;
  if (style === 'brackets') return `【${cleaned}】`;
  return `“${cleaned}”`;
}

export function getActiveSubtitleAtTime(
  beats: StoryBeat[],
  currentTimeSec: number,
  subtitleAnchorLayer?: Pick<TemplateLayer, 'xPercent' | 'yPercent' | 'useQuotes'>,
  quoteStyle: CodexCliConfig['yellowQuoteStyle'] = 'double-quotes'
): {
  beat: StoryBeat | null;
  activeSubtitleBeat: StoryBeat | null;
  formattedText: string;
  xPercent: number;
  yPercent: number;
} {
  const defaultX = subtitleAnchorLayer?.xPercent ?? 50;
  const defaultY = subtitleAnchorLayer?.yPercent ?? 68.5;

  const currentClipBeat =
    beats.find((b) => currentTimeSec >= b.clipStartSec && currentTimeSec <= b.clipEndSec) ??
    beats[beats.length - 1] ??
    null;

  const activeSubtitleBeat =
    beats.find(
      (b) => currentTimeSec >= b.subtitleStartSec && currentTimeSec <= b.subtitleEndSec
    ) ?? null;

  if (!activeSubtitleBeat) {
    return {
      beat: currentClipBeat,
      activeSubtitleBeat: null,
      formattedText: '',
      xPercent: defaultX,
      yPercent: defaultY,
    };
  }

  const effectiveStyle =
    subtitleAnchorLayer?.useQuotes === false ? 'plain' : quoteStyle;

  return {
    beat: currentClipBeat,
    activeSubtitleBeat,
    formattedText: formatYellowQuote(activeSubtitleBeat.yellowSubtitle, effectiveStyle),
    xPercent: activeSubtitleBeat.customXPercent ?? defaultX,
    yPercent: activeSubtitleBeat.customYPercent ?? defaultY,
  };
}

export function generateTailoredScriptForVideo(
  materialId: string,
  narrationMode: NarrationMode,
  headerText: string,
  baseBeats: StoryBeat[]
): StoryBeat[] {
  const isSuspenseAngle = /反转|结局|万万没想到|拆|抢/.test(headerText);
  const isKidsScienceAngle = /孩子|科普|为什么|纪录片|宝宝/.test(headerText);

  if (materialId.includes('dung-beetle') || materialId.includes('屎壳郎')) {
    if (narrationMode === 'silent-yellow') {
      const dbSilentLines = [
        isSuspenseAngle ? '刚搓好的大宝贝，谁也别抢' : '手艺不错，搓得溜圆',
        '倒车请注意，后腿蹬得飞起',
        '爬上球顶，抬头看太阳导航',
        '原地转圈跳个导航舞',
        '赶紧溜，别被同行白嫖了',
        '埋进土里，喜提精装育儿房',
      ];
      return baseBeats.map((b, i) => ({
        ...b,
        yellowSubtitle: dbSilentLines[i] || b.yellowSubtitle,
        ttsNarrationText: '',
      }));
    } else {
      return baseBeats.map((b, i) => {
        const dbDefault = DUNG_BEETLE_CRAWLED_BEATS[i] || b;
        if (i === 0 && isSuspenseAngle) {
          return {
            ...b,
            yellowSubtitle: '冒着被同行抢劫的风险\n它为什么要倒着推球狂奔？',
            ttsNarrationText: '冒着随时被同行抢劫的风险，屎壳郎为什么要倒着推球狂奔？结局让人大开眼界。',
          };
        }
        return {
          ...b,
          yellowSubtitle: dbDefault.yellowSubtitle,
          ttsNarrationText: dbDefault.ttsNarrationText,
        };
      });
    }
  }

  if (materialId.includes('giraffe')) {
    if (narrationMode === 'silent-yellow') {
      const giraffeSilentLines = [
        isSuspenseAngle ? '盯上满树尖刺了' : '脖子长就是任性',
        '这刺看着就扎嘴',
        '半米长舌头，根本不怕扎',
        '树刺里居然藏着保镖',
        '蚂蚁大军全体出动',
        '爬到鼻子上疯狂输出',
        '长颈鹿：溜了溜了，惹不起',
        '包吃包住的蚂蚁保镖团',
      ];
      return baseBeats.map((b, i) => ({
        ...b,
        yellowSubtitle: giraffeSilentLines[i] || b.yellowSubtitle,
        ttsNarrationText: '',
      }));
    } else {
      return baseBeats.map((b, i) => {
        if (i === 0 && isSuspenseAngle) {
          return {
            ...b,
            yellowSubtitle: '浑身尖刺的洋槐树\n为何挡不住贪吃的长颈鹿？',
            ttsNarrationText: '浑身长满尖刺的洋槐树，为什么根本挡不住贪吃的长颈鹿？结局却让人意想不到。',
          };
        }
        const defaultGiraffe = STANDARD_GIRAFFE_TTS_BEATS[i] || b;
        return {
          ...b,
          yellowSubtitle: defaultGiraffe.yellowSubtitle,
          ttsNarrationText: defaultGiraffe.ttsNarrationText,
        };
      });
    }
  }

  if (narrationMode === 'tts-voiceover') {
    return baseBeats.map((b, i) => {
      const catDefault = STANDARD_CATERPILLAR_BEATS[i] || b;
      const spoken = isKidsScienceAngle
        ? catDefault.ttsNarrationText || `看这只小青虫，${catDefault.frameObservation}。`
        : `注意看，${catDefault.frameObservation}，接下来的一幕让人哭笑不得。`;
      return {
        ...b,
        yellowSubtitle: spoken.length > 18 ? `${spoken.slice(0, 14)}\n${spoken.slice(14, 28)}` : spoken,
        ttsNarrationText: spoken,
      };
    });
  } else {
    return baseBeats.map((b, i) => {
      const catDefault = STANDARD_CATERPILLAR_BEATS[i] || b;
      if (isSuspenseAngle && i === 0) {
        return { ...b, yellowSubtitle: '刚睡下就遇上恶邻', ttsNarrationText: '' };
      }
      return {
        ...b,
        yellowSubtitle: catDefault.yellowSubtitle,
        ttsNarrationText: '',
      };
    });
  }
}

export function compressLongVideoToStoryline(
  candidates: RawCandidateScene[],
  targetMaxDurationSec: number,
  enforceThreeSecHook: boolean
): RawCandidateScene[] {
  if (candidates.length === 0) return [];

  const pool = [...candidates];
  let selectedHook: RawCandidateScene | null = null;

  if (enforceThreeSecHook) {
    pool.sort((a, b) => b.visualHookScore - a.visualHookScore);
    selectedHook = pool[0];
  }

  const remaining = selectedHook
    ? pool.filter((c) => c.id !== selectedHook!.id)
    : pool;

  remaining.sort((a, b) => b.visualHookScore - a.visualHookScore);

  const chosen: RawCandidateScene[] = [];
  let accumulatedSec = selectedHook ? selectedHook.durationSec : 0;

  for (const scene of remaining) {
    if (accumulatedSec + scene.durationSec <= targetMaxDurationSec) {
      chosen.push(scene);
      accumulatedSec += scene.durationSec;
    }
  }

  chosen.sort((a, b) => a.narrativeOrder - b.narrativeOrder);

  return selectedHook ? [selectedHook, ...chosen] : chosen;
}

export function buildCodexCliCommand(
  codexConfig: CodexCliConfig,
  mainFrameConfig: MainFrameConfig,
  sourceTitle: string,
  headerText = ''
): string {
  const hookFlag = codexConfig.enforceThreeSecHook ? '--hook-first-3s' : '';
  const modeDesc =
    codexConfig.narrationMode === 'tts-voiceover'
      ? `TTS全程语音解说模式（音色 ${codexConfig.ttsVoiceName} + 同步双行字幕）`
      : '静默趣味黄字模式（保留原片环境音效 + 关键帧简短黄字）';

  const cleanHeader = headerText.replace(/\n/g, ' / ');
  const prompt = [
    `素材《${sourceTitle}》`,
    `模式：${modeDesc}`,
    cleanHeader ? `模板主题：「${cleanHeader}」` : '',
    `主画面比例：${mainFrameConfig.mainFrameRatio}（外框 ${mainFrameConfig.canvasRatio}）`,
    `请根据当前视频内容与模板主题生成专属解说稿并合成至 ${codexConfig.workspaceDir}`,
  ]
    .filter(Boolean)
    .join(' | ');

  return `${codexConfig.binaryPath} --model ${codexConfig.modelName} --approval-mode ${codexConfig.approvalMode} ${hookFlag} "${prompt}"`
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Builds a complete, from-scratch Jianying Pro (剪映专业版) draft_content.json project
 * containing the 9:16 canvas config, video track segments, template text overlays, and timed subtitles.
 */
export function buildJianyingDraftJson(
  material: MaterialSourceItem,
  mainFrameConfig: MainFrameConfig,
  templateLayers: TemplateLayer[],
  beats: StoryBeat[],
  narrationMode: NarrationMode
): Record<string, unknown> {
  const SEC_TO_US = 1_000_000;
  const totalDurationSec = beats[beats.length - 1]?.clipEndSec || 35.3;

  const videoSegments = beats.map((b) => ({
    id: `seg-${b.id}`,
    material_id: `mat-video-${material.id}`,
    target_timerange: {
      start: Math.round(b.clipStartSec * SEC_TO_US),
      duration: Math.round((b.clipEndSec - b.clipStartSec) * SEC_TO_US),
    },
    source_timerange: {
      start: Math.round(b.clipStartSec * SEC_TO_US),
      duration: Math.round((b.clipEndSec - b.clipStartSec) * SEC_TO_US),
    },
  }));

  const subtitleMaterials = beats.map((b) => ({
    id: `text-sub-${b.id}`,
    type: 'subtitle',
    content:
      narrationMode === 'tts-voiceover'
        ? b.yellowSubtitle
        : formatYellowQuote(b.yellowSubtitle, 'double-quotes'),
    tts_narration: b.ttsNarrationText || '',
    font_size: narrationMode === 'tts-voiceover' ? 14 : 17,
    text_color: narrationMode === 'tts-voiceover' ? '#FFFFFF' : '#FFE600',
  }));

  const subtitleSegments = beats.map((b) => ({
    id: `seg-sub-${b.id}`,
    material_id: `text-sub-${b.id}`,
    target_timerange: {
      start: Math.round(b.subtitleStartSec * SEC_TO_US),
      duration: Math.round((b.subtitleEndSec - b.subtitleStartSec) * SEC_TO_US),
    },
  }));

  return {
    canvas_config: {
      width: 1080,
      height: 1920,
      ratio: mainFrameConfig.canvasRatio,
      main_frame_ratio: mainFrameConfig.mainFrameRatio,
    },
    name: material.title,
    duration: Math.round(totalDurationSec * SEC_TO_US),
    narration_mode: narrationMode,
    materials: {
      videos: [
        {
          id: `mat-video-${material.id}`,
          path: material.videoUrl,
          title: material.title,
          crawl_origin_urls: material.crawlOriginUrls || [],
        },
      ],
      texts: [
        ...templateLayers
          .filter((l) => l.role !== 'subtitle-anchor')
          .map((l) => ({
            id: l.id,
            type: 'template_overlay',
            name: l.name,
            content: l.text,
            x_percent: l.xPercent,
            y_percent: l.yPercent,
            color: l.color,
          })),
        ...subtitleMaterials,
      ],
    },
    tracks: [
      { type: 'video', segments: videoSegments },
      { type: 'text', segments: subtitleSegments },
    ],
  };
}
