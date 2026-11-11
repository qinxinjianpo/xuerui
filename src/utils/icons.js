/**
 * 分类图标库（单色线性，24×24 网格）
 *
 * 设计约定：
 * - viewBox 固定 0 0 24 24，描边由外层 <svg> 统一给（1.85px、圆头、圆角）
 * - 路径只写几何，不带 fill/stroke，靠 CSS 的 currentColor 继承文字颜色
 * - class="soft" 的线条由 CSS 降透明度，用来做「次要结构」形成层次
 * - 新增分类时只需在 ICON_LIST 里加一项，前端与后台会自动出现
 */

/** key → 路径。class="soft" = 辅助线（淡） */
const ICON_PATHS = {
  /* ── 常用 / 生活 ── */
  home: '<path d="M3.8 10.6L12 3.9l8.2 6.7"/><path d="M6 9.7v10.1h12V9.7"/><path class="soft" d="M9.9 19.8v-5.4h4.2v5.4"/>',
  star: '<path d="M12 3.4l2.7 5.5 6 .87-4.35 4.24 1.03 6L12 17.03l-5.38 2.8 1.03-6L3.3 9.77l6-.87z"/>',
  bookmark: '<path d="M6.6 4.2h10.8a1 1 0 011 1v14.6l-6.4-4.1-6.4 4.1V5.2a1 1 0 011-1z"/>',
  pin: '<path d="M12 21.1c3.4-4.2 5.6-7.3 5.6-10a5.6 5.6 0 10-11.2 0c0 2.7 2.2 5.8 5.6 10z"/><circle class="soft" cx="12" cy="11" r="2.1"/>',
  heart: '<path d="M20.6 6.8a5 5 0 00-7.1 0L12 8.3l-1.5-1.5a5 5 0 00-7.1 7.1l8.6 8.6 8.6-8.6a5 5 0 000-7.1z"/>',
  sparkles: '<path d="M11.4 3.4l1.7 4.4 4.4 1.7-4.4 1.7-1.7 4.4-1.7-4.4-4.4-1.7 4.4-1.7z"/><path class="soft" d="M17.8 14.6l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z"/>',
  compass: '<circle cx="12" cy="12" r="8.4"/><path d="M15.4 8.6l-1.95 4.85-4.85 1.95 1.95-4.85z"/>',
  clock: '<circle cx="12" cy="12" r="8.4"/><path class="soft" d="M12 7.5V12l3.1 1.95"/>',
  calendar: '<rect x="3.6" y="5.4" width="16.8" height="15" rx="2.8"/><path class="soft" d="M3.6 10.3h16.8M8.3 3.2v4.2M15.7 3.2v4.2"/>',
  map: '<path d="M3.6 6.7l5.6-2.5 5.6 2.5 5.6-2.5v13l-5.6 2.5-5.6-2.5-5.6 2.5z"/><path class="soft" d="M9.2 4.2v13M14.8 6.7v13"/>',
  folder: '<path d="M3.4 7.3a2.2 2.2 0 012.2-2.2h3.4l2.2 2.9h7.2a2.2 2.2 0 012.2 2.2v7.2a2.2 2.2 0 01-2.2 2.2H5.6a2.2 2.2 0 01-2.2-2.2z"/>',
  box: '<path d="M12 3.5l8.2 4.6v7.8L12 20.5l-8.2-4.6V8.1z"/><path class="soft" d="M3.8 8.1L12 12.7l8.2-4.6M12 12.7v7.8"/>',

  /* ── 阅读 / 学习 ── */
  book: '<path d="M12 7.1C10.4 5.4 8.2 4.5 5.9 4.5H3.6v13.1h2.3c2.3 0 4.5.9 6.1 2.6 1.6-1.7 3.8-2.6 6.1-2.6h2.3V4.5h-2.3c-2.3 0-4.5.9-6.1 2.6z"/><path class="soft" d="M12 7.1v13.1"/>',
  pencil: '<path d="M4 20l1.15-4.7L16.4 4.05a2 2 0 012.83 2.83L7.98 18.13 4 20z"/><path class="soft" d="M14.5 5.9l3.6 3.6"/>',
  doc: '<path d="M13.4 3.6H7.2a2 2 0 00-2 2v12.8a2 2 0 002 2h9.6a2 2 0 002-2V9z"/><path class="soft" d="M13.4 3.6V9h5.4M8.7 13.1h6.6M8.7 16.5h4.4"/>',
  layers: '<path d="M12 3.7l8.3 4.2-8.3 4.2-8.3-4.2z"/><path class="soft" d="M3.7 12.6l8.3 4.2 8.3-4.2"/>',
  grad: '<path d="M12 4.2l9 4.1-9 4.1-9-4.1z"/><path class="soft" d="M6.6 10.3v4.4c0 1.7 2.4 3.1 5.4 3.1s5.4-1.4 5.4-3.1v-4.4M21 8.3v5.2"/>',

  /* ── 影音 / 娱乐 ── */
  film: '<rect x="3" y="4.6" width="18" height="14.8" rx="3.2"/><path d="M12 9.4l4 2.6-4 2.6z"/>',
  music: '<path d="M9.2 17.6V6.3l9.8-2v11"/><circle cx="6.6" cy="17.8" r="2.6"/><circle cx="16.4" cy="15.3" r="2.6"/>',
  gamepad: '<path d="M7.9 8.1h8.2a5.1 5.1 0 015.1 4.7l.35 3.1a2.55 2.55 0 01-4.5 1.95L15.5 16H8.5l-1.55 1.85A2.55 2.55 0 012.45 15.9l.35-3.1A5.1 5.1 0 017.9 8.1z"/><path d="M8.1 11.1v2.6M6.8 12.4h2.6"/><circle class="soft" cx="15.6" cy="12.3" r=".85"/><circle class="soft" cx="17.5" cy="13.7" r=".85"/>',
  monitor: '<rect x="3.2" y="4.6" width="17.6" height="12.4" rx="2.6"/><path class="soft" d="M8.7 20.4h6.6M12 17v3.4"/>',
  camera: '<path d="M4.4 8.9h2.9l1.4-2.3h6.6l1.4 2.3h2.9a1.7 1.7 0 011.7 1.7v7.1a1.7 1.7 0 01-1.7 1.7H4.4a1.7 1.7 0 01-1.7-1.7v-7.1a1.7 1.7 0 011.7-1.7z"/><circle class="soft" cx="12" cy="13.9" r="3.2"/>',
  mic: '<rect x="9.2" y="3.4" width="5.6" height="10.4" rx="2.8"/><path class="soft" d="M6 11.2a6 6 0 0012 0M12 17.2v3.4"/>',

  /* ── 技术 / 网络 ── */
  cloud: '<path d="M7.3 18.5h9.4a3.9 3.9 0 00.55-7.75A6.1 6.1 0 005.55 12.3a3.25 3.25 0 001.75 6.2z"/><path class="soft" d="M12 15.6V11M10 12.9l2-1.9 2 1.9"/>',
  code: '<path d="M9.3 8.1L4.8 12l4.5 3.9"/><path d="M14.7 8.1L19.2 12l-4.5 3.9"/>',
  terminal: '<rect x="3.4" y="4.6" width="17.2" height="14.8" rx="2.8"/><path class="soft" d="M7.7 10.5l2.5 2.2-2.5 2.2"/><path class="soft" d="M12.9 15.1h3.6"/>',
  cpu: '<rect x="6.4" y="6.4" width="11.2" height="11.2" rx="2.4"/><rect class="soft" x="10" y="10" width="4" height="4" rx="1"/><path class="soft" d="M9.6 3v3.4M14.4 3v3.4M9.6 17.6V21M14.4 17.6V21M3 9.6h3.4M3 14.4h3.4M17.6 9.6H21M17.6 14.4H21"/>',
  sliders: '<path d="M4 7.3h8.6M17.4 7.3H20M4 16.7h2.6M11.4 16.7H20"/><circle class="soft" cx="14.8" cy="7.3" r="2.2"/><circle class="soft" cx="9.2" cy="16.7" r="2.2"/>',
  link: '<path d="M9.7 13.9a3.9 3.9 0 005.5 0l2.8-2.8a3.9 3.9 0 00-5.5-5.5l-1.2 1.2"/><path d="M14.3 10.1a3.9 3.9 0 00-5.5 0l-2.8 2.8a3.9 3.9 0 005.5 5.5l1.2-1.2"/>',
  globe: '<circle cx="12" cy="12" r="8.4"/><path class="soft" d="M3.6 12h16.8"/><path class="soft" d="M12 3.6c2.2 2.3 3.4 5.3 3.4 8.4s-1.2 6.1-3.4 8.4c-2.2-2.3-3.4-5.3-3.4-8.4s1.2-6.1 3.4-8.4z"/>',
  shield: '<path d="M12 3.4l7.4 2.9v5.4c0 4.4-3 7.9-7.4 9-4.4-1.1-7.4-4.6-7.4-9V6.3z"/><path class="soft" d="M8.9 12.2l2.3 2.3 4-4.4"/>',
  key: '<circle cx="8.4" cy="15.6" r="3.4"/><path class="soft" d="M10.9 13.1L19.2 4.8M16.5 7.5l2.2 2.2M14.3 9.7l2.2 2.2"/>',
  lock: '<rect x="4.5" y="10.4" width="15" height="9.6" rx="2.7"/><path d="M8.2 10.4V7.9a3.8 3.8 0 017.6 0v2.5"/>',
  download: '<path d="M12 3.9v11.3"/><path d="M7.6 11l4.4 4.4 4.4-4.4"/><path class="soft" d="M4 19.7h16"/>',

  /* ── 商业 / 信息 ── */
  briefcase: '<rect x="3" y="7.3" width="18" height="12.6" rx="2.9"/><path d="M8.5 7.3V5.7a2 2 0 012.05-2h2.9a2 2 0 012.05 2v1.6"/><path class="soft" d="M3 12.3h18"/>',
  bulb: '<path d="M12 3a6.3 6.3 0 00-3.78 11.3c.52.42.93 1.03.93 1.76v.34h5.7v-.34c0-.73.41-1.34.93-1.76A6.3 6.3 0 0012 3z"/><path class="soft" d="M9.5 18.9h5M10.4 21.2h3.2"/>',
  chart: '<path d="M3.5 19.4h17"/><path d="M6.3 15.5l4.3-4.7 3 2.6 5.5-6.1"/><path class="soft" d="M14.7 7.3h4.4V11.7"/>',
  wallet: '<rect x="3.2" y="6.6" width="17.6" height="13" rx="2.8"/><path class="soft" d="M3.2 10.6h17.6"/><path class="soft" d="M16.2 15.3h1.9"/>',
  cart: '<path d="M3.2 4.6h2.6l2.4 10.2h9.4l2.2-7.4H7"/><circle class="soft" cx="9.4" cy="18.7" r="1.7"/><circle class="soft" cx="16.6" cy="18.7" r="1.7"/>',
  users: '<circle cx="9.2" cy="8.3" r="3.4"/><path class="soft" d="M3.2 19.5a6 6 0 0112 0"/><path class="soft" d="M16.1 5.4a3.4 3.4 0 010 6.6M17.5 14.2a6 6 0 013.3 5.3"/>',
  chat: '<path d="M20.4 11.7a7.9 7.9 0 01-11.7 7l-5.1 1.4 1.4-4.9a7.9 7.9 0 1115.4-3.5z"/>',
  mail: '<rect x="3.2" y="5.4" width="17.6" height="13.2" rx="2.8"/><path class="soft" d="M3.7 7.5l8.3 5.9 8.3-5.9"/>',
  robot: '<rect x="4.4" y="8.4" width="15.2" height="10.8" rx="3.2"/><path d="M12 4.9v3.5"/><circle class="soft" cx="12" cy="3.5" r="1.3"/><circle class="soft" cx="9.3" cy="13.2" r="1.2"/><circle class="soft" cx="14.7" cy="13.2" r="1.2"/><path class="soft" d="M9.7 16.6h4.6"/>',
  moon: '<path d="M20.4 15.4A8.6 8.6 0 019.2 4.2a8.6 8.6 0 1011.2 11.2z"/>'
}

