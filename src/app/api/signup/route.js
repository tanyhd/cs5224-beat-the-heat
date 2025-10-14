
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import { addNewUser, findUserByEmail } from '../../../services/mongodb';

export async function POST(req) {
    const saltRounds = 10;

    try {
        const { email, name, password } = await req.json();
        const user = await findUserByEmail(email);

        if (user) {
            return NextResponse.json({ message: 'Email exist' }, { status: 401 });
        }

        const token = new ObjectId().toHexString();
        const salt = await bcrypt.genSalt(saltRounds);
        const hashPassword = await bcrypt.hash(password, salt);

        const result = await addNewUser(email, name, hashPassword, token)
        if (result.insertedCount === 1) {
            return NextResponse.json({
                token: token
            });
        }
        return NextResponse.json({ message: 'Sign up error' }, { status: 401 });
        
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}