import { NextResponse } from 'next/server';
import { connectToDb } from '../../../services/mongodb';

export async function GET(request) {
  try {
    const database = await connectToDb();
    const sponsors = await database.collection('sponsors').find({}).toArray();
    
    return NextResponse.json(sponsors);
  } catch (error) {
    console.error('Failed to fetch sponsors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sponsors' }, 
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const database = await connectToDb();
    const body = await request.json();
    
    const result = await database.collection('sponsors').insertOne(body);
    
    return NextResponse.json(
      { message: 'Sponsor created', id: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create sponsor:', error);
    return NextResponse.json(
      { error: 'Failed to create sponsor' }, 
      { status: 500 }
    );
  }
}