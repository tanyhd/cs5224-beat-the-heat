import { NextResponse } from 'next/server';
import { extractByType } from '@/features/extractPDF';

export async function POST(req) {
  const data = await req.formData();
  const file = data.get('pdf');
  const type = data.get('type');

  if (!file || !type) {
    return new NextResponse('File and type are required', { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const rows = await extractByType(type, buffer);
    return NextResponse.json({ rows });
  } catch (err) {
    return new NextResponse(err.message || 'Failed to parse PDF', { status: 500 });
  }
}