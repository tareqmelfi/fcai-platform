import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  useEffect(() => {
    // Redirect to backend auth endpoint which handles Logto flow
    window.location.href = "/api/auth/login";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#001539] text-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-[#05B6FA]" />
        <h2 className="text-xl font-semibold">جاري التوجيه إلى تسجيل الدخول...</h2>
        <p className="text-slate-400">Redirecting to Falcon Core Auth...</p>
      </div>
    </div>
  );
}
