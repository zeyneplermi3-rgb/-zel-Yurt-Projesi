"use client";

import { useState, useEffect } from "react";
import { getTodayDateKey } from "../../lib/menuUtils";
import { cleanMachineName, getDynamicSlotStatus, parseSlotMinutes, normalizeDateStr } from "../../lib/laundryUtils";
import {
  Announcement,
  MaintenanceTicket,
  Yurt,
  Room,
  Student,
  LaundrySlot,
  LaundryMachine,
  Role,
  MealAttendanceRecord,
  MealRatingRecord,
} from "../../types";

export type StudentTab = "anasayfa" | "camasirhane" | "ariza" | "ayarlar";

interface StudentPortalViewProps {
  currentUser: {
    name: string;
    selectedYurtName?: string;
    details?: string;
    role?: Role;
  };
  activeTab?: StudentTab;
  onTabChange?: (tab: StudentTab) => void;
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
  onDeleteMaintenanceTicket?: (id: string) => void;
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
  mealAttendance?: MealAttendanceRecord[];
  onSaveMealAttendance?: (status: "var" | "yok") => void;
  mealRatings?: MealRatingRecord[];
  onSaveMealRating?: (rating: number, comment: string) => void;
  onRateMaintenanceTicket?: (id: string, satisfaction: "evet" | "hayir") => void;
  theme?: "light" | "dark";
  themeMode?: "light" | "dark" | "system";
  onToggleTheme?: () => void;
  onSelectTheme?: (theme: "light" | "dark" | "system") => void;
  onLogout?: () => void;
}

