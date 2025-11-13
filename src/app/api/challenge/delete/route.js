import { NextResponse } from "next/server";
import { checkUserToken, deleteUserChallenge } from "@/services/mongodb";

export async function DELETE(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const userInfo = await checkUserToken(token);
    if (!userInfo) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
    }

    const { challengeId } = await req.json();
    if (!challengeId) {
      return NextResponse.json({ message: "Missing challengeId" }, { status: 400 });
    }

    const result = await deleteUserChallenge(userInfo.userId, challengeId);
    return NextResponse.json({ message: result.message }, { status: parseInt(result.status) });
  } catch (err) {
    console.error("🔥 Error deleting user challenge:", err);
    return NextResponse.json({ message: "Failed to delete challenge" }, { status: 500 });
  }
}
