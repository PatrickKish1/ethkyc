/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { verifySiwe } from "@/lib/auth/siwe";

export async function POST(req: NextRequest) {
  const { message, signature } = await req.json();
  if (!message || !signature) {
    return NextResponse.json({ error: "message and signature required" }, { status: 400 });
  }
  try {
    const session = await verifySiwe(message, signature, req);
    return NextResponse.json({ success: true, session });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "verify failed";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 422 });
  }
}


