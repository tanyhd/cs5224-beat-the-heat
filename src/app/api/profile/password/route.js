import { NextResponse } from 'next/server';
import { updateUserPassword } from "../../../../services/mongodb";
import { checkUserToken } from '../../../../services/mongodb';
import bcrypt from 'bcrypt';

export async function POST(req) {
    const saltRounds = 10;

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

        const { oldPassword, newPassword } = await req.json();
        const isPasswordValid = await bcrypt.compare(oldPassword, userInfo.password);
        if (!isPasswordValid) {
            return NextResponse.json({ message: 'Invalid old password' }, { status: 401 });
        }

        const salt = await bcrypt.genSalt(saltRounds);
        const hashPassword = await bcrypt.hash(newPassword, salt);
        
        const updatedUser = await updateUserPassword(userInfo.userId, hashPassword)
        if (!updatedUser) {
            return NextResponse.json({ error: "Update password error" }, { status: 404 });
        }

        return NextResponse.json(updatedUser.value);

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}