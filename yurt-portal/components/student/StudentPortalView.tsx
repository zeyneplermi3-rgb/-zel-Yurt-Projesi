"use client";

import { useState, useEffect } from "react";
import { getTodayDateKey } from "../../lib/menuUtils";
import { cleanMachineName, getDynamicSlotStatus, parseSlotMinutes } from "../../lib/laundryUtils";
import {
  Announcement,
  MaintenanceTicket,
  Yurt,
  Room,
  Student,
  LaundrySlot,
  LaundryMachine,
  Role,
} from "../../types";

export type StudentTab = "anasayfa" | "camasirhane" | "ariza" | "ayarlar";

interface StudentPortalViewProps {
  currentUser: {
    name: string;
    selectedYurtName?: string;
    details?: string;
    role?: Role;
  };
  yurtSettings: {
    ad?: string;
    ilkCikisHaftaIci?: string;
    ilkCikisHaftaSonu?: string;
    sonGirisHaftaIci?: string;
    sonGirisHaftaSonu?: string;
    camasirhaneBaslangic?: string;
    camasirhaneBitis?: string;
  };
  yurtlar: Yurt[];
  dailyMenu: {
    gunTipi: string;
    gorunumModu: "tek" | "birlikte";
    aktifOgun: "kahvalti" | "aksam";
    kahvalti: string;
    kahvaltiSaat: string;
    aksam: string;
    aksamSaat: string;
    tarih?: string;
  };
  announcements: Announcement[];
  maintenanceTickets: MaintenanceTicket[];
  onAddMaintenanceTicket: (newTicket: MaintenanceTicket) => void;
  showToast: (message: string) => void;
  rooms?: Room[];
  students?: Student[];
  laundrySlots?: LaundrySlot[];
  laundryMachines?: LaundryMachine[];
  onAddLaundrySlot?: (slot: LaundrySlot) => void;
  onCancelLaundrySlot?: (id: string) => void;
  onUpdateStudentPassword?: (studentName: string, newPassword: string) => void;
  onUpdateStudentProfile?: (
    studentName: string,
    updates: { kullaniciAdi?: string; eposta?: string; sifre?: string }
  ) => void;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
  onSelectTheme?: (theme: "light" | "dark") => void;
  onLogout?: () => void;
}

