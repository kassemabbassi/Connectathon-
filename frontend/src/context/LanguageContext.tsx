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

Object.assign(arabic, {
  "SpotEarly Admin": "إدارة سبوت إيرلي",
  "SpotEarly logo": "شعار سبوت إيرلي",
  "Only administrators can add schools and create staff or dentist logins. You can add as many institutions as you need; each new school is added to the list and previous ones stay.": "لا يمكن إلا للمسؤولين إضافة المدارس وإنشاء حسابات لموظفي المدارس أو أطباء الأسنان. يمكنك إضافة العدد الذي تحتاج إليه من المؤسسات؛ تُضاف كل مدرسة جديدة إلى القائمة وتبقى المدارس السابقة.",
  "Saved institutions": "المؤسسات المحفوظة",
  "New ones are added, never replaced.": "تُضاف المؤسسات الجديدة ولا تُستبدل المؤسسات السابقة.",
  "e.g. École Pilote Monastir": "مثال: المدرسة النموذجية بالمنستير",
  "e.g. \u00c3\u2030cole Pilote Monastir": "مثال: المدرسة النموذجية بالمنستير",
  "No institution yet. Add one before creating accounts.": "لا توجد مؤسسة بعد. أضف مؤسسة قبل إنشاء الحسابات.",
  "active": "نشط",
  "At least 8 characters": "8 أحرف على الأقل",
  "Adding\u00e2\u20ac\u00a6": "جارٍ الإضافة…",
  "Creating\u00e2\u20ac\u00a6": "جارٍ الإنشاء…",
  "Runs screenings at the school.": "يجري الفحوصات في المدرسة.",
  "Reviews that school's files.": "يراجع ملفات تلك المدرسة.",
  "Add an institution first": "أضف مؤسسة أولاً",
  "No staff or dentist accounts yet.": "لا توجد حسابات لموظفين أو أطباء أسنان بعد.",
  "No institution": "لا توجد مؤسسة",
  "staff": "موظف",
  "dentist": "طبيب أسنان",
  "Unable to load institutions and accounts.": "تعذّر تحميل المؤسسات والحسابات.",
  "Institution added. Previous institutions are kept, so you can work with several schools.": "تمت إضافة المؤسسة. يتم الاحتفاظ بالمؤسسات السابقة، لذا يمكنك العمل مع عدة مدارس.",
  "Unable to add this institution.": "تعذّر إضافة هذه المؤسسة.",
  "Add an institution first, then create the account.": "أضف مؤسسة أولاً، ثم أنشئ الحساب.",
  "Account created. The user can now sign in.": "تم إنشاء الحساب. يمكن للمستخدم تسجيل الدخول الآن.",
  "Unable to create this account.": "تعذّر إنشاء هذا الحساب.",
  "File validation": "\u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0645\u0644\u0641", "File clinically validated": "\u062a\u0645 \u0627\u0644\u062a\u062d\u0642\u0642 \u0627\u0644\u0633\u0631\u064a\u0631\u064a \u0645\u0646 \u0627\u0644\u0645\u0644\u0641", "Ready for clinical validation": "\u062c\u0627\u0647\u0632 \u0644\u0644\u062a\u062d\u0642\u0642 \u0627\u0644\u0633\u0631\u064a\u0631\u064a", "Validated": "\u062a\u0645 \u0627\u0644\u062a\u062d\u0642\u0642", "After reviewing the images and notes, confirm that this patient file is complete.": "\u0628\u0639\u062f \u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0635\u0648\u0631 \u0648\u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a\u060c \u0623\u0643\u0651\u062f \u0627\u0643\u062a\u0645\u0627\u0644 \u0645\u0644\u0641 \u0627\u0644\u0645\u0631\u064a\u0636.", "Validate patient file": "\u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0645\u0644\u0641 \u0627\u0644\u0645\u0631\u064a\u0636", "Validating…": "\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0642\u0642…", "Unable to validate this patient file.": "\u062a\u0639\u0630\u0631 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0645\u0644\u0641 \u0627\u0644\u0645\u0631\u064a\u0636 \u0647\u0630\u0627."
});

