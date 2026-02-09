import { useState } from "react";
import { Link } from "wouter";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    if (!acceptTerms) {
      setError("يجب قبول شروط الاستخدام");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, referralCode: referralCode || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = "/dashboard";
      } else {
        setError(data.message || "فشل إنشاء الحساب");
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
            <span className="material-symbols-outlined text-[#05B6FA]" style={{ fontSize: '64px' }}>rocket_launch</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-tight">
            انطلق نحو مستقبل<br />
            <span className="text-[#05B6FA]">أعمالك الذكية</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-md mx-auto leading-relaxed">
            أنشئ حسابك وابدأ رحلتك مع الذكاء الاصطناعي المتقدم. تجربة مجانية بلا حدود.
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
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-10">
          <div className="flex items-center gap-2 mb-10">
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold tracking-tight text-[#001539] leading-none" dir="ltr" style={{ fontFamily: 'Rubik' }}>
                FALCON<span className="text-[#05B6FA]">CORE</span>
              </h2>
              <span className="text-[10px] font-semibold tracking-widest text-[#001539]/60 uppercase mt-0.5" dir="ltr" style={{ fontFamily: 'Rubik' }}>AI PLATFORM</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900" data-testid="text-register-title">إنشاء حساب جديد</h2>
            <p className="mt-2 text-sm text-slate-500">أدخل بياناتك للبدء في استخدام المنصة.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-900" htmlFor="name">الاسم الكامل</label>
              <div className="mt-1.5 relative">
                <input
                  className="block w-full rounded-xl border-0 py-3 pr-4 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#05B6FA] text-sm transition-all shadow-sm bg-white"
                  id="name" placeholder="أدخل اسمك الكامل" type="text"
                  data-testid="input-name"
                  value={name} onChange={(e) => setName(e.target.value)}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <span className="material-symbols-outlined text-xl">person</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900" htmlFor="reg-email">البريد الإلكتروني</label>
              <div className="mt-1.5 relative">
                <input
                  className="block w-full rounded-xl border-0 py-3 pr-4 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#05B6FA] text-sm transition-all shadow-sm bg-white"
                  id="reg-email" placeholder="you@example.com" type="email" dir="ltr"
                  data-testid="input-email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <span className="material-symbols-outlined text-xl">mail</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900" htmlFor="reg-password">كلمة المرور</label>
              <div className="mt-1.5 relative">
                <input
                  className="block w-full rounded-xl border-0 py-3 pr-4 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#05B6FA] text-sm transition-all shadow-sm bg-white"
                  id="reg-password" placeholder="••••••••" type="password" dir="ltr"
                  data-testid="input-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <span className="material-symbols-outlined text-xl">lock</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900" htmlFor="confirm-password">تأكيد كلمة المرور</label>
              <div className="mt-1.5 relative">
                <input
                  className="block w-full rounded-xl border-0 py-3 pr-4 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#05B6FA] text-sm transition-all shadow-sm bg-white"
                  id="confirm-password" placeholder="••••••••" type="password" dir="ltr"
                  data-testid="input-confirm-password"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <span className="material-symbols-outlined text-xl">lock</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900" htmlFor="referral">هل لديك كود إحالة؟ (اختياري)</label>
              <div className="mt-1.5 relative">
                <input
                  className="block w-full rounded-xl border-0 py-3 pr-4 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#05B6FA] text-sm transition-all shadow-sm bg-white"
                  id="referral" placeholder="FC-XXXXXX" type="text" dir="ltr"
                  data-testid="input-referral"
                  value={referralCode} onChange={(e) => setReferralCode(e.target.value)}
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <span className="material-symbols-outlined text-xl">card_giftcard</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#05B6FA] focus:ring-[#05B6FA]"
                data-testid="input-terms"
              />
              <label htmlFor="terms" className="text-sm text-slate-600">
                أوافق على <a href="#" className="text-[#05B6FA] font-semibold">شروط الاستخدام</a> و <a href="#" className="text-[#05B6FA] font-semibold">سياسة الخصوصية</a>
              </label>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2" data-testid="text-register-error">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            <button
              className="flex w-full justify-center rounded-xl bg-[#05B6FA] px-3 py-3.5 text-sm font-bold leading-6 text-[#001539] shadow-sm hover:bg-[#05B6FA]/90 transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
              type="submit" disabled={isLoading}
              data-testid="button-register-submit"
            >
              {isLoading ? "جاري التسجيل..." : "إنشاء الحساب"}
            </button>
          </form>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-8 py-5 sm:px-12 lg:px-16 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">لديك حساب؟</span>
            <Link href="/login" className="text-sm font-semibold text-[#05B6FA] transition-colors" data-testid="link-login">سجل الدخول</Link>
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
