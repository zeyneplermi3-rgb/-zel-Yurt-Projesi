/**
 * Yurtify Google Analytics 4 (GA4) & Süper Admin Kullanıcı Hareketleri İzleme Modülü
 *
 * - Google Analytics 4 gtag.js entegrasyonu
 * - Süper Admin'e özel kullanıcı bazlı günlük giriş frekansı ve işlem günlüğü (audit trail)
 * - Gizlilik ve yetkilendirme: Bu istatistikler ve denetleyici YALNIZCA Süper Admin tarafından görüntülenebilir.
 */

export const GA_DEFAULT_MEASUREMENT_ID = "G-E8W3QY79B1";

export interface GAEventItem {
  id: string;
  eventName: string;
  params: Record<string, any>;
  timestamp: string;
}

export type ActionCategory =
  | "login"
  | "logout"
  | "meal_rating"
  | "laundry_booking"
  | "maintenance_ticket"
  | "maintenance_satisfaction"
  | "password_change"
  | "theme_toggle"
  | "page_view"
  | "failed_login";

export interface UserActivityLog {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // HH:mm:ss
  rawTime: number; // Date.now()
  userId: string;
  userName: string;
  userRole: "ogrenci" | "yonetici" | "superadmin";
  roomNo?: string;
  yurtName?: string;
  actionType: ActionCategory;
  actionTitle: string; // Örn: "Yemekhane Menüsünü Puanladı"
  actionDetail: string; // Örn: "5 Yıldız • 'Yemekler harikaydı'"
  gaEventName: string; // Örn: "meal_rating_submitted"
}

export interface UserDailySummary {
  userId: string;
  userName: string;
  userRole: "ogrenci" | "yonetici" | "superadmin";
  roomNo?: string;
  yurtName?: string;
  todayLoginCount: number;
  lastLoginTime: string;
  lastActionTime: string;
  totalActionsCount: number;
  status: "online" | "recent" | "offline";
  actions: UserActivityLog[];
}

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Aktif Google Analytics Ölçüm Kimliğini (Measurement ID) döndürür.
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
 * GA4 Ölçüm Kimliğini günceller.
 */
export function setGAMeasurementId(newId: string): void {
  const cleanId = newId.trim();
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("yurtify_ga_measurement_id", cleanId);
      if (typeof window.gtag === "function" && cleanId.startsWith("G-")) {
        window.gtag("config", cleanId, {
          debug_mode: true,
          send_page_view: true,
        });
      }
      trackGAEvent("ga_measurement_id_updated", { new_measurement_id: cleanId });
    } catch (e) {
      console.warn("GA kimliği kaydedilemedi:", e);
    }
  }
}

/**
 * Kayıtlı ham GA olay geçmişini döndürür.
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
 * Google Analytics 4 Olay Gönderici
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

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, enhancedParams);
    } else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(["event", eventName, enhancedParams]);
    }
  } catch (err) {
    console.warn("GA Event Dispatch Error:", err);
  }

  try {
    console.log(
      `%c[GA4 Canlı Olay] %c${eventName}`,
      "background: #0284C7; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;",
      "color: #0284C7; font-weight: bold; font-size: 11px;",
      enhancedParams
    );
  } catch { }

  try {
    const history = getGAEventHistory();
    const newEntry: GAEventItem = {
      id: "evt-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      eventName,
      params: enhancedParams,
      timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };

    const updated = [newEntry, ...history].slice(0, 50);
    localStorage.setItem("yurtify_ga_event_log", JSON.stringify(updated));

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

// =========================================================================
// =========================================================================
// SÜPER ADMİN: KULLANICI HAREKETLERİ & GÜNLÜK GİRİŞ TAKİP SİSTEMİ
// =========================================================================
// =========================================================================

function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Varsayılan / başlangıç kullanıcı aktivite geçmişi üretici
 */
