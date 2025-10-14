import { NextResponse } from 'next/server';
import { post_mle } from '../../../../utils/ssl_mle.js';
import { VDP_HOST } from '../../../../config.js';

export async function GET(req) {
    console.log('Entering Cancel VSPS');
    try {
        const vspsUri = VDP_HOST + '/vsps/cancel';
        const reqPayload = getPayload(req);
        const response = await post_mle(vspsUri, reqPayload, {});

        return NextResponse.json(response);
    } catch (error) {
        console.error('Vsps Cancel Merchant Block error:', error);
        return NextResponse.json({ error: 'Vsps Cancel Merchant Block error' }, { status: 500 });
    }
}

//test pan: 4395842407250000

function getPayload(req) {
    //const { searchParams } = new URL(req.url);
    const { searchParams } = new URL(req.url);
    const stopInstructionId = searchParams.get('stopInstructionId');
    return {
        "cancelStopInstructions": [stopInstructionId]
      }
    };
  