Object.assign(arabic, {
  "Delete file": "\u062d\u0630\u0641 \u0627\u0644\u0645\u0644\u0641", "Deleting…": "\u062c\u0627\u0631\u064d \u0627\u0644\u062d\u0630\u0641…", "Delete this patient file? This permanently removes the file and its images.": "\u0647\u0644 \u062a\u0631\u064a\u062f \u062d\u0630\u0641 \u0645\u0644\u0641 \u0627\u0644\u0645\u0631\u064a\u0636 \u0647\u0630\u0627\u061f \u0633\u064a\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u0645\u0644\u0641 \u0648\u0635\u0648\u0631\u0647 \u0646\u0647\u0627\u0626\u064a\u0627\u064b.", "Unable to delete this patient file.": "\u062a\u0639\u0630\u0631 \u062d\u0630\u0641 \u0645\u0644\u0641 \u0627\u0644\u0645\u0631\u064a\u0636 \u0647\u0630\u0627."
});

Object.assign(arabic, {
  "Required before capture": "مطلوب قبل التقاط الصور",
  "Parent or guardian authorisation": "تفويض الوالد أو الولي القانوني",
  "Purpose": "الغرض", "Data minimisation": "تقليل البيانات", "Retention": "مدة الاحتفاظ", "Your rights": "حقوقكم",
  "Anonymous patient code": "رمز المريض المجهول", "Patient code": "رمز المريض",
  "This school screening involves a minor's health-related images. Do not capture or upload a photo until the required authorisation has been verified.": "يتضمن هذا الفحص المدرسي صوراً صحية تخص قاصراً. لا تلتقط أو ترفع صورة قبل التحقق من التفويض المطلوب.",
  "AI-assisted screening and review by an authorised dental professional. It is not an automated diagnosis.": "فحص مدعوم بالذكاء الاصطناعي ومراجعة من مختص أسنان مخول، وليس تشخيصاً آلياً.",
  "The record uses an anonymous patient code; no name, age, national ID, or student ID is collected in this form.": "يستخدم السجل رمزاً مجهولاً للمريض؛ ولا تُجمع أي بيانات عن الاسم أو العمر أو بطاقة الهوية أو المعرف المدرسي.",
  "Images, findings, and consent metadata are retained for 12 months for clinical follow-up, then automatically deleted.": "تُحتفَظ بالصور والنتائج وبيانات الموافقة لمدة 12 شهراً للمتابعة السريرية، ثم تُحذف تلقائياً.",
  "Consent may be withdrawn before screening. Access, correction, and deletion requests can be sent to the platform administrator.": "يمكن سحب الموافقة قبل الفحص، كما يمكن إرسال طلبات النفاذ أو التصحيح أو الحذف إلى مسؤول المنصة.",
  "Tunisia: Organic Law No. 2004-63 of 27 July 2004 and the INPDP framework apply. For a child's personal and health data, guardian consent and any required family-judge authorisation must be obtained before processing.": "تونس: ينطبق القانون الأساسي عدد 63 لسنة 2004 المؤرخ في 27 يوليو 2004 وإطار الهيئة الوطنية لحماية المعطيات الشخصية. بالنسبة إلى بيانات الطفل الشخصية والصحية، يجب الحصول على موافقة الولي وأي ترخيص مطلوب من قاضي الأسرة قبل المعالجة.",
  "I confirm that the parent or legal guardian has given informed authorisation for this screening, that any required legal authorisation has been obtained, and that the information above was provided.": "أؤكد أن الوالد أو الولي القانوني منح تفويضاً مستنيراً لهذا الفحص، وأنه تم الحصول على أي ترخيص قانوني مطلوب، وأن المعلومات الواردة أعلاه قد تم تقديمها.",
  "This code contains no name, age, or government/student identity information.": "لا يتضمن هذا الرمز أي اسم أو عمر أو بيانات هوية حكومية أو مدرسية."
});

