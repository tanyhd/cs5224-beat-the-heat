import { NextResponse } from 'next/server';
import { checkUserToken, createSharedRoute, getSavedRouteById, updateSavedRouteShareId } from '../../../../services/mongodb';

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

    // Get the base URL dynamically from the request
    const host = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

    try {
        const body = await req.json();
        const { routeId, routeName, origin, destination, preferences, routeData, selectedRouteIndex } = body;

        // Validate required fields
        if (!routeName || !origin || !destination) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // If routeId is provided, check if this saved route already has a shareId
        if (routeId) {
            const savedRouteResult = await getSavedRouteById(routeId, userInfo.userId);

            if (savedRouteResult.status === '200' && savedRouteResult.route.shareId) {
                // Route already has a shareId, return the existing share URL
                return NextResponse.json({
                    message: 'Route already shared',
                    shareId: savedRouteResult.route.shareId,
                    shareUrl: `${baseUrl}/shared/${savedRouteResult.route.shareId}`,
                    isExisting: true
                }, { status: 200 });
            }
        }

        // Create new shared route
        const routeDataWithUser = {
            userId: userInfo.userId,
            routeName,
            origin,
            destination,
            preferences,
            routeData,
            selectedRouteIndex
        };

        const result = await createSharedRoute(routeDataWithUser);

        if (result.status === '200') {
            // If routeId is provided, update the saved route with the shareId
            if (routeId) {
                await updateSavedRouteShareId(routeId, userInfo.userId, result.shareId);
            }

            return NextResponse.json({
                message: result.message,
                shareId: result.shareId,
                shareUrl: `${baseUrl}/shared/${result.shareId}`,
                isExisting: false
            }, { status: 200 });
        } else {
            return NextResponse.json({ message: result.message }, { status: parseInt(result.status) });
        }

    } catch (error) {
        console.error('Error in share route API:', error);
        return NextResponse.json({ message: 'Error sharing route', error: error.message }, { status: 500 });
    }
}
