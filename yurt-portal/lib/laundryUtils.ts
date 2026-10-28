import { LaundrySlot } from "../types";
import { getTodayDateKey } from "./menuUtils";

/**
 * Saat bilgisini (örn: "18:28", "18.28" veya "18:28 - 19:58") başlangıç ve bitiş dakikalarına ayrıştırır.
 * Tek saat girilmişse varsayılan yıkama süresi 90 dakikadır.
 */
export function parseSlotMinutes(saatAraligi: string, defaultDurationMinutes: number = 90): {
  startMinutes: number;
  endMinutes: number;
  formattedRange: string;
} {
  if (!saatAraligi || !saatAraligi.trim()) {
    return { startMinutes: 0, endMinutes: defaultDurationMinutes, formattedRange: "09:00 - 10:30" };
  }

  const parts = saatAraligi.split("-");
  const startPart = parts[0].trim().replace(".", ":");
  const [startH, startM] = startPart.split(":").map((v) => parseInt(v, 10) || 0);
  const startMinutes = (startH % 24) * 60 + (startM % 60);

  let endMinutes = 0;
  let formattedRange = "";

  if (parts.length > 1 && parts[1].trim()) {
    const endPart = parts[1].trim().replace(".", ":");
    const [endH, endM] = endPart.split(":").map((v) => parseInt(v, 10) || 0);
    endMinutes = (endH % 24) * 60 + (endM % 60);
    // Eğer gece yarısını geçiyorsa
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    formattedRange = `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")} - ${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  } else {
    endMinutes = startMinutes + defaultDurationMinutes;
    const endTotal = endMinutes % (24 * 60);
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;
    formattedRange = `${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")} - ${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  }

  return { startMinutes, endMinutes, formattedRange };
}

/**
 * Bir çamaşırhane randevusunun şu anki saat ve tarihe göre dinamik durumunu hesaplar.
 * - İptal edilenler 'İptal' kalır.
 * - Geçmiş günler: 'Tamamlandı'
 * - Gelecek günler: 'Sırada'
 * - Bugün için:
 *    - Başlangıç saati henüz gelmediyse: 'Sırada'
 *    - Başlangıç saati geldi veya geçti ve bitiş saatinden önceyse: 'Yıkanıyor'
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
  const slotDate = slot.tarih;

  if (slotDate < todayStr) {
    return "Tamamlandı";
  }

  if (slotDate > todayStr) {
    return "Sırada";
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
