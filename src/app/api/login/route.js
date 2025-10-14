import { NextResponse } from 'next/server';
import { findUserByEmail, updateUserToken } from '../../../services/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';

export async function POST(req) {
    try {
        const { email, password } = await req.json();
        const user = await findUserByEmail(email);

        if (!user) {
            return NextResponse.json({ message: 'Invalid email' }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ message: 'Invalid password' }, { status: 401 });
        }

        const token = new ObjectId().toHexString();
        const result = await updateUserToken(email, token)
        if (result.modifiedCount === 1) {
            return NextResponse.json({token : token});
        }
        return NextResponse.json({ message: 'Login error' }, { status: 401 });

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}