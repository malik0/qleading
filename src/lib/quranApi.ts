import { MushafArabicFont, MushafScript, QuranTranslationOption } from "../types/quran";

export const QURAN_TRANSLATIONS: QuranTranslationOption[] = [
  { id: 20, name: "Saheeh International", author: "Saheeh International", shortLabel: "Saheeh Int. (Default)" },
  { id: 131, name: "The Clear Quran", author: "Mustafa Khattab", shortLabel: "The Clear Quran (Mustafa Khattab)" },
  { id: 85, name: "M.A.S. Abdel Haleem", author: "M.A.S. Abdel Haleem", shortLabel: "Abdel Haleem (Oxford)" },
  { id: 84, name: "Mufti Taqi Usmani", author: "Mufti Taqi Usmani", shortLabel: "Taqi Usmani" },
  { id: 19, name: "Mohammed Pickthall", author: "Mohammed Marmaduke William Pickthall", shortLabel: "Pickthall" },
  { id: 22, name: "Abdullah Yusuf Ali", author: "Abdullah Yusuf Ali", shortLabel: "Yusuf Ali" },
  { id: 203, name: "Al-Hilali & Khan", author: "Muhammad Taqi-ud-Din al-Hilali & Muhammad Muhsin Khan", shortLabel: "Hilali & Khan" },
  { id: 149, name: "Bridges' Translation", author: "Fadel Soliman", shortLabel: "Bridges" },
  { id: 95, name: "Sayyid Abul Ala Maududi", author: "Sayyid Abul Ala Maududi (Tafhim)", shortLabel: "Maududi" },
];

export interface ArabicFontOption {
  id: MushafArabicFont;
  name: string;
  fontFamily: string;
  recommendedFor: MushafScript;
  description: string;
}

export const ARABIC_FONT_OPTIONS: ArabicFontOption[] = [
  {
    id: "amiri-quran",
    name: "Amiri Quran",
    fontFamily: "'Amiri Quran', 'Amiri', 'Scheherazade New', serif",
    recommendedFor: "uthmani",
    description: "Classical Medina Uthmanic Quran calligraphy",
  },
  {
    id: "noto-nastaliq",
    name: "Noto Nastaliq Urdu",
    fontFamily: "'Noto Nastaliq Urdu', 'Al Qalam Quran', serif",
    recommendedFor: "indopak",
    description: "Traditional Indo-Pak / Subcontinent Nastaliq script",
  },
  {
    id: "scheherazade",
    name: "Scheherazade New",
    fontFamily: "'Scheherazade New', 'Amiri', serif",
    recommendedFor: "uthmani",
    description: "Elegant traditional Middle-Eastern Naskh typeface",
  },
  {
    id: "noto-naskh",
    name: "Noto Naskh Arabic",
    fontFamily: "'Noto Naskh Arabic', 'Amiri', sans-serif",
    recommendedFor: "uthmani",
    description: "Clean, modern, highly legible Naskh glyphs",
  },
  {
    id: "amiri",
    name: "Amiri Classic",
    fontFamily: "'Amiri', serif",
    recommendedFor: "uthmani",
    description: "Standard book typesetting Naskh",
  },
];

export interface QuranVerseData {
  verseKey: string;
  surahNumber: number;
  ayahNumber: number;
  textUthmani: string;
  textIndopak: string;
  translationText: string;
  translationId: number;
  translationName: string;
  pageNumber?: number;
  juzNumber?: number;
}

