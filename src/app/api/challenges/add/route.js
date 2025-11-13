import { NextResponse } from "next/server";
import { checkUserToken, addUserChallenge } from "@/services/mongodb";


export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Authorization header missing or invalid" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    // Get user info from token
    const userInfo = await checkUserToken(token);
    if (!userInfo) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
    }

    const payload = await req.json();
    const { challengeId, challengeName, startDate, trackAllowed } = payload;

    if (!challengeId || !challengeName || !startDate) {
      console.debug("User ID:", userInfo.userId);
      console.debug("Challenge ID:", challengeId);
      return NextResponse.json(
        { error: "Missing required fields: challengeId, challengeName, startDate" },
        { status: 400 }
      );
    }

    // Save challenge for this user
    const result = await addUserChallenge({
      userId: userInfo.userId,
      challengeId,
      challengeName,
      startDate,
      trackAllowed,
    });

    if (result.status === "500") {
      return NextResponse.json({ message: result.message }, { status: 500 });
    }

    if (result.status === "409") {
        return NextResponse.json({ message: result.message }, { status: 409 });
    }

    return NextResponse.json({ message: result.message || "Challenge added successfully" }, { status: 200 });
  } catch (err) {
    console.error("🔥 Error adding user challenge:", err);
    return NextResponse.json({ error: "Failed to add challenge" }, { status: 500 });
  }
}
