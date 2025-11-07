import { NextResponse } from 'next/server';
import { checkUserToken, getUserSavedRoutes } from '../../../services/mongodb';

export async function GET(req) {
    // Check authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ message: 'Authorization header missing or invalid' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const userInfo = await checkUserToken(token);
    if (!userInfo) {
        return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    try {
        const result = await getUserSavedRoutes(userInfo.userId);

        if (result.status === '200') {
            return NextResponse.json({ routes: result.routes }, { status: 200 });
        } else {
            return NextResponse.json({ message: result.message }, { status: parseInt(result.status) });
        }

    } catch (error) {
        console.error('Error in get routes API:', error);
        return NextResponse.json({ message: 'Error getting routes', error: error.message }, { status: 500 });
    }
}
