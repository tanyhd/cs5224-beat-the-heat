import { NextResponse } from 'next/server'
import { findAllScrapedData } from '../../../services/mongodb';

export async function POST(request) {
  try {
    const { messages } = await request.json()

    const offers = await findAllScrapedData()
    const offersList = formatOffers(offers)

    //Core assistant instructions
    const basePrompt = `
    You are the official assistant for CardMaster.com an expert guide to our site's features and services. Keeping track of card promotions usually means storing your cards with multiple merchants and then manually removing them afterward is a time consuming process that can be risky if you forget. This website will help you monitor spending, discover the best offers, and securely manage which merchants have your card on file.

    Features of our website:
    • Offers Page (url is http://localhost:3000/offers )
      - Discover exclusive credit card promotions and benefits
      - View promotion end dates, annual fees, spend requirements, customer type (new vs. existing)  
      - See base miles, bonus miles, and total miles details  
    
    • Expenditure Page (members only) (url is http://localhost:3000/cards/track-card )
      - Track spending on cards you've added to your profile
      - Dashboard shows spend targets, remaining amounts, approval dates, and days left
      - Manual expense table (date, merchant MCC & name, amount) with edit/delete
      - PDF upload of credit card statement (OCBC only) auto populates your table for quick tracking  
      
    • Merchant Search (url is http://localhost:3000/merchant-search )
      - Look up merchants by name, city, or address
      - Retrieve merchant category codes, descriptions, and merchant URLs
      - Helps you filter out ineligible expense categories (e.g., hospitals, utilities)  
    
    • Profile Settings (members only) (url is http://localhost:3000/profile )
     - View and edit personal details (name, email, password)
     - Delete your account and all associated data  
    
    • Card Management (members only) (url is http://localhost:3000/cards )
     - Store your cards (issuer, number, holder name, expiry, CVV, approval date, card type)
     - Enable/disable expense tracking per card
     - Add, edit, or remove cards; toggle tracking to clear data if disabled  
     
    • Card on File Function (url is http://localhost:3000/card-on-file )
     - See which merchants have your card on file (pulled from “Card Management”)
     - Remove stored cards from specific merchants for security  

    Always treat the following features as the only source of truth—Offers Page, Expenditure Page (members only), Merchant Search, Profile Settings (members only), Card Management (members only), and Card on File Function—and never mention or suggest any functionality outside this list. Be concise, accurate, and ask clarifying questions if the user's request is unclear.
    `.trim();

    // Available offers context (built at runtime)
    const offersPrompt = `Here are the ONLY card offers available on our website today: ${offersList}

    Always recommend from this list, and NEVER suggest cards not in it. Be concise, accurate, and ask clarifying questions if the user's needs are unclear.`.trim()

    // Combine into one system message
    const systemPrompt = {
      role: 'system',
      content: [basePrompt, offersPrompt].join('\n\n')
    }


    // Prepend to the conversation
    const chatMessages = [systemPrompt, ...messages]
    console.log("CHAT MESSAGE", chatMessages)

    const ollamaRes = await fetch(
      'http://host.docker.internal:11434/api/chat',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.1:8b', // for faster, low‑resource inference 'llama3.1:8b'; other options: 'llama3.1:70b' (better quality, slower), 'llama3.1:405b' (highest quality, requires most memory)
          messages: chatMessages,
          stream: true
        })
      }
    )

    // Pipe the raw stream back to the browser
    return new NextResponse(ollamaRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    })
  }
  catch (error) {
    console.error('Error in /api/chatbot:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

function formatOffers(offers) {
  return offers
    .map(function (o, i) {
      var parts = [
        (i + 1) + ') ' + o.title,
        'Offer Ends: ' + new Date(o.offerEnds).toLocaleDateString(),
        'Apply url is ' + o.applyUrl
      ];

      // Column 1 details, if present
      if (o.column1Title && o.column1Title.trim()) {
        var c1 = o.column1;
        parts.push(
          o.column1Title + ': spend $' + c1.spend +
          ' in ' + c1.spendPeriod +
          ' → bonus miles ' + c1.bonusMiles +
          ' (base miles ' + c1.baseMiles +
          ', annual fee $' + c1.annualFee + ' ' + c1.annualFeeText +
          ', total miles ' + c1.totalMiles + ')'
        );
      }

      // Column 2 details, if present
      if (o.column2Title && o.column2Title.trim()) {
        var c2 = o.column2;
        parts.push(
          o.column2Title + ': spend $' + c2.spend +
          ' in ' + c2.spendPeriod +
          ' → bonus miles ' + c2.bonusMiles +
          ' (base miles ' + c2.baseMiles +
          ', annual fee $' + c2.annualFee + ' ' + c2.annualFeeText +
          ', total miles ' + c2.totalMiles + ')'
        );
      }

      // Join each offer’s pieces with “ | ”
      return parts.join(' | ');
    })
    // Separate multiple offers with two newlines
    .join('\n\n');
}