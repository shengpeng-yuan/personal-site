import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { UPLOAD_DIR, isSafeFilename, mimeFor } from '@/lib/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 读取上传的图片。
 * 上传目录在 public/ 之外，因此必须由这里把文件内容返回给浏览器。
 * 文件名由服务端生成（时间戳 + 随机串），内容不会变化，可以放心长期缓存。
 */
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  if (!isSafeFilename(name)) {
    return NextResponse.json({ error: '文件不存在' }, { status: 404 });
  }

  try {
    const buffer = await readFile(path.join(UPLOAD_DIR, name));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': mimeFor(name),
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: '文件不存在' }, { status: 404 });
  }
}
