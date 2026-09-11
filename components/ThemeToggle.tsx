'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock, Moon, Sun } from 'lucide-react';
import {
  applyTheme,
  nextInCycle,
  readStoredThemeMode,
  resolveAutoTheme,
  themeCycle,
  type ResolvedTheme,
  type ThemeMode,
  type ThemeSchedule,
} from '@/lib/theme';

type Labels = {
  theme: string;
  auto: string;
  light: string;
  dark: string;
};

/**
 * 主题切换按钮，三种状态循环：跟随时间 → 亮色 → 暗色 → 跟随时间
 * （「跟随时间」即按站点设置里的亮/暗时段，按访客本地时间自动决定）
 */
export function ThemeToggle({ schedule, labels }: { schedule: ThemeSchedule; labels: Labels }) {
  const [mode, setMode] = useState<ThemeMode>('auto');
  const [resolved, setResolved] = useState<ResolvedTheme>('light');

  const { enabled, lightStart, lightEnd } = schedule;
  const scheduleInput = { enabled, lightStart, lightEnd };

  // 本轮循环的顺序，在离开「跟随时间」时确定（原因见 lib/theme.ts 的 themeCycle 注释）
  const cycle = useRef<ThemeMode[]>(['auto', 'dark', 'light']);

  useEffect(() => {
    const current = readStoredThemeMode();
    setMode(current);
    // 手动选择过时，实际生效的就是用户的选择；
    // 只有「跟随时间」才需要按当前时段/系统偏好推算
    setResolved(current === 'auto' ? resolveAutoTheme(scheduleInput) : current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, lightStart, lightEnd]);

  function toggle() {
    const currentResolved = mode === 'auto' ? resolveAutoTheme(scheduleInput) : mode;

    if (mode === 'auto') {
      cycle.current = themeCycle(currentResolved);
    }

    const next = nextInCycle(cycle.current, mode);
    setMode(next);
    setResolved(applyTheme(next, scheduleInput));
  }

  const modeLabel = mode === 'auto' ? labels.auto : mode === 'light' ? labels.light : labels.dark;
  const title = `${labels.theme}：${modeLabel}（点击切换）`;
  const Icon = mode === 'auto' ? Clock : resolved === 'dark' ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={title}
      title={title}
      className="grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--border))] text-muted transition hover:bg-black/5 dark:hover:bg-white/10"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
