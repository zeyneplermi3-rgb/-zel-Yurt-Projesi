"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "../lib/supabaseClient";

import type {
  Role,
  Yurt,
  Student,
  Room,
  MaintenanceTicket,
  Announcement,
  LaundrySlot,
  LaundryMachine,
  MealAttendanceRecord,
} from "../types";
import {
  defaultStudents,
  defaultRooms,
  defaultLaundrySlots,
  defaultLaundryMachines,
  defaultMaintenanceTickets,
  defaultAnnouncements,
  defaultDailyMenu,
  defaultYurtSettings,
  defaultMealAttendance,
} from "../lib/initialData";
import {
  getTodayDateKey,
  getMsUntilMidnight,
  getAutoGunTipi,
  getResetDailyMenu,
  formatTurkishDate,
  DailyMenuType,
} from "../lib/menuUtils";
import {
  getDynamicSlotStatus,
  syncSlotsWithCurrentTime,
  parseSlotMinutes,
  normalizeDateStr,
  cleanMachineName,
} from "../lib/laundryUtils";
import AddYurtModal from "../components/modals/AddYurtModal";
import { AddRoomModal, EditRoomModal } from "../components/modals/RoomModals";
import {
  AddStudentModal,
  EditStudentModal,
  StudentDetailModal,
  NewStudentData,
} from "../components/modals/StudentModals";
import {
  AddMaintenanceModal,
  AddAnnouncementModal,
} from "../components/modals/MaintenanceAnnouncementModals";
import {
  AddLaundryModal,
  ManageMachinesModal,
} from "../components/modals/LaundryModals";
import StudentPortalView from "../components/student/StudentPortalView";
import MobileBottomNav from "../components/navigation/MobileBottomNav";
import MenuTimePickerModal from "../components/modals/MenuTimePickerModal";
import EntryTimeModal from "../components/modals/EntryTimeModal";



