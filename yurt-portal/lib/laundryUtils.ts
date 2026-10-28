import { LaundrySlot } from "../types";
import { getTodayDateKey } from "./menuUtils";

/**
 * Tarih dizesini (örn: "28.10.2026" veya "2026-10-28") standart 'YYYY-MM-DD' formatına dönüştürür.
 */
export function normalizeDateStr(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) return getTodayDateKey();
  const clean = dateStr.trim();
  if (clean.includes(".")) {
    const parts = clean.split(".");
    if (parts.length === 3) {
      const d = parts[0].padStart(2, "0");
      const m = parts[1].padStart(2, "0");
      const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${y}-${m}-${d}`;
    }
  }
  return clean;
}

/**
 * Saat bilgisini (örn: "18:28", "18.28", "18:28 - 19:58") başlangıç ve bitiş dakikalarına ayrıştırır.
 * Tek saat girilmişse varsayılan yıkama süresi 90 dakikadır.
 */
export function parseSlotMinutes(saatAraligi?: string, defaultDurationMinutes: number = 90): {
  startMinutes: number;
  endMinutes: number;
  formattedRange: string;
} {
  if (!saatAraligi || !saatAraligi.trim()) {
    return { startMinutes: 0, endMinutes: defaultDurationMinutes, formattedRange: "09:00 - 10:30" };
  }

  // "18:28", "18.28", "18:28 - 19:58" gibi tüm formatları yakala
  const matches = [...saatAraligi.matchAll(/(\d{1,2})[:.](\d{2})/g)];
  if (matches.length === 0) {
    return { startMinutes: 0, endMinutes: defaultDurationMinutes, formattedRange: saatAraligi };
  }

  const startH = parseInt(matches[0][1], 10);
  const startM = parseInt(matches[0][2], 10);
  const startMinutes = (startH % 24) * 60 + (startM % 60);

  let endMinutes = 0;
  let endH = 0;
  let endM = 0;

  if (matches.length >= 2) {
    endH = parseInt(matches[1][1], 10);
    endM = parseInt(matches[1][2], 10);
    endMinutes = (endH % 24) * 60 + (endM % 60);
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
  } else {
    endMinutes = startMinutes + defaultDurationMinutes;
    const endTotal = endMinutes % (24 * 60);
    endH = Math.floor(endTotal / 60);
    endM = endTotal % 60;
  }

  const formattedRange = `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")} - ${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  return { startMinutes, endMinutes, formattedRange };
}

/**
 * Bir çamaşırhane randevusunun şu anki saat ve tarihe göre dinamik durumunu hesaplar.
 * - İptal edilenler 'İptal' kalır.
 * - Geçmiş günler: 'Tamamlandı'
 * - Gelecek günler: 'Sırada'
 * - Bugün için:
 *    - Başlangıç saati henüz gelmediyse: 'Sırada'
 *    - Başlangıç saati geldi/geçti ve henüz bitmediyse: 'Yıkanıyor'
 *    - Bitiş saati geçtiyse: 'Tamamlandı'
 */
export function getDynamicSlotStatus(
  slot: Pick<LaundrySlot, "tarih" | "saatAraligi" | "durum">,
  now: Date = new Date()
): "Sırada" | "Yıkanıyor" | "Tamamlandı" | "İptal" {
  if (slot.durum === "İptal") {
    return "İptal";
  }

  const todayStr = getTodayDateKey(now);
  const slotDate = normalizeDateStr(slot.tarih);

  // Eski statik şablon tarihi kontrolü (2026-10-19 vb. ise bugün olarak ele al)
  const isToday = slotDate === todayStr || slotDate === "2026-10-19";

  if (!isToday) {
    if (slotDate < todayStr) {
      return "Tamamlandı";
    }
    if (slotDate > todayStr) {
      return "Sırada";
    }
  }

  // Bugün ise saat kontrolü yapılır
  const { startMinutes, endMinutes } = parseSlotMinutes(slot.saatAraligi);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (currentMinutes < startMinutes) {
    return "Sırada";
  }

  if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
    return "Yıkanıyor";
  }

  return "Tamamlandı";
}

/**
 * Tüm randevu listesini geçerli saate göre senkronize eder.
 */
export function syncSlotsWithCurrentTime(
  slots: LaundrySlot[],
  now: Date = new Date()
): { updatedSlots: LaundrySlot[]; hasChanges: boolean } {
  let hasChanges = false;

  const updatedSlots = slots.map((slot) => {
    if (slot.durum === "İptal") return slot;

    const dynamicStatus = getDynamicSlotStatus(slot, now);
    if (dynamicStatus !== slot.durum) {
      hasChanges = true;
      return { ...slot, durum: dynamicStatus };
    }
    return slot;
  });

  return { updatedSlots, hasChanges };
}