export default function StudentPortalView({
  currentUser,
  yurtSettings,
  yurtlar,
  dailyMenu,
  announcements,
  maintenanceTickets,
  onAddMaintenanceTicket,
  showToast,
  rooms = [],
  students = [],
  laundrySlots = [],
  laundryMachines = [],
  onAddLaundrySlot,
  onCancelLaundrySlot,
  onUpdateStudentPassword,
  onUpdateStudentProfile,
  theme = "light",
  onToggleTheme,
  onSelectTheme,
  onLogout,
}: StudentPortalViewProps) {
  const [activeTab, setActiveTab] = useState<StudentTab>("anasayfa");

  // Yönetim paneli tarzı açılır/kapanır ayarlar kartları
  const [openSettingsSections, setOpenSettingsSections] = useState<{
    guvenlik: boolean;
    tema: boolean;
  }>({
    guvenlik: true,
    tema: true,
  });

  const toggleSettingsSection = (section: "guvenlik" | "tema") => {
    setOpenSettingsSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Şifre, kullanıcı adı ve e-posta formu state'leri
  const [studentUsername, setStudentUsername] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Yeni çamaşır randevusu alma state'leri
  const defaultMachineId =
    cleanMachineName(laundryMachines[0]?.name || laundryMachines[0]?.id || "Makine 1");
  const [selectedLaundryDate, setSelectedLaundryDate] = useState("");
  const [selectedMachine, setSelectedMachine] = useState(defaultMachineId);
  const [selectedStartTime, setSelectedStartTime] = useState("");

  useEffect(() => {
    setSelectedLaundryDate(getTodayDateKey());
  }, []);

  useEffect(() => {
    if (laundryMachines.length > 0 && (!selectedMachine || selectedMachine.includes("-1793"))) {
      setSelectedMachine(cleanMachineName(laundryMachines[0].name || laundryMachines[0].id));
    }
  }, [laundryMachines]);

  // Öğrencinin oda ve kat bilgisini dinamik olarak tespit et
  const currentStudent = students?.find(
    (s) =>
      s.adSoyad.trim().toLowerCase() === currentUser.name.trim().toLowerCase() ||
      (currentUser.details &&
        s.eposta &&
        currentUser.details.toLowerCase().includes(s.eposta.toLowerCase()))
  );

  useEffect(() => {
    if (currentStudent?.kullaniciAdi) {
      setStudentUsername(currentStudent.kullaniciAdi);
    } else if (currentStudent?.adSoyad) {
      setStudentUsername(currentStudent.adSoyad.toLowerCase().replace(/\s+/g, "."));
    } else if (currentUser?.name) {
      setStudentUsername(currentUser.name.toLowerCase().replace(/\s+/g, "."));
    } else {
      setStudentUsername("ogrenci");
    }

    if (currentStudent?.eposta) {
      setStudentEmail(currentStudent.eposta);
    } else {
      setStudentEmail("ogrenci@yurtify.com");
    }
  }, [currentStudent?.kullaniciAdi, currentStudent?.adSoyad, currentStudent?.eposta, currentUser?.name]);

  let odaNo = currentStudent?.odaNo;
  if (!odaNo && currentUser.details) {
    const match = currentUser.details.match(/Oda\s+([A-Za-z0-9\-]+)/i);
    if (match) {
      odaNo = match[1];
    }
  }
  if (!odaNo) {
    odaNo = "B-305";
  }

  const matchedRoom = rooms?.find(
    (r) =>
      r.odaNo.trim().toLowerCase() === odaNo!.trim().toLowerCase() ||
      r.odaNo.replace(/\D/g, "") === odaNo!.replace(/\D/g, "")
  );

  let katDisplay: string | number = "";
  if (matchedRoom?.kat !== undefined) {
    katDisplay = matchedRoom.kat === 0 ? "Zemin" : matchedRoom.kat;
  } else {
    const digitMatch = odaNo.match(/\d+/);
    if (digitMatch && digitMatch[0].length >= 3) {
      katDisplay = digitMatch[0][0];
    } else {
      katDisplay = "3";
    }
  }

  // Öğrencinin kendi açtığı arıza kayıtları
  const myTickets = maintenanceTickets.filter(
    (t) =>
      t.bildiren.trim().toLowerCase() === currentUser.name.trim().toLowerCase() ||
      t.odaNo.trim().toLowerCase() === odaNo.trim().toLowerCase()
  );
  const myOpenTicketsCount = myTickets.filter((t) => t.durum !== "Çözüldü").length;

  // Öğrencinin kendi çamaşırhane randevuları
  const myLaundrySlots = laundrySlots.filter(
    (s) =>
      s.ogrenciAd.trim().toLowerCase() === currentUser.name.trim().toLowerCase() ||
      s.odaNo.trim().toLowerCase() === odaNo.trim().toLowerCase()
  );

  // Buton sekme tanımları (Kullanıcı isteği: ana sayfa, camasirhane, ariza, ayarlar)
  const studentTabItems = [
    {
      id: "anasayfa" as const,
      label: "Ana Sayfa",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      id: "camasirhane" as const,
      label: "Çamaşırhane",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4h16v16H4V4zm8 12a4 4 0 100-8 4 4 0 000 8zm-5-9h.01M10 7h.01"
          />
        </svg>
      ),
    },
    {
      id: "ariza" as const,
      label: "Arıza",
      badge: myOpenTicketsCount > 0 ? myOpenTicketsCount : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
          />
        </svg>
      ),
    },
    {
      id: "ayarlar" as const,
      label: "Ayarlar",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ];

  // Her 30 saniyede bir randevu durumlarını canlı saate göre otomatik güncelleme tetikleyicisi
  const [, setLaundryClockTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setLaundryClockTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Randevu oluşturma işlemi
  const handleCreateLaundryReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddLaundrySlot) {
      showToast("Randevu sistemi şu an aktif değil.");
      return;
    }

    if (!selectedStartTime.trim()) {
      showToast("Lütfen başlangıç saatini manuel olarak giriniz (Örn: 14:00 veya 18:28).");
      return;
    }

    const { formattedRange } = parseSlotMinutes(selectedStartTime);

    // Seçilen saatte makine çakışma kontrolü
    const isConflict = laundrySlots.some(
      (s) =>
        s.tarih === selectedLaundryDate &&
        s.makineNo === selectedMachine &&
        (s.saatAraligi === formattedRange || s.saatAraligi === selectedStartTime) &&
        s.durum !== "İptal" &&
        s.durum !== "Tamamlandı"
    );

    if (isConflict) {
      showToast("Seçilen makine ve saatte başka bir randevu mevcuttur.");
      return;
    }

    // Saate göre anlık dinamik durum tespiti (Şu anki saat randevu saatindeyse "Yıkanıyor", öncesindeyse "Sırada")
    const dynamicStatus = getDynamicSlotStatus({
      tarih: selectedLaundryDate,
      saatAraligi: formattedRange,
      durum: "Sırada",
    });

    const newSlot: LaundrySlot = {
      id: "lnd-" + Date.now(),
      ogrenciAd: currentUser.name,
      odaNo: odaNo,
      makineNo: cleanMachineName(selectedMachine),
      tarih: selectedLaundryDate,
      saatAraligi: formattedRange,
      program: selectedMachine.includes("Kurutma") ? "Kurutma & Havalandırma" : "Renkli & Karışık",
      durum: dynamicStatus,
    };

    onAddLaundrySlot(newSlot);
    setSelectedStartTime("");
    showToast(
      dynamicStatus === "Yıkanıyor"
        ? "Randevunuz oluşturuldu ve saati geldiği için yıkama durumuna alındı!"
        : "Randevunuz oluşturuldu ve sıraya alındı!"
    );
  };

  // Hesap & Güvenlik ayarlarını kaydetme işlemi (Kullanıcı Adı, E-posta ve Şifre)
  const handleSaveSecuritySettings = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!studentUsername.trim()) {
      setPasswordError("Lütfen bir kullanıcı adı giriniz.");
      return;
    }

    if (!studentEmail.trim() || !studentEmail.includes("@")) {
      setPasswordError("Lütfen geçerli bir e-posta adresi giriniz.");
      return;
    }

    const isChangingPassword = Boolean(oldPassword || newPassword || confirmPassword);
    if (isChangingPassword) {
      if (!newPassword || newPassword.length < 6) {
        setPasswordError("Yeni şifreniz en az 6 karakter olmalıdır.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError("Yeni şifreler birbiriyle eşleşmiyor.");
        return;
      }
      const currentPass = currentStudent?.sifre || "ogrenci123";
      if (oldPassword && oldPassword !== currentPass) {
        setPasswordError("Mevcut şifrenizi hatalı girdiniz.");
        return;
      }
    }

    if (onUpdateStudentProfile) {
      onUpdateStudentProfile(currentUser.name, {
        kullaniciAdi: studentUsername.trim(),
        eposta: studentEmail.trim(),
        ...(isChangingPassword ? { sifre: newPassword } : {}),
      });
      showToast("Öğrenci hesap ve güvenlik bilgileri başarıyla güncellendi.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else if (isChangingPassword && onUpdateStudentPassword) {
      onUpdateStudentPassword(currentUser.name, newPassword);
      showToast("Öğrenci şifreniz başarıyla güncellendi.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      showToast("Bilgiler başarıyla kaydedildi.");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ======================================================== */}
      {/* 1. MASAÜSTÜ YATAY SEKMELER (Masaüstü Ekranlarda Üst Menü) */}
      {/* ======================================================== */}
      <div className="hidden md:flex items-center justify-center gap-1.5 p-1.5 bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl overflow-x-auto no-scrollbar">
        {studentTabItems.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-[#0284C7] text-white border border-[#0369A1] shadow-xs"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] hover:bg-white dark:hover:bg-[#0F172A]"
              }`}
            >
              <span className="w-4 h-4 flex items-center justify-center">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white text-[#0284C7]" : "bg-rose-600 text-white"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 2. TAB 1: ANA SAYFA (Genel Bakış, Yemekhane, Duyurular) */}
      {/* ======================================================== */}
      {activeTab === "anasayfa" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Hoş Geldin Alanı */}
          <div className="bg-white border border-[#E2E8F0] p-4 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 shadow-xs">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A]">
                Hoş geldin, {currentUser.name}!
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 sm:mt-1 font-medium">
                Kat: <strong className="text-[#0F172A] font-bold">{katDisplay}</strong> • Oda:{" "}
                <strong className="text-[#0F172A] font-bold">{odaNo}</strong>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2.5 sm:px-3 py-1 rounded-lg sm:rounded-xl bg-[#F8FAFC] text-[11px] sm:text-xs font-bold text-emerald-700 border border-emerald-500/20">
                Çıkış: {yurtSettings.ilkCikisHaftaIci || "06:00"} (Hafta İçi) •{" "}
                {yurtSettings.ilkCikisHaftaSonu || "06:30"} (Hafta Sonu)
              </span>
              <span className="px-2.5 sm:px-3 py-1 rounded-lg sm:rounded-xl bg-[#F1F5F9] text-[11px] sm:text-xs font-bold text-[#64748B] border border-[#E2E8F0]">
                Giriş: {yurtSettings.sonGirisHaftaIci || "23:00"} (Hafta İçi) •{" "}
                {yurtSettings.sonGirisHaftaSonu || "23:45"} (Hafta Sonu)
              </span>
            </div>
          </div>

          {/* Öğrenci Yemekhane Menüsü */}
          <div className="bg-white border border-[#E2E8F0] p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4 shadow-xs">
            <h3 className="text-sm sm:text-base font-black text-[#0F172A]">Günün Menüsü</h3>

            {dailyMenu.gorunumModu === "birlikte" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sabah Kahvaltisi */}
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-2.5 shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#0284C7] flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0]">
                      Sabah Kahvaltısı
                    </span>
                    <span className="text-xs font-semibold text-[#64748B] bg-white px-2.5 py-0.5 rounded-lg border border-[#E2E8F0]">
                      {dailyMenu.kahvaltiSaat}
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed font-medium whitespace-pre-line min-h-[44px]">
                    {dailyMenu.kahvalti ? (
                      dailyMenu.kahvalti
                    ) : (
                      <span className="text-stone-400 italic">Günün kahvaltı menüsü henüz girilmedi.</span>
                    )}
                  </p>
                  <div className="text-[11px] text-stone-500 pt-2 border-t border-[#E2E8F0] flex justify-between items-center">
                    <span className="text-stone-500 text-[11px]">Günün Servisi</span>
                    {dailyMenu.kahvalti ? (
                      <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Servis Hazır
                      </span>
                    ) : (
                      <span className="text-stone-400 font-medium text-[11px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-stone-300" /> Menü Bekleniyor
                      </span>
                    )}
                  </div>
                </div>

                {/* Aksam Yemegi */}
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-2.5 shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#0284C7] flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0]">
                      Akşam Yemeği
                    </span>
                    <span className="text-xs font-semibold text-[#64748B] bg-white px-2.5 py-0.5 rounded-lg border border-[#E2E8F0]">
                      {dailyMenu.aksamSaat}
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed font-medium whitespace-pre-line min-h-[44px]">
                    {dailyMenu.aksam ? (
                      dailyMenu.aksam
                    ) : (
                      <span className="text-stone-400 italic">Günün akşam yemeği menüsü henüz girilmedi.</span>
                    )}
                  </p>
                  <div className="text-[11px] text-stone-500 pt-2 border-t border-[#E2E8F0] flex justify-between items-center">
                    <span className="text-stone-500 text-[11px]">Günün Servisi</span>
                    {dailyMenu.aksam ? (
                      <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sıcak Servis
                      </span>
                    ) : (
                      <span className="text-stone-400 font-medium text-[11px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-stone-300" /> Menü Bekleniyor
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : dailyMenu.aktifOgun === "kahvalti" ? (
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-2.5 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#0284C7] flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0]">
                    Sabah Kahvaltısı Servisi
                  </span>
                  <span className="text-xs font-semibold text-[#64748B] bg-white px-2.5 py-0.5 rounded-lg border border-[#E2E8F0]">
                    {dailyMenu.kahvaltiSaat}
                  </span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-medium whitespace-pre-line min-h-[44px]">
                  {dailyMenu.kahvalti ? (
                    dailyMenu.kahvalti
                  ) : (
                    <span className="text-stone-400 italic">Günün kahvaltı menüsü henüz girilmedi.</span>
                  )}
                </p>
                <div className="text-[11px] text-stone-500 pt-2 border-t border-[#E2E8F0] flex justify-between items-center">
                  <span className="text-stone-500 text-[11px]">Günün Servisi</span>
                  {dailyMenu.kahvalti ? (
                    <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Servis Hazır
                    </span>
                  ) : (
                    <span className="text-stone-400 font-medium text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-stone-300" /> Menü Bekleniyor
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-2.5 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#0284C7] flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0]">
                    Akşam Yemeği Servisi
                  </span>
                  <span className="text-xs font-semibold text-[#64748B] bg-white px-2.5 py-0.5 rounded-lg border border-[#E2E8F0]">
                    {dailyMenu.aksamSaat}
                  </span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-medium whitespace-pre-line min-h-[44px]">
                  {dailyMenu.aksam ? (
                    dailyMenu.aksam
                  ) : (
                    <span className="text-stone-400 italic">Günün akşam yemeği menüsü henüz girilmedi.</span>
                  )}
                </p>
                <div className="text-[11px] text-stone-500 pt-2 border-t border-[#E2E8F0] flex justify-between items-center">
                  <span className="text-stone-500 text-[11px]">Günün Servisi</span>
                  {dailyMenu.aksam ? (
                    <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sıcak Servis
                    </span>
                  ) : (
                    <span className="text-stone-400 font-medium text-[11px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-stone-300" /> Menü Bekleniyor
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Duyurular */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] space-y-3 shadow-xs">
            <h3 className="text-base font-bold text-stone-900">Duyurular</h3>
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {announcements.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-500 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                  Aktif duyuru bulunmamaktadır.
                </div>
              ) : (
                announcements.map((anc) => (
                  <div
                    key={anc.id}
                    className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-stone-800">{anc.baslik}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          anc.oncelik === "Acil"
                            ? "bg-rose-500/20 text-rose-500"
                            : "bg-[#F1F5F9] text-[#0284C7] border border-[#E2E8F0]"
                        }`}
                      >
                        {anc.oncelik}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">{anc.icerik}</p>
                    <div className="text-[10px] text-slate-500">{anc.tarih}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TAB 2: ÇAMAŞIRHANE (Durum, Randevularım ve Rezervasyon) */}
      {/* ======================================================== */}
      {activeTab === "camasirhane" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Önemli Hatırlatma (Sayfanın en üstünde tek başına) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 space-y-1 shadow-xs">
            <div className="font-bold flex items-center gap-1.5 text-amber-950 dark:text-amber-100">
              <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Önemli Hatırlatma:</span>
            </div>
            <div className="pl-5 text-amber-800 dark:text-amber-300/90 leading-relaxed text-[11px] sm:text-xs">
              Yıkama süresi tamamlandığında çamaşırlarınızı bekletmeden alınız. Sıradaki öğrenci için makineyi temiz bırakınız.
            </div>
          </div>

          {/* Yeni Randevu Alma Formu */}
          <div className="bg-white dark:bg-[#1E293B] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] dark:border-[#334155] space-y-4 shadow-xs">
            <div className="border-b border-[#E2E8F0] dark:border-[#334155] pb-3">
              <h4 className="text-sm font-bold text-stone-900 dark:text-[#F1F5F9]">Yeni Randevu Oluştur</h4>
            </div>

            <form onSubmit={handleCreateLaundryReservation} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-stone-600 dark:text-[#94A3B8] block mb-1 font-semibold">Tarih</label>
                  <input
                    type="date"
                    value={selectedLaundryDate}
                    onChange={(e) => setSelectedLaundryDate(e.target.value)}
                    min={getTodayDateKey()}
                    className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-2.5 text-stone-900 dark:text-[#F1F5F9] font-medium focus:outline-none focus:border-[#0284C7]"
                  />
                </div>

                <div>
                  <label className="text-stone-600 dark:text-[#94A3B8] block mb-1 font-semibold">Makine Seçimi</label>
                  <select
                    value={selectedMachine}
                    onChange={(e) => setSelectedMachine(e.target.value)}
                    className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-2.5 text-stone-900 dark:text-[#F1F5F9] font-medium focus:outline-none focus:border-[#0284C7]"
                  >
                    {laundryMachines.length > 0 ? (
                      laundryMachines.map((m) => {
                        const cleanName = cleanMachineName(m.name || m.id);
                        return (
                          <option key={m.id} value={cleanName}>
                            {cleanName} ({m.tur === "kurutma" ? "Kurutma" : "Yıkama"})
                          </option>
                        );
                      })
                    ) : (
                      <>
                        <option value="Makine 1">Makine 1 (Yıkama)</option>
                        <option value="Makine 2">Makine 2 (Yıkama)</option>
                        <option value="Kurutma 1">Kurutma 1 (Kurutma)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-stone-600 dark:text-[#94A3B8] block mb-1 font-semibold">
                  Başlangıç Saati
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 14:00"
                  maxLength={5}
                  value={selectedStartTime}
                  onChange={(e) => {
                    const val = e.target.value.replace(".", ":");
                    setSelectedStartTime(val);
                  }}
                  className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-2.5 text-stone-900 dark:text-[#F1F5F9] font-medium focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl cursor-pointer transition-all min-h-[44px] shadow-xs active:scale-[0.99]"
              >
                Randevuyu Onayla
              </button>
            </form>
          </div>

          {/* Öğrencinin Aktif ve Geçmiş Randevuları */}
          <div className="bg-white dark:bg-[#1E293B] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] dark:border-[#334155] space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-3">
              <h4 className="text-sm font-bold text-stone-900 dark:text-[#F1F5F9]">Randevularım</h4>
              <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8]">
                {myLaundrySlots.length} Randevu
              </span>
            </div>

            {myLaundrySlots.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#64748B] dark:text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl border border-[#E2E8F0] dark:border-[#334155]">
                Henüz bir çamaşırhane randevunuz bulunmuyor. Yukarıdaki formdan dilediğiniz gün ve saate randevu oluşturabilirsiniz.
              </div>
            ) : (
              <div className="space-y-2.5">
                {myLaundrySlots.map((slot) => {
                  const currentStatus = getDynamicSlotStatus(slot);
                  return (
                    <div
                      key={slot.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-[#0F172A] dark:text-[#F1F5F9]">
                            {cleanMachineName(slot.makineNo)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              currentStatus === "Yıkanıyor"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                : currentStatus === "Sırada"
                                ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800"
                                : currentStatus === "İptal"
                                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                                : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                            }`}
                          >
                            {currentStatus}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                          Tarih: <strong className="text-[#0F172A] dark:text-[#F1F5F9]">{slot.tarih}</strong> • Saat: <strong className="text-[#0F172A] dark:text-[#F1F5F9]">{slot.saatAraligi}</strong>
                        </p>
                      </div>

                      {onCancelLaundrySlot && currentStatus !== "Tamamlandı" && currentStatus !== "İptal" && (
                        <button
                          type="button"
                          onClick={() => {
                            onCancelLaundrySlot(slot.id);
                            showToast("Randevunuz iptal edildi.");
                          }}
                          className="self-end sm:self-center px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer min-h-[36px]"
                        >
                          İptal Et
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TAB 3: ARIZA (Teknik Destek Talebi & Takibi) */}
      {/* ======================================================== */}
      {activeTab === "ariza" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Ariza Bildirim Formu */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div>
                  <h3 className="text-base font-bold text-stone-900">Arıza & Destek Bildirimi</h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-[#F1F5F9] text-[#0284C7] border border-[#E2E8F0]">
                  Oda {odaNo}
                </span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const baslikInput = form.elements.namedItem("arizaBaslik") as HTMLInputElement;
                  const katInput = form.elements.namedItem("arizaKat") as HTMLSelectElement;
                  if (!baslikInput.value.trim()) return;

                  const newTicket: MaintenanceTicket = {
                    id: "mnt-" + Date.now(),
                    odaNo: odaNo,
                    baslik: baslikInput.value.trim(),
                    kategori: (katInput.value as any) || "Tesisat",
                    oncelik: "Orta",
                    durum: "Açık",
                    bildiren: currentUser?.name || "Öğrenci",
                    tarih: new Date().toLocaleDateString("tr-TR"),
                  };

                  onAddMaintenanceTicket(newTicket);
                  baslikInput.value = "";
                  showToast("Arıza bildiriminiz idareye iletildi!");
                }}
                className="space-y-3.5 text-xs"
              >
                <div>
                  <label className="text-stone-600 block mb-1 font-semibold">Kategori</label>
                  <select
                    name="arizaKat"
                    defaultValue="Tesisat"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 font-medium focus:outline-none focus:border-[#0284C7]"
                  >
                    <option value="Tesisat">Sıhhi Tesisat / Banyo / Musluk</option>
                    <option value="Elektrik">Elektrik / Priz / Aydınlatma</option>
                    <option value="İnternet">Wi-Fi / İnternet Bağlantısı</option>
                    <option value="Mobilya">Mobilya / Dolap / Ranza / Yatak</option>
                    <option value="Diğer">Diğer Teknik Konular</option>
                  </select>
                </div>
                <div>
                  <label className="text-stone-600 block mb-1 font-semibold">
                    Arıza Açıklaması *
                  </label>
                  <textarea
                    name="arizaBaslik"
                    required
                    rows={3}
                    placeholder="Örn: Odamızdaki duş başlığı su kaçırıyor veya priz çalışmıyor..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-stone-900 font-medium placeholder-stone-400 focus:outline-none focus:border-[#0284C7] resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl cursor-pointer transition-all min-h-[44px] shadow-xs active:scale-[0.99]"
                >
                  Talebi İdareye İlet
                </button>
              </form>
            </div>

            {/* Arıza Taleplerim Listesi */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <h3 className="text-base font-bold text-stone-900">Arıza Bildirimlerim</h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#0284C7] border border-[#E2E8F0]">
                  {myTickets.length} Kayıt
                </span>
              </div>

              {myTickets.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-500 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-1">
                  <div className="font-bold text-stone-700">Bildirilmiş Arıza Yok</div>
                  <div>Odanızla ilgili herhangi bir teknik problem varsa sol taraftan iletebilirsiniz.</div>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {myTickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-xs text-stone-900 leading-snug">
                          {t.baslik}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                            t.durum === "Çözüldü"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : t.durum === "İnceleniyor"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-rose-100 text-rose-800 border border-rose-300"
                          }`}
                        >
                          {t.durum}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-[#E2E8F0]">
                        <span>Kategori: {t.kategori}</span>
                        <span>{t.tarih}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. TAB 4: AYARLAR (Profil, Şifre Değiştirme, Tema) */}
      {/* ======================================================== */}
      {activeTab === "ayarlar" && (
        <div className="w-full space-y-4 sm:space-y-5">
          {/* 1. ÖĞRENCİ GİRİŞİ & ŞİFRE AYARLARI (AŞAĞIYA AÇILIR BUTON KART) */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs transition-all">
            <button
              type="button"
              onClick={() => toggleSettingsSection("guvenlik")}
              className="w-full p-4 sm:p-6 flex items-center justify-between gap-3 text-left transition-colors hover:bg-[#F8FAFC]/60 dark:hover:bg-[#0F172A]/40 cursor-pointer"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                    openSettingsSections.guvenlik
                      ? "bg-[#0284C7] text-white"
                      : "bg-[#F1F5F9] dark:bg-[#0F172A] text-[#0284C7]"
                  }`}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-[#0F172A] dark:text-[#F1F5F9] truncate">
                    Öğrenci Girişi & Şifre Ayarları
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] transition-transform duration-300 ${
                    openSettingsSections.guvenlik ? "rotate-180 bg-[#F1F5F9] dark:bg-[#1E293B]" : ""
                  }`}
                >
                  <svg className="w-4 h-4 text-[#0F172A] dark:text-[#F1F5F9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            {openSettingsSections.guvenlik && (
              <div className="border-t border-[#E2E8F0] dark:border-[#334155] p-5 sm:p-8 animate-accordion-down space-y-5 bg-white dark:bg-[#1E293B]">
                {passwordError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-bold">
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handleSaveSecuritySettings} className="space-y-4 text-xs">
                  {/* Giriş Bilgileri Kartı (Kullanıcı Adı & E-posta) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#64748B] dark:text-[#94A3B8] font-semibold block mb-1">
                        Kullanıcı Adı
                      </label>
                      <input
                        type="text"
                        required
                        value={studentUsername}
                        onChange={(e) => setStudentUsername(e.target.value)}
                        placeholder="kullaniciadi"
                        className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-2.5 text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[#64748B] dark:text-[#94A3B8] font-semibold block mb-1">
                        E-posta
                      </label>
                      <input
                        type="email"
                        required
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="ogrenci@yurtify.com"
                        className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-2.5 text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Güvenli Şifre Değiştirme Kartı */}
                  <div className="p-4 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-[#0F172A] dark:text-[#F1F5F9] block">
                      Şifre Değiştir
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[#64748B] dark:text-[#94A3B8] font-medium block mb-1">
                          Mevcut Şifre
                        </label>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Mevcut şifreniz..."
                          className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-2.5 text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 font-mono font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[#64748B] dark:text-[#94A3B8] font-medium block mb-1">
                          Yeni Şifre
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Yeni şifre..."
                          className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-2.5 text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 font-mono font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[#64748B] dark:text-[#94A3B8] font-medium block mb-1">
                          Yeni Şifre (Tekrar)
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Yeni şifre tekrar..."
                          className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-2.5 text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 font-mono font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl cursor-pointer shadow-xs transition-colors text-xs border border-[#0369A1] active:scale-[0.99] min-h-[44px]"
                  >
                    Öğrenci Giriş ve Şifre Ayarlarını Kaydet
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* 2. GÖRÜNÜM & TEMA AYARLARI (AŞAĞIYA AÇILIR BUTON KART) */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs transition-all">
            <button
              type="button"
              onClick={() => toggleSettingsSection("tema")}
              className="w-full p-4 sm:p-6 flex items-center justify-between gap-3 text-left transition-colors hover:bg-[#F8FAFC]/60 dark:hover:bg-[#0F172A]/40 cursor-pointer"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                    openSettingsSections.tema
                      ? "bg-[#0284C7] text-white"
                      : "bg-[#F1F5F9] dark:bg-[#0F172A] text-[#0284C7]"
                  }`}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-[#0F172A] dark:text-[#F1F5F9] truncate">
                    Görünüm & Tema Ayarları
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] transition-transform duration-300 ${
                    openSettingsSections.tema ? "rotate-180 bg-[#F1F5F9] dark:bg-[#1E293B]" : ""
                  }`}
                >
                  <svg className="w-4 h-4 text-[#0F172A] dark:text-[#F1F5F9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            {openSettingsSections.tema && (
              <div className="border-t border-[#E2E8F0] dark:border-[#334155] p-5 sm:p-8 animate-accordion-down space-y-4 bg-white dark:bg-[#1E293B]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Aydınlık Mod Seçeneği */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectTheme) {
                        onSelectTheme("light");
                      } else if (theme === "dark" && onToggleTheme) {
                        onToggleTheme();
                      }
                    }}
                    className={`p-3.5 rounded-xl sm:rounded-2xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-3 min-h-[48px] active:scale-[0.99] ${
                      theme === "light"
                        ? "border-[#0284C7] bg-[#F1F5F9] dark:bg-[#162032]"
                        : "border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] hover:border-[#CBD5E1] dark:hover:border-[#475569] hover:bg-white dark:hover:bg-[#1E293B]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          theme === "light"
                            ? "bg-[#0284C7] text-white"
                            : "bg-white dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#334155]"
                        }`}
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="5" />
                          <line x1="12" y1="1" x2="12" y2="3" />
                          <line x1="12" y1="21" x2="12" y2="23" />
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                          <line x1="1" y1="12" x2="3" y2="12" />
                          <line x1="21" y1="12" x2="23" y2="12" />
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                        Aydınlık Mod
                      </span>
                    </div>

                    {theme === "light" ? (
                      <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-[#CBD5E1] dark:border-[#475569] shrink-0" />
                    )}
                  </button>

                  {/* Karanlık Mod Seçeneği */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectTheme) {
                        onSelectTheme("dark");
                      } else if (theme === "light" && onToggleTheme) {
                        onToggleTheme();
                      }
                    }}
                    className={`p-3.5 rounded-xl sm:rounded-2xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-3 min-h-[48px] active:scale-[0.99] ${
                      theme === "dark"
                        ? "border-[#0284C7] bg-[#F1F5F9] dark:bg-[#162032]"
                        : "border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] hover:border-[#CBD5E1] dark:hover:border-[#475569] hover:bg-white dark:hover:bg-[#1E293B]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          theme === "dark"
                            ? "bg-[#0284C7] text-white"
                            : "bg-white dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#334155]"
                        }`}
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                        Karanlık Mod
                      </span>
                    </div>

                    {theme === "dark" ? (
                      <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-[#CBD5E1] dark:border-[#475569] shrink-0" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Çıkış Yap Butonu */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer text-center min-h-[44px]"
            >
              Çıkış Yap
            </button>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MOBİL ALT GEZİNME ÇUBUĞU (Kullanıcı Talebi: Alt Butonlar) */}
      {/* ======================================================== */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-t border-[#E2E8F0] dark:border-[#1E293B] shadow-lg px-2 py-1 pb-[max(0.4rem,env(safe-area-inset-bottom))]"
        aria-label="Öğrenci Mobil Alt Menü"
      >
        <div className="flex items-center justify-around gap-1 max-w-lg mx-auto">
          {studentTabItems.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all cursor-pointer relative min-h-[44px] ${
                  isActive
                    ? "text-[#0284C7] font-bold bg-[#F1F5F9] dark:bg-[#1E293B]"
                    : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] font-medium"
                }`}
              >
                <div className="relative">
                  <span
                    className={`w-5 h-5 flex items-center justify-center ${
                      isActive ? "text-[#0284C7]" : "text-[#64748B] dark:text-[#94A3B8]"
                    }`}
                  >
                    {tab.icon}
                  </span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10.5px] mt-0.5 tracking-tight whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
