import { NextRequest, NextResponse } from 'next/server';
import { checkUserToken } from '@/services/mongodb';

export async function POST(req: NextRequest) {
   const authHeader = req.headers.get('authorization');
   if (!authHeader || !authHeader.startsWith('Bearer ')) {
       return NextResponse.json({ message: 'Authorization header missing or invalid' }, { status: 401 });
   }

   const token = authHeader.split(' ')[1];
   const userInfo = await checkUserToken(token);
   if (!userInfo) {
       return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
   }

   const { token: otp } = await req.json();
   const to = process.env.PHONE_OTP;
   const channel = 'sms';

   if (!to || !channel) {
      return NextResponse.json({ error: 'Missing required fields: to or channel' }, { status: 400 });
   }

   const url = 'https://verify.twilio.com/v2/Services/VA087d45b3df6dee00c05b00ca0245b121/VerificationCheck';
   const authToken = process.env.TWILIO_AUTH_TOKEN; // Replace with your actual AuthToken
   const accountSid = 'AC2aeb9737f01200514974d7d027e884bf';

   const formData = new URLSearchParams();
   formData.append('Code', otp)
   formData.append('To', to);

   try {
      const response = await fetch(url, {
         method: 'POST',
         headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
         },
         body: formData.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
         return NextResponse.json({ error: data }, { status: response.status });
      }

      return NextResponse.json(data);
   } catch (error) {
      return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
   }
}