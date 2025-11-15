import { NextResponse } from 'next/server';
import { checkUserToken, deleteProgressRecord } from '@/services/mongodb';

export async function DELETE(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const userInfo = await checkUserToken(token);
    if (!userInfo) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const { entryId } = body;
    if (!entryId) return NextResponse.json({ message: 'Missing entryId' }, { status: 400 });

    const result = await deleteProgressRecord(userInfo.userId, entryId);
    return NextResponse.json({ message: result.message }, { status: parseInt(result.status) });
  } catch (err) {
    console.error('🔥 Error in delete progress route:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
