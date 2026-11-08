/**
 * Yurtify Google Analytics 4 (GA4) Canlı Entegrasyon Modülü
 *
 * - Google Analytics gtag.js altyapısı ile çalışır.
 * - Gerçek zamanlı olay takibi (login, page_view, yemek puanlama, çamaşırhane rezervasyonu, arıza bildirimi vb.)
 * - DebugView / Console canlı kayıtları ve uygulama içi Canlı Denetleyici (Debugger) desteği sağlar.
 */

export const GA_DEFAULT_MEASUREMENT_ID = "G-E8W3QY79B1";

export interface GAEventItem {
  id: string;
  eventName: string;
  params: Record<string, any>;
  timestamp: string;
}

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Aktif Google Analytics Ölçüm Kimliğini (Measurement ID) döndürür.
 * Öncelik sırası: LocalStorage (kullanıcı/yönetici özelleştirmesi) -> Ortam değişkeni -> Varsayılan ID
 */
export function getGAMeasurementId(): string {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("yurtify_ga_measurement_id");
      if (stored && stored.trim().startsWith("G-")) {
        return stored.trim();
      }
    } catch { }
  }
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || GA_DEFAULT_MEASUREMENT_ID;
}

/**
 * Kullanıcının veya yöneticinin kendi GA4 Ölçüm Kimliğini girmesine olanak tanır.
 */
export function setGAMeasurementId(newId: string): void {
  const cleanId = newId.trim();
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("yurtify_ga_measurement_id", cleanId);
      // Gtag yapılandırmasını yeni kimlikle güncelle
      if (typeof window.gtag === "function" && cleanId.startsWith("G-")) {
        window.gtag("config", cleanId, {
          debug_mode: true,
          send_page_view: true,
        });
      }
      // Olay geçmişine kimlik değişikliği olayı ekle
      trackGAEvent("ga_measurement_id_updated", { new_measurement_id: cleanId });
    } catch (e) {
      console.warn("GA kimliği kaydedilemedi:", e);
    }
  }
}

/**
 * Kayıtlı olay geçmişini döndürür.
 */
export function getGAEventHistory(): GAEventItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("yurtify_ga_event_log");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { }
  return [];
}

/**
 * Olay geçmişini temizler.
 */
export function clearGAEventHistory(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("yurtify_ga_event_log");
      window.dispatchEvent(new CustomEvent("yurtify_ga_cleared"));
    } catch { }
  }
}

/**
 * Google Analytics 4 Özel Olay (Event) Gönderici
 *
 * @param eventName Olay adı (örn. 'login_success', 'laundry_reserved', 'meal_reviewed')
 * @param params Olay ile birlikte gönderilecek parametreler
 */
export function trackGAEvent(eventName: string, params: Record<string, any> = {}): void {
  if (typeof window === "undefined") return;

  const currentId = getGAMeasurementId();
  const enhancedParams = {
    ...params,
    app_name: "Yurtify",
    environment: process.env.NODE_ENV || "development",
    send_to: currentId,
    timestamp: new Date().toISOString(),
  };

  // 1. Google Analytics gtag fonksiyonunu tetikle
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, enhancedParams);
    } else {
      // gtag henüz yüklenmemişse dataLayer'a push et
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(["event", eventName, enhancedParams]);
    }
  } catch (err) {
    console.warn("GA Event Dispatch Error:", err);
  }

  // 2. Tarayıcı Konsolunda Renkli Doğrulama Logu Bas (Gözlemci & Denetçi için)
  try {
    console.log(
      `%c[GA4 Canlı Olay Gönderildi] %c${eventName}`,
      "background: #0284C7; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;",
      "color: #0284C7; font-weight: bold; font-size: 11px;",
      enhancedParams
    );
  } catch { }

  // 3. Uygulama İçi Canlı İzleyici (In-App Live Debugger) için geçmişe kaydet ve event fırlat
  try {
    const history = getGAEventHistory();
    const newEntry: GAEventItem = {
      id: "evt-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      eventName,
      params: enhancedParams,
      timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };

    const updated = [newEntry, ...history].slice(0, 50); // Son 50 olayı tut
    localStorage.setItem("yurtify_ga_event_log", JSON.stringify(updated));

    // Canlı UI dinleyicilerini tetikle
    window.dispatchEvent(
      new CustomEvent("yurtify_ga_event", {
        detail: newEntry,
      })
    );
  } catch { }
}

/**
 * Sayfa Görüntüleme (Page View) Takibi
 */
export function trackGAPageView(pagePath: string, pageTitle?: string): void {
  if (typeof window === "undefined") return;

  const currentId = getGAMeasurementId();
  const title = pageTitle || (typeof document !== "undefined" ? document.title : "Yurtify");

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_path: pagePath,
        page_location: window.location.href,
        page_title: title,
        send_to: currentId,
      });
    }
  } catch (err) {
    console.warn("GA PageView Dispatch Error:", err);
  }

  trackGAEvent("page_view", {
    page_path: pagePath,
    page_title: title,
    page_url: window.location.href,
  });
}
