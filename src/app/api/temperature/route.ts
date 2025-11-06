import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      'https://api-open.data.gov.sg/v2/real-time/api/air-temperature',
      {
        // Cache for 5 minutes to avoid excessive API calls
        next: { revalidate: 300 }
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch temperature data:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch temperature data' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.code !== 0) {
      console.error('Temperature API returned error:', data.errorMsg);
      return NextResponse.json(
        { error: data.errorMsg || 'API error' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching temperature data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
