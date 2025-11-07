import { NextResponse } from 'next/server';
import { checkUserToken, saveRoute } from '../../../../services/mongodb';

export async function POST(req) {
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
        const body = await req.json();
        console.log('API received body:', JSON.stringify(body, null, 2));

        const { routeName, origin, destination, preferences, routeData, selectedRouteIndex } = body;

        // Validate required fields
        if (!routeName || !origin || !destination) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        console.log('Extracted selectedRouteIndex:', selectedRouteIndex);

        // Add userId to the route data
        const routeDataWithUser = {
            userId: userInfo.userId,
            routeName,
            origin,
            destination,
            preferences,
            routeData,
            selectedRouteIndex
        };

        const result = await saveRoute(routeDataWithUser);

        if (result.status === '200') {
            return NextResponse.json({
                message: result.message,
                routeId: result.routeId
            }, { status: 200 });
        } else {
            return NextResponse.json({ message: result.message }, { status: parseInt(result.status) });
        }

    } catch (error) {
        console.error('Error in save route API:', error);
        return NextResponse.json({ message: 'Error saving route', error: error.message }, { status: 500 });
    }
}
