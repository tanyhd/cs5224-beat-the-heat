import { NextResponse } from 'next/server';
import { getSharedRoute } from '../../../../services/mongodb';

export async function GET(req, { params }) {
    try {
        const { shareId } = await params;
        const result = await getSharedRoute(shareId);

        if (result.status === '200') {
            return NextResponse.json({ route: result.route }, { status: 200 });
        } else {
            return NextResponse.json({ message: result.message }, { status: parseInt(result.status) });
        }

    } catch (error) {
        console.error('Error in get shared route API:', error);
        return NextResponse.json({ message: 'Error getting shared route', error: error.message }, { status: 500 });
    }
}
