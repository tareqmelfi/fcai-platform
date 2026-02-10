import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 }
  })
};

export default function LandingPage() {
  // Live Update Version: 1.0.1
  return (
    <div className="min-h-screen bg-[#001539] text-white overflow-x-hidden rtl select-none" data-testid="landing-page">
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(5,182,250,0.08) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(5,182,250,0.08) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <nav className="glass-nav sticky top-0 z-50 px-6 md:px-10 py-4" data-testid="nav-bar">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-rubik text-xl font-extrabold tracking-[2px]" style={{ fontFamily: 'Rubik' }} dir="ltr">
              FALCON<span className="text-[#05B6FA]">CORE</span>
            </span>
            <span className="text-[10px] text-[#05B6FA]/80 tracking-[3px] uppercase hidden sm:inline" style={{ fontFamily: 'Rubik' }} dir="ltr">AI PLATFORM</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-[#05B6FA] transition-colors" data-testid="link-features">المميزات</a>
            <a href="#pricing" className="hover:text-[#05B6FA] transition-colors" data-testid="link-pricing">الأسعار</a>
            <a href="#security" className="hover:text-[#05B6FA] transition-colors" data-testid="link-security">الأمان</a>
            <a href="#contact" className="hover:text-[#05B6FA] transition-colors" data-testid="link-contact">تواصل معنا</a>
          </div>
          <Link href="/login">
            <Button className="rounded-xl px-6 bg-[#05B6FA] text-[#001539] font-bold hover:bg-[#05B6FA]/90" data-testid="button-cta-nav">
              ابدأ مجاناً
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="pt-16 pb-24 md:pt-24 md:pb-32 px-4">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-center md:text-right">
              <motion.div
                initial="hidden" animate="visible" custom={0} variants={fadeUp}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#05B6FA]/10 border border-[#05B6FA]/20 text-[#05B6FA] text-sm font-bold"
                data-testid="badge-hero"
              >
                <span className="w-2 h-2 rounded-full bg-[#05B6FA] animate-pulse-dot" />
                <span>الجيل القادم من الذكاء الاصطناعي للأعمال</span>
              </motion.div>

              <motion.h1
                initial="hidden" animate="visible" custom={1} variants={fadeUp}
                className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.2]"
                style={{ fontFamily: 'Noto Sans Arabic' }}
                data-testid="text-hero-title"
              >
                مستقبل أعمالك، يقوده<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05B6FA] via-cyan-300 to-[#05B6FA]">
                  الذكاء الاصطناعي.. بسيادة محلية
                </span>
              </motion.h1>

              <motion.p
                initial="hidden" animate="visible" custom={2} variants={fadeUp}
                className="text-lg text-slate-400 leading-relaxed max-w-lg"
                data-testid="text-hero-description"
              >
                وصول فوري إلى GPT-4o و Claude و Gemini و DeepSeek — كل النماذج في مكان واحد مع سيادة كاملة على بياناتك واستضافة محلية.
              </motion.p>

              <motion.div
                initial="hidden" animate="visible" custom={3} variants={fadeUp}
                className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start"
              >
                <Link href="/login">
                  <Button size="lg" className="rounded-xl px-8 h-14 text-lg font-bold bg-[#05B6FA] text-[#001539] shadow-xl shadow-[#05B6FA]/20 hover:bg-[#05B6FA]/90" data-testid="button-start-free">
                    ابدأ رحلتك مجاناً
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="rounded-xl px-8 h-14 text-lg font-bold border-[#05B6FA]/30 text-white hover:bg-[#05B6FA]/10" data-testid="button-demo">
                    احجز عرضاً توضيحياً
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial="hidden" animate="visible" custom={4} variants={fadeUp}
                className="flex items-center gap-6 text-sm text-slate-500 justify-center md:justify-start"
              >
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#22C55E] text-base">check_circle</span>
                  تجربة مجانية 14 يوم
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#22C55E] text-base">check_circle</span>
                  لا يلزم بطاقة ائتمان
                </span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="hidden md:block"
            >
              <div className="glass-card rounded-2xl p-1 fcai-glow">
                <div className="rounded-xl bg-[#001539] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
                    <div className="flex gap-1.5" dir="ltr">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-xs text-slate-500 font-rubik mx-auto" dir="ltr" style={{ fontFamily: 'Rubik' }}>ai.fc.sa/chat</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-end">
                      <div className="bg-[#002350] rounded-xl rounded-br-sm px-4 py-3 max-w-[80%] text-sm">
                        حلل لي بيانات المبيعات للربع الأخير واكتب تقرير تنفيذي
                      </div>
                    </div>
                    <div className="flex justify-start gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#05B6FA]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#05B6FA] text-xs font-bold" style={{ fontFamily: 'Rubik' }}>FC</span>
                      </div>
                      <div className="bg-[#002350]/50 rounded-xl rounded-bl-sm px-4 py-3 max-w-[80%] text-sm text-slate-300 space-y-2">
                        <p>تم تحليل بيانات المبيعات. إليك أبرز النتائج:</p>
                        <div className="grid grid-cols-2 gap-2 my-3">
                          <StatMini label="إجمالي المبيعات" value="2.4M" />
                          <StatMini label="النمو" value="+18%" color="#22C55E" />
                          <StatMini label="العملاء الجدد" value="847" />
                          <StatMini label="معدل التحويل" value="4.2%" color="#F59E0B" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-12 px-4 border-y border-white/5 bg-[#000d26]/50">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-40">
            {["OpenAI", "Anthropic", "Google", "DeepSeek", "Meta"].map((name) => (
              <span key={name} className="text-sm font-bold tracking-wider uppercase" style={{ fontFamily: 'Rubik' }} dir="ltr">
                {name}
              </span>
            ))}
          </div>
        </section>

        <section id="features" className="py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-features-title">لماذا Falcon Core AI؟</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">ليست مجرد واجهة ChatGPT عربية. نحن طبقة ذكاء فوق النماذج المتعددة تعطيك ميزة حقيقية.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard icon="smart_toy" title="وكلاء ذكاء اصطناعي" description="6 وكلاء متخصصين جاهزين للعمل: مستشار تأسيس، محلل عقود، كاتب محتوى، مساعد مالية، مدرب فريق، محلل بيانات." />
              <FeatureCard icon="psychology" title="قاعدة معرفية RAG" description="ارفع مستنداتك وبياناتك ليتعلم منها النظام ويجيب بدقة. ذاكرة مستمرة تبني على كل محادثة." />
              <FeatureCard icon="shield" title="سيادة البيانات" description="بياناتك لا تغادر بيئتك أبدا. بنية Zero Trust، معالجة محلية، وتشفير كامل من النقطة للنقطة." />
              <FeatureCard icon="translate" title="دعم اللغة العربية" description="واجهة RTL كاملة، وكلاء متخصصين بالسوق العربي والسعودي. محتوى عربي أولا." />
              <FeatureCard icon="hub" title="تعدد النماذج" description="GPT-4o, Claude 3.5, Gemini, DeepSeek, Llama — كل النماذج في مكان واحد بدلا من اشتراكات متعددة." />
              <FeatureCard icon="api" title="تكامل الأنظمة API" description="ربط المنصة مع أنظمتك الحالية عبر API و Webhooks. تكامل سلس مع N8N و Zapier." />
            </div>
          </div>
        </section>

        <section id="pricing" className="py-24 px-4 bg-[#000d26]/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-pricing-title">خطط الأسعار</h2>
              <p className="text-slate-400 max-w-xl mx-auto">اختر الخطة المناسبة لاحتياجاتك. ابدأ مجاناً وترقَّ في أي وقت.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <PricingCard
                name="للتجربة"
                price="مجاني"
                period=""
                features={["50 رسالة يومياً", "GPT-3.5 فقط", "وكيل واحد", "بدون ذاكرة مستمرة"]}
                cta="ابدأ مجاناً"
                popular={false}
              />
              <PricingCard
                name="للأفراد المحترفين"
                price="$19"
                period="/شهرياً"
                features={["رسائل غير محدودة", "جميع النماذج", "5 وكلاء", "ذاكرة مستمرة", "رفع ملفات", "دعم أولوية"]}
                cta="ابدأ الآن"
                popular={true}
              />
              <PricingCard
                name="للشركات"
                price="$49"
                period="/شهرياً"
                features={["كل ميزات المحترفين", "لوحة تحكم الفريق", "قاعدة معرفية RAG", "API كامل", "وكلاء غير محدودين", "مدير حساب مخصص"]}
                cta="تواصل معنا"
                popular={false}
              />
            </div>
          </div>
        </section>

        <section id="security" className="py-24 px-4">
          <div className="max-w-5xl mx-auto glass-card rounded-[2rem] p-12 text-center space-y-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#05B6FA]/10 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-[#05B6FA]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#05B6FA] text-4xl">verified_user</span>
              </div>
              <h2 className="text-3xl font-bold" data-testid="text-security-title">بنية تحتية سيادية وآمنة</h2>
              <p className="text-slate-400 max-w-xl mx-auto">بياناتك لا تغادر بيئتك أبدا. بنية Zero Trust، معالجة محلية، وتشفير كامل.</p>
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                {["Zero Trust Architecture", "Localized Processing", "Multi-Agent Mesh", "Data Sovereignty", "End-to-End Encryption"].map(label => (
                  <span key={label} className="px-4 py-1.5 rounded-lg bg-[#05B6FA]/10 border border-[#05B6FA]/20 text-[11px] tracking-wider text-[#05B6FA]/80 uppercase" dir="ltr" style={{ fontFamily: 'Rubik' }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="py-16 border-t border-white/5 bg-[#000d26]/50 px-4" data-testid="footer">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-[2px]" style={{ fontFamily: 'Rubik' }} dir="ltr">
                FALCON<span className="text-[#05B6FA]">CORE</span>
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">منصة الذكاء الاصطناعي السعودية-الأمريكية للأعمال. بسيادة محلية وأداء عالمي.</p>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-sm mb-4">المنتج</h4>
            <FooterLink label="المميزات" href="#features" />
            <FooterLink label="الأسعار" href="#pricing" />
            <FooterLink label="الأمان" href="#security" />
            <FooterLink label="الوثائق" href="#" />
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-sm mb-4">الشركة</h4>
            <FooterLink label="عن فالكون كور" href="#" />
            <FooterLink label="الوظائف" href="#" />
            <FooterLink label="المدونة" href="#" />
            <FooterLink label="سياسة الخصوصية" href="#" />
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-sm mb-4">تواصل معنا</h4>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">mail</span>
              <span dir="ltr" style={{ fontFamily: 'Rubik' }}>hello@fc.sa</span>
            </p>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">call</span>
              <span dir="ltr" style={{ fontFamily: 'Rubik' }}>+1 442 444 4410</span>
            </p>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">call</span>
              <span dir="ltr" style={{ fontFamily: 'Rubik' }}>800-111-0110</span>
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/5 text-center">
          <p className="text-slate-600 text-xs" dir="ltr" style={{ fontFamily: 'Rubik' }}>
            &copy; 2026 Falcon Core LLC. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="p-7 rounded-2xl glass-card hover:border-[#05B6FA]/20 transition-all group"
    >
      <div className="mb-5 w-14 h-14 rounded-xl bg-[#05B6FA]/10 flex items-center justify-center group-hover:bg-[#05B6FA]/15 transition-colors">
        <span className="material-symbols-outlined text-[#05B6FA] text-2xl">{icon}</span>
      </div>
      <h3 className="text-lg font-bold mb-3">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function PricingCard({ name, price, period, features, cta, popular }: {
  name: string; price: string; period: string; features: string[]; cta: string; popular: boolean
}) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className={`p-8 rounded-2xl relative ${popular
        ? 'glass-card border-[#05B6FA]/30 fcai-glow'
        : 'glass-card'
      }`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#05B6FA] text-[#001539] text-xs font-bold">
          الأكثر شعبية
        </div>
      )}
      <div className="text-center mb-6 pt-2">
        <h3 className="font-bold text-lg mb-3">{name}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-extrabold" style={{ fontFamily: 'Rubik' }} dir="ltr">{price}</span>
          {period && <span className="text-slate-500 text-sm">{period}</span>}
        </div>
      </div>
      <div className="space-y-3 mb-8">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
            <span className="material-symbols-outlined text-[#05B6FA] text-base">check_circle</span>
            <span>{f}</span>
          </div>
        ))}
      </div>
      <Link href="/login">
        <Button
          className={`w-full rounded-xl font-bold ${popular
            ? 'bg-[#05B6FA] text-[#001539] hover:bg-[#05B6FA]/90'
            : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
          }`}
        >
          {cta}
        </Button>
      </Link>
    </motion.div>
  );
}

function StatMini({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[#05B6FA]/5 rounded-lg p-2.5 text-center">
      <div className="text-[10px] text-slate-500 mb-0.5">{label}</div>
      <div className="text-base font-bold" style={{ fontFamily: 'Rubik', color: color || '#05B6FA' }} dir="ltr">{value}</div>
    </div>
  );
}

function FooterLink({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} className="block text-sm text-slate-500 hover:text-[#05B6FA] transition-colors">{label}</a>
  );
}