/** 后台选择器展示用：分组 + 中文名 */
export const ICON_GROUPS = [
  {
    name: '常用 / 生活',
    icons: [
      ['home', '首页'],
      ['star', '星标'],
      ['bookmark', '书签'],
      ['pin', '定位'],
      ['heart', '收藏'],
      ['sparkles', '精选'],
      ['compass', '导航'],
      ['clock', '时间'],
      ['calendar', '日历'],
      ['map', '地图'],
      ['folder', '文件夹'],
      ['box', '收纳']
    ]
  },
  {
    name: '阅读 / 学习',
    icons: [
      ['book', '阅读'],
      ['pencil', '笔记'],
      ['doc', '文档'],
      ['layers', '资料'],
      ['grad', '学习']
    ]
  },
  {
    name: '影音 / 娱乐',
    icons: [
      ['film', '影视'],
      ['music', '音乐'],
      ['gamepad', '游戏'],
      ['monitor', '屏幕'],
      ['camera', '摄影'],
      ['mic', '音频']
    ]
  },
  {
    name: '技术 / 网络',
    icons: [
      ['cloud', '云盘'],
      ['code', '代码'],
      ['terminal', '终端'],
      ['cpu', '硬件'],
      ['sliders', '工具'],
      ['link', '链接'],
      ['globe', '网络'],
      ['shield', '安全'],
      ['key', '密钥'],
      ['lock', '私密'],
      ['download', '下载']
    ]
  },
  {
    name: '商业 / 信息',
    icons: [
      ['briefcase', '办公'],
      ['bulb', '灵感'],
      ['chart', '金融'],
      ['wallet', '钱包'],
      ['cart', '购物'],
      ['users', '社区'],
      ['chat', '聊天'],
      ['mail', '邮箱'],
      ['robot', 'AI'],
      ['moon', '夜间']
    ]
  }
]

