/**
 * Empty state for new chats.
 *
 * Shows the Falcon Core logo, a welcome message, and clickable
 * suggested prompt cards to get the conversation started.
 */

import { Bot, Sparkles, Code, BookOpen, Lightbulb } from "lucide-react";

interface SuggestedPrompt {
  icon: React.ReactNode;
  title: string;
  prompt: string;
}

const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    icon: <Sparkles className="h-4 w-4" />,
    title: "اكتب محتوى تسويقي",
    prompt: "اكتب لي محتوى تسويقي احترافي لمنتج تقني جديد يستهدف الشركات الناشئة في المنطقة العربية",
  },
  {
    icon: <Code className="h-4 w-4" />,
    title: "ساعدني في البرمجة",
    prompt: "ساعدني في كتابة كود React لنموذج تسجيل دخول مع التحقق من الحقول",
  },
  {
    icon: <BookOpen className="h-4 w-4" />,
    title: "لخّص مقالاً",
    prompt: "لخّص لي أهم النقاط في موضوع الذكاء الاصطناعي التوليدي وتأثيره على الأعمال",
  },
  {
    icon: <Lightbulb className="h-4 w-4" />,
    title: "أفكار مشاريع",
    prompt: "اقترح لي 5 أفكار مشاريع تقنية مبتكرة يمكن تنفيذها باستخدام الذكاء الاصطناعي",
  },
];

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
  userName?: string;
}

export function EmptyState({ onSelectPrompt, userName }: EmptyStateProps) {
  const greeting = userName
    ? `مرحباً ${userName} 👋`
    : "مرحباً 👋";

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center max-w-xl mx-auto">
        {/* Logo */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: "linear-gradient(135deg, rgba(5,182,250,0.2) 0%, rgba(5,182,250,0.05) 100%)",
            border: "1px solid rgba(5,182,250,0.15)",
          }}
        >
          <Bot className="h-8 w-8" style={{ color: "#05B6FA" }} />
        </div>

        {/* Greeting */}
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "#E5E7EB", fontFamily: "'Noto Sans Arabic', sans-serif" }}
        >
          {greeting}
        </h1>
        <p
          className="text-[15px] mb-8"
          style={{ color: "#6B7280", fontFamily: "'Noto Sans Arabic', sans-serif" }}
        >
          كيف يمكنني مساعدتك اليوم؟
        </p>

        {/* Suggestion cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
          {SUGGESTED_PROMPTS.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onSelectPrompt(suggestion.prompt)}
              className="group text-right rounded-xl p-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "rgba(5, 182, 250, 0.04)",
                border: "1px solid rgba(5, 182, 250, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(5, 182, 250, 0.3)";
                e.currentTarget.style.background = "rgba(5, 182, 250, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(5, 182, 250, 0.1)";
                e.currentTarget.style.background = "rgba(5, 182, 250, 0.04)";
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: "#05B6FA" }}>{suggestion.icon}</span>
                <span
                  className="text-sm font-medium"
                  style={{ color: "#D1D5DB", fontFamily: "'Noto Sans Arabic', sans-serif" }}
                >
                  {suggestion.title}
                </span>
              </div>
              <p
                className="text-xs line-clamp-2"
                style={{ color: "#6B7280", fontFamily: "'Noto Sans Arabic', sans-serif" }}
              >
                {suggestion.prompt}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
