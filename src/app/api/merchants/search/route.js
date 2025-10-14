import { NextResponse } from 'next/server';
import { post } from '../../../../utils/ssl.js';
import { v4 as uuidv4 } from 'uuid';
import { VDP_HOST } from '../../../../config.js';

export async function GET(req) {
    try {
        const merchantSearchUri = VDP_HOST + '/merchantsearch/v2/search';
        const merchantPayload = getPayload(req);
        const { body, response } = await post(merchantSearchUri, merchantPayload, {});
        const parsedBody = JSON.parse(body);
        return NextResponse.json(parsedBody);
    } catch (error) {
        console.error('Merchant search error:', error);
        return NextResponse.json({ error: 'Merchant search failed' }, { status: 500 });
    }
}

function getPayload(req) {
    const { searchParams } = new URL(req.url);
    const merchantCity = searchParams.get('city') || 'San Francisco';
    const merchantName = searchParams.get('name') || '';
    const merchantAddress = searchParams.get('address') || '';

    return {
        searchOptions: {
            matchScore: "true",
            maxRecords: "10",
            matchIndicators: "true",
            proximity: ["merchantName"],
            wildCard: ["merchantName"]
        },
        header: {
            startIndex: "0",
            requestMessageId: uuidv4(),
            messageDateTime: "2015-08-28T22:05:00.000",
        },
        searchAttrList: {
            merchantCity,
            merchantCountryCode: "840",
            merchantName,
            merchantStreetAddress: merchantAddress,
        },
        responseAttrList: ["GNSTANDARD"]
    };
}
