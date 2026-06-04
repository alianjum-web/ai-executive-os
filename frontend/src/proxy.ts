import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/common/services/supabase/env";
import { updateSession } from "@/common/services/supabase/middleware";

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
