import { NextResponse } from "next/server";
import {
  scrapeActiveSGCircleEvents,
  scrapeHealthHubProgrammes,
  scrapeNparksEvents,
  settledToArray,
} from "@/services/scrape";
import { saveScrapedData } from "@/services/mongodb";


export async function POST(req) {
  const token = process.env.DAILY_CRON_TOKEN;
  const hdr = req.headers.get("x-cron-token");
  if (!token || hdr !== token) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const [hhRes, npRes, aSGRes] = await Promise.allSettled([
    scrapeHealthHubProgrammes(),
    scrapeNparksEvents(),
    scrapeActiveSGCircleEvents(),
  ]);

  const healthhub = settledToArray(hhRes, "HealthHub");
  const nparks = settledToArray(npRes, "NParks");
  const activeSGCircle = settledToArray(aSGRes, "ActiveSGCircle");

  const combined = [...healthhub, ...nparks, ...activeSGCircle];

  await saveScrapedData(combined);

  return NextResponse.json({ ok: true });
}
