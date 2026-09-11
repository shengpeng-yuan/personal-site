'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 前台进入后台的「隐藏入口」。
 *
 * ⚠️ 请注意：这只是**便利入口**，不是安全措施。任何前端隐藏手段都能被懂技术的人找到，
 * 真正的防护是登录页的用户名密码 + 后台的会话校验。所以这里不需要、也不应该
 * 把它当成机密来对待。
 *
 * 默认提供两种触发方式（都不可见，不会影响正常浏览）：
 *   1. SecretAdminKeyboard —— 依次敲入密语（默认 admin），任意页面都可用
 *   2. SecretAdminClick    —— 连续点击某个元素 5 次（3 秒内），适配手机端
 *
 * 想换密语或点击次数，改下面的常量即可（改完需要重新 build）。
 */

const PASSPHRASE = 'admin';
const CLICK_COUNT = 5;
const CLICK_WINDOW_MS = 3000;

const ADMIN_PATH = '/admin';

function useGoAdmin() {
  const router = useRouter();
  return useCallback(() => router.push(ADMIN_PATH), [router]);
}

/** 判断事件是否发生在输入框里，避免用户在搜索框打字时被误触发 */
function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/**
 * 键盘密语入口：在页面上依次敲入密语即可跳转后台。
 * 放在前台 layout 里，所有前台页面都能用。
 */
export function SecretAdminKeyboard() {
  const goAdmin = useGoAdmin();
  const buffer = useRef('');

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // 输入框内、或带修饰键（Ctrl+C 等）时忽略
      if (isTypingTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.length !== 1) return; // 只关心可打印字符

      buffer.current = (buffer.current + event.key.toLowerCase()).slice(-PASSPHRASE.length);

      if (buffer.current === PASSPHRASE) {
        buffer.current = '';
        goAdmin();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goAdmin]);

  return null;
}

/**
 * 连续点击入口：在限定时间内连点 N 次即跳转后台。
 * 用 display:contents 包裹，不产生额外盒子，不会影响原有布局。
 */
export function SecretAdminClick({ children }: { children: React.ReactNode }) {
  const goAdmin = useGoAdmin();
  const hits = useRef<number[]>([]);

  function handleClick() {
    const now = Date.now();
    hits.current = [...hits.current.filter((time) => now - time < CLICK_WINDOW_MS), now];

    if (hits.current.length >= CLICK_COUNT) {
      hits.current = [];
      goAdmin();
    }
  }

  return (
    <span className="contents" onClick={handleClick}>
      {children}
    </span>
  );
}