/** 老数据用的是 emoji，这里做一次映射，避免历史分类全变成缺省图标 */
const EMOJI_MAP = {
  '💥': 'sparkles',
  '⭐': 'star',
  '🌟': 'star',
  '✨': 'sparkles',
  '🔖': 'bookmark',
  '🏠': 'home',
  '📍': 'pin',
  '📌': 'pin',
  '❤️': 'heart',
  '💛': 'heart',
  '📁': 'folder',
  '🗂️': 'folder',
  '📦': 'box',
  '📚': 'book',
  '📖': 'book',
  '📕': 'book',
  '📝': 'pencil',
  '✏️': 'pencil',
  '📄': 'doc',
  '📓': 'doc',
  '🗂': 'layers',
  '🎓': 'grad',
  '🎬': 'film',
  '🎞️': 'film',
  '📺': 'monitor',
  '🎵': 'music',
  '🎧': 'music',
  '🎮': 'gamepad',
  '🕹️': 'gamepad',
  '📷': 'camera',
  '📸': 'camera',
  '🎤': 'mic',
  '☁️': 'cloud',
  '☁': 'cloud',
  '💻': 'code',
  '🖥️': 'monitor',
  '⌨️': 'terminal',
  '🧩': 'layers',
  '🐙': 'code',
  '🛠️': 'sliders',
  '🔧': 'sliders',
  '⚙️': 'sliders',
  '🧰': 'box',
  '🔗': 'link',
  '🌐': 'globe',
  '📡': 'globe',
  '🔒': 'lock',
  '🛡️': 'shield',
  '🔑': 'key',
  '💼': 'briefcase',
  '💡': 'bulb',
  '📊': 'chart',
  '📈': 'chart',
  '💰': 'wallet',
  '🛒': 'cart',
  '👥': 'users',
  '💬': 'chat',
  '💌': 'mail',
  '📱': 'monitor',
  '🤖': 'robot',
  '🚀': 'sparkles',
  '🧭': 'compass',
  '🕐': 'clock',
  '📅': 'calendar',
  '🗺️': 'map',
  '⬇️': 'download',
  '🌙': 'moon',
  '🔍': 'compass',
  '📰': 'doc',
  '🎨': 'sparkles',
  '🖌️': 'pencil',
  '🖼️': 'camera',
  '📐': 'sliders',
  '📹': 'camera'
}

/**
 * 把分类里存的原始值（新 key / 老 emoji / 空）统一成可用的图标 key。
 * 认不出来的一律回落到 folder，保证界面上永远有图标。
 */
function iconKey(raw) {
  if (!raw) return 'folder'
  const v = String(raw).trim()
  if (ICON_PATHS[v]) return v
  if (EMOJI_MAP[v]) return EMOJI_MAP[v]
  return 'folder'
}

/** 取图标路径；认不出返回 null 时由调用方决定兜底 */
export function iconPath(raw) {
  return ICON_PATHS[iconKey(raw)] || ICON_PATHS.folder
}

/**
 * 拼出可直接塞进 v-html 的完整 <svg>。
 * 描边参数统一在这里给，模板里就不用重复写了。
 */
export function iconSvg(raw, opts = {}) {
  const w = opts.strokeWidth || 1.85
  return (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    `stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">` +
    iconPath(raw) +
    '</svg>'
  )
}
