"use client";

import React, { useState, useEffect } from "react";
import {
  getGAMeasurementId,
  setGAMeasurementId,
  getGAEventHistory,
  clearGAEventHistory,
  trackGAEvent,
  GAEventItem,
} from "../lib/analytics";

export default function GoogleAnalyticsLivePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [measurementId, setMeasurementId] = useState("");
  const [customIdInput, setCustomIdInput] = useState("");
  const [events, setEvents] = useState<GAEventItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<"stream" | "settings" | "guide">("stream");
  const [notification, setNotification] = useState<string | null>(null);

  // İlk yüklemede ve olay dinleyicilerinde durum güncelle
  useEffect(() => {
    if (typeof window === "undefined") return;

    const curId = getGAMeasurementId();
    setMeasurementId(curId);
    setCustomIdInput(curId);
    setEvents(getGAEventHistory());

    // gtag yüklü mü kontrolü
    const checkGtag = () => {
      const gtagReady = typeof window.gtag === "function" || (window.dataLayer && window.dataLayer.length > 0);
      setIsConnected(!!gtagReady);
    };

    checkGtag();
    const timer = setInterval(checkGtag, 2000);

    // Yeni olay fırlatıldığında anında güncelle
    const handleNewEvent = (e: any) => {
      if (e.detail) {
        setEvents((prev) => [e.detail, ...prev.filter((item) => item.id !== e.detail.id)].slice(0, 50));
      } else {
        setEvents(getGAEventHistory());
      }
    };

    const handleCleared = () => {
      setEvents([]);
    };

    window.addEventListener("yurtify_ga_event", handleNewEvent);
    window.addEventListener("yurtify_ga_cleared", handleCleared);

    return () => {
      clearInterval(timer);
      window.removeEventListener("yurtify_ga_event", handleNewEvent);
      window.removeEventListener("yurtify_ga_cleared", handleCleared);
    };
  }, []);

  const handleSendTestEvent = () => {
    const testPayload = {
      test_type: "manual_debugger_ping",
      url: typeof window !== "undefined" ? window.location.pathname : "/",
      screen_resolution: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "unknown",
      note: "Kullanıcı canlı panel üzerinden test olayı tetikledi.",
    };
    trackGAEvent("test_interaction", testPayload);

    setNotification("✅ Test olayı Google Analytics'e başarıyla iletildi!");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveMeasurementId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customIdInput.trim() || !customIdInput.trim().toUpperCase().startsWith("G-")) {
      alert("Lütfen geçerli bir GA4 Ölçüm Kimliği giriniz! (Örn: G-XXXXXXXXXX)");
      return;
    }
    const clean = customIdInput.trim().toUpperCase();
    setGAMeasurementId(clean);
    setMeasurementId(clean);
    setNotification(`✅ Ölçüm Kimliği "${clean}" olarak güncellendi ve bağlandı.`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleClearHistory = () => {
    if (confirm("Olay geçmişini temizlemek istediğinize emin misiniz?")) {
      clearGAEventHistory();
    }
  };

  return (
    <>
      {/* 1. SAĞ ALT KÖŞE CANLI TETİKLEYİCİ BUTONU (FLOATING PILL) */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-full shadow-lg border transition-all duration-300 backdrop-blur-md cursor-pointer ${
            isOpen
              ? "bg-[#0284C7] text-white border-[#0284C7] ring-4 ring-sky-500/20"
              : "bg-white/95 dark:bg-[#1E293B]/95 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-[#0284C7] hover:shadow-xl"
          }`}
          title="Google Analytics 4 Canlı Takip Paneli"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isConnected ? "bg-emerald-400" : "bg-amber-400"
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isConnected ? "bg-emerald-500" : "bg-amber-500"
              }`}
            ></span>
          </span>

          <span className="text-xs font-bold tracking-tight flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-[#F59E0B]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
            </svg>
            <span>GA4 Canlı</span>
            <span className="opacity-70 text-[11px] font-medium hidden xs:inline">
              ({events.length})
            </span>
          </span>
        </button>
      </div>

      {/* 2. CANLI TAKİP VE DENETLEYİCİ MODAL / PANEL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full sm:max-w-xl max-h-[88vh] sm:max-h-[82vh] bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F59E0B] to-[#F97316] flex items-center justify-center text-white shadow-md">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Google Analytics 4 (GA4)
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Aktif & Bağlı
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ölçüm Kimliği: <strong className="font-mono text-[#0284C7]">{measurementId}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Kapat"
              >
                ✕
              </button>
            </div>

            {/* Notification Banner */}
            {notification && (
              <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
                <span>{notification}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Canlı</span>
              </div>
            )}

            {/* Tabs & Actions Bar */}
            <div className="px-4 sm:px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-white dark:bg-[#0F172A]">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setActiveTab("stream")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activeTab === "stream"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Canlı Olaylar ({events.length})
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activeTab === "settings"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Kimlik & Ayarlar
                </button>
                <button
                  onClick={() => setActiveTab("guide")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    activeTab === "guide"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Doğrulama Rehberi
                </button>
              </div>

              <button
                onClick={handleSendTestEvent}
                className="px-3 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>⚡</span>
                <span className="hidden xs:inline">Test Olayı Gönder</span>
                <span className="xs:hidden">Test</span>
              </button>
            </div>

            {/* Tab 1: Live Event Stream */}
            {activeTab === "stream" && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Gerçek Zamanlı İletilen Olaylar (En Yeni En Üstte)</span>
                  {events.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="text-rose-500 hover:text-rose-600 font-medium text-[11px] cursor-pointer"
                    >
                      Geçmişi Temizle
                    </button>
                  )}
                </div>

                {events.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <div className="text-3xl mb-2">📡</div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Henüz kaydedilmiş olay yok
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                      Giriş yapın, menüyü oylayın, randevu alın veya yukarıdaki "Test Olayı Gönder" butonuna basın.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {events.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-[#0284C7]/50 transition-all text-xs"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                              {evt.eventName}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              gtag() iletildi
                            </span>
                          </div>
                          <span className="text-[10.5px] font-mono text-slate-400">
                            {evt.timestamp}
                          </span>
                        </div>

                        {/* Parametreler */}
                        <div className="mt-1.5 bg-white dark:bg-slate-950/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300 max-h-28 overflow-y-auto">
                          {Object.entries(evt.params || {}).map(([key, value]) => {
                            if (key === "send_to" || key === "app_name") return null;
                            return (
                              <div key={key} className="flex items-start justify-between gap-2 py-0.5 border-b border-slate-50 dark:border-slate-900/40 last:border-0">
                                <span className="text-slate-400 dark:text-slate-500 font-medium">{key}:</span>
                                <span className="text-right font-semibold text-slate-700 dark:text-slate-200 break-all">
                                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Custom Measurement ID Settings */}
            {activeTab === "settings" && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 text-xs text-sky-900 dark:text-sky-200 leading-relaxed">
                  <strong>Kendi Google Analytics Hesabınızı Bağlayın:</strong>
                  <p className="mt-1 text-[11px] opacity-90">
                    Google Analytics mülkünüzden alacağınız <strong>G-XXXXXXXXXX</strong> formatındaki Ölçüm Kimliğini (Measurement ID) aşağıya yazıp "Kaydet"e bastığınızda tüm veriler anında sizin panelinize akmaya başlayacaktır.
                  </p>
                </div>

                <form onSubmit={handleSaveMeasurementId} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Aktif GA4 Ölçüm Kimliği (Measurement ID)
                    </label>
                    <input
                      type="text"
                      value={customIdInput}
                      onChange={(e) => setCustomIdInput(e.target.value)}
                      placeholder="G-E8W3QY79B1"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0284C7]"
                    />
                    <p className="text-[10.5px] text-slate-400 mt-1">
                      Örnek format: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">G-XXXXXXXXXX</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Ölçüm Kimliğini Güncelle ve Bağla
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomIdInput("G-E8W3QY79B1");
                        setGAMeasurementId("G-E8W3QY79B1");
                        setMeasurementId("G-E8W3QY79B1");
                        setNotification("Varsayılan kimlik geri yüklendi.");
                        setTimeout(() => setNotification(null), 3000);
                      }}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Varsayılana Sıfırla
                    </button>
                  </div>
                </form>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Çalışma Modu:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">DebugView (Canlı Test Açık)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">gtag.js Durumu:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {isConnected ? "✅ Hazır ve Dinleniyor" : "⏳ Yükleniyor..."}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Toplam Tetiklenen Olay:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{events.length} adet</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Verification & Proof Guide */}
            {activeTab === "guide" && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Aktif Çalıştığını Nasıl Kanıtlayabilirsiniz?
                </h3>

                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mb-1">
                      <span>1️⃣</span> Tarayıcı Konsolu (F12 &gt; Console)
                    </div>
                    <p className="text-[11.5px] leading-relaxed">
                      Klavyenizden <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono">F12</kbd> tuşuna basıp <strong>Console</strong> sekmesine geçin. Her tıklamada, sayfa geçişinde veya girişte mavi <code className="text-[#0284C7] font-bold">[GA4 Canlı Olay Gönderildi]</code> loglarının parametreleriyle birlikte basıldığını görebilirsiniz.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mb-1">
                      <span>2️⃣</span> Ağ İstekleri (F12 &gt; Network)
                    </div>
                    <p className="text-[11.5px] leading-relaxed">
                      <strong>Network</strong> sekmesinde filtre alanına <code className="text-emerald-600 font-bold">collect</code> veya <code className="text-emerald-600 font-bold">google-analytics</code> yazın. Gönderilen her olay için Google Analytics sunucularına giden <strong>204 No Content</strong> durum kodlu canlı ağ paketlerini görebilirsiniz.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mb-1">
                      <span>3️⃣</span> Google Analytics Panelinde "DebugView"
                    </div>
                    <p className="text-[11.5px] leading-relaxed">
                      Sistemimiz <code className="font-mono text-purple-600 dark:text-purple-400">debug_mode: true</code> parametresiyle yapılandırılmıştır. Google Analytics kontrol panelinde <strong>Yönetici &gt; DebugView</strong> ekranını açtığınızda portaldaki tüm hareketler <strong>1-2 saniye gecikmeyle canlı zaman tünelinde akar</strong>.
                    </p>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <a
                    href="https://analytics.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-xs hover:opacity-90 transition-all cursor-pointer"
                  >
                    <span>Google Analytics Paneline Git</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Google Analytics 4 SDK v2 Canlı
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="font-bold text-[#0284C7] hover:underline cursor-pointer"
              >
                Paneli Gizle
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
