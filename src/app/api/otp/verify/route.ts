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

   const to = process.env.PHONE_OTP;
   const channel = 'sms';

   console.log('to', to);
   console.log('process.env', process.env)

   if (!to || !channel) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
   }

   const accountSid = 'AC2aeb9737f01200514974d7d027e884bf';
   const authToken = process.env.TWILIO_AUTH_TOKEN;
   const serviceSid = 'VA087d45b3df6dee00c05b00ca0245b121';

   const url = `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`;

   const formData = new URLSearchParams();
   formData.append('To', to);
   formData.append('Channel', channel);

   const headers = new Headers();
   headers.set(
      'Authorization',
      'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
   );
   headers.set('Content-Type', 'application/x-www-form-urlencoded');

   try {
      const response = await fetch(url, {
         method: 'POST',
         headers,
         body: formData.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
         return NextResponse.json({ error: data }, { status: response.status });
      }

      return NextResponse.json(data);
   } catch (error) {
      return NextResponse.json({ error: 'Failed to send verification' }, { status: 500 });
   }
}