export default function StudentPortalView({
  currentUser,
  activeTab: controlledTab,
  onTabChange,
  yurtSettings,
  yurtlar,
  dailyMenu,
  announcements,
  maintenanceTickets,
  onAddMaintenanceTicket,
  onDeleteMaintenanceTicket,
  showToast,
  rooms = [],
  students = [],
  laundrySlots = [],
  laundryMachines = [],
  onAddLaundrySlot,
  onCancelLaundrySlot,
  onUpdateStudentPassword,
  onUpdateStudentProfile,
  mealAttendance = [],
  onSaveMealAttendance,
  mealRatings = [],
  onSaveMealRating,
  onRateMaintenanceTicket,
  theme = "light",
  themeMode = "system",
  onToggleTheme,
  onSelectTheme,
  onLogout,
}: StudentPortalViewProps) {
  const [internalTab, setInternalTab] = useState<StudentTab>("anasayfa");
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;
  const setActiveTab = (tab: StudentTab) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  // Yönetim paneli tarzı açılır/kapanır ayarlar kartları
  const [openSettingsSections, setOpenSettingsSections] = useState<{
    guvenlik: boolean;
    tema: boolean;
  }>({
    guvenlik: false,
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

  // Zorunlu ilk giriş geçici şifre değiştirme state'leri
  const [forcedNewPassword, setForcedNewPassword] = useState("");
  const [forcedConfirmPassword, setForcedConfirmPassword] = useState("");
  const [forcedPasswordError, setForcedPasswordError] = useState("");
  const [isForcedUpdating, setIsForcedUpdating] = useState(false);

  // Yeni çamaşır randevusu alma state'leri
  const defaultMachineId =
    cleanMachineName(laundryMachines[0]?.name || laundryMachines[0]?.id || "Makine 1");
  const [selectedLaundryDate, setSelectedLaundryDate] = useState("");
  const [selectedMachine, setSelectedMachine] = useState(defaultMachineId);
  const [selectedStartTime, setSelectedStartTime] = useState("");

  // Öğrenci Çamaşır Takvimi State'leri
  const [laundryViewYear, setLaundryViewYear] = useState<number>(() => new Date().getFullYear());
  const [laundryViewMonth, setLaundryViewMonth] = useState<number>(() => new Date().getMonth());
  const [laundryCalendarView, setLaundryCalendarView] = useState<"month" | "day">("month");
  const [laundryMachineFilter, setLaundryMachineFilter] = useState<string>("all");
  const [cancelConfirmSlot, setCancelConfirmSlot] = useState<LaundrySlot | null>(null);

  // Günün Yemek Menüsü Puanlama State
  const todayKey = getTodayDateKey();
  const todayUserRating = mealRatings.find(
    (r) =>
      r.studentName.trim().toLowerCase() === currentUser.name.trim().toLowerCase() &&
      r.date === todayKey
  );

  const [currentRating, setCurrentRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState<string>("");

  useEffect(() => {
    if (todayUserRating) {
      setCurrentRating(todayUserRating.rating);
      setRatingComment(todayUserRating.comment || "");
    }
  }, [todayUserRating]);

  useEffect(() => {
    setSelectedLaundryDate(getTodayDateKey());
  }, []);

  // Seçili makine dolu ise otomatik olarak ilk boş makineye geçiş yap
  useEffect(() => {
    const todayKey = getTodayDateKey();
    const isToday = normalizeDateStr(selectedLaundryDate) === todayKey;
    if (!isToday) return;

    const list = laundryMachines;

    const isCurrentBusy = laundrySlots.some((slot) => {
      const slotClean = cleanMachineName(slot.makineNo);
      return (
        (slotClean === cleanMachineName(selectedMachine) || slot.makineNo === selectedMachine) &&
        normalizeDateStr(slot.tarih) === todayKey &&
        slot.durum !== "İptal" &&
        getDynamicSlotStatus(slot) === "Yıkanıyor"
      );
    });

    if (isCurrentBusy) {
      const firstFree = list.find((m) => {
        const cleanName = cleanMachineName(m.name || m.id);
        return !laundrySlots.some((slot) => {
          const slotClean = cleanMachineName(slot.makineNo);
          return (
            (slotClean === cleanName || slot.makineNo === m.id) &&
            normalizeDateStr(slot.tarih) === todayKey &&
            slot.durum !== "İptal" &&
            getDynamicSlotStatus(slot) === "Yıkanıyor"
          );
        });
      });
      if (firstFree) {
        setSelectedMachine(cleanMachineName(firstFree.name || firstFree.id));
      }
    }
  }, [selectedLaundryDate, laundrySlots, selectedMachine, laundryMachines]);

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
    } else if (currentUser.details && currentUser.details.includes("@")) {
      const emailPart = currentUser.details.includes("•")
        ? currentUser.details.split("•")[1]?.trim() || ""
        : currentUser.details.trim();
      setStudentEmail(emailPart);
    } else {
      setStudentEmail("");
    }
  }, [currentStudent?.kullaniciAdi, currentStudent?.adSoyad, currentStudent?.eposta, currentUser?.name, currentUser?.details]);

  let odaNo = currentStudent?.odaNo;
  if (!odaNo && currentUser.details) {
    const match = currentUser.details.match(/Oda\s+([A-Za-z0-9\-]+)/i);
    if (match) {
      odaNo = match[1];
    }
  }
  if (!odaNo) {
    odaNo = "-";
  }

  // İsim ve soyismin baş harflerini alma (Örn: "Ahmet Yılmaz" -> "A. Y.")
  const formatInitials = (fullName: string) => {
    if (!fullName || !fullName.trim()) return "";
    const parts = fullName.trim().split(/\s+/);
    return parts.map((p) => p.charAt(0).toUpperCase() + ".").join(" ");
  };

  // Geçici şifre ile ilk giriş kontrolü (Zorunlu şifre belirleme)
  const isTemporaryPasswordActive = Boolean(
    currentStudent &&
    (currentStudent.geciciSifreMi === true || currentStudent.sifre === "ogrenci123")
  );

  const handleForcedPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setForcedPasswordError("");

    if (!forcedNewPassword || forcedNewPassword.length < 6) {
      setForcedPasswordError("Yeni şifreniz en az 6 karakter olmalıdır.");
      return;
    }
    if (forcedNewPassword.toLowerCase() === "ogrenci123") {
      setForcedPasswordError("Yeni şifreniz geçici şifrenizle (ogrenci123) aynı olamaz.");
      return;
    }
    if (forcedNewPassword !== forcedConfirmPassword) {
      setForcedPasswordError("Girdiğiniz yeni şifreler birbiriyle eşleşmiyor.");
      return;
    }

    setIsForcedUpdating(true);
    if (onUpdateStudentPassword && currentStudent) {
      onUpdateStudentPassword(currentStudent.adSoyad, forcedNewPassword);
    } else if (onUpdateStudentProfile && currentStudent) {
      onUpdateStudentProfile(currentStudent.adSoyad, { sifre: forcedNewPassword });
    }

    showToast("Yeni şifreniz başarıyla belirlendi. Yurtify portalına hoş geldiniz!");
    setIsForcedUpdating(false);
    setForcedNewPassword("");
    setForcedConfirmPassword("");
  };

  const matchedRoom = rooms?.find(
    (r) =>
      r.odaNo.trim().toLowerCase() === odaNo!.trim().toLowerCase() ||
      r.odaNo.replace(/\D/g, "") === odaNo!.replace(/\D/g, "")
  );

  // Günlük yemek katılım (Varım / Yokum) tespiti ve durumu
  const todayDateStr = getTodayDateKey();
  const currentAttendance = mealAttendance?.find(
    (a) =>
      a.date === todayDateStr &&
      (a.studentKey.toLowerCase() === (currentStudent?.eposta || "").toLowerCase() ||
        a.studentKey.toLowerCase() === currentUser.name.toLowerCase() ||
        a.studentName.toLowerCase() === currentUser.name.toLowerCase())
  );

  const [selectedAttendance, setSelectedAttendance] = useState<"var" | "yok" | null>(
    currentAttendance?.status || null
  );
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (currentAttendance?.status) {
      setSelectedAttendance(currentAttendance.status);
    }
  }, [currentAttendance?.status]);

  const handleSelectAttendance = (status: "var" | "yok") => {
    setSelectedAttendance(status);
    if (currentAttendance?.status !== status) {
      setJustSaved(false);
    }
  };

  const handleSaveAttendance = () => {
    if (!selectedAttendance) {
      showToast("Lütfen 'Varım' veya 'Yokum' seçeneklerinden birini işaretleyiniz.");
      return;
    }
    setJustSaved(true);
    if (onSaveMealAttendance) {
      onSaveMealAttendance(selectedAttendance);
    }
    showToast(
      selectedAttendance === "var"
        ? "Yemek tercihiniz 'Varım (Katılacağım)' olarak kaydedildi!"
        : "Yemek tercihiniz 'Yokum (Katılmayacağım)' olarak kaydedildi!"
    );
  };

  let katDisplay: string | number = "-";
  if (matchedRoom?.kat !== undefined) {
    katDisplay = matchedRoom.kat === 0 ? "Zemin" : matchedRoom.kat;
  } else if (odaNo && odaNo !== "-") {
    const digitMatch = odaNo.match(/\d+/);
    if (digitMatch && digitMatch[0].length >= 3) {
      katDisplay = digitMatch[0][0];
    } else {
      katDisplay = "-";
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

    const { formattedRange, startMinutes: newStart, endMinutes: newEnd } = parseSlotMinutes(selectedStartTime);
    const cleanSelectedMachine = cleanMachineName(selectedMachine);
    const todayKey = getTodayDateKey();
    const isToday = normalizeDateStr(selectedLaundryDate) === todayKey;

    // Seçilen makine ve saat aralığında çakışan mevcut randevuları (asil ve varsa yedekler) bul
    const conflictingSlots = laundrySlots.filter((s) => {
      const slotClean = cleanMachineName(s.makineNo);
      const isSameMachine = slotClean === cleanSelectedMachine || s.makineNo === selectedMachine;
      const isSameDate = normalizeDateStr(s.tarih) === normalizeDateStr(selectedLaundryDate);
      if (!isSameMachine || !isSameDate || s.durum === "İptal" || s.durum === "Tamamlandı") {
        return false;
      }
      const { startMinutes: existingStart, endMinutes: existingEnd } = parseSlotMinutes(s.saatAraligi);
      return Math.max(newStart, existingStart) < Math.min(newEnd, existingEnd);
    });

    // Öğrenci zaten bu makine ve saat diliminde randevu almış mı veya sıraya girmiş mi?
    const alreadyBookedByMe = conflictingSlots.some(
      (s) => s.ogrenciAd.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
    );

    if (alreadyBookedByMe) {
      showToast("Bu makine ve saat aralığında zaten bir randevunuz veya bekleme sıranız bulunmaktadır.");
      return;
    }

    // Eğer saat çakışması varsa öğrenciyi engellemek yerine YEDEK BEKLEME SIRASINA (STANDBY QUEUE) al
    if (conflictingSlots.length > 0) {
      const queuePosition = conflictingSlots.length; // 1 asil varsa bu öğrenci Yedek #1, 1 asil + 1 yedek varsa Yedek #2
      const newSlot: LaundrySlot = {
        id: "lnd-" + Date.now(),
        ogrenciAd: currentUser.name,
        odaNo: odaNo,
        makineNo: cleanMachineName(selectedMachine),
        tarih: selectedLaundryDate,
        saatAraligi: formattedRange,
        program: selectedMachine.includes("Kurutma") ? "Kurutma & Havalandırma" : "Renkli & Karışık",
        durum: "Sırada",
        not: `Yedek Sıra (#${queuePosition})`,
      };

      onAddLaundrySlot(newSlot);
      setSelectedStartTime("");
      showToast(
        `Seçilen saat dolu olduğu için Bekleme Sırasına alındınız (Yedek Sıra #${queuePosition}). Asil randevu iptal edilirse sıranız otomatik onaylanacaktır.`
      );
      return;
    }

    // Makine ve saat müsait -> Asil Randevu Oluştur
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
      not: "Asil Randevu",
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
              className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-2 ${isActive
                  ? "bg-[#0284C7] text-white border border-[#0369A1] shadow-xs"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] hover:bg-white dark:hover:bg-[#0F172A]"
                }`}
            >
              <span className="w-4 h-4 flex items-center justify-center">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive ? "bg-white text-[#0284C7]" : "bg-rose-600 text-white"
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

            {/* Yemek Katılım Bildirimi (Varım / Yokum & Kaydet) */}
            <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#334155] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                  Yemek Katılımı
                </span>
                {currentAttendance?.status && (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${currentAttendance.status === "var"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                      }`}
                  >
                    Seçim: {currentAttendance.status === "var" ? "Varım" : "Yokum"}
                  </span>
                )}
              </div>

              {(() => {
                const isSaved = Boolean(
                  justSaved ||
                  (currentAttendance?.status && currentAttendance.status === selectedAttendance)
                );
                const isUpdate = Boolean(
                  currentAttendance?.status && selectedAttendance && currentAttendance.status !== selectedAttendance
                );

                return (
                  <div className="flex items-center gap-2">
                    {/* Varım Butonu */}
                    <button
                      type="button"
                      onClick={() => handleSelectAttendance("var")}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px] active:scale-95 ${selectedAttendance === "var"
                          ? "bg-emerald-600 text-white shadow-xs font-black ring-2 ring-emerald-500/30"
                          : "bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F1F5F9] border border-[#E2E8F0] dark:border-[#334155] hover:border-emerald-500"
                        }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${selectedAttendance === "var" ? "bg-white" : "bg-emerald-500"}`} />
                      Varım
                    </button>

                    {/* Yokum Butonu */}
                    <button
                      type="button"
                      onClick={() => handleSelectAttendance("yok")}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px] active:scale-95 ${selectedAttendance === "yok"
                          ? "bg-rose-600 text-white shadow-xs font-black ring-2 ring-rose-500/30"
                          : "bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F1F5F9] border border-[#E2E8F0] dark:border-[#334155] hover:border-rose-500"
                        }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${selectedAttendance === "yok" ? "bg-white" : "bg-rose-500"}`} />
                      Yokum
                    </button>

                    {/* Kaydet / Kaydedildi / Güncelle Butonu */}
                    {isSaved ? (
                      <button
                        type="button"
                        disabled
                        className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs sm:text-sm rounded-xl shadow-xs min-h-[44px] flex items-center justify-center gap-1.5 cursor-default transition-all"
                      >
                        <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Kaydedildi</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSaveAttendance}
                        disabled={!selectedAttendance}
                        className="px-5 py-2 bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all shadow-xs active:scale-95 min-h-[44px] flex items-center justify-center gap-1.5"
                      >
                        <span>{isUpdate ? "Güncelle" : "Kaydet"}</span>
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Günün Menüsünü Değerlendir (Puanlama & Yorum) */}
            <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#334155] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <span className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] block">
                    Günün Menüsünü Değerlendir
                  </span>
                  <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                    Yemek kalitesi ve lezzeti hakkında yurt yönetimine anlık geri bildirim iletin
                  </span>
                </div>
                {todayUserRating && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1 self-start sm:self-auto">
                    <svg className="w-3 h-3 fill-amber-500 text-amber-500" viewBox="0 0 24 24">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {todayUserRating.rating} / 5 Puan Verildi
                  </span>
                )}
              </div>

              {/* Yıldız Puanlama */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = star <= (hoverRating || currentRating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCurrentRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 -m-1 text-slate-300 dark:text-slate-600 hover:scale-110 transition-transform cursor-pointer"
                        title={`${star} Yıldız`}
                      >
                        <svg
                          className={`w-6 h-6 transition-colors ${
                            isActive
                              ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                              : "fill-transparent stroke-current"
                          }`}
                          viewBox="0 0 24 24"
                          strokeWidth="1.75"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300 ml-1">
                  {currentRating === 5 && "Mükemmel (5/5)"}
                  {currentRating === 4 && "Çok İyi (4/5)"}
                  {currentRating === 3 && "Orta (3/5)"}
                  {currentRating === 2 && "Geliştirilmeli (2/5)"}
                  {currentRating === 1 && "Yetersiz (1/5)"}
                  {currentRating === 0 && "Puan seçin"}
                </span>
              </div>

              {/* Yorum Kutusu */}
              <div className="space-y-1.5">
                <textarea
                  rows={2}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Yemekler nasıldı? Lezzet, porsiyon, sıcaklık veya önerilerinizi yazabilirsiniz (Yöneticiye anlık iletilir)..."
                  className="w-full bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-3 py-2 text-xs text-[#0F172A] dark:text-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 resize-none leading-relaxed shadow-2xs transition-colors"
                />
              </div>

              {/* Gönder Butonu */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (currentRating === 0) {
                      showToast("Lütfen en az 1 yıldız puan verin.");
                      return;
                    }
                    onSaveMealRating?.(currentRating, ratingComment);
                    showToast(todayUserRating ? "Değerlendirmeniz güncellendi." : "Yemek değerlendirmeniz yöneticiye iletildi!");
                  }}
                  disabled={currentRating === 0}
                  className="px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs active:scale-95 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>{todayUserRating ? "Değerlendirmeyi Güncelle" : "Değerlendirmeyi Gönder"}</span>
                </button>
              </div>
            </div>
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
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${anc.oncelik === "Acil"
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

          {/* Çamaşırhane Doluluk Durumu (Yıkama ve Kurutma Ayrı Kartlar) */}
          {(() => {
            const todayKey = getTodayDateKey();
            const machinesList = laundryMachines;

            const isMachineBusy = (m: (typeof machinesList)[0]) => {
              const cleanId = cleanMachineName(m.id);
              const cleanName = cleanMachineName(m.name || m.id);
              return laundrySlots.some((slot) => {
                const slotClean = cleanMachineName(slot.makineNo);
                return (
                  (slotClean === cleanId || slotClean === cleanName || slot.makineNo === m.id) &&
                  normalizeDateStr(slot.tarih) === todayKey &&
                  slot.durum !== "İptal" &&
                  getDynamicSlotStatus(slot) === "Yıkanıyor"
                );
              });
            };

            const washMachines = machinesList.filter((m) => m.tur !== "kurutma");
            const dryMachines = machinesList.filter((m) => m.tur === "kurutma");

            const washTotal = washMachines.length;
            const washBusy = washMachines.filter(isMachineBusy).length;
            const washFree = Math.max(0, washTotal - washBusy);
            const washPercent = washTotal > 0 ? Math.round((washBusy / washTotal) * 100) : 0;

            const dryTotal = dryMachines.length;
            const dryBusy = dryMachines.filter(isMachineBusy).length;
            const dryFree = Math.max(0, dryTotal - dryBusy);
            const dryPercent = dryTotal > 0 ? Math.round((dryBusy / dryTotal) * 100) : 0;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {/* Yıkama Doluluk Durumu */}
                <div className="bg-white dark:bg-[#1E293B] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm sm:text-base font-bold text-stone-900 dark:text-[#F1F5F9]">
                      Yıkama Doluluk Durumu
                    </h4>
                    <span className="text-sm sm:text-base font-bold text-amber-500 dark:text-amber-400">
                      %{washPercent} Dolu
                    </span>
                  </div>

                  {/* İlerleme Çubuğu (Gradient Bar) */}
                  <div className="w-full h-2.5 bg-stone-100 dark:bg-[#0F172A] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500"
                      style={{ width: `${washPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500 dark:text-stone-400 font-medium">
                      {washBusy} Makine Çalışıyor
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {washFree} Makine Müsait (Boş)
                    </span>
                  </div>
                </div>

                {/* Kurutma Doluluk Durumu */}
                <div className="bg-white dark:bg-[#1E293B] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm sm:text-base font-bold text-stone-900 dark:text-[#F1F5F9]">
                      Kurutma Doluluk Durumu
                    </h4>
                    <span className="text-sm sm:text-base font-bold text-amber-500 dark:text-amber-400">
                      %{dryPercent} Dolu
                    </span>
                  </div>

                  {/* İlerleme Çubuğu (Gradient Bar) */}
                  <div className="w-full h-2.5 bg-stone-100 dark:bg-[#0F172A] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500"
                      style={{ width: `${dryPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500 dark:text-stone-400 font-medium">
                      {dryBusy} Makine Çalışıyor
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {dryFree} Makine Müsait (Boş)
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

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
                  {(() => {
                    const todayKey = getTodayDateKey();
                    const isSelectedDateToday = normalizeDateStr(selectedLaundryDate) === todayKey;
                    const machinesList = laundryMachines;

                    const checkMachineBusy = (name: string, id: string) => {
                      const cleanName = cleanMachineName(name || id);
                      return laundrySlots.some((slot) => {
                        const slotClean = cleanMachineName(slot.makineNo);
                        return (
                          (slotClean === cleanName || slot.makineNo === id) &&
                          normalizeDateStr(slot.tarih) === todayKey &&
                          slot.durum !== "İptal" &&
                          getDynamicSlotStatus(slot) === "Yıkanıyor"
                        );
                      });
                    };

                    const isSelectedMachineBusy = isSelectedDateToday && checkMachineBusy(selectedMachine, selectedMachine);

                    return (
                      <>
                        <label className="text-stone-600 dark:text-[#94A3B8] block mb-1 font-semibold">Makine Seçimi</label>
                        <select
                          value={selectedMachine}
                          onChange={(e) => setSelectedMachine(e.target.value)}
                          className={`w-full bg-[#F8FAFC] dark:bg-[#0F172A] border rounded-xl p-2.5 text-stone-900 dark:text-[#F1F5F9] font-medium focus:outline-none transition-colors ${isSelectedMachineBusy
                              ? "border-amber-400 dark:border-amber-600"
                              : "border-[#E2E8F0] dark:border-[#334155] focus:border-[#0284C7]"
                            }`}
                        >
                          {machinesList.map((m) => {
                            const cleanName = cleanMachineName(m.name || m.id);
                            const isBusy = isSelectedDateToday && checkMachineBusy(m.name || m.id, m.id);
                            const turLabel = m.tur === "kurutma" ? "Kurutma" : "Yıkama";
                            return (
                              <option key={m.id} value={cleanName}>
                                {cleanName} ({turLabel}) {isBusy ? "• Şu an Çalışıyor (Sıraya / İleri Saate Girilebilir)" : "• Müsait"}
                              </option>
                            );
                          })}
                        </select>

                        {isSelectedMachineBusy && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>Bu makine şu anda çalışıyor. Müsait bir saat seçebilir veya dolu bir saate yedek sıraya girebilirsiniz.</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
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

              {(() => {
                let isConflict = false;
                let queuePosition = 0;
                if (selectedStartTime.trim()) {
                  try {
                    const { formattedRange, startMinutes: newStart, endMinutes: newEnd } = parseSlotMinutes(selectedStartTime);
                    const cleanSelected = cleanMachineName(selectedMachine);
                    const conflicts = laundrySlots.filter((s) => {
                      const slotClean = cleanMachineName(s.makineNo);
                      const isSameMachine = slotClean === cleanSelected || s.makineNo === selectedMachine;
                      const isSameDate = normalizeDateStr(s.tarih) === normalizeDateStr(selectedLaundryDate);
                      if (!isSameMachine || !isSameDate || s.durum === "İptal" || s.durum === "Tamamlandı") return false;
                      const { startMinutes: existingStart, endMinutes: existingEnd } = parseSlotMinutes(s.saatAraligi);
                      return Math.max(newStart, existingStart) < Math.min(newEnd, existingEnd);
                    });
                    isConflict = conflicts.length > 0;
                    queuePosition = conflicts.length;
                  } catch { }
                }

                return (
                  <div className="space-y-2 pt-1">
                    {isConflict && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
                        <svg className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <div>
                          <div className="font-bold text-amber-900 dark:text-amber-100">Bu Saat Aralığı Dolu</div>
                          <p className="mt-0.5 text-[11px] leading-relaxed">
                            Seçtiğiniz makine ve saatte asil bir randevu bulunmaktadır. Randevunun iptal edilmesi ihtimaline karşı <strong>Yedek Bekleme Sırasına (Sıra #{queuePosition})</strong> katılabilirsiniz.
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className={`w-full py-2.5 font-bold rounded-xl transition-all min-h-[44px] shadow-xs active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${
                        isConflict
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "bg-[#0284C7] hover:bg-[#0369A1] text-white"
                      }`}
                    >
                      {isConflict ? (
                        <>
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>Yedek Sıraya Gir (Bekleme Sırası #{queuePosition})</span>
                        </>
                      ) : (
                        <span>Randevuyu Onayla</span>
                      )}
                    </button>
                  </div>
                );
              })()}
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
                  const isWaitlist = slot.not?.includes("Yedek");
                  const isPromoted = slot.not?.includes("Yükseltildi");

                  return (
                    <div
                      key={slot.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-[#0F172A] dark:text-[#F1F5F9]">
                            {cleanMachineName(slot.makineNo)}
                          </span>

                          {isWaitlist ? (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 flex items-center gap-1.5">
                              <svg className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              <span>{slot.not?.split(" - ")[0] || "Yedek Sıra"}</span>
                            </span>
                          ) : isPromoted ? (
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 flex items-center gap-1.5">
                              <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Asil Randevuya Yükseltildi</span>
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentStatus === "Yıkanıyor"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                  : currentStatus === "Sırada"
                                    ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800"
                                    : currentStatus === "İptal"
                                      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                                      : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                                }`}
                            >
                              {currentStatus} (Asil)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                          Tarih: <strong className="text-[#0F172A] dark:text-[#F1F5F9]">{slot.tarih}</strong> • Saat: <strong className="text-[#0F172A] dark:text-[#F1F5F9]">{slot.saatAraligi}</strong>
                        </p>
                        {isWaitlist && (
                          <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>Asil randevu iptal edilirse sıranız otomatik olarak onaylanacaktır.</span>
                          </p>
                        )}
                        {isPromoted && (
                          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <span>Önceki randevu iptal edildiği için sıranız asil randevuya dönüştürüldü.</span>
                          </p>
                        )}
                      </div>

                      {onCancelLaundrySlot && currentStatus !== "Tamamlandı" && currentStatus !== "İptal" && (
                        <button
                          type="button"
                          onClick={() => setCancelConfirmSlot(slot)}
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

            {/* Randevu İptal Onay Modalı */}
            {cancelConfirmSlot && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Randevuyu İptal Et
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {cleanMachineName(cancelConfirmSlot.makineNo)} • {cancelConfirmSlot.saatAraligi}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    {cancelConfirmSlot.not?.includes("Yedek") ? (
                      <span>Bu bekleme sırası rezervasyonunu iptal etmek istediğinizden emin misiniz? Sıranız listeden kalıcı olarak kaldırılacaktır.</span>
                    ) : (
                      <span>Bu asil randevuyu iptal etmek istediğinizden emin misiniz? Varsa bekleme sırasındaki ilk öğrenci otomatik olarak randevuyu devralacaktır.</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setCancelConfirmSlot(null)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onCancelLaundrySlot) {
                          onCancelLaundrySlot(cancelConfirmSlot.id);
                        }
                        setCancelConfirmSlot(null);
                        showToast("Randevunuz iptal edildi.");
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-xs"
                    >
                      Evet, İptal Et
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* ÇAMAŞIRHANE REZERVASYON VE DOLULUK TAKVİMİ               */}
          {/* ======================================================== */}
          {(() => {
            const turkishMonthNames = [
              "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
              "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
            ];
            const currentMonthLabel = `${turkishMonthNames[laundryViewMonth]} ${laundryViewYear}`;

            const daysInCurrentMonth = new Date(laundryViewYear, laundryViewMonth + 1, 0).getDate();
            const firstDayWeekday = (new Date(laundryViewYear, laundryViewMonth, 1).getDay() + 6) % 7;
            const daysInPreviousMonth = new Date(laundryViewYear, laundryViewMonth, 0).getDate();

            const prevM = laundryViewMonth === 0 ? 11 : laundryViewMonth - 1;
            const prevY = laundryViewMonth === 0 ? laundryViewYear - 1 : laundryViewYear;
            const prevMonthDays = [];
            for (let i = firstDayWeekday - 1; i >= 0; i--) {
              const dayNum = daysInPreviousMonth - i;
              const dateStr = `${prevY}-${String(prevM + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              prevMonthDays.push({
                dateStr,
                dayNum,
                isCurrentMonth: false,
                year: prevY,
                month: prevM,
              });
            }

            const currentMonthDays = [];
            for (let d = 1; d <= daysInCurrentMonth; d++) {
              const dateStr = `${laundryViewYear}-${String(laundryViewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              currentMonthDays.push({
                dateStr,
                dayNum: d,
                isCurrentMonth: true,
                year: laundryViewYear,
                month: laundryViewMonth,
              });
            }

            const totalSoFar = prevMonthDays.length + currentMonthDays.length;
            const trailingDaysNeeded = (7 - (totalSoFar % 7)) % 7;
            const nextM = laundryViewMonth === 11 ? 0 : laundryViewMonth + 1;
            const nextY = laundryViewMonth === 11 ? laundryViewYear + 1 : laundryViewYear;
            const nextMonthDays = [];
            for (let d = 1; d <= trailingDaysNeeded; d++) {
              const dateStr = `${nextY}-${String(nextM + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              nextMonthDays.push({
                dateStr,
                dayNum: d,
                isCurrentMonth: false,
                year: nextY,
                month: nextM,
              });
            }

            const calendarCells = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

            const todayObj = new Date();
            const todayDateStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;

            const goToPrevMonth = () => {
              if (laundryViewMonth === 0) {
                setLaundryViewYear((y) => y - 1);
                setLaundryViewMonth(11);
              } else {
                setLaundryViewMonth((m) => m - 1);
              }
            };

            const goToNextMonth = () => {
              if (laundryViewMonth === 11) {
                setLaundryViewYear((y) => y + 1);
                setLaundryViewMonth(0);
              } else {
                setLaundryViewMonth((m) => m + 1);
              }
            };

            const goToToday = () => {
              const now = new Date();
              setLaundryViewYear(now.getFullYear());
              setLaundryViewMonth(now.getMonth());
              const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
              setSelectedLaundryDate(nowStr);
            };

            const activeDate = selectedLaundryDate || todayDateStr;
            const daySlots = laundrySlots.filter((s) => normalizeDateStr(s.tarih) === activeDate);
            const filteredSlots = daySlots.filter((s) => {
              if (laundryMachineFilter === "all") return true;
              if (laundryMachineFilter === "yikama") return s.makineNo.includes("Makine") || laundryMachines.find(m => m.id === s.makineNo)?.tur === "yikama";
              if (laundryMachineFilter === "kurutma") return s.makineNo.includes("Kurutma") || laundryMachines.find(m => m.id === s.makineNo)?.tur === "kurutma";
              return s.makineNo === laundryMachineFilter;
            });

            // Seçili günün haftalık gün şeridi
            const [selY, selM, selD] = activeDate.split("-").map(Number);
            const selectedDateObj = new Date(selY || todayObj.getFullYear(), (selM ? selM - 1 : todayObj.getMonth()), selD || todayObj.getDate());
            const dayOfWeekIdx = (selectedDateObj.getDay() + 6) % 7;
            const mondayDateObj = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate() - dayOfWeekIdx);

            const weekStripDays = [];
            const shortDayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
            for (let i = 0; i < 7; i++) {
              const dObj = new Date(mondayDateObj.getFullYear(), mondayDateObj.getMonth(), mondayDateObj.getDate() + i);
              const dateStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, "0")}-${String(dObj.getDate()).padStart(2, "0")}`;
              const slotsCount = laundrySlots.filter(s => normalizeDateStr(s.tarih) === dateStr && s.durum !== "İptal").length;
              const activeCount = laundrySlots.filter(s => normalizeDateStr(s.tarih) === dateStr && s.durum === "Yıkanıyor").length;
              weekStripDays.push({
                dateStr,
                dayNum: dObj.getDate(),
                dayName: shortDayNames[i],
                isToday: dateStr === todayDateStr,
                isSelected: dateStr === activeDate,
                slotsCount,
                activeCount,
              });
            }

            const timelineSlots = [
              "08:00 - 09:30",
              "09:30 - 11:00",
              "11:00 - 12:30",
              "13:00 - 14:30",
              "14:30 - 16:00",
              "16:00 - 17:30",
              "17:30 - 19:00",
              "19:00 - 20:30",
              "20:30 - 22:00",
            ];

            const formatLaundryTurkishDate = (dateStr: string) => {
              if (!dateStr) return "";
              const parts = dateStr.split("-").map(Number);
              if (parts.length !== 3) return dateStr;
              const [y, m, d] = parts;
              const dateObj = new Date(y, m - 1, d);
              const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
              const monthNames = [
                "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
                "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
              ];
              return `${d} ${monthNames[m - 1] || ""} ${y} – ${dayNames[dateObj.getDay()] || ""}`;
            };

            return (
              <div className="bg-white dark:bg-[#1E293B] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] dark:border-[#334155] shadow-xs space-y-4">
                {/* Takvim Üst Başlığı */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] dark:border-[#334155] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-[#0284C7] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-stone-900 dark:text-[#F1F5F9]">
                        Çamaşırhane Doluluk & Randevu Takvimi
                      </h4>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        Günü seçerek dolu ve müsait saatleri inceleyebilirsiniz.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-0.5">
                      <button
                        type="button"
                        onClick={() => setLaundryCalendarView("month")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                          laundryCalendarView === "month"
                            ? "bg-[#0284C7] text-white shadow-xs"
                            : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]"
                        }`}
                      >
                        Aylık
                      </button>
                      <button
                        type="button"
                        onClick={() => setLaundryCalendarView("day")}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                          laundryCalendarView === "day"
                            ? "bg-[#0284C7] text-white shadow-xs"
                            : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9]"
                        }`}
                      >
                        Günlük Çizelge
                      </button>
                    </div>
                  </div>
                </div>

                {/* GÖRÜNÜM 1: AYLIK TAKVİM */}
                {laundryCalendarView === "month" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                          {currentMonthLabel}
                        </h5>
                        <div className="flex items-center gap-1 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={goToPrevMonth}
                            className="w-6 h-6 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] text-xs font-bold cursor-pointer"
                          >
                            &lt;
                          </button>
                          <button
                            type="button"
                            onClick={goToNextMonth}
                            className="w-6 h-6 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] text-xs font-bold cursor-pointer"
                          >
                            &gt;
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={goToToday}
                        className="px-2.5 py-1 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#0F172A] hover:bg-[#F1F5F9] border border-[#E2E8F0] dark:border-[#334155] rounded-lg transition-colors cursor-pointer"
                      >
                        Bugün
                      </button>
                    </div>

                    {/* Hafta Günleri Başlıkları */}
                    <div className="grid grid-cols-7 text-center border-b border-[#E2E8F0] dark:border-[#334155] pb-2">
                      {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((dName) => (
                        <span key={dName} className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase">
                          {dName}
                        </span>
                      ))}
                    </div>

                    {/* Günler Izgarası */}
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                      {calendarCells.map((cell) => {
                        const slotsForDay = laundrySlots.filter(
                          (s) => normalizeDateStr(s.tarih) === cell.dateStr && s.durum !== "İptal"
                        );
                        const isToday = cell.dateStr === todayDateStr;
                        const isSelected = activeDate === cell.dateStr;

                        return (
                          <button
                            key={cell.dateStr}
                            type="button"
                            onClick={() => {
                              setSelectedLaundryDate(cell.dateStr);
                              if (!cell.isCurrentMonth) {
                                setLaundryViewYear(cell.year);
                                setLaundryViewMonth(cell.month);
                              }
                              setLaundryCalendarView("day");
                            }}
                            className={`p-2 rounded-xl flex flex-col items-center justify-center min-h-[50px] transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[#0284C7] text-white shadow-xs font-bold"
                                : isToday
                                  ? "bg-sky-50 dark:bg-sky-950/40 text-[#0284C7] dark:text-sky-300 font-bold border border-sky-300 dark:border-sky-800"
                                  : cell.isCurrentMonth
                                    ? "bg-[#F8FAFC] dark:bg-[#0F172A] text-stone-900 dark:text-[#F1F5F9] hover:bg-slate-100 dark:hover:bg-slate-800"
                                    : "text-slate-400 dark:text-slate-600 bg-transparent"
                            }`}
                          >
                            <span className="text-xs">{cell.dayNum}</span>
                            {slotsForDay.length > 0 && (
                              <span
                                className={`mt-1 text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                  isSelected
                                    ? "bg-white text-[#0284C7]"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                }`}
                              >
                                {slotsForDay.length} Randevu
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* GÖRÜNÜM 2: GÜNLÜK ÇİZELGE */}
                {laundryCalendarView === "day" && (
                  <div className="space-y-4">
                    {/* Hafta Şeridi */}
                    <div className="grid grid-cols-7 gap-1 text-center bg-[#F8FAFC] dark:bg-[#0F172A] p-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155]">
                      {weekStripDays.map((wd) => (
                        <button
                          key={wd.dateStr}
                          type="button"
                          onClick={() => setSelectedLaundryDate(wd.dateStr)}
                          className={`flex flex-col items-center py-1.5 rounded-lg cursor-pointer transition-all ${
                            wd.isSelected
                              ? "bg-[#0284C7] text-white font-bold"
                              : wd.isToday
                                ? "bg-sky-100 dark:bg-sky-950/60 text-[#0284C7] font-semibold"
                                : "text-stone-700 dark:text-stone-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span className="text-[10px] uppercase">{wd.dayName}</span>
                          <span className="text-xs font-bold mt-0.5">{wd.dayNum}</span>
                          {wd.slotsCount > 0 && (
                            <span className={`w-1.5 h-1.5 rounded-full mt-1 ${wd.isSelected ? "bg-white" : "bg-[#0284C7]"}`} />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] dark:border-[#334155] pb-2">
                      <span className="text-xs font-bold text-stone-900 dark:text-[#F1F5F9]">
                        {formatLaundryTurkishDate(activeDate)}
                      </span>
                      <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        Bu gün için {daySlots.length} randevu mevcut
                      </span>
                    </div>

                    {/* Saat Dilimleri Listesi */}
                    <div className="space-y-2">
                      {timelineSlots.map((slotRange) => {
                        const matchingBookings = filteredSlots.filter((b) => b.saatAraligi === slotRange && b.durum !== "İptal");
                        const asilBookings = matchingBookings.filter((b) => !b.not?.includes("Yedek"));
                        const waitlistBookings = matchingBookings.filter((b) => b.not?.includes("Yedek"));
                        const isSlotOccupied = asilBookings.length >= laundryMachines.length && laundryMachines.length > 0;

                        return (
                          <div
                            key={slotRange}
                            className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                              isSlotOccupied
                                ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40"
                                : matchingBookings.length > 0
                                  ? "bg-sky-50/40 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/40"
                                  : "bg-[#F8FAFC] dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155]"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                              <span className="font-mono text-xs font-bold text-stone-800 dark:text-stone-200 min-w-[105px] shrink-0 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span>{slotRange}</span>
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                {matchingBookings.length === 0 ? (
                                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    Tüm makineler müsait
                                  </span>
                                ) : (
                                  <>
                                    {asilBookings.map((bk) => (
                                      <span
                                        key={bk.id}
                                        className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-stone-800 dark:text-stone-200 font-medium flex items-center gap-1.5"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                        <span>{cleanMachineName(bk.makineNo)}: {formatInitials(bk.ogrenciAd)}</span>
                                      </span>
                                    ))}
                                    {waitlistBookings.map((bk) => (
                                      <span
                                        key={bk.id}
                                        className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 font-semibold flex items-center gap-1.5"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                                        <span>{cleanMachineName(bk.makineNo)}: {formatInitials(bk.ogrenciAd)} ({bk.not?.split(" - ")[0] || "Yedek"})</span>
                                      </span>
                                    ))}
                                  </>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStartTime(slotRange.split(" - ")[0]);
                                window.scrollTo({ top: 300, behavior: "smooth" });
                                if (isSlotOccupied) {
                                  showToast(`${slotRange} saati dolu; randevu formuna aktarıldı, Yedek Sıraya girebilirsiniz.`);
                                } else {
                                  showToast(`${slotRange} saati randevu formuna aktarıldı.`);
                                }
                              }}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer self-end sm:self-center shrink-0 ${
                                isSlotOccupied
                                  ? "text-amber-700 dark:text-amber-300 hover:text-white hover:bg-amber-600 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700"
                                  : "text-[#0284C7] hover:text-white hover:bg-[#0284C7] bg-sky-50 dark:bg-sky-950/40 border border-[#0284C7]/30"
                              }`}
                            >
                              {isSlotOccupied ? `Yedek Sıraya Gir (#${waitlistBookings.length + 1})` : "Bu Saati Seç"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
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
                    kategori: (katInput.value as MaintenanceTicket["kategori"]) || "Tesisat",
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
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${t.durum?.startsWith("Çözüldü")
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : t.durum === "İnceleniyor"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-rose-100 text-rose-800 border border-rose-300"
                            }`}
                        >
                          {t.durum}
                        </span>
                      </div>

                      {/* Onarım Çözüldü ise Hizmet Memnuniyeti Belirtme */}
                      {t.durum?.startsWith("Çözüldü") && (
                        <div className="mt-2 pt-2 border-t border-[#E2E8F0] dark:border-[#334155] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-emerald-50/60 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                          <div className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">Onarım Tamamlandı:</span> Hizmetten memnun kaldınız mı?
                          </div>
                          {t.memnuniyet ? (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                t.memnuniyet === "evet"
                                  ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700"
                                  : "bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700"
                              }`}
                            >
                              {t.memnuniyet === "evet" ? (
                                <>
                                  <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  Memnun Kaldınız
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                  Sorun Devam Ediyor
                                </>
                              )}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  onRateMaintenanceTicket?.(t.id, "evet");
                                  showToast("Geri bildiriminiz için teşekkürler! (Memnun kaldınız)");
                                }}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center gap-1 shadow-xs active:scale-95"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Evet, Memnun Kaldım
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onRateMaintenanceTicket?.(t.id, "hayir");
                                  showToast("Geri bildiriminiz iletildi, teşekkür ederiz.");
                                }}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                Hayır, Sorun Devam Ediyor
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-[#E2E8F0]">
                        <div className="flex items-center gap-1.5">
                          <span>Kategori: {t.kategori}</span>
                          <span>•</span>
                          <span>{t.tarih}</span>
                        </div>
                        {onDeleteMaintenanceTicket && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`"${t.baslik}" arıza kaydınızı silmek istediğinize emin misiniz?`)) {
                                onDeleteMaintenanceTicket(t.id);
                                showToast("Arıza bildirimi silindi.");
                              }
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer min-h-[30px] flex items-center justify-center active:scale-95"
                            title="Arıza talebini sil"
                          >
                            Talebi Sil
                          </button>
                        )}
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
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${openSettingsSections.guvenlik
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
                  className={`w-8 h-8 rounded-xl flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] transition-transform duration-300 ${openSettingsSections.guvenlik ? "rotate-180 bg-[#F1F5F9] dark:bg-[#1E293B]" : ""
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
                        placeholder="ogrenci@eposta.com"
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
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${openSettingsSections.tema
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
                  className={`w-8 h-8 rounded-xl flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] transition-transform duration-300 ${openSettingsSections.tema ? "rotate-180 bg-[#F1F5F9] dark:bg-[#1E293B]" : ""
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Aydınlık Mod Seçeneği */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectTheme) {
                        onSelectTheme("light");
                      }
                    }}
                    className={`p-3.5 rounded-xl sm:rounded-2xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-3 min-h-[48px] active:scale-[0.99] ${themeMode === "light"
                        ? "border-[#0284C7] bg-[#F1F5F9] dark:bg-[#162032]"
                        : "border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] hover:border-[#CBD5E1] dark:hover:border-[#475569] hover:bg-white dark:hover:bg-[#1E293B]"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${themeMode === "light"
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
                        Aydınlık
                      </span>
                    </div>

                    {themeMode === "light" ? (
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
                      }
                    }}
                    className={`p-3.5 rounded-xl sm:rounded-2xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-3 min-h-[48px] active:scale-[0.99] ${themeMode === "dark"
                        ? "border-[#0284C7] bg-[#F1F5F9] dark:bg-[#162032]"
                        : "border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] hover:border-[#CBD5E1] dark:hover:border-[#475569] hover:bg-white dark:hover:bg-[#1E293B]"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${themeMode === "dark"
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
                        Karanlık
                      </span>
                    </div>

                    {themeMode === "dark" ? (
                      <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-[#CBD5E1] dark:border-[#475569] shrink-0" />
                    )}
                  </button>

                  {/* Sistem Varsayılanı Seçeneği */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectTheme) {
                        onSelectTheme("system");
                      }
                    }}
                    className={`p-3.5 rounded-xl sm:rounded-2xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-3 min-h-[48px] active:scale-[0.99] ${themeMode === "system"
                        ? "border-[#0284C7] bg-[#F1F5F9] dark:bg-[#162032]"
                        : "border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] hover:border-[#CBD5E1] dark:hover:border-[#475569] hover:bg-white dark:hover:bg-[#1E293B]"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${themeMode === "system"
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
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9] block truncate">
                          Sistem
                        </span>
                        <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block truncate">
                          Varsayılan
                        </span>
                      </div>
                    </div>

                    {themeMode === "system" ? (
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
      {/* GEÇİCİ ŞİFRE ZORUNLU DEĞİŞTİRME MODALI (ogrenci123)      */}
      {/* ======================================================== */}
      {isTemporaryPasswordActive && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl relative my-auto animate-in fade-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-[#0284C7] dark:text-[#38BDF8] shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  Geçici Şifrenizi Değiştiriniz
                </h3>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                  İlk Giriş Güvenlik Doğrulaması
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Hesabınıza geçici şifreniz ile giriş yaptınız. Güvenliğiniz için sisteme devam etmeden önce lütfen yeni ve kalıcı bir şifre belirleyiniz.
            </p>

            {forcedPasswordError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {forcedPasswordError}
              </div>
            )}

            <form onSubmit={handleForcedPasswordChange} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Yeni Şifre *
                </label>
                <input
                  type="password"
                  required
                  value={forcedNewPassword}
                  onChange={(e) => setForcedNewPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Yeni Şifre (Tekrar) *
                </label>
                <input
                  type="password"
                  required
                  value={forcedConfirmPassword}
                  onChange={(e) => setForcedConfirmPassword(e.target.value)}
                  placeholder="Yeni şifrenizi tekrar giriniz"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] min-h-[44px]"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isForcedUpdating}
                  className="w-full py-3 px-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-sm shadow-xs transition-colors cursor-pointer text-center min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isForcedUpdating ? "Kaydediliyor..." : "Yeni Şifremi Belirle ve Devam Et"}
                </button>

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer text-center min-h-[44px]"
                  >
                    Oturumu Kapat
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
