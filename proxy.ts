import { updateSession } from "@/lib/supabase/update-session";
export { updateSession as proxy };
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|illustrations).*)"],
};
