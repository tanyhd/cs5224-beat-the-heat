import { NextResponse } from 'next/server';
import { post_mle } from '../../../../utils/ssl_mle.js';
import { VDP_HOST } from '../../../../config.js';

export async function GET(req) {
    console.log('Entering Search');
    try {
        const vspsUri = VDP_HOST + '/vsps/search';
        const reqPayload = getPayload(req);
        const response = await post_mle(vspsUri, reqPayload, {});

        return NextResponse.json(response);
    } catch (error) {
        console.error('Vsps Search Merchant error:', error);
        return NextResponse.json({ error: 'Vsps Search Merchant error' }, { status: 500 });
    }
}

//test pan: 4395842407255900

function getPayload(req) {
    const { searchParams } = new URL(req.url);
    const pan = searchParams.get('pan');
    return {
        "includeInactive": false,
        "pan": pan
      }
    };

