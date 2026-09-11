import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ALLOWED_EXTENSIONS, UPLOAD_DIR } from '@/lib/uploads';

export const runtime = 'nodejs';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/** 上传图片，返回可直接引用的地址 /uploads/<filename> */
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '请选择要上传的文件' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: '仅支持上传图片文件' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '图片大小不能超过 5MB' }, { status: 400 });
  }

  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return NextResponse.json({ error: '不支持的图片格式' }, { status: 400 });
  }

  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
}
