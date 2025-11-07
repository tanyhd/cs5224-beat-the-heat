import { NextResponse } from 'next/server';
import { checkUserToken, getSavedRouteById } from '../../../../services/mongodb';

export async function GET(req, { params }) {
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
        const { routeId } = await params;
        const result = await getSavedRouteById(routeId, userInfo.userId);

        if (result.status === '200') {
            return NextResponse.json({ route: result.route }, { status: 200 });
        } else {
            return NextResponse.json({ message: result.message }, { status: parseInt(result.status) });
        }

    } catch (error) {
        console.error('Error in get route by ID API:', error);
        return NextResponse.json({ message: 'Error getting route', error: error.message }, { status: 500 });
    }
}
