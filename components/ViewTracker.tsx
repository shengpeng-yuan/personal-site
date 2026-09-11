'use client';

import { useEffect } from 'react';

/** 文章阅读量统计：进入详情页时上报一次（同一会话内不重复计数） */
export function ViewTracker({ postId }: { postId: number }) {
  useEffect(() => {
    const key = `viewed:${postId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* 忽略隐私模式下的存储异常 */
    }

    fetch(`/api/posts/${postId}/view`, { method: 'POST' }).catch(() => {
      /* 统计失败不影响页面 */
    });
  }, [postId]);

  return null;
}
