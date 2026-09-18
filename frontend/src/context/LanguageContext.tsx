import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "ar";

const arabic: Record<string, string> = {
  "Arabic": "العربية", "English": "English", "Language": "اللغة",
  "How it works": "كيف يعمل", "Capabilities": "الميزات", "Safety": "السلامة", "Sign in": "تسجيل الدخول",
  "Monastir, Tunisia": "المنستير، تونس", "AI-assisted screening for Tunisian schools": "فحص مدعوم بالذكاء الاصطناعي للمدارس التونسية",
  "Catching tooth decay before it hurts.": "اكتشاف تسوس الأسنان قبل أن يسبب الألم.",
  "A phone photo becomes a reviewed dental record.": "تتحول صورة الهاتف إلى سجل أسنان مُراجع.",
  "SpotEarly brings AI-assisted screening into Tunisian schools — flagging children who may need a dentist, with every result checked by a licensed professional.": "يوفّر سبوت إيرلي فحصاً مدعوماً بالذكاء الاصطناعي في المدارس التونسية، لتنبيه الأطفال الذين قد يحتاجون إلى طبيب أسنان، مع مراجعة كل نتيجة من مختص مرخّص.",
  "See how it works": "اكتشف كيف يعمل", "Primary school children with decay": "أطفال المدارس الابتدائية المصابون بالتسوس",
  "Early childhood caries, Tunis": "تسوس الطفولة المبكر في تونس", "Prevalence in hardest-hit regions": "الانتشار في المناطق الأكثر تضرراً",
  "From photo to follow-up": "من الصورة إلى المتابعة", "A simple, repeatable workflow that fits into a normal school day.": "مسار عمل بسيط ومتكرر يناسب اليوم الدراسي العادي.",
  "Capture": "التقاط", "Analyze": "تحليل", "Validate": "مراجعة",
  "School staff take a guided, standardized photo of the child's teeth in seconds — no dental training required.": "يلتقط طاقم المدرسة صورة موجّهة وموحّدة لأسنان الطفل في ثوانٍ، دون الحاجة إلى تدريب في طب الأسنان.",
  "An AI model flags visible signs of decay and assigns a clear priority level for review.": "يرصد نموذج الذكاء الاصطناعي العلامات الظاهرة للتسوس ويحدد أولوية واضحة للمراجعة.",
  "A partner dentist reviews every flagged case before any decision reaches a family.": "يراجع طبيب أسنان شريك كل حالة مُنبه عنها قبل أن يصل أي قرار إلى الأسرة.",
  "AI-powered school screening": "فحص مدرسي مدعوم بالذكاء الاصطناعي", "Purpose-built for early detection, structured records, and real clinical follow-up.": "مصمم خصيصاً للكشف المبكر والسجلات المنظمة والمتابعة السريرية الفعلية.",
  "Decay Detection": "كشف التسوس", "Priority Triage": "فرز حسب الأولوية", "Patient Records": "سجلات المرضى",
  "AI-powered object detection trained to identify visible signs of tooth decay in intraoral photos.": "كشف عناصر مدعوم بالذكاء الاصطناعي ومُدرّب لتحديد العلامات المرئية لتسوس الأسنان في صور الفم.",
  "Every case is scored and queued so dentists spend limited time where it matters most.": "يُقيّم كل ملف ويُرتّب في قائمة ليقضي أطباء الأسنان وقتهم المحدود حيث تكون الحاجة أكبر.",
  "Each screening becomes a structured, auditable file — image, findings, and follow-up in one place.": "يتحول كل فحص إلى ملف منظم قابل للتدقيق يضم الصورة والنتائج والمتابعة في مكان واحد.",
  "The AI flags. Only a dentist decides.": "الذكاء الاصطناعي ينبه، وطبيب الأسنان وحده يقرر.", "Every screening reaches a family only after a licensed dentist reviews it.": "لا تصل نتيجة أي فحص إلى الأسرة إلا بعد مراجعتها من طبيب أسنان مرخّص.",
  "Clinically Guided": "موجّه سريرياً", "Human in the Loop": "إشراف بشري", "Real Data Only": "بيانات حقيقية فقط", "Auditable by Design": "قابل للتدقيق بطبيعته",
  "Priority thresholds and messages are validated by a partner dentist before deployment.": "يتحقق طبيب أسنان شريك من عتبات الأولوية والرسائل قبل الاستخدام.", "No diagnosis is ever issued automatically. The AI flags, a professional decides.": "لا يصدر أي تشخيص تلقائياً. ينبه الذكاء الاصطناعي ويتخذ المختص القرار.", "Built and tested on real, consented screening images — never simulated data.": "بُني واختُبر على صور فحص حقيقية بموافقة أصحابها، وليس على بيانات محاكاة.", "Every capture, detection, and validation is logged and traceable end to end.": "يُسجل كل التقاط وكشف ومراجعة ويمكن تتبعه من البداية إلى النهاية.",
  "Back to home": "العودة إلى الرئيسية", "Email": "البريد الإلكتروني", "Password": "كلمة المرور", "Your password": "كلمة المرور الخاصة بك", "Signing in…": "جارٍ تسجيل الدخول…", "Invalid email or password.": "البريد الإلكتروني أو كلمة المرور غير صحيحة.", "Unable to reach the server. Check that the backend is running.": "تعذر الاتصال بالخادم. تأكد من تشغيل الخادم الخلفي.",
  "Staff and dentists sign in with the account created for their school. Administrators sign in to manage institutions and users.": "يسجّل موظفو المدارس وأطباء الأسنان الدخول بالحساب المُنشأ لمدرستهم. ويسجّل المسؤولون الدخول لإدارة المؤسسات والمستخدمين.",
  "Sign out": "تسجيل الخروج", "Required": "مطلوب", "Optional": "اختياري", "Upload": "رفع", "Retake": "إعادة الالتقاط", "Switch camera": "تبديل الكاميرا", "Close camera": "إغلاق الكاميرا",
  "This browser doesn't support camera capture. Use upload instead.": "لا يدعم هذا المتصفح التقاط الصور بالكاميرا. استخدم الرفع بدلاً من ذلك.", "Camera access was blocked or unavailable. Allow camera access or use upload instead.": "تم حظر الوصول إلى الكاميرا أو أنها غير متاحة. اسمح بالوصول إلى الكاميرا أو استخدم الرفع بدلاً من ذلك.",
  "Clear": "سليم", "Watch": "مراقبة", "Urgent": "عاجل", "SpotEarly Admin": "إدارة سبوت إيرلي"
  ,"Platform administration": "إدارة المنصة", "Institutions and accounts": "المؤسسات والحسابات", "Schools": "المدارس", "Add an institution": "إضافة مؤسسة", "Institution name": "اسم المؤسسة", "Add institution": "إضافة مؤسسة", "Adding…": "جارٍ الإضافة…", "Users": "المستخدمون", "Create a staff or dentist account": "إنشاء حساب لموظف أو طبيب أسنان", "Full name": "الاسم الكامل", "Temporary password": "كلمة مرور مؤقتة", "Role": "الدور", "Staff": "موظف", "Dentist": "طبيب أسنان", "Institution": "المؤسسة", "Create account": "إنشاء حساب", "Creating…": "جارٍ الإنشاء…", "Clinical workspace": "مساحة العمل السريرية", "Screening dashboard": "لوحة الفحوصات", "Live records": "السجلات المباشرة", "Total files": "إجمالي الملفات", "Need review": "تحتاج مراجعة", "With doctor notes": "بملاحظات الطبيب", "Saved records": "السجلات المحفوظة", "Patient files": "ملفات المرضى", "Patient file": "ملف المريض", "Age": "العمر", "Identity / ID": "الهوية / الرقم", "Images": "الصور", "Doctor notes": "ملاحظات الطبيب", "Clinical note": "ملاحظة سريرية", "Pending": "قيد الانتظار", "Select a patient file": "اختر ملف مريض", "Image review": "مراجعة الصورة", "Close image review": "إغلاق مراجعة الصورة", "New screening": "فحص جديد", "Screening in progress": "الفحص جارٍ", "AI-assisted review": "مراجعة مدعومة بالذكاء الاصطناعي", "Patient information": "معلومات المريض", "Teeth photos": "صور الأسنان", "Account pending validation": "الحساب بانتظار التحقق", "Access not allowed": "الوصول غير مسموح", "Back to sign in": "العودة إلى تسجيل الدخول", "Return home": "العودة إلى الرئيسية", "Go to your workspace": "الانتقال إلى مساحة العمل", "Create an account": "إنشاء حساب", "Confirm password": "تأكيد كلمة المرور", "School staff": "موظف مدرسة", "Already registered?": "لديك حساب بالفعل؟", "Checking your session…": "جارٍ التحقق من جلستك…", "Loading…": "جارٍ التحميل…", "Patient": "المريض", "Analyzed image": "الصورة المحللة", "Model result": "نتيجة النموذج", "Next step": "الخطوة التالية", "Clinical validation": "التحقق السريري", "Clinical follow-up": "المتابعة السريرية", "Evidence": "الأدلة", "Captured photos": "الصور الملتقطة"
};