Object.assign(arabic, {
  "Consent and parental authorisation": "\u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0648\u062a\u0641\u0648\u064a\u0636 \u0627\u0644\u0648\u0627\u0644\u062f\u064a\u0646",
  "Informed consent": "\u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0627\u0644\u0645\u0633\u062a\u0646\u064a\u0631\u0629",
  "Data protection": "\u062d\u0645\u0627\u064a\u0629 \u0627\u0644\u0645\u0639\u0637\u064a\u0627\u062a",
  "The parent or legal guardian must receive the screening information and give their authorisation before any image is captured or processed.": "\u064a\u062c\u0628 \u0623\u0646 \u064a\u062a\u0644\u0642\u0649 \u0627\u0644\u0648\u0627\u0644\u062f \u0623\u0648 \u0627\u0644\u0648\u0644\u064a \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0641\u062d\u0635 \u0648\u0623\u0646 \u064a\u0645\u0646\u062d \u062a\u0641\u0648\u064a\u0636\u0647 \u0642\u0628\u0644 \u0627\u0644\u062a\u0642\u0627\u0637 \u0623\u064a \u0635\u0648\u0631\u0629 \u0623\u0648 \u0645\u0639\u0627\u0644\u062c\u062a\u0647\u0627.",
  "Personal and health-related data are handled under the applicable Tunisian data-protection framework.": "\u062a\u064f\u0639\u0627\u0644\u062c \u0627\u0644\u0645\u0639\u0637\u064a\u0627\u062a \u0627\u0644\u0634\u062e\u0635\u064a\u0629 \u0648\u0627\u0644\u0635\u062d\u064a\u0629 \u0648\u0641\u0642 \u0625\u0637\u0627\u0631 \u062d\u0645\u0627\u064a\u0629 \u0627\u0644\u0645\u0639\u0637\u064a\u0627\u062a \u0627\u0644\u062a\u0648\u0646\u0633\u064a \u0627\u0644\u0645\u0637\u0628\u0642.",
  "Tunisia: Organic Law No. 2004-63 of 27 July 2004 and the framework of the INPDP (National Authority for the Protection of Personal Data) apply. A minor's personal and health-related data may only be processed after the parent or legal guardian has given informed authorisation.": "\u062a\u0648\u0646\u0633: \u064a\u0646\u0637\u0628\u0642 \u0627\u0644\u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u0623\u0633\u0627\u0633\u064a \u0639\u062f\u062f 2004-63 \u0627\u0644\u0645\u0624\u0631\u062e \u0641\u064a 27 \u064a\u0648\u0644\u064a\u0648 2004 \u0648\u0625\u0637\u0627\u0631 \u0627\u0644\u0647\u064a\u0626\u0629 \u0627\u0644\u0648\u0637\u0646\u064a\u0629 \u0644\u062d\u0645\u0627\u064a\u0629 \u0627\u0644\u0645\u0639\u0637\u064a\u0627\u062a \u0627\u0644\u0634\u062e\u0635\u064a\u0629 (INPDP). \u0644\u0627 \u062a\u064f\u0639\u0627\u0644\u062c \u0645\u0639\u0637\u064a\u0627\u062a \u0627\u0644\u0642\u0627\u0635\u0631 \u0627\u0644\u0634\u062e\u0635\u064a\u0629 \u0648\u0627\u0644\u0635\u062d\u064a\u0629 \u0625\u0644\u0627 \u0628\u0639\u062f \u0627\u0644\u062d\u0635\u0648\u0644 \u0639\u0644\u0649 \u062a\u0641\u0648\u064a\u0636 \u0645\u0633\u062a\u0646\u064a\u0631 \u0645\u0646 \u0627\u0644\u0648\u0627\u0644\u062f \u0623\u0648 \u0627\u0644\u0648\u0644\u064a \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a.",
  "I confirm that the parent or legal guardian has received the required information and has given informed authorisation for this child's screening.": "\u0623\u0624\u0643\u062f \u0623\u0646 \u0627\u0644\u0648\u0627\u0644\u062f \u0623\u0648 \u0627\u0644\u0648\u0644\u064a \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a \u0642\u062f \u062a\u0644\u0642\u0649 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u0648\u0645\u0646\u062d \u062a\u0641\u0648\u064a\u0636\u0627\u064b \u0645\u0633\u062a\u0646\u064a\u0631\u0627\u064b \u0644\u0641\u062d\u0635 \u0647\u0630\u0627 \u0627\u0644\u0637\u0641\u0644.",
  "Create an anonymous screening record": "\u0625\u0646\u0634\u0627\u0621 \u0633\u062c\u0644 \u0641\u062d\u0635 \u0645\u062c\u0647\u0648\u0644 \u0627\u0644\u0647\u0648\u064a\u0629",
  "Enter the patient's non-identifying code, then capture or upload one or more clear photos of the child's teeth.": "\u0623\u062f\u062e\u0644 \u0631\u0645\u0632 \u0627\u0644\u0645\u0631\u064a\u0636 \u063a\u064a\u0631 \u0627\u0644\u0645\u0639\u0631\u0651\u0641\u060c \u062b\u0645 \u0627\u0644\u062a\u0642\u0637 \u0623\u0648 \u0627\u0631\u0641\u0639 \u0635\u0648\u0631\u0629 \u0648\u0627\u0636\u062d\u0629 \u0623\u0648 \u0623\u0643\u062b\u0631 \u0644\u0623\u0633\u0646\u0627\u0646 \u0627\u0644\u0637\u0641\u0644.",
  "Enter patient code": "\u0623\u062f\u062e\u0644 \u0631\u0645\u0632 \u0627\u0644\u0645\u0631\u064a\u0636", "Capture photos": "\u0627\u0644\u062a\u0642\u0627\u0637 \u0627\u0644\u0635\u0648\u0631",
  "Enter the patient's anonymous code": "\u0623\u062f\u062e\u0644 \u0631\u0645\u0632 \u0627\u0644\u0645\u0631\u064a\u0636 \u0627\u0644\u0645\u062c\u0647\u0648\u0644",
  "Teeth together, straight-on": "\u0627\u0644\u0623\u0633\u0646\u0627\u0646 \u0645\u0637\u0628\u0642\u0629\u060c \u0648\u062c\u0647\u0627\u064b \u0644\u0648\u062c\u0647", "Chin up, upper teeth only": "\u0627\u0631\u0641\u0639 \u0627\u0644\u0630\u0642\u0646\u060c \u0627\u0644\u0623\u0633\u0646\u0627\u0646 \u0627\u0644\u0639\u0644\u0648\u064a\u0629 \u0641\u0642\u0637", "Chin down, lower teeth only": "\u0623\u062e\u0641\u0636 \u0627\u0644\u0630\u0642\u0646\u060c \u0627\u0644\u0623\u0633\u0646\u0627\u0646 \u0627\u0644\u0633\u0641\u0644\u064a\u0629 \u0641\u0642\u0637", "Left profile, biting down": "\u0645\u0646 \u0627\u0644\u062c\u0627\u0646\u0628 \u0627\u0644\u0623\u064a\u0633\u0631 \u0645\u0639 \u0625\u0637\u0628\u0627\u0642 \u0627\u0644\u0623\u0633\u0646\u0627\u0646", "Right profile, biting down": "\u0645\u0646 \u0627\u0644\u062c\u0627\u0646\u0628 \u0627\u0644\u0623\u064a\u0645\u0646 \u0645\u0639 \u0625\u0637\u0628\u0627\u0642 \u0627\u0644\u0623\u0633\u0646\u0627\u0646",
  "Front bite": "\u0635\u0648\u0631\u0629 \u0627\u0644\u0625\u0637\u0628\u0627\u0642 \u0627\u0644\u0623\u0645\u0627\u0645\u064a", "Upper arch": "\u0627\u0644\u0642\u0648\u0633 \u0627\u0644\u0639\u0644\u0648\u064a", "Lower arch": "\u0627\u0644\u0642\u0648\u0633 \u0627\u0644\u0633\u0641\u0644\u064a", "Left side": "\u0627\u0644\u062c\u0627\u0646\u0628 \u0627\u0644\u0623\u064a\u0633\u0631", "Right side": "\u0627\u0644\u062c\u0627\u0646\u0628 \u0627\u0644\u0623\u064a\u0645\u0646",
  "Capture at least the front bite. More angles help the AI model give a more complete read.": "\u0627\u0644\u062a\u0642\u0637 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0635\u0648\u0631\u0629 \u0627\u0644\u0625\u0637\u0628\u0627\u0642 \u0627\u0644\u0623\u0645\u0627\u0645\u064a. \u062a\u0633\u0627\u0639\u062f \u0627\u0644\u0632\u0648\u0627\u064a\u0627 \u0627\u0644\u0625\u0636\u0627\u0641\u064a\u0629 \u0646\u0645\u0648\u0630\u062c \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0639\u0644\u0649 \u0627\u0644\u0642\u0631\u0627\u0621\u0629 \u0628\u0634\u0643\u0644 \u0623\u0643\u0645\u0644.",
  "Load demo images": "\u062a\u062d\u0645\u064a\u0644 \u0635\u0648\u0631 \u062a\u062c\u0631\u064a\u0628\u064a\u0629", "Start screening": "\u0628\u062f\u0621 \u0627\u0644\u0641\u062d\u0635",
  "angles captured": "\u0632\u0627\u0648\u064a\u0629 \u0645\u0644\u062a\u0642\u0637\u0629", "Captured photo": "\u0635\u0648\u0631\u0629 \u0645\u0644\u062a\u0642\u0637\u0629", "Remove photo": "\u0625\u0632\u0627\u0644\u0629 \u0627\u0644\u0635\u0648\u0631\u0629",
  "Screening in progress": "\u0627\u0644\u0641\u062d\u0635 \u062c\u0627\u0631\u064d", "Analyzing screening": "\u062c\u0627\u0631\u064d \u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0641\u062d\u0635", "Our prototype is checking the captured images for visible areas that may need clinical review.": "\u064a\u062a\u062d\u0642\u0642 \u0627\u0644\u0646\u0645\u0648\u0630\u062c \u0627\u0644\u0623\u0648\u0644\u064a \u0645\u0646 \u0627\u0644\u0635\u0648\u0631 \u0627\u0644\u0645\u0644\u062a\u0642\u0637\u0629 \u0644\u0644\u0628\u062d\u062b \u0639\u0646 \u0645\u0646\u0627\u0637\u0642 \u0645\u0631\u0626\u064a\u0629 \u0642\u062f \u062a\u062d\u062a\u0627\u062c \u0625\u0644\u0649 \u0645\u0631\u0627\u062c\u0639\u0629 \u0633\u0631\u064a\u0631\u064a\u0629.",
  "Images received": "\u062a\u0645 \u0627\u0633\u062a\u0644\u0627\u0645 \u0627\u0644\u0635\u0648\u0631", "Detecting possible caries": "\u062c\u0627\u0631\u064d \u0627\u0643\u062a\u0634\u0627\u0641 \u062a\u0633\u0648\u0633 \u0645\u062d\u062a\u0645\u0644", "Preparing patient file": "\u062c\u0627\u0631\u064d \u0625\u0639\u062f\u0627\u062f \u0645\u0644\u0641 \u0627\u0644\u0645\u0631\u064a\u0636", "This demo simulates the AI processing step.": "\u062a\u062d\u0627\u0643\u064a \u0647\u0630\u0647 \u0627\u0644\u062a\u062c\u0631\u0628\u0629 \u062e\u0637\u0648\u0629 \u0627\u0644\u0645\u0639\u0627\u0644\u062c\u0629 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a."
});