function getDefaultInitialActivities(): UserActivityLog[] {
  const today = getTodayKey();
  return [
    {
      id: "act-1",
      date: today,
      timestamp: "12:50:14",
      rawTime: Date.now() - 600000,
      userId: "std-1793349124719",
      userName: "Eda Etem",
      userRole: "ogrenci",
      roomNo: "302",
      yurtName: "Karahan Yükseköğrenim Kız Öğrenci Yurdu",
      actionType: "meal_rating",
      actionTitle: "Yemekhane Menüsünü Puanladı",
      actionDetail: "Puan: 5 Yıldız ★★★★★ • Yorum: 'Bugünkü akşam menüsü ve çorba harikaydı, ellerinize sağlık.'",
      gaEventName: "meal_rating_submitted",
    },
    {
      id: "act-2",
      date: today,
      timestamp: "12:48:30",
      rawTime: Date.now() - 720000,
      userId: "std-1793349124719",
      userName: "Eda Etem",
      userRole: "ogrenci",
      roomNo: "302",
      yurtName: "Karahan Yükseköğrenim Kız Öğrenci Yurdu",
      actionType: "login",
      actionTitle: "Öğrenci Portalı Girişi",
      actionDetail: "Giriş Başarılı (Bugün 3. giriş)",
      gaEventName: "login_success",
    },
    {
      id: "act-3",
      date: today,
      timestamp: "12:25:10",
      rawTime: Date.now() - 2100000,
      userId: "std-1793349124719",
      userName: "Eda Etem",
      userRole: "ogrenci",
      roomNo: "302",
      yurtName: "Karahan Yükseköğrenim Kız Öğrenci Yurdu",
      actionType: "laundry_booking",
      actionTitle: "Çamaşır Randevusu Aldı",
      actionDetail: "Makine: Makine 2 (Yıkama) • Saat: 18:00 - 19:30",
      gaEventName: "laundry_reservation_created",
    },
    {
      id: "act-4",
      date: today,
      timestamp: "11:50:00",
      rawTime: Date.now() - 4200000,
      userId: "std-6",
      userName: "Anna Demkıv",
      userRole: "ogrenci",
      roomNo: "302",
      yurtName: "Karahan Yükseköğrenim Kız Öğrenci Yurdu",
      actionType: "maintenance_ticket",
      actionTitle: "Teknik Arıza Talebi Oluşturdu",
      actionDetail: "Başlık: 'Banyo tavanında su damlatması' • Kategori: Sıhhi Tesisat • Öncelik: Yüksek",
      gaEventName: "maintenance_ticket_created",
    },
    {
      id: "act-5",
      date: today,
      timestamp: "11:45:22",
      rawTime: Date.now() - 4500000,
      userId: "std-6",
      userName: "Anna Demkıv",
      userRole: "ogrenci",
      roomNo: "302",
      yurtName: "Karahan Yükseköğrenim Kız Öğrenci Yurdu",
      actionType: "login",
      actionTitle: "Öğrenci Portalı Girişi",
      actionDetail: "Giriş Başarılı (Bugün 2. giriş)",
      gaEventName: "login_success",
    },
    {
      id: "act-6",
      date: today,
      timestamp: "10:30:15",
      rawTime: Date.now() - 8900000,
      userId: "mudur",
      userName: "Aybuke Karahan",
      userRole: "yonetici",
      yurtName: "Karahan Yükseköğrenim Kız Öğrenci Yurdu",
      actionType: "login",
      actionTitle: "Yönetici Paneli Girişi",
      actionDetail: "Giriş Başarılı (Bugün 1. giriş)",
      gaEventName: "login_success",
    },
    {
      id: "act-7",
      date: today,
      timestamp: "10:15:00",
      rawTime: Date.now() - 9800000,
      userId: "std-1793351680146",
      userName: "Aleyna Seda Ersoy",
      userRole: "ogrenci",
      roomNo: "201",
      yurtName: "Karahan Yükseköğrenim Kız Öğrenci Yurdu",
      actionType: "login",
      actionTitle: "Öğrenci Portalı Girişi",
      actionDetail: "İlk Kez Giriş Yaptı (Geçici Şifre)",
      gaEventName: "login_success",
    },
  ];
}

/**
 * Kullanıcı tarafından yapılan herhangi bir işlemi kaydeder.
 */
export function recordUserActivity(
  activity: Omit<UserActivityLog, "id" | "timestamp" | "date" | "rawTime">
): void {
  if (typeof window === "undefined") return;

  const today = getTodayKey();
  const timeStr = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const rawTime = Date.now();

  const newLog: UserActivityLog = {
    ...activity,
    id: "act-" + rawTime + "-" + Math.random().toString(36).substring(2, 6),
    date: today,
    timestamp: timeStr,
    rawTime,
  };

  try {
    // 1. Tüm kullanıcı hareketlerini kaydet
    const existing = getUserActivityLogs();
    const updated = [newLog, ...existing].slice(0, 300); // Son 300 işlemi tut
    localStorage.setItem("yurtify_user_activity_logs", JSON.stringify(updated));

    // 2. Eğer giriş işlemi ise bugünkü giriş sayacını artır
    if (activity.actionType === "login") {
      const countsRaw = localStorage.getItem("yurtify_daily_login_counts");
      const counts = countsRaw ? JSON.parse(countsRaw) : {};
      counts[today] = counts[today] || {};

      const curCount = counts[today][activity.userId]?.count || 0;
      counts[today][activity.userId] = {
        userId: activity.userId,
        userName: activity.userName,
        userRole: activity.userRole,
        roomNo: activity.roomNo,
        yurtName: activity.yurtName,
        count: curCount + 1,
        lastLogin: timeStr,
      };
      localStorage.setItem("yurtify_daily_login_counts", JSON.stringify(counts));
    }

    // 3. GA4 Olayını da eşzamanlı olarak tetikle
    trackGAEvent(activity.gaEventName, {
      user_id: activity.userId,
      user_name: activity.userName,
      user_role: activity.userRole,
      action_title: activity.actionTitle,
      action_detail: activity.actionDetail,
      room_no: activity.roomNo,
    });

    // 4. UI Canlı Dinleyicilerini uyar
    window.dispatchEvent(
      new CustomEvent("yurtify_activity_logged", {
        detail: newLog,
      })
    );
  } catch (err) {
    console.warn("Kullanıcı hareketi kaydedilemedi:", err);
  }
}

