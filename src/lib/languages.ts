"use client";

/**
 * The languages this app expects its learners to read in, and what it honestly
 * offers each of them.
 *
 * ## The decision this file encodes
 *
 * There are two separable things a "language option" could translate, and they
 * deserve opposite answers:
 *
 *  1. **The 350 practice questions.** Not translated, and not by us. They turn
 *     on legal obligations, where *controller*, *provider*, *deployer* and
 *     *substantial modification* are terms of art that already have official
 *     renderings in other languages. An unreviewed machine translation of those
 *     reads perfectly fluently and teaches the wrong word — and if this app
 *     shipped it, it would be *our* claim about what the law says rather than
 *     an aid the learner reached for.
 *  2. **The page itself.** Already handled, and better, by the browser the
 *     learner is on. Chrome, Safari and Edge all translate in place, on device,
 *     for free, under the learner's control, and they translate the interface
 *     along with everything else. Rebuilding that would mean an API key in a
 *     static export — which is a published key — to do worse what the browser
 *     already does.
 *
 * So this module is deliberately *not* an i18n framework. It is the small
 * amount that browser translation cannot do for itself:
 *
 *  - name the languages, in their own script, so a learner can see they were
 *    expected here rather than inferring it from silence;
 *  - say, **in that language**, that the questions are in English and how to
 *    translate the page — which is precisely the sentence a learner cannot read
 *    if it is only available in the language they do not read;
 *  - tell them whether their device has a read-aloud voice for it.
 *
 * ## These translations are unreviewed
 *
 * The strings below were written by the model that built this feature and have
 * not been checked by a native speaker. They are deliberately the lowest-risk
 * text in the app — three practical sentences about a browser feature, with no
 * legal, regulatory or exam content in them — so the worst case is awkward
 * phrasing rather than a learner being taught something false. That is a very
 * different bet from translating the question bank, and it is the only reason
 * this is acceptable where that is not. Anything here is cheap to replace with
 * a reviewed string; nothing here should ever grow to carry legal copy.
 *
 * ## Why the page `lang` is never changed
 *
 * Choosing a language here does not set `lang` on the document. The attribute
 * states what language the text *is*, not what the reader would prefer: marking
 * English text as Spanish would make a screen reader pronounce English words
 * with Spanish phonics, which is worse than doing nothing at all. The browser
 * sets it correctly when it translates, and read-aloud reads it from the DOM.
 *
 * ## The list
 *
 * Ordered by how widely each is spoken at home in the United States, per the
 * Census Bureau's American Community Survey, then a short tail of languages
 * that matter for this subject specifically because the EU AI Act and the GDPR
 * are published in them. No usage figures are quoted here, because none could
 * be verified from this environment and an invented one is worse than none.
 */

export interface AppLanguage {
  /** BCP 47. Used to match read-aloud voices, never written to `lang`. */
  code: string;
  /** The language's name in its own script — the part a learner recognizes. */
  endonym: string;
  /** Its English name, for the settings list and for screen readers. */
  english: string;
  /** Right-to-left scripts need `dir` on the note, or it renders scrambled. */
  rtl?: boolean;
  /** Why it is on the list. */
  group: "us" | "subject";
  /**
   * Three sentences, in this language: what is in English, how to translate,
   * and what read-aloud will then do. Empty for English, which needs none.
   */
  note: readonly string[];
}

