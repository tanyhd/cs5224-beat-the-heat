import { NextResponse } from 'next/server';
import { checkUserToken, updateChallengeStatus } from '@/services/mongodb';

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
    const { challengeId } = body;
    if (!challengeId) return NextResponse.json({ message: 'Missing challengeId' }, { status: 400 });

    const result = await updateChallengeStatus(userInfo.userId, challengeId, 'Completed');

    return NextResponse.json({ message: result.message }, { status: parseInt(result.status) });
  } catch (err) {
    console.error('🔥 Error completing challenge:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
