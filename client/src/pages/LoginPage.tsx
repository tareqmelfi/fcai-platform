import { useState } from "react";
import { Link } from "wouter";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = data.redirect || "/dashboard";
      } else {
        setError(data.message || "فشل تسجيل الدخول");
      }
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] text-slate-900 antialiased h-screen overflow-hidden flex flex-col md:flex-row-reverse" dir="rtl">
      <div className="hidden md:flex md:w-1/2 lg:w-7/12 flex-col justify-between p-12 relative text-white overflow-hidden"
        style={{
          backgroundColor: '#001539',
          backgroundImage: 'radial-gradient(at 0% 0%, rgba(5, 181, 250, 0.15) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(5, 181, 250, 0.1) 0, transparent 50%)'
        }}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(5,182,250,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(5,182,250,0.05) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        <ParticlesOverlay />

        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
          <div className="w-32 h-32 rounded-3xl bg-[#05B6FA]/10 border border-[#05B6FA]/20 flex items-center justify-center mb-10 fcai-glow">
            <span className="material-symbols-outlined text-[#05B6FA]" style={{ fontSize: '64px' }}>neurology</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-tight" data-testid="text-login-hero">
            بوابتك لمستقبل <br />
            <span className="text-[#05B6FA]">ذكاء الأعمال</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-md mx-auto leading-relaxed">
            منصة متكاملة تجمع بين القوة الحوسبية والسيادة المحلية لتمكين قراراتك الاستراتيجية.
          </p>
        </div>

        <div className="relative z-10 flex justify-between items-end text-sm text-slate-400 flex-wrap gap-2">
          <p dir="ltr" style={{ fontFamily: 'Rubik' }}>&copy; 2026 Falcon Core AI</p>
          <div className="flex gap-4">
            <a className="hover:text-[#05B6FA] transition-colors" href="#">سياسة الخصوصية</a>
            <a className="hover:text-[#05B6FA] transition-colors" href="#">شروط الخدمة</a>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 lg:w-5/12 bg-white flex flex-col h-full overflow-y-auto relative z-20 shadow-2xl">
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12">
          <div className="flex items-center gap-2 mb-12">
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold tracking-tight text-[#001539] leading-none" dir="ltr" style={{ fontFamily: 'Rubik' }}>
                FALCON<span className="text-[#05B6FA]">CORE</span>
              </h2>
              <span className="text-[10px] font-semibold tracking-widest text-[#001539]/60 uppercase mt-0.5" dir="ltr" style={{ fontFamily: 'Rubik' }}>AI PLATFORM</span>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900" data-testid="text-login-title">تسجيل الدخول إلى المنصة</h2>
            <p className="mt-2 text-sm text-slate-500">مرحباً بك مجدداً، الرجاء إدخال بياناتك للمتابعة.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900" htmlFor="email">البريد الإلكتروني</label>
              <div className="mt-2 relative">
                <input
                  autoComplete="email"
                  className="block w-full rounded-xl border-0 py-3 pr-4 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#05B6FA] sm:text-sm sm:leading-6 transition-all shadow-sm bg-white"
                  id="email" name="email" placeholder="admin@fc.sa" type="email" dir="ltr"
                  data-testid="input-email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <span className="material-symbols-outlined text-xl">mail</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="block text-sm font-medium leading-6 text-slate-900" htmlFor="password">كلمة المرور</label>
                <a className="text-sm font-semibold text-[#05B6FA] transition-colors" href="#">نسيت كلمة المرور؟</a>
              </div>
              <div className="mt-2 relative">
                <input
                  autoComplete="current-password"
                  className="block w-full rounded-xl border-0 py-3 pr-4 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#05B6FA] sm:text-sm sm:leading-6 transition-all shadow-sm bg-white"
                  id="password" name="password" placeholder="••••••••" type="password" dir="ltr"
                  data-testid="input-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <span className="material-symbols-outlined text-xl">lock</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2" data-testid="text-login-error">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            <button
              className="flex w-full justify-center rounded-xl bg-[#05B6FA] px-3 py-3.5 text-sm font-bold leading-6 text-[#001539] shadow-sm hover:bg-[#05B6FA]/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#05B6FA] transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
              type="submit" disabled={isLoading}
              data-testid="button-login-submit"
            >
              {isLoading ? "جاري الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm font-medium leading-6">
                <span className="bg-white px-6 text-slate-500">أو سجل الدخول عبر</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all"
                data-testid="button-login-google"
              >
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor" />
                </svg>
                <span className="text-sm" dir="ltr" style={{ fontFamily: 'Rubik' }}>Google</span>
              </button>
              <button
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all"
                data-testid="button-login-microsoft"
              >
                <svg className="h-5 w-5" viewBox="0 0 23 23">
                  <path d="M1 1h10v10H1z" fill="#f35022" />
                  <path d="M12 1h10v10H12z" fill="#81bc06" />
                  <path d="M1 12h10v10H1z" fill="#05a6f0" />
                  <path d="M12 12h10v10H12z" fill="#ffba08" />
                </svg>
                <span className="text-sm" dir="ltr" style={{ fontFamily: 'Rubik' }}>Microsoft</span>
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-8 py-5 sm:px-12 lg:px-16 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">ليس لديك حساب؟</span>
            <Link href="/register" className="text-sm font-semibold text-[#05B6FA] transition-colors" data-testid="link-create-account">أنشئ حساباً مجاناً</Link>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white px-2 py-1 shadow-sm ring-1 ring-inset ring-slate-200">
            <button className="rounded px-2 py-0.5 text-xs font-medium text-slate-500">EN</button>
            <div className="h-3 w-px bg-slate-200" />
            <button className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-[#05B6FA]">AR</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticlesOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[#05B6FA]"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.3 + 0.1,
            animation: `pulse-dot ${Math.random() * 3 + 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
}
