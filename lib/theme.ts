/**
 * 主题（亮色 / 暗色）相关逻辑。
 *
 * 解析优先级：
 *   1. 用户手动选择过（localStorage 里的 theme）→ 以用户选择为准
 *   2. 未手动选择 → 若启用时段规则，按访客本地时间决定；否则跟随系统偏好
 *
 * 时间按**访客本地时间**计算（new Date() 用的是浏览器时区），
 * 所以不同时区的访客各自按自己的作息看到对应的主题。
 */

export const THEME_STORAGE_KEY = 'theme';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export type ThemeSchedule = {
  enabled: boolean;
  /** 亮色时段开始，格式 HH:MM */
  lightStart: string;
  /** 亮色时段结束，格式 HH:MM；其余时段为暗色 */
  lightEnd: string;
};

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

/** 判断某个时刻是否落在「亮色时段」内，支持跨午夜（如 20:00 → 06:00） */
export function isLightTime(schedule: ThemeSchedule, date: Date = new Date()): boolean {
  const start = toMinutes(schedule.lightStart);
  const end = toMinutes(schedule.lightEnd);
  const now = date.getHours() * 60 + date.getMinutes();

  return start <= end ? now >= start && now < end : now >= start || now < end;
}

/** 计算「自动」模式下当前应收敛到的主题 */
export function resolveAutoTheme(
  schedule: ThemeSchedule,
  date: Date = new Date(),
): ResolvedTheme {
  if (schedule.enabled) {
    return isLightTime(schedule, date) ? 'light' : 'dark';
  }
  // 未启用时段规则时跟随系统偏好
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * 返回主题按钮的三态循环顺序。
 *
 * 为了让每次点击都能看到变化，第一个显式选项取「当前自动主题的反面」：
 *   自动(当前亮) → 暗色 → 亮色 → 自动
 *   自动(当前暗) → 亮色 → 暗色 → 自动
 *
 * 注意这里返回的是**完整顺序**而不是单步结果：因为「自动」显示出来的效果
 * 可能和某个显式选项完全相同（例如白天自动＝亮色），一旦脱离了自动态，
 * 就无法只靠「当前模式」推断下一步该往哪走。所以顺序要在离开自动态的那一刻定下来。
 */
export function themeCycle(autoResolved: ResolvedTheme): ThemeMode[] {
  return autoResolved === 'light' ? ['auto', 'dark', 'light'] : ['auto', 'light', 'dark'];
}

/** 取循环中的下一个模式 */
export function nextInCycle(order: ThemeMode[], current: ThemeMode): ThemeMode {
  const index = order.indexOf(current);
  return order[(index + 1) % order.length];
}

/** 读取用户的手动选择；未选择过则返回 auto */
export function readStoredThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* 隐私模式下忽略 */
  }
  return 'auto';
}

/** 应用主题（写 DOM + 持久化），返回实际生效的主题 */
export function applyTheme(mode: ThemeMode, schedule: ThemeSchedule): ResolvedTheme {
  const resolved: ResolvedTheme = mode === 'auto' ? resolveAutoTheme(schedule) : mode;

  document.documentElement.classList.toggle('dark', resolved === 'dark');

  try {
    if (mode === 'auto') {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  } catch {
    /* 隐私模式下忽略写入失败 */
  }

  return resolved;
}

/**
 * 生成首屏防闪烁脚本：在 HTML 解析阶段（早于首次绘制）就决定主题。
 * 必须内联在 <head> 里同步执行，否则会出现「先白后黑」的闪动。
 */
export function buildThemeScript(schedule: ThemeSchedule): string {
  const config = JSON.stringify(schedule);

  return `(function(){try{
var s=${config};
var m=null;try{m=localStorage.getItem('${THEME_STORAGE_KEY}')}catch(e){}
var mode=(m==='light'||m==='dark')?m:'auto';
if(mode==='auto'){
  if(s.enabled){
    var n=new Date();
    var c=n.getHours()*60+n.getMinutes();
    var a=s.lightStart.split(':'),b=s.lightEnd.split(':');
    var st=(+a[0])*60+(+a[1]),en=(+b[0])*60+(+b[1]);
    var light=st<=en?(c>=st&&c<en):(c>=st||c<en);
    mode=light?'light':'dark';
  }else{
    mode=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';
  }
}
if(mode==='dark'){document.documentElement.classList.add('dark')}
}catch(e){}})();`;
}