/**
 * Kayıtlı kullanıcı işlem günlüğünü döndürür.
 */
export function getUserActivityLogs(filterDate?: string, filterUser?: string): UserActivityLog[] {
  if (typeof window === "undefined") return getDefaultInitialActivities();

  let list: UserActivityLog[] = [];
  try {
    const raw = localStorage.getItem("yurtify_user_activity_logs");
    if (raw) {
      list = JSON.parse(raw);
    } else {
      list = getDefaultInitialActivities();
      localStorage.setItem("yurtify_user_activity_logs", JSON.stringify(list));
    }
  } catch {
    list = getDefaultInitialActivities();
  }

  const today = filterDate || getTodayKey();
  return list.filter((act) => {
    const dateMatch = act.date === today;
    const userMatch = !filterUser || filterUser === "all" || act.userName.toLowerCase() === filterUser.toLowerCase();
    return dateMatch && userMatch;
  });
}

/**
 * Süper Admin için: Kimin günde kaç kez girdiğini ve son durumunu özetler.
 */
export function getUserDailySummaries(targetDate?: string): UserDailySummary[] {
  const dateKey = targetDate || getTodayKey();
  const allActivities = getUserActivityLogs(dateKey);

  // LocalStorage'daki giriş sayacını oku
  let loginCounts: Record<string, any> = {};
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("yurtify_daily_login_counts");
      if (raw) {
        const parsed = JSON.parse(raw);
        loginCounts = parsed[dateKey] || {};
      }
    } catch { }
  }

  // Kullanıcı bazında aktiviteleri grupla
  const userMap: Record<string, UserDailySummary> = {};

  // Bilinen varsayılan kullanıcıları ekle (en az 4 kullanıcı her zaman görünür)
  const defaultKnown = [
    { id: "std-1793349124719", name: "Eda Etem", role: "ogrenci" as const, room: "302", defaultLogins: 3 },
    { id: "std-6", name: "Anna Demkıv", role: "ogrenci" as const, room: "302", defaultLogins: 2 },
    { id: "mudur", name: "Aybuke Karahan", role: "yonetici" as const, room: "İdari", defaultLogins: 1 },
    { id: "std-1793351680146", name: "Aleyna Seda Ersoy", role: "ogrenci" as const, room: "201", defaultLogins: 1 },
  ];

  for (const k of defaultKnown) {
    const stored = loginCounts[k.id];
    userMap[k.name] = {
      userId: k.id,
      userName: k.name,
      userRole: k.role,
      roomNo: k.room,
      yurtName: "Karahan Yükseköğrenim Kız Öğrenci Yurdu",
      todayLoginCount: stored?.count || k.defaultLogins,
      lastLoginTime: stored?.lastLogin || (k.name === "Eda Etem" ? "12:48:30" : k.name === "Anna Demkıv" ? "11:45:22" : "10:30:15"),
      totalActionsCount: 0,
      status: k.name === "Eda Etem" ? "online" : k.name === "Anna Demkıv" ? "recent" : "offline",
      actions: [],
    };
  }

  // Aktiviteleri kullanıcılara ata
  for (const act of allActivities) {
    if (!userMap[act.userName]) {
      const stored = loginCounts[act.userId];
      userMap[act.userName] = {
        userId: act.userId,
        userName: act.userName,
        userRole: act.userRole,
        roomNo: act.roomNo,
        yurtName: act.yurtName,
        todayLoginCount: stored?.count || 1,
        lastLoginTime: stored?.lastLogin || act.timestamp,
        totalActionsCount: 0,
        status: "recent",
        actions: [],
      };
    }
    userMap[act.userName].actions.push(act);
    userMap[act.userName].totalActionsCount += 1;
  }

  return Object.values(userMap).sort((a, b) => b.todayLoginCount - a.todayLoginCount);
}
