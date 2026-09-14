/* 知遇.同路人 — 数据层（已清空全部预设内容）
 * 业务类型与产品结构保留；用户、擦肩、演示主角等预设均已移除。
 * 后续可在此注入真实数据，或由 OAuth / API / AI 写入。
 */
window.TONG = window.TONG || {};

TONG.RELATIONS = {
  same: { key: 'same', name: '同路人', color: '#0084FF', soft: '#E8F3FF', desc: '现在正在经历相似阶段', icon: '同行' },
  ahead: { key: 'ahead', name: '前路人', color: '#10B981', soft: '#E6F8F1', desc: '曾经经历过你的当前阶段', icon: '前路' },
  complement: { key: 'complement', name: '补路人', color: '#F59E0B', soft: '#FFF7E6', desc: '知识与能力高度互补', icon: '互补' },
  different: { key: 'different', name: '异路人', color: '#8B5CF6', soft: '#F3EEFF', desc: '关注相似问题，但观点明显不同', icon: '异见' },
};

TONG.AVATAR_COLORS = [
  '#0084FF', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444',
  '#06B6D4', '#84CC16', '#EC4899', '#6366F1', '#14B8A6',
];

/* 当前用户：空壳，等待授权或手动填入 */
TONG.ME = {
  id: 'me',
  name: '我',
  avatarSeed: 'me',
  color: '#0084FF',
  currentStage: '',
  shortStage: '',
  skills: {},
  recentQuestions: [],
  topics: [],
  trajectory: [],
  socialIntent: 'open',
  willingToTalk: [],
  notWillingToTalk: [],
  privacyScopes: [],
  thinkingStyle: [],
  pathNodes: [],
};

/* 候选用户：空 */
TONG.USERS = [];

/* 今日擦肩：空 */
TONG.ENCOUNTERS = [];

/* 预交流摘要占位 */
TONG.PRECHAT_SUMMARIES = {
  default: [],
};

/* 同行地图节点上的人：空 */
TONG.MAP_PEOPLE = {};

TONG.DATA_NOTE = '预设演示数据已移除。';
