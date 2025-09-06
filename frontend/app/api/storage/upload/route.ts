import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/siwe";
import { uploadFile, getStorachaGatewayUrl } from "@/lib/storage/storacha";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.startsWith("multipart/form-data")) {
    return NextResponse.json({ error: "multipart/form-data required" }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const email = form.get("email") as string | null;
  
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "file field missing" }, { status: 400 });
  }
  
  try {
    // Use default email from env if not provided
    const userEmail = email || process.env.STORACHA_DEFAULT_EMAIL;
    const cid = await uploadFile(file, userEmail || undefined);
    
    return NextResponse.json({ 
      cid, 
      gateway: getStorachaGatewayUrl(cid)
    });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "upload failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}


