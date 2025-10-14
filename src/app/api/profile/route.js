import { NextResponse } from 'next/server';
import { checkUserToken, findUserByEmail, updateUserInfo } from '../../../services/mongodb';

export async function GET(req) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.split(" ")[1];
        const user = await checkUserToken(token)

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.split(" ")[1];
        const user = await checkUserToken(token)

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        const { name, email } = await req.json();

        if (email != user.email) {
            const user = await findUserByEmail(email)
            if (user) {
                return NextResponse.json({ error: "This email is associated with another account." }, { status: 409 });
            }
        }

        const updatedUser = await updateUserInfo(user.userId, name, email)
        if (!updatedUser) return NextResponse.json({ error: "Update profile error" }, { status: 404 });

        return NextResponse.json(updatedUser.value);
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
    
}