import { NextResponse } from 'next/server';
import { post_mle } from '../../../../utils/ssl_mle.js';
import { v4 as uuidv4 } from 'uuid';
import { VDP_HOST } from '../../../../config.js';

export async function GET(req) {
    try {
        const cofUri = VDP_HOST + '/cofds-web/v1/datainfo';
        const panPayload = getPayload(req);
        const response = await post_mle(cofUri, panPayload, {});

        return NextResponse.json(response);
    } catch (error) {
        console.error('Card on file error:', error);
        return NextResponse.json({ error: 'Card on file error' }, { status: 500 });
    }
}

function getPayload(req) {
    const { searchParams } = new URL(req.url);
    const pan = searchParams.get('pan') || '4072200013229449';
    return {
        requestHeader: {
            messageDateTime: timeStringNow(),
            requestMessageId: uuidv4(),
        },
        requestData: {
            group: "STANDARD",
            pANs: [pan],
        },
    };
}

function timeStringNow() {
    return new Date().toISOString().replace('T', " ").replace('Z', "");
}