export const LANGUAGES: readonly AppLanguage[] = [
  {
    code: "en",
    endonym: "English",
    english: "English",
    group: "us",
    note: [],
  },
  {
    code: "es",
    endonym: "Español",
    english: "Spanish",
    group: "us",
    note: [
      "Las preguntas de práctica están escritas en inglés.",
      "Usa la función de traducción de tu navegador para leer esta página en español.",
      "La lectura en voz alta leerá el texto traducido si tienes instalada una voz en español.",
    ],
  },
  {
    code: "zh-Hans",
    endonym: "中文（简体）",
    english: "Chinese (Simplified)",
    group: "us",
    note: [
      "练习题以英文撰写。",
      "请使用浏览器的翻译功能，以中文阅读此页面。",
      "朗读功能随后会读出翻译后的文本（需已安装中文语音）。",
    ],
  },
  {
    code: "tl",
    endonym: "Tagalog",
    english: "Tagalog",
    group: "us",
    note: [
      "Ang mga tanong sa pagsasanay ay nakasulat sa Ingles.",
      "Gamitin ang translate feature ng iyong browser para basahin ang pahinang ito sa Tagalog.",
      "Babasahin ng read aloud ang isinaling teksto kung may naka-install kang boses na Tagalog.",
    ],
  },
  {
    code: "vi",
    endonym: "Tiếng Việt",
    english: "Vietnamese",
    group: "us",
    note: [
      "Các câu hỏi luyện tập được viết bằng tiếng Anh.",
      "Hãy dùng chức năng dịch của trình duyệt để đọc trang này bằng tiếng Việt.",
      "Khi đó, chức năng đọc to sẽ đọc văn bản đã dịch nếu bạn đã cài giọng tiếng Việt.",
    ],
  },
  {
    code: "ar",
    endonym: "العربية",
    english: "Arabic",
    rtl: true,
    group: "us",
    note: [
      "أسئلة التدريب مكتوبة باللغة الإنجليزية.",
      "استخدم خاصية الترجمة في متصفحك لقراءة هذه الصفحة بالعربية.",
      "عندئذٍ ستقرأ خاصية القراءة الصوتية النص المترجم، إذا كان لديك صوت عربي مثبت.",
    ],
  },
  {
    code: "fr",
    endonym: "Français",
    english: "French",
    group: "us",
    note: [
      "Les questions d'entraînement sont rédigées en anglais.",
      "Utilisez la fonction de traduction de votre navigateur pour lire cette page en français.",
      "La lecture à voix haute lira alors le texte traduit si une voix française est installée.",
    ],
  },
  {
    code: "ko",
    endonym: "한국어",
    english: "Korean",
    group: "us",
    note: [
      "연습 문제는 영어로 작성되어 있습니다.",
      "브라우저의 번역 기능을 사용하면 이 페이지를 한국어로 읽을 수 있습니다.",
      "그러면 읽어주기 기능이 번역된 텍스트를 읽어 줍니다(한국어 음성이 설치된 경우).",
    ],
  },
  {
    code: "ru",
    endonym: "Русский",
    english: "Russian",
    group: "us",
    note: [
      "Практические вопросы написаны на английском языке.",
      "Используйте функцию перевода в браузере, чтобы прочитать эту страницу на русском языке.",
      "Тогда функция чтения вслух озвучит переведённый текст, если установлен русский голос.",
    ],
  },
  {
    code: "pt",
    endonym: "Português",
    english: "Portuguese",
    group: "us",
    note: [
      "As perguntas de prática estão escritas em inglês.",
      "Use a função de tradução do seu navegador para ler esta página em português.",
      "A leitura em voz alta lerá o texto traduzido se você tiver uma voz em português instalada.",
    ],
  },
  {
    code: "ht",
    endonym: "Kreyòl Ayisyen",
    english: "Haitian Creole",
    group: "us",
    note: [
      "Kesyon pratik yo ekri an angle.",
      "Sèvi ak fonksyon tradiksyon navigatè w la pou li paj sa a an kreyòl ayisyen.",
      "Apre sa, fonksyon li awotvwa a ap li tèks tradui a, si ou gen yon vwa kreyòl enstale.",
    ],
  },
  {
    code: "hi",
    endonym: "हिन्दी",
    english: "Hindi",
    group: "us",
    note: [
      "अभ्यास प्रश्न अंग्रेज़ी में लिखे गए हैं।",
      "इस पृष्ठ को हिन्दी में पढ़ने के लिए अपने ब्राउज़र की अनुवाद सुविधा का उपयोग करें।",
      "फिर ज़ोर से पढ़ने की सुविधा अनूदित पाठ पढ़ेगी, यदि आपके पास हिन्दी आवाज़ स्थापित है।",
    ],
  },
  {
    code: "de",
    endonym: "Deutsch",
    english: "German",
    group: "subject",
    note: [
      "Die Übungsfragen sind auf Englisch verfasst.",
      "Nutzen Sie die Übersetzungsfunktion Ihres Browsers, um diese Seite auf Deutsch zu lesen.",
      "Das Vorlesen liest dann den übersetzten Text, sofern eine deutsche Stimme installiert ist.",
    ],
  },
  {
    code: "ja",
    endonym: "日本語",
    english: "Japanese",
    group: "subject",
    note: [
      "練習問題は英語で書かれています。",
      "ブラウザの翻訳機能を使うと、このページを日本語で読めます。",
      "読み上げ機能は翻訳されたテキストを読み上げます（日本語の音声がインストールされている場合）。",
    ],
  },
] as const;

export const LANGUAGE_KEY = "aigp.read.lang";

export function languageFor(code: string | null | undefined): AppLanguage | null {
  if (!code) return null;
  return LANGUAGES.find((l) => l.code === code) ?? null;
}

/**
 * The stored reading language, or null.
 *
 * Null is the normal state and means "not chosen", not "English" — the two are
 * different, and only the first should make the app offer the note.
 */
export function getLanguage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(LANGUAGE_KEY);
    return languageFor(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function setLanguage(code: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (code === null) window.localStorage.removeItem(LANGUAGE_KEY);
    else window.localStorage.setItem(LANGUAGE_KEY, code);
  } catch {
    // The session still gets the choice; it just will not outlive the tab.
  }
}

/**
 * Whether the device can read this language aloud.
 *
 * Base-language match rather than exact tag: a learner who picked `pt` is well
 * served by a `pt-BR` voice, and telling them they have none because the tags
 * differ would be both wrong and discouraging.
 */
export function hasVoiceFor(code: string, voices: readonly { lang: string }[]): boolean {
  const base = code.toLowerCase().split("-")[0]!;
  return voices.some((v) => v.lang.toLowerCase().split("-")[0] === base);
}