Object.assign(arabic, {
  "Review patient files created by staff of your institution, then add clinical notes.": "\u0631\u0627\u062c\u0639 \u0645\u0644\u0641\u0627\u062a \u0627\u0644\u0645\u0631\u0636\u0649 \u0645\u0646 \u0645\u0624\u0633\u0633\u062a\u0643\u060c \u062b\u0645 \u0623\u0636\u0641 \u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0627\u0644\u0633\u0631\u064a\u0631\u064a\u0629.",
  "Search patients": "\u0627\u0628\u062d\u062b \u0639\u0646 \u0627\u0644\u0645\u0631\u0636\u0649", "No matching files": "\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0644\u0641\u0627\u062a \u0645\u0637\u0627\u0628\u0642\u0629", "Loading files…": "\u062c\u0627\u0631\u064d \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0644\u0641\u0627\u062a…", "No saved files yet": "\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0644\u0641\u0627\u062a \u0645\u062d\u0641\u0648\u0638\u0629 \u0628\u0639\u062f",
  "Unable to load screening files for this institution.": "\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0645\u0644\u0641\u0627\u062a \u0627\u0644\u0641\u062d\u0635 \u0644\u0647\u0630\u0647 \u0627\u0644\u0645\u0624\u0633\u0633\u0629.", "Try another patient name or ID.": "\u062c\u0631\u0651\u0628 \u0627\u0633\u0645 \u0645\u0631\u064a\u0636 \u0622\u062e\u0631 \u0623\u0648 \u0631\u0645\u0632\u0647.", "Files saved by school staff of your institution will appear here.": "\u0633\u062a\u0638\u0647\u0631 \u0647\u0646\u0627 \u0645\u0644\u0641\u0627\u062a \u0645\u0648\u0638\u0641\u064a \u0645\u062f\u0631\u0633\u062a\u0643.",
  "Anonymous patient record": "\u0633\u062c\u0644 \u0645\u0631\u064a\u0636 \u0645\u062c\u0647\u0648\u0644 \u0627\u0644\u0647\u0648\u064a\u0629", "photos": "\u0635\u0648\u0631", "Notes added": "\u062a\u0645\u062a \u0625\u0636\u0627\u0641\u0629 \u0645\u0644\u0627\u062d\u0638\u0627\u062a", "No notes": "\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0644\u0627\u062d\u0638\u0627\u062a", "Saved": "\u0645\u062d\u0641\u0648\u0638", "Privacy": "\u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629", "Anonymous record": "\u0633\u062c\u0644 \u0645\u062c\u0647\u0648\u0644 \u0627\u0644\u0647\u0648\u064a\u0629",
  "Click to inspect": "\u0627\u0646\u0642\u0631 \u0644\u0644\u0641\u062d\u0635", "Live model result": "\u0646\u062a\u064a\u062c\u0629 \u0627\u0644\u0646\u0645\u0648\u0630\u062c \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629", "AI result": "\u0646\u062a\u064a\u062c\u0629 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a", "AI result image": "\u0635\u0648\u0631\u0629 \u0646\u062a\u064a\u062c\u0629 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a", "Captured image": "\u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u0645\u0644\u062a\u0642\u0637\u0629",
  "Add observations, recommendations, or follow-up details...": "\u0623\u0636\u0641 \u0645\u0644\u0627\u062d\u0638\u0627\u062a\u060c \u062a\u0648\u0635\u064a\u0627\u062a\u060c \u0623\u0648 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629...", "characters": "\u062d\u0631\u0641\u0627\u064b", "Notes saved": "\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a", "Save notes": "\u062d\u0641\u0638 \u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a", "Choose a saved record to review its full details.": "\u0627\u062e\u062a\u0631 \u0633\u062c\u0644\u0627\u064b \u0645\u062d\u0641\u0648\u0638\u0627\u064b \u0644\u0645\u0631\u0627\u062c\u0639\u0629 \u0643\u0627\u0645\u0644 \u062a\u0641\u0627\u0635\u064a\u0644\u0647.",
  "Review": "\u0645\u0631\u0627\u062c\u0639\u0629", "Validated by doctor": "\u062a\u0645 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646\u0647\u0627 \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0637\u0628\u064a\u0628", "Awaiting validation": "\u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u062a\u062d\u0642\u0642", "This image has been reviewed.": "\u062a\u0645\u062a \u0645\u0631\u0627\u062c\u0639\u0629 \u0647\u0630\u0647 \u0627\u0644\u0635\u0648\u0631\u0629.", "Confirm the image before closing the file.": "\u0623\u0643\u0651\u062f \u0627\u0644\u0635\u0648\u0631\u0629 \u0642\u0628\u0644 \u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u0645\u0644\u0641.", "Image validated": "\u062a\u0645 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0635\u0648\u0631\u0629", "Mark as validated": "\u0639\u0644\u0651\u0645\u0647\u0627 \u0643\u0645\u062a\u062d\u0642\u0642 \u0645\u0646\u0647\u0627", "Add observations for this review...": "\u0623\u0636\u0641 \u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0644\u0647\u0630\u0647 \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629...", "Needs dentist review": "\u064a\u062d\u062a\u0627\u062c \u0625\u0644\u0649 \u0645\u0631\u0627\u062c\u0639\u0629 \u0637\u0628\u064a\u0628 \u0623\u0633\u0646\u0627\u0646"
});

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
