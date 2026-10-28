import { defaultDailyMenu } from "./initialData";

export interface DailyMenuType {
  gorunumModu: "tek" | "birlikte";
  aktifOgun: "kahvalti" | "aksam";
  kaloriGoster: boolean;
  gunTipi: "haftaici" | "haftasonu" | "ozelgun";
  saatler: {
    haftaici: { kahvalti: string; aksam: string };
    haftasonu: { kahvalti: string; aksam: string };
    ozelgun: { kahvalti: string; aksam: string };
  };
  kahvalti: string;
  kahvaltiSaat: string;
  kahvaltiKalori: string;
  aksam: string;
  aksamSaat: string;
  aksamKalori: string;
  tarih?: string;
}

/**
 * Yerel saat dilimine gore bugunun tarihini 'YYYY-MM-DD' formatinda dondurur.
 */
export const getTodayDateKey = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Gece yarisina (00:00:00) kalan milisaniye farkini hesaplar.
 */
export const getMsUntilMidnight = (): number => {
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0
  );
  return Math.max(0, midnight.getTime() - now.getTime());
};

/**
 * Bugunun gunune gore otomatik haftaici veya haftasonu tipi dondurur.
 */
export const getAutoGunTipi = (): "haftaici" | "haftasonu" => {
  const day = new Date().getDay(); // 0: Pazar, 6: Cumartesi
  return day === 0 || day === 6 ? "haftasonu" : "haftaici";
};

/**
 * Yeni gun (00:00) icin sifirlanmis yemek menusu olusturur.
 * Kahvalti, aksam yemegi ve kaloriler temizlenir.
 * Saat tarifeleri, gorunum modlari ve ayarlar korunur.
 */
export const getResetDailyMenu = (
  existing?: Partial<DailyMenuType> | null
): DailyMenuType => {
  const todayKey = getTodayDateKey();
  const autoTip = getAutoGunTipi();
  const saatler = existing?.saatler || defaultDailyMenu.saatler;
  const gunTipi = existing?.gunTipi === "ozelgun" ? "ozelgun" : autoTip;
  const activeSaatler = saatler[gunTipi] || saatler.haftaici;

  return {
    gorunumModu: existing?.gorunumModu || "birlikte",
    aktifOgun: existing?.aktifOgun || "kahvalti",
    kaloriGoster: existing?.kaloriGoster ?? true,
    gunTipi,
    saatler,
    kahvalti: "",
    kahvaltiSaat: activeSaatler.kahvalti,
    kahvaltiKalori: "",
    aksam: "",
    aksamSaat: activeSaatler.aksam,
    aksamKalori: "",
    tarih: todayKey,
  };
};

/**
 * 'YYYY-MM-DD' seklindeki tarihi Turkce formatta dondurur (Orn: 28 Ekim 2026).
 */
export const formatTurkishDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

