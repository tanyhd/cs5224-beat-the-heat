import { NextResponse } from 'next/server';
import { post_mle } from '../../../../utils/ssl_mle.js';
import { VDP_HOST } from '../../../../config.js';

export async function GET(req) {
    console.log('Entering VSPS');
    try {
        const vspsUri = VDP_HOST + '/vsps/add/merchant';
        const reqPayload = getPayload(req);
        const response = await post_mle(vspsUri, reqPayload, {});

        return NextResponse.json(response);
    } catch (error) {
        console.error('Vsps Add Merchant error:', error);
        return NextResponse.json({ error: 'Vsps Add Merchant error' }, { status: 500 });
    }
}

//test pan: 4395842407250000

function getPayload(req) {
    //const { searchParams } = new URL(req.url);
    const { searchParams } = new URL(req.url);
    const pan = searchParams.get('pan');
    const merchantName = searchParams.get('merchantName');
    return {
        "duration": 13,
        "recurringAndInstallmentIndicator": false,
        "merchantIdentifiers": {
          "merchantNames": [merchantName]
        },
        "transactionAmount": {
          "maxAmount": 0.01
        },
        "oneTimeStop": false,
        "pan": pan,
        "startDate": getTodayDateString()
      }
    };

function getTodayDateString() {
    return new Date().toISOString().split('T')[0];
  }
  

