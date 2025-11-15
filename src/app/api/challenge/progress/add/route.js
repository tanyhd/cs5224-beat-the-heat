import { NextResponse } from 'next/server';
import { checkUserToken, addProgressRecord } from '@/services/mongodb';

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const userInfo = await checkUserToken(token);
    if (!userInfo) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    const { challengeId, date, activity, km } = body;

    if (!date || !activity || typeof km === 'undefined') {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const result = await addProgressRecord({
      userId: userInfo.userId,
      challengeId: challengeId || null, // store null if no challenge
      date,
      activity,
      km: Number(km)
    });

    if (result.status === '200') return NextResponse.json({ message: result.message, progress: result.progress }, { status: 200 });
    return NextResponse.json({ message: result.message }, { status: 500 });
  } catch (err) {
    console.error('🔥 Error in add progress route:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
