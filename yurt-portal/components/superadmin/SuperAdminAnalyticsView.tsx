"use client";

import React, { useState, useEffect } from "react";
import {
  getUserActivityLogs,
  getUserDailySummaries,
  getGAMeasurementId,
  setGAMeasurementId,
  trackGAEvent,
  UserActivityLog,
  UserDailySummary,
  ActionCategory,
} from "../../lib/analytics";

interface SuperAdminAnalyticsViewProps {
  onBackToDorms?: () => void;
}

export default function SuperAdminAnalyticsView({ onBackToDorms }: SuperAdminAnalyticsViewProps) {
  const [summaries, setSummaries] = useState<UserDailySummary[]>([]);
  const [activities, setActivities] = useState<UserActivityLog[]>([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all");
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>("all");
  const [measurementId, setMeasurementId] = useState("");
  const [customIdInput, setCustomIdInput] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = () => {
    const sum = getUserDailySummaries();
    const act = getUserActivityLogs();
    setSummaries(sum);
    setActivities(act);
    const mid = getGAMeasurementId();
    setMeasurementId(mid);
    setCustomIdInput(mid);
  };

  useEffect(() => {
    loadData();

    const handleLogged = () => {
      loadData();
    };

    window.addEventListener("yurtify_activity_logged", handleLogged);
    window.addEventListener("yurtify_ga_event", handleLogged);

    return () => {
      window.removeEventListener("yurtify_activity_logged", handleLogged);
      window.removeEventListener("yurtify_ga_event", handleLogged);
    };
  }, []);

  const handleSendTestEvent = () => {
    trackGAEvent("superadmin_test_ping", {
      sender: "Süper Admin",
      timestamp: new Date().toISOString(),
      note: "Süper Admin canlı test sinyali gönderdi.",
    });
    setNotification("✅ Test sinyali Google Analytics'e başarıyla iletildi!");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customIdInput.trim() || !customIdInput.trim().toUpperCase().startsWith("G-")) {
      alert("Lütfen geçerli bir GA4 Ölçüm Kimliği giriniz! (Örn: G-XXXXXXXXXX)");
      return;
    }
    const clean = customIdInput.trim().toUpperCase();
    setGAMeasurementId(clean);
    setMeasurementId(clean);
    setNotification(`✅ GA4 Ölçüm Kimliği "${clean}" olarak güncellendi.`);
    setTimeout(() => setNotification(null), 3500);
  };

  // Filtrelenmiş aktiviteler
  const filteredActivities = activities.filter((act) => {
    const userMatch =
      selectedUserFilter === "all" || act.userName.toLowerCase() === selectedUserFilter.toLowerCase();
    const actionMatch =
      selectedActionFilter === "all" || act.actionType === selectedActionFilter;
    return userMatch && actionMatch;
  });

  const totalLoginsToday = summaries.reduce((acc, curr) => acc + curr.todayLoginCount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Üst Başlık & Eylem Çubuğu */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white tracking-tight">
              Kullanıcı Hareketleri & GA4 Canlı Analitik
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              🔒 Yalnızca Süper Admin
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
            Kullanıcıların günde kaç kez giriş yaptığı ve sistemde gerçekleştirdiği tüm işlemler canlı olarak izlenmektedir.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {onBackToDorms && (
            <button
              onClick={onBackToDorms}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              ← Yurtlar Listesine Dön
            </button>
          )}
          <button
            onClick={handleSendTestEvent}
            className="flex-1 sm:flex-none px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>⚡</span>
            <span>GA4 Test Gönder</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-2xl flex items-center justify-between animate-fade-in">
          <span>{notification}</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Canlı Güncellendi</span>
        </div>
      )}

      {/* İstatistik Metrik Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#1E293B] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] border-t-4 border-t-[#0284C7] shadow-xs">
          <div className="text-[11px] sm:text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
            Bugün Giriş Yapanlar
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white mt-1">
            {summaries.length} Kişi
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Aktif oturumlar izleniyor
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] border-t-4 border-t-emerald-500 shadow-xs">
          <div className="text-[11px] sm:text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
            Toplam Günlük Giriş
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {totalLoginsToday} Kez
          </div>
          <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-1">
            Bugün kaydedilen oturum sayısı
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] border-t-4 border-t-purple-500 shadow-xs">
          <div className="text-[11px] sm:text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
            Gerçekleşen İşlemler
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {activities.length} İşlem
          </div>
          <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-1">
            Yemek, Çamaşır, Arıza, vb.
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] border-t-4 border-t-amber-500 shadow-xs">
          <div className="text-[11px] sm:text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
            GA4 Veri Akışı
          </div>
          <div className="text-base sm:text-lg font-mono font-black text-[#0F172A] dark:text-white mt-1 truncate">
            {measurementId}
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            DebugView Canlı Akış Açık
          </div>
        </div>
      </div>

      {/* BÖLÜM 1: KİMİN GÜNDE KAÇ KEZ GİRDİĞİ (GÜNLÜK GİRİŞ SAYACI) */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl border border-[#E2E8F0] dark:border-[#334155] p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#0F172A] dark:text-white flex items-center gap-2">
              <span>👥</span>
              <span>Kullanıcı Bazında Günlük Giriş Sayacı</span>
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Her kullanıcının bugün kaç defa portala giriş yaptığı ve gerçekleştirdiği toplam işlem sayısı.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-sky-50 dark:bg-sky-950/60 text-[#0284C7] rounded-xl border border-sky-100 dark:border-sky-900">
            Bugün: {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>

        {/* Tablo Görünümü */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead>
              <tr className="border-b border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] font-bold uppercase text-[10px]">
                <th className="py-3 px-3">Kullanıcı</th>
                <th className="py-3 px-3">Rol / Yetki</th>
                <th className="py-3 px-3">Oda / Birim</th>
                <th className="py-3 px-3 text-center">Bugün Giriş Sayısı</th>
                <th className="py-3 px-3">Son Giriş Zamanı</th>
                <th className="py-3 px-3 text-center">Toplam İşlem</th>
                <th className="py-3 px-3 text-right">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#334155]">
              {summaries.map((u) => (
                <tr
                  key={u.userId}
                  className="hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0284C7] to-sky-400 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                        {u.userName.substring(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold text-[#0F172A] dark:text-white">
                          {u.userName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {u.userId}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.userRole === "ogrenci"
                          ? "bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300"
                          : u.userRole === "yonetici"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                      }`}
                    >
                      {u.userRole === "ogrenci"
                        ? "Öğrenci"
                        : u.userRole === "yonetici"
                        ? "Yurt Müdürü"
                        : "Süper Admin"}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-300">
                    {u.roomNo ? `Oda ${u.roomNo}` : "İdari Yönetim"}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full font-black text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {u.todayLoginCount} Kez Giriş Yaptı
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                    {u.lastLoginTime}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedUserFilter(u.userName)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#0284C7] hover:text-white font-bold text-[11px] transition-colors cursor-pointer"
                      title="Bu kullanıcının işlemlerini filtrele"
                    >
                      <span>{u.totalActionsCount} İşlem</span>
                      <span className="text-[10px]">🔍</span>
                    </button>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.status === "online"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : u.status === "recent"
                          ? "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.status === "online"
                            ? "bg-emerald-500 animate-pulse"
                            : u.status === "recent"
                            ? "bg-sky-500"
                            : "bg-slate-400"
                        }`}
                      ></span>
                      {u.status === "online"
                        ? "Çevrimiçi"
                        : u.status === "recent"
                        ? "Yakın Zamanda"
                        : "Çevrimdışı"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BÖLÜM 2: KİMİN NE İŞLEM YAPTIĞI (AYRINTILI AUDIT TRAIL / İŞLEM GÜNLÜĞÜ) */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl border border-[#E2E8F0] dark:border-[#334155] p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#0F172A] dark:text-white flex items-center gap-2">
              <span>📋</span>
              <span>Kullanıcı İşlemleri ve Hareket Kayıtları (Audit Trail)</span>
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Öğrencilerin ve personelin portal içinde gerçekleştirdiği işlemlerin zaman damgalı ayrıntılı günlüğü.
            </p>
          </div>

          {/* Filtreleme Çubuğu */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#0284C7] cursor-pointer"
            >
              <option value="all">Tüm Kullanıcılar</option>
              {summaries.map((s) => (
                <option key={s.userId} value={s.userName}>
                  {s.userName}
                </option>
              ))}
            </select>

            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#0284C7] cursor-pointer"
            >
              <option value="all">Tüm İşlemler</option>
              <option value="login">Girişler (Login)</option>
              <option value="meal_rating">Yemek Puanlama & Yorum</option>
              <option value="laundry_booking">Çamaşır Randevusu</option>
              <option value="maintenance_ticket">Arıza Bildirimi</option>
              <option value="maintenance_satisfaction">Arıza Memnuniyeti</option>
              <option value="theme_toggle">Tema Değişimi</option>
            </select>

            {(selectedUserFilter !== "all" || selectedActionFilter !== "all") && (
              <button
                onClick={() => {
                  setSelectedUserFilter("all");
                  setSelectedActionFilter("all");
                }}
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Sıfırla
              </button>
            )}
          </div>
        </div>

        {/* Canlı İşlem Listesi */}
        <div className="space-y-2.5">
          {filteredActivities.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-[#F8FAFC] dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <p className="font-bold text-xs text-slate-700 dark:text-slate-200">
                Seçilen filtrelere uygun işlem kaydı bulunamadı.
              </p>
            </div>
          ) : (
            filteredActivities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-800/80 hover:border-[#0284C7]/50 transition-all space-y-2"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0F172A] dark:text-white text-xs">
                      {act.userName}
                    </span>
                    {act.roomNo && (
                      <span className="text-[10.5px] text-[#64748B] dark:text-[#94A3B8]">
                        (Oda {act.roomNo})
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                        act.actionType === "login"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                          : act.actionType === "meal_rating"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                          : act.actionType === "laundry_booking"
                          ? "bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300"
                          : act.actionType === "maintenance_ticket"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300"
                      }`}
                    >
                      {act.actionTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10.5px] font-mono text-slate-400">
                    <span>{act.date}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{act.timestamp}</span>
                  </div>
                </div>

                <div className="text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  {act.actionDetail}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono">
                    GA4 Olay Karşılığı: <code className="text-[#0284C7] font-semibold">{act.gaEventName}</code>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    gtag() doğrulandı
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* BÖLÜM 3: GOOGLE ANALYTICS 4 HESAP AYARLARI */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl border border-[#E2E8F0] dark:border-[#334155] p-4 sm:p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#0F172A] dark:text-white flex items-center gap-2">
            <span>⚙️</span>
            <span>Google Analytics 4 Ölçüm Kimliği ve Canlı Entegrasyon</span>
          </h3>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            Kendi Google Analytics mülkünüzün <strong>G-XXXXXXXXXX</strong> kodunu bağlayarak tüm verileri Google konsolunuzdan canlı olarak da takip edebilirsiniz.
          </p>
        </div>

        <form onSubmit={handleUpdateId} className="flex flex-col sm:flex-row gap-3 items-center">
          <input
            type="text"
            value={customIdInput}
            onChange={(e) => setCustomIdInput(e.target.value)}
            placeholder="G-E8W3QY79B1"
            className="flex-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-900 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0284C7]"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Ölçüm Kimliğini Güncelle
          </button>
          <a
            href="https://analytics.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all text-center cursor-pointer"
          >
            Google Analytics Konsolunu Aç ↗
          </a>
        </form>
      </div>
    </div>
  );
}
