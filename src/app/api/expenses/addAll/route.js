import { NextResponse } from 'next/server';
import { checkUserToken, addAllExpensesToCreditCard } from '../../../../services/mongodb';

export async function POST(req) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ message: 'Authorization header missing or invalid' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const userInfo = await checkUserToken(token);
    if (!userInfo) {
        return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
    }

    const payload = await req.json();
    const { cardNumber, expenses } = payload;

    const result = await addAllExpensesToCreditCard(cardNumber, expenses);
    if (result.status === '500') {
        return NextResponse.json({ message: result.message }, { status: 500 });
    }
    if (result.status === '200') {
        return NextResponse.json({ message: result.message }, { status: 200 });
    }
}