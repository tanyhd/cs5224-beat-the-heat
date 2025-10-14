import { NextResponse } from 'next/server';
import { checkUserToken, deleteUserInfo } from '../../../../services/mongodb';

export async function POST(req) {

    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ message: 'Authorization header missing or invalid' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const userInfo = await checkUserToken(token);
        if (!userInfo) {
            return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
        }
        
        const result = await deleteUserInfo(userInfo.userId)
        if (result.deletedCount != 1) {
            return NextResponse.json({ error: "Delete user error" }, { status: 404 });
        }

        return NextResponse.json(result);

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}