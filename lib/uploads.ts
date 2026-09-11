import path from 'node:path';

/**
 * 上传文件的存放目录。
 *
 * 为什么不放在 public/ 下？Next.js 只会把「构建时已存在」的 public 文件交给
 * 内置服务器，运行时新增的文件在 `next start` 下会返回 404。
 * 因此这里放到项目根目录的 data/uploads，并统一通过 /uploads/[name] 路由读取。
 *
 * 生产环境可用环境变量 UPLOAD_DIR 指定到独立磁盘或数据目录。
 */
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), 'data', 'uploads');

export const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif'];

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
};

export function mimeFor(filename: string): string {
  return MIME_TYPES[path.extname(filename).toLowerCase()] ?? 'application/octet-stream';
}

/** 文件名白名单校验，避免路径穿越（如 ../../.env） */
export function isSafeFilename(name: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) && !name.includes('..');
}
