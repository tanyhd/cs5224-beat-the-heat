import { NextResponse } from "next/server";
import { checkUserToken, getProgressForUserAndChallenge, getUserChallenges } from "@/services/mongodb";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const userInfo = await checkUserToken(token);
    if (!userInfo) return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    // fetch user challenges
    const challenges = await getUserChallenges(userInfo.userId);

    // fetch all progress
    const progress = await getProgressForUserAndChallenge(userInfo.userId);

    // calculate stats
    const completedCount = challenges.filter(c => c.status === "Completed").length;
    const inProgressCount = challenges.filter(c => c.status === "In Progress").length;
    const kmWalked = progress.filter(p => p.activity === "Walk").reduce((sum, p) => sum + p.km, 0);
    const kmCycled = progress.filter(p => p.activity === "Cycle").reduce((sum, p) => sum + p.km, 0);

    return NextResponse.json({ completedCount, inProgressCount, kmWalked, kmCycled });
  } catch (err) {
    console.error("🔥 Error in stats API:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
