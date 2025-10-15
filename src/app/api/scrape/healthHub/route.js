import { NextResponse } from 'next/server';
import { scrapeHealthHubProgrammes } from '../../../../services/scrape';
import { saveScrapedData } from '../../../../services/mongodb';

export async function GET(request) {
    try {
        const results = await scrapeHealthHubProgrammes()
        const saved = await saveScrapedData(results);
        
        if (!saved) {
            throw new Error('Failed to save scraped data');
        }
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error scraping data:', error);
        return NextResponse.json({ error: 'Failed to scraping data' }, { status: 500 });
    }
}