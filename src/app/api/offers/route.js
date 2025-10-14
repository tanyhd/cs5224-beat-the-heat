import { NextResponse } from 'next/server';
import { findAllScrapedData } from "../../../services/mongodb";
import { scrapeOffersMilelion } from '@/services/scrape';
import { saveScrapedData } from '../../../services/mongodb';


export async function GET() {
    try {
        let result = await findAllScrapedData();

        if (!result || result.length === 0) {
            const scraped = await scrapeOffersMilelion();
            await saveScrapedData(scraped);
            result = await findAllScrapedData();
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to fetch offers', error);
        return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
    }
}