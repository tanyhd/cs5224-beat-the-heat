import { NextResponse } from "next/server";
import { checkUserToken, getUserChallenges } from "@/services/mongodb";

export async function GET(req) {
  console.log("🟢 [API] /api/challengeHub - GET request received");

  try {
    const authHeader = req.headers.get("authorization");
    console.log("🪪 Authorization Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Missing or invalid Authorization header");
      return NextResponse.json(
        { message: "Authorization header missing or invalid" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    console.log("🔐 Extracted Token:", token ? "✅ Exists" : "❌ Missing");

    // Validate token and get user info
    const userInfo = await checkUserToken(token);
    console.log("👤 Decoded User Info:", userInfo);

    if (!userInfo) {
      console.log("❌ Invalid or expired token");
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Use userId from token instead of query
    const userId = userInfo.userId;
    console.log("🧩 Using userId from token:", userId);

    const challenges = await getUserChallenges(userId);
    console.log("✅ Fetched challenges count:", challenges?.length || 0);

    return NextResponse.json(
      {
        message: "Challenges fetched successfully",
        challenges,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("🔥 Error fetching user challenges:", error);
    return NextResponse.json(
      { message: "Error fetching challenges" },
      { status: 500 }
    );
  }
}