export function cleanTranslationText(raw?: string): string {
  if (!raw) return "";
  return raw
    .replace(/<sup[^>]*>.*?<\/sup>/gi, "") // Remove footnote superscripts
    .replace(/<[^>]+>/g, "") // Remove remaining HTML tags
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export function getFontFamilyForOption(fontId?: MushafArabicFont): string {
  const found = ARABIC_FONT_OPTIONS.find((f) => f.id === fontId);
  return found ? found.fontFamily : "'Amiri Quran', 'Amiri', serif";
}

// In-memory cache to prevent redundant network requests
const verseCache = new Map<string, QuranVerseData>();

const CLEAR_QURAN_SOURCE_URL =
  "https://raw.githubusercontent.com/UmmahLibrary/ummah-library/main/packages/data/datasets/translations/eng-khattab.json";

interface ClearQuranSource {
  verses?: Array<{ sura?: number; aya?: number; text?: string }>;
}

let clearQuranTranslationsPromise: Promise<Map<string, string>> | undefined;

/**
 * Quran.com's legacy verse endpoint now returns Arabic text without translations.
 * Keep a cached copy of the Clear Quran available for translation ID 131.
 */
async function getClearQuranTranslations(): Promise<Map<string, string>> {
  if (!clearQuranTranslationsPromise) {
    clearQuranTranslationsPromise = fetch(CLEAR_QURAN_SOURCE_URL)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Clear Quran source error: ${res.status}`);
        }

        const source = (await res.json()) as ClearQuranSource;
        const translations = new Map<string, string>();
        for (const verse of source.verses ?? []) {
          if (verse.sura && verse.aya && verse.text) {
            translations.set(`${verse.sura}:${verse.aya}`, cleanTranslationText(verse.text));
          }
        }

        if (translations.size === 0) {
          throw new Error("Clear Quran source contained no verses");
        }
        return translations;
      })
      .catch((error) => {
        // Permit a retry if a transient network failure prevents the initial load.
        clearQuranTranslationsPromise = undefined;
        throw error;
      });
  }

  return clearQuranTranslationsPromise;
}

async function getTranslationText(
  verseKey: string,
  translationId: number,
  apiText?: string
): Promise<string> {
  const text = cleanTranslationText(apiText);
  if (text || translationId !== 131) return text;

  const clearQuranTranslations = await getClearQuranTranslations();
  return clearQuranTranslations.get(verseKey) ?? "";
}

/**
 * Fetches Quranic Arabic text (Uthmani + IndoPak) and English translation from Quran.com API v4
 */
export async function fetchVerseData(
  surahNumber: number,
  ayahNumber: number,
  translationId: number = 20
): Promise<QuranVerseData> {
  const cacheKey = `${surahNumber}:${ayahNumber}:${translationId}`;
  if (verseCache.has(cacheKey)) {
    return verseCache.get(cacheKey)!;
  }

  const verseKey = `${surahNumber}:${ayahNumber}`;
  const url = `https://api.quran.com/api/v4/verses/by_key/${verseKey}?language=en&words=false&translations=${translationId}&fields=text_uthmani,text_indopak`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Quran.com API error: ${res.status}`);
    }
    const json = await res.json();
    const verse = json.verse;
    if (!verse) {
      throw new Error("Verse not found in response");
    }

    const cleanTrans = await getTranslationText(verseKey, translationId, verse.translations?.[0]?.text);
    const transMeta = QURAN_TRANSLATIONS.find((t) => t.id === translationId);

    const data: QuranVerseData = {
      verseKey,
      surahNumber,
      ayahNumber,
      textUthmani: verse.text_uthmani || "",
      textIndopak: verse.text_indopak || verse.text_uthmani || "",
      translationText: cleanTrans,
      translationId,
      translationName: transMeta ? transMeta.name : "Translation",
      pageNumber: verse.page_number,
      juzNumber: verse.juz_number,
    };

    verseCache.set(cacheKey, data);
    return data;
  } catch (err) {
    // Fallback attempt with AlQuran Cloud if Quran.com fails or is blocked
    try {
      const fallbackUrl = `https://api.alquran.cloud/v1/ayah/${verseKey}/editions/quran-uthmani,en.sahih`;
      const fbRes = await fetch(fallbackUrl);
      if (fbRes.ok) {
        const fbJson = await fbRes.json();
        const uthmaniItem = fbJson.data?.[0];
        const sahihItem = fbJson.data?.[1];

        const data: QuranVerseData = {
          verseKey,
          surahNumber,
          ayahNumber,
          textUthmani: uthmaniItem?.text || "",
          textIndopak: uthmaniItem?.text || "",
          translationText: cleanTranslationText(sahihItem?.text || ""),
          translationId,
          translationName: "Saheeh International (Fallback)",
          pageNumber: uthmaniItem?.page,
          juzNumber: uthmaniItem?.juz,
        };
        verseCache.set(cacheKey, data);
        return data;
      }
    } catch {
      // ignore secondary fallback error
    }

    throw err;
  }
}

/**
 * Preload and cache upcoming/previous verses in background for zero-latency page turns
 */
export function preloadVerses(
  targets: Array<{ surahNumber: number; ayahNumber: number }>,
  translationId: number = 20
): void {
  for (const t of targets) {
    const cacheKey = `${t.surahNumber}:${t.ayahNumber}:${translationId}`;
    if (!verseCache.has(cacheKey)) {
      fetchVerseData(t.surahNumber, t.ayahNumber, translationId).catch(() => {});
    }
  }
}
