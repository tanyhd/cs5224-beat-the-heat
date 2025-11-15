import { NextResponse } from 'next/server';
import { checkUserToken, getProgressForUserAndChallenge } from '@/services/mongodb';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const userInfo = await checkUserToken(token);
    if (!userInfo) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const challengeId = searchParams.get('challengeId');
    if (!challengeId) return NextResponse.json({ message: 'Missing challengeId' }, { status: 400 });

    const rows = await getProgressForUserAndChallenge(userInfo.userId, challengeId);
    return NextResponse.json({ progress: rows }, { status: 200 });
  } catch (err) {
    console.error('🔥 Error in get progress route:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