export default function Home() {
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<{
    role: Role;
    name: string;
    details: string;
    selectedYurtId?: string;
    selectedYurtName?: string;
  } | null>(null);

  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  const [activeRole, setActiveRole] = useState<Role>("superadmin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Karanlık / Aydınlık Mod State'i (Dark / Light Theme)
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("yurtify_theme") as "light" | "dark" | null;
      if (saved === "dark" || saved === "light") {
        setTheme(saved);
        if (saved === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
        document.documentElement.classList.add("dark");
      }
    } catch {
      // localStorage erişim güvenliği
    }
  }, []);

  const selectTheme = (selectedTheme: "light" | "dark", notify: boolean = false) => {
    setTheme(selectedTheme);
    try {
      localStorage.setItem("yurtify_theme", selectedTheme);
    } catch {
      // localStorage güvenliği
    }

    if (selectedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    if (notify) {
      showToast(selectedTheme === "dark" ? "Karanlık tema aktif edildi." : "Aydınlık tema aktif edildi.");
    }
  };

  const toggleTheme = () => {
    selectTheme(theme === "dark" ? "light" : "dark", true);
  };

  // Veritabanı ve Realtime Durumu
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);
  const [realtimeActive, setRealtimeActive] = useState<boolean>(false);

  // Yurtlar: Yalnızca veritabanındaki gerçek verileri tutar (başlangıçta boştur)
  const [yurtlar, setYurtlar] = useState<Yurt[]>([]);

  // ==========================================
  // YÖNETİCİ PANELİ STATE & VERİLERİ
  // ==========================================
  const [managerTab, setManagerTab] = useState<
    "anasayfa" | "odalar" | "ogrenciler" | "yemekhane" | "camasirhane" | "arizalar" | "duyurular" | "ayarlar"
  >("anasayfa");

  // Ayarlar Sekmesi Genişletilebilir Bölüm Butonları State'i
  const [openSettingsSections, setOpenSettingsSections] = useState<Record<string, boolean>>({
    bilgiler: false,
    guvenlik: false,
    kurallar: false,
    ogrenciler: false,
    yemekhane: false,
    camasirhane: false,
  });

  const toggleSettingsSection = (
    sectionKey: "ogrenciler" | "bilgiler" | "guvenlik" | "kurallar" | "yemekhane" | "camasirhane" | "yurt"
  ) => {
    setOpenSettingsSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Öğrenciler veya Duyurular doğrudan tetiklenirse uygun sekmeye yönlendir
  useEffect(() => {
    if (managerTab === "ogrenciler") {
      setManagerTab("ayarlar");
      setOpenSettingsSections((prev) => ({ ...prev, ogrenciler: true }));
    }
  }, [managerTab]);

  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Filtreler & Modallar
  const [studentSearch, setStudentSearch] = useState("");
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);

  // Oda Ekleme & Düzenleme State'leri
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [newRoom, setNewRoom] = useState({
    odaNo: "",
    blok: "A Blok",
    kat: 1,
    kapasite: 3,
    odaTipi: "Standart Balkonlu",
  });

  // Çamaşırhane Sırası & Takvim State'leri
  const [laundrySlots, setLaundrySlots] = useState<LaundrySlot[]>([]);
  const [laundryClockTick, setLaundryClockTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setLaundryClockTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Tüm çamaşırhane randevularının canlı saate göre anlık dinamik durumları
  const liveLaundrySlots = useMemo(() => {
    return laundrySlots.map((slot) => {
      const dynamicStatus = slot.durum === "İptal" ? "İptal" : getDynamicSlotStatus(slot);
      return {
        ...slot,
        makineNo: cleanMachineName(slot.makineNo),
        durum: dynamicStatus,
      };
    });
  }, [laundrySlots, laundryClockTick]);
  const [selectedLaundryDate, setSelectedLaundryDate] = useState<string>("");
  const [laundryViewYear, setLaundryViewYear] = useState<number>(2026);
  const [laundryViewMonth, setLaundryViewMonth] = useState<number>(9);
  const [laundryCalendarView, setLaundryCalendarView] = useState<"month" | "day">("month");
  const [isDayTimelineOpen, setIsDayTimelineOpen] = useState<boolean>(true);
  const [isLiveQueueExpanded, setIsLiveQueueExpanded] = useState<boolean>(true);
  const [liveQueueScope, setLiveQueueScope] = useState<"active" | "selected">("active");
  const [laundryMachineFilter, setLaundryMachineFilter] = useState<string>("all");
  const [isAddLaundryModalOpen, setIsAddLaundryModalOpen] = useState(false);
  const [newLaundry, setNewLaundry] = useState({
    ogrenciAd: "",
    odaNo: "101",
    makineNo: "Makine 1 (A-1)",
    tarih: "",
    saatAraligi: "09:00 - 10:30",
    program: "Renkli & Karışık" as "Renkli & Karışık" | "Beyazlar & Pamuklu" | "Hızlı Yıkama (30 dk)" | "Kurutma & Havalandırma",
    durum: "Sırada" as "Yıkanıyor" | "Sırada" | "Tamamlandı",
    not: "",
  });

  const [isManageMachinesModalOpen, setIsManageMachinesModalOpen] = useState(false);
  const [dailyLaundryLimit, setDailyLaundryLimit] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("yurtify_laundry_daily_limit");
      if (saved !== null) {
        return Number(saved);
      }
    }
    return 2;
  });

  const handleSetDailyLaundryLimit = (limit: number) => {
    const newLimit = Math.max(0, limit);
    setDailyLaundryLimit(newLimit);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_laundry_daily_limit", String(newLimit));
    }
    setYurtSettings((prev) => ({
      ...prev,
      camasirhaneGunlukLimit: newLimit,
    }));
    showToast(
      newLimit === 0
        ? "Günlük çamaşır atma kotası kaldırıldı (Sınırsız)."
        : `Günlük maksimum çamaşır hakkı ${newLimit} yıkama olarak belirlendi.`
    );
  };

  const [dailyDormLaundryLimit, setDailyDormLaundryLimit] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("yurtify_laundry_dorm_daily_limit");
      if (saved !== null) {
        return Number(saved);
      }
    }
    return 25;
  });

  const handleSetDailyDormLaundryLimit = (limit: number) => {
    const newLimit = Math.max(0, limit);
    setDailyDormLaundryLimit(newLimit);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_laundry_dorm_daily_limit", String(newLimit));
    }
    setYurtSettings((prev) => ({
      ...prev,
      camasirhaneYurtGunlukLimit: newLimit,
    }));
    showToast(
      newLimit === 0
        ? "Yurt geneli günlük çamaşır kapasitesi sınırı kaldırıldı (Sınırsız)."
        : `Yurt geneli günlük toplam kapasite ${newLimit} randevu olarak belirlendi.`
    );
  };
  const [settingsLaundryScope, setSettingsLaundryScope] = useState<"kisi" | "yurt">("kisi");
  const [laundryMachines, setLaundryMachines] = useState<LaundryMachine[]>([
    { id: "Makine 1 (A-1)", name: "Makine 1 (A Blok)", tip: "Yıkama • 9 kg", tur: "yikama", kapasiteKg: 9 },
    { id: "Makine 2 (A-2)", name: "Makine 2 (A Blok)", tip: "Yıkama • 9 kg", tur: "yikama", kapasiteKg: 9 },
    { id: "Makine 3 (B-1)", name: "Makine 3 (B Blok)", tip: "Yıkama • 8 kg", tur: "yikama", kapasiteKg: 8 },
    { id: "Makine 4 (B-2)", name: "Makine 4 (B Blok)", tip: "Yıkama • 8 kg", tur: "yikama", kapasiteKg: 8 },
    { id: "Kurutma 1 (K-1)", name: "Kurutma 1 (Merkez)", tip: "Kurutma • 10 kg", tur: "kurutma", kapasiteKg: 10 },
    { id: "Kurutma 2 (K-2)", name: "Kurutma 2 (Merkez)", tip: "Kurutma • 10 kg", tur: "kurutma", kapasiteKg: 10 },
  ]);
  const [newCustomMachine, setNewCustomMachine] = useState<{
    name: string;
    tur: "yikama" | "kurutma";
    kapasiteKg: string | number;
    blok: string;
  }>({
    name: "",
    tur: "yikama",
    kapasiteKg: "",
    blok: "",
  });

  const [isAddMaintenanceModalOpen, setIsAddMaintenanceModalOpen] = useState(false);
  const [isAddAnnouncementModalOpen, setIsAddAnnouncementModalOpen] = useState(false);

  // Form State'leri
  const [newStudent, setNewStudent] = useState<NewStudentData>({
    adSoyad: "",
    eposta: "",
    sifre: "",
    odaNo: "101",
    yatakNo: "1",
  });

  const [newMaintenance, setNewMaintenance] = useState({
    odaNo: "101",
    baslik: "",
    kategori: "Tesisat" as "Tesisat" | "Elektrik" | "İnternet" | "Mobilya" | "Diğer",
    oncelik: "Orta" as "Düşük" | "Orta" | "Acil",
    bildiren: "Öğrenci",
  });

  const [newAnnouncement, setNewAnnouncement] = useState({
    baslik: "",
    icerik: "",
    oncelik: "Normal" as "Normal" | "Önemli" | "Acil",
  });

  // Yemekhane Menüsü (Yönetici öğünler, saat tarifeleri ve kalori gösterimini seçebilir)
  const [dailyMenu, setDailyMenu] = useState<DailyMenuType>({
    gorunumModu: "birlikte",
    aktifOgun: "kahvalti",
    kaloriGoster: true,
    gunTipi: "haftaici",
    saatler: {
      haftaici: { kahvalti: "07:30 - 10:00", aksam: "18:00 - 20:30" },
      haftasonu: { kahvalti: "08:30 - 11:30", aksam: "18:30 - 21:00" },
      ozelgun: { kahvalti: "09:00 - 12:00", aksam: "19:00 - 21:30" },
    },
    kahvalti: "Haşlanmış Yumurta, Kaşar & Beyaz Peynir, Siyah Zeytin, Domates, Salatalık, Bal-Tereyağı, Sıcak Çay",
    kahvaltiSaat: "07:30 - 10:00",
    kahvaltiKalori: "650 kcal",
    aksam: "Mercimek Çorbası, Orman Kebabı, Şehriyeli Pirinç Pilavı, Mevsim Salatası, Fırın Sütlaç",
    aksamSaat: "18:00 - 20:30",
    aksamKalori: "1.200 kcal",
    tarih: "",
  });
  const [isEditingMenu, setIsEditingMenu] = useState(false);

  // Günlük Yemek Katılım Bildirimi State'i (Öğrenci Varım / Yokum tercihleri)
  const [mealAttendance, setMealAttendance] = useState<MealAttendanceRecord[]>([]);
  const [isAttendanceListOpen, setIsAttendanceListOpen] = useState(false);

  // Günün yemek katılım hesaplamaları (Müdürün göreceği sayılar)
  const todayMealDateKey = getTodayDateKey();
  const todayMealAttendance = useMemo(() => {
    return mealAttendance.filter((a) => a.date === todayMealDateKey);
  }, [mealAttendance, todayMealDateKey]);

  const attendingCount = useMemo(() => {
    return todayMealAttendance.filter((a) => a.status === "var").length;
  }, [todayMealAttendance]);

  const notAttendingCount = useMemo(() => {
    return todayMealAttendance.filter((a) => a.status === "yok").length;
  }, [todayMealAttendance]);

  // Zaman Seçici (Time Range Wheel Picker) Modalı State'i
  const [timePickerModal, setTimePickerModal] = useState<{
    isOpen: boolean;
    tip: "haftaici" | "haftasonu" | "ozelgun";
    field: "kahvalti" | "aksam";
    title: string;
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  }>({
    isOpen: false,
    tip: "haftaici",
    field: "kahvalti",
    title: "",
    startHour: 7,
    startMinute: 30,
    endHour: 10,
    endMinute: 0,
  });

  // Zaman Seçici açıldığında seçili saat ve dakikayı merkeze kaydır (Scroll into view)
  useEffect(() => {
    if (timePickerModal.isOpen) {
      const timer = setTimeout(() => {
        document.getElementById(`wheel-sh-${timePickerModal.startHour}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
        document.getElementById(`wheel-sm-${timePickerModal.startMinute}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
        document.getElementById(`wheel-eh-${timePickerModal.endHour}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
        document.getElementById(`wheel-em-${timePickerModal.endMinute}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [timePickerModal.isOpen]);

  // Yurda Giriş ve Çıkış Saatleri Çark Modalı State'i (Entry / Exit Time Wheel Picker)
  const [entryTimeModal, setEntryTimeModal] = useState<{
    isOpen: boolean;
    field: "haftaici" | "haftasonu" | "cikisHaftaIci" | "cikisHaftaSonu";
    title: string;
    hour: number;
    minute: number;
  }>({
    isOpen: false,
    field: "haftaici",
    title: "",
    hour: 23,
    minute: 0,
  });

  // Giriş/Çıkış Saati Seçici açıldığında seçili saat ve dakikayı merkeze kaydır
  useEffect(() => {
    if (entryTimeModal.isOpen) {
      const timer = setTimeout(() => {
        document.getElementById(`wheel-entry-h-${entryTimeModal.hour}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
        document.getElementById(`wheel-entry-m-${entryTimeModal.minute}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [entryTimeModal.isOpen]);

  // Metin alanlarının (textarea) içeriğe göre dinamik ve otomatik büyümesi
  useEffect(() => {
    const supportsFieldSizing =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("field-sizing", "content");

    if (supportsFieldSizing) return;

    const autoResize = (el: HTMLTextAreaElement) => {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 480)}px`;
    };

    const handleInput = (e: Event) => {
      const target = e.target;
      if (target instanceof HTMLTextAreaElement) {
        autoResize(target);
      }
    };

    document.addEventListener("input", handleInput);

    const resizeAll = () => {
      document.querySelectorAll("textarea").forEach((ta) => autoResize(ta));
    };

    resizeAll();
    const timer = setTimeout(resizeAll, 100);

    return () => {
      document.removeEventListener("input", handleInput);
      clearTimeout(timer);
    };
  }, [dailyMenu, isAddAnnouncementModalOpen, isAddMaintenanceModalOpen]);

  // Yurt Bilgileri ve Ayarları (Yönetici doğrudan değiştirebilir)
  const [yurtSettings, setYurtSettings] = useState<{
    ad: string;
    sehir: string;
    ilce: string;
    adres: string;
    yetkiliAd: string;
    yetkiliTel: string;
    kapasite: number | string;
    sonGirisHaftaIci: string;
    sonGirisHaftaSonu: string;
    ilkCikisHaftaIci: string;
    ilkCikisHaftaSonu: string;
    adminKullaniciAdi?: string;
    adminEposta?: string;
    adminSifre?: string;
    superadminKullaniciAdi?: string;
    superadminEposta?: string;
    superadminSifre?: string;
    adminGirisAktif?: boolean;
    hizliGirisIzin?: boolean;
    guvenliOturum?: boolean;
  }>({
    ad: "Güneş Yükseköğrenim Kız Öğrenci Yurdu",
    sehir: "İstanbul",
    ilce: "Kadıköy",
    adres: "Moda Cad. No: 42, Kadıköy / İstanbul",
    yetkiliAd: "Fatma Güneş (Yurt Müdürü)",
    yetkiliTel: "0532 999 88 77",
    kapasite: 150,
    sonGirisHaftaIci: "23:00",
    sonGirisHaftaSonu: "23:45",
    ilkCikisHaftaIci: "06:00",
    ilkCikisHaftaSonu: "06:30",
    adminKullaniciAdi: "mudur",
    adminEposta: "mudur@gunesyurdu.com",
    adminSifre: "mudur123456",
    superadminKullaniciAdi: "superadmin",
    superadminEposta: "superadmin@yurtify.com",
    superadminSifre: "Admin*2026!",
    adminGirisAktif: true,
    hizliGirisIzin: false,
    guvenliOturum: true,
  });

  const [adminPasswordForm, setAdminPasswordForm] = useState({
    mevcutSifre: "",
    yeniSifre: "",
    yeniSifreTekrar: "",
  });

  const [failedLoginAttempts, setFailedLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);


  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [newYurt, setNewYurt] = useState({
    ad: "",
    sehir: "İstanbul",
    ilce: "",
    adres: "",
    kapasite: 200,
    yetkiliAd: "",
    yetkiliTel: "",
    yetkiliEposta: "",
    yurtTuru: "Kız Öğrenci Yurdu",
  });

  // Bildirim Yardımcısı
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // ========================================================
  // ========================================================
  // 1. SUPABASE REALTIME & VERİTABANI YÖNETİMİ
  // ========================================================

  // Veritabanından doğrudan ve anlık veri çekme fonksiyonu
  const fetchDbData = async () => {
    try {
      // 1. Yurtları doğrudan Supabase'den çek
      const { data: yurtData, error: yurtError } = await supabase
        .from("yurtlar")
        .select("*")
        .order("created_at", { ascending: false });

      if (!yurtError && yurtData) {
        setIsDbConnected(true);
        const mappedYurtlar: Yurt[] = yurtData.map((d: any) => ({
          id: d.id,
          ad: d.ad,
          sehir: d.sehir,
          ilce: d.ilce,
          adres: d.adres || "",
          kapasite: d.kapasite || 100,
          mevcutOgrenci: d.mevcut_ogrenci ?? 0,
          yetkiliAd: d.yetkili_ad || "Yetkili",
          yetkiliTel: d.yetkili_tel || "",
          yetkiliEposta: d.yetkili_eposta || "",
          durum: d.durum || "aktif",
          yurtTuru: d.yurt_turu || "Kız Öğrenci Yurdu",
          kayitTarihi: new Date(d.created_at || Date.now()).toLocaleDateString("tr-TR"),
        }));
        setYurtlar(mappedYurtlar);
        if (typeof window !== "undefined") {
          localStorage.setItem("yurtify_yurtlar", JSON.stringify(mappedYurtlar));
        }

        // Eğer yerel olarak henüz kaydedilmiş özel ayar yoksa, Supabase'deki yurdun bilgilerini yurtSettings ile senkronize et
        const hasSavedSettings = typeof window !== "undefined" && localStorage.getItem("yurtify_settings");
        if (!hasSavedSettings && mappedYurtlar.length > 0) {
          const first = mappedYurtlar[0];
          setYurtSettings((prev) => ({
            ...prev,
            ad: first.ad || prev.ad,
            yetkiliAd: first.yetkiliAd || prev.yetkiliAd,
            kapasite: first.kapasite || prev.kapasite,
            sehir: first.sehir || prev.sehir,
            ilce: first.ilce || prev.ilce,
            adres: first.adres || prev.adres,
          }));
        }
      } else if (yurtError) {
        console.warn("Supabase yurtlar çekme uyarısı:", yurtError.message);
        setIsDbConnected(false);
      }
    } catch (err) {
      console.warn("Veritabanı bağlantı notu:", err);
    }
  };

  useEffect(() => {
    // A. Sayfa yenilendiğinde kullanıcıyı atmaması için (Persistent Session)
    if (typeof window !== "undefined") {
      try {
        // Her sekmenin kendi bağımsız oturumunu koruması için (Tab-Isolated Session)
        let savedSession = sessionStorage.getItem("yurtify_session");
        if (!savedSession) {
          savedSession = localStorage.getItem("yurtify_session");
        }
        if (savedSession) {
          const parsedUser = JSON.parse(savedSession);
          // 8 saatlik güvenli oturum zaman aşımı kontrolü
          const maxSessionDuration = 8 * 60 * 60 * 1000;
          const isExpired = parsedUser?.loginAt && Date.now() - parsedUser.loginAt > maxSessionDuration;
          if (parsedUser && parsedUser.role && !isExpired) {
            setCurrentUser(parsedUser);
            sessionStorage.setItem("yurtify_session", JSON.stringify(parsedUser));
            document.documentElement.classList.add("has-session");
          } else {
            sessionStorage.removeItem("yurtify_session");
            localStorage.removeItem("yurtify_session");
            document.documentElement.classList.remove("has-session");
            setCurrentUser(null);
          }
        } else {
          document.documentElement.classList.remove("has-session");
          setCurrentUser(null);
        }

        // Eski dummy/mock cache'i temizle
        const savedYurtlar = localStorage.getItem("yurtify_yurtlar");
        if (savedYurtlar) {
          const parsed = JSON.parse(savedYurtlar);
          const hasDummy = parsed.some((y: any) => y.id === "11111111-1111-1111-1111-111111111111" || y.ad?.includes("Güneş Yükseköğrenim"));
          if (hasDummy) {
            localStorage.removeItem("yurtify_yurtlar");
            setYurtlar([]);
          } else {
            setYurtlar(parsed);
          }
        }
        // Yönetici Verilerini Yükle / Başlat
        const defaultStudentsList: Student[] = [
          {
            id: "std-1",
            adSoyad: "Zeynep Lermi",
            eposta: "zeynep.lermi@gmail.com",
            sifre: "ogrenci123",
            odaNo: "305",
            yatakNo: "1",
          },
          {
            id: "std-2",
            adSoyad: "Elif Yıldız",
            eposta: "elif.yildiz@hotmail.com",
            sifre: "ogrenci123",
            odaNo: "305",
            yatakNo: "2",
          },
          {
            id: "std-3",
            adSoyad: "Ayşe Demir",
            eposta: "ayse.demir@gmail.com",
            sifre: "ogrenci123",
            odaNo: "201",
            yatakNo: "1",
          },
          {
            id: "std-4",
            adSoyad: "Merve Kaya",
            eposta: "merve.kaya@gmail.com",
            sifre: "ogrenci123",
            odaNo: "104",
            yatakNo: "1",
          },
          {
            id: "std-5",
            adSoyad: "Selin Çelik",
            eposta: "selin.celik@outlook.com",
            sifre: "ogrenci123",
            odaNo: "202",
            yatakNo: "2",
          },
          {
            id: "std-6",
            adSoyad: "Anna Demkiv",
            eposta: "demkivanna22@gmail.com",
            kullaniciAdi: "demkivanna22",
            sifre: "ogrenci123",
            odaNo: "101",
            yatakNo: "1",
          },
        ];

        const savedStudents = localStorage.getItem("yurtify_students");
        let finalStudentList: Student[] = defaultStudentsList;
        if (savedStudents) {
          try {
            const parsed = JSON.parse(savedStudents);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const knownEmails = new Set(
                parsed.map((s: any) => (s.eposta || "").toLowerCase().trim())
              );
              const missingDefaults = defaultStudentsList.filter(
                (ds) => !knownEmails.has(ds.eposta.toLowerCase().trim())
              );
              finalStudentList = [...parsed, ...missingDefaults];
            }
          } catch (e) {
            console.error("Öğrenci yükleme hatası:", e);
          }
        }
        setStudents(finalStudentList);
        localStorage.setItem("yurtify_students", JSON.stringify(finalStudentList));

        const savedRooms = localStorage.getItem("yurtify_rooms");
        if (savedRooms) {
          setRooms(JSON.parse(savedRooms));
        } else {
          const defaultRooms: Room[] = [
            { id: "r-101", odaNo: "101", blok: "A Blok", kat: 1, kapasite: 3, doluYatak: 2, odaTipi: "Standart Balkonlu", durum: "Aktif" },
            { id: "r-104", odaNo: "104", blok: "A Blok", kat: 1, kapasite: 2, doluYatak: 2, odaTipi: "Geniş Suit", durum: "Aktif" },
            { id: "r-201", odaNo: "201", blok: "A Blok", kat: 2, kapasite: 1, doluYatak: 1, odaTipi: "Tek Kişilik VIP", durum: "Aktif" },
            { id: "r-202", odaNo: "202", blok: "B Blok", kat: 2, kapasite: 3, doluYatak: 2, odaTipi: "Standart 3 Kişilik", durum: "Aktif" },
            { id: "r-305", odaNo: "305", blok: "B Blok", kat: 3, kapasite: 4, doluYatak: 3, odaTipi: "4 Kişilik Ferah", durum: "Aktif" },
            { id: "r-306", odaNo: "306", blok: "B Blok", kat: 3, kapasite: 2, doluYatak: 0, odaTipi: "2 Kişilik Çalışma Odalı", durum: "Aktif" },
          ];
          setRooms(defaultRooms);
          localStorage.setItem("yurtify_rooms", JSON.stringify(defaultRooms));
        }

        const todayStr = getTodayDateKey();
        const tomorrowObj = new Date();
        tomorrowObj.setDate(tomorrowObj.getDate() + 1);
        const tomorrowStr = `${tomorrowObj.getFullYear()}-${String(tomorrowObj.getMonth() + 1).padStart(2, "0")}-${String(tomorrowObj.getDate()).padStart(2, "0")}`;

        const savedLaundry = localStorage.getItem("yurtify_laundry");
        const legacyLaundrySlots = localStorage.getItem("yurtify_laundry_slots");
        let initialSlots: LaundrySlot[] = [];

        if (savedLaundry) {
          try {
            const parsed = JSON.parse(savedLaundry);
            if (Array.isArray(parsed)) initialSlots = parsed;
          } catch (e) {
            console.error("Laundry parse error:", e);
          }
        }

        if (legacyLaundrySlots) {
          try {
            const parsedLegacy: LaundrySlot[] = JSON.parse(legacyLaundrySlots);
            if (Array.isArray(parsedLegacy)) {
              const existingIds = new Set(initialSlots.map((s) => s.id));
              for (const slot of parsedLegacy) {
                if (!existingIds.has(slot.id)) {
                  initialSlots.push(slot);
                }
              }
            }
          } catch {}
        }

        if (initialSlots.length > 0) {
          const migrated = initialSlots.map((slot) => {
            if (slot.tarih === "2026-10-19") {
              return { ...slot, tarih: todayStr };
            }
            if (slot.tarih === "2026-10-20") {
              return { ...slot, tarih: tomorrowStr };
            }
            return slot;
          });
          const { updatedSlots } = syncSlotsWithCurrentTime(migrated);
          setLaundrySlots(updatedSlots);
          localStorage.setItem("yurtify_laundry", JSON.stringify(updatedSlots));
          localStorage.setItem("yurtify_laundry_slots", JSON.stringify(updatedSlots));
        } else {
          const defaultLaundry: LaundrySlot[] = [
            {
              id: "lnd-1",
              ogrenciAd: "Zeynep Lermi",
              odaNo: "305",
              makineNo: "Makine 1 (A-1)",
              tarih: todayStr,
              saatAraligi: "09:00 - 10:30",
              program: "Renkli & Karışık",
              durum: "Yıkanıyor",
              not: "40°C Standart yıkama"
            },
            {
              id: "lnd-2",
              ogrenciAd: "Merve Kaya",
              odaNo: "104",
              makineNo: "Makine 2 (A-2)",
              tarih: todayStr,
              saatAraligi: "10:30 - 12:00",
              program: "Beyazlar & Pamuklu",
              durum: "Sırada",
              not: "Çamaşır sepeti makine yanında"
            },
            {
              id: "lnd-3",
              ogrenciAd: "Ayşe Demir",
              odaNo: "201",
              makineNo: "Kurutma 1 (K-1)",
              tarih: todayStr,
              saatAraligi: "13:00 - 14:30",
              program: "Kurutma & Havalandırma",
              durum: "Sırada",
              not: "Orta ısıda kurutma"
            },
            {
              id: "lnd-4",
              ogrenciAd: "Büşra Çelik",
              odaNo: "202",
              makineNo: "Makine 3 (B-1)",
              tarih: todayStr,
              saatAraligi: "15:00 - 16:30",
              program: "Hızlı Yıkama (30 dk)",
              durum: "Sırada",
            },
            {
              id: "lnd-5",
              ogrenciAd: "Elif Yılmaz",
              odaNo: "101",
              makineNo: "Makine 1 (A-1)",
              tarih: todayStr,
              saatAraligi: "17:00 - 18:30",
              program: "Renkli & Karışık",
              durum: "Sırada",
            },
            {
              id: "lnd-6",
              ogrenciAd: "Selin Şahin",
              odaNo: "306",
              makineNo: "Makine 2 (A-2)",
              tarih: tomorrowStr,
              saatAraligi: "11:00 - 12:30",
              program: "Renkli & Karışık",
              durum: "Sırada",
            },
            {
              id: "lnd-7",
              ogrenciAd: "Zeynep Lermi",
              odaNo: "305",
              makineNo: "Kurutma 2 (K-2)",
              tarih: tomorrowStr,
              saatAraligi: "14:00 - 15:30",
              program: "Kurutma & Havalandırma",
              durum: "Sırada",
            }
          ];
          const { updatedSlots: syncedDefault } = syncSlotsWithCurrentTime(defaultLaundry);
          setLaundrySlots(syncedDefault);
          localStorage.setItem("yurtify_laundry", JSON.stringify(syncedDefault));
          localStorage.setItem("yurtify_laundry_slots", JSON.stringify(syncedDefault));
        }

        const savedMachines = localStorage.getItem("yurtify_laundry_machines");
        if (savedMachines) {
          try {
            const parsed = JSON.parse(savedMachines);
            if (Array.isArray(parsed)) {
              setLaundryMachines(
                parsed.map((m: any) => ({
                  ...m,
                  name: cleanMachineName(m.name || m.id),
                }))
              );
            }
          } catch (e) {
            console.error("Machines parse error:", e);
          }
        }

        const savedMnt = localStorage.getItem("yurtify_maintenance");
        if (savedMnt) {
          setMaintenanceTickets(JSON.parse(savedMnt));
        } else {
          const defaultMnt: MaintenanceTicket[] = [
            { id: "mnt-1", odaNo: "305", baslik: "Banyo bataryası damlatıyor", kategori: "Tesisat", oncelik: "Orta", durum: "Açık", bildiren: "Zeynep Lermi", tarih: "18.10.2026" },
            { id: "mnt-2", odaNo: "104", baslik: "Oda Wi-Fi sinyali çok zayıf", kategori: "İnternet", oncelik: "Acil", durum: "İnceleniyor", bildiren: "Merve Kaya", tarih: "17.10.2026" },
            { id: "mnt-3", odaNo: "201", baslik: "Masa lambası duyu değişimi", kategori: "Elektrik", oncelik: "Düşük", durum: "Çözüldü", bildiren: "Ayşe Demir", tarih: "15.10.2026" },
          ];
          setMaintenanceTickets(defaultMnt);
          localStorage.setItem("yurtify_maintenance", JSON.stringify(defaultMnt));
        }

        const savedAnc = localStorage.getItem("yurtify_announcements");
        if (savedAnc) {
          setAnnouncements(JSON.parse(savedAnc));
        } else {
          const defaultAnc: Announcement[] = [
            { id: "anc-1", baslik: "Giriş ve Çıkış Saatleri Hatırlatması", icerik: "Hafta içi son giriş saati 23:00, hafta sonu ise 23:45'tir. Tüm öğrencilerin yoklama saatinde odalarında bulunması zorunludur.", oncelik: "Önemli", tarih: "18.10.2026" },
            { id: "anc-2", baslik: "Haftalık Çamaşırhane & Ütü Odası Programı", icerik: "B Blok kat sakinleri için çamaşırhane Salı ve Cuma günleri 09:00 - 21:00 arası rezerve edilmiştir.", oncelik: "Normal", tarih: "17.10.2026" },
            { id: "anc-3", baslik: "Merkezi Isıtma & Sıcak Su Saatleri", icerik: "Kış tarifesi gereği kaloriferler sabah 06:00-09:00 ve akşam 17:00-24:00 saatleri arasında kesintisiz devrededir.", oncelik: "Normal", tarih: "15.10.2026" }
          ];
          setAnnouncements(defaultAnc);
          localStorage.setItem("yurtify_announcements", JSON.stringify(defaultAnc));
        }

        const todayKey = getTodayDateKey();
        const savedMenu = localStorage.getItem("yurtify_menu");
        if (savedMenu) {
          try {
            const parsedMenu = JSON.parse(savedMenu);
            // Eger kaydedilmis menunun tarihi bugunden farkliysa yeni gun basladigi (00:00 gecildigi) icin sifirla
            if (parsedMenu.tarih && parsedMenu.tarih !== todayKey) {
              const resetMenu = getResetDailyMenu(parsedMenu);
              setDailyMenu(resetMenu);
              localStorage.setItem("yurtify_menu", JSON.stringify(resetMenu));
            } else {
              const current = {
                ...parsedMenu,
                tarih: parsedMenu.tarih || todayKey,
              };
              setDailyMenu((prev) => ({ ...prev, ...current }));
              if (!parsedMenu.tarih) {
                localStorage.setItem("yurtify_menu", JSON.stringify(current));
              }
            }
          } catch (e) {
            console.error("Menu parse error:", e);
          }
        } else {
          const initialMenu = {
            ...defaultDailyMenu,
            tarih: todayKey,
          };
          setDailyMenu(initialMenu);
          localStorage.setItem("yurtify_menu", JSON.stringify(initialMenu));
        }

        const savedSettings = localStorage.getItem("yurtify_settings");
        if (savedSettings) {
          try {
            const parsedSettings = JSON.parse(savedSettings);
            if (parsedSettings && parsedSettings.ad) {
              setYurtSettings((prev) => ({ ...prev, ...parsedSettings }));
            }
          } catch (e) {
            console.error("Settings parse error:", e);
          }
        }

        const savedAttendance = localStorage.getItem("yurtify_meal_attendance");
        if (savedAttendance) {
          try {
            const parsed = JSON.parse(savedAttendance);
            if (Array.isArray(parsed)) {
              setMealAttendance(parsed);
            }
          } catch (e) {
            console.error("Meal attendance parse error:", e);
          }
        } else {
          const todayKey = getTodayDateKey();
          const seeded = defaultMealAttendance.map((a) => ({ ...a, date: todayKey }));
          setMealAttendance(seeded);
          localStorage.setItem("yurtify_meal_attendance", JSON.stringify(seeded));
        }
      } catch (e) {
        console.error("Local storage error:", e);
      } finally {
        setIsAuthChecking(false);
      }
    } else {
      setIsAuthChecking(false);
    }

    // B. Veritabanından en güncel verileri hemen çek
    fetchDbData();

    // C. Supabase Realtime Dinleyicileri
    let yurtChannel: any = null;

    try {
      const channelSuffix = Math.random().toString(36).substring(2, 8);
      yurtChannel = supabase
        .channel(`yurtlar-${channelSuffix}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "yurtlar" }, (payload) => {
          setRealtimeActive(true);
          setIsDbConnected(true);
          fetchDbData();
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") setRealtimeActive(true);
        });
    } catch (err) {
      console.warn("Realtime aboneliği başlatılamadı:", err);
    }

    return () => {
      if (yurtChannel) supabase.removeChannel(yurtChannel);
    };
  }, []);

  // ========================================================
  // GÜNLÜK MENÜ 00:00 OTOMATİK SIFIRLAMA SİSTEMİ
  // ========================================================
  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout>;

    // 00:00 Gece Yarısı Zamanlayıcısı
    const scheduleMidnightTimer = () => {
      const msUntilMidnight = getMsUntilMidnight() + 500; // 00:00:00'dan 500ms sonra tetiklenir
      midnightTimer = setTimeout(() => {
        setDailyMenu((prev) => {
          const resetMenu = getResetDailyMenu(prev);
          try {
            localStorage.setItem("yurtify_menu", JSON.stringify(resetMenu));
          } catch (e) {
            console.error("Local storage kaydetme hatasi:", e);
          }
          return resetMenu;
        });
        showToast("Yeni gün başladı (00:00). Günlük yemek menüsü sıfırlandı.");
        scheduleMidnightTimer();
      }, msUntilMidnight);
    };

    scheduleMidnightTimer();

    // Sekme görünür olduğunda veya odaklandığında yeni gün kontrolü
    const checkAndResetIfNewDay = () => {
      const todayKey = getTodayDateKey();
      setDailyMenu((prev) => {
        if (prev.tarih && prev.tarih !== todayKey) {
          const resetMenu = getResetDailyMenu(prev);
          try {
            localStorage.setItem("yurtify_menu", JSON.stringify(resetMenu));
          } catch (e) {
            console.error("Local storage hatasi:", e);
          }
          showToast("Yeni gün başladı. Yemek menüsü sıfırlandı.");
          return resetMenu;
        }
        return prev;
      });
    };

    // 30 saniyede bir periyodik kontrol (günün değişmesi ve saat ilerledikçe randevu durumlarının otomatik güncellenmesi)
    const periodicCheck = setInterval(() => {
      checkAndResetIfNewDay();
      setLaundrySlots((prev) => {
        const { updatedSlots, hasChanges } = syncSlotsWithCurrentTime(prev);
        if (hasChanges && typeof window !== "undefined") {
          localStorage.setItem("yurtify_laundry", JSON.stringify(updatedSlots));
          localStorage.setItem("yurtify_laundry_slots", JSON.stringify(updatedSlots));
          return updatedSlots;
        }
        return prev;
      });
    }, 30000);

    const syncAllFromStorage = () => {
      try {
        const freshStudents = localStorage.getItem("yurtify_students");
        if (freshStudents) {
          const parsed = JSON.parse(freshStudents);
          if (Array.isArray(parsed) && parsed.length > 0) setStudents(parsed);
        }
      } catch {}

      try {
        const freshLaundry = localStorage.getItem("yurtify_laundry") || localStorage.getItem("yurtify_laundry_slots");
        if (freshLaundry) {
          const parsed = JSON.parse(freshLaundry);
          if (Array.isArray(parsed)) {
            const { updatedSlots, hasChanges } = syncSlotsWithCurrentTime(parsed);
            setLaundrySlots(updatedSlots);
            if (hasChanges) {
              localStorage.setItem("yurtify_laundry", JSON.stringify(updatedSlots));
              localStorage.setItem("yurtify_laundry_slots", JSON.stringify(updatedSlots));
            }
          }
        }
      } catch {}

      try {
        const freshMnt = localStorage.getItem("yurtify_maintenance");
        if (freshMnt) {
          const parsed = JSON.parse(freshMnt);
          if (Array.isArray(parsed)) setMaintenanceTickets(parsed);
        }
      } catch {}

      try {
        const freshAttendance = localStorage.getItem("yurtify_meal_attendance");
        if (freshAttendance) {
          const parsed = JSON.parse(freshAttendance);
          if (Array.isArray(parsed)) setMealAttendance(parsed);
        }
      } catch {}
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkAndResetIfNewDay();
        syncAllFromStorage();
      }
    };

    const handleFocusSync = () => {
      checkAndResetIfNewDay();
      syncAllFromStorage();
    };

    // Farklı sekmeler arasında menüyü, öğrencileri ve çamaşırhane randevularını anında senkronize et
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "yurtify_menu" && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          setDailyMenu(updated);
        } catch {}
      }
      if (e.key === "yurtify_students" && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated) && updated.length > 0) {
            setStudents(updated);
          }
        } catch {}
      }
      if ((e.key === "yurtify_laundry" || e.key === "yurtify_laundry_slots") && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) {
            setLaundrySlots(updated);
          }
        } catch {}
      }
      if (e.key === "yurtify_maintenance" && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) {
            setMaintenanceTickets(updated);
          }
        } catch {}
      }
      if (e.key === "yurtify_meal_attendance" && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) {
            setMealAttendance(updated);
          }
        } catch {}
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocusSync);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearTimeout(midnightTimer);
      clearInterval(periodicCheck);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocusSync);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // ========================================================
  // 2. GİRİŞ & OTURUM İŞLEMİ (SUPABASE AUTH & KALICI OTURUM)
  // ========================================================
  const loginUserDirect = (role: Role, customName?: string, customDetails?: string) => {
    const activeYurtName = yurtSettings.ad || yurtlar[0]?.ad || "Güneş Yükseköğrenim Kız Öğrenci Yurdu";
    const selectedYurt = yurtlar[0] || {
      id: "1",
      ad: activeYurtName,
    };

    const sessionToken = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}`;
    let userObj: any = null;
    if (role === "superadmin") {
      userObj = {
        role: "superadmin",
        name: customName || "Süper Admin (Sistem Yöneticisi)",
        details: customDetails || "superadmin@yurtify.com",
        selectedYurtId: selectedYurt.id,
        selectedYurtName: activeYurtName,
        sessionToken,
        loginAt: Date.now(),
      };
    } else if (role === "yonetici") {
      userObj = {
        role: "yonetici",
        name: customName || yurtSettings.yetkiliAd || "Fatma Güneş (Yurt Müdürü)",
        details: customDetails || (yurtSettings.adminEposta || "mudur@gunesyurdu.com"),
        selectedYurtId: selectedYurt.id,
        selectedYurtName: activeYurtName,
        sessionToken,
        loginAt: Date.now(),
      };
    } else {
      userObj = {
        role: "ogrenci",
        name: customName || "Öğrenci",
        details: customDetails || "Öğrenci Portalı",
        selectedYurtId: selectedYurt.id,
        selectedYurtName: activeYurtName,
        sessionToken,
        loginAt: Date.now(),
      };
    }

    setCurrentUser(userObj);
    setIsAuthChecking(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("yurtify_session", JSON.stringify(userObj));
      document.documentElement.classList.add("has-session");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Brute-force ve Geçici Kilitlenme Kontrolü
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingSec = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setErrorMessage(`Çok sayıda hatalı giriş yapıldı. Güvenlik nedeniyle lütfen ${remainingSec} saniye bekleyiniz.`);
      return;
    }

    if (!username.trim() || !password.trim()) {
      setErrorMessage("Lütfen tüm alanları doldurunuz.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    const recordFailedAttempt = (customMsg?: string) => {
      const nextCount = failedLoginAttempts + 1;
      setFailedLoginAttempts(nextCount);
      if (nextCount >= 5) {
        const lockoutTime = Date.now() + 60000;
        setLockoutUntil(lockoutTime);
        setErrorMessage("5 kez art arda hatalı giriş denemesi yapıldı. Sistem güvenliği için giriş 60 saniye süreyle kilitlendi.");
      } else {
        setErrorMessage(customMsg || `Hatalı kullanıcı adı veya şifre. (${5 - nextCount} deneme hakkı kaldı)`);
      }
    };

    try {
      const enteredIdentifier = username.trim().toLowerCase();
      const enteredPassword = password.trim();

      // ==========================================
      // A. SÜPER ADMİN GİRİŞİ
      // ==========================================
      if (activeRole === "superadmin") {
        const configuredSuperUser = (yurtSettings.superadminKullaniciAdi || "superadmin").trim().toLowerCase();
        const configuredSuperEmail = (yurtSettings.superadminEposta || "superadmin@yurtify.com").trim().toLowerCase();
        const configuredSuperPass = yurtSettings.superadminSifre || "Admin*2026!";

        const isSuperIdentifierValid = enteredIdentifier === configuredSuperUser || enteredIdentifier === configuredSuperEmail;
        const isSuperPassValid = enteredPassword === configuredSuperPass;

        if (!isSuperIdentifierValid || !isSuperPassValid) {
          recordFailedAttempt("Hatalı Süper Admin kullanıcı adı veya şifresi.");
          setIsLoading(false);
          return;
        }

        setFailedLoginAttempts(0);
        setLockoutUntil(null);
        loginUserDirect("superadmin", "Süper Admin (Sistem Yöneticisi)", configuredSuperEmail);
        return;
      }

      // ==========================================
      // B. YURT MÜDÜRÜ / YÖNETİCİ GİRİŞİ
      // ==========================================
      if (activeRole === "yonetici") {
        if (yurtSettings.adminGirisAktif === false) {
          setErrorMessage("Yönetici girişi yurt ayarlarından geçici olarak durdurulmuştur.");
          setIsLoading(false);
          return;
        }

        const configuredUsername = (yurtSettings.adminKullaniciAdi || "mudur").trim().toLowerCase();
        const configuredEmail = (yurtSettings.adminEposta || "mudur@gunesyurdu.com").trim().toLowerCase();
        const configuredAdminPassword = yurtSettings.adminSifre || "mudur123456";

        const isIdentifierMatch = enteredIdentifier === configuredUsername || enteredIdentifier === configuredEmail;
        const isPasswordMatch = enteredPassword === configuredAdminPassword;

        if (!isIdentifierMatch || !isPasswordMatch) {
          recordFailedAttempt("Hatalı yönetici kullanıcı adı veya şifresi.");
          setIsLoading(false);
          return;
        }

        // Supabase Auth kontrolü (eğer veritabanı aktifse)
        try {
          const authEmail = enteredIdentifier.includes("@") ? enteredIdentifier : configuredEmail;
          await supabase.auth.signInWithPassword({
            email: authEmail,
            password: enteredPassword,
          });
        } catch {
          // Supabase bağlantısı olmasa bile doğrulanan ayar şifresi ile güvenli giriş yapılır
        }

        setFailedLoginAttempts(0);
        setLockoutUntil(null);
        loginUserDirect("yonetici", yurtSettings.yetkiliAd || "Fatma Güneş (Yurt Müdürü)", configuredEmail);
        return;
      }

      // ==========================================
      // C. ÖĞRENCİ GİRİŞİ
      // ==========================================
      if (activeRole === "ogrenci") {
        // Her giriş denemesinde en güncel LocalStorage verisini doğrudan çek
        let currentStudents = students;
        if (typeof window !== "undefined") {
          try {
            const raw = localStorage.getItem("yurtify_students");
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                currentStudents = parsed;
                setStudents(parsed);
              }
            }
          } catch (e) {
            console.error("Öğrenci okuma hatası:", e);
          }
        }

        const cleanIdentifier = enteredIdentifier.trim().toLowerCase();
        const identifierPrefix = cleanIdentifier.includes("@")
          ? cleanIdentifier.split("@")[0].trim()
          : cleanIdentifier;

        const normalize = (str: string) =>
          str
            .toLowerCase()
            .trim()
            .replace(/ğ/g, "g")
            .replace(/ü/g, "u")
            .replace(/ş/g, "s")
            .replace(/ı/g, "i")
            .replace(/ö/g, "o")
            .replace(/ç/g, "c")
            .replace(/[^a-z0-9]/g, "");

        const normalizedIdentifier = normalize(cleanIdentifier);
        const normalizedPrefix = normalize(identifierPrefix);

        const matchedStudent = currentStudents.find((s) => {
          const sName = (s.adSoyad || "").trim().toLowerCase();
          const sEmail = (s.eposta || "").trim().toLowerCase();
          const sUsername = ((s.kullaniciAdi || "") || sName.replace(/\s+/g, ".")).trim().toLowerCase();
          const sEmailPrefix = sEmail.includes("@") ? sEmail.split("@")[0].trim() : sEmail;

          // 1. Doğrudan tam eşleşme (E-posta, Ad Soyad, Kullanıcı Adı)
          if (
            sEmail === cleanIdentifier ||
            sName === cleanIdentifier ||
            sUsername === cleanIdentifier
          ) {
            return true;
          }

          // 2. E-posta ön eki eşleşmesi (örn: demkivanna22@gmail.com <-> demkivanna22)
          if (
            sEmailPrefix === identifierPrefix ||
            sEmailPrefix === cleanIdentifier ||
            sEmail === identifierPrefix ||
            sUsername === identifierPrefix
          ) {
            return true;
          }

          // 3. Normalize edilmiş eşleşme (Türkçe karakter ve noktalama bağımsız)
          const normName = normalize(sName);
          const normEmail = normalize(sEmail);
          const normUsername = normalize(sUsername);
          const normEmailPrefix = normalize(sEmailPrefix);

          if (
            normEmail === normalizedIdentifier ||
            normName === normalizedIdentifier ||
            normUsername === normalizedIdentifier ||
            normEmailPrefix === normalizedPrefix ||
            normEmailPrefix === normalizedIdentifier ||
            normName === normalizedPrefix
          ) {
            return true;
          }

          // 4. İçerme eşleşmesi (örn: demkivanna22)
          if (
            cleanIdentifier.length >= 4 &&
            (sEmail.includes(cleanIdentifier) ||
              sName.includes(cleanIdentifier) ||
              cleanIdentifier.includes(normEmailPrefix) ||
              cleanIdentifier.includes(normName))
          ) {
            return true;
          }

          return false;
        });

        if (!matchedStudent) {
          recordFailedAttempt("Bu kullanıcı adı veya e-posta ile kayıtlı öğrenci bulunamadı.");
          setIsLoading(false);
          return;
        }

        const studentPassword = matchedStudent.sifre || "ogrenci123";
        if (enteredPassword !== studentPassword) {
          recordFailedAttempt("Hatalı öğrenci şifresi.");
          setIsLoading(false);
          return;
        }

        setFailedLoginAttempts(0);
        setLockoutUntil(null);
        loginUserDirect("ogrenci", matchedStudent.adSoyad, `Oda ${matchedStudent.odaNo} • ${matchedStudent.eposta}`);
        return;
      }
    } catch (err: any) {
      console.error("Giriş işlemi hatası:", err);
      setErrorMessage("Giriş işlemi gerçekleştirilemedi. Lütfen bilgilerinizi kontrol ederek tekrar deneyiniz.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (role: Role) => {
    setActiveRole(role);
    setErrorMessage("");
    setUsername("");
    setPassword("");
  };

  const handleQuickLogin = (role: Role) => {
    if (yurtSettings.hizliGirisIzin !== true) {
      setErrorMessage("Güvenli Giriş Protokolü: Tek tıkla hızlı giriş seçeneği ayarlardan devre dışı bırakılmıştır.");
      return;
    }
    if (role === "yonetici" && yurtSettings.adminGirisAktif === false) {
      setErrorMessage("Yönetici girişi yurt ayarlarından geçici olarak durdurulmuştur.");
      return;
    }
    loginUserDirect(role);
  };

  // Çıkış Yap: Hem React state'i hem LocalStorage'ı hem Supabase oturumunu temizler
  const handleLogout = async () => {
    setCurrentUser(null);
    setIsAuthChecking(false);
    setUsername("");
    setPassword("");
    setErrorMessage("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("yurtify_session");
      localStorage.removeItem("yurtify_session");
      document.documentElement.classList.remove("has-session");
    }
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Sign out hatası:", err);
    }
  };

  // ========================================================
  // 3. DOĞRUDAN SUPABASE CRUD İŞLEMLERİ
  // ========================================================

  // A. Yeni Yurt Ekle (Doğrudan Supabase'e yazar & veritabanından yeniler)
  const handleCreateYurt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYurt.ad.trim() || !newYurt.yetkiliAd.trim() || !newYurt.yetkiliEposta.trim()) {
      showToast("Lütfen zorunlu alanları (Yurt Adı, Yetkili Adı ve E-posta) doldurunuz.");
      return;
    }

    const uniqueId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined;

    const payload: any = {
      ad: newYurt.ad.trim(),
      sehir: newYurt.sehir,
      ilce: newYurt.ilce.trim() || "Merkez",
      adres: newYurt.adres.trim(),
      kapasite: Number(newYurt.kapasite) || 100,
      mevcut_ogrenci: 0,
      yetkili_ad: newYurt.yetkiliAd.trim(),
      yetkili_tel: newYurt.yetkiliTel.trim(),
      yetkili_eposta: newYurt.yetkiliEposta.trim(),
      durum: "aktif",
      yurt_turu: newYurt.yurtTuru,
    };
    if (uniqueId) payload.id = uniqueId;

    setIsAddModalOpen(false);
    showToast(`"${newYurt.ad}" veritabanına ekleniyor...`);

    try {
      const { data, error } = await supabase.from("yurtlar").insert([payload]).select();
      if (error) {
        console.error("Supabase insert error:", error);
        showToast(`Hata: ${error.message}`);
      } else {
        showToast(`"${newYurt.ad}" başarıyla veritabanına kaydedildi!`);
      }
    } catch (err: any) {
      console.error("Supabase ekleme hatası:", err);
    } finally {
      // Her durumda veritabanından en güncel veriyi çek
      await fetchDbData();
    }

    setNewYurt({
      ad: "",
      sehir: "İstanbul",
      ilce: "",
      adres: "",
      kapasite: 200,
      yetkiliAd: "",
      yetkiliTel: "",
      yetkiliEposta: "",
      yurtTuru: "Kız Öğrenci Yurdu",
    });
  };

  // B. Yurt Durumu Güncelle
  const toggleYurtStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "aktif" ? "askida" : "aktif";
    showToast(`Yurt durumu güncelleniyor: ${newStatus === "aktif" ? "Aktif" : "Askıda"}...`);

    try {
      const { error } = await supabase.from("yurtlar").update({ durum: newStatus }).eq("id", id);
      if (error) {
        console.warn("Supabase update error:", error);
      }
    } catch (e) {
      console.warn("Supabase update hata:", e);
    } finally {
      await fetchDbData();
    }
  };

  // C. Yurt Sil
  const deleteYurt = async (id: string, ad: string) => {
    if (!confirm(`"${ad}" yurdunu veritabanından kalıcı olarak silmek istediğinize emin misiniz?`)) return;

    showToast(`"${ad}" veritabanından siliniyor...`);
    try {
      const { error } = await supabase.from("yurtlar").delete().eq("id", id);
      if (error) {
        console.warn("Supabase delete error:", error);
      } else {
        showToast(`"${ad}" başarıyla silindi.`);
      }
    } catch (e) {
      console.warn("Supabase delete hatası:", e);
    } finally {
      await fetchDbData();
    }
  };

  // ==========================================
  // YÖNETİCİ OPERASYONEL FONKSİYONLARI
  // ==========================================

  // Çamaşırhane Sırası Fonksiyonları
  const handleSaveLaundry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLaundry.ogrenciAd.trim() || !newLaundry.odaNo.trim()) {
      showToast("Lütfen öğrenci adı ve oda numarasını giriniz.");
      return;
    }

    const isConflict = laundrySlots.some(
      (s) =>
        s.tarih === newLaundry.tarih &&
        s.saatAraligi === newLaundry.saatAraligi &&
        s.makineNo === newLaundry.makineNo &&
        s.durum !== "İptal" &&
        s.durum !== "Tamamlandı"
    );

    if (isConflict) {
      showToast("Uyarı: Bu makine seçilen saatte zaten dolu görünüyor!");
    }

    if (dailyLaundryLimit > 0) {
      const studentDayCount = laundrySlots.filter(
        (s) =>
          s.tarih === newLaundry.tarih &&
          s.ogrenciAd.toLowerCase() === newLaundry.ogrenciAd.trim().toLowerCase() &&
          s.durum !== "İptal"
      ).length;

      if (studentDayCount >= dailyLaundryLimit) {
        showToast(
          `Bilgi: ${newLaundry.ogrenciAd.trim()} için belirlenen günlük maksimum çamaşır sınırına (${dailyLaundryLimit} yıkama) ulaşıldı.`
        );
      }
    }

    if (dailyDormLaundryLimit > 0) {
      const dormDayCount = laundrySlots.filter(
        (s) => s.tarih === newLaundry.tarih && s.durum !== "İptal"
      ).length;

      if (dormDayCount >= dailyDormLaundryLimit) {
        showToast(
          `Bilgi: ${newLaundry.tarih} tarihi için yurt geneli günlük maksimum çamaşır kapasitesine (${dailyDormLaundryLimit} randevu) ulaşıldı.`
        );
      }
    }

    const { formattedRange } = parseSlotMinutes(newLaundry.saatAraligi);
    const dynamicStatus = getDynamicSlotStatus({
      tarih: newLaundry.tarih,
      saatAraligi: formattedRange,
      durum: newLaundry.durum,
    });

    const createdSlot: LaundrySlot = {
      id: `lnd-${Date.now()}`,
      ogrenciAd: newLaundry.ogrenciAd.trim(),
      odaNo: newLaundry.odaNo.trim(),
      makineNo: cleanMachineName(newLaundry.makineNo),
      tarih: newLaundry.tarih,
      saatAraligi: formattedRange,
      program: newLaundry.program,
      durum: dynamicStatus,
      not: newLaundry.not?.trim() || undefined,
    };

    let currentSlots = laundrySlots;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("yurtify_laundry") || localStorage.getItem("yurtify_laundry_slots");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) currentSlots = parsed;
        }
      } catch {}
    }

    const updated = [createdSlot, ...currentSlots.filter((s) => s.id !== createdSlot.id)];
    setLaundrySlots(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_laundry", JSON.stringify(updated));
      localStorage.setItem("yurtify_laundry_slots", JSON.stringify(updated));
    }
    setIsAddLaundryModalOpen(false);
    showToast(`${createdSlot.ogrenciAd} için çamaşırhane sırası oluşturuldu!`);
    setNewLaundry({
      ogrenciAd: "",
      odaNo: "101",
      makineNo: "Makine 1 (A-1)",
      tarih: selectedLaundryDate,
      saatAraligi: "09:00 - 10:30",
      program: "Renkli & Karışık",
      durum: "Sırada",
      not: "",
    });
  };

  const handleUpdateLaundryStatus = (id: string, newStatus: "Yıkanıyor" | "Sırada" | "Tamamlandı" | "İptal") => {
    let currentSlots = laundrySlots;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("yurtify_laundry") || localStorage.getItem("yurtify_laundry_slots");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) currentSlots = parsed;
        }
      } catch {}
    }
    const updated = currentSlots.map((s) => (s.id === id ? { ...s, durum: newStatus } : s));
    setLaundrySlots(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_laundry", JSON.stringify(updated));
      localStorage.setItem("yurtify_laundry_slots", JSON.stringify(updated));
    }
    showToast(`Çamaşır durumu güncellendi: ${newStatus}`);
  };

  const handleDeleteLaundry = (id: string) => {
    let currentSlots = laundrySlots;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("yurtify_laundry") || localStorage.getItem("yurtify_laundry_slots");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) currentSlots = parsed;
        }
      } catch {}
    }
    const updated = currentSlots.filter((s) => s.id !== id);
    setLaundrySlots(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_laundry", JSON.stringify(updated));
      localStorage.setItem("yurtify_laundry_slots", JSON.stringify(updated));
    }
    showToast("Çamaşır sırası silindi.");
  };

  const openQuickAddLaundry = (machine: string, timeSlot: string, date: string) => {
    setNewLaundry({
      ogrenciAd: "",
      odaNo: "101",
      makineNo: machine,
      tarih: date,
      saatAraligi: timeSlot,
      program: machine.includes("Kurutma") ? "Kurutma & Havalandırma" : "Renkli & Karışık",
      durum: "Sırada",
      not: "",
    });
    setIsAddLaundryModalOpen(true);
  };

  // Makine Sayısı & Filo Yönetim Fonksiyonları
  const handleQuickSetCount = (type: "yikama" | "kurutma", delta: number) => {
    const currentWashing = laundryMachines.filter((m) => m.tur === "yikama" || m.tip.toLowerCase().includes("yıkama") || m.id.includes("Makine"));
    const currentDryers = laundryMachines.filter((m) => m.tur === "kurutma" || m.tip.toLowerCase().includes("kurutma") || m.id.includes("Kurutma"));

    if (type === "yikama") {
      const newCount = currentWashing.length + delta;
      if (newCount < 1) {
        showToast("En az 1 adet çamaşır yıkama makinesi bulunmalıdır.");
        return;
      }
      if (newCount > 30) {
        showToast("Maksimum 30 adet çamaşır makinesi belirlenebilir.");
        return;
      }

      let updatedWashing = [...currentWashing];
      if (delta > 0) {
        const nextNum = updatedWashing.length + 1;
        const block = nextNum <= 3 ? "A Blok" : nextNum <= 6 ? "B Blok" : "C Blok";
        const id = `Makine ${nextNum} (${block})`;
        updatedWashing.push({
          id,
          name: `Makine ${nextNum} (${block})`,
          tip: "Yıkama • 9 kg",
          tur: "yikama",
          kapasiteKg: 9,
        });
      } else {
        updatedWashing.pop();
      }

      const updatedAll = [...updatedWashing, ...currentDryers];
      setLaundryMachines(updatedAll);
      if (typeof window !== "undefined") {
        localStorage.setItem("yurtify_laundry_machines", JSON.stringify(updatedAll));
      }
      showToast(`Çamaşır yıkama makinesi sayısı ${updatedWashing.length} olarak güncellendi.`);
    } else {
      const newCount = currentDryers.length + delta;
      if (newCount < 0) return;
      if (newCount > 15) {
        showToast("Maksimum 15 adet kurutma makinesi belirlenebilir.");
        return;
      }

      let updatedDryers = [...currentDryers];
      if (delta > 0) {
        const nextNum = updatedDryers.length + 1;
        const id = `Kurutma ${nextNum} (Merkez)`;
        updatedDryers.push({
          id,
          name: `Kurutma ${nextNum} (Merkez)`,
          tip: "Kurutma • 10 kg",
          tur: "kurutma",
          kapasiteKg: 10,
        });
      } else {
        updatedDryers.pop();
      }

      const updatedAll = [...currentWashing, ...updatedDryers];
      setLaundryMachines(updatedAll);
      if (typeof window !== "undefined") {
        localStorage.setItem("yurtify_laundry_machines", JSON.stringify(updatedAll));
      }
      showToast(`Kurutma makinesi sayısı ${updatedDryers.length} olarak güncellendi.`);
    }
  };

  const handleAddCustomMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomMachine.name.trim()) {
      showToast("Lütfen geçerli bir makine adı giriniz.");
      return;
    }

    const cleanName = newCustomMachine.name.trim();
    const cleanBlok = newCustomMachine.blok.trim();
    const displayName = cleanBlok ? `${cleanName} (${cleanBlok})` : cleanName;

    const parsedKapasite = typeof newCustomMachine.kapasiteKg === "string"
      ? parseFloat(newCustomMachine.kapasiteKg.trim())
      : Number(newCustomMachine.kapasiteKg);
    const hasKapasite = !isNaN(parsedKapasite) && parsedKapasite > 0;

    const typeLabel = newCustomMachine.tur === "kurutma" ? "Kurutma" : "Yıkama";
    const tipText = hasKapasite
      ? `${typeLabel} • ${parsedKapasite} kg`
      : typeLabel;

    const createdMachine: LaundryMachine = {
      id: `mach_${Date.now()}`,
      name: displayName,
      tip: tipText,
      tur: newCustomMachine.tur,
      kapasiteKg: hasKapasite ? parsedKapasite : (newCustomMachine.tur === "kurutma" ? 10 : 9),
    };

    const updated = [...laundryMachines, createdMachine];
    setLaundryMachines(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_laundry_machines", JSON.stringify(updated));
    }
    setNewCustomMachine({ name: "", tur: "yikama", kapasiteKg: "", blok: "" });
    showToast(`"${createdMachine.name}" çamaşırhaneye eklendi.`);
  };

  const handleDeleteMachine = (id: string) => {
    if (laundryMachines.length <= 1) {
      showToast("En az 1 adet makine tanımlı kalmalıdır.");
      return;
    }
    const updated = laundryMachines.filter((m) => m.id !== id);
    setLaundryMachines(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_laundry_machines", JSON.stringify(updated));
    }
    showToast("Makine sistemden kaldırıldı.");
  };



  // 1. Yeni Öğrenci Kaydet
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.adSoyad.trim() || !newStudent.odaNo.trim()) {
      showToast("Lütfen öğrenci adı ve oda numarasını eksiksiz giriniz.");
      return;
    }

    const rawName = newStudent.adSoyad.trim();
    let rawEmail = (newStudent.eposta || "").trim();

    // Eğer Ad Soyad alanına doğrudan e-posta yazıldıysa
    if (!rawEmail && rawName.includes("@")) {
      rawEmail = rawName;
    } else if (!rawEmail) {
      rawEmail = `${rawName.toLowerCase().replace(/[^a-z0-9]/g, ".")}@gmail.com`;
    }

    const cleanUsername = rawEmail.includes("@")
      ? rawEmail.split("@")[0].toLowerCase()
      : rawName.toLowerCase().replace(/\s+/g, ".");

    const createdStudent: Student = {
      id: "std-" + Date.now(),
      adSoyad: rawName,
      eposta: rawEmail,
      kullaniciAdi: cleanUsername,
      sifre: newStudent.sifre?.trim() || "ogrenci123",
      odaNo: newStudent.odaNo,
      yatakNo: newStudent.yatakNo,
    };

    let currentList = students;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("yurtify_students");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentList = parsed;
          }
        }
      } catch (err) {}
    }

    const updatedStudents = [
      createdStudent,
      ...currentList.filter((s) => s.id !== createdStudent.id && s.eposta.toLowerCase() !== rawEmail.toLowerCase()),
    ];
    setStudents(updatedStudents);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_students", JSON.stringify(updatedStudents));
    }

    // Oda doluluğunu 1 artır
    setRooms((prev) =>
      prev.map((r) => (r.odaNo === newStudent.odaNo ? { ...r, doluYatak: Math.min(r.kapasite, r.doluYatak + 1) } : r))
    );

    setIsAddStudentModalOpen(false);
    setNewStudent({
      adSoyad: "",
      eposta: "",
      sifre: "",
      odaNo: "101",
      yatakNo: "1",
    });
    showToast(`"${createdStudent.adSoyad}" başarıyla kaydedildi ve Oda ${createdStudent.odaNo}'e yerleştirildi!`);
  };

  // 1.B Öğrenci Bilgilerini Güncelle (Yönetici Düzenlemesi)
  const handleEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const oldStudent = students.find((s) => s.id === editingStudent.id);
    const updated = students.map((s) => (s.id === editingStudent.id ? editingStudent : s));
    setStudents(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_students", JSON.stringify(updated));
    }

    // Eğer oda değiştiyse odaların doluluklarını senkronize et
    if (oldStudent && oldStudent.odaNo !== editingStudent.odaNo) {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.odaNo === oldStudent.odaNo) return { ...r, doluYatak: Math.max(0, r.doluYatak - 1) };
          if (r.odaNo === editingStudent.odaNo) return { ...r, doluYatak: Math.min(r.kapasite, r.doluYatak + 1) };
          return r;
        })
      );
    }

    setEditingStudent(null);
    showToast(`Öğrenci "${editingStudent.adSoyad}" bilgileri başarıyla güncellendi.`);
  };

  // 2. Öğrenci Sil
  const handleDeleteStudent = (id: string, name: string) => {
    if (!confirm(`"${name}" isimli öğrencinin kaydını silmek istediğinize emin misiniz?`)) return;

    const targetStudent = students.find((s) => s.id === id);
    const updated = students.filter((s) => s.id !== id);
    setStudents(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_students", JSON.stringify(updated));
    }

    // Odanın doluluk sayısını 1 düşür
    if (targetStudent) {
      setRooms((prev) =>
        prev.map((r) => (r.odaNo === targetStudent.odaNo ? { ...r, doluYatak: Math.max(0, r.doluYatak - 1) } : r))
      );
    }
    showToast(`Öğrenci kaydı silindi: ${name}`);
  };

  // ==========================================
  // ODA & YATAK YÖNETİMİ FONKSİYONLARI
  // ==========================================

  // A. Yeni Oda Ekle
  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.odaNo.trim()) {
      showToast("Lütfen oda numarasını giriniz.");
      return;
    }
    if (rooms.some((r) => r.odaNo === newRoom.odaNo.trim())) {
      showToast(`Hata: "Oda ${newRoom.odaNo}" zaten mevcut!`);
      return;
    }

    const createdRoom: Room = {
      id: "r-" + Date.now(),
      odaNo: newRoom.odaNo.trim(),
      blok: newRoom.blok,
      kat: Number(newRoom.kat) || 1,
      kapasite: Number(newRoom.kapasite) || 3,
      doluYatak: 0,
      odaTipi: newRoom.odaTipi,
      durum: "Aktif",
    };

    const updatedRooms = [...rooms, createdRoom];
    setRooms(updatedRooms);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_rooms", JSON.stringify(updatedRooms));
    }
    setIsAddRoomModalOpen(false);
    setNewRoom({ odaNo: "", blok: "A Blok", kat: 1, kapasite: 3, odaTipi: "Standart Balkonlu" });
    showToast(`Oda ${createdRoom.odaNo} (${createdRoom.kapasite} Yataklı) başarıyla oluşturuldu!`);
  };

  // B. Oda Güncelle (Kapasite, Tip, Blok, Kat vb.)
  const handleUpdateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;

    const updated = rooms.map((r) => (r.id === editingRoom.id ? editingRoom : r));
    setRooms(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_rooms", JSON.stringify(updated));
    }
    setEditingRoom(null);
    showToast(`Oda ${editingRoom.odaNo} ayarları kaydedildi.`);
  };

  // C. Oda Sil
  const handleDeleteRoom = (id: string, odaNo: string) => {
    const studentsInRoom = students.filter((s) => s.odaNo === odaNo);
    if (studentsInRoom.length > 0) {
      showToast(`Oda ${odaNo} içinde kayıtlı ${studentsInRoom.length} öğrenci var! Önce öğrencileri başka odaya taşıyınız.`);
      return;
    }
    if (!confirm(`Oda ${odaNo}'i sistemden silmek istediğinize emin misiniz?`)) return;

    const updated = rooms.filter((r) => r.id !== id);
    setRooms(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_rooms", JSON.stringify(updated));
    }
    showToast(`Oda ${odaNo} silindi.`);
  };

  // ==========================================
  // YEMEKHANE & YURT AYARLARI FONKSİYONLARI
  // ==========================================
  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingMenu(false);
    const updated = {
      ...dailyMenu,
      tarih: getTodayDateKey(),
    };
    setDailyMenu(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_menu", JSON.stringify(updated));
    }
    showToast("Günün yemek menüsü güncellendi ve öğrencilere yayınlandı!");
  };

  const handleManualResetMenu = () => {
    if (confirm("Bugünün yemek menüsü sıfırlansın mı? Sabah ve akşam menü içerikleri temizlenecektir.")) {
      const reset = getResetDailyMenu(dailyMenu);
      setDailyMenu(reset);
      if (typeof window !== "undefined") {
        localStorage.setItem("yurtify_menu", JSON.stringify(reset));
      }
      showToast("Günün yemek menüsü sıfırlandı.");
    }
  };

  const handleToggleViewMode = (mode: "tek" | "birlikte") => {
    const updated = { ...dailyMenu, gorunumModu: mode };
    setDailyMenu(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_menu", JSON.stringify(updated));
    }
    showToast(
      mode === "tek"
        ? " Menü modu: Sadece seçili tek öğün gösterilecek."
        : " Menü modu: Hem Kahvaltı hem Akşam Yemeği aynı anda gösterilecek."
    );
  };


  const handleToggleActiveMeal = (meal: "kahvalti" | "aksam") => {
    const updated = { ...dailyMenu, aktifOgun: meal };
    setDailyMenu(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_menu", JSON.stringify(updated));
    }
    showToast(`Tek öğün modunda "${meal === "kahvalti" ? "Sabah Kahvaltısı" : "Akşam Yemeği"}" seçildi.`);
  };

  // Günlük yemek katılım tercihini kaydet (Öğrenci Varım / Yokum tercihi)
  const handleSaveMealAttendance = (
    status: "var" | "yok",
    studentName?: string,
    studentKey?: string
  ) => {
    const today = getTodayDateKey();
    const sName = studentName || currentUser?.name || "Öğrenci";
    const sKey = studentKey || currentUser?.details || currentUser?.name || "ogrenci";

    let current = mealAttendance;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("yurtify_meal_attendance");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) current = parsed;
        }
      } catch {}
    }

    const filtered = current.filter(
      (r) =>
        !(
          r.date === today &&
          (r.studentKey.toLowerCase() === sKey.toLowerCase() ||
            r.studentName.toLowerCase() === sName.toLowerCase())
        )
    );

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newRecord: MealAttendanceRecord = {
      id: `att-${Date.now()}`,
      studentKey: sKey,
      studentName: sName,
      date: today,
      status: status,
      updatedAt: timeStr,
    };

    const updated = [newRecord, ...filtered];
    setMealAttendance(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_meal_attendance", JSON.stringify(updated));
    }
  };

  const handleSelectMealMode = (mode: "kahvalti" | "aksam" | "birlikte") => {
    let updated;
    if (mode === "birlikte") {
      updated = { ...dailyMenu, gorunumModu: "birlikte" as const };
      showToast("Görünüm modu: Her iki öğün de aktif.");
    } else {
      updated = { ...dailyMenu, gorunumModu: "tek" as const, aktifOgun: mode };
      showToast(`Tek öğün modu: ${mode === "kahvalti" ? "Sabah Kahvaltısı" : "Akşam Yemeği"} seçildi.`);
    }
    setDailyMenu(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_menu", JSON.stringify(updated));
    }
  };

  const handleToggleGunTipi = (tip: "haftaici" | "haftasonu" | "ozelgun") => {
    const currentSaatler = dailyMenu.saatler || {
      haftaici: { kahvalti: "07:30 - 10:00", aksam: "18:00 - 20:30" },
      haftasonu: { kahvalti: "08:30 - 11:30", aksam: "18:30 - 21:00" },
      ozelgun: { kahvalti: "09:00 - 12:00", aksam: "19:00 - 21:30" },
    };
    const activeSaatler = currentSaatler[tip] || currentSaatler.haftaici;
    const updated = {
      ...dailyMenu,
      gunTipi: tip,
      kahvaltiSaat: activeSaatler.kahvalti,
      aksamSaat: activeSaatler.aksam,
      saatler: currentSaatler,
    };
    setDailyMenu(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_menu", JSON.stringify(updated));
    }
    const tipLabels = {
      haftaici: "Hafta İçi",
      haftasonu: "Hafta Sonu",
      ozelgun: "Bayram / Özel Gün",
    };
    showToast(`Yemek saati tarifesi seçildi: ${tipLabels[tip]}`);
  };

  const handleUpdateScheduleTimes = (
    tip: "haftaici" | "haftasonu" | "ozelgun",
    field: "kahvalti" | "aksam",
    value: string
  ) => {
    const currentSaatler = dailyMenu.saatler || {
      haftaici: { kahvalti: "07:30 - 10:00", aksam: "18:00 - 20:30" },
      haftasonu: { kahvalti: "08:30 - 11:30", aksam: "18:30 - 21:00" },
      ozelgun: { kahvalti: "09:00 - 12:00", aksam: "19:00 - 21:30" },
    };
    const newSaatler = {
      ...currentSaatler,
      [tip]: {
        ...currentSaatler[tip],
        [field]: value,
      },
    };
    const updated = {
      ...dailyMenu,
      saatler: newSaatler,
      kahvaltiSaat: (dailyMenu.gunTipi || "haftaici") === tip && field === "kahvalti" ? value : dailyMenu.kahvaltiSaat,
      aksamSaat: (dailyMenu.gunTipi || "haftaici") === tip && field === "aksam" ? value : dailyMenu.aksamSaat,
    };
    setDailyMenu(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_menu", JSON.stringify(updated));
    }
  };

  const formatDisplayHours = (rangeStr: string) => {
    if (!rangeStr) return rangeStr;
    return rangeStr
      .split("-")
      .map((part) => {
        const trimmed = part.trim();
        const [h, m] = trimmed.split(":");
        if (h !== undefined && m !== undefined) {
          return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
        }
        return trimmed;
      })
      .join(" - ");
  };

  const openTimePicker = (
    tip: "haftaici" | "haftasonu" | "ozelgun",
    field: "kahvalti" | "aksam",
    title: string
  ) => {
    const currentTimeStr =
      dailyMenu.saatler?.[tip]?.[field] ||
      (field === "kahvalti" ? "07:30 - 10:00" : "18:00 - 20:30");

    const parts = currentTimeStr.split("-").map((s) => s.trim());
    let sH = field === "kahvalti" ? 7 : 18;
    let sM = field === "kahvalti" ? 30 : 0;
    let eH = field === "kahvalti" ? 10 : 20;
    let eM = field === "kahvalti" ? 0 : 30;

    if (parts.length >= 1 && parts[0].includes(":")) {
      const [h, m] = parts[0].split(":").map((v) => parseInt(v, 10));
      if (!isNaN(h)) sH = Math.min(23, Math.max(0, h));
      if (!isNaN(m)) sM = Math.min(55, Math.max(0, Math.round(m / 5) * 5));
    }
    if (parts.length >= 2 && parts[1].includes(":")) {
      const [h, m] = parts[1].split(":").map((v) => parseInt(v, 10));
      if (!isNaN(h)) eH = Math.min(23, Math.max(0, h));
      if (!isNaN(m)) eM = Math.min(55, Math.max(0, Math.round(m / 5) * 5));
    }

    setTimePickerModal({
      isOpen: true,
      tip,
      field,
      title,
      startHour: sH,
      startMinute: sM,
      endHour: eH,
      endMinute: eM,
    });
  };

  const handleApplyTimePicker = () => {
    const sH = String(timePickerModal.startHour).padStart(2, "0");
    const sM = String(timePickerModal.startMinute).padStart(2, "0");
    const eH = String(timePickerModal.endHour).padStart(2, "0");
    const eM = String(timePickerModal.endMinute).padStart(2, "0");
    const formatted = `${sH}:${sM} - ${eH}:${eM}`;

    handleUpdateScheduleTimes(timePickerModal.tip, timePickerModal.field, formatted);
    setTimePickerModal((prev) => ({ ...prev, isOpen: false }));
    showToast(`Servis saati güncellendi: ${formatted}`);
  };

  const openEntryTimePicker = (
    field: "haftaici" | "haftasonu" | "cikisHaftaIci" | "cikisHaftaSonu",
    title: string
  ) => {
    let currentVal = "23:00";
    let defaultH = 23;
    let defaultM = 0;

    if (field === "haftaici") {
      currentVal = yurtSettings.sonGirisHaftaIci || "23:00";
      defaultH = 23;
      defaultM = 0;
    } else if (field === "haftasonu") {
      currentVal = yurtSettings.sonGirisHaftaSonu || "23:45";
      defaultH = 23;
      defaultM = 45;
    } else if (field === "cikisHaftaIci") {
      currentVal = yurtSettings.ilkCikisHaftaIci || "06:00";
      defaultH = 6;
      defaultM = 0;
    } else if (field === "cikisHaftaSonu") {
      currentVal = yurtSettings.ilkCikisHaftaSonu || "06:30";
      defaultH = 6;
      defaultM = 30;
    }

    let h = defaultH;
    let m = defaultM;
    if (currentVal && currentVal.includes(":")) {
      const [hStr, mStr] = currentVal.split(":").map((v) => parseInt(v, 10));
      if (!isNaN(hStr)) h = Math.min(23, Math.max(0, hStr));
      if (!isNaN(mStr)) m = Math.min(55, Math.max(0, Math.round(mStr / 5) * 5));
    }
    setEntryTimeModal({
      isOpen: true,
      field,
      title,
      hour: h,
      minute: m,
    });
  };

  const handleApplyEntryTime = () => {
    const h = String(entryTimeModal.hour).padStart(2, "0");
    const m = String(entryTimeModal.minute).padStart(2, "0");
    const formatted = `${h}:${m}`;

    let settingKey: "sonGirisHaftaIci" | "sonGirisHaftaSonu" | "ilkCikisHaftaIci" | "ilkCikisHaftaSonu" = "sonGirisHaftaIci";
    let label = "Son giriş saati";

    if (entryTimeModal.field === "haftaici") {
      settingKey = "sonGirisHaftaIci";
      label = "Hafta içi son giriş saati";
    } else if (entryTimeModal.field === "haftasonu") {
      settingKey = "sonGirisHaftaSonu";
      label = "Hafta sonu son giriş saati";
    } else if (entryTimeModal.field === "cikisHaftaIci") {
      settingKey = "ilkCikisHaftaIci";
      label = "Hafta içi ilk çıkış saati";
    } else if (entryTimeModal.field === "cikisHaftaSonu") {
      settingKey = "ilkCikisHaftaSonu";
      label = "Hafta sonu ilk çıkış saati";
    }

    const updatedSettings = {
      ...yurtSettings,
      [settingKey]: formatted,
    };
    setYurtSettings(updatedSettings);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_settings", JSON.stringify(updatedSettings));
    }
    setEntryTimeModal((prev) => ({ ...prev, isOpen: false }));
    showToast(`${label} güncellendi: ${formatted}`);
  };

  const handleSaveYurtSettings = async (e: React.FormEvent, customToast?: string) => {
    e.preventDefault();
    const finalKapasite = typeof yurtSettings.kapasite === "string"
      ? (parseInt(yurtSettings.kapasite, 10) || 0)
      : (yurtSettings.kapasite || 0);
    const settingsToSave = {
      ...yurtSettings,
      kapasite: finalKapasite,
    };

    // 1. Local state güncelle
    setYurtSettings(settingsToSave);

    // 2. LocalStorage'a kaydet
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_settings", JSON.stringify(settingsToSave));
    }

    // 3. Aktif kullanıcıyı (currentUser) hemen güncelle
    setCurrentUser((prev: any) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        selectedYurtName: settingsToSave.ad,
        name: prev.role === "yonetici" ? (settingsToSave.yetkiliAd || prev.name) : prev.name,
      };
      if (typeof window !== "undefined") {
        sessionStorage.setItem("yurtify_session", JSON.stringify(updated));
      }
      return updated;
    });

    // 4. Hedef yurt ID'sini belirle ve yurtlar state'ini güncelle
    const targetYurtId = currentUser?.selectedYurtId || yurtlar[0]?.id || "af81f031-1988-401e-84af-42ac75b4d409";
    
    if (yurtlar.length > 0) {
      const updatedYurtlar = yurtlar.map((y) =>
        y.id === targetYurtId || yurtlar.length === 1
          ? {
              ...y,
              ad: settingsToSave.ad,
              yetkiliAd: settingsToSave.yetkiliAd,
              kapasite: finalKapasite,
            }
          : y
      );
      setYurtlar(updatedYurtlar);
      if (typeof window !== "undefined") {
        localStorage.setItem("yurtify_yurtlar", JSON.stringify(updatedYurtlar));
      }
    } else {
      const newYurtObj: Yurt = {
        id: targetYurtId,
        ad: settingsToSave.ad,
        sehir: settingsToSave.sehir || "İstanbul",
        ilce: settingsToSave.ilce || "Kadıköy",
        adres: settingsToSave.adres || "",
        kapasite: finalKapasite,
        mevcutOgrenci: 0,
        yetkiliAd: settingsToSave.yetkiliAd,
        yetkiliTel: settingsToSave.yetkiliTel || "",
        yetkiliEposta: "mudur@gunesyurdu.com",
        durum: "aktif",
        yurtTuru: "Kız Öğrenci Yurdu",
        kayitTarihi: new Date().toLocaleDateString("tr-TR"),
      };
      setYurtlar([newYurtObj]);
      if (typeof window !== "undefined") {
        localStorage.setItem("yurtify_yurtlar", JSON.stringify([newYurtObj]));
      }
    }

    // 5. Supabase veritabanında da güncelle
    try {
      if (targetYurtId) {
        const { error } = await supabase
          .from("yurtlar")
          .update({
            ad: settingsToSave.ad,
            yetkili_ad: settingsToSave.yetkiliAd,
            kapasite: finalKapasite,
          })
          .eq("id", targetYurtId);

        if (error) {
          console.warn("Supabase yurt güncelleme uyarısı:", error.message);
        }
      }
    } catch (err) {
      console.warn("Supabase veritabanı bağlantı hatası:", err);
    }

    showToast(customToast || "Yurt kurumsal ve operasyonel ayarları kaydedildi.");
  };

  const handleSaveAdminSecuritySettings = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedPassword = yurtSettings.adminSifre || "mudur123456";

    // Şifre değiştirilmek isteniyorsa
    if (adminPasswordForm.yeniSifre.trim() || adminPasswordForm.yeniSifreTekrar.trim() || adminPasswordForm.mevcutSifre.trim()) {
      const currentConfigured = yurtSettings.adminSifre || "mudur123456";
      if (!adminPasswordForm.mevcutSifre.trim()) {
        showToast("Şifre güncellemek için mevcut şifrenizi girmeniz zorunludur!");
        return;
      }
      if (adminPasswordForm.mevcutSifre.trim() !== currentConfigured) {
        showToast("Mevcut şifrenizi hatalı girdiniz! Güvenlik nedeniyle şifre güncellenemedi.");
        return;
      }
      if (adminPasswordForm.yeniSifre !== adminPasswordForm.yeniSifreTekrar) {
        showToast("Yeni şifreler birbiriyle uyuşmuyor!");
        return;
      }
      if (adminPasswordForm.yeniSifre.length < 6) {
        showToast("Yeni şifre en az 6 karakter olmalıdır!");
        return;
      }
      const hasLetter = /[a-zA-Z]/.test(adminPasswordForm.yeniSifre);
      const hasNumber = /[0-9]/.test(adminPasswordForm.yeniSifre);
      if (!hasLetter || !hasNumber) {
        showToast("Yeni şifre güvenliğiniz için en az bir harf ve bir rakam içermelidir!");
        return;
      }
      updatedPassword = adminPasswordForm.yeniSifre.trim();
    }

    const settingsToSave = {
      ...yurtSettings,
      adminSifre: updatedPassword,
    };

    setYurtSettings(settingsToSave);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_settings", JSON.stringify(settingsToSave));
    }
    setAdminPasswordForm({ mevcutSifre: "", yeniSifre: "", yeniSifreTekrar: "" });
    showToast("Yönetici güvenlik ayarları başarıyla kaydedildi.");
  };


  // 6. Arıza Durumu Döngüsü (Açık -> İnceleniyor -> Çözüldü)
  const handleToggleMaintenanceStatus = (id: string) => {
    const updated = maintenanceTickets.map((m) => {
      if (m.id === id) {
        let nextDurum: "Açık" | "İnceleniyor" | "Çözüldü" = "İnceleniyor";
        if (m.durum === "Açık") nextDurum = "İnceleniyor";
        else if (m.durum === "İnceleniyor") nextDurum = "Çözüldü";
        else nextDurum = "Açık";
        showToast(`Arıza durumu: ${nextDurum}`);
        return { ...m, durum: nextDurum };
      }
      return m;
    });
    setMaintenanceTickets(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_maintenance", JSON.stringify(updated));
    }
  };

  // 7. Yeni Arıza Talebi Ekle
  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaintenance.baslik.trim()) {
      showToast("Lütfen arıza başlığı giriniz.");
      return;
    }

    const created: MaintenanceTicket = {
      id: "mnt-" + Date.now(),
      odaNo: newMaintenance.odaNo,
      baslik: newMaintenance.baslik.trim(),
      kategori: newMaintenance.kategori,
      oncelik: newMaintenance.oncelik,
      durum: "Açık",
      bildiren: newMaintenance.bildiren || "Yönetim",
      tarih: new Date().toLocaleDateString("tr-TR"),
    };

    const updated = [created, ...maintenanceTickets];
    setMaintenanceTickets(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_maintenance", JSON.stringify(updated));
    }
    setIsAddMaintenanceModalOpen(false);
    setNewMaintenance({ odaNo: "101", baslik: "", kategori: "Tesisat", oncelik: "Orta", bildiren: "Yönetim" });
    showToast(` Oda ${created.odaNo} için yeni arıza kaydı oluşturuldu.`);
  };

  // 8. Yeni Duyuru Ekle
  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.baslik.trim() || !newAnnouncement.icerik.trim()) {
      showToast("Lütfen başlık ve içerik doldurunuz.");
      return;
    }

    const created: Announcement = {
      id: "anc-" + Date.now(),
      baslik: newAnnouncement.baslik.trim(),
      icerik: newAnnouncement.icerik.trim(),
      oncelik: newAnnouncement.oncelik,
      tarih: new Date().toLocaleDateString("tr-TR"),
    };

    const updated = [created, ...announcements];
    setAnnouncements(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_announcements", JSON.stringify(updated));
    }
    setIsAddAnnouncementModalOpen(false);
    setNewAnnouncement({ baslik: "", icerik: "", oncelik: "Normal" });
    showToast(" Yeni duyuru panoya asıldı!");
  };

  // 9. Duyuru Sil
  const handleDeleteAnnouncement = (id: string) => {
    const updated = announcements.filter((a) => a.id !== id);
    setAnnouncements(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_announcements", JSON.stringify(updated));
    }
    showToast("Duyuru kaldırıldı.");
  };

  // Filtreler & Metrikler
  const filteredYurtlar = yurtlar.filter((y) => {
    const matchesSearch =
      y.ad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      y.sehir.toLowerCase().includes(searchTerm.toLowerCase()) ||
      y.yetkiliAd.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === "all" || y.sehir === cityFilter;
    return matchesSearch && matchesCity;
  });

  const totalKapasite = yurtlar.reduce((acc, y) => acc + y.kapasite, 0);
  const totalOgrenci = yurtlar.reduce((acc, y) => acc + y.mevcutOgrenci, 0);
  const activeYurtlar = yurtlar.filter((y) => y.durum === "aktif").length;

  // ==========================================
  // OTURUM KONTROLÜ (GİRİŞ EKRANI PARLAMASINI ÖNLER)
  // ==========================================
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex flex-col justify-center items-center p-4 relative font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0284C7] border border-[#0369A1] flex items-center justify-center text-white font-black text-2xl shadow-xs animate-pulse">
            Y
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0284C7] animate-ping"></span>
            <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
              Yurtify hazırlanıyor...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // GİRİŞ KAPISI
  // ==========================================
  if (!currentUser) {
    return (
      <div className="login-screen-container min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-center items-center p-3 sm:p-6 relative overflow-hidden font-sans">
        
        {/* Canlı Realtime & DB Durum Rozeti ve Tema Değiştirici */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2 z-20">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Aydınlık moda geç" : "Karanlık moda geç"}
            title={theme === "dark" ? "Aydınlık Moda Geç" : "Karanlık Moda Geç"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer bg-white text-[#0F172A] border-[#E2E8F0] shadow-xs active:scale-95 hover:border-[#0284C7]"
          >
            {theme === "dark" ? (
              <>
                <svg className="w-3.5 h-3.5 text-sky-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <span>Aydınlık Mod</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-[#0284C7] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                <span>Karanlık Mod</span>
              </>
            )}
          </button>

          <div className="hidden xs:flex items-center gap-1.5 sm:gap-2 bg-white border border-[#E2E8F0] px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] shadow-xs">
            <span
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                realtimeActive ? "bg-[#0284C7] animate-pulse" : "bg-[#0284C7]"
              }`}
            ></span>
            <span className="text-[#64748B] font-medium">
              {realtimeActive ? "Realtime Aktif" : "Sistem Hazır"}
            </span>
          </div>
        </div>

        <div className="w-full max-w-sm sm:max-w-md relative z-10">
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#0284C7] border border-[#0369A1] items-center justify-center text-white font-black text-xl sm:text-2xl mb-2 sm:mb-3">
              Y
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0F172A]">Yurtify</h1>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xs">
            <div className="flex bg-[#F1F5F9] p-1 sm:p-1.5 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 border border-[#E2E8F0] text-[11px] sm:text-xs font-bold">
              <button
                type="button"
                onClick={() => handleRoleChange("superadmin")}
                className={`flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all cursor-pointer ${
                  activeRole === "superadmin"
                    ? "bg-[#0284C7] text-white"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Süper Admin
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("yonetici")}
                className={`flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all cursor-pointer ${
                  activeRole === "yonetici"
                    ? "bg-[#0284C7] text-white"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Yurt Müdürü
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("ogrenci")}
                className={`flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all cursor-pointer ${
                  activeRole === "ogrenci"
                    ? "bg-[#0284C7] text-white"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Öğrenci
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-4">
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-[#64748B] mb-1 sm:mb-1.5">
                  {activeRole === "superadmin"
                    ? "Süper Admin E-posta veya Kullanıcı Adı"
                    : activeRole === "yonetici"
                    ? "Yönetici E-posta veya Kullanıcı Adı"
                    : "Öğrenci E-posta veya Kullanıcı Adı"}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/25 transition-all font-mono font-medium"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 sm:mb-1.5">
                  <label className="text-[11px] sm:text-xs font-semibold text-[#64748B]">Şifre</label>
                  <span className="text-[10px] sm:text-[11px] text-[#64748B] hover:text-[#0F172A] hover:underline cursor-pointer font-medium">
                    Şifremi Unuttum
                  </span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/25 transition-all font-mono font-medium"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 sm:p-3 rounded-xl text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-black rounded-xl transition-colors cursor-pointer text-xs sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed border border-[#0369A1] hover:border-[#0284C7]"
              >
                {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
              </button>
            </form>

            {yurtSettings.hizliGirisIzin === true && (
              <div className="mt-4 sm:mt-6 pt-3.5 sm:pt-5 border-t border-[#E2E8F0] text-center space-y-2">
                <p className="text-[10px] sm:text-[11px] text-[#64748B] font-semibold">Test / Hızlı Giriş:</p>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("superadmin")}
                    className="py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl bg-[#F1F5F9] hover:bg-[#0284C7] text-[11px] sm:text-xs font-bold text-[#0F172A] hover:text-white border border-[#E2E8F0] cursor-pointer transition-colors"
                  >
                    Süper Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("yonetici")}
                    disabled={yurtSettings.adminGirisAktif === false}
                    className="py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold border transition-colors bg-[#F1F5F9] hover:bg-[#0284C7] text-[#0F172A] hover:text-white border-[#E2E8F0] cursor-pointer"
                  >
                    Yurt Müdürü
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("ogrenci")}
                    className="py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl bg-[#F1F5F9] hover:bg-[#0284C7] text-[11px] sm:text-xs font-bold text-[#0F172A] hover:text-white border border-[#E2E8F0] cursor-pointer transition-colors"
                  >
                    Öğrenci
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // PANELLER (DASHBOARD)
  // ==========================================
  const openTickets = maintenanceTickets.filter((t) => t.durum !== "Çözüldü").length;

  const managerTabItems = [
    {
      id: "anasayfa",
      label: "Ana Sayfa",
      name: "Ana Sayfa",
      shortName: "Ana Sayfa",
      badge: "Genel Bakış",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: "yemekhane",
      label: "Yemekhane",
      name: "Yemekhane",
      shortName: "Yemekhane",
      badge: "Menü & Saat",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      id: "camasirhane",
      label: `Çamaşırhane (${liveLaundrySlots.filter(s => normalizeDateStr(s.tarih) === selectedLaundryDate && s.durum !== "Tamamlandı" && s.durum !== "İptal").length})`,
      name: "Çamaşırhane",
      shortName: "Çamaşır",
      badge: `${liveLaundrySlots.filter(s => normalizeDateStr(s.tarih) === selectedLaundryDate && s.durum !== "Tamamlandı" && s.durum !== "İptal").length} Aktif`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4V4zm8 12a4 4 0 100-8 4 4 0 000 8zm-5-9h.01M10 7h.01" />
        </svg>
      ),
    },
    {
      id: "arizalar",
      label: `Arızalar (${openTickets})`,
      name: "Arızalar",
      shortName: "Arızalar",
      badge: `${openTickets} Açık`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    },
    {
      id: "ayarlar",
      label: "Yurt Ayarları",
      name: "Yurt Ayarları",
      shortName: "Ayarlar",
      badge: `${students.length} Öğrenci & Sistem`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const currentTabInfo = managerTabItems.find((t) => t.id === managerTab) || managerTabItems[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      {/* Toast Bildirimi */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-[#0284C7] text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-[#0369A1] shadow-none animate-bounce">
          {notification}
        </div>
      )}

      {/* Üst Bar (Sayfa kaydırıldığında her zaman sabit kalır) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#1E293B] px-3.5 sm:px-8 py-3 sm:py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 pr-2">
          {/* Logo İkonu */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#0284C7] to-[#0284C7] text-white flex items-center justify-center font-black text-base sm:text-lg border border-[#0369A1]/40 shadow-xs shrink-0">
            Y
          </div>

          {/* Marka & Yurt Bilgisi */}
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            {/* EN ÖNEMLİ PARÇA: YURDUN İSMİ (ANA BAŞLIK) */}
            {(currentUser.role !== "superadmin" || currentUser.selectedYurtName) ? (
              <>
                <h1 className="font-bold text-[13px] sm:text-sm md:text-base text-[#0F172A] dark:text-[#F8FAFC] tracking-tight leading-snug line-clamp-2">
                  {yurtSettings.ad || currentUser.selectedYurtName || yurtlar[0]?.ad || "Karahan Yükseköğrenim Kız Öğrenci Yurdu"}
                </h1>

                {/* ALT SATIR: ZARİF, İNCE YURTIFY VE ROL BİLGİSİ */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-light text-[11px] text-[#64748B] dark:text-[#94A3B8] tracking-normal shrink-0 leading-none">
                    Yurtify
                  </span>
                  <span className="text-[#94A3B8] text-[9px] shrink-0 leading-none">•</span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-[#0284C7] shrink-0 leading-none">
                    {currentUser.role === "yonetici" ? "Yurt Müdürü" : currentUser.role === "superadmin" ? "Süper Admin" : "Öğrenci"}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-light text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] tracking-wide shrink-0">Yurtify</span>
                <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-[#0284C7] text-white border border-[#0369A1]">
                  Süper Admin
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">

          {currentUser.name.includes("Süper Admin") && currentUser.role === "yonetici" && (
            <button
              onClick={() => {
                const superUser = {
                  role: "superadmin" as const,
                  name: "Sistem Sahibi (Süper Admin)",
                  details: "Platform Yöneticisi • Tüm Yurtlar & Lisans Yönetimi",
                };
                setCurrentUser(superUser);
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("yurtify_session", JSON.stringify(superUser));
                }
              }}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold bg-[#0284C7] hover:bg-[#0369A1] text-white border border-[#0369A1] transition-colors cursor-pointer"
            >
              ← <span className="hidden sm:inline">Süper Admin </span>Dön
            </button>
          )}

          {currentUser.role === "superadmin" && (
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
            >
              Çıkış Yap
            </button>
          )}
        </div>
      </header>

      {/* Ana Gövde */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 md:py-8 pb-24 md:pb-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* ========================================================= */}
        {/* A. SÜPER ADMİN PANELİ */}
        {/* ========================================================= */}
        {currentUser.role === "superadmin" && (
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 bg-white border border-[#E2E8F0] p-4 sm:p-6 rounded-2xl sm:rounded-3xl">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-[#0F172A]">
                Yurtlar ve Şubeler
              </h2>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full sm:w-auto justify-center px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors border border-[#0369A1]"
              >
                + Yeni Yurt Ekle
              </button>
            </div>

            {/* İstatistikler (Flat 5-Color Tones) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-[#E2E8F0] border-t-3 sm:border-t-4 border-t-[#0F172A]">
                <div className="text-[11px] sm:text-xs font-semibold text-[#64748B]">Kayıtlı Yurt</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#0F172A] mt-0.5 sm:mt-1">{yurtlar.length}</div>
                <div className="text-[10px] sm:text-[11px] font-bold text-[#64748B] mt-0.5 sm:mt-1">{activeYurtlar} Yurt Aktif</div>
              </div>

              <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-[#E2E8F0] border-t-3 sm:border-t-4 border-t-[#0284C7]">
                <div className="text-[11px] sm:text-xs font-semibold text-[#64748B]">Yatak Kapasitesi</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#0F172A] mt-0.5 sm:mt-1">{totalKapasite}</div>
                <div className="text-[10px] sm:text-[11px] text-[#64748B] mt-0.5 sm:mt-1">Toplam kontenjan</div>
              </div>

              <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-[#E2E8F0] border-t-3 sm:border-t-4 border-t-[#0284C7]">
                <div className="text-[11px] sm:text-xs font-semibold text-[#64748B]">Toplam Öğrenci</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#0F172A] mt-0.5 sm:mt-1">{totalOgrenci}</div>
                <div className="text-[10px] sm:text-[11px] font-bold text-[#0284C7] mt-0.5 sm:mt-1">
                  Doluluk: %{totalKapasite > 0 ? Math.round((totalOgrenci / totalKapasite) * 100) : 0}
                </div>
              </div>

              <div className="bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-[#E2E8F0] border-t-3 sm:border-t-4 border-t-[#0284C7]">
                <div className="text-[11px] sm:text-xs font-semibold text-[#64748B]">Boş Yatak</div>
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#0284C7] mt-0.5 sm:mt-1">{Math.max(0, totalKapasite - totalOgrenci)}</div>
                <div className="text-[10px] sm:text-[11px] font-bold text-[#64748B] mt-0.5 sm:mt-1">Açık Kontenjan</div>
              </div>
            </div>

            {/* Arama & Filtreleme */}
            <div className="bg-white p-4 rounded-2xl border border-yellow-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="w-full sm:w-96">
                <input
                  type="text"
                  placeholder="Yurt adı, şehir veya yetkili ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="bg-yellow-50 border border-yellow-300 rounded-xl px-3 py-2 text-xs text-stone-600 focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="all">Tüm Şehirler</option>
                  <option value="İstanbul">İstanbul</option>
                  <option value="Ankara">Ankara</option>
                  <option value="İzmir">İzmir</option>
                </select>
                <span className="text-xs text-stone-500 whitespace-nowrap">
                  {filteredYurtlar.length} Yurt Listeleniyor
                </span>
              </div>
            </div>

            {/* Yurtlar Tablosu */}
            {/* Yurtlar Listesi (Mobil Kartlar & Masaüstü Tablo) */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2E8F0] p-3 sm:p-4 shadow-xs">
              {/* 1. MOBİL KART GÖRÜNÜMÜ */}
              <div className="sm:hidden space-y-3">
                {filteredYurtlar.length === 0 ? (
                  <div className="p-8 text-center text-[#64748B] bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                    <p className="font-bold text-sm text-[#0F172A]">Henüz Kayıtlı Yurt Bulunmuyor</p>
                    <p className="text-xs text-[#64748B] mt-1">
                      İlk yurdunuzu tanımlamak için yukarıdaki <strong>&ldquo;Yeni Yurt Ekle&rdquo;</strong> butonunu kullanabilirsiniz.
                    </p>
                  </div>
                ) : (
                  filteredYurtlar.map((yurt) => {
                    const fillRate = yurt.kapasite > 0 ? Math.round((yurt.mevcutOgrenci / yurt.kapasite) * 100) : 0;
                    return (
                      <div
                        key={yurt.id}
                        className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-2xl space-y-3 shadow-xs"
                      >
                        {/* Başlık & Durum */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-[#0F172A] text-sm">{yurt.ad}</h4>
                            <p className="text-[11px] text-[#64748B]">{yurt.sehir} / {yurt.ilce}</p>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              yurt.durum === "aktif"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : yurt.durum === "deneme"
                                ? "bg-sky-50 text-sky-700 border border-sky-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {yurt.durum === "aktif"
                              ? "● Aktif"
                              : yurt.durum === "deneme"
                              ? "● Deneme"
                              : "● Askıda"}
                          </span>
                        </div>

                        {/* Doluluk ve Kapasite */}
                        <div className="space-y-1 bg-white p-2.5 rounded-xl border border-[#E2E8F0]">
                          <div className="flex justify-between text-[11px] font-medium">
                            <span className="text-[#64748B]">Kapasite & Doluluk</span>
                            <span className="font-bold text-[#0F172A]">
                              {yurt.mevcutOgrenci} / {yurt.kapasite} (%{fillRate})
                            </span>
                          </div>
                          <div className="w-full bg-[#F8FAFC] h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0284C7]"
                              style={{ width: `${Math.min(100, fillRate)}%` }}
                            />
                          </div>
                        </div>

                        {/* Yetkili & İletişim */}
                        <div className="text-[11px] space-y-0.5">
                          <div className="text-[#0F172A]">Yetkili: <strong>{yurt.yetkiliAd}</strong> ({yurt.yetkiliTel})</div>
                          <div className="text-[#64748B] text-[10px] truncate">{yurt.yetkiliEposta}</div>
                        </div>

                        {/* Aksiyon Butonları */}
                        <div className="flex items-center gap-1.5 pt-2 border-t border-[#E2E8F0]">
                          <button
                            onClick={() => {
                              const managerUser = {
                                role: "yonetici" as const,
                                name: `${yurt.yetkiliAd} (Süper Admin)`,
                                details: `Yurt Müdürü • ${yurt.ad}`,
                                selectedYurtId: yurt.id,
                                selectedYurtName: yurt.ad,
                              };
                              setCurrentUser(managerUser);
                              if (typeof window !== "undefined") {
                                sessionStorage.setItem("yurtify_session", JSON.stringify(managerUser));
                              }
                            }}
                            className="flex-1 py-1.5 px-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer text-center border border-[#0369A1]"
                          >
                            Paneline Geç
                          </button>
                          <button
                            onClick={() => toggleYurtStatus(yurt.id, yurt.durum)}
                            className="py-1.5 px-2.5 bg-white hover:bg-[#F8FAFC] text-[#0F172A] font-semibold rounded-lg text-xs transition-colors cursor-pointer border border-[#E2E8F0]"
                          >
                            {yurt.durum === "aktif" ? "Askıya Al" : "Aktifleştir"}
                          </button>
                          <button
                            onClick={() => deleteYurt(yurt.id, yurt.ad)}
                            className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs transition-colors cursor-pointer border border-rose-200"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 2. MASAÜSTÜ TABLO GÖRÜNÜMÜ */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-[#F8FAFC] text-[#64748B] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Yurt Adı & Lokasyon</th>
                      <th className="p-4">Yetkili / İletişim</th>
                      <th className="p-4">Kapasite & Doluluk</th>
                      <th className="p-4">Yurt Türü & Durum</th>
                      <th className="p-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredYurtlar.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-[#64748B]">
                          <p className="font-bold text-sm text-[#0F172A]">Henüz Kayıtlı Yurt Bulunmuyor</p>
                          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                            Veritabanınız tamamen temiz. İlk yurdunuzu tanımlamak için yukarıdaki <strong>&ldquo;Yeni Yurt Ekle&rdquo;</strong> butonunu kullanabilirsiniz.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredYurtlar.map((yurt) => {
                        const fillRate = yurt.kapasite > 0 ? Math.round((yurt.mevcutOgrenci / yurt.kapasite) * 100) : 0;
                        return (
                          <tr key={yurt.id} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-[#0F172A] text-sm">{yurt.ad}</div>
                              <div className="text-[#64748B] text-[11px] flex items-center gap-1 mt-0.5">
                                {yurt.sehir} / {yurt.ilce}
                              </div>
                              <div className="text-[10px] text-[#64748B]">Kayıt: {yurt.kayitTarihi}</div>
                            </td>

                            <td className="p-4">
                              <div className="font-medium text-[#0F172A]">{yurt.yetkiliAd}</div>
                              <div className="text-[#64748B] text-[11px] font-mono">{yurt.yetkiliTel}</div>
                              <div className="text-[#64748B] text-[11px]">{yurt.yetkiliEposta}</div>
                            </td>

                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#0F172A]">
                                  {yurt.mevcutOgrenci} / {yurt.kapasite}
                                </span>
                                <span className="text-[10px] text-emerald-600 font-semibold">
                                  (%{fillRate})
                                </span>
                              </div>
                              <div className="w-32 bg-[#F8FAFC] h-1.5 rounded-full mt-1.5 overflow-hidden">
                                <div
                                  className="h-full bg-[#0284C7]"
                                  style={{ width: `${fillRate}%` }}
                                ></div>
                              </div>
                            </td>

                            <td className="p-4">
                              <span className="inline-block text-[11px] font-semibold text-[#64748B] bg-[#F1F5F9] border border-[#E2E8F0] px-2.5 py-0.5 rounded-md mb-1">
                                {yurt.yurtTuru}
                              </span>
                              <div>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    yurt.durum === "aktif"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : yurt.durum === "deneme"
                                      ? "bg-sky-50 text-sky-700 border border-sky-200"
                                      : "bg-rose-50 text-rose-700 border border-rose-200"
                                  }`}
                                >
                                  {yurt.durum === "aktif"
                                    ? "● Aktif"
                                    : yurt.durum === "deneme"
                                    ? "● Deneme"
                                    : "● Askıda"}
                                </span>
                              </div>
                            </td>

                            <td className="p-4 text-right space-x-2 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  const managerUser = {
                                    role: "yonetici" as const,
                                    name: `${yurt.yetkiliAd} (Süper Admin)`,
                                    details: `Yurt Müdürü • ${yurt.ad}`,
                                    selectedYurtId: yurt.id,
                                    selectedYurtName: yurt.ad,
                                  };
                                  setCurrentUser(managerUser);
                                  if (typeof window !== "undefined") {
                                    sessionStorage.setItem("yurtify_session", JSON.stringify(managerUser));
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer border border-[#0369A1]"
                              >
                                Paneline Geç
                              </button>

                              <button
                                onClick={() => toggleYurtStatus(yurt.id, yurt.durum)}
                                className="px-2 py-1.5 bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#0F172A] rounded-lg text-[11px] transition-colors cursor-pointer border border-[#E2E8F0]"
                              >
                                {yurt.durum === "aktif" ? "Askıya Al" : "Aktifleştir"}
                              </button>

                              <button
                                onClick={() => deleteYurt(yurt.id, yurt.ad)}
                                className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer border border-rose-200"
                              >
                                Sil
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* YURT EKLEME MODALI */}
            <AddYurtModal
              isOpen={isAddModalOpen}
              newYurt={newYurt}
              setNewYurt={setNewYurt}
              onClose={() => setIsAddModalOpen(false)}
              onSubmit={handleCreateYurt}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* B. YURT YÖNETİCİSİ / MÜDÜRÜ TAM YETKİLİ KONTROL PANELİ */}
        {/* ========================================================= */}
        {currentUser.role === "yonetici" && (() => {
          // Dinamik İstatistik Hesaplamaları
          const openTickets = maintenanceTickets.filter((t) => t.durum !== "Çözüldü").length;

          // Filtrelenmiş Öğrenciler
          const filteredStudents = students.filter((s) => {
            const query = studentSearch.toLowerCase();
            return (
              s.adSoyad.toLowerCase().includes(query) ||
              s.odaNo.toLowerCase().includes(query) ||
              (s.eposta && s.eposta.toLowerCase().includes(query))
            );
          });

          return (
            <div className="space-y-4 sm:space-y-6">
              {/* YÖNETİCİ MODÜL SEKMELERİ (Masaüstü: Üst Yatay Sekmeler / Mobilde: Ortadan Kaldırıldı) */}
              <div className="hidden md:flex items-center justify-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl sm:rounded-2xl overflow-x-auto no-scrollbar">
                {managerTabItems.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setManagerTab(tab.id as any)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      managerTab === tab.id
                        ? "bg-[#0284C7] text-white border border-[#0369A1]"
                        : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] hover:bg-white dark:hover:bg-[#0F172A]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>


              {/* Sekme İçerikleri Konteyneri */}
              <div className="min-h-[500px] w-full space-y-4 sm:space-y-6">
                {/* ======================================================== */}
                {/* MODÜL 0: ANA SAYFA (GENEL BAKIŞ & DUYURULAR & KPI) */}
                {/* ======================================================== */}
                {managerTab === "anasayfa" && (
                  <div className="w-full space-y-4 sm:space-y-6">
                    {/* 1. Üst Özet & Hızlı Aksiyon Kartı */}
                    <div className="bg-white border border-[#E2E8F0] p-3.5 sm:p-4 rounded-2xl shadow-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#0284C7] bg-[#F1F5F9] px-2 py-0.5 rounded-md border border-[#E2E8F0]">
                          Yurt Müdürü Paneli
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-[#0F172A] mt-1.5">
                        Merhaba, {(yurtSettings.yetkiliAd || currentUser.name || "Fatma Güneş").replace(/Yurt Müdürü/gi, "").replace(/[()]/g, "").trim() || "Fatma Güneş"}!
                      </h2>
                    </div>

                    {/* 2. KPI İstatistik Sayaçları */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
                      {/* Öğrenci Kapasitesi */}
                      <button
                        type="button"
                        onClick={() => {
                          setManagerTab("ayarlar");
                          setOpenSettingsSections((prev) => ({ ...prev, ogrenciler: true }));
                        }}
                        className="bg-white border border-[#E2E8F0] hover:border-[#0284C7] p-3 sm:p-4.5 rounded-2xl text-left transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span className="text-[11px] sm:text-xs font-bold text-[#64748B] truncate">Kayıtlı Öğrenci</span>
                          <svg className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0284C7] transition-transform group-hover:translate-x-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <div className="mt-2 sm:mt-2.5">
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg sm:text-2xl font-black text-[#0F172A]">{students.length}</span>
                            <span className="text-[11px] sm:text-xs text-[#64748B]">/ {yurtSettings.kapasite} Kapasite</span>
                          </div>
                          <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                              className="bg-[#0284C7] h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, (students.length / (Number(yurtSettings.kapasite) || 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </button>

                      {/* Çamaşırhane Aktif */}
                      <button
                        type="button"
                        onClick={() => setManagerTab("camasirhane")}
                        className="bg-white border border-[#E2E8F0] hover:border-[#0284C7] p-3 sm:p-4.5 rounded-2xl text-left transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span className="text-[11px] sm:text-xs font-bold text-[#64748B] truncate">Çamaşırhane</span>
                          <svg className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0284C7] transition-transform group-hover:translate-x-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <div className="mt-2 sm:mt-2.5">
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg sm:text-2xl font-black text-[#0F172A]">
                              {liveLaundrySlots.filter((s) => normalizeDateStr(s.tarih) === selectedLaundryDate && s.durum === "Yıkanıyor").length}
                            </span>
                            <span className="text-[11px] sm:text-xs text-[#64748B]">
                              Çalışıyor • {liveLaundrySlots.filter((s) => normalizeDateStr(s.tarih) === selectedLaundryDate && s.durum === "Sırada").length} Sırada
                            </span>
                          </div>
                        </div>
                      </button>

                      {/* Açık Arızalar */}
                      <button
                        type="button"
                        onClick={() => setManagerTab("arizalar")}
                        className="bg-white border border-[#E2E8F0] hover:border-[#0284C7] p-3 sm:p-4.5 rounded-2xl text-left transition-all cursor-pointer group shadow-xs flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span className="text-[11px] sm:text-xs font-bold text-[#64748B] truncate">Arıza Talepleri</span>
                          <svg className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0284C7] transition-transform group-hover:translate-x-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <div className="mt-2 sm:mt-2.5">
                          <div className="flex items-baseline gap-1">
                            <span className={`text-lg sm:text-2xl font-black ${openTickets > 0 ? "text-rose-600" : "text-[#0F172A]"}`}>
                              {openTickets}
                            </span>
                            <span className="text-[11px] sm:text-xs text-[#64748B]">Açık Talep</span>
                          </div>
                          <p className={`text-[10px] sm:text-[11px] mt-1 truncate ${openTickets > 0 ? "text-rose-600 font-medium" : "text-[#64748B]"}`}>
                            {openTickets > 0 ? "Müdahale bekliyor" : "Bekleyen arıza yok"}
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* 3. Günün Yemek Menüsü Kartı (Öğrenciye Yansıyan Canlı Görünüm) */}
                    <div className="bg-white border border-[#E2E8F0] p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl space-y-3.5 sm:space-y-4 transition-colors shadow-xs">
                      {/* Üst Başlık ve Bilgi Etiketleri */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#E2E8F0]">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">
                            Günün Yemek Menüsü
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 shrink-0">
                            Öğrenci Görünümü
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Katılacak: {attendingCount} Öğrenci
                          </span>
                          {notAttendingCount > 0 && (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                              Katılmayacak: {notAttendingCount}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setManagerTab("yemekhane")}
                            className="shrink-0 inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[11px] sm:text-xs font-bold text-[#0284C7] hover:underline cursor-pointer transition-colors"
                          >
                            <span>Menüyü Düzenle</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>

                      {/* Menü Kartları (Öğrencilerin Gördüğü Canlı Format) */}
                      {dailyMenu.gorunumModu === "birlikte" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                          {/* Sabah Kahvaltısı */}
                          <div
                            onClick={() => setManagerTab("yemekhane")}
                            className="p-4 sm:p-4.5 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#0284C7]/60 dark:hover:border-[#38BDF8]/60 rounded-2xl space-y-2.5 shadow-2xs cursor-pointer transition-all group"
                          >
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-xs font-bold text-[#0284C7] dark:text-[#38BDF8] px-3 py-1 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] group-hover:border-[#0284C7]/40 transition-colors">
                                Sabah Kahvaltısı
                              </span>
                              <div className="flex items-center gap-1.5">
                                {dailyMenu.kaloriGoster && dailyMenu.kahvaltiKalori && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                    {dailyMenu.kahvaltiKalori}
                                  </span>
                                )}
                                <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] bg-white dark:bg-[#1E293B] px-2.5 py-0.5 rounded-lg border border-[#E2E8F0] dark:border-[#334155]">
                                  {dailyMenu.kahvaltiSaat}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs sm:text-[13px] text-stone-700 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line min-h-[38px]">
                              {dailyMenu.kahvalti || (
                                <span className="text-stone-400 dark:text-slate-500 italic">Menü girilmedi.</span>
                              )}
                            </p>
                            <div className="text-[11px] text-stone-500 dark:text-slate-400 pt-2 border-t border-[#E2E8F0] dark:border-[#334155] flex justify-between items-center">
                              <span>Günün Servisi</span>
                              {dailyMenu.kahvalti ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Servis Hazır
                                </span>
                              ) : (
                                <span className="text-stone-400 dark:text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
                                  <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-slate-600" /> Menü Bekleniyor
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Akşam Yemeği */}
                          <div
                            onClick={() => setManagerTab("yemekhane")}
                            className="p-4 sm:p-4.5 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#0284C7]/60 dark:hover:border-[#38BDF8]/60 rounded-2xl space-y-2.5 shadow-2xs cursor-pointer transition-all group"
                          >
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-xs font-bold text-[#0284C7] dark:text-[#38BDF8] px-3 py-1 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] group-hover:border-[#0284C7]/40 transition-colors">
                                Akşam Yemeği
                              </span>
                              <div className="flex items-center gap-1.5">
                                {dailyMenu.kaloriGoster && dailyMenu.aksamKalori && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                    {dailyMenu.aksamKalori}
                                  </span>
                                )}
                                <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] bg-white dark:bg-[#1E293B] px-2.5 py-0.5 rounded-lg border border-[#E2E8F0] dark:border-[#334155]">
                                  {dailyMenu.aksamSaat}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs sm:text-[13px] text-stone-700 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line min-h-[38px]">
                              {dailyMenu.aksam || (
                                <span className="text-stone-400 dark:text-slate-500 italic">Menü girilmedi.</span>
                              )}
                            </p>
                            <div className="text-[11px] text-stone-500 dark:text-slate-400 pt-2 border-t border-[#E2E8F0] dark:border-[#334155] flex justify-between items-center">
                              <span>Günün Servisi</span>
                              {dailyMenu.aksam ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sıcak Servis
                                </span>
                              ) : (
                                <span className="text-stone-400 dark:text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
                                  <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-slate-600" /> Menü Bekleniyor
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Tek Öğün Görünümü */
                        dailyMenu.aktifOgun === "kahvalti" ? (
                          <div
                            onClick={() => setManagerTab("yemekhane")}
                            className="p-4 sm:p-5 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#0284C7]/60 dark:hover:border-[#38BDF8]/60 rounded-2xl space-y-2.5 shadow-2xs cursor-pointer transition-all group"
                          >
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-xs font-bold text-[#0284C7] dark:text-[#38BDF8] px-3 py-1 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
                                Sabah Kahvaltısı Servisi
                              </span>
                              <div className="flex items-center gap-1.5">
                                {dailyMenu.kaloriGoster && dailyMenu.kahvaltiKalori && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                    {dailyMenu.kahvaltiKalori}
                                  </span>
                                )}
                                <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] bg-white dark:bg-[#1E293B] px-2.5 py-0.5 rounded-lg border border-[#E2E8F0] dark:border-[#334155]">
                                  {dailyMenu.kahvaltiSaat}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs sm:text-sm text-stone-700 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line min-h-[38px]">
                              {dailyMenu.kahvalti || (
                                <span className="text-stone-400 dark:text-slate-500 italic">Menü girilmedi.</span>
                              )}
                            </p>
                            <div className="text-[11px] text-stone-500 dark:text-slate-400 pt-2 border-t border-[#E2E8F0] dark:border-[#334155] flex justify-between items-center">
                              <span>Günün Servisi</span>
                              {dailyMenu.kahvalti ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Servis Hazır
                                </span>
                              ) : (
                                <span className="text-stone-400 dark:text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
                                  <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-slate-600" /> Menü Bekleniyor
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => setManagerTab("yemekhane")}
                            className="p-4 sm:p-5 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#0284C7]/60 dark:hover:border-[#38BDF8]/60 rounded-2xl space-y-2.5 shadow-2xs cursor-pointer transition-all group"
                          >
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-xs font-bold text-[#0284C7] dark:text-[#38BDF8] px-3 py-1 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
                                Akşam Yemeği Servisi
                              </span>
                              <div className="flex items-center gap-1.5">
                                {dailyMenu.kaloriGoster && dailyMenu.aksamKalori && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                    {dailyMenu.aksamKalori}
                                  </span>
                                )}
                                <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] bg-white dark:bg-[#1E293B] px-2.5 py-0.5 rounded-lg border border-[#E2E8F0] dark:border-[#334155]">
                                  {dailyMenu.aksamSaat}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs sm:text-sm text-stone-700 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-line min-h-[38px]">
                              {dailyMenu.aksam || (
                                <span className="text-stone-400 dark:text-slate-500 italic">Menü girilmedi.</span>
                              )}
                            </p>
                            <div className="text-[11px] text-stone-500 dark:text-slate-400 pt-2 border-t border-[#E2E8F0] dark:border-[#334155] flex justify-between items-center">
                              <span>Günün Servisi</span>
                              {dailyMenu.aksam ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sıcak Servis
                                </span>
                              ) : (
                                <span className="text-stone-400 dark:text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
                                  <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-slate-600" /> Menü Bekleniyor
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* 4. YURT DUYURULARI VE PANO BÖLÜMÜ */}
                    <div className="bg-white border border-[#E2E8F0] p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">Duyurular</h3>
                        <button
                          type="button"
                          onClick={() => setIsAddAnnouncementModalOpen(true)}
                          className="px-3.5 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs rounded-xl cursor-pointer transition-colors border border-[#0369A1]"
                        >
                          + Yeni Duyuru Ekle
                        </button>
                      </div>

                      {announcements.length === 0 ? (
                        <div className="p-8 text-center bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] text-xs text-[#64748B]">
                          Henüz yayınlanmış bir duyuru bulunmuyor. Yeni duyuru eklemek için yukarıdaki butonu kullanabilirsiniz.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {announcements.map((a) => (
                            <div
                              key={a.id}
                              className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-2 hover:border-[#0284C7] transition-all"
                            >
                              <div className="flex justify-between items-start">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    a.oncelik === "Acil"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : a.oncelik === "Önemli"
                                      ? "bg-[#F1F5F9] text-[#0284C7] border-[#E2E8F0]"
                                      : "bg-white text-[#64748B] border-[#E2E8F0]"
                                  }`}
                                >
                                  {a.oncelik}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-[#64748B]">{a.tarih}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAnnouncement(a.id)}
                                    className="text-[#64748B] hover:text-rose-600 text-xs cursor-pointer font-bold"
                                  >
                                    Sil
                                  </button>
                                </div>
                              </div>
                              <h4 className="text-sm font-bold text-[#0F172A]">{a.baslik}</h4>
                              <p className="text-xs text-[#64748B] leading-relaxed">{a.icerik}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ======================================================== */}
                {/* MODÜL 2: ODA & YATAK YÖNETİMİ (TAM YETKİLİ) */}
                {/* ======================================================== */}
                {managerTab === "odalar" && (
                <div className="bg-white border border-yellow-200 p-6 rounded-3xl space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="text-base sm:text-lg font-bold text-stone-900">Odalar</h3>

                    <button
                      onClick={() => setIsAddRoomModalOpen(true)}
                      className="px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all"
                    >
                      + Yeni Oda
                    </button>
                  </div>

                  {/* Odalar Kart Izgarası */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rooms.map((room) => {
                      const roomStudents = students.filter((s) => s.odaNo === room.odaNo);
                      const isFull = room.doluYatak >= room.kapasite;

                      return (
                        <div
                          key={room.id}
                          className="bg-yellow-50 border border-yellow-200 p-5 rounded-3xl space-y-3 relative hover:border-yellow-300 transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-100/70 text-stone-800 font-medium">
                                {room.blok} • Kat {room.kat}
                              </span>
                              <h4 className="text-xl font-black text-stone-900 mt-1">Oda {room.odaNo}</h4>
                              <p className="text-xs text-stone-500">{room.odaTipi}</p>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setEditingRoom(room)}
                                className="px-2.5 py-1 bg-yellow-100/70 hover:bg-yellow-100 text-stone-800 font-medium font-bold rounded-lg text-xs cursor-pointer"
                                title="Oda özelliklerini ve kapasitesini düzenle"
                              >
                                Düzenle
                              </button>
                              <button
                                onClick={() => handleDeleteRoom(room.id, room.odaNo)}
                                className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white font-bold rounded-lg text-xs cursor-pointer transition-all"
                                title="Odayı sil"
                              >
                                Sil
                              </button>
                            </div>
                          </div>

                          {/* Doluluk Barı */}
                          <div>
                            <div className="flex justify-between text-xs text-stone-600 mb-1">
                              <span>Doluluk: <strong className="text-stone-900">{room.doluYatak} / {room.kapasite} Yatak</strong></span>
                              <span className="text-stone-800 font-semibold">{room.odaTipi}</span>
                            </div>
                            <div className="w-full bg-yellow-100/70 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isFull ? "bg-rose-500" : "bg-[#0284C7]"
                                }`}
                                style={{ width: `${Math.min(100, (room.doluYatak / (room.kapasite || 1)) * 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* YATAK VE ÖĞRENCİ DETAYI */}
                          <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#334155] space-y-2">
                            <span className="text-[11px] font-semibold text-stone-500 block">
                              Yatak Durumu ({room.kapasite} Yataklı):
                            </span>

                            <div className="space-y-1.5">
                              {Array.from({ length: room.kapasite }).map((_, idx) => {
                                const bedNo = String(idx + 1);
                                const studentInBed = roomStudents.find((s) => s.yatakNo === bedNo);

                                return (
                                  <div
                                    key={bedNo}
                                    className="p-2 rounded-xl bg-white border border-yellow-200 flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-md bg-yellow-100/70 text-stone-600 flex items-center justify-center text-[10px] font-bold">
                                        Y{bedNo}
                                      </span>
                                      {studentInBed ? (
                                        <div>
                                          <span className="font-bold text-stone-800 block">{studentInBed.adSoyad}</span>
                                          <span className="text-[10px] text-stone-500">{studentInBed.eposta}</span>
                                        </div>
                                      ) : (
                                        <span className="text-slate-500 italic">Boş Yatak</span>
                                      )}
                                    </div>

                                    {studentInBed ? (
                                      <button
                                        onClick={() => setEditingStudent(studentInBed)}
                                        className="text-[11px] text-stone-800 hover:text-stone-800 font-medium font-semibold cursor-pointer"
                                        title="Öğrencinin odasını/yatağını değiştir"
                                      >
                                        Taşı ⇄
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setNewStudent({ ...newStudent, odaNo: room.odaNo, yatakNo: bedNo });
                                          setIsAddStudentModalOpen(true);
                                        }}
                                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                                      >
                                        + Öğrenci Ver
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* MODÜL 3: ÖĞRENCİ KÜTÜĞÜ (YURT AYARLARINA ENTEGRE EDİLDİ) */}
              {/* ======================================================== */}
              {managerTab === "ogrenciler" && (
                <div className="bg-white border border-[#E2E8F0] p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-[#0F172A]">Öğrenci Yönetimi Yurt Ayarlarına Taşındı</h4>
                    <p className="text-xs text-[#64748B]">Tüm öğrenci arama, listeleme, kayıt ekleme ve düzenleme işlemleri Yurt Ayarları sekmesi altında toplanmıştır.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setManagerTab("ayarlar");
                      setOpenSettingsSections((prev) => ({ ...prev, ogrenciler: true }));
                    }}
                    className="px-4 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shrink-0"
                  >
                    Yurt Ayarlarına Git
                  </button>
                </div>
              )}

              {/* ======================================================== */}
              {/* MODÜL 5: YEMEKHANE MENÜSÜ & KALORİ YÖNETİMİ */}
              {/* ======================================================== */}
              {managerTab === "yemekhane" && (
                <div className="w-full space-y-4">
                  {/* 1. GÜNLÜK YEMEK KATILIM BİLDİRİMİ (ÖĞRENCİ VARIM / YOKUM SAYILARI) */}
                  <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] p-5 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4 shadow-xs transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0] dark:border-[#334155]">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                          Günlük Yemek Katılım Durumu
                        </h3>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                          Tarih: {formatTurkishDate(todayMealDateKey)} • Öğrenci panelinden gelen anlık tercihler.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAttendanceListOpen(!isAttendanceListOpen)}
                        className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-xs font-bold text-[#0284C7] cursor-pointer transition-colors min-h-[38px]"
                      >
                        {isAttendanceListOpen ? "Listeyi Gizle" : "Öğrenci Listesini Göster"} ({todayMealAttendance.length})
                      </button>
                    </div>

                    {/* 3 Özet İstatistik Kartı */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Katılacak (Varım) */}
                      <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-1">
                        <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">
                          Katılacak Öğrenci Sayısı (Varım)
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
                            {attendingCount}
                          </span>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            Öğrenci
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
                          Mutfak bu sayıya göre porsiyon hazırlar
                        </p>
                      </div>

                      {/* Katılmayacak (Yokum) */}
                      <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 space-y-1">
                        <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block">
                          Katılmayacak Öğrenci Sayısı (Yokum)
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-black text-rose-700 dark:text-rose-400">
                            {notAttendingCount}
                          </span>
                          <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                            Öğrenci
                          </span>
                        </div>
                        <p className="text-[10px] text-rose-700/80 dark:text-rose-400/80">
                          Yemeğe katılmayacağını bildirenler
                        </p>
                      </div>

                      {/* Toplam Bildirim / Katılım Oranı */}
                      <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] space-y-1">
                        <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] block">
                          Bildirim Yapan / Toplam Öğrenci
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-[#F1F5F9]">
                            {todayMealAttendance.length}
                          </span>
                          <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                            / {students.length} Öğrenci
                          </span>
                        </div>
                        <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                          {students.length > 0 ? `%${Math.round((attendingCount / students.length) * 100)} tahmini katılım oranı` : "Öğrenci kaydı yok"}
                        </p>
                      </div>
                    </div>

                    {/* Katılım Bildiren Öğrenciler Listesi (Açılır Detay) */}
                    {isAttendanceListOpen && (
                      <div className="pt-3 space-y-2 border-t border-[#E2E8F0] dark:border-[#334155]">
                        <h4 className="text-xs font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                          Öğrenci Tercih Detayları ({todayMealAttendance.length})
                        </h4>
                        {todayMealAttendance.length === 0 ? (
                          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] italic py-2">
                            Bugün için henüz katılım bildiren öğrenci bulunmuyor.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
                            {todayMealAttendance.map((att) => {
                              const matched = students.find(
                                (s) =>
                                  s.adSoyad.toLowerCase() === att.studentName.toLowerCase() ||
                                  (s.eposta && s.eposta.toLowerCase() === att.studentKey.toLowerCase())
                              );
                              return (
                                <div
                                  key={att.id}
                                  className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <span className="font-bold text-[#0F172A] dark:text-[#F1F5F9] block">
                                      {att.studentName}
                                    </span>
                                    <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                                      {matched?.odaNo ? `Oda ${matched.odaNo}` : "Oda Bilgisi Yok"} • Saat: {att.updatedAt}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                      att.status === "var"
                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300"
                                        : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300"
                                    }`}
                                  >
                                    {att.status === "var" ? "Varım" : "Yokum"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Menü Girişi Formu */}
                  <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] p-5 sm:p-7 rounded-2xl sm:rounded-3xl space-y-5 shadow-xs transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0] dark:border-[#334155]">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-[#F1F5F9]">
                          Menü Girişi
                        </h3>
                        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                          Tarih: {formatTurkishDate(dailyMenu.tarih || getTodayDateKey())}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          00:00 Otomatik Sıfırlama Aktif
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleSaveMenu} className="space-y-4 text-xs">
                      {/* 1. YEMEK GİRİŞ ALANLARI */}
                      <div className="space-y-4">
                        <div className="flex items-center pb-2 border-b border-[#E2E8F0] dark:border-[#334155]">
                          <div className="inline-flex items-center gap-1 bg-[#F8FAFC] dark:bg-[#0F172A] p-1 rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-xs">
                            <button
                              type="button"
                              onClick={() => handleSelectMealMode("kahvalti")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                dailyMenu.gorunumModu === "tek" && dailyMenu.aktifOgun === "kahvalti"
                                  ? "bg-[#0284C7] text-white border border-[#0369A1] shadow-xs"
                                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] hover:bg-white dark:hover:bg-[#1E293B]"
                              }`}
                            >
                              Kahvaltı
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectMealMode("aksam")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                dailyMenu.gorunumModu === "tek" && dailyMenu.aktifOgun === "aksam"
                                  ? "bg-[#0284C7] text-white border border-[#0369A1] shadow-xs"
                                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] hover:bg-white dark:hover:bg-[#1E293B]"
                              }`}
                            >
                              Akşam Yemeği
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectMealMode("birlikte")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                dailyMenu.gorunumModu === "birlikte"
                                  ? "bg-[#0284C7] text-white border border-[#0369A1] shadow-xs"
                                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] hover:bg-white dark:hover:bg-[#1E293B]"
                              }`}
                            >
                              İkisi de
                            </button>
                          </div>
                        </div>

                        {/* Yemek Alanları */}
                        <div className={dailyMenu.gorunumModu === "birlikte" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
                          {/* Kahvaltı Bloğu: Birlikte modunda veya Tekli modda Kahvaltı seçiliyse görünür */}
                          {(dailyMenu.gorunumModu === "birlikte" || dailyMenu.aktifOgun === "kahvalti") && (
                          <div className="p-4 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] space-y-3">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                              <label className="text-[#64748B] dark:text-[#94A3B8] font-bold flex items-center gap-1.5">
                                Sabah Kahvaltısı Menüsü & Saati
                              </label>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">Saat:</span>
                                <span className="text-xs font-mono font-semibold text-[#0F172A] dark:text-[#F1F5F9] tracking-wide">
                                  {dailyMenu.kahvaltiSaat}
                                </span>
                              </div>
                            </div>
                            <textarea
                              rows={4}
                              value={dailyMenu.kahvalti}
                              onChange={(e) => setDailyMenu({ ...dailyMenu, kahvalti: e.target.value })}
                              placeholder="Kahvaltı içeriğini girin (Enter ile alt alta listeleyebilirsiniz)..."
                              className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-2.5 text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 leading-relaxed resize-none"
                            />
                          </div>
                        )}

                        {/* Akşam Yemeği Bloğu: Birlikte modunda veya Tekli modda Akşam Yemeği seçiliyse görünür */}
                        {(dailyMenu.gorunumModu === "birlikte" || dailyMenu.aktifOgun === "aksam") && (
                          <div className="p-4 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] space-y-3">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                              <label className="text-[#64748B] dark:text-[#94A3B8] font-bold flex items-center gap-1.5">
                                Akşam Yemeği Menüsü & Saati
                              </label>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">Saat:</span>
                                <span className="text-xs font-mono font-semibold text-[#0F172A] dark:text-[#F1F5F9] tracking-wide">
                                  {dailyMenu.aksamSaat}
                                </span>
                              </div>
                            </div>
                            <textarea
                              rows={4}
                              value={dailyMenu.aksam}
                              onChange={(e) => setDailyMenu({ ...dailyMenu, aksam: e.target.value })}
                              placeholder="Akşam menüsü içeriğini girin (Enter ile alt alta listeleyebilirsiniz)..."
                              className="w-full bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-2.5 text-[#0F172A] dark:text-[#F1F5F9] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 leading-relaxed resize-none"
                            />
                          </div>
                        )}
                        </div>
                      </div>

                      {/* BUTONLAR: KAYDET VE SIFIRLA */}
                      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                        <button
                          type="submit"
                          className="w-full sm:flex-1 py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-2 border border-[#0369A1]"
                        >
                          Menüyü Kaydet ve Yayınla
                        </button>
                        <button
                          type="button"
                          onClick={handleManualResetMenu}
                          className="w-full sm:w-auto px-4 py-3 bg-[#F8FAFC] dark:bg-[#0F172A] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold rounded-xl cursor-pointer transition-colors border border-[#E2E8F0] dark:border-[#334155] hover:border-rose-300 dark:hover:border-rose-800/40 text-center"
                        >
                          Günün Menüsünü Sıfırla
                        </button>
                      </div>
                    </form>

                    {/* Ayarlar Hızlı Geçiş Kutusu */}
                    <div className="p-3 bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl flex items-center justify-between text-xs">
                      <span className="text-[#64748B] dark:text-[#94A3B8]">Servis saatleri ve gösterim ayarları:</span>
                      <button
                        type="button"
                        onClick={() => setManagerTab("ayarlar")}
                        className="text-[#0F172A] dark:text-[#38BDF8] font-bold hover:underline cursor-pointer"
                      >
                        Yurt Ayarları →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* MODÜL 5.5: ÇAMAŞIRHANE SIRASI VE REZERVASYON TAKVİMİ */}
              {/* ======================================================== */}
              {managerTab === "camasirhane" && (() => {
                const washingMachines = laundryMachines.filter((m) => m.tur === "yikama" || m.tip.toLowerCase().includes("yıkama") || m.id.includes("Makine"));
                const dryerMachines = laundryMachines.filter((m) => m.tur === "kurutma" || m.tip.toLowerCase().includes("kurutma") || m.id.includes("Kurutma"));

                const timeSlots = [
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

                // Türkçe Tarih Formatlayıcı
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
                  const dayOfWeek = dayNames[dateObj.getDay()] || "";
                  const monthName = monthNames[m - 1] || "";
                  return `${d} ${monthName} ${y} – ${dayOfWeek}`;
                };

                // Aylık Takvim Hesaplamaları
                const turkishMonthNames = [
                  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
                  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
                ];

                const currentMonthLabel = `${turkishMonthNames[laundryViewMonth]} ${laundryViewYear}`;

                // Ayın toplam gün sayısı
                const daysInCurrentMonth = new Date(laundryViewYear, laundryViewMonth + 1, 0).getDate();
                // Ayın 1. gününün haftanın hangi günü olduğu (0: Pazartesi ... 6: Pazar)
                const firstDayWeekday = (new Date(laundryViewYear, laundryViewMonth, 1).getDay() + 6) % 7;
                // Bir önceki ayın toplam gün sayısı
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

                // Bugünün tarihi
                const todayObj = new Date();
                const todayDateStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;

                // Ay boyunca toplam randevu sayısı
                const monthPrefix = `${laundryViewYear}-${String(laundryViewMonth + 1).padStart(2, "0")}`;
                const currentMonthSlotsCount = liveLaundrySlots.filter(s => normalizeDateStr(s.tarih).startsWith(monthPrefix) && s.durum !== "İptal").length;

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

                const daySlots = liveLaundrySlots.filter((s) => normalizeDateStr(s.tarih) === selectedLaundryDate);
                const filteredSlots = daySlots.filter((s) => {
                  if (laundryMachineFilter === "all") return true;
                  if (laundryMachineFilter === "yikama") return s.makineNo.includes("Makine") || laundryMachines.find(m => m.id === s.makineNo)?.tur === "yikama";
                  if (laundryMachineFilter === "kurutma") return s.makineNo.includes("Kurutma") || laundryMachines.find(m => m.id === s.makineNo)?.tur === "kurutma";
                  return s.makineNo === laundryMachineFilter;
                });

                const activeWashingCount = liveLaundrySlots.filter(s => normalizeDateStr(s.tarih) === selectedLaundryDate && s.durum === "Yıkanıyor").length;
                const inQueueCount = liveLaundrySlots.filter(s => normalizeDateStr(s.tarih) === selectedLaundryDate && s.durum === "Sırada").length;

                // Seçili günün haftalık gün şeridi (iOS Takvim Tarzı: Pazartesi - Pazar)
                const [selY, selM, selD] = selectedLaundryDate.split("-").map(Number);
                const selectedDateObj = new Date(selY, selM - 1, selD);
                const dayOfWeekIdx = (selectedDateObj.getDay() + 6) % 7; // 0: Pzt ... 6: Paz
                const mondayDateObj = new Date(selY, selM - 1, selD - dayOfWeekIdx);

                const weekStripDays = [];
                const shortDayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
                for (let i = 0; i < 7; i++) {
                  const dObj = new Date(mondayDateObj.getFullYear(), mondayDateObj.getMonth(), mondayDateObj.getDate() + i);
                  const dateStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, "0")}-${String(dObj.getDate()).padStart(2, "0")}`;
                  const slotsCount = liveLaundrySlots.filter(s => normalizeDateStr(s.tarih) === dateStr && s.durum !== "İptal").length;
                  const activeCount = liveLaundrySlots.filter(s => normalizeDateStr(s.tarih) === dateStr && s.durum === "Yıkanıyor").length;
                  const queueCount = liveLaundrySlots.filter(s => normalizeDateStr(s.tarih) === dateStr && s.durum === "Sırada").length;
                  weekStripDays.push({
                    dateStr,
                    dayNum: dObj.getDate(),
                    dayName: shortDayNames[i],
                    isToday: dateStr === todayDateStr,
                    isSelected: dateStr === selectedLaundryDate,
                    slotsCount,
                    activeCount,
                    queueCount,
                  });
                }

                const timelineHours = [
                  "08:00",
                  "09:00",
                  "10:00",
                  "11:00",
                  "12:00",
                  "13:00",
                  "14:00",
                  "15:00",
                  "16:00",
                  "17:00",
                  "18:00",
                  "19:00",
                  "20:00",
                  "21:00",
                  "22:00",
                ];

                const currentHourNum = todayObj.getHours();
                const currentMinNum = todayObj.getMinutes();
                const currentTimeStr = `${String(currentHourNum).padStart(2, "0")}:${String(currentMinNum).padStart(2, "0")}`;

                const getSlotsForHour = (hourStr: string) => {
                  const hourNum = parseInt(hourStr.split(":")[0], 10);
                  return filteredSlots.filter((slot) => {
                    const { startMinutes } = parseSlotMinutes(slot.saatAraligi);
                    const startHour = Math.floor(startMinutes / 60);
                    return startHour === hourNum;
                  });
                };

                // ========================================================
                // CANLI / ŞU ANKİ SIRA VE MAKİNE DURUMU HESAPLAMALARI
                // ========================================================
                const allActiveSlots = liveLaundrySlots.filter(
                  (s) => s.durum === "Yıkanıyor" || s.durum === "Sırada"
                );

                const currentDisplayedQueue = allActiveSlots;

                const activeWashingNow = currentDisplayedQueue.filter((s) => s.durum === "Yıkanıyor");
                const waitingQueueList = currentDisplayedQueue.filter((s) => s.durum === "Sırada");

                const runningMachinesCount = laundryMachines.filter((m) =>
                  liveLaundrySlots.some((s) => s.makineNo === m.id && s.durum === "Yıkanıyor")
                ).length;

                const queuedSlotsCount = liveLaundrySlots.filter((s) => s.durum === "Sırada").length;
                const freeMachinesCount = Math.max(0, laundryMachines.length - runningMachinesCount);

                const freeMachinesList = laundryMachines.filter(
                  (m) => !liveLaundrySlots.some((s) => s.makineNo === m.id && s.durum === "Yıkanıyor")
                );

                const machineStatusList = laundryMachines.map((m) => {
                  const activeSlot = liveLaundrySlots.find(
                    (s) => s.makineNo === m.id && s.durum === "Yıkanıyor"
                  );
                  const nextQueueSlot = !activeSlot
                    ? liveLaundrySlots.find((s) => s.makineNo === m.id && s.durum === "Sırada")
                    : null;
                  return {
                    machine: m,
                    activeSlot,
                    nextQueueSlot,
                  };
                });

                return (
                  <div className="space-y-4">
                    {/* Üst Yönetici Bilgi ve İstatistik Çubuğu (Proje Teması) */}
                    <div className="bg-[#F8FAFC] dark:bg-[#1E293B] p-3 sm:p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
                      {/* Sol / Üst Bölüm: Başlık ve Bilgi Rozetleri */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base sm:text-lg font-black text-[#0F172A] dark:text-[#F1F5F9] tracking-tight">
                            Çamaşırhane
                          </h3>
                          {/* Mobilde sağ üstte + Sıra Ekle butonu */}
                          <button
                            type="button"
                            onClick={() => {
                              setNewLaundry((p) => ({ ...p, tarih: selectedLaundryDate, makineNo: laundryMachines[0]?.id || "Makine 1 (A-1)" }));
                              setIsAddLaundryModalOpen(true);
                            }}
                            className="sm:hidden px-3.5 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap active:scale-95 border border-[#0369A1] min-h-[36px]"
                          >
                            + Sıra Ekle
                          </button>
                        </div>

                        {/* Rozetler (Mobilde ve Masaüstünde asla kırılmayan temiz rozetler) */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg sm:rounded-full bg-[#F1F5F9] dark:bg-[#0F172A] text-[#64748B] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#334155] whitespace-nowrap">
                            {washingMachines.length} Yıkama • {dryerMachines.length} Kurutma
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsManageMachinesModalOpen(true)}
                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg sm:rounded-full bg-[#0284C7]/10 hover:bg-[#0284C7]/20 text-[#0284C7] border border-[#0284C7]/30 cursor-pointer transition-colors whitespace-nowrap"
                            title="Kişi başı ve yurt geneli günlük çamaşır limitlerini ayarla"
                          >
                            Limit: {dailyLaundryLimit === 0 ? "Sınırsız" : `${dailyLaundryLimit}/Kişi`} • {dailyDormLaundryLimit === 0 ? "Sınırsız" : `${dailyDormLaundryLimit}/Yurt`}
                          </button>
                        </div>
                      </div>

                      {/* Sağ / Alt Butonlar */}
                      <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E2E8F0] dark:border-[#334155]">
                        <button
                          type="button"
                          onClick={() => setIsManageMachinesModalOpen(true)}
                          className="w-full sm:w-auto px-3.5 py-1.5 bg-white dark:bg-[#0F172A] hover:bg-[#F1F5F9] dark:hover:bg-[#162032] border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-[#F1F5F9] hover:text-[#0284C7] font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap flex items-center justify-center gap-1.5 min-h-[36px]"
                          title="Makine sayısını ve türlerini ayarla"
                        >
                          Makine Sayısı & Ayarlar ({laundryMachines.length})
                        </button>

                        {/* Masaüstü + Sıra Ekle butonu */}
                        <button
                          type="button"
                          onClick={() => {
                            setNewLaundry((p) => ({ ...p, tarih: selectedLaundryDate, makineNo: laundryMachines[0]?.id || "Makine 1 (A-1)" }));
                            setIsAddLaundryModalOpen(true);
                          }}
                          className="hidden sm:inline-flex px-3.5 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs rounded-xl shadow-xs transition-all items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 border border-[#0369A1]"
                        >
                          + Sıra Ekle
                        </button>
                      </div>
                    </div>

                    {/* ======================================================== */}
                    {/* ŞU ANKİ DURUM PANOSU: YIKANIYOR - SIRADA - BOŞTA         */}
                    {/* ======================================================== */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl border border-[#E2E8F0] dark:border-[#334155] p-4 sm:p-5 shadow-xs space-y-4 transition-all">
                      {/* Pano Üst Başlık */}
                      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#334155]">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <h4 className="text-sm sm:text-base font-black text-[#0F172A] dark:text-[#F1F5F9] tracking-tight">
                            Şu Anki Durum Panosu
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8]">
                            {activeWashingNow.length} Yıkanıyor • {waitingQueueList.length} Sırada • {freeMachinesList.length} Boşta
                          </span>
                        </div>
                      </div>

                      {/* 3 Ana Blok: Yıkanıyor / Sırada / Boşta */}
                      <div className="space-y-3.5">
                        {/* 1. YIKANIYOR BLOĞU */}
                        <div className="p-3.5 sm:p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/25 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                              <span className="text-xs sm:text-sm font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                                Yıkanıyor
                              </span>
                            </div>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                              {activeWashingNow.length} Makine Aktif
                            </span>
                          </div>

                          {activeWashingNow.length === 0 ? (
                            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] py-1 italic">
                              Şu anda yıkamada olan makine bulunmuyor.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {activeWashingNow.map((slot) => (
                                <div
                                  key={slot.id}
                                  className="p-3 bg-white dark:bg-[#1E293B] rounded-xl border border-emerald-200 dark:border-emerald-800/60 shadow-2xs flex flex-col justify-between gap-2.5"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-xs text-[#0F172A] dark:text-[#F1F5F9] truncate">
                                          {cleanMachineName(slot.makineNo)}
                                        </span>
                                      </div>
                                      <p className="font-semibold text-xs text-[#0F172A] dark:text-[#F1F5F9] mt-0.5 truncate">
                                        {slot.ogrenciAd}
                                      </p>
                                      <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                                        Oda {slot.odaNo}
                                      </p>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#F1F5F9] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F1F5F9] border border-[#E2E8F0] dark:border-[#334155] shrink-0">
                                      {slot.saatAraligi}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleUpdateLaundryStatus(slot.id, "Tamamlandı")}
                                    className="w-full py-1.5 px-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer text-center"
                                  >
                                    Yıkamayı Bitir
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 2. SIRADA BLOĞU */}
                        <div className="p-3.5 sm:p-4 rounded-2xl border border-[#0284C7]/30 dark:border-sky-800/40 bg-[#F0F9FF] dark:bg-sky-950/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#0284C7] dark:bg-sky-400" />
                              <span className="text-xs sm:text-sm font-black text-[#0369A1] dark:text-sky-300 uppercase tracking-wider">
                                Sırada
                              </span>
                            </div>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#0284C7]/15 dark:bg-sky-900/40 text-[#0369A1] dark:text-sky-300 border border-[#0284C7]/30 dark:border-sky-700/60">
                              {waitingQueueList.length} Öğrenci
                            </span>
                          </div>

                          {waitingQueueList.length === 0 ? (
                            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] py-1 italic">
                              Sırada bekleyen öğrenci bulunmuyor.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {waitingQueueList.map((slot, idx) => (
                                <div
                                  key={slot.id}
                                  className="p-2.5 sm:p-3 bg-white dark:bg-[#1E293B] rounded-xl border border-[#0284C7]/20 dark:border-sky-800/40 shadow-2xs flex items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-5 h-5 rounded-md bg-[#0284C7] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                                      #{idx + 1}
                                    </span>
                                    <span className="font-bold text-xs text-[#0F172A] dark:text-[#F1F5F9] truncate">
                                      {slot.ogrenciAd}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLaundry(slot.id)}
                                    className="w-6 h-6 flex items-center justify-center text-[#64748B] dark:text-[#94A3B8] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer text-xs font-bold shrink-0"
                                    title="Sirayi Sil"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 3. BOŞTA BLOĞU */}
                        <div className="p-3.5 sm:p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A]/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#64748B] dark:bg-[#94A3B8]" />
                              <span className="text-xs sm:text-sm font-black text-[#0F172A] dark:text-[#F1F5F9] uppercase tracking-wider">
                                Boşta
                              </span>
                            </div>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#334155]">
                              {freeMachinesList.length} Makine Müsait
                            </span>
                          </div>

                          {freeMachinesList.length === 0 ? (
                            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] py-1 italic">
                              Şu anda tüm makineler kullanımda.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {freeMachinesList.map((m) => {
                                const nextQueueSlot = liveLaundrySlots.find(
                                  (s) => s.makineNo === m.id && s.durum === "Sırada"
                                );

                                return (
                                  <div
                                    key={m.id}
                                    className="p-3 bg-white dark:bg-[#1E293B] rounded-xl border border-[#E2E8F0] dark:border-[#334155] shadow-2xs flex items-center justify-between gap-2"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="font-bold text-xs text-[#0F172A] dark:text-[#F1F5F9] truncate">
                                          {m.name}
                                        </p>
                                        <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate">
                                          {m.tur === "kurutma" || m.id.includes("Kurutma") ? "Kurutma" : "Yıkama"} • {m.tip}
                                        </p>
                                        {nextQueueSlot && (
                                          <p className="text-[9px] font-semibold text-[#0284C7] dark:text-sky-400 truncate">
                                            Sıradaki: {nextQueueSlot.ogrenciAd}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewLaundry((p) => ({ ...p, tarih: selectedLaundryDate, makineNo: m.id }));
                                        setIsAddLaundryModalOpen(true);
                                      }}
                                      className="px-2.5 py-1.5 bg-[#F1F5F9] dark:bg-[#0F172A] hover:bg-[#0284C7] hover:text-white dark:hover:bg-[#0284C7] dark:hover:text-white text-[#0284C7] dark:text-sky-300 font-bold text-xs rounded-lg border border-[#E2E8F0] dark:border-[#334155] transition-colors cursor-pointer shrink-0"
                                    >
                                      + Sıra Ver
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ======================================================== */}
                    {/* GÖRÜNÜM 1: AYLIK TAKVİM (iOS Month View - Doğru Proje Teması) */}
                    {/* ======================================================== */}
                    {laundryCalendarView === "month" && (
                      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs overflow-hidden animate-ios-month p-4 sm:p-6 transition-all duration-300">
                        {/* iOS Takvim Üst Navigasyon Çubuğu */}
                        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                          <div className="flex items-center gap-3">
                            <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                              {currentMonthLabel}
                            </h2>
                            <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-0.5 shadow-xs">
                              <button
                                type="button"
                                onClick={goToPrevMonth}
                                className="w-7 h-7 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer text-xs font-bold active:scale-90"
                                title="Önceki Ay"
                              >
                                &lt;
                              </button>
                              <button
                                type="button"
                                onClick={goToNextMonth}
                                className="w-7 h-7 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer text-xs font-bold active:scale-90"
                                title="Sonraki Ay"
                              >
                                &gt;
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={goToToday}
                              className="px-3 py-1.5 text-xs font-bold text-[#64748B] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl transition-colors cursor-pointer active:scale-95"
                            >
                              Bugün
                            </button>

                            <select
                              value={laundryMachineFilter}
                              onChange={(e) => setLaundryMachineFilter(e.target.value)}
                              className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-2.5 py-1.5 text-xs text-[#0F172A] focus:outline-none font-bold cursor-pointer transition-colors"
                            >
                              <option value="all">Tüm Makineler</option>
                              <option value="yikama">Sadece Çamaşır</option>
                              <option value="kurutma">Sadece Kurutma</option>
                            </select>
                          </div>
                        </div>

                        {/* iOS Hafta Günleri Başlıkları (PZT SAL ÇAR PER CUM CMT PAZ) */}
                        <div className="grid grid-cols-7 text-center pt-3 pb-2 border-b border-[#E2E8F0]/60">
                          {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((dName, idx) => (
                            <div
                              key={dName}
                              className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                                idx >= 5 ? "text-[#64748B]" : "text-[#64748B]"
                              }`}
                            >
                              {dName}
                            </div>
                          ))}
                        </div>

                        {/* iOS Minimalist Gün Izgarası (Akıcı Geçişli Dokunma Hedefleri) */}
                        <div className="grid grid-cols-7 gap-y-2 pt-3">
                          {calendarCells.map((cell) => {
                            const slotsForDay = liveLaundrySlots.filter(
                              (s) => normalizeDateStr(s.tarih) === cell.dateStr && s.durum !== "İptal"
                            );
                            const isToday = cell.dateStr === todayDateStr;
                            const isSelected = selectedLaundryDate === cell.dateStr;
                            const activeWashingOnDay = slotsForDay.filter((s) => s.durum === "Yıkanıyor").length;
                            const inQueueOnDay = slotsForDay.filter((s) => s.durum === "Sırada").length;

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
                                className="group flex flex-col items-center justify-center py-2 sm:py-2.5 rounded-2xl cursor-pointer transition-transform duration-150 active:scale-90"
                              >
                                {/* Gün Yuvarlak Rozeti */}
                                <div
                                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm transition-all duration-200 select-none ${
                                    isSelected
                                      ? "bg-[#0284C7] text-white font-black shadow-md ring-4 ring-[#0284C7]/40"
                                      : isToday
                                      ? "bg-sky-100 text-[#0284C7] font-black border-2 border-[#0284C7] shadow-xs"
                                      : cell.isCurrentMonth
                                      ? "text-[#0F172A] font-bold group-hover:bg-[#F1F5F9]"
                                      : "text-[#94A3B8] font-normal"
                                  }`}
                                >
                                  {cell.dayNum}
                                </div>

                                {/* iOS Tarzı Etkinlik Noktaları (Tema Uyumlu) */}
                                <div className="h-2 flex items-center justify-center gap-1 mt-1">
                                  {slotsForDay.length > 0 ? (
                                    <>
                                      {activeWashingOnDay > 0 && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                      )}
                                      {inQueueOnDay > 0 && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
                                      )}
                                      {activeWashingOnDay === 0 && inQueueOnDay === 0 && (
                                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-[#0284C7]" : "bg-[#64748B]"}`} />
                                      )}
                                    </>
                                  ) : (
                                    <span className="w-1.5 h-1.5 opacity-0" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ======================================================== */}
                    {/* GÖRÜNÜM 2: GÜNLÜK ÇİZELGE (iOS Day View - Doğru Proje Teması) */}
                    {/* (Tarihe tıklandığında hafta şeridi üste kayar, saatler altından çıkar) */}
                    {/* ======================================================== */}
                    {laundryCalendarView === "day" && (
                      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs overflow-hidden transition-all duration-300">
                        {/* iOS Üst Başlık: < [Ay] Geri Butonu + Bugün & Filtre */}
                        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                          <button
                            type="button"
                            onClick={() => setLaundryCalendarView("month")}
                            className="flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] font-black text-sm sm:text-base cursor-pointer px-2.5 py-1 -ml-1 rounded-xl hover:bg-[#F1F5F9] transition-all duration-150 active:scale-95"
                          >
                            <span className="text-lg leading-none font-black text-[#0284C7]">&lt;</span>
                            <span>{turkishMonthNames[laundryViewMonth]} {laundryViewYear}</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={goToToday}
                              className="px-3 py-1.5 text-xs font-bold text-[#64748B] bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl transition-colors cursor-pointer active:scale-95"
                            >
                              Bugün
                            </button>

                            <select
                              value={laundryMachineFilter}
                              onChange={(e) => setLaundryMachineFilter(e.target.value)}
                              className="bg-white border border-[#E2E8F0] rounded-xl px-2.5 py-1.5 text-xs text-[#0F172A] focus:outline-none font-bold cursor-pointer"
                            >
                              <option value="all">Tüm Makineler</option>
                              <option value="yikama">Sadece Çamaşır</option>
                              <option value="kurutma">Sadece Kurutma</option>
                            </select>
                          </div>
                        </div>

                        {/* iOS Hafta Şeridi: Üste Kayan Hafta (animate-ios-week) */}
                        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-2 sm:px-4 py-2.5 animate-ios-week">
                          <div className="grid grid-cols-7 gap-1 text-center">
                            {weekStripDays.map((wd) => (
                              <button
                                key={wd.dateStr}
                                type="button"
                                onClick={() => setSelectedLaundryDate(wd.dateStr)}
                                className="group flex flex-col items-center justify-center py-1 sm:py-1.5 rounded-xl cursor-pointer transition-transform duration-150 active:scale-90"
                              >
                                <span
                                  className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                                    wd.isSelected ? "text-[#0284C7] font-black" : "text-[#64748B]"
                                  }`}
                                >
                                  {wd.dayName}
                                </span>
                                <span
                                  className={`mt-1 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm transition-all duration-200 select-none ${
                                    wd.isSelected
                                      ? "bg-[#0284C7] text-white font-black shadow-md ring-2 ring-[#0284C7]"
                                      : wd.isToday
                                      ? "text-[#0284C7] font-black border-2 border-[#0284C7] bg-sky-100"
                                      : "text-[#0F172A] font-bold hover:bg-[#F1F5F9]"
                                  }`}
                                >
                                  {wd.dayNum}
                                </span>
                                <div className="h-1.5 mt-1 flex items-center justify-center gap-0.5">
                                  {wd.slotsCount > 0 && (
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                                        wd.isSelected ? "bg-[#0284C7]" : wd.activeCount > 0 ? "bg-emerald-600" : "bg-[#0284C7]"
                                      }`}
                                    />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Hafta Şeridinin Altından Çıkan Saatlik Çizelge (animate-ios-hours + animate-ios-day-switch) */}
                        <div className="p-4 sm:p-6 animate-ios-hours space-y-4">
                          <div key={selectedLaundryDate} className="animate-ios-day-switch space-y-4">
                            {/* Tarih Başlığı (Proje Teması) */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-[#E2E8F0]">
                              <div>
                                <h3 className="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight flex items-center gap-2">
                                  <span>{formatLaundryTurkishDate(selectedLaundryDate)}</span>
                                  {selectedLaundryDate === todayDateStr && (
                                    <span className="text-[11px] font-bold text-[#0284C7] bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-300">
                                      Bugün
                                    </span>
                                  )}
                                </h3>
                                <p className="text-xs text-[#64748B] mt-0.5">
                                  Bu tarihte toplam {daySlots.length} çamaşır ve kurutma sırası kayıtlı.
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                  {activeWashingCount} Yıkanıyor
                                </span>
                                <span className="text-xs font-bold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
                                  {inQueueCount} Sırada
                                </span>
                              </div>
                            </div>

                            {/* iOS Dikey Saatler Çizelgesi (Proje Teması) */}
                            <div className="space-y-0 relative">
                              {timelineHours.map((hourStr) => {
                                const slotsInThisHour = getSlotsForHour(hourStr);
                                const isCurrentHour =
                                  selectedLaundryDate === todayDateStr &&
                                  parseInt(hourStr.slice(0, 2), 10) === currentHourNum;

                                return (
                                  <div
                                    key={hourStr}
                                    className="relative flex items-start gap-2 sm:gap-4 group min-h-[64px]"
                                  >
                                    {/* Sol Saat Etiketi */}
                                    <div className="w-12 sm:w-14 text-right pt-0.5 shrink-0">
                                      <span className="font-mono text-xs font-bold text-[#64748B]">
                                        {hourStr}
                                      </span>
                                    </div>

                                    {/* Sağ Çizelge Çizgisi ve İçerik */}
                                    <div className="flex-1 relative pt-2 pb-2 border-t border-[#E2E8F0]">
                                      {/* Canlı Şu An Zaman Çizgisi (Amber / Karamel) */}
                                      {isCurrentHour && (
                                        <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none -top-1.5">
                                          <div className="w-2.5 h-2.5 rounded-full bg-[#0284C7] -ml-1.5 ring-2 ring-[#0284C7] shadow-xs" />
                                          <div className="h-[2px] bg-[#0284C7] flex-1 shadow-xs" />
                                        </div>
                                      )}

                                      {/* Saatteki Randevu Kartları (Tema Kartları) */}
                                      {slotsInThisHour.length > 0 ? (
                                        <div className="space-y-2">
                                          {slotsInThisHour.map((booking) => (
                                            <div
                                              key={booking.id}
                                              className={`p-3 rounded-2xl border-l-4 shadow-xs transition-all ${
                                                booking.durum === "Yıkanıyor"
                                                  ? "bg-emerald-50/90 border-emerald-600 text-[#0F172A] border-t border-r border-b border-emerald-200"
                                                  : booking.durum === "Sırada"
                                                  ? "bg-[#F8FAFC] border-[#0284C7] text-[#0F172A] border-t border-r border-b border-[#E2E8F0]"
                                                  : "bg-[#F1F5F9] border-[#64748B] text-[#0F172A] border-t border-r border-b border-[#E2E8F0]"
                                              }`}
                                            >
                                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="font-black text-sm text-[#0F172A]">
                                                    {booking.ogrenciAd}
                                                  </span>
                                                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white font-bold border border-[#E2E8F0] text-[#64748B]">
                                                    Oda {booking.odaNo}
                                                  </span>
                                                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white font-bold border border-[#E2E8F0] text-[#64748B]">
                                                    {cleanMachineName(booking.makineNo)}
                                                  </span>
                                                </div>

                                                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                                  <span
                                                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border ${
                                                      booking.durum === "Yıkanıyor"
                                                        ? "bg-emerald-600 text-white border-emerald-700"
                                                        : booking.durum === "Sırada"
                                                        ? "bg-[#0284C7] text-[#0F172A] border-[#0284C7]"
                                                        : "bg-[#E2E8F0] text-[#64748B] border-[#CBD5E1]"
                                                    }`}
                                                  >
                                                    {booking.durum}
                                                  </span>
                                                </div>
                                              </div>

                                              <div className="pt-1.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                <div className="text-xs text-[#64748B]">
                                                  <span className="font-bold text-[#64748B]">Saat Aralığı:</span> {booking.saatAraligi}
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                  {booking.durum === "Sırada" && (
                                                    <button
                                                      type="button"
                                                      onClick={() => handleUpdateLaundryStatus(booking.id, "Yıkanıyor")}
                                                      className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer transition-all active:scale-95 shadow-xs"
                                                    >
                                                      Başlat
                                                    </button>
                                                  )}

                                                  {booking.durum === "Yıkanıyor" && (
                                                    <button
                                                      type="button"
                                                      onClick={() => handleUpdateLaundryStatus(booking.id, "Tamamlandı")}
                                                      className="px-2.5 py-1 rounded-xl bg-[#0369A1] hover:bg-[#0284C7] text-white font-bold text-[11px] cursor-pointer transition-all active:scale-95 shadow-xs"
                                                    >
                                                      Bitir
                                                    </button>
                                                  )}

                                                  <button
                                                    type="button"
                                                    onClick={() => handleDeleteLaundry(booking.id)}
                                                    className="px-2 py-1 rounded-xl hover:bg-[#F1F5F9] text-[#64748B] font-bold text-[11px] cursor-pointer transition-all"
                                                    title="Sırayı Sil / İptal Et"
                                                  >
                                                    Sil
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const matchedTimeSlot =
                                              timeSlots.find((ts) => ts.startsWith(hourStr.slice(0, 2))) ||
                                              `${hourStr} - ${parseInt(hourStr.slice(0, 2), 10) + 1}:30`;
                                            openQuickAddLaundry(
                                              laundryMachines[0]?.id || "Makine 1 (A-1)",
                                              matchedTimeSlot,
                                              selectedLaundryDate
                                            );
                                          }}
                                          className="w-full py-2 px-3 rounded-xl border border-dashed border-[#E2E8F0] hover:border-[#0284C7] hover:bg-[#F8FAFC] flex items-center justify-between text-[#64748B] hover:text-[#0F172A] transition-all cursor-pointer group text-xs"
                                        >
                                          <span className="text-[11px] text-[#64748B] group-hover:text-[#0F172A] font-medium">Müsait saat dilimi</span>
                                          <span className="text-[11px] font-bold text-[#0284C7] opacity-0 group-hover:opacity-100 transition-opacity">
                                            + Sıra Ver
                                          </span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {managerTab === "arizalar" && (
                <div className="bg-white border border-[#E2E8F0] p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">Arıza ve Bakım</h3>
                      <p className="text-xs text-[#64748B]">Yurt genelindeki arıza kayıtları ve durum güncellemeleri</p>
                    </div>
                    <button
                      onClick={() => setIsAddMaintenanceModalOpen(true)}
                      className="px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs rounded-xl cursor-pointer transition-colors border border-[#0369A1]"
                    >
                      + Yeni Arıza Bildir
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {maintenanceTickets.map((m) => (
                      <div
                        key={m.id}
                        className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-2.5 hover:border-[#0284C7] transition-all"
                      >
                        <div className="flex justify-between items-center">
                          <span className="px-2.5 py-0.5 rounded-lg bg-[#F1F5F9] text-[#0284C7] font-bold text-xs border border-[#E2E8F0]">
                            Oda {m.odaNo}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              m.oncelik === "Acil"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : m.oncelik === "Orta"
                                ? "bg-[#F1F5F9] text-[#0284C7] border-[#E2E8F0]"
                                : "bg-white text-[#64748B] border-[#E2E8F0]"
                            }`}
                          >
                            {m.oncelik}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-[#0F172A]">{m.baslik}</h4>
                        <div className="text-xs text-[#64748B]">
                          {m.kategori} • Bildiren: {m.bildiren}
                        </div>

                        <div className="pt-2.5 border-t border-[#E2E8F0] flex justify-between items-center">
                          <span
                            className={`text-xs font-bold ${
                              m.durum === "Çözüldü"
                                ? "text-[#0284C7]"
                                : m.durum === "İnceleniyor"
                                ? "text-[#0284C7]"
                                : "text-rose-600"
                            }`}
                          >
                            {m.durum}
                          </span>

                          <button
                            onClick={() => handleToggleMaintenanceStatus(m.id)}
                            className="px-3 py-1.5 bg-white hover:bg-[#F1F5F9] text-[#0F172A] hover:text-[#0284C7] border border-[#E2E8F0] text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-xs"
                          >
                            Durumu İlerlet →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* MODÜL 7: DUYURULAR PANOSU */}
              {/* ======================================================== */}
              {managerTab === "duyurular" && (
                <div className="bg-white border border-[#E2E8F0] p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">Duyurular</h3>
                    <button
                      onClick={() => setIsAddAnnouncementModalOpen(true)}
                      className="px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs rounded-xl cursor-pointer transition-colors border border-[#0369A1]"
                    >
                      + Yeni Duyuru
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {announcements.map((a) => (
                      <div key={a.id} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-2 hover:border-[#0284C7] transition-all">
                        <div className="flex justify-between items-start">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              a.oncelik === "Acil"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : a.oncelik === "Önemli"
                                ? "bg-[#F1F5F9] text-[#0284C7] border-[#E2E8F0]"
                                : "bg-white text-[#64748B] border-[#E2E8F0]"
                            }`}
                          >
                            {a.oncelik}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#64748B]">{a.tarih}</span>
                            <button
                              onClick={() => handleDeleteAnnouncement(a.id)}
                              className="text-[#64748B] hover:text-rose-600 text-xs cursor-pointer"
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-[#0F172A]">{a.baslik}</h4>
                        <p className="text-xs text-[#64748B]">{a.icerik}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* MODÜL 8: YURT AYARLARI (YEMEKHANE & ÇAMAŞIRHANE AYARLARI DAHİL) */}
              {/* ======================================================== */}
              {managerTab === "ayarlar" && (
                <div className="w-full space-y-4 sm:space-y-5">
                  {/* 1. YÖNETİCİ GİRİŞİ & ŞİFRE AYARLARI (AŞAĞIYA AÇILIR BUTON KART) */}
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs transition-all">
                    <button
                      type="button"
                      onClick={() => toggleSettingsSection("guvenlik")}
                      className="w-full p-4 sm:p-6 flex items-center justify-between gap-3 text-left transition-colors hover:bg-[#F8FAFC]/60 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                          openSettingsSections.guvenlik ? "bg-[#0284C7] text-white" : "bg-[#F1F5F9] text-[#0284C7]"
                        }`}>
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-black text-[#0F172A] truncate">
                            Yönetici Girişi & Şifre Ayarları
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-[#F8FAFC] border border-[#E2E8F0] transition-transform duration-300 ${
                          openSettingsSections.guvenlik ? "rotate-180 bg-[#F1F5F9]" : ""
                        }`}>
                          <svg className="w-4 h-4 text-[#0F172A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </button>

                    {openSettingsSections.guvenlik && (
                      <div className="border-t border-[#E2E8F0] p-5 sm:p-8 animate-accordion-down space-y-5 bg-white">
                        <form onSubmit={handleSaveAdminSecuritySettings} className="space-y-4 text-xs">
                          {/* Giriş Bilgileri Kartı */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[#64748B] font-semibold block mb-1">
                                Kullanıcı Adı
                              </label>
                              <input
                                type="text"
                                required
                                value={yurtSettings.adminKullaniciAdi || "mudur"}
                                onChange={(e) => setYurtSettings({ ...yurtSettings, adminKullaniciAdi: e.target.value })}
                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 font-mono font-bold"
                                placeholder="mudur"
                              />
                            </div>

                            <div>
                              <label className="text-[#64748B] font-semibold block mb-1">
                                E-posta
                              </label>
                              <input
                                type="email"
                                required
                                value={yurtSettings.adminEposta || "mudur@gunesyurdu.com"}
                                onChange={(e) => setYurtSettings({ ...yurtSettings, adminEposta: e.target.value })}
                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 font-mono font-bold"
                              />
                            </div>
                          </div>

                          {/* Güvenli Şifre Değiştirme Kartı */}
                          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-3">
                            <span className="text-xs font-bold text-[#0F172A] block">
                              Şifre Değiştir
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-[#64748B] font-medium block mb-1">Mevcut Şifre</label>
                                <input
                                  type="password"
                                  value={adminPasswordForm.mevcutSifre}
                                  onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, mevcutSifre: e.target.value })}
                                  placeholder="Mevcut şifreniz..."
                                  className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2.5 text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 font-mono font-medium"
                                />
                              </div>
                              <div>
                                <label className="text-[#64748B] font-medium block mb-1">Yeni Şifre</label>
                                <input
                                  type="password"
                                  value={adminPasswordForm.yeniSifre}
                                  onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, yeniSifre: e.target.value })}
                                  placeholder="Yeni şifre..."
                                  className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2.5 text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 font-mono font-medium"
                                />
                              </div>
                              <div>
                                <label className="text-[#64748B] font-medium block mb-1">Yeni Şifre (Tekrar)</label>
                                <input
                                  type="password"
                                  value={adminPasswordForm.yeniSifreTekrar}
                                  onChange={(e) => setAdminPasswordForm({ ...adminPasswordForm, yeniSifreTekrar: e.target.value })}
                                  placeholder="Yeni şifre tekrar..."
                                  className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2.5 text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 font-mono font-medium"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Genel Admin Girişi ve Güvenlik Tercihleri */}
                          <div className="space-y-2.5 pt-1">
                            <span className="text-xs font-bold text-[#0F172A] block">
                              Erişim ve Giriş İzinleri
                            </span>

                            {/* Ana Yönetici Girişi Açık/Kapalı */}
                            <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl gap-3">
                              <span className="text-xs font-bold text-[#0F172A]">
                                Genel Yönetici Girişi
                              </span>
                              <button
                                type="button"
                                onClick={() => setYurtSettings({ ...yurtSettings, adminGirisAktif: yurtSettings.adminGirisAktif === false ? true : false })}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  yurtSettings.adminGirisAktif !== false ? "bg-[#0284C7]" : "bg-stone-300"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                    yurtSettings.adminGirisAktif !== false ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Hızlı Giriş Butonları İzni */}
                            <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl gap-3">
                              <span className="text-xs font-bold text-[#0F172A]">
                                Giriş Ekranında Hızlı Giriş Butonları
                              </span>
                              <button
                                type="button"
                                onClick={() => setYurtSettings({ ...yurtSettings, hizliGirisIzin: yurtSettings.hizliGirisIzin === false ? true : false })}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  yurtSettings.hizliGirisIzin !== false ? "bg-[#0284C7]" : "bg-stone-300"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                    yurtSettings.hizliGirisIzin !== false ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Güvenli Oturum Koruması */}
                            <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl gap-3">
                              <span className="text-xs font-bold text-[#0F172A]">
                                Güvenli Oturum Koruması
                              </span>
                              <button
                                type="button"
                                onClick={() => setYurtSettings({ ...yurtSettings, guvenliOturum: yurtSettings.guvenliOturum === false ? true : false })}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  yurtSettings.guvenliOturum !== false ? "bg-[#0284C7]" : "bg-stone-300"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                    yurtSettings.guvenliOturum !== false ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl cursor-pointer shadow-xs transition-colors text-xs border border-[#0369A1]"
                          >
                            Yönetici Giriş ve Şifre Ayarlarını Kaydet
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* 3. YURT KURALLARI (AŞAĞIYA AÇILIR BUTON KART) */}
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs transition-all">
                    <button
                      type="button"
                      onClick={() => toggleSettingsSection("kurallar")}
                      className="w-full p-4 sm:p-6 flex items-center justify-between gap-3 text-left transition-colors hover:bg-[#F8FAFC]/60 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                          openSettingsSections.kurallar ? "bg-[#0284C7] text-white" : "bg-[#F1F5F9] text-[#0284C7]"
                        }`}>
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-black text-[#0F172A] truncate">
                            Giriş & Çıkış Saatleri
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-[#F8FAFC] border border-[#E2E8F0] transition-transform duration-300 ${
                          openSettingsSections.kurallar ? "rotate-180 bg-[#F1F5F9]" : ""
                        }`}>
                          <svg className="w-4 h-4 text-[#0F172A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </button>

                    {openSettingsSections.kurallar && (
                      <div className="border-t border-[#E2E8F0] p-5 sm:p-8 animate-accordion-down space-y-5 bg-white">
                        <form onSubmit={(e) => handleSaveYurtSettings(e, "Giriş ve çıkış kuralları başarıyla kaydedildi.")} className="space-y-4 text-xs">
                          {/* 1. İlk Çıkış Saatleri */}
                          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-3">
                            <label className="text-xs font-bold text-[#0F172A] block">
                              İlk Çıkış Saatleri
                            </label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Hafta İçi İlk Çıkış Kartı */}
                              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-[#0F172A]">Hafta İçi</span>
                                  <span className="text-xs font-mono font-black text-emerald-700 bg-[#F1F5F9] px-2 py-0.5 rounded-lg border border-[#E2E8F0]">
                                    {yurtSettings.ilkCikisHaftaIci || "06:00"}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openEntryTimePicker("cikisHaftaIci", "Hafta İçi İlk Çıkış")}
                                  className="w-full py-2.5 px-3 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#0284C7] rounded-xl text-xs sm:text-sm text-[#0F172A] text-center font-mono font-bold whitespace-nowrap cursor-pointer transition-all shadow-xs flex items-center justify-center gap-2 min-h-[44px]"
                                >
                                  <span>{yurtSettings.ilkCikisHaftaIci || "06:00"}</span>
                                </button>
                              </div>

                              {/* Hafta Sonu İlk Çıkış Kartı */}
                              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-[#0F172A]">Hafta Sonu</span>
                                  <span className="text-xs font-mono font-black text-emerald-700 bg-[#F1F5F9] px-2 py-0.5 rounded-lg border border-[#E2E8F0]">
                                    {yurtSettings.ilkCikisHaftaSonu || "06:30"}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openEntryTimePicker("cikisHaftaSonu", "Hafta Sonu İlk Çıkış")}
                                  className="w-full py-2.5 px-3 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#0284C7] rounded-xl text-xs sm:text-sm text-[#0F172A] text-center font-mono font-bold whitespace-nowrap cursor-pointer transition-all shadow-xs flex items-center justify-center gap-2 min-h-[44px]"
                                >
                                  <span>{yurtSettings.ilkCikisHaftaSonu || "06:30"}</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 2. Son Giriş Saatleri */}
                          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-3">
                            <label className="text-xs font-bold text-[#0F172A] block">
                              Son Giriş Saatleri
                            </label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Hafta İçi Son Giriş Kartı */}
                              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-[#0F172A]">Hafta İçi</span>
                                  <span className="text-xs font-mono font-black text-[#0284C7] bg-[#F1F5F9] px-2 py-0.5 rounded-lg border border-[#E2E8F0]">
                                    {yurtSettings.sonGirisHaftaIci || "23:00"}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openEntryTimePicker("haftaici", "Hafta İçi Son Giriş")}
                                  className="w-full py-2.5 px-3 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#0284C7] rounded-xl text-xs sm:text-sm text-[#0F172A] text-center font-mono font-bold whitespace-nowrap cursor-pointer transition-all shadow-xs flex items-center justify-center gap-2 min-h-[44px]"
                                >
                                  <span>{yurtSettings.sonGirisHaftaIci || "23:00"}</span>
                                </button>
                              </div>

                              {/* Hafta Sonu Son Giriş Kartı */}
                              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-[#0F172A]">Hafta Sonu</span>
                                  <span className="text-xs font-mono font-black text-[#0284C7] bg-[#F1F5F9] px-2 py-0.5 rounded-lg border border-[#E2E8F0]">
                                    {yurtSettings.sonGirisHaftaSonu || "23:45"}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openEntryTimePicker("haftasonu", "Hafta Sonu Son Giriş")}
                                  className="w-full py-2.5 px-3 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#0284C7] rounded-xl text-xs sm:text-sm text-[#0F172A] text-center font-mono font-bold whitespace-nowrap cursor-pointer transition-all shadow-xs flex items-center justify-center gap-2 min-h-[44px]"
                                >
                                  <span>{yurtSettings.sonGirisHaftaSonu || "23:45"}</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl cursor-pointer shadow-xs transition-colors text-xs border border-[#0369A1]"
                          >
                            Giriş ve Çıkış Kurallarını Kaydet
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* 3. ÖĞRENCİLER (AŞAĞIYA AÇILIR BUTON KART) */}
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs transition-all">
                    <button
                      type="button"
                      onClick={() => toggleSettingsSection("ogrenciler")}
                      className="w-full p-4 sm:p-6 flex items-center justify-between gap-3 text-left transition-colors hover:bg-[#F8FAFC]/60 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                          openSettingsSections.ogrenciler ? "bg-[#0284C7] text-white" : "bg-[#F1F5F9] text-[#0284C7]"
                        }`}>
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-black text-[#0F172A] truncate">
                            Öğrenciler
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-[#F8FAFC] border border-[#E2E8F0] transition-transform duration-300 ${
                          openSettingsSections.ogrenciler ? "rotate-180 bg-[#F1F5F9]" : ""
                        }`}>
                          <svg className="w-4 h-4 text-[#0F172A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </button>

                    {openSettingsSections.ogrenciler && (
                      <div className="border-t border-[#E2E8F0] p-4 sm:p-6 animate-accordion-down space-y-4 bg-white">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[#0F172A]">Kayıtlı Öğrenci Listesi</h4>
                            <span className="text-[10px] text-[#64748B]">({filteredStudents.length} gösteriliyor)</span>
                          </div>

                          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
                            <input
                              type="text"
                              placeholder="Öğrenci veya Oda ara..."
                              value={studentSearch}
                              onChange={(e) => setStudentSearch(e.target.value)}
                              className="bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-[#94A3B8] rounded-xl px-3 py-2 w-full sm:w-48 focus:outline-none focus:border-[#0284C7]"
                            />

                            <button
                              type="button"
                              onClick={() => setIsAddStudentModalOpen(true)}
                              className="px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shrink-0 text-center border border-[#0369A1]"
                            >
                              + Yeni Öğrenci
                            </button>
                          </div>
                        </div>

                        {/* Mobil Kart Görünümü */}
                        <div className="sm:hidden space-y-3">
                          {filteredStudents.length === 0 ? (
                            <div className="p-6 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                              Kayıtlı öğrenci bulunamadı.
                            </div>
                          ) : (
                            filteredStudents.map((std) => (
                              <div
                                key={std.id}
                                className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-2xl space-y-2.5 shadow-xs"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-[#0F172A] text-sm truncate">{std.adSoyad}</h4>
                                    <p className="text-[11px] text-[#64748B] truncate mt-0.5">{std.eposta}</p>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="px-2.5 py-1 rounded-lg bg-[#0284C7] text-white font-bold text-xs border border-[#0369A1]">
                                      Oda {std.odaNo}
                                    </span>
                                    <span className="px-2 py-1 rounded-lg bg-white text-[#64748B] font-bold text-xs border border-[#E2E8F0]">
                                      Kat {std.yatakNo}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedStudentForDetail(std)}
                                    className="flex-1 py-1.5 px-2 bg-white hover:bg-[#F1F5F9] text-[#0F172A] font-bold rounded-lg text-xs border border-[#E2E8F0] transition-colors cursor-pointer text-center"
                                  >
                                    Detay
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingStudent(std)}
                                    className="flex-1 py-1.5 px-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer text-center border border-[#0369A1]"
                                  >
                                    Düzenle
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteStudent(std.id, std.adSoyad)}
                                    className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs transition-colors cursor-pointer border border-rose-200"
                                  >
                                    Sil
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Masaüstü Tablo Görünümü */}
                        <div className="hidden sm:block overflow-x-auto">
                          <table className="w-full text-left text-xs min-w-[500px]">
                            <thead className="bg-[#F8FAFC] text-[#64748B] uppercase tracking-wider text-[10px]">
                              <tr>
                                <th className="p-3 rounded-l-xl">Öğrenci</th>
                                <th className="p-3">Oda / Kat</th>
                                <th className="p-3">E-Posta</th>
                                <th className="p-3 rounded-r-xl text-right">İşlemler</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                              {filteredStudents.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="p-8 text-center text-[#64748B]">
                                    Kayıtlı öğrenci bulunamadı.
                                  </td>
                                </tr>
                              ) : (
                                filteredStudents.map((std) => (
                                  <tr key={std.id} className="hover:bg-[#F8FAFC] transition-colors">
                                    <td className="p-3">
                                      <div className="font-bold text-[#0F172A] text-sm">{std.adSoyad}</div>
                                    </td>
                                    <td className="p-3">
                                      <div className="inline-flex items-center gap-1.5">
                                        <span className="px-2.5 py-1 rounded-lg bg-[#0284C7] text-white font-bold border border-[#0369A1]">
                                          Oda {std.odaNo}
                                        </span>
                                        <span className="px-2 py-1 rounded-lg bg-[#F8FAFC] text-[#64748B] font-bold border border-[#E2E8F0]">
                                          Kat {std.yatakNo}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <div className="text-[#0F172A] font-medium">{std.eposta}</div>
                                    </td>
                                    <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                      <button
                                        type="button"
                                        onClick={() => setEditingStudent(std)}
                                        className="px-2.5 py-1 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-lg text-[11px] cursor-pointer transition-colors border border-[#0369A1]"
                                        title="Tüm bilgilerini ve oda/yatağını düzenle"
                                      >
                                        Düzenle
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedStudentForDetail(std)}
                                        className="px-2.5 py-1 bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#0F172A] font-medium rounded-lg text-[11px] cursor-pointer border border-[#E2E8F0] transition-colors"
                                      >
                                        Kart
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteStudent(std.id, std.adSoyad)}
                                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] cursor-pointer transition-colors border border-rose-200"
                                      >
                                        Sil
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. YEMEKHANE MENÜ & SERVİS AYARLARI (AŞAĞIYA AÇILIR BUTON KART) */}
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs transition-all">
                    <button
                      type="button"
                      onClick={() => toggleSettingsSection("yemekhane")}
                      className="w-full p-4 sm:p-6 flex items-center justify-between gap-3 text-left transition-colors hover:bg-[#F8FAFC]/60 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                          openSettingsSections.yemekhane ? "bg-[#0284C7] text-white" : "bg-[#F1F5F9] text-[#0284C7]"
                        }`}>
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-black text-[#0F172A] truncate">
                            Yemekhane Ayarları
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-[#F8FAFC] border border-[#E2E8F0] transition-transform duration-300 ${
                          openSettingsSections.yemekhane ? "rotate-180 bg-[#F1F5F9]" : ""
                        }`}>
                          <svg className="w-4 h-4 text-[#0F172A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </button>

                    {openSettingsSections.yemekhane && (
                      <div className="border-t border-[#E2E8F0] p-5 sm:p-8 animate-accordion-down space-y-4 text-xs bg-white">
                        {/* A. BUGÜNÜN GEÇERLİ YEMEK SAATİ TARİFESİ SEÇİCİ */}
                        <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-2.5">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5">
                            <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                              Bugünün Yemek Saati Tarifesi
                            </label>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] self-start sm:self-auto">
                              Geçerli: {dailyMenu.gunTipi === "haftasonu" ? "Hafta Sonu" : dailyMenu.gunTipi === "ozelgun" ? "Bayram / Özel Gün" : "Hafta İçi"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                            {/* 1. Hafta İçi Kartı */}
                            <div
                              onClick={() => handleToggleGunTipi("haftaici")}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                                dailyMenu.gunTipi === "haftaici" || !dailyMenu.gunTipi
                                  ? "bg-white border-2 border-[#0284C7] shadow-xs"
                                  : "bg-white border-[#E2E8F0] hover:border-[#0284C7]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-xs text-[#0F172A]">Hafta İçi</div>
                                  <div className="text-[10px] text-[#64748B]">Pzt - Cuma</div>
                                </div>
                                {dailyMenu.gunTipi === "haftaici" || !dailyMenu.gunTipi ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0284C7] text-[#0F172A] border border-[#0369A1]">
                                    Geçerli
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleGunTipi("haftaici");
                                    }}
                                    className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#64748B] hover:bg-[#0284C7] hover:text-[#0F172A] transition-colors"
                                  >
                                    Seç
                                  </button>
                                )}
                              </div>

                              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]" onClick={(e) => e.stopPropagation()}>
                                <div className="space-y-1">
                                  <span className="text-[11px] font-semibold text-[#64748B] block">Kahvaltı</span>
                                  <button
                                    type="button"
                                    onClick={() => openTimePicker("haftaici", "kahvalti", "Hafta İçi • Sabah Kahvaltısı")}
                                    className="w-full py-1.5 px-2 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#0284C7] rounded-xl text-xs text-[#0F172A] text-center font-mono font-bold whitespace-nowrap cursor-pointer transition-all shadow-xs"
                                  >
                                    {formatDisplayHours(dailyMenu.saatler?.haftaici?.kahvalti || "07:30 - 10:00")}
                                  </button>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[11px] font-semibold text-[#64748B] block">Akşam</span>
                                  <button
                                    type="button"
                                    onClick={() => openTimePicker("haftaici", "aksam", "Hafta İçi • Akşam Yemeği")}
                                    className="w-full py-1.5 px-2 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#0284C7] rounded-xl text-xs text-[#0F172A] text-center font-mono font-bold whitespace-nowrap cursor-pointer transition-all shadow-xs"
                                  >
                                    {formatDisplayHours(dailyMenu.saatler?.haftaici?.aksam || "18:00 - 20:30")}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* 2. Hafta Sonu Kartı */}
                            <div
                              onClick={() => handleToggleGunTipi("haftasonu")}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                                dailyMenu.gunTipi === "haftasonu"
                                  ? "bg-white border-2 border-[#0284C7] shadow-xs"
                                  : "bg-white border-[#E2E8F0] hover:border-[#0284C7]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-xs text-[#0F172A]">Hafta Sonu</div>
                                  <div className="text-[10px] text-[#64748B]">Cmt - Pazar</div>
                                </div>
                                {dailyMenu.gunTipi === "haftasonu" ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0284C7] text-[#0F172A] border border-[#0369A1]">
                                    Geçerli
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleGunTipi("haftasonu");
                                    }}
                                    className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#64748B] hover:bg-[#0284C7] hover:text-[#0F172A] transition-colors"
                                  >
                                    Seç
                                  </button>
                                )}
                              </div>

                              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]" onClick={(e) => e.stopPropagation()}>
                                <div className="space-y-1">
                                  <span className="text-[11px] font-semibold text-[#64748B] block">Kahvaltı</span>
                                  <button
                                    type="button"
                                    onClick={() => openTimePicker("haftasonu", "kahvalti", "Hafta Sonu • Sabah Kahvaltısı")}
                                    className="w-full py-1.5 px-2 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#0284C7] rounded-xl text-xs text-[#0F172A] text-center font-mono font-bold whitespace-nowrap cursor-pointer transition-all shadow-xs"
                                  >
                                    {formatDisplayHours(dailyMenu.saatler?.haftasonu?.kahvalti || "08:30 - 11:30")}
                                  </button>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[11px] font-semibold text-[#64748B] block">Akşam</span>
                                  <button
                                    type="button"
                                    onClick={() => openTimePicker("haftasonu", "aksam", "Hafta Sonu • Akşam Yemeği")}
                                    className="w-full py-1.5 px-2 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#0284C7] rounded-xl text-xs text-[#0F172A] text-center font-mono font-bold whitespace-nowrap cursor-pointer transition-all shadow-xs"
                                  >
                                    {formatDisplayHours(dailyMenu.saatler?.haftasonu?.aksam || "18:30 - 21:00")}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* 3. Bayram / Özel Gün Kartı */}
                            <div
                              onClick={() => handleToggleGunTipi("ozelgun")}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                                dailyMenu.gunTipi === "ozelgun"
                                  ? "bg-white border-2 border-[#0284C7] shadow-xs"
                                  : "bg-white border-[#E2E8F0] hover:border-[#0284C7]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-xs text-[#0F172A]">Bayram / Özel</div>
                                  <div className="text-[10px] text-[#64748B]">Tatil & Özel Gün</div>
                                </div>
                                {dailyMenu.gunTipi === "ozelgun" ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0284C7] text-[#0F172A] border border-[#0369A1]">
                                    Geçerli
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleGunTipi("ozelgun");
                                    }}
                                    className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#64748B] hover:bg-[#0284C7] hover:text-[#0F172A] transition-colors"
                                  >
                                    Seç
                                  </button>
                                )}
                              </div>

                              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]" onClick={(e) => e.stopPropagation()}>
                                <div className="space-y-1">
                                  <span className="text-[11px] font-semibold text-[#64748B] block">Kahvaltı</span>
                                  <button
                                    type="button"
                                    onClick={() => openTimePicker("ozelgun", "kahvalti", "Bayram / Özel • Sabah Kahvaltısı")}
                                    className="w-full py-1.5 px-2 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#0284C7] rounded-xl text-xs text-[#0F172A] text-center font-mono font-bold whitespace-nowrap cursor-pointer transition-all shadow-xs"
                                  >
                                    {formatDisplayHours(dailyMenu.saatler?.ozelgun?.kahvalti || "09:00 - 12:00")}
                                  </button>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[11px] font-semibold text-[#64748B] block">Akşam</span>
                                  <button
                                    type="button"
                                    onClick={() => openTimePicker("ozelgun", "aksam", "Bayram / Özel • Akşam Yemeği")}
                                    className="w-full py-1.5 px-2 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#0284C7] rounded-xl text-xs text-[#0F172A] text-center font-mono font-bold whitespace-nowrap cursor-pointer transition-all shadow-xs"
                                  >
                                    {formatDisplayHours(dailyMenu.saatler?.ozelgun?.aksam || "19:00 - 21:30")}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. ÇAMAŞIRHANE & MAKİNE KAPASİTE AYARLARI (AŞAĞIYA AÇILIR BUTON KART) */}
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs transition-all">
                    {(() => {
                      const washingCount = laundryMachines.filter((m) => m.tur === "yikama" || m.tip.toLowerCase().includes("yıkama") || m.id.includes("Makine")).length;
                      const dryerCount = laundryMachines.filter((m) => m.tur === "kurutma" || m.tip.toLowerCase().includes("kurutma") || m.id.includes("Kurutma")).length;

                      return (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleSettingsSection("camasirhane")}
                            className="w-full p-4 sm:p-6 flex items-center justify-between gap-3 text-left transition-colors hover:bg-[#F8FAFC]/60 cursor-pointer"
                          >
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                                openSettingsSections.camasirhane ? "bg-[#0284C7] text-white" : "bg-[#F1F5F9] text-[#0284C7]"
                              }`}>
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4V4zm8 12a4 4 0 100-8 4 4 0 000 8zm-5-9h.01M10 7h.01" />
                                </svg>
                              </div>
                              <div className="min-w-0">
                                <h3 className="text-sm sm:text-base font-black text-[#0F172A] truncate">
                                  Çamaşırhane ve Makine Ayarları
                                </h3>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-[#F8FAFC] border border-[#E2E8F0] transition-transform duration-300 ${
                                openSettingsSections.camasirhane ? "rotate-180 bg-[#F1F5F9]" : ""
                              }`}>
                                <svg className="w-4 h-4 text-[#0F172A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </button>

                          {openSettingsSections.camasirhane && (
                            <div className="border-t border-[#E2E8F0] p-5 sm:p-8 animate-accordion-down space-y-5 text-xs bg-white">
                              {/* Günlük Maksimum Çamaşır Atma Limiti (Kişi Başı ve Yurt Başı) */}
                              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-3">
                                {/* Kapsam Seçici Sekmeler (Kişi Başı vs Yurt Başı) */}
                                <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E2E8F0] rounded-xl">
                                  <button
                                    type="button"
                                    onClick={() => setSettingsLaundryScope("kisi")}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer text-center min-h-[38px] ${
                                      settingsLaundryScope === "kisi"
                                        ? "bg-[#0284C7] text-white shadow-xs"
                                        : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                                    }`}
                                  >
                                    Kişi Başı Limit ({dailyLaundryLimit === 0 ? "Sınırsız" : `${dailyLaundryLimit} Yıkama`})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSettingsLaundryScope("yurt")}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer text-center min-h-[38px] ${
                                      settingsLaundryScope === "yurt"
                                        ? "bg-[#0284C7] text-white shadow-xs"
                                        : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                                    }`}
                                  >
                                    Yurt Başı Toplam ({dailyDormLaundryLimit === 0 ? "Sınırsız" : `${dailyDormLaundryLimit} Yıkama`})
                                  </button>
                                </div>

                                {settingsLaundryScope === "kisi" && (
                                  <div className="space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div>
                                        <span className="font-bold text-sm text-[#0F172A] block">
                                          Öğrenci Başına Günlük Hak
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => handleSetDailyLaundryLimit(Math.max(0, dailyLaundryLimit - 1))}
                                          disabled={dailyLaundryLimit <= 0}
                                          className="w-10 h-10 rounded-xl bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] font-black text-base flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 shadow-xs"
                                          title="Kişi başı limiti 1 azalt"
                                          aria-label="Kişi başı limiti 1 azalt"
                                        >
                                          -
                                        </button>
                                        <div className="min-w-[120px] text-center px-3 py-1 bg-white border border-[#0284C7]/40 rounded-xl shadow-xs flex flex-col items-center justify-center focus-within:ring-2 focus-within:ring-[#0284C7]/20 focus-within:border-[#0284C7]">
                                          <div className="flex items-center justify-center gap-1 w-full">
                                            <input
                                              type="number"
                                              min={0}
                                              max={999}
                                              value={dailyLaundryLimit === 0 ? "" : dailyLaundryLimit}
                                              placeholder="0"
                                              onChange={(e) => {
                                                const val = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                                                handleSetDailyLaundryLimit(isNaN(val) ? 0 : Math.max(0, val));
                                              }}
                                              className="w-14 text-center font-black text-sm text-[#0284C7] bg-transparent focus:outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                              title="Manuel sayı girin (0: Sınırsız)"
                                            />
                                            <span className="text-[11px] font-bold text-[#64748B]">Yıkama</span>
                                          </div>
                                          <span className="text-[10px] text-[#64748B] font-medium block">
                                            {dailyLaundryLimit === 0 ? "0: Sınırsız" : "Günlük / Kişi"}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleSetDailyLaundryLimit(dailyLaundryLimit + 1)}
                                          className="w-10 h-10 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-base flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs border border-[#0369A1]"
                                          title="Kişi başı limiti 1 artır"
                                          aria-label="Kişi başı limiti 1 artır"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {settingsLaundryScope === "yurt" && (
                                  <div className="space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div>
                                        <span className="font-bold text-sm text-[#0F172A] block">
                                          Yurt Geneli Günlük Toplam Kapasite
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const step = dailyDormLaundryLimit <= 5 ? 1 : 5;
                                            handleSetDailyDormLaundryLimit(Math.max(0, dailyDormLaundryLimit - step));
                                          }}
                                          disabled={dailyDormLaundryLimit <= 0}
                                          className="w-10 h-10 rounded-xl bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] font-black text-base flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 shadow-xs"
                                          title="Yurt toplam limitini azalt"
                                          aria-label="Yurt toplam limitini azalt"
                                        >
                                          -
                                        </button>
                                        <div className="min-w-[120px] text-center px-3 py-1 bg-white border border-[#0284C7]/40 rounded-xl shadow-xs flex flex-col items-center justify-center focus-within:ring-2 focus-within:ring-[#0284C7]/20 focus-within:border-[#0284C7]">
                                          <div className="flex items-center justify-center gap-1 w-full">
                                            <input
                                              type="number"
                                              min={0}
                                              max={9999}
                                              value={dailyDormLaundryLimit === 0 ? "" : dailyDormLaundryLimit}
                                              placeholder="0"
                                              onChange={(e) => {
                                                const val = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                                                handleSetDailyDormLaundryLimit(isNaN(val) ? 0 : Math.max(0, val));
                                              }}
                                              className="w-16 text-center font-black text-sm text-[#0284C7] bg-transparent focus:outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                              title="Manuel sayı girin (0: Sınırsız)"
                                            />
                                            <span className="text-[11px] font-bold text-[#64748B]">Yıkama</span>
                                          </div>
                                          <span className="text-[10px] text-[#64748B] font-medium block">
                                            {dailyDormLaundryLimit === 0 ? "0: Sınırsız" : "Günlük / Yurt"}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const step = dailyDormLaundryLimit < 5 ? 1 : 5;
                                            handleSetDailyDormLaundryLimit(dailyDormLaundryLimit + step);
                                          }}
                                          className="w-10 h-10 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-base flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs border border-[#0369A1]"
                                          title="Yurt toplam limitini artır"
                                          aria-label="Yurt toplam limitini artır"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Mevcut Makineler Listesi */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-[#0F172A]">Mevcut Makineler ({laundryMachines.length})</span>
                                </div>

                                <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl">
                                  {laundryMachines.map((m) => (
                                    <div
                                      key={m.id}
                                      className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            m.tur === "kurutma" || m.id.includes("Kurutma")
                                              ? "bg-[#0284C7]/20 text-[#64748B] border border-[#0284C7]"
                                              : "bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0]"
                                          }`}
                                        >
                                          {m.tur === "kurutma" || m.id.includes("Kurutma") ? "Kurutma" : "Yıkama"}
                                        </span>
                                        <div>
                                          <span className="font-bold text-[#0F172A] block">{m.name}</span>
                                          <span className="text-[10px] text-[#64748B]">{m.tip}</span>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteMachine(m.id)}
                                        disabled={laundryMachines.length <= 1}
                                        className="text-[11px] text-[#64748B] hover:text-rose-600 font-semibold px-2 py-1 rounded cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Bu makineyi kaldır"
                                      >
                                        Sil
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Özel Yeni Makine Tanımlama Formu */}
                              <form onSubmit={handleAddCustomMachine} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-3 text-xs">
                                <span className="font-bold text-[#0F172A] block text-xs">
                                  + Yeni Makine Ekle
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  <div>
                                    <label className="text-[11px] text-[#64748B] block mb-1">Makine Adı:</label>
                                    <input
                                      type="text"
                                      required
                                      placeholder="Örn: Makine 7"
                                      value={newCustomMachine.name}
                                      onChange={(e) => setNewCustomMachine({ ...newCustomMachine, name: e.target.value })}
                                      className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2 text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[11px] text-[#64748B] block mb-1">Konum:</label>
                                    <input
                                      type="text"
                                      placeholder="Örn: A Blok, Zemin Kat"
                                      value={newCustomMachine.blok}
                                      onChange={(e) => setNewCustomMachine({ ...newCustomMachine, blok: e.target.value })}
                                      className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2 text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  <div>
                                    <label className="text-[11px] text-[#64748B] block mb-1">Makine Türü:</label>
                                    <select
                                      value={newCustomMachine.tur}
                                      onChange={(e) => setNewCustomMachine({ ...newCustomMachine, tur: e.target.value as any })}
                                      className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2 text-[#0F172A] focus:outline-none focus:border-[#0284C7] font-medium"
                                    >
                                      <option value="yikama">Çamaşır Yıkama Makinesi</option>
                                      <option value="kurutma">Kurutma Makinesi</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="text-[11px] text-[#64748B] block mb-1">Kapasite (kg) (İsteğe Bağlı):</label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="50"
                                      placeholder="Örn: 9"
                                      value={newCustomMachine.kapasiteKg}
                                      onChange={(e) => setNewCustomMachine({ ...newCustomMachine, kapasiteKg: e.target.value.replace(/^0+/, "") })}
                                      className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2 text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
                                    />
                                  </div>
                                </div>

                                <button
                                  type="submit"
                                  className="w-full py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl cursor-pointer transition-colors text-xs border border-[#0369A1] shadow-xs"
                                >
                                  + Yeni Makineyi Filoya Ekle
                                </button>
                              </form>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* TEMA AYARLARI */}
                  <div className="bg-white border border-[#E2E8F0] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-[#F1F5F9] text-[#0284C7]">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-[#0F172A]">
                        Tema
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Aydınlık Mod Seçeneği */}
                      <button
                        type="button"
                        onClick={() => selectTheme("light", true)}
                        className={`p-3 rounded-xl sm:rounded-2xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-3 min-h-[48px] active:scale-[0.99] ${
                          theme === "light"
                            ? "border-[#0284C7] bg-[#F1F5F9] dark:bg-[#162032]"
                            : "border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] hover:border-[#CBD5E1] dark:hover:border-[#475569] hover:bg-white dark:hover:bg-[#1E293B]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            theme === "light"
                              ? "bg-[#0284C7] text-white"
                              : "bg-white dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#334155]"
                          }`}>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                          <span className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">Aydınlık Mod</span>
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
                        onClick={() => selectTheme("dark", true)}
                        className={`p-3 rounded-xl sm:rounded-2xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-3 min-h-[48px] active:scale-[0.99] ${
                          theme === "dark"
                            ? "border-[#0284C7] bg-[#F1F5F9] dark:bg-[#162032]"
                            : "border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] hover:border-[#CBD5E1] dark:hover:border-[#475569] hover:bg-white dark:hover:bg-[#1E293B]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            theme === "dark"
                              ? "bg-[#0284C7] text-white"
                              : "bg-white dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#334155]"
                          }`}>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-[#F1F5F9]">Karanlık Mod</span>
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

                  {/* Çıkış Yap Butonu */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer text-center min-h-[44px]"
                  >
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>

              {/* MODALLAR (MODÜLER BİLEŞENLER) */}
              <AddRoomModal
                isOpen={isAddRoomModalOpen}
                newRoom={newRoom}
                setNewRoom={setNewRoom}
                onClose={() => setIsAddRoomModalOpen(false)}
                onSubmit={handleAddRoom}
              />

              <EditRoomModal
                editingRoom={editingRoom}
                setEditingRoom={setEditingRoom}
                onSubmit={handleUpdateRoom}
              />

              <AddStudentModal
                isOpen={isAddStudentModalOpen}
                newStudent={newStudent}
                setNewStudent={setNewStudent}
                onClose={() => setIsAddStudentModalOpen(false)}
                onSubmit={handleAddStudent}
              />

              <EditStudentModal
                editingStudent={editingStudent}
                setEditingStudent={setEditingStudent}
                onSubmit={handleEditStudent}
              />

              <StudentDetailModal
                student={selectedStudentForDetail}
                onClose={() => setSelectedStudentForDetail(null)}
                onEdit={(student) => {
                  setSelectedStudentForDetail(null);
                  setEditingStudent(student);
                }}
              />

              <AddLaundryModal
                isOpen={isAddLaundryModalOpen}
                laundryMachines={laundryMachines}
                newLaundry={newLaundry}
                setNewLaundry={setNewLaundry}
                onClose={() => setIsAddLaundryModalOpen(false)}
                onSubmit={handleSaveLaundry}
              />

              <ManageMachinesModal
                isOpen={isManageMachinesModalOpen}
                laundryMachines={laundryMachines}
                newCustomMachine={newCustomMachine}
                setNewCustomMachine={setNewCustomMachine}
                onQuickSetCount={handleQuickSetCount}
                onDeleteMachine={handleDeleteMachine}
                onAddCustomMachine={handleAddCustomMachine}
                dailyLaundryLimit={dailyLaundryLimit}
                onSetDailyLaundryLimit={handleSetDailyLaundryLimit}
                dailyDormLaundryLimit={dailyDormLaundryLimit}
                onSetDailyDormLaundryLimit={handleSetDailyDormLaundryLimit}
                onClose={() => setIsManageMachinesModalOpen(false)}
              />

              <AddMaintenanceModal
                isOpen={isAddMaintenanceModalOpen}
                newMaintenance={newMaintenance}
                setNewMaintenance={setNewMaintenance}
                onClose={() => setIsAddMaintenanceModalOpen(false)}
                onSubmit={handleAddMaintenance}
              />

              <AddAnnouncementModal
                isOpen={isAddAnnouncementModalOpen}
                newAnnouncement={newAnnouncement}
                setNewAnnouncement={setNewAnnouncement}
                onClose={() => setIsAddAnnouncementModalOpen(false)}
                onSubmit={handleAddAnnouncement}
              />
            </div>
          );
        })()}

        {/* ========================================================= */}
        {/* C. ÖĞRENCİ PANELİ */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* C. ÖĞRENCİ PANELİ */}
        {/* ========================================================= */}
        {currentUser.role === "ogrenci" && (
          <StudentPortalView
            currentUser={currentUser}
            yurtSettings={yurtSettings}
            yurtlar={yurtlar}
            dailyMenu={dailyMenu}
            announcements={announcements}
            maintenanceTickets={maintenanceTickets}
            rooms={rooms}
            students={students}
            mealAttendance={mealAttendance}
            onSaveMealAttendance={handleSaveMealAttendance}
            laundrySlots={liveLaundrySlots}
            laundryMachines={laundryMachines}
            onAddLaundrySlot={(slot) => {
              const { formattedRange } = parseSlotMinutes(slot.saatAraligi);
              const dynamicStatus = getDynamicSlotStatus({
                tarih: slot.tarih,
                saatAraligi: formattedRange,
                durum: slot.durum,
              });
              const normalizedSlot = {
                ...slot,
                makineNo: cleanMachineName(slot.makineNo),
                saatAraligi: formattedRange,
                durum: dynamicStatus,
              };

              let currentSlots = laundrySlots;
              if (typeof window !== "undefined") {
                try {
                  const raw = localStorage.getItem("yurtify_laundry") || localStorage.getItem("yurtify_laundry_slots");
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) currentSlots = parsed;
                  }
                } catch {}
              }
              const updated = [normalizedSlot, ...currentSlots.filter((s) => s.id !== normalizedSlot.id)];
              const { updatedSlots } = syncSlotsWithCurrentTime(updated);
              setLaundrySlots(updatedSlots);
              if (typeof window !== "undefined") {
                localStorage.setItem("yurtify_laundry", JSON.stringify(updatedSlots));
                localStorage.setItem("yurtify_laundry_slots", JSON.stringify(updatedSlots));
              }
            }}
            onCancelLaundrySlot={(slotId) => {
              let currentSlots = laundrySlots;
              if (typeof window !== "undefined") {
                try {
                  const raw = localStorage.getItem("yurtify_laundry") || localStorage.getItem("yurtify_laundry_slots");
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) currentSlots = parsed;
                  }
                } catch {}
              }
              const updated = currentSlots.filter((s) => s.id !== slotId);
              setLaundrySlots(updated);
              if (typeof window !== "undefined") {
                localStorage.setItem("yurtify_laundry", JSON.stringify(updated));
                localStorage.setItem("yurtify_laundry_slots", JSON.stringify(updated));
              }
            }}
            onUpdateStudentPassword={(studentName, newPass) => {
              const updated = students.map((s) =>
                s.adSoyad.trim().toLowerCase() === studentName.trim().toLowerCase()
                  ? { ...s, sifre: newPass }
                  : s
              );
              setStudents(updated);
              if (typeof window !== "undefined") {
                localStorage.setItem("yurtify_students", JSON.stringify(updated));
              }
            }}
            onUpdateStudentProfile={(studentName, updates) => {
              const updated = students.map((s) =>
                s.adSoyad.trim().toLowerCase() === studentName.trim().toLowerCase()
                  ? {
                      ...s,
                      ...(updates.kullaniciAdi ? { kullaniciAdi: updates.kullaniciAdi.trim() } : {}),
                      ...(updates.eposta ? { eposta: updates.eposta.trim() } : {}),
                      ...(updates.sifre ? { sifre: updates.sifre } : {}),
                    }
                  : s
              );
              setStudents(updated);
              if (typeof window !== "undefined") {
                localStorage.setItem("yurtify_students", JSON.stringify(updated));
              }
            }}
            theme={theme}
            onToggleTheme={toggleTheme}
            onSelectTheme={(selectedTheme) => selectTheme(selectedTheme, true)}
            onLogout={handleLogout}
            onAddMaintenanceTicket={(ticket) => {
              let currentMnt = maintenanceTickets;
              if (typeof window !== "undefined") {
                try {
                  const raw = localStorage.getItem("yurtify_maintenance");
                  if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) currentMnt = parsed;
                  }
                } catch {}
              }
              const updated = [ticket, ...currentMnt.filter((t) => t.id !== ticket.id)];
              setMaintenanceTickets(updated);
              if (typeof window !== "undefined") {
                localStorage.setItem("yurtify_maintenance", JSON.stringify(updated));
              }
            }}
            showToast={showToast}
          />
        )}
      </main>

      <footer className="mt-auto border-t border-[#E2E8F0] bg-[#F8FAFC] px-6 py-3 mb-16 md:mb-0 text-center text-xs text-[#64748B]">
        Yurtify
      </footer>

      {/* ======================================================== */}
      {/* MOBİL ALT GEZİNME ÇUBUĞU (BOTTOM NAVIGATION BAR) */}
      {/* ======================================================== */}
      {currentUser.role === "yonetici" && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] shadow-lg px-2 py-1 pb-[max(0.4rem,env(safe-area-inset-bottom))]"
          aria-label="Mobil Alt Menü"
        >
          <div className="flex items-center justify-around gap-0.5 max-w-lg mx-auto">
            {managerTabItems.map((tab) => {
              const isActive = managerTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setManagerTab(tab.id as any)}
                  className={`flex flex-col items-center justify-center flex-1 py-1.5 px-0.5 rounded-xl transition-all cursor-pointer relative min-h-[44px] ${
                    isActive
                      ? "text-[#0284C7] font-bold bg-[#F1F5F9]"
                      : "text-[#64748B] hover:text-[#0F172A] font-medium"
                  }`}
                >
                  <div className="relative">
                    <span className={`w-5 h-5 flex items-center justify-center ${isActive ? "text-[#0284C7]" : "text-[#64748B]"}`}>
                      {tab.icon}
                    </span>
                    {tab.id === "arizalar" && openTickets > 0 && (
                      <span className="absolute -top-1 -right-2.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                        {openTickets}
                      </span>
                    )}
                  </div>
                  <span className="text-[10.5px] mt-0.5 tracking-tight whitespace-nowrap">
                    {(tab as any).shortName || tab.name}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* ======================================================== */}
      {/* ZAMAN SEÇİCİ VE YURDA GİRİŞ/ÇIKIŞ SAATİ MODALLARI */}
      {/* ======================================================== */}
      <MenuTimePickerModal
        isOpen={timePickerModal.isOpen}
        title={timePickerModal.title}
        startHour={timePickerModal.startHour}
        startMinute={timePickerModal.startMinute}
        endHour={timePickerModal.endHour}
        endMinute={timePickerModal.endMinute}
        onStartHourChange={(h) => setTimePickerModal((p) => ({ ...p, startHour: h }))}
        onStartMinuteChange={(m) => setTimePickerModal((p) => ({ ...p, startMinute: m }))}
        onEndHourChange={(h) => setTimePickerModal((p) => ({ ...p, endHour: h }))}
        onEndMinuteChange={(m) => setTimePickerModal((p) => ({ ...p, endMinute: m }))}
        onClose={() => setTimePickerModal((prev) => ({ ...prev, isOpen: false }))}
        onSave={handleApplyTimePicker}
      />

      <EntryTimeModal
        isOpen={entryTimeModal.isOpen}
        title={entryTimeModal.title}
        hour={entryTimeModal.hour}
        minute={entryTimeModal.minute}
        onHourChange={(h) => setEntryTimeModal((p) => ({ ...p, hour: h }))}
        onMinuteChange={(m) => setEntryTimeModal((p) => ({ ...p, minute: m }))}
        onClose={() => setEntryTimeModal((prev) => ({ ...prev, isOpen: false }))}
        onSave={handleApplyEntryTime}
      />
    </div>
  );
}
