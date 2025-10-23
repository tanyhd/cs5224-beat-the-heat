import { NextResponse } from 'next/server';
import { findAllScrapedData } from "../../../services/mongodb";
import { saveScrapedData } from '../../../services/mongodb';
import { scrapeActiveSGCircleEvents, scrapeHealthHubProgrammes, scrapeNparksEvents } from '../../../services/scrape';

export const settledToArray = (res, label) => {
  if (res.status === 'fulfilled') {
    if (Array.isArray(res.value)) return res.value;
    console.warn(`[scrape] ${label} returned non-array, coercing to []`);
    return [];
  } else {
    console.error(`[scrape] ${label} failed:`, res.reason);
    return [];
  }
};

export async function GET() {
    try {
        let result = await findAllScrapedData();

        if (!result || result.length === 0) {
            const [hhRes, npRes, aSGRes] = await Promise.allSettled([
                scrapeHealthHubProgrammes(),
                scrapeNparksEvents(),
                scrapeActiveSGCircleEvents(),
            ])

            const healthhub = settledToArray(hhRes, 'HealthHub');
            const nparks = settledToArray(npRes, 'NParks');
            const activeSGCircle = settledToArray(aSGRes, 'ActiveSGCircle')

            const combined = [...healthhub, ...nparks, ...activeSGCircle];

            await saveScrapedData(combined);
        }
        result = await findAllScrapedData();

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to fetch offers', error);
        return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
    }
}