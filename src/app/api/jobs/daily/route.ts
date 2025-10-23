import { NextResponse } from "next/server";
import {
  scrapeActiveSGCircleEvents,
  scrapeHealthHubProgrammes,
  scrapeNparksEvents,
} from "@/services/scrape";
import { saveScrapedData } from "@/services/mongodb";
import { settledToArray } from "../../challengeHub/route";

export async function POST(req: Request) {
  const token = process.env.DAILY_CRON_TOKEN!;
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