type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: (text: string) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

function DocumentTranslator({ language }: { language: Language }) {
  useEffect(() => {
    const translate = (value: string) => language === "ar" ? (arabic[value.trim()] ?? value) : value;
    const update = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node as Text;
        if (!text.parentElement || ["SCRIPT", "STYLE"].includes(text.parentElement.tagName)) continue;
        if (!originalText.has(text)) originalText.set(text, text.data);
        const original = originalText.get(text)!;
        const translated = translate(original);
        if (text.data !== translated) text.data = translated;
      }
      const element = root instanceof Element ? root : null;
      const all = element ? [element, ...element.querySelectorAll("[placeholder],[aria-label],[title]")] : [...document.querySelectorAll("[placeholder],[aria-label],[title]")];
      all.forEach((item) => ["placeholder", "aria-label", "title"].forEach((name) => {
        const value = item.getAttribute(name);
        if (!value) return;
        if (!originalAttributes.has(item)) originalAttributes.set(item, new Map());
        const originals = originalAttributes.get(item)!;
        if (!originals.has(name)) originals.set(name, value);
        const translated = translate(originals.get(name)!);
        if (value !== translated) item.setAttribute(name, translated);
      }));
    };
    update(document.body);
    const observer = new MutationObserver((changes) => changes.forEach((change) => change.addedNodes.forEach(update)));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);
  return null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => localStorage.getItem("spotearly-language") === "ar" ? "ar" : "en");
  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
  }, []);
  useEffect(() => { localStorage.setItem("spotearly-language", language); document.documentElement.lang = language; document.documentElement.dir = language === "ar" ? "rtl" : "ltr"; }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (text: string) => language === "ar" ? (arabic[text] ?? text) : text }), [language, setLanguage]);
  return <LanguageContext.Provider value={value}><DocumentTranslator language={language} />{children}</LanguageContext.Provider>;
}

export function useLanguage() { const context = useContext(LanguageContext); if (!context) throw new Error("useLanguage must be used within LanguageProvider"); return context; }
