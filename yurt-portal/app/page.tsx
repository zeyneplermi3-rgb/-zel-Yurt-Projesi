"use client";

import { useState, useEffect } from "react";
import { createClient } from "../lib/supabaseClient";

type Role = "superadmin" | "yonetici" | "ogrenci";

interface Yurt {
  id: string;
  ad: string;
  sehir: string;
  ilce: string;
  adres?: string;
  kapasite: number;
  mevcutOgrenci: number;
  yetkiliAd: string;
  yetkiliTel: string;
  yetkiliEposta: string;
  durum: "aktif" | "askida" | "deneme";
  yurtTuru: string;
  kayitTarihi: string;
}

export interface Student {
  id: string;
  adSoyad: string;
  telefon: string;
  eposta: string;
  odaNo: string;
  yatakNo: string;
  veliAd: string;
  veliTel: string;
  kayitTarihi: string;
}

export interface Room {
  id: string;
  odaNo: string;
  blok: string;
  kat: number;
  kapasite: number;
  doluYatak: number;
  odaTipi: string;
  durum: "Aktif" | "Bakımda";
}

export interface MaintenanceTicket {
  id: string;
  odaNo: string;
  baslik: string;
  kategori: "Tesisat" | "Elektrik" | "İnternet" | "Mobilya" | "Diğer";
  oncelik: "Düşük" | "Orta" | "Acil";
  durum: "Açık" | "İnceleniyor" | "Çözüldü";
  bildiren: string;
  tarih: string;
}

export interface Announcement {
  id: string;
  baslik: string;
  icerik: string;
  oncelik: "Normal" | "Önemli" | "Acil";
  tarih: string;
}

export interface LaundrySlot {
  id: string;
  ogrenciAd: string;
  odaNo: string;
  makineNo: string; // "Makine 1 (A-1)", "Makine 2 (A-2)", "Makine 3 (B-1)", "Makine 4 (B-2)", "Kurutma 1 (K-1)", "Kurutma 2 (K-2)"
  tarih: string; // YYYY-MM-DD
  saatAraligi: string; // "09:00 - 10:30", "10:30 - 12:00", "13:00 - 14:30", "15:00 - 16:30", "17:00 - 18:30", "19:00 - 20:30", "20:30 - 22:00"
  program: "Renkli & Karışık" | "Beyazlar & Pamuklu" | "Hızlı Yıkama (30 dk)" | "Kurutma & Havalandırma";
  durum: "Yıkanıyor" | "Sırada" | "Tamamlandı" | "İptal";
  not?: string;
}

export interface LaundryMachine {
  id: string;
  name: string;
  tip: string;
  tur: "yikama" | "kurutma";
  kapasiteKg?: number;
}


export default function Home() {
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<{
    role: Role;
    name: string;
    details: string;
    selectedYurtId?: string;
    selectedYurtName?: string;
  } | null>(null);

  const [activeRole, setActiveRole] = useState<Role>("superadmin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Veritabanı ve Realtime Durumu
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);
  const [realtimeActive, setRealtimeActive] = useState<boolean>(false);

  // Yurtlar: Yalnızca veritabanındaki gerçek verileri tutar (başlangıçta boştur)
  const [yurtlar, setYurtlar] = useState<Yurt[]>([]);

  // ==========================================
  // YÖNETİCİ PANELİ STATE & VERİLERİ
  // ==========================================
  const [managerTab, setManagerTab] = useState<
    "odalar" | "ogrenciler" | "yemekhane" | "camasirhane" | "arizalar" | "duyurular" | "ayarlar"
  >("odalar");

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
  const [selectedLaundryDate, setSelectedLaundryDate] = useState<string>("2026-10-19");
  const [laundryMachineFilter, setLaundryMachineFilter] = useState<string>("all");
  const [isAddLaundryModalOpen, setIsAddLaundryModalOpen] = useState(false);
  const [newLaundry, setNewLaundry] = useState({
    ogrenciAd: "",
    odaNo: "101",
    makineNo: "Makine 1 (A-1)",
    tarih: "2026-10-19",
    saatAraligi: "09:00 - 10:30",
    program: "Renkli & Karışık" as "Renkli & Karışık" | "Beyazlar & Pamuklu" | "Hızlı Yıkama (30 dk)" | "Kurutma & Havalandırma",
    durum: "Sırada" as "Yıkanıyor" | "Sırada" | "Tamamlandı",
    not: "",
  });

  const [isManageMachinesModalOpen, setIsManageMachinesModalOpen] = useState(false);
  const [laundryMachines, setLaundryMachines] = useState<LaundryMachine[]>([
    { id: "Makine 1 (A-1)", name: "Makine 1 (A Blok)", tip: "Yıkama • 9 kg", tur: "yikama", kapasiteKg: 9 },
    { id: "Makine 2 (A-2)", name: "Makine 2 (A Blok)", tip: "Yıkama • 9 kg", tur: "yikama", kapasiteKg: 9 },
    { id: "Makine 3 (B-1)", name: "Makine 3 (B Blok)", tip: "Yıkama • 8 kg", tur: "yikama", kapasiteKg: 8 },
    { id: "Makine 4 (B-2)", name: "Makine 4 (B Blok)", tip: "Yıkama • 8 kg", tur: "yikama", kapasiteKg: 8 },
    { id: "Kurutma 1 (K-1)", name: "Kurutma 1 (Merkez)", tip: "Kurutma • 10 kg", tur: "kurutma", kapasiteKg: 10 },
    { id: "Kurutma 2 (K-2)", name: "Kurutma 2 (Merkez)", tip: "Kurutma • 10 kg", tur: "kurutma", kapasiteKg: 10 },
  ]);
  const [newCustomMachine, setNewCustomMachine] = useState({
    name: "",
    tur: "yikama" as "yikama" | "kurutma",
    kapasiteKg: 9,
    blok: "A Blok",
  });

  const [isAddMaintenanceModalOpen, setIsAddMaintenanceModalOpen] = useState(false);
  const [isAddAnnouncementModalOpen, setIsAddAnnouncementModalOpen] = useState(false);

  // Form State'leri
  const [newStudent, setNewStudent] = useState({
    adSoyad: "",
    telefon: "",
    eposta: "",
    odaNo: "101",
    yatakNo: "1",
    veliAd: "",
    veliTel: "",
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
  const [dailyMenu, setDailyMenu] = useState<{
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
  }>({
    gorunumModu: "tek",
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
  });
  const [isEditingMenu, setIsEditingMenu] = useState(false);

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

  // Yurt Bilgileri ve Ayarları (Yönetici doğrudan değiştirebilir)
  const [yurtSettings, setYurtSettings] = useState({
    ad: "Güneş Yükseköğrenim Kız Öğrenci Yurdu",
    sehir: "İstanbul",
    ilce: "Kadıköy",
    adres: "Moda Cad. No: 42, Kadıköy / İstanbul",
    yetkiliAd: "Fatma Güneş (Yurt Müdürü)",
    yetkiliTel: "0532 999 88 77",
    kapasite: 150,
    sonGirisHaftaIci: "23:00",
    sonGirisHaftaSonu: "23:45",
  });

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
        const savedSession = localStorage.getItem("yurtify_session");
        if (savedSession) {
          const parsedUser = JSON.parse(savedSession);
          if (parsedUser && parsedUser.role) {
            setCurrentUser(parsedUser);
          }
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
        const savedStudents = localStorage.getItem("yurtify_students");
        if (savedStudents) {
          setStudents(JSON.parse(savedStudents));
        } else {
          const defaultStudents: Student[] = [
            {
              id: "std-1",
              adSoyad: "Zeynep Lermi",
              telefon: "0532 555 1020",
              eposta: "zeynep.lermi@gmail.com",
              odaNo: "305",
              yatakNo: "1",
              veliAd: "Kemal Lermi (Baba)",
              veliTel: "0532 444 3322",
              kayitTarihi: "15.09.2026",
            },
            {
              id: "std-2",
              adSoyad: "Elif Yıldız",
              telefon: "0541 333 4455",
              eposta: "elif.yildiz@hotmail.com",
              odaNo: "305",
              yatakNo: "2",
              veliAd: "Ayten Yıldız (Anne)",
              veliTel: "0541 999 8877",
              kayitTarihi: "16.09.2026",
            },
            {
              id: "std-3",
              adSoyad: "Ayşe Demir",
              telefon: "0555 222 1100",
              eposta: "ayse.demir@gmail.com",
              odaNo: "201",
              yatakNo: "1",
              veliAd: "Mehmet Demir (Baba)",
              veliTel: "0555 111 2233",
              kayitTarihi: "10.09.2026",
            },
            {
              id: "std-4",
              adSoyad: "Merve Kaya",
              telefon: "0505 777 8899",
              eposta: "merve.kaya@gmail.com",
              odaNo: "104",
              yatakNo: "1",
              veliAd: "Fatma Kaya (Anne)",
              veliTel: "0505 666 5544",
              kayitTarihi: "18.09.2026",
            },
            {
              id: "std-5",
              adSoyad: "Selin Çelik",
              telefon: "0533 888 9900",
              eposta: "selin.celik@outlook.com",
              odaNo: "202",
              yatakNo: "2",
              veliAd: "Hülya Çelik (Anne)",
              veliTel: "0533 777 6655",
              kayitTarihi: "20.09.2026",
            },
          ];
          setStudents(defaultStudents);
          localStorage.setItem("yurtify_students", JSON.stringify(defaultStudents));
        }

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

        const savedLaundry = localStorage.getItem("yurtify_laundry");
        if (savedLaundry) {
          setLaundrySlots(JSON.parse(savedLaundry));
        } else {
          const defaultLaundry: LaundrySlot[] = [
            {
              id: "lnd-1",
              ogrenciAd: "Zeynep Lermi",
              odaNo: "305",
              makineNo: "Makine 1 (A-1)",
              tarih: "2026-10-19",
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
              tarih: "2026-10-19",
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
              tarih: "2026-10-19",
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
              tarih: "2026-10-19",
              saatAraligi: "15:00 - 16:30",
              program: "Hızlı Yıkama (30 dk)",
              durum: "Sırada",
            },
            {
              id: "lnd-5",
              ogrenciAd: "Elif Yılmaz",
              odaNo: "101",
              makineNo: "Makine 1 (A-1)",
              tarih: "2026-10-19",
              saatAraligi: "17:00 - 18:30",
              program: "Renkli & Karışık",
              durum: "Sırada",
            },
            {
              id: "lnd-6",
              ogrenciAd: "Selin Şahin",
              odaNo: "306",
              makineNo: "Makine 2 (A-2)",
              tarih: "2026-10-20",
              saatAraligi: "11:00 - 12:30",
              program: "Renkli & Karışık",
              durum: "Sırada",
            },
            {
              id: "lnd-7",
              ogrenciAd: "Zeynep Lermi",
              odaNo: "305",
              makineNo: "Kurutma 2 (K-2)",
              tarih: "2026-10-20",
              saatAraligi: "14:00 - 15:30",
              program: "Kurutma & Havalandırma",
              durum: "Sırada",
            }
          ];
          setLaundrySlots(defaultLaundry);
          localStorage.setItem("yurtify_laundry", JSON.stringify(defaultLaundry));
        }

        const savedMachines = localStorage.getItem("yurtify_laundry_machines");
        if (savedMachines) {
          try {
            setLaundryMachines(JSON.parse(savedMachines));
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
            { id: "anc-1", baslik: "Giriş ve Turnike Saatleri Hatırlatması", icerik: "Hafta içi son giriş saati 23:00, hafta sonu ise 23:45'tir. Tüm öğrencilerin yoklama saatinde odalarında bulunması zorunludur.", oncelik: "Önemli", tarih: "18.10.2026" },
            { id: "anc-2", baslik: "Haftalık Çamaşırhane & Ütü Odası Programı", icerik: "B Blok kat sakinleri için çamaşırhane Salı ve Cuma günleri 09:00 - 21:00 arası rezerve edilmiştir.", oncelik: "Normal", tarih: "17.10.2026" },
            { id: "anc-3", baslik: "Merkezi Isıtma & Sıcak Su Saatleri", icerik: "Kış tarifesi gereği kaloriferler sabah 06:00-09:00 ve akşam 17:00-24:00 saatleri arasında kesintisiz devrededir.", oncelik: "Normal", tarih: "15.10.2026" }
          ];
          setAnnouncements(defaultAnc);
          localStorage.setItem("yurtify_announcements", JSON.stringify(defaultAnc));
        }

        const savedMenu = localStorage.getItem("yurtify_menu");
        if (savedMenu) {
          try {
            const parsedMenu = JSON.parse(savedMenu);
            setDailyMenu((prev) => ({ ...prev, ...parsedMenu }));
          } catch (e) {
            console.error("Menu parse error:", e);
          }
        }
      } catch (e) {
        console.error("Local storage error:", e);
      }
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
  // 2. GİRİŞ & OTURUM İŞLEMİ (SUPABASE AUTH & KALICI OTURUM)
  // ========================================================
  const loginUserDirect = (role: Role, customName?: string, customDetails?: string) => {
    const selectedYurt = yurtlar[0] || {
      id: "1",
      ad: "Güneş Yükseköğrenim Kız Öğrenci Yurdu",
    };

    let userObj: any = null;
    if (role === "superadmin") {
      userObj = {
        role: "superadmin",
        name: customName || "Süper Admin (Sistem Yöneticisi)",
        details: customDetails || "superadmin@yurtify.com",
        selectedYurtId: selectedYurt.id,
        selectedYurtName: selectedYurt.ad,
      };
    } else if (role === "yonetici") {
      userObj = {
        role: "yonetici",
        name: customName || "Fatma Güneş (Yurt Müdürü)",
        details: customDetails || "mudur@gunesyurdu.com",
        selectedYurtId: selectedYurt.id,
        selectedYurtName: selectedYurt.ad,
      };
    } else {
      userObj = {
        role: "ogrenci",
        name: customName || "Zeynep Lermi",
        details: customDetails || "Öğrenci No: 2026105 • B Blok - Oda 305",
        selectedYurtId: selectedYurt.id,
        selectedYurtName: selectedYurt.ad,
      };
    }

    setCurrentUser(userObj);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_session", JSON.stringify(userObj));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Lütfen tüm alanları doldurunuz.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      if (activeRole === "superadmin" || activeRole === "yonetici") {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: username.trim(),
            password: password.trim(),
          });

          if (!error && data?.user) {
            const fullName =
              data.user.user_metadata?.full_name ||
              (activeRole === "superadmin" ? "Sistem Sahibi (Süper Admin)" : "Yurt Müdürü (Fatma Güneş)");
            loginUserDirect(activeRole, fullName, `Supabase Doğrulandı (${data.user.email})`);
            return;
          }
        } catch (authErr) {
          console.warn("Supabase auth uyarısı (Demo moduna geçiliyor):", authErr);
        }

        // Demo veya veritabanı dışı girişler için her durumda girişi sağla
        loginUserDirect(activeRole, activeRole === "superadmin" ? "Süper Admin" : "Yurt Müdürü (Fatma Güneş)", username.trim());
      } else {
        loginUserDirect("ogrenci", "Zeynep Lermi", `Öğrenci No: 2026105 • ${username.trim()}`);
      }
    } catch (err: any) {
      console.error("Giriş hatası:", err);
      // Hata durumunda bile demo girişi tamamla
      loginUserDirect(activeRole);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (role: Role) => {
    setActiveRole(role);
    setErrorMessage("");
    if (role === "superadmin") {
      setUsername("superadmin@yurtify.com");
      setPassword("admin123456");
    } else if (role === "yonetici") {
      setUsername("mudur@gunesyurdu.com");
      setPassword("mudur123456");
    } else {
      setUsername("zeynep.lermi@gmail.com");
      setPassword("ogrenci123");
    }
  };

  const handleQuickLogin = (role: Role) => {
    fillDemoCredentials(role);
    loginUserDirect(role);
  };

  // Çıkış Yap: Hem React state'i hem LocalStorage'ı hem Supabase oturumunu temizler
  const handleLogout = async () => {
    setCurrentUser(null);
    setUsername("");
    setPassword("");
    setErrorMessage("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("yurtify_session");
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
    showToast(`⏳ "${newYurt.ad}" veritabanına ekleniyor...`);

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

    const createdSlot: LaundrySlot = {
      id: `lnd-${Date.now()}`,
      ogrenciAd: newLaundry.ogrenciAd.trim(),
      odaNo: newLaundry.odaNo.trim(),
      makineNo: newLaundry.makineNo,
      tarih: newLaundry.tarih,
      saatAraligi: newLaundry.saatAraligi,
      program: newLaundry.program,
      durum: newLaundry.durum,
      not: newLaundry.not?.trim() || undefined,
    };

    const updated = [createdSlot, ...laundrySlots];
    setLaundrySlots(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_laundry", JSON.stringify(updated));
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
    const updated = laundrySlots.map((s) => (s.id === id ? { ...s, durum: newStatus } : s));
    setLaundrySlots(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_laundry", JSON.stringify(updated));
    }
    showToast(`Çamaşır durumu güncellendi: ${newStatus}`);
  };

  const handleDeleteLaundry = (id: string) => {
    const updated = laundrySlots.filter((s) => s.id !== id);
    setLaundrySlots(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_laundry", JSON.stringify(updated));
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

    const id = `${newCustomMachine.name.trim()} (${newCustomMachine.blok})`;
    const createdMachine: LaundryMachine = {
      id,
      name: `${newCustomMachine.name.trim()} (${newCustomMachine.blok})`,
      tip: `${newCustomMachine.tur === "kurutma" ? "Kurutma" : "Yıkama"} • ${newCustomMachine.kapasiteKg} kg`,
      tur: newCustomMachine.tur,
      kapasiteKg: newCustomMachine.kapasiteKg,
    };

    const updated = [...laundryMachines, createdMachine];
    setLaundryMachines(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_laundry_machines", JSON.stringify(updated));
    }
    setNewCustomMachine({ name: "", tur: "yikama", kapasiteKg: 9, blok: "A Blok" });
    showToast(`"${createdMachine.name}" çamaşırhaneye eklendi!`);
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
    if (!newStudent.adSoyad.trim() || !newStudent.telefon.trim()) {
      showToast("Lütfen öğrenci adı ve telefon bilgilerini eksiksiz giriniz.");
      return;
    }

    const createdStudent: Student = {
      id: "std-" + Date.now(),
      adSoyad: newStudent.adSoyad.trim(),
      telefon: newStudent.telefon.trim(),
      eposta: newStudent.eposta.trim() || `${newStudent.adSoyad.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      odaNo: newStudent.odaNo,
      yatakNo: newStudent.yatakNo,
      veliAd: newStudent.veliAd.trim() || "Veli",
      veliTel: newStudent.veliTel.trim() || newStudent.telefon.trim(),
      kayitTarihi: new Date().toLocaleDateString("tr-TR"),
    };

    const updatedStudents = [createdStudent, ...students];
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
      telefon: "",
      eposta: "",
      odaNo: "101",
      yatakNo: "1",
      veliAd: "",
      veliTel: "",
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
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_menu", JSON.stringify(dailyMenu));
    }
    showToast(" Günün yemek menüsü güncellendi ve öğrencilere yayınlandı!");
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

  const handleToggleCalories = () => {
    const nextVal = !dailyMenu.kaloriGoster;
    const updated = { ...dailyMenu, kaloriGoster: nextVal };
    setDailyMenu(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_menu", JSON.stringify(updated));
    }
    showToast(nextVal ? "Kalori gösterimi açıldı." : "Kalori gösterimi kapatıldı.");
  };

  const handleToggleActiveMeal = (meal: "kahvalti" | "aksam") => {
    const updated = { ...dailyMenu, aktifOgun: meal };
    setDailyMenu(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_menu", JSON.stringify(updated));
    }
    showToast(` Tek öğün modunda "${meal === "kahvalti" ? "Sabah Kahvaltısı" : "Akşam Yemeği"}" seçildi!`);
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
      if (!isNaN(m)) sM = Math.min(59, Math.max(0, m));
    }
    if (parts.length >= 2 && parts[1].includes(":")) {
      const [h, m] = parts[1].split(":").map((v) => parseInt(v, 10));
      if (!isNaN(h)) eH = Math.min(23, Math.max(0, h));
      if (!isNaN(m)) eM = Math.min(59, Math.max(0, m));
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

  const handleSaveYurtSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("yurtify_settings", JSON.stringify(yurtSettings));
    }
    showToast("Yurt kurumsal ve operasyonel ayarları kaydedildi!");
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
  // GİRİŞ KAPISI
  // ==========================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#3D110B] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
        
        {/* Canlı Realtime & DB Durum Rozeti */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-white border border-[#E8DCCF] px-3.5 py-1.5 rounded-full text-[11px]">
          <span
            className={`w-2 h-2 rounded-full ${
              realtimeActive ? "bg-[#D1841A] animate-pulse" : "bg-[#99501B]"
            }`}
          ></span>
          <span className="text-[#662B16] font-medium">
            {realtimeActive ? "Supabase Realtime: Aktif" : "Sistem Hazır & Eşzamanlı"}
          </span>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-6">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-[#3D110B] border border-[#662B16] items-center justify-center text-[#FFC90C] font-black text-2xl mb-3">
              Y
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#3D110B]">Yurtify • Çoklu Yurt Portalı</h1>
            <p className="text-xs text-[#855342] mt-1 font-medium">
              Güvenli kimlik doğrulama ve modern yurt yönetim altyapısı
            </p>
          </div>

          <div className="bg-white border border-[#E8DCCF] rounded-3xl p-6 sm:p-7">
            <div className="flex bg-[#F4ECE1] p-1.5 rounded-2xl mb-6 border border-[#E8DCCF] text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveRole("superadmin");
                  setErrorMessage("");
                  fillDemoCredentials("superadmin");
                }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  activeRole === "superadmin"
                    ? "bg-[#3D110B] text-[#FFC90C]"
                    : "text-[#662B16] hover:text-[#3D110B]"
                }`}
              >
                Süper Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveRole("yonetici");
                  setErrorMessage("");
                  fillDemoCredentials("yonetici");
                }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  activeRole === "yonetici"
                    ? "bg-[#3D110B] text-[#FFC90C]"
                    : "text-[#662B16] hover:text-[#3D110B]"
                }`}
              >
                Yurt Müdürü
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveRole("ogrenci");
                  setErrorMessage("");
                  fillDemoCredentials("ogrenci");
                }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  activeRole === "ogrenci"
                    ? "bg-[#3D110B] text-[#FFC90C]"
                    : "text-[#662B16] hover:text-[#3D110B]"
                }`}
              >
                Öğrenci
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#662B16] mb-1.5">
                  {activeRole === "superadmin"
                    ? "Süper Admin E-posta"
                    : activeRole === "yonetici"
                    ? "Yurt Yöneticisi E-posta"
                    : "Öğrenci E-posta / No"}
                </label>
                <input
                  type="text"
                  placeholder={
                    activeRole === "superadmin"
                      ? "superadmin@yurtify.com"
                      : activeRole === "yonetici"
                      ? "mudur@gunesyurdu.com"
                      : "zeynep.lermi@gmail.com"
                  }
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8DCCF] rounded-xl px-4 py-3 text-sm text-[#3D110B] placeholder-[#B8998C] focus:outline-none focus:border-[#D1841A] focus:ring-2 focus:ring-[#FFC90C]/25 transition-all font-mono font-medium"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-[#662B16]">Şifre</label>
                  <span className="text-[11px] text-[#99501B] hover:text-[#3D110B] hover:underline cursor-pointer font-medium">
                    Şifremi Unuttum
                  </span>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8DCCF] rounded-xl px-4 py-3 text-sm text-[#3D110B] placeholder-[#B8998C] focus:outline-none focus:border-[#D1841A] focus:ring-2 focus:ring-[#FFC90C]/25 transition-all font-mono font-medium"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#FFC90C] hover:bg-[#D1841A] text-[#3D110B] hover:text-white font-black rounded-xl transition-colors cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed border border-[#E5B409] hover:border-[#BA7313]"
              >
                {isLoading
                  ? "Giriş Yapılıyor..."
                  : activeRole === "superadmin"
                  ? "Süper Admin Paneline Giriş Yap"
                  : activeRole === "yonetici"
                  ? "Yurt Yönetim Paneline Giriş Yap"
                  : "Öğrenci Portalı Girişi Yap"}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-[#E8DCCF] text-center space-y-2">
              <p className="text-[11px] text-[#855342] font-semibold">Hızlı Test İçin Tek Tıkla Giriş Yap:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin("superadmin")}
                  className="py-2.5 px-2 rounded-xl bg-[#F4ECE1] hover:bg-[#3D110B] text-xs font-bold text-[#3D110B] hover:text-[#FFC90C] border border-[#E8DCCF] cursor-pointer transition-colors"
                >
                  Süper Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("yonetici")}
                  className="py-2.5 px-2 rounded-xl bg-[#F4ECE1] hover:bg-[#3D110B] text-xs font-bold text-[#3D110B] hover:text-[#FFC90C] border border-[#E8DCCF] cursor-pointer transition-colors"
                >
                  Yurt Müdürü
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin("ogrenci")}
                  className="py-2.5 px-2 rounded-xl bg-[#F4ECE1] hover:bg-[#3D110B] text-xs font-bold text-[#3D110B] hover:text-[#FFC90C] border border-[#E8DCCF] cursor-pointer transition-colors"
                >
                  Öğrenci
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // PANELLER (DASHBOARD)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#3D110B] flex flex-col font-sans">
      {/* Toast Bildirimi */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-[#3D110B] text-[#FFC90C] text-xs font-bold px-4 py-2.5 rounded-xl border border-[#662B16] shadow-none animate-bounce">
          {notification}
        </div>
      )}

      {/* Üst Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E8DCCF] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#3D110B] text-[#FFC90C] font-black text-lg border border-[#662B16]">
            Y
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-[#3D110B]">Yurtify Platformu</span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  currentUser.role === "superadmin"
                    ? "bg-[#3D110B] text-[#FFC90C] border border-[#662B16]"
                    : currentUser.role === "yonetici"
                    ? "bg-[#F4ECE1] text-[#3D110B] border border-[#D1841A]/50"
                    : "bg-[#99501B]/15 text-[#99501B] border border-[#99501B]/30"
                }`}
              >
                {currentUser.role === "superadmin"
                  ? "Süper Admin"
                  : currentUser.role === "yonetici"
                  ? "Yurt Müdürü"
                  : "Öğrenci Portalı"}
              </span>

              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-[#F4ECE1] text-[#662B16] border border-[#E8DCCF]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D1841A] animate-pulse"></span>
                Senkronize
              </span>
            </div>
            <p className="text-xs text-[#855342] font-medium">{currentUser.details}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentUser.name.includes("Süper Admin") && currentUser.role === "yonetici" && (
            <button
              onClick={() =>
                setCurrentUser({
                  role: "superadmin",
                  name: "Sistem Sahibi (Süper Admin)",
                  details: "Platform Yöneticisi • Tüm Yurtlar & Lisans Yönetimi",
                })
              }
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#3D110B] hover:bg-[#662B16] text-[#FFC90C] border border-[#662B16] transition-colors cursor-pointer"
            >
              ← Süper Admin Paneline Dön
            </button>
          )}

          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
          >
            Çıkış Yap
          </button>
        </div>
      </header>

      {/* Ana Gövde */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* ========================================================= */}
        {/* A. SÜPER ADMİN PANELİ */}
        {/* ========================================================= */}
        {currentUser.role === "superadmin" && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-[#E8DCCF] p-6 sm:p-8 rounded-3xl">
              <div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#3D110B] text-[#FFC90C] border border-[#662B16]">
                  Platform Yönetim Merkezi
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#3D110B] mt-2">
                  Yurtlar ve Şubeler Yönetim Merkezi
                </h2>
                <p className="text-[#855342] text-sm mt-1">
                  Eklediğiniz veya güncellediğiniz tüm yurtlar anında sisteme kaydedilir ve listede yerini alır.
                </p>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-[#FFC90C] hover:bg-[#D1841A] text-[#3D110B] hover:text-white font-black text-sm flex items-center gap-2 cursor-pointer transition-colors border border-[#E5B409]"
              >
                + Yeni Yurt Ekle
              </button>
            </div>

            {/* İstatistikler (Flat 5-Color Tones) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#E8DCCF] border-t-4 border-t-[#3D110B]">
                <div className="text-xs font-semibold text-[#855342]">Kayıtlı Yurt Sayısı</div>
                <div className="text-3xl font-black text-[#3D110B] mt-1">{yurtlar.length}</div>
                <div className="text-[11px] font-bold text-[#99501B] mt-1">{activeYurtlar} Yurt Aktif Hizmette</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E8DCCF] border-t-4 border-t-[#662B16]">
                <div className="text-xs font-semibold text-[#855342]">Toplam Yatak Kapasitesi</div>
                <div className="text-3xl font-black text-[#662B16] mt-1">{totalKapasite}</div>
                <div className="text-[11px] text-[#855342] mt-1">Tüm yurtlar toplamı</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E8DCCF] border-t-4 border-t-[#99501B]">
                <div className="text-xs font-semibold text-[#855342]">Barınan Toplam Öğrenci</div>
                <div className="text-3xl font-black text-[#99501B] mt-1">{totalOgrenci}</div>
                <div className="text-[11px] font-bold text-[#D1841A] mt-1">
                  Ortalama Doluluk: %{totalKapasite > 0 ? Math.round((totalOgrenci / totalKapasite) * 100) : 0}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E8DCCF] border-t-4 border-t-[#D1841A]">
                <div className="text-xs font-semibold text-[#855342]">Toplam Boş Yatak</div>
                <div className="text-3xl font-black text-[#D1841A] mt-1">{Math.max(0, totalKapasite - totalOgrenci)}</div>
                <div className="text-[11px] font-bold text-[#662B16] mt-1">Kayıt Alınabilir Kontenjan</div>
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
                  className="w-full bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-300/20"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="bg-yellow-50 border border-yellow-300 rounded-xl px-3 py-2 text-xs text-stone-600 focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-300/20"
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
            <div className="bg-white rounded-3xl border border-yellow-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-yellow-50 text-stone-500 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Yurt Adı & Lokasyon</th>
                      <th className="p-4">Yetkili / İletişim</th>
                      <th className="p-4">Kapasite & Doluluk</th>
                      <th className="p-4">Yurt Türü & Durum</th>
                      <th className="p-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-200/60">
                    {filteredYurtlar.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-stone-500">
                          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-purple-950/40 border border-purple-800/50 flex items-center justify-center text-2xl shadow-inner">
                            
                          </div>
                          <p className="font-bold text-sm text-stone-900">Henüz Kayıtlı Yurt Bulunmuyor</p>
                          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                            Veritabanınız tamamen temiz. İlk yurdunuzu tanımlamak için yukarıdaki <strong>&ldquo;Yeni Yurt Ekle&rdquo;</strong> butonunu kullanabilirsiniz.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredYurtlar.map((yurt) => {
                      const fillRate = yurt.kapasite > 0 ? Math.round((yurt.mevcutOgrenci / yurt.kapasite) * 100) : 0;
                      return (
                        <tr key={yurt.id} className="hover:bg-yellow-100/40 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-stone-800 text-sm">{yurt.ad}</div>
                            <div className="text-stone-500 text-[11px] flex items-center gap-1 mt-0.5">
                              {yurt.sehir} / {yurt.ilce}
                            </div>
                            <div className="text-[10px] text-slate-500">Kayıt: {yurt.kayitTarihi}</div>
                          </td>

                          <td className="p-4">
                            <div className="font-medium text-stone-700">{yurt.yetkiliAd}</div>
                            <div className="text-stone-500 text-[11px] font-mono">{yurt.yetkiliTel}</div>
                            <div className="text-purple-400 text-[11px]">{yurt.yetkiliEposta}</div>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-800">
                                {yurt.mevcutOgrenci} / {yurt.kapasite}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-semibold">
                                (%{fillRate})
                              </span>
                            </div>
                            <div className="w-32 bg-yellow-50 h-1.5 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className={`h-full ${
                                  fillRate > 80
                                    ? "bg-emerald-500"
                                    : fillRate > 50
                                    ? "bg-sky-500"
                                    : "bg-yellow-500"
                                }`}
                                style={{ width: `${fillRate}%` }}
                              ></div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="inline-block text-[11px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 rounded-md mb-1">
                              {yurt.yurtTuru}
                            </span>
                            <div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  yurt.durum === "aktif"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : yurt.durum === "deneme"
                                    ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
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

                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() =>
                                setCurrentUser({
                                  role: "yonetici",
                                  name: `${yurt.yetkiliAd} (Süper Admin)`,
                                  details: `Yurt Müdürü • ${yurt.ad}`,
                                  selectedYurtId: yurt.id,
                                  selectedYurtName: yurt.ad,
                                  })
                              }
                              className="px-2.5 py-1.5 bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                            >
                              Paneline Geç
                            </button>

                            <button
                              onClick={() => toggleYurtStatus(yurt.id, yurt.durum)}
                              className="px-2 py-1.5 bg-yellow-100/70 hover:bg-yellow-100 text-stone-600 rounded-lg text-[11px] transition-colors cursor-pointer border border-yellow-300"
                            >
                              {yurt.durum === "aktif" ? "Askıya Al" : "Aktifleştir"}
                            </button>

                            <button
                              onClick={() => deleteYurt(yurt.id, yurt.ad)}
                              className="px-2 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-lg text-[11px] transition-colors cursor-pointer border border-rose-800/40"
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
            {isAddModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 ">
                <div className="bg-white border border-yellow-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-sm space-y-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center pb-4 border-b border-yellow-200">
                    <div>
                      <h3 className="text-xl font-bold text-stone-900">Yeni Yurt Kaydı Ekle</h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Yurt işletmesini sisteme tanımlayın
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAddModalOpen(false)}
                      className="text-stone-600 hover:text-stone-950 text-xl p-1 cursor-pointer"
                    >
                      
                    </button>
                  </div>

                  <form onSubmit={handleCreateYurt} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-stone-600 mb-1">
                        Yurt Tam Adı <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: Kadıköy Yükseköğrenim Kız Yurdu"
                        value={newYurt.ad}
                        onChange={(e) => setNewYurt({ ...newYurt, ad: e.target.value })}
                        className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-stone-900 bg-white placeholder-stone-400 focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-300/20"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-stone-600 mb-1">Şehir</label>
                        <select
                          value={newYurt.sehir}
                          onChange={(e) => setNewYurt({ ...newYurt, sehir: e.target.value })}
                          className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-stone-900 bg-white focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-300/20"
                        >
                          <option value="İstanbul">İstanbul</option>
                          <option value="Ankara">Ankara</option>
                          <option value="İzmir">İzmir</option>
                          <option value="Eskişehir">Eskişehir</option>
                          <option value="Bursa">Bursa</option>
                          <option value="Antalya">Antalya</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-stone-600 mb-1">İlçe</label>
                        <input
                          type="text"
                          placeholder="Örn: Kadıköy"
                          value={newYurt.ilce}
                          onChange={(e) => setNewYurt({ ...newYurt, ilce: e.target.value })}
                          className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-stone-900 bg-white placeholder-stone-400 focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-300/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-stone-600 mb-1">
                          Yatak Kapasitesi <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min={10}
                          max={5000}
                          value={newYurt.kapasite}
                          onChange={(e) =>
                            setNewYurt({ ...newYurt, kapasite: Number(e.target.value) })
                          }
                          className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-stone-900 bg-white focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-300/20"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-stone-600 mb-1">Yurt Türü</label>
                        <select
                          value={newYurt.yurtTuru}
                          onChange={(e) => setNewYurt({ ...newYurt, yurtTuru: e.target.value })}
                          className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-stone-900 bg-white focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-300/20"
                        >
                          <option value="Kız Öğrenci Yurdu">Kız Öğrenci Yurdu</option>
                          <option value="Erkek Öğrenci Yurdu">Erkek Öğrenci Yurdu</option>
                          <option value="Karma Öğrenci Rezidansı">Karma Öğrenci Rezidansı</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-yellow-200">
                      <p className="font-bold text-purple-400 mb-2">Yurt Yöneticisi / İletişim Bilgileri</p>
                      <div className="space-y-3">
                        <div>
                          <label className="block font-semibold text-stone-600 mb-1">
                            Yetkili Adı Soyadı <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Örn: Ayşe Demir"
                            value={newYurt.yetkiliAd}
                            onChange={(e) => setNewYurt({ ...newYurt, yetkiliAd: e.target.value })}
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-stone-900 bg-white placeholder-stone-400 focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-300/20"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-stone-600 mb-1">Telefon</label>
                            <input
                              type="tel"
                              placeholder="05XX XXX XX XX"
                              value={newYurt.yetkiliTel}
                              onChange={(e) => setNewYurt({ ...newYurt, yetkiliTel: e.target.value })}
                              className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-stone-900 bg-white placeholder-stone-400 focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-300/20 font-mono"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-stone-600 mb-1">
                              Yönetici E-posta <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="email"
                              required
                              placeholder="mudur@yurt.com"
                              value={newYurt.yetkiliEposta}
                              onChange={(e) =>
                                setNewYurt({ ...newYurt, yetkiliEposta: e.target.value })
                              }
                              className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-stone-900 bg-white placeholder-stone-400 focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-300/20"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-yellow-200">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="px-4 py-2.5 rounded-xl bg-yellow-100/70 hover:bg-yellow-100 text-stone-600 cursor-pointer"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold font-bold shadow-sm  cursor-pointer"
                      >
                        Yurdu Kaydet
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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
            return (
              s.adSoyad.toLowerCase().includes(studentSearch.toLowerCase()) ||
              s.odaNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
              s.telefon.includes(studentSearch)
            );
          });

          return (
            <div className="space-y-6">
              {/* 1. ÜST BAŞLIK VE HIZLI YÖNETİCİ AKSİYONLARI */}
              <div className="bg-white border border-[#E8DCCF] p-6 rounded-3xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#3D110B] text-[#FFC90C] border border-[#662B16]">
                      Yönetici & İdare Kontrol Merkezi
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F4ECE1] text-[#662B16] border border-[#E8DCCF] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D1841A] animate-pulse" /> Canlı Sistem
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-[#3D110B] mt-2">
                    {yurtSettings.ad}
                  </h2>
                  <p className="text-xs text-[#855342] mt-1 flex flex-wrap items-center gap-3">
                    <span>Müdür: <strong className="text-[#3D110B]">{yurtSettings.yetkiliAd}</strong></span>
                    <span>•</span>
                    <span>İletişim: <strong className="text-[#3D110B]">{yurtSettings.yetkiliTel}</strong></span>
                    <span>•</span>
                    <span>Adres: <strong className="text-[#3D110B]">{yurtSettings.adres}</strong></span>
                  </p>
                </div>
              </div>

              {/* 2. YÖNETİCİ MODÜL SEKMELERİ (Modern Flat Nav) */}
              <div className="flex items-center justify-start md:justify-center gap-1.5 p-1.5 bg-[#F4ECE1] border border-[#E8DCCF] rounded-2xl overflow-x-auto">
                {[
                  { id: "odalar", label: `Odalar & Yataklar (${rooms.length})` },
                  { id: "ogrenciler", label: `Öğrenci Kütüğü (${students.length})` },
                  { id: "yemekhane", label: "Yemekhane Menüsü" },
                  { id: "camasirhane", label: `Çamaşırhane Sırası (${laundrySlots.filter(s => s.tarih === selectedLaundryDate && s.durum !== "Tamamlandı" && s.durum !== "İptal").length})` },
                  { id: "arizalar", label: `Arıza & Bakım (${openTickets})` },
                  { id: "duyurular", label: `Duyurular (${announcements.length})` },
                  { id: "ayarlar", label: "Yurt Ayarları" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setManagerTab(tab.id as any)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      managerTab === tab.id
                        ? "bg-[#3D110B] text-[#FFC90C] border border-[#662B16]"
                        : "text-[#662B16] hover:text-[#3D110B] hover:bg-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sekme İçerikleri Konteyneri - Sekmeler arası geçişte ekran kaymasını önlemek için sabit taban yükseklik */}
              <div className="min-h-[600px] w-full space-y-6">
                {/* ======================================================== */}
                {/* MODÜL 2: ODA & YATAK YÖNETİMİ (TAM YETKİLİ) */}
                {/* ======================================================== */}
                {managerTab === "odalar" && (
                <div className="bg-white border border-yellow-200 p-6 rounded-3xl space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-stone-900">Oda ve Yatak Yönetim Merkezi</h3>
                      <p className="text-xs text-stone-500">
                        Yeni oda ekleyin, odaların yatak kapasitesini ve tiplerini düzenleyin, öğrencileri taşıyın.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsAddRoomModalOpen(true)}
                      className="px-4 py-2 bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold font-bold text-xs rounded-xl shadow cursor-pointer transition-all"
                    >
                      + Yeni Oda Oluştur
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
                                  isFull ? "bg-rose-500" : "bg-indigo-500"
                                }`}
                                style={{ width: `${Math.min(100, (room.doluYatak / (room.kapasite || 1)) * 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* YATAK VE ÖĞRENCİ DETAYI */}
                          <div className="pt-2 border-t border-yellow-200 space-y-2">
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
                                          <span className="text-[10px] text-stone-500">{studentInBed.telefon}</span>
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
              {/* MODÜL 3: ÖĞRENCİ KÜTÜĞÜ (TAM YETKİLİ) */}
              {/* ======================================================== */}
              {managerTab === "ogrenciler" && (
                <div className="bg-white border border-yellow-200 p-6 rounded-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-stone-900">Öğrenci Kütüğü & Bilgi Yönetimi</h3>
                      <p className="text-xs text-stone-500">
                        Öğrencilerin oda, veli ve iletişim bilgilerini istediğiniz zaman düzenleyin veya yeni öğrenci kaydedin.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Öğrenci, Oda ara..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="bg-yellow-50 border border-yellow-300 text-xs text-white rounded-xl px-3 py-2 w-full sm:w-48 focus:outline-none focus:border-yellow-300"
                      />

                      <button
                        onClick={() => setIsAddStudentModalOpen(true)}
                        className="px-4 py-2 bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold font-bold text-xs rounded-xl cursor-pointer transition-all"
                      >
                        + Yeni Öğrenci
                      </button>
                    </div>
                  </div>

                  {/* Öğrenci Tablosu */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-yellow-50 text-stone-500 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="p-3 rounded-l-xl">Öğrenci</th>
                          <th className="p-3">Oda / Yatak</th>
                          <th className="p-3">İletişim</th>
                          <th className="p-3">Veli Bilgisi</th>
                          <th className="p-3">Kayıt Tarihi</th>
                          <th className="p-3 rounded-r-xl text-right">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-200/60">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-stone-500">
                              Kayıtlı öğrenci bulunamadı.
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((std) => (
                            <tr key={std.id} className="hover:bg-yellow-100/40 transition-colors">
                              <td className="p-3">
                                <div className="font-bold text-stone-800 text-sm">{std.adSoyad}</div>
                              </td>
                              <td className="p-3">
                                <span className="px-2.5 py-1 rounded-lg bg-indigo-900/40 text-stone-800 font-medium font-bold border border-indigo-700/50">
                                  Oda {std.odaNo}
                                </span>
                                <span className="ml-1.5 text-stone-500">Yatak {std.yatakNo}</span>
                              </td>
                              <td className="p-3">
                                <div className="text-stone-700">{std.telefon}</div>
                                <div className="text-[11px] text-stone-500">{std.eposta}</div>
                              </td>
                              <td className="p-3">
                                <div className="text-stone-700 font-semibold">{std.veliAd}</div>
                                <div className="text-[11px] text-stone-800 font-medium">{std.veliTel}</div>
                              </td>
                              <td className="p-3 text-stone-600 font-medium">
                                {std.kayitTarihi}
                              </td>
                              <td className="p-3 text-right space-x-1.5">
                                <button
                                  onClick={() => setEditingStudent(std)}
                                  className="px-2.5 py-1 bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold font-bold rounded-lg text-[11px] cursor-pointer"
                                  title="Tüm bilgilerini ve oda/yatağını düzenle"
                                >
                                  Düzenle
                                </button>
                                <button
                                  onClick={() => setSelectedStudentForDetail(std)}
                                  className="px-2 py-1 bg-yellow-100/70 hover:bg-yellow-100 text-stone-600 rounded-lg text-[11px] cursor-pointer"
                                >
                                  Kart
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(std.id, std.adSoyad)}
                                  className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-[11px] cursor-pointer transition-all"
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

              {/* ======================================================== */}
              {/* MODÜL 5: YEMEKHANE MENÜSÜ & KALORİ YÖNETİMİ */}
              {/* ======================================================== */}
              {managerTab === "yemekhane" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Sol Kolon: Menü Ayar, Zaman ve Kalori Tercihleri Formu */}
                  <div className="bg-white border border-yellow-200 p-6 rounded-3xl space-y-5">
                    <div>
                      <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                         Yemekhane Menüsü & Ayarları
                      </h3>
                      <p className="text-xs text-stone-500 mt-1">
                        Günün kahvaltı ve akşam yemeklerini girin, servis saatleri ve gösterim tercihlerini belirleyin.
                      </p>
                    </div>

                    <form onSubmit={handleSaveMenu} className="space-y-5 text-xs">
                      {/* 1. BUGÜNÜN GEÇERLİ YEMEK SAATİ TARİFESİ SEÇİCİ */}
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl space-y-2.5">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1.5">
                          <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                             Bugünün Yemek Saati Tarifesi
                          </label>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-100 text-stone-800 border border-yellow-300 font-bold self-start sm:self-auto">
                            Geçerli: {dailyMenu.gunTipi === "haftasonu" ? "Hafta Sonu" : dailyMenu.gunTipi === "ozelgun" ? "Bayram / Özel Gün" : "Hafta İçi"}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 leading-relaxed">
                          Yemek saatleri bugün hangi tarifeye göre uygulansın? Tıklayarak anında değiştirebilirsiniz:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                          {/* 1. Hafta İçi Kartı */}
                          <div
                            onClick={() => handleToggleGunTipi("haftaici")}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                              dailyMenu.gunTipi === "haftaici" || !dailyMenu.gunTipi
                                ? "bg-yellow-100/70 border-2 border-yellow-300 shadow-sm"
                                : "bg-white border-yellow-200 hover:border-yellow-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                
                                <div>
                                  <div className="font-bold text-xs text-stone-800">Hafta İçi</div>
                                  <div className="text-[10px] text-stone-500">Pzt - Cuma</div>
                                </div>
                              </div>
                              {dailyMenu.gunTipi === "haftaici" || !dailyMenu.gunTipi ? (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-yellow-300 text-stone-900 border border-yellow-400">
                                   Geçerli
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleGunTipi("haftaici");
                                  }}
                                  className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-yellow-100 text-stone-700 hover:bg-yellow-300 hover:text-stone-900 transition-colors"
                                >
                                  Seç
                                </button>
                              )}
                            </div>

                            {/* Saat Ayarları Butonları */}
                            <div className="space-y-2 pt-2.5 border-t border-yellow-200" onClick={(e) => e.stopPropagation()}>
                              <div className="space-y-1">
                                <span className="text-[11px] font-semibold text-stone-700 block">
                                  Kahvaltı:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openTimePicker("haftaici", "kahvalti", "Hafta İçi • Sabah Kahvaltısı")}
                                  className="w-full py-1.5 px-2 bg-yellow-50 hover:bg-white border border-yellow-300 hover:border-yellow-400 rounded-xl text-xs text-stone-900 text-center font-mono font-bold whitespace-nowrap cursor-pointer transition-all shadow-sm hover:shadow"
                                  title="Saati çark ile kaydırarak seç"
                                >
                                  {formatDisplayHours(dailyMenu.saatler?.haftaici?.kahvalti || "07:30 - 10:00")}
                                </button>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[11px] font-semibold text-stone-700 block">
                                  Akşam:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openTimePicker("haftaici", "aksam", "Hafta İçi • Akşam Yemeği")}
                                  className="w-full py-1.5 px-2 bg-yellow-50 hover:bg-white border border-yellow-300 hover:border-yellow-400 rounded-xl text-xs text-stone-900 text-center font-mono font-bold whitespace-nowrap cursor-pointer transition-all shadow-sm hover:shadow"
                                  title="Saati çark ile kaydırarak seç"
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
                                ? "bg-yellow-100/70 border-2 border-yellow-300 shadow-sm"
                                : "bg-white border-yellow-200 hover:border-yellow-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                
                                <div>
                                  <div className="font-bold text-xs text-stone-800">Hafta Sonu</div>
                                  <div className="text-[10px] text-stone-500">Cmt - Pazar</div>
                                </div>
                              </div>
                              {dailyMenu.gunTipi === "haftasonu" ? (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-yellow-300 text-stone-900 border border-yellow-400">
                                   Geçerli
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleGunTipi("haftasonu");
                                  }}
                                  className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-yellow-100 text-stone-700 hover:bg-yellow-300 hover:text-stone-900 transition-colors"
                                >
                                  Seç
                                </button>
                              )}
                            </div>

                            {/* Saat Ayarları Butonları */}
                            <div className="space-y-2 pt-2.5 border-t border-yellow-200" onClick={(e) => e.stopPropagation()}>
                              <div className="space-y-1">
                                <span className="text-[11px] font-semibold text-stone-700 block">
                                  Kahvaltı:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openTimePicker("haftasonu", "kahvalti", "Hafta Sonu • Sabah Kahvaltısı")}
                                  className="w-full py-1.5 px-2 bg-yellow-50 hover:bg-white border border-yellow-300 hover:border-yellow-400 rounded-xl text-xs text-stone-900 text-center font-mono font-bold whitespace-nowrap cursor-pointer transition-all shadow-sm hover:shadow"
                                  title="Saati çark ile kaydırarak seç"
                                >
                                  {formatDisplayHours(dailyMenu.saatler?.haftasonu?.kahvalti || "08:30 - 11:30")}
                                </button>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[11px] font-semibold text-stone-700 block">
                                  Akşam:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openTimePicker("haftasonu", "aksam", "Hafta Sonu • Akşam Yemeği")}
                                  className="w-full py-1.5 px-2 bg-yellow-50 hover:bg-white border border-yellow-300 hover:border-yellow-400 rounded-xl text-xs text-stone-900 text-center font-mono font-bold whitespace-nowrap cursor-pointer transition-all shadow-sm hover:shadow"
                                  title="Saati çark ile kaydırarak seç"
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
                                ? "bg-emerald-50/90 border-emerald-500 shadow-sm shadow-emerald-200/50 border-2 border-emerald-500"
                                : "bg-white border-yellow-200 hover:border-yellow-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                
                                <div>
                                  <div className="font-bold text-xs text-stone-800">Bayram / Özel</div>
                                  <div className="text-[10px] text-stone-500">Tatil & Özel Gün</div>
                                </div>
                              </div>
                              {dailyMenu.gunTipi === "ozelgun" ? (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-yellow-300 text-stone-900 border border-yellow-400">
                                   Geçerli
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleGunTipi("ozelgun");
                                  }}
                                  className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-yellow-100 text-stone-700 hover:bg-yellow-300 hover:text-stone-900 transition-colors"
                                >
                                  Seç
                                </button>
                              )}
                            </div>

                            {/* Saat Ayarları Butonları */}
                            <div className="space-y-2 pt-2.5 border-t border-yellow-200" onClick={(e) => e.stopPropagation()}>
                              <div className="space-y-1">
                                <span className="text-[11px] font-semibold text-stone-700 block">
                                  Kahvaltı:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openTimePicker("ozelgun", "kahvalti", "Bayram / Özel • Sabah Kahvaltısı")}
                                  className="w-full py-1.5 px-2 bg-yellow-50 hover:bg-white border border-yellow-300 hover:border-yellow-400 rounded-xl text-xs text-stone-900 text-center font-mono font-bold whitespace-nowrap cursor-pointer transition-all shadow-sm hover:shadow"
                                  title="Saati çark ile kaydırarak seç"
                                >
                                  {formatDisplayHours(dailyMenu.saatler?.ozelgun?.kahvalti || "09:00 - 12:00")}
                                </button>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[11px] font-semibold text-stone-700 block">
                                  Akşam:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openTimePicker("ozelgun", "aksam", "Bayram / Özel • Akşam Yemeği")}
                                  className="w-full py-1.5 px-2 bg-yellow-50 hover:bg-white border border-yellow-300 hover:border-yellow-400 rounded-xl text-xs text-stone-900 text-center font-mono font-bold whitespace-nowrap cursor-pointer transition-all shadow-sm hover:shadow"
                                  title="Saati çark ile kaydırarak seç"
                                >
                                  {formatDisplayHours(dailyMenu.saatler?.ozelgun?.aksam || "19:00 - 21:30")}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. YEMEK GİRİŞ ALANLARI (ÜSTTE) */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-1 border-b border-yellow-200">
                          <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                             Günün Yemek Girişi
                          </span>
                          <span className="text-[10px] text-stone-500">Kahvaltı ve akşam menü içerikleri</span>
                        </div>

                        {/* Kahvaltı Bloğu */}
                        <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-300 space-y-3">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <label className="text-yellow-600 font-bold flex items-center gap-1.5">
                               Sabah Kahvaltısı Menüsü & Saati
                            </label>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-stone-500 font-medium">Saat:</span>
                              <button
                                type="button"
                                onClick={() => openTimePicker(dailyMenu.gunTipi || "haftaici", "kahvalti", "Sabah Kahvaltısı Servis Saati")}
                                className="bg-white hover:bg-yellow-100/70 border border-yellow-300 hover:border-yellow-400 rounded-lg px-3 py-1.5 text-xs text-stone-900 font-mono font-bold whitespace-nowrap min-w-[140px] flex items-center justify-center cursor-pointer transition-all shadow-sm"
                                title="Saati çark ile kaydırarak ayarla"
                              >
                                <span className="whitespace-nowrap tracking-wide">{dailyMenu.kahvaltiSaat}</span>
                              </button>
                            </div>
                          </div>
                          <textarea
                            rows={3}
                            value={dailyMenu.kahvalti}
                            onChange={(e) => setDailyMenu({ ...dailyMenu, kahvalti: e.target.value })}
                            placeholder="Kahvaltı içeriğini girin (örn: Haşlanmış yumurta, peynir çeşitleri, zeytin, domates, salatalık, bal-tereyağı, çay)..."
                            className="w-full bg-white border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-300/20 leading-relaxed"
                          />
                          <div className="flex items-center gap-2">
                            <label className="text-stone-500 whitespace-nowrap text-[11px]">Kahvaltı Kalorisi:</label>
                            <input
                              type="text"
                              value={dailyMenu.kahvaltiKalori}
                              onChange={(e) => setDailyMenu({ ...dailyMenu, kahvaltiKalori: e.target.value })}
                              placeholder="Örn: 650 kcal"
                              className="bg-white border border-yellow-300 rounded-lg px-2.5 py-1 text-xs text-stone-900 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-amber-300/20 w-36"
                            />
                          </div>
                        </div>

                        {/* Akşam Yemeği Bloğu */}
                        <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-300 space-y-3">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <label className="text-yellow-600 font-bold flex items-center gap-1.5">
                               Akşam Yemeği Menüsü & Saati
                            </label>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-stone-500 font-medium">Saat:</span>
                              <button
                                type="button"
                                onClick={() => openTimePicker(dailyMenu.gunTipi || "haftaici", "aksam", "Akşam Yemeği Servis Saati")}
                                className="bg-white hover:bg-yellow-100/70 border border-yellow-300 hover:border-yellow-400 rounded-lg px-3 py-1.5 text-xs text-stone-900 font-mono font-bold whitespace-nowrap min-w-[140px] flex items-center justify-center cursor-pointer transition-all shadow-sm"
                                title="Saati çark ile kaydırarak ayarla"
                              >
                                <span className="whitespace-nowrap tracking-wide">{dailyMenu.aksamSaat}</span>
                              </button>
                            </div>
                          </div>
                          <textarea
                            rows={3}
                            value={dailyMenu.aksam}
                            onChange={(e) => setDailyMenu({ ...dailyMenu, aksam: e.target.value })}
                            placeholder="Akşam menüsü içeriğini girin (örn: Mercimek çorbası, Tavuk sote, Pirinç pilavı, Mevsim salata, Ayran)..."
                            className="w-full bg-white border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300 focus:ring-2 focus:ring-amber-300/20 leading-relaxed"
                          />
                          <div className="flex items-center gap-2">
                            <label className="text-stone-500 whitespace-nowrap text-[11px]">Akşam Kalorisi:</label>
                            <input
                              type="text"
                              value={dailyMenu.aksamKalori}
                              onChange={(e) => setDailyMenu({ ...dailyMenu, aksamKalori: e.target.value })}
                              placeholder="Örn: 1.200 kcal"
                              className="bg-white border border-yellow-300 rounded-lg px-2.5 py-1 text-xs text-stone-900 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-amber-300/20 w-36"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. MENÜ VE GÖRÜNÜM AYARLARI (AŞAĞIDA) */}
                      <div className="space-y-4 pt-2 border-t border-yellow-200">
                        <div className="flex items-center justify-between pb-1">
                          <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                             Menü & Kalori Gösterim Ayarları
                          </span>
                          <span className="text-[10px] text-stone-500">Yönetici tercihleri</span>
                        </div>

                        {/* B. Gösterim Şekli (Aynı Zamanda vs Tek Zamanlı) */}
                        <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-stone-800 font-medium block">
                              Yemeklerin Gösterim Şekli
                            </label>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-yellow-100 text-stone-800 border border-yellow-300 text-stone-800 font-medium font-bold border border-yellow-300">
                              {dailyMenu.gorunumModu === "birlikte" ? "Aynı Zamanda" : "Tek Zamanlı"}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500">
                            Yemeklerin panoda aynı anda mı yoksa sadece ilgili servis zamanında tek tek mi görüneceğini belirleyin:
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleToggleViewMode("birlikte")}
                              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                                dailyMenu.gorunumModu === "birlikte"
                                  ? "bg-yellow-100/70 border-2 border-yellow-300 text-stone-800 shadow-sm"
                                  : "bg-white border-yellow-200 text-stone-500 hover:border-yellow-300"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                
                                {dailyMenu.gorunumModu === "birlikte" && (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-yellow-200 text-stone-800 border border-yellow-300">
                                    AKTİF SEÇİM
                                  </span>
                                )}
                              </div>
                              <div className="font-bold text-xs text-stone-800">Aynı Zamanda Göster</div>
                              <div className="text-[10px] text-stone-500 mt-1 leading-relaxed">
                                Hem Kahvaltı hem Akşam Yemeği aynı anda panoda birlikte listelenir.
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleViewMode("tek")}
                              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                                dailyMenu.gorunumModu === "tek"
                                  ? "bg-yellow-100/70 border-2 border-yellow-300 text-stone-800 shadow-sm"
                                  : "bg-white border-yellow-200 text-stone-500 hover:border-yellow-300"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                
                                {dailyMenu.gorunumModu === "tek" && (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-yellow-200 text-stone-800 border border-yellow-300">
                                    AKTİF SEÇİM
                                  </span>
                                )}
                              </div>
                              <div className="font-bold text-xs text-stone-800">Tek Zamanda Göster</div>
                              <div className="text-[10px] text-stone-500 mt-1 leading-relaxed">
                                Yalnızca seçtiğiniz tek öğün görünür, diğer öğün gizlenir.
                              </div>
                            </button>
                          </div>

                          {/* Tek Zamanlı Modunda Hangi Öğün Seçimi */}
                          {dailyMenu.gorunumModu === "tek" && (
                            <div className="pt-2 border-t border-yellow-200 space-y-2">
                              <label className="text-[11px] font-semibold text-stone-600 block">
                                Şu an hangi tek öğün gösterilsin?
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleActiveMeal("kahvalti")}
                                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    dailyMenu.aktifOgun === "kahvalti"
                                      ? "bg-yellow-100 border-2 border-yellow-300 text-stone-800 shadow-sm"
                                      : "bg-white border-yellow-200 text-stone-600 hover:text-stone-900 hover:border-yellow-300"
                                  }`}
                                >
                                   Yalnızca Kahvaltı
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleActiveMeal("aksam")}
                                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    dailyMenu.aktifOgun === "aksam"
                                      ? "bg-yellow-100 border-2 border-yellow-300 text-stone-800 shadow-sm"
                                      : "bg-white border-yellow-200 text-stone-600 hover:text-stone-900 hover:border-yellow-300"
                                  }`}
                                >
                                   Yalnızca Akşam Yemeği
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* C. Kalori Gösterim Tercihi */}
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="text-xs font-bold text-yellow-600 flex items-center gap-1.5">
                                 Kalori Gösterim Tercihi
                              </label>
                              <p className="text-[11px] text-stone-500 mt-0.5">
                                Yemeklerin tahmini kalori değerleri öğrencilere gösterilsin mi?
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleToggleCalories}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer flex items-center gap-1.5 ${
                                dailyMenu.kaloriGoster
                                  ? "bg-yellow-500/20 border-yellow-300/50 text-yellow-600 shadow-sm"
                                  : "bg-white border-yellow-200 text-slate-500 hover:text-stone-600"
                              }`}
                            >
                              <span>{dailyMenu.kaloriGoster ? " Kalori Açık" : " Kalori Gizli"}</span>
                            </button>
                          </div>
                          <div className="text-[11px] text-stone-500">
                            Durum: <strong className={dailyMenu.kaloriGoster ? "text-yellow-600 font-semibold" : "text-stone-500 font-semibold"}>
                              {dailyMenu.kaloriGoster ? "Kalori bilgileri panoda rozet olarak gösteriliyor." : "Kalori bilgileri gizlendi, yalnızca menü adları görünüyor."}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* KAYDET BUTONU */}
                      <button
                        type="submit"
                        className="w-full py-3 bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold font-bold rounded-xl cursor-pointer shadow-sm  transition-all flex items-center justify-center gap-2"
                      >
                         Menüyü ve Tercihleri Kaydet
                      </button>
                    </form>
                  </div>

                  {/* Sağ Kolon: Canlı Pano Önizlemesi */}
                  <div className="space-y-6">
                    <div className="bg-white border border-yellow-200 p-6 rounded-3xl space-y-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 border border-emerald-500/30">
                            Öğrencilere Yansıyan Canlı Görünüm
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-700 border border-yellow-300/30">
                            {dailyMenu.gunTipi === "haftasonu"
                              ? "Hafta Sonu Tarifesi"
                              : dailyMenu.gunTipi === "ozelgun"
                              ? "Bayram / Özel Gün Tarifesi"
                              : "Hafta İçi Tarifesi"}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500">
                          {dailyMenu.gorunumModu === "birlikte"
                            ? "Her iki öğün de aynı anda öğrencilerin ekranında görünür."
                            : `Şu anda sadece ${dailyMenu.aktifOgun === "kahvalti" ? "Sabah Kahvaltısı" : "Akşam Yemeği"} gösteriliyor.`}
                        </p>
                      </div>

                      {dailyMenu.gorunumModu === "birlikte" ? (
                        <div className="space-y-4">
                          {/* Kahvaltı Canlı Kartı */}
                          <div className="p-5 bg-white border-2 border-yellow-300/60 rounded-3xl space-y-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-100 text-stone-800 border border-yellow-300 flex items-center gap-1.5">
                                 Sabah Kahvaltısı
                              </span>
                              <span className="text-xs font-semibold text-stone-600 bg-white px-3 py-1 rounded-xl border border-yellow-200">
                                Servis: {dailyMenu.kahvaltiSaat}
                              </span>
                            </div>

                            <div className="py-1">
                              <h4 className="text-xs font-bold text-stone-700 mb-1">Kahvaltı Menüsü:</h4>
                              <p className="text-sm text-stone-700 leading-relaxed font-medium">
                                {dailyMenu.kahvalti}
                              </p>
                            </div>

                            <div className="pt-2.5 border-t border-yellow-200 flex justify-between items-center text-xs">
                              {dailyMenu.kaloriGoster ? (
                                <span className="text-stone-500">
                                  Kalori: <strong className="text-amber-800 font-bold">{dailyMenu.kahvaltiKalori}</strong>
                                </span>
                              ) : (
                                <span className="text-stone-500 text-xs">Günün Menüsü</span>
                              )}
                              <span className="text-emerald-600 font-bold flex items-center gap-1.5 text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Servis Hazır
                              </span>
                            </div>
                          </div>

                          {/* Akşam Yemeği Canlı Kartı */}
                          <div className="p-5 bg-white border-2 border-yellow-300/60 rounded-3xl space-y-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-100 text-stone-800 border border-yellow-300 flex items-center gap-1.5">
                                 Akşam Yemeği
                              </span>
                              <span className="text-xs font-semibold text-stone-600 bg-white px-3 py-1 rounded-xl border border-yellow-200">
                                Servis: {dailyMenu.aksamSaat}
                              </span>
                            </div>

                            <div className="py-1">
                              <h4 className="text-xs font-bold text-stone-700 mb-1">Akşam Menüsü:</h4>
                              <p className="text-sm text-stone-700 leading-relaxed font-medium">
                                {dailyMenu.aksam}
                              </p>
                            </div>

                            <div className="pt-2.5 border-t border-yellow-200 flex justify-between items-center text-xs">
                              {dailyMenu.kaloriGoster ? (
                                <span className="text-stone-500">
                                  Kalori: <strong className="text-amber-800 font-bold">{dailyMenu.aksamKalori}</strong>
                                </span>
                              ) : (
                                <span className="text-stone-500 text-xs">Günün Menüsü</span>
                              )}
                              <span className="text-emerald-600 font-bold flex items-center gap-1.5 text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sıcak Servis
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* CANLI ÖNİZLEME: TEK ZAMANLI GÖRÜNÜM */
                        dailyMenu.aktifOgun === "kahvalti" ? (
                          <div className="p-5 bg-white border-2 border-yellow-300/60 rounded-3xl space-y-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-100 text-stone-800 border border-yellow-300 flex items-center gap-1.5">
                                 Sabah Kahvaltısı
                              </span>
                              <span className="text-xs font-semibold text-stone-600 bg-white px-3 py-1 rounded-xl border border-yellow-200">
                                Servis: {dailyMenu.kahvaltiSaat}
                              </span>
                            </div>

                            <div className="py-2">
                              <h4 className="text-base font-bold text-stone-900 mb-1.5">Günün Kahvaltı Tabağı:</h4>
                              <p className="text-sm text-stone-700 leading-relaxed font-medium">
                                {dailyMenu.kahvalti}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-yellow-200 flex justify-between items-center text-xs">
                              {dailyMenu.kaloriGoster ? (
                                <span className="text-stone-500">
                                  Kalori: <strong className="text-amber-800 font-bold">{dailyMenu.kahvaltiKalori}</strong>
                                </span>
                              ) : (
                                <span className="text-stone-500 text-xs">Günün Menüsü</span>
                              )}
                              <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Servis Başladı
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-5 bg-white border-2 border-yellow-300/60 rounded-3xl space-y-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-100 text-stone-800 border border-yellow-300 flex items-center gap-1.5">
                                 Akşam Yemeği
                              </span>
                              <span className="text-xs font-semibold text-stone-600 bg-white px-3 py-1 rounded-xl border border-yellow-200">
                                Servis: {dailyMenu.aksamSaat}
                              </span>
                            </div>

                            <div className="py-2">
                              <h4 className="text-base font-bold text-stone-900 mb-1.5">Günün Akşam Menüsü:</h4>
                              <p className="text-sm text-stone-700 leading-relaxed font-medium">
                                {dailyMenu.aksam}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-yellow-200 flex justify-between items-center text-xs">
                              {dailyMenu.kaloriGoster ? (
                                <span className="text-stone-500">
                                  Kalori: <strong className="text-amber-800 font-bold">{dailyMenu.aksamKalori}</strong>
                                </span>
                              ) : (
                                <span className="text-stone-500 text-xs">Günün Menüsü</span>
                              )}
                              <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sıcak Servis
                              </span>
                            </div>
                          </div>
                        )
                      )}

                      <div className="p-3.5 bg-yellow-50 rounded-2xl border border-yellow-200 text-xs text-stone-500 flex items-start gap-2.5">
                        <div className="leading-relaxed">
                          Yönetici olarak sol taraftan <strong className="text-stone-600">Aynı Zamanda</strong> seçeneğini seçtiğinizde kahvaltı ve akşam menüsü aynı anda görünür; <strong className="text-stone-600">Tek Zamanda</strong> seçtiğinizde sadece aktif olan öğün yayınlanır. Kalori seçeneğini de dilediğiniz an açıp kapatabilirsiniz.
                        </div>
                      </div>
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
                  "09:00 - 10:30",
                  "10:30 - 12:00",
                  "13:00 - 14:30",
                  "15:00 - 16:30",
                  "17:00 - 18:30",
                  "19:00 - 20:30",
                  "20:30 - 22:00",
                ];

                // Takvim günleri (Bu hafta)
                const weekDays = [
                  { date: "2026-10-19", dayName: "Pazartesi", shortDate: "19 Eki" },
                  { date: "2026-10-20", dayName: "Salı", shortDate: "20 Eki" },
                  { date: "2026-10-21", dayName: "Çarşamba", shortDate: "21 Eki" },
                  { date: "2026-10-22", dayName: "Perşembe", shortDate: "22 Eki" },
                  { date: "2026-10-23", dayName: "Cuma", shortDate: "23 Eki" },
                  { date: "2026-10-24", dayName: "Cumartesi", shortDate: "24 Eki" },
                  { date: "2026-10-25", dayName: "Pazar", shortDate: "25 Eki" },
                ];

                const daySlots = laundrySlots.filter((s) => s.tarih === selectedLaundryDate);
                const filteredSlots = daySlots.filter((s) => {
                  if (laundryMachineFilter === "all") return true;
                  if (laundryMachineFilter === "yikama") return s.makineNo.includes("Makine") || laundryMachines.find(m => m.id === s.makineNo)?.tur === "yikama";
                  if (laundryMachineFilter === "kurutma") return s.makineNo.includes("Kurutma") || laundryMachines.find(m => m.id === s.makineNo)?.tur === "kurutma";
                  return s.makineNo === laundryMachineFilter;
                });

                const activeWashingCount = laundrySlots.filter(s => s.tarih === selectedLaundryDate && s.durum === "Yıkanıyor").length;
                const inQueueCount = laundrySlots.filter(s => s.tarih === selectedLaundryDate && s.durum === "Sırada").length;

                return (
                  <div className="bg-white border border-yellow-200 p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
                    {/* Üst Başlık ve Aksiyonlar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-yellow-200 pb-5">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-yellow-100 text-stone-800 border border-yellow-300">
                            Çamaşırhane & Kurutma Çizelgesi
                          </span>
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Canlı Takip
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-stone-900">Öğrenci Çamaşırhane Sırası ve Takvimi</h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Öğrencilerin ne zaman çamaşır attığını, hangi makinede hangi saatte sırada olduklarını takvimden inceleyin veya yeni sıra verin.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsManageMachinesModalOpen(true)}
                          className="px-3.5 py-2.5 bg-yellow-100 hover:bg-yellow-200 border border-yellow-300 text-stone-800 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
                          title="Çamaşır ve kurutma makinelerinin sayısını artır veya azalt"
                        >
                          Makine Sayısını Ayarla ({laundryMachines.length})
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setNewLaundry((p) => ({ ...p, tarih: selectedLaundryDate, makineNo: laundryMachines[0]?.id || "Makine 1 (A-1)" }));
                            setIsAddLaundryModalOpen(true);
                          }}
                          className="px-4 py-2.5 bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95"
                        >
                          + Yeni Çamaşır Sırası Ekle
                        </button>
                      </div>
                    </div>

                    {/* Canlı İstatistik ve Durum Özet Kartları */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 bg-yellow-50/70 border border-yellow-200 rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-200/80 border border-yellow-300 flex items-center justify-center font-bold text-stone-800 text-xs">
                          KAP
                        </div>
                        <div>
                          <div className="text-xs text-stone-500">Toplam Makine</div>
                          <div className="text-base font-black text-stone-900">{washingMachines.length} Yıkama • {dryerMachines.length} Kurutma</div>
                        </div>
                      </div>

                      <div className="p-3.5 bg-yellow-50/70 border border-yellow-200 rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 font-bold text-xs">
                          AKTİF
                        </div>
                        <div>
                          <div className="text-xs text-stone-500">Şu An Yıkanıyor</div>
                          <div className="text-base font-black text-emerald-700">{activeWashingCount} Makine</div>
                        </div>
                      </div>

                      <div className="p-3.5 bg-yellow-50/70 border border-yellow-200 rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold text-xs">
                          SIRA
                        </div>
                        <div>
                          <div className="text-xs text-stone-500">Sırada Bekleyen</div>
                          <div className="text-base font-black text-amber-800">{inQueueCount} Öğrenci</div>
                        </div>
                      </div>
                    </div>

                    {/* Canlı Makineler Paneli */}
                    <div className="bg-yellow-50/50 border border-yellow-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                          Çamaşırhane Makineleri Anlık Durumu
                        </span>
                        <span className="text-[11px] text-stone-500 font-medium">B Blok Zemin Kat Çamaşırhane Odası</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                        {laundryMachines.map((m) => {
                          const currentActive = daySlots.find(
                            (s) => s.makineNo === m.id && (s.durum === "Yıkanıyor" || s.durum === "Sırada")
                          );
                          const isWashing = currentActive?.durum === "Yıkanıyor";
                          const isQueued = currentActive?.durum === "Sırada";

                          return (
                            <div
                              key={m.id}
                              className={`p-3 rounded-xl border text-center transition-all ${
                                isWashing
                                  ? "bg-emerald-50 border-emerald-300 text-stone-900 shadow-sm"
                                  : isQueued
                                  ? "bg-amber-50 border-amber-300 text-stone-900 shadow-sm"
                                  : "bg-white border-yellow-200 text-stone-700"
                              }`}
                            >
                              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">{m.id.includes("Kurutma") || m.tur === "kurutma" ? "Kurutma" : "Yıkama"}</div>
                              <div className="font-bold text-xs truncate" title={m.name}>{m.name}</div>
                              <div className="text-[10px] text-stone-500 mb-1.5">{m.tip}</div>
                              {isWashing ? (
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  {currentActive?.ogrenciAd.split(" ")[0]} (Oda {currentActive?.odaNo})
                                </span>
                              ) : isQueued ? (
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                  Sırada: {currentActive?.ogrenciAd.split(" ")[0]}
                                </span>
                              ) : (
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                                  Boşta (Müsait)
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* HAFTALIK TAKVİM SEÇİCİ BARI */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                          Günlük Çamaşırhane Takvimi
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-stone-500">Makine Filtresi:</span>
                          <select
                            value={laundryMachineFilter}
                            onChange={(e) => setLaundryMachineFilter(e.target.value)}
                            className="bg-yellow-50 border border-yellow-300 rounded-xl px-2.5 py-1 text-xs text-stone-800 focus:outline-none"
                          >
                            <option value="all">Tüm Makineler</option>
                            <option value="yikama">Sadece Çamaşır Makineleri</option>
                            <option value="kurutma">Sadece Kurutma Makineleri</option>
                          </select>
                        </div>
                      </div>

                      {/* Gün Seçici Butonları */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                        {weekDays.map((wd) => {
                          const countForDay = laundrySlots.filter(
                            (s) => s.tarih === wd.date && s.durum !== "İptal"
                          ).length;
                          const isSelected = selectedLaundryDate === wd.date;

                          return (
                            <button
                              key={wd.date}
                              type="button"
                              onClick={() => setSelectedLaundryDate(wd.date)}
                              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-yellow-300 border-2 border-yellow-400 text-stone-900 shadow-sm"
                                  : "bg-white hover:bg-yellow-100/60 border-yellow-200 text-stone-700"
                              }`}
                            >
                              <div className="text-[11px] font-semibold uppercase">{wd.dayName}</div>
                              <div className="text-sm font-black mt-0.5">{wd.shortDate}</div>
                              <div className="mt-1 text-[10px]">
                                {countForDay > 0 ? (
                                  <span className={`px-2 py-0.5 rounded-full font-bold ${isSelected ? "bg-stone-900 text-yellow-300" : "bg-yellow-100 text-stone-800 border border-yellow-300"}`}>
                                    {countForDay} Yıkama
                                  </span>
                                ) : (
                                  <span className="text-stone-400">Boş</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* TAKVİM ÇİZELGESİ / MATRİS (Saat x Makine) */}
                    <div className="border border-yellow-200 rounded-2xl overflow-hidden">
                      <div className="bg-yellow-100/70 p-3 border-b border-yellow-200 flex justify-between items-center text-xs">
                        <span className="font-bold text-stone-800">
                          {weekDays.find((w) => w.date === selectedLaundryDate)?.dayName} ({selectedLaundryDate}) Çizelgesi
                        </span>
                        <span className="text-[11px] text-stone-600">
                          Boş saat dilimlerine tıklayarak doğrudan öğrenciye sıra tanımlayabilirsiniz.
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                          <thead>
                            <tr className="bg-yellow-50/70 border-b border-yellow-200 text-stone-600">
                              <th className="p-3 font-bold w-32 border-r border-yellow-200">Saat Dilimi</th>
                              {laundryMachines
                                .filter((m) => {
                                  if (laundryMachineFilter === "all") return true;
                                  if (laundryMachineFilter === "yikama") return m.tur === "yikama" || m.id.includes("Makine");
                                  if (laundryMachineFilter === "kurutma") return m.tur === "kurutma" || m.id.includes("Kurutma");
                                  return m.id === laundryMachineFilter;
                                })
                                .map((m) => (
                                  <th key={m.id} className="p-3 font-bold border-r border-yellow-200 last:border-r-0">
                                    <div className="text-stone-800">{m.name}</div>
                                    <div className="text-[10px] text-stone-500 font-normal">{m.tip}</div>
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-yellow-200">
                            {timeSlots.map((slot) => (
                              <tr key={slot} className="hover:bg-yellow-50/30 transition-colors">
                                <td className="p-3 font-mono font-bold text-stone-700 bg-yellow-50/40 border-r border-yellow-200 whitespace-nowrap">
                                  {slot}
                                </td>
                                {laundryMachines
                                  .filter((m) => {
                                    if (laundryMachineFilter === "all") return true;
                                    if (laundryMachineFilter === "yikama") return m.tur === "yikama" || m.id.includes("Makine");
                                    if (laundryMachineFilter === "kurutma") return m.tur === "kurutma" || m.id.includes("Kurutma");
                                    return m.id === laundryMachineFilter;
                                  })
                                  .map((m) => {
                                    const booking = daySlots.find(
                                      (s) => s.saatAraligi === slot && s.makineNo === m.id
                                    );

                                    return (
                                      <td key={m.id} className="p-2 border-r border-yellow-200 last:border-r-0 align-top">
                                        {booking ? (
                                          <div
                                            className={`p-2.5 rounded-xl border space-y-1.5 shadow-sm transition-all ${
                                              booking.durum === "Yıkanıyor"
                                                ? "bg-emerald-50/90 border-emerald-300"
                                                : booking.durum === "Sırada"
                                                ? "bg-yellow-100/80 border-yellow-300"
                                                : "bg-stone-50 border-stone-200"
                                            }`}
                                          >
                                            <div className="flex justify-between items-start gap-1">
                                              <span className="font-bold text-stone-900 truncate" title={booking.ogrenciAd}>
                                                {booking.ogrenciAd}
                                              </span>
                                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white font-bold border border-yellow-200 text-stone-700 whitespace-nowrap">
                                                Oda {booking.odaNo}
                                              </span>
                                            </div>

                                            <div className="text-[10px] text-stone-600 truncate" title={booking.program}>
                                              Program: {booking.program}
                                            </div>

                                            {booking.not && (
                                              <div className="text-[9px] text-stone-500 italic truncate" title={booking.not}>
                                                Not: {booking.not}
                                              </div>
                                            )}

                                            <div className="flex items-center justify-between pt-1 border-t border-yellow-200/60 text-[10px]">
                                              <span
                                                className={`font-bold ${
                                                  booking.durum === "Yıkanıyor"
                                                    ? "text-emerald-700"
                                                    : booking.durum === "Sırada"
                                                    ? "text-amber-800"
                                                    : "text-stone-500"
                                                }`}
                                              >
                                                {booking.durum}
                                              </span>

                                              <div className="flex items-center gap-1">
                                                {booking.durum === "Sırada" && (
                                                  <button
                                                    onClick={() => handleUpdateLaundryStatus(booking.id, "Yıkanıyor")}
                                                    className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer"
                                                    title="Yıkamaya Başlat"
                                                  >
                                                    Başlat
                                                  </button>
                                                )}
                                                {booking.durum === "Yıkanıyor" && (
                                                  <button
                                                    onClick={() => handleUpdateLaundryStatus(booking.id, "Tamamlandı")}
                                                    className="px-1.5 py-0.5 rounded bg-stone-700 text-white font-bold hover:bg-stone-800 cursor-pointer"
                                                    title="Tamamlandı Olarak İşaretle"
                                                  >
                                                    Bitir
                                                  </button>
                                                )}
                                                <button
                                                  onClick={() => handleDeleteLaundry(booking.id)}
                                                  className="text-stone-400 hover:text-rose-600 px-1 py-0.5 cursor-pointer text-[10px] font-semibold"
                                                  title="Sırayı Sil / İptal Et"
                                                >
                                                  Sil
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => openQuickAddLaundry(m.id, slot, selectedLaundryDate)}
                                            className="w-full h-16 rounded-xl border border-dashed border-yellow-300 hover:border-yellow-400 hover:bg-yellow-100/50 flex flex-col items-center justify-center text-stone-400 hover:text-stone-700 transition-all cursor-pointer text-[11px] gap-0.5"
                                          >
                                            <span className="text-xs">+</span>
                                            <span className="text-[10px] font-medium">Sıra Ver</span>
                                          </button>
                                        )}
                                      </td>
                                    );
                                  })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* GÜNLÜK KAYITLAR LİSTE GÖRÜNÜMÜ */}
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-stone-900">
                          Seçili Günün Kayıtlı Çamaşır Sıraları ({filteredSlots.length})
                        </h4>
                        <span className="text-[11px] text-stone-500">Tarih: {selectedLaundryDate}</span>
                      </div>

                      {filteredSlots.length === 0 ? (
                        <div className="p-8 bg-yellow-50/50 border border-yellow-200 rounded-2xl text-center text-stone-500 text-xs">
                          Bu tarihte henüz çamaşır sırası oluşturulmamış. Yukarıdaki takvimden saat seçip sıra tanımlayabilirsiniz.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {filteredSlots.map((slot) => (
                            <div
                              key={slot.id}
                              className="p-4 bg-yellow-50/70 border border-yellow-200 rounded-2xl space-y-2 hover:border-yellow-300 transition-all shadow-sm"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-bold text-sm text-stone-900">{slot.ogrenciAd}</div>
                                  <div className="text-[11px] text-stone-500">Oda No: <strong className="text-stone-700">{slot.odaNo}</strong></div>
                                </div>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    slot.durum === "Yıkanıyor"
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                      : slot.durum === "Sırada"
                                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                                      : "bg-stone-100 text-stone-600 border border-stone-200"
                                  }`}
                                >
                                  {slot.durum}
                                </span>
                              </div>

                              <div className="text-xs text-stone-700 space-y-1 pt-1 border-t border-yellow-200">
                                <div className="flex items-center gap-1.5 font-medium">
                                  <span>{slot.makineNo}</span>
                                </div>
                                <div className="text-[11px] text-stone-600 flex items-center gap-1">
                                  <span>Saat:</span>
                                  <strong className="text-stone-800 font-mono">{slot.saatAraligi}</strong>
                                </div>
                                <div className="text-[11px] text-stone-500">
                                  Program: <span className="text-stone-700 font-medium">{slot.program}</span>
                                </div>
                                {slot.not && (
                                  <div className="text-[11px] text-amber-800 bg-yellow-100/60 p-1.5 rounded-lg border border-yellow-200">
                                    Not: {slot.not}
                                  </div>
                                )}
                              </div>

                              <div className="pt-2 border-t border-yellow-200 flex justify-between items-center text-xs">
                                <div className="flex items-center gap-1.5">
                                  {slot.durum === "Sırada" && (
                                    <button
                                      onClick={() => handleUpdateLaundryStatus(slot.id, "Yıkanıyor")}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg cursor-pointer transition-colors"
                                    >
                                      Yıkamayı Başlat
                                    </button>
                                  )}
                                  {slot.durum === "Yıkanıyor" && (
                                    <button
                                      onClick={() => handleUpdateLaundryStatus(slot.id, "Tamamlandı")}
                                      className="px-2.5 py-1 bg-stone-700 hover:bg-stone-800 text-white font-bold text-[11px] rounded-lg cursor-pointer transition-colors"
                                    >
                                      Bitti (Boşaltıldı)
                                    </button>
                                  )}
                                </div>

                                <button
                                  onClick={() => handleDeleteLaundry(slot.id)}
                                  className="text-xs text-stone-400 hover:text-rose-600 cursor-pointer font-medium"
                                >
                                  Sil / İptal
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ======================================================== */}
              {/* MODÜL 6: ARIZA VE TEKNİK BAKIM */}
              {/* ======================================================== */}
              {managerTab === "arizalar" && (
                <div className="bg-white border border-yellow-200 p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-stone-900">Arıza ve Bakım Kayıtları</h3>
                      <p className="text-xs text-stone-500">Odalardan bildirilen teknik arızaları inceleyin veya yeni kayıt açın.</p>
                    </div>
                    <button
                      onClick={() => setIsAddMaintenanceModalOpen(true)}
                      className="px-4 py-2 bg-amber-600 hover:bg-yellow-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      + Yeni Arıza Bildir
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {maintenanceTickets.map((m) => (
                      <div
                        key={m.id}
                        className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl space-y-2 hover:border-yellow-300 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <span className="px-2 py-0.5 rounded bg-indigo-900/40 text-stone-800 font-medium font-bold text-xs">
                            Oda {m.odaNo}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              m.oncelik === "Acil"
                                ? "bg-rose-500/20 text-rose-400"
                                : m.oncelik === "Orta"
                                ? "bg-yellow-500/20 text-yellow-600"
                                : "bg-slate-700 text-stone-600"
                            }`}
                          >
                            {m.oncelik}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-stone-900">{m.baslik}</h4>
                        <div className="text-xs text-stone-500">
                          {m.kategori} • Bildiren: {m.bildiren}
                        </div>

                        <div className="pt-2 border-t border-yellow-200 flex justify-between items-center">
                          <span
                            className={`text-xs font-bold ${
                              m.durum === "Çözüldü"
                                ? "text-emerald-400"
                                : m.durum === "İnceleniyor"
                                ? "text-yellow-600"
                                : "text-rose-400"
                            }`}
                          >
                            {m.durum}
                          </span>

                          <button
                            onClick={() => handleToggleMaintenanceStatus(m.id)}
                            className="px-3 py-1 bg-yellow-100/70 hover:bg-yellow-100 text-stone-700 text-xs font-semibold rounded-lg cursor-pointer"
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
                <div className="bg-white border border-yellow-200 p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-stone-900">Yurt İçi Duyuru ve Anons Panosu</h3>
                      <p className="text-xs text-stone-500">Öğrencilere duyuru yayınlayın veya eski duyuruları kaldırın.</p>
                    </div>
                    <button
                      onClick={() => setIsAddAnnouncementModalOpen(true)}
                      className="px-4 py-2 bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold font-bold text-xs rounded-xl cursor-pointer"
                    >
                      + Yeni Duyuru Yayınla
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {announcements.map((a) => (
                      <div key={a.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl space-y-2">
                        <div className="flex justify-between items-start">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              a.oncelik === "Acil"
                                ? "bg-rose-500/20 text-rose-400"
                                : a.oncelik === "Önemli"
                                ? "bg-yellow-500/20 text-yellow-600"
                                : "bg-yellow-100/70 text-stone-600"
                            }`}
                          >
                            {a.oncelik}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500">{a.tarih}</span>
                            <button
                              onClick={() => handleDeleteAnnouncement(a.id)}
                              className="text-slate-500 hover:text-rose-400 text-xs cursor-pointer"
                            >
                              
                            </button>
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-stone-900">{a.baslik}</h4>
                        <p className="text-xs text-stone-600">{a.icerik}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* MODÜL 8: YURT AYARLARI (TAM YETKİLİ) */}
              {/* ======================================================== */}
              {managerTab === "ayarlar" && (
                <div className="bg-white border border-yellow-200 p-6 sm:p-8 rounded-3xl max-w-3xl w-full mx-auto space-y-6 shadow-sm">
                  <div className="border-b border-yellow-200 pb-3">
                    <h3 className="text-xl font-bold text-stone-900">Yurt Kurumsal ve Operasyonel Ayarları</h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Yurdun adını, adresini, iletişim bilgilerini ve giriş-çıkış kurallarını kendiniz güncelleyebilirsiniz.
                    </p>
                  </div>

                  <form onSubmit={handleSaveYurtSettings} className="space-y-4 text-xs">
                    <div>
                      <label className="text-stone-600 font-semibold block mb-1">Yurt Adı:</label>
                      <input
                        type="text"
                        value={yurtSettings.ad}
                        onChange={(e) => setYurtSettings({ ...yurtSettings, ad: e.target.value })}
                        className="w-full bg-yellow-50/70 border border-yellow-300 rounded-xl p-3 text-stone-900 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-amber-300/30 font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-stone-600 font-semibold block mb-1">Yurt Müdürü / Yetkili Adı:</label>
                        <input
                          type="text"
                          value={yurtSettings.yetkiliAd}
                          onChange={(e) => setYurtSettings({ ...yurtSettings, yetkiliAd: e.target.value })}
                          className="w-full bg-yellow-50/70 border border-yellow-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-amber-300/30 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-stone-600 font-semibold block mb-1">Yetkili Telefon Numarası:</label>
                        <input
                          type="text"
                          value={yurtSettings.yetkiliTel}
                          onChange={(e) => setYurtSettings({ ...yurtSettings, yetkiliTel: e.target.value })}
                          className="w-full bg-yellow-50/70 border border-yellow-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-amber-300/30 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-stone-600 font-semibold block mb-1">Yurt Açık Adresi:</label>
                      <input
                        type="text"
                        value={yurtSettings.adres}
                        onChange={(e) => setYurtSettings({ ...yurtSettings, adres: e.target.value })}
                        className="w-full bg-yellow-50/70 border border-yellow-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-amber-300/30 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-stone-600 font-semibold block mb-1">Toplam Kapasite:</label>
                        <input
                          type="number"
                          value={yurtSettings.kapasite}
                          onChange={(e) => setYurtSettings({ ...yurtSettings, kapasite: Number(e.target.value) })}
                          className="w-full bg-yellow-50/70 border border-yellow-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-amber-300/30 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-stone-600 font-semibold block mb-1">Hafta İçi Son Giriş:</label>
                        <input
                          type="text"
                          value={yurtSettings.sonGirisHaftaIci}
                          onChange={(e) => setYurtSettings({ ...yurtSettings, sonGirisHaftaIci: e.target.value })}
                          placeholder="23:00"
                          className="w-full bg-yellow-50/70 border border-yellow-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-amber-300/30 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-stone-600 font-semibold block mb-1">Hafta Sonu Son Giriş:</label>
                        <input
                          type="text"
                          value={yurtSettings.sonGirisHaftaSonu}
                          onChange={(e) => setYurtSettings({ ...yurtSettings, sonGirisHaftaSonu: e.target.value })}
                          placeholder="23:45"
                          className="w-full bg-yellow-50/70 border border-yellow-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-amber-300/30 font-bold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold rounded-xl cursor-pointer shadow-sm transition-all text-sm mt-2"
                    >
                      💾 Yurt Bilgilerini ve Kurallarını Kaydet
                    </button>
                  </form>
                </div>
              )}
              </div>

              {/* ======================================================== */}
              {/* MODAL: YENİ ODA EKLE */}
              {/* ======================================================== */}
              {isAddRoomModalOpen && (
                <div className="fixed inset-0 z-50 bg-stone-900/40  flex items-center justify-center p-4">
                  <div className="bg-white border border-yellow-200 rounded-3xl p-6 w-full max-w-md shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-stone-900">Yeni Oda Oluştur</h3>
                      <button
                        onClick={() => setIsAddRoomModalOpen(false)}
                        className="text-stone-600 hover:text-stone-950 text-sm cursor-pointer"
                      >
                        
                      </button>
                    </div>

                    <form onSubmit={handleAddRoom} className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-stone-500 block mb-1">Oda Numarası *</label>
                          <input
                            type="text"
                            required
                            placeholder="Örn: 204"
                            value={newRoom.odaNo}
                            onChange={(e) => setNewRoom({ ...newRoom, odaNo: e.target.value })}
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          />
                        </div>
                        <div>
                          <label className="text-stone-500 block mb-1">Blok Seçimi</label>
                          <select
                            value={newRoom.blok}
                            onChange={(e) => setNewRoom({ ...newRoom, blok: e.target.value })}
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          >
                            <option value="A Blok">A Blok</option>
                            <option value="B Blok">B Blok</option>
                            <option value="C Blok">C Blok</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-stone-500 block mb-1">Kat Numarası</label>
                          <input
                            type="number"
                            value={newRoom.kat}
                            onChange={(e) => setNewRoom({ ...newRoom, kat: Number(e.target.value) })}
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          />
                        </div>
                        <div>
                          <label className="text-stone-500 block mb-1">Yatak Kapasitesi *</label>
                          <select
                            value={newRoom.kapasite}
                            onChange={(e) => setNewRoom({ ...newRoom, kapasite: Number(e.target.value) })}
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          >
                            <option value={1}>1 Kişilik (Tek)</option>
                            <option value={2}>2 Kişilik</option>
                            <option value={3}>3 Kişilik</option>
                            <option value={4}>4 Kişilik</option>
                            <option value={5}>5 Kişilik</option>
                            <option value={6}>6 Kişilik</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-stone-500 block mb-1">Oda Tipi</label>
                        <input
                          type="text"
                          value={newRoom.odaTipi}
                          onChange={(e) => setNewRoom({ ...newRoom, odaTipi: e.target.value })}
                          placeholder="Standart Balkonlu, VIP vb."
                          className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => setIsAddRoomModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-yellow-100/70 text-stone-600 cursor-pointer"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold font-bold cursor-pointer"
                        >
                          Odayı Oluştur
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* MODAL: ODA DÜZENLE (YATAK KAPASİTESİ, TİP VB.) */}
              {/* ======================================================== */}
              {editingRoom && (
                <div className="fixed inset-0 z-50 bg-stone-900/40  flex items-center justify-center p-4">
                  <div className="bg-white border border-yellow-200 rounded-3xl p-6 w-full max-w-md shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-stone-900">Oda {editingRoom.odaNo} Ayarlarını Düzenle</h3>
                      <button
                        onClick={() => setEditingRoom(null)}
                        className="text-stone-600 hover:text-stone-950 text-sm cursor-pointer"
                      >
                        
                      </button>
                    </div>

                    <form onSubmit={handleUpdateRoom} className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-stone-500 block mb-1">Oda No:</label>
                          <input
                            type="text"
                            required
                            value={editingRoom.odaNo}
                            onChange={(e) => setEditingRoom({ ...editingRoom, odaNo: e.target.value })}
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          />
                        </div>
                        <div>
                          <label className="text-stone-500 block mb-1">Blok:</label>
                          <select
                            value={editingRoom.blok}
                            onChange={(e) => setEditingRoom({ ...editingRoom, blok: e.target.value })}
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          >
                            <option value="A Blok">A Blok</option>
                            <option value="B Blok">B Blok</option>
                            <option value="C Blok">C Blok</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-stone-500 block mb-1">Kat:</label>
                          <input
                            type="number"
                            value={editingRoom.kat}
                            onChange={(e) => setEditingRoom({ ...editingRoom, kat: Number(e.target.value) })}
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          />
                        </div>
                        <div>
                          <label className="text-stone-500 block mb-1">Yatak Kapasitesi:</label>
                          <select
                            value={editingRoom.kapasite}
                            onChange={(e) => setEditingRoom({ ...editingRoom, kapasite: Number(e.target.value) })}
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          >
                            <option value={1}>1 Kişilik</option>
                            <option value={2}>2 Kişilik</option>
                            <option value={3}>3 Kişilik</option>
                            <option value={4}>4 Kişilik</option>
                            <option value={5}>5 Kişilik</option>
                            <option value={6}>6 Kişilik</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-stone-500 block mb-1">Oda Tipi:</label>
                        <input
                          type="text"
                          value={editingRoom.odaTipi}
                          onChange={(e) => setEditingRoom({ ...editingRoom, odaTipi: e.target.value })}
                          className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => setEditingRoom(null)}
                          className="px-4 py-2 rounded-xl bg-yellow-100/70 text-stone-600 cursor-pointer"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold font-bold cursor-pointer"
                        >
                          Değişiklikleri Kaydet
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* MODAL: ÖĞRENCİ DÜZENLE (HER BİLGİYİ & ODA/YATAĞI DEĞİŞTİR) */}
              {/* ======================================================== */}
              {editingStudent && (
                <div className="fixed inset-0 z-50 bg-stone-900/40  flex items-center justify-center p-4">
                  <div className="bg-white border border-yellow-200 rounded-3xl p-6 w-full max-w-lg shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-stone-900">Öğrenci Bilgilerini Düzenle</h3>
                      <button
                        onClick={() => setEditingStudent(null)}
                        className="text-stone-600 hover:text-stone-950 text-sm cursor-pointer"
                      >
                        
                      </button>
                    </div>

                    <form onSubmit={handleEditStudent} className="space-y-3 text-xs">
                      <div>
                        <label className="text-stone-500 block mb-1">Ad Soyad:</label>
                        <input
                          type="text"
                          required
                          value={editingStudent.adSoyad}
                          onChange={(e) => setEditingStudent({ ...editingStudent, adSoyad: e.target.value })}
                          className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-stone-500 block mb-1">Telefon:</label>
                          <input
                            type="text"
                            value={editingStudent.telefon}
                            onChange={(e) => setEditingStudent({ ...editingStudent, telefon: e.target.value })}
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          />
                        </div>
                        <div>
                          <label className="text-stone-500 block mb-1">E-Posta:</label>
                          <input
                            type="email"
                            value={editingStudent.eposta}
                            onChange={(e) => setEditingStudent({ ...editingStudent, eposta: e.target.value })}
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          />
                        </div>
                      </div>

                      {/* ODA & YATAK DEĞİŞTİRME */}
                      <div className="p-3 bg-yellow-100/70 border border-yellow-300 rounded-2xl space-y-2">
                        <span className="text-[11px] font-bold text-stone-800 font-medium block">
                          Oda & Yatak Değiştirme:
                        </span>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-stone-500 block mb-1">Oda Seçimi:</label>
                            <select
                              value={editingStudent.odaNo}
                              onChange={(e) => setEditingStudent({ ...editingStudent, odaNo: e.target.value })}
                              className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                            >
                              {rooms.map((r) => (
                                <option key={r.id} value={r.odaNo}>
                                  Oda {r.odaNo} ({r.blok} - {r.kapasite} Yataklı)
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-stone-500 block mb-1">Yatak No:</label>
                            <select
                              value={editingStudent.yatakNo}
                              onChange={(e) => setEditingStudent({ ...editingStudent, yatakNo: e.target.value })}
                              className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                            >
                              <option value="1">Yatak 1</option>
                              <option value="2">Yatak 2</option>
                              <option value="3">Yatak 3</option>
                              <option value="4">Yatak 4</option>
                              <option value="5">Yatak 5</option>
                              <option value="6">Yatak 6</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-stone-500 block mb-1">Veli Adı:</label>
                          <input
                            type="text"
                            value={editingStudent.veliAd}
                            onChange={(e) => setEditingStudent({ ...editingStudent, veliAd: e.target.value })}
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          />
                        </div>
                        <div>
                          <label className="text-stone-500 block mb-1">Veli Telefonu:</label>
                          <input
                            type="text"
                            value={editingStudent.veliTel}
                            onChange={(e) => setEditingStudent({ ...editingStudent, veliTel: e.target.value })}
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          />
                        </div>
                      </div>


                      <div className="flex justify-end gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => setEditingStudent(null)}
                          className="px-4 py-2 rounded-xl bg-yellow-100/70 text-stone-600 cursor-pointer"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold font-bold cursor-pointer"
                        >
                          Kaydet ve Güncelle
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* MODAL: YENİ ÖĞRENCİ EKLE */}
              {/* ======================================================== */}
              {isAddStudentModalOpen && (
                <div className="fixed inset-0 z-50 bg-stone-900/40  flex items-center justify-center p-4">
                  <div className="bg-white border border-yellow-200 rounded-3xl p-6 w-full max-w-lg shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-stone-900">Yeni Öğrenci Kaydı</h3>
                      <button
                        onClick={() => setIsAddStudentModalOpen(false)}
                        className="text-stone-600 hover:text-stone-950 text-sm cursor-pointer"
                      >
                        
                      </button>
                    </div>

                    <form onSubmit={handleAddStudent} className="space-y-3 text-xs">
                      <div>
                        <label className="text-stone-500 block mb-1">Ad Soyad *</label>
                        <input
                          type="text"
                          required
                          value={newStudent.adSoyad}
                          onChange={(e) => setNewStudent({ ...newStudent, adSoyad: e.target.value })}
                          placeholder="Ad Soyad..."
                          className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-stone-500 block mb-1">Telefon No *</label>
                          <input
                            type="text"
                            required
                            value={newStudent.telefon}
                            onChange={(e) => setNewStudent({ ...newStudent, telefon: e.target.value })}
                            placeholder="05xx xxx xx xx"
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          />
                        </div>
                        <div>
                          <label className="text-stone-500 block mb-1">E-Posta</label>
                          <input
                            type="email"
                            value={newStudent.eposta}
                            onChange={(e) => setNewStudent({ ...newStudent, eposta: e.target.value })}
                            placeholder="ogrenci@gmail.com"
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-stone-500 block mb-1">Oda Seçimi</label>
                          <select
                            value={newStudent.odaNo}
                            onChange={(e) => setNewStudent({ ...newStudent, odaNo: e.target.value })}
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          >
                            {rooms.map((r) => (
                              <option key={r.id} value={r.odaNo}>
                                Oda {r.odaNo} ({r.blok} - {r.kapasite - r.doluYatak} Boş)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-stone-500 block mb-1">Yatak No</label>
                          <select
                            value={newStudent.yatakNo}
                            onChange={(e) => setNewStudent({ ...newStudent, yatakNo: e.target.value })}
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          >
                            <option value="1">Yatak 1</option>
                            <option value="2">Yatak 2</option>
                            <option value="3">Yatak 3</option>
                            <option value="4">Yatak 4</option>
                            <option value="5">Yatak 5</option>
                            <option value="6">Yatak 6</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-yellow-200">
                        <div>
                          <label className="text-stone-500 block mb-1">Veli Ad Soyad</label>
                          <input
                            type="text"
                            value={newStudent.veliAd}
                            onChange={(e) => setNewStudent({ ...newStudent, veliAd: e.target.value })}
                            placeholder="Veli adı..."
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          />
                        </div>
                        <div>
                          <label className="text-stone-500 block mb-1">Veli Telefonu</label>
                          <input
                            type="text"
                            value={newStudent.veliTel}
                            onChange={(e) => setNewStudent({ ...newStudent, veliTel: e.target.value })}
                            placeholder="05xx xxx xx xx"
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => setIsAddStudentModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-yellow-100/70 text-stone-600 cursor-pointer"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold font-bold cursor-pointer"
                        >
                          Kaydet ve Odaya Yerleştir
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}


              {/* ======================================================== */}
              {/* MODAL: YENİ ÇAMAŞIR SIRASI EKLE */}
              {/* ======================================================== */}
              {isAddLaundryModalOpen && (
                <div className="fixed inset-0 z-50 bg-stone-900/40 flex items-center justify-center p-4">
                  <div className="bg-white border border-yellow-200 rounded-3xl p-6 w-full max-w-md shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-yellow-200 pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-stone-900">Yeni Çamaşır Sırası Ekle</h3>
                        <p className="text-xs text-stone-500">Öğrenciye makine ve saat aralığı rezerve edin.</p>
                      </div>
                      <button
                        onClick={() => setIsAddLaundryModalOpen(false)}
                        className="text-stone-400 hover:text-stone-700 text-lg cursor-pointer font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleSaveLaundry} className="space-y-3.5 text-xs">
                      <div>
                        <label className="text-stone-600 font-semibold block mb-1">Öğrenci Adı Soyadı *</label>
                        <input
                          type="text"
                          required
                          placeholder="Örn: Zeynep Lermi"
                          value={newLaundry.ogrenciAd}
                          onChange={(e) => setNewLaundry({ ...newLaundry, ogrenciAd: e.target.value })}
                          className="w-full bg-yellow-50/70 border border-yellow-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-yellow-400 font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-stone-600 font-semibold block mb-1">Oda Numarası *</label>
                          <input
                            type="text"
                            required
                            placeholder="Örn: 305"
                            value={newLaundry.odaNo}
                            onChange={(e) => setNewLaundry({ ...newLaundry, odaNo: e.target.value })}
                            className="w-full bg-yellow-50/70 border border-yellow-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-yellow-400 font-medium"
                          />
                        </div>

                        <div>
                          <label className="text-stone-600 font-semibold block mb-1">Tarih *</label>
                          <input
                            type="date"
                            required
                            value={newLaundry.tarih}
                            onChange={(e) => setNewLaundry({ ...newLaundry, tarih: e.target.value })}
                            className="w-full bg-yellow-50/70 border border-yellow-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-yellow-400 font-medium"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-stone-600 font-semibold block mb-1">Makine Seçimi *</label>
                          <select
                            value={newLaundry.makineNo}
                            onChange={(e) => setNewLaundry({ ...newLaundry, makineNo: e.target.value })}
                            className="w-full bg-yellow-50/70 border border-yellow-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-yellow-400 font-medium"
                          >
                            {laundryMachines.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.tip})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-stone-600 font-semibold block mb-1">Saat Dilimi *</label>
                          <select
                            value={newLaundry.saatAraligi}
                            onChange={(e) => setNewLaundry({ ...newLaundry, saatAraligi: e.target.value })}
                            className="w-full bg-yellow-50/70 border border-yellow-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-yellow-400 font-medium"
                          >
                            <option value="09:00 - 10:30">09:00 - 10:30</option>
                            <option value="10:30 - 12:00">10:30 - 12:00</option>
                            <option value="13:00 - 14:30">13:00 - 14:30</option>
                            <option value="15:00 - 16:30">15:00 - 16:30</option>
                            <option value="17:00 - 18:30">17:00 - 18:30</option>
                            <option value="19:00 - 20:30">19:00 - 20:30</option>
                            <option value="20:30 - 22:00">20:30 - 22:00</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-stone-600 font-semibold block mb-1">Yıkama Programı</label>
                          <select
                            value={newLaundry.program}
                            onChange={(e) => setNewLaundry({ ...newLaundry, program: e.target.value as any })}
                            className="w-full bg-yellow-50/70 border border-yellow-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-yellow-400 font-medium"
                          >
                            <option value="Renkli & Karışık">Renkli & Karışık</option>
                            <option value="Beyazlar & Pamuklu">Beyazlar & Pamuklu</option>
                            <option value="Hızlı Yıkama (30 dk)">Hızlı Yıkama (30 dk)</option>
                            <option value="Kurutma & Havalandırma">Kurutma & Havalandırma</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-stone-600 font-semibold block mb-1">Başlangıç Durumu</label>
                          <select
                            value={newLaundry.durum}
                            onChange={(e) => setNewLaundry({ ...newLaundry, durum: e.target.value as any })}
                            className="w-full bg-yellow-50/70 border border-yellow-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-yellow-400 font-medium"
                          >
                            <option value="Sırada">Sırada Bekliyor</option>
                            <option value="Yıkanıyor">Şu An Yıkanıyor</option>
                            <option value="Tamamlandı">Tamamlandı</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-stone-600 font-semibold block mb-1">Özel Not (Opsiyonel)</label>
                        <input
                          type="text"
                          placeholder="Örn: 40 derece, yumuşatıcı makine yanında..."
                          value={newLaundry.not}
                          onChange={(e) => setNewLaundry({ ...newLaundry, not: e.target.value })}
                          className="w-full bg-yellow-50/70 border border-yellow-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-yellow-400 font-medium"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddLaundryModalOpen(false)}
                          className="flex-1 py-2.5 rounded-xl bg-yellow-100 hover:bg-yellow-200 text-stone-700 font-bold cursor-pointer transition-colors"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold shadow-sm transition-all cursor-pointer"
                        >
                          Sıraya Ekle
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}


              {/* ======================================================== */}
              {/* MODAL: ÇAMAŞIRHANE MAKİNELERİNİ YÖNET & SAYI AYARLA */}
              {/* ======================================================== */}
              {isManageMachinesModalOpen && (() => {
                const washingCount = laundryMachines.filter((m) => m.tur === "yikama" || m.tip.toLowerCase().includes("yıkama") || m.id.includes("Makine")).length;
                const dryerCount = laundryMachines.filter((m) => m.tur === "kurutma" || m.tip.toLowerCase().includes("kurutma") || m.id.includes("Kurutma")).length;

                return (
                  <div className="fixed inset-0 z-50 bg-stone-900/40 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white border border-yellow-200 rounded-3xl p-6 w-full max-w-xl shadow-lg space-y-5 my-8">
                      <div className="flex justify-between items-center border-b border-yellow-200 pb-3">
                        <div>
                          <h3 className="text-lg font-bold text-stone-900">Çamaşırhane Makine Ayarları</h3>
                          <p className="text-xs text-stone-500">Mevcut yıkama ve kurutma makinesi sayılarını anında artırıp azaltabilir veya özel makine ekleyebilirsiniz.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsManageMachinesModalOpen(false)}
                          className="text-stone-400 hover:text-stone-700 text-sm cursor-pointer font-bold px-2 py-1 rounded-lg"
                        >
                          ✕
                        </button>
                      </div>

                      {/* 1. HIZLI SAYI AYARLAYICILAR (STEPPER) */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-stone-800 block">Hızlı Makine Sayısı Ayarı</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Yıkama Makineleri Stepper */}
                          <div className="p-4 bg-yellow-50/80 border border-yellow-200 rounded-2xl flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-stone-800">Çamaşır Yıkama</div>
                              <div className="text-[11px] text-stone-500">Standart 8-9 kg</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleQuickSetCount("yikama", -1)}
                                disabled={washingCount <= 1}
                                className="w-8 h-8 rounded-xl bg-white border border-yellow-300 hover:bg-yellow-100 text-stone-800 font-black text-sm flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm"
                                title="1 makine azalt"
                              >
                                -
                              </button>
                              <span className="w-10 text-center font-black text-base text-stone-900">{washingCount}</span>
                              <button
                                type="button"
                                onClick={() => handleQuickSetCount("yikama", 1)}
                                className="w-8 h-8 rounded-xl bg-yellow-300 hover:bg-yellow-400 border border-yellow-400 text-stone-900 font-black text-sm flex items-center justify-center cursor-pointer transition-all shadow-sm active:scale-95"
                                title="1 makine ekle"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Kurutma Makineleri Stepper */}
                          <div className="p-4 bg-yellow-50/80 border border-yellow-200 rounded-2xl flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-stone-800">Kurutma Makinesi</div>
                              <div className="text-[11px] text-stone-500">Merkezi 10 kg</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleQuickSetCount("kurutma", -1)}
                                disabled={dryerCount <= 0}
                                className="w-8 h-8 rounded-xl bg-white border border-yellow-300 hover:bg-yellow-100 text-stone-800 font-black text-sm flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm"
                                title="1 kurutucu azalt"
                              >
                                -
                              </button>
                              <span className="w-10 text-center font-black text-base text-stone-900">{dryerCount}</span>
                              <button
                                type="button"
                                onClick={() => handleQuickSetCount("kurutma", 1)}
                                className="w-8 h-8 rounded-xl bg-yellow-300 hover:bg-yellow-400 border border-yellow-400 text-stone-900 font-black text-sm flex items-center justify-center cursor-pointer transition-all shadow-sm active:scale-95"
                                title="1 kurutucu ekle"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. MEVCUT MAKİNELER LİSTESİ */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-stone-800">Mevcut Makineler ({laundryMachines.length})</span>
                          <span className="text-[11px] text-stone-500">Otomatik takvim ve sıra sütunları güncellenir</span>
                        </div>

                        <div className="max-h-44 overflow-y-auto space-y-1.5 p-2 bg-yellow-50/40 border border-yellow-200 rounded-2xl">
                          {laundryMachines.map((m) => (
                            <div
                              key={m.id}
                              className="p-2.5 bg-white border border-yellow-200 rounded-xl flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  m.tur === "kurutma" || m.id.includes("Kurutma")
                                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                                    : "bg-yellow-100 text-stone-800 border border-yellow-300"
                                }`}>
                                  {m.tur === "kurutma" || m.id.includes("Kurutma") ? "Kurutma" : "Yıkama"}
                                </span>
                                <div>
                                  <span className="font-bold text-stone-800 block">{m.name}</span>
                                  <span className="text-[10px] text-stone-500">{m.tip}</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteMachine(m.id)}
                                disabled={laundryMachines.length <= 1}
                                className="text-[11px] text-stone-400 hover:text-rose-600 font-semibold px-2 py-1 rounded cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Bu makineyi kaldır"
                              >
                                Sil
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 3. ÖZEL YENİ MAKİNE TANIMLAMA FORMU */}
                      <form onSubmit={handleAddCustomMachine} className="p-3.5 bg-yellow-50/70 border border-yellow-300 rounded-2xl space-y-3 text-xs">
                        <span className="font-bold text-stone-800 block text-xs">
                          + İsteğe Bağlı Özel Makine Ekle
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[11px] text-stone-600 block mb-1">Makine Adı / Kodu:</label>
                            <input
                              type="text"
                              required
                              placeholder="Örn: Makine 5 veya Hızlı Yıkama-1"
                              value={newCustomMachine.name}
                              onChange={(e) => setNewCustomMachine({ ...newCustomMachine, name: e.target.value })}
                              className="w-full bg-white border border-yellow-300 rounded-xl p-2 text-stone-900 focus:outline-none focus:border-yellow-400"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-stone-600 block mb-1">Blok / Konum:</label>
                            <select
                              value={newCustomMachine.blok}
                              onChange={(e) => setNewCustomMachine({ ...newCustomMachine, blok: e.target.value })}
                              className="w-full bg-white border border-yellow-300 rounded-xl p-2 text-stone-900 focus:outline-none focus:border-yellow-400 font-medium"
                            >
                              <option value="A Blok">A Blok</option>
                              <option value="B Blok">B Blok</option>
                              <option value="C Blok">C Blok</option>
                              <option value="Zemin Kat">Zemin Kat</option>
                              <option value="Merkez">Merkez</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[11px] text-stone-600 block mb-1">Makine Türü:</label>
                            <select
                              value={newCustomMachine.tur}
                              onChange={(e) => setNewCustomMachine({ ...newCustomMachine, tur: e.target.value as any })}
                              className="w-full bg-white border border-yellow-300 rounded-xl p-2 text-stone-900 focus:outline-none focus:border-yellow-400 font-medium"
                            >
                              <option value="yikama">Çamaşır Yıkama Makinesi</option>
                              <option value="kurutma">Kurutma Makinesi</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] text-stone-600 block mb-1">Kapasite (kg):</label>
                            <select
                              value={newCustomMachine.kapasiteKg}
                              onChange={(e) => setNewCustomMachine({ ...newCustomMachine, kapasiteKg: Number(e.target.value) })}
                              className="w-full bg-white border border-yellow-300 rounded-xl p-2 text-stone-900 focus:outline-none focus:border-yellow-400 font-medium"
                            >
                              <option value={7}>7 kg</option>
                              <option value={8}>8 kg</option>
                              <option value={9}>9 kg</option>
                              <option value={10}>10 kg</option>
                              <option value={12}>12 kg</option>
                              <option value={15}>15 kg Endüstriyel</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold rounded-xl cursor-pointer transition-all shadow-sm"
                        >
                          Özel Makineyi Listeye Ekle
                        </button>
                      </form>

                      {/* Modal Footer */}
                      <div className="flex justify-end pt-2 border-t border-yellow-200">
                        <button
                          type="button"
                          onClick={() => setIsManageMachinesModalOpen(false)}
                          className="px-6 py-2.5 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold text-xs cursor-pointer transition-all shadow-sm"
                        >
                          Tamamla ve Kapat
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}


              {/* ======================================================== */}
              {/* MODAL: YENİ ARIZA KAYDI */}
              {/* ======================================================== */}
              {isAddMaintenanceModalOpen && (
                <div className="fixed inset-0 z-50 bg-stone-900/40  flex items-center justify-center p-4">
                  <div className="bg-white border border-yellow-200 rounded-3xl p-6 w-full max-w-md shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-stone-900">Yeni Arıza Kaydı</h3>
                      <button
                        onClick={() => setIsAddMaintenanceModalOpen(false)}
                        className="text-stone-600 hover:text-stone-950 text-sm cursor-pointer"
                      >
                        
                      </button>
                    </div>

                    <form onSubmit={handleAddMaintenance} className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-stone-500 block mb-1">Oda No</label>
                          <input
                            type="text"
                            required
                            value={newMaintenance.odaNo}
                            onChange={(e) => setNewMaintenance({ ...newMaintenance, odaNo: e.target.value })}
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          />
                        </div>
                        <div>
                          <label className="text-stone-500 block mb-1">Kategori</label>
                          <select
                            value={newMaintenance.kategori}
                            onChange={(e) =>
                              setNewMaintenance({ ...newMaintenance, kategori: e.target.value as any })
                            }
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          >
                            <option value="Tesisat">Tesisat</option>
                            <option value="Elektrik">Elektrik</option>
                            <option value="İnternet">İnternet</option>
                            <option value="Mobilya">Mobilya</option>
                            <option value="Diğer">Diğer</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-stone-500 block mb-1">Arıza Başlığı / Açıklaması *</label>
                        <input
                          type="text"
                          required
                          value={newMaintenance.baslik}
                          onChange={(e) => setNewMaintenance({ ...newMaintenance, baslik: e.target.value })}
                          placeholder="Lavabo bataryası damlatıyor vb."
                          className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-stone-500 block mb-1">Öncelik Derecesi</label>
                          <select
                            value={newMaintenance.oncelik}
                            onChange={(e) =>
                              setNewMaintenance({ ...newMaintenance, oncelik: e.target.value as any })
                            }
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          >
                            <option value="Düşük">Düşük</option>
                            <option value="Orta">Orta</option>
                            <option value="Acil">Acil</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-stone-500 block mb-1">Bildiren Kişi</label>
                          <input
                            type="text"
                            value={newMaintenance.bildiren}
                            onChange={(e) => setNewMaintenance({ ...newMaintenance, bildiren: e.target.value })}
                            className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => setIsAddMaintenanceModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-yellow-100/70 text-stone-600 cursor-pointer"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-yellow-500 text-white font-bold cursor-pointer"
                        >
                          Kaydı Aç
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* MODAL: YENİ DUYURU */}
              {/* ======================================================== */}
              {isAddAnnouncementModalOpen && (
                <div className="fixed inset-0 z-50 bg-stone-900/40  flex items-center justify-center p-4">
                  <div className="bg-white border border-yellow-200 rounded-3xl p-6 w-full max-w-md shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-stone-900">Yeni Duyuru Yayınla</h3>
                      <button
                        onClick={() => setIsAddAnnouncementModalOpen(false)}
                        className="text-stone-600 hover:text-stone-950 text-sm cursor-pointer"
                      >
                        
                      </button>
                    </div>

                    <form onSubmit={handleAddAnnouncement} className="space-y-3 text-xs">
                      <div>
                        <label className="text-stone-500 block mb-1">Duyuru Başlığı *</label>
                        <input
                          type="text"
                          required
                          value={newAnnouncement.baslik}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, baslik: e.target.value })}
                          placeholder="Duyuru başlığı..."
                          className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                        />
                      </div>

                      <div>
                        <label className="text-stone-500 block mb-1">Öncelik Derecesi</label>
                        <select
                          value={newAnnouncement.oncelik}
                          onChange={(e) =>
                            setNewAnnouncement({ ...newAnnouncement, oncelik: e.target.value as any })
                          }
                          className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                        >
                          <option value="Normal">Normal</option>
                          <option value="Önemli">Önemli</option>
                          <option value="Acil">Acil</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-stone-500 block mb-1">Duyuru Metni *</label>
                        <textarea
                          rows={4}
                          required
                          value={newAnnouncement.icerik}
                          onChange={(e) => setNewAnnouncement({ ...newAnnouncement, icerik: e.target.value })}
                          placeholder="Duyuru içeriği..."
                          className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => setIsAddAnnouncementModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-yellow-100/70 text-stone-600 cursor-pointer"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold font-bold cursor-pointer"
                        >
                          Yayınla
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* MODAL: ÖĞRENCİ DETAY KARTI */}
              {/* ======================================================== */}
              {selectedStudentForDetail && (
                <div className="fixed inset-0 z-50 bg-stone-900/40  flex items-center justify-center p-4">
                  <div className="bg-white border border-yellow-200 rounded-3xl p-6 w-full max-w-md shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-yellow-100 text-stone-800 border border-yellow-300 text-stone-800 font-medium">
                          Öğrenci Kütük Kartı
                        </span>
                        <h3 className="text-xl font-black text-stone-900 mt-1">
                          {selectedStudentForDetail.adSoyad}
                        </h3>
                      </div>
                      <button
                        onClick={() => setSelectedStudentForDetail(null)}
                        className="text-stone-600 hover:text-stone-950 text-sm cursor-pointer"
                      >
                        
                      </button>
                    </div>

                    <div className="space-y-3 text-xs bg-yellow-50 p-4 rounded-2xl border border-yellow-200">
                      <div className="flex justify-between py-1 border-b border-yellow-200">
                        <span className="text-stone-500">Oda & Yatak:</span>
                        <span className="font-bold text-stone-800 font-medium">
                          Oda {selectedStudentForDetail.odaNo} / Yatak {selectedStudentForDetail.yatakNo}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-yellow-200">
                        <span className="text-stone-500">Öğrenci Telefonu:</span>
                        <a
                          href={`tel:${selectedStudentForDetail.telefon}`}
                          className="font-bold text-emerald-400 hover:underline"
                        >
                          {selectedStudentForDetail.telefon}
                        </a>
                      </div>
                      <div className="flex justify-between py-1 border-b border-yellow-200">
                        <span className="text-stone-500">E-Posta:</span>
                        <span className="text-stone-700">{selectedStudentForDetail.eposta}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-yellow-200">
                        <span className="text-stone-500">Veli Bilgisi:</span>
                        <span className="font-bold text-stone-800">{selectedStudentForDetail.veliAd}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-yellow-200">
                        <span className="text-stone-500">Veli Telefonu:</span>
                        <a
                          href={`tel:${selectedStudentForDetail.veliTel}`}
                          className="font-bold text-emerald-400 hover:underline"
                        >
                          {selectedStudentForDetail.veliTel}
                        </a>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-stone-500">Kayıt Tarihi:</span>
                        <span className="text-stone-600">{selectedStudentForDetail.kayitTarihi}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => {
                          const target = selectedStudentForDetail;
                          setSelectedStudentForDetail(null);
                          setEditingStudent(target);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold font-bold text-xs cursor-pointer"
                      >
                        Bilgileri / Odayı Düzenle
                      </button>
                      <button
                        onClick={() => setSelectedStudentForDetail(null)}
                        className="py-2.5 px-4 rounded-xl bg-yellow-100/70 hover:bg-yellow-100 text-stone-700 font-bold text-xs cursor-pointer"
                      >
                        Kapat
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ========================================================= */}
        {/* C. ÖĞRENCİ PANELİ */}
        {/* ========================================================= */}
        {currentUser.role === "ogrenci" && (
          <div className="space-y-6">
            <div className="bg-white border border-[#E8DCCF] p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-[#3D110B]">Hoş geldin, {currentUser.name}!</h2>
                <p className="text-sm text-[#855342] mt-1">
                  Kayıtlı Yurt: <strong className="text-[#3D110B]">{currentUser.selectedYurtName || yurtlar[0]?.ad}</strong> • Oda:{" "}
                  <strong className="text-[#662B16]">B-305</strong> • Yatak:{" "}
                  <strong className="text-[#662B16]">1</strong>
                </p>
              </div>
              <span className="px-3.5 py-1.5 rounded-xl bg-[#F4ECE1] text-xs font-bold text-[#662B16] border border-[#E8DCCF]">
                Giriş Turnikesi: Aktif
              </span>
            </div>

            {/* Öğrenci Yemekhane Menüsü (Yönetici Tercihlerine Göre Canlı Yansır) */}
            <div className="bg-white border border-[#E8DCCF] p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[#3D110B] flex items-center gap-2">
                    Günün Yemekhane Menüsü
                  </h3>
                  <p className="text-xs text-[#855342] mt-0.5">
                    Yurt idaresi tarafından yayınlanan güncel menü
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-[#F4ECE1] text-[#99501B] border border-[#D1841A]/30">
                    {dailyMenu.gunTipi === "haftasonu" ? "Hafta Sonu Tarifesi" : dailyMenu.gunTipi === "ozelgun" ? "Bayram / Özel Gün" : "Hafta İçi Tarifesi"}
                  </span>
                  <span className="text-[11px] font-semibold px-3 py-1 rounded-xl bg-[#FAF7F2] text-[#662B16] border border-[#E8DCCF]">
                    {dailyMenu.gorunumModu === "birlikte" ? "Kahvaltı & Akşam Yemeği" : (dailyMenu.aktifOgun === "kahvalti" ? "Sabah Servisi" : "Akşam Servisi")}
                  </span>
                </div>
              </div>

              {dailyMenu.gorunumModu === "birlikte" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sabah Kahvaltısı */}
                  <div className="p-4 bg-yellow-50/70 border border-yellow-300/80 rounded-2xl space-y-2.5 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 border border-yellow-300">
                         Sabah Kahvaltısı
                      </span>
                      <span className="text-xs font-semibold text-stone-600 bg-white px-2.5 py-0.5 rounded-lg border border-yellow-200">
                        {dailyMenu.kahvaltiSaat}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed font-medium">
                      {dailyMenu.kahvalti}
                    </p>
                    <div className="text-[11px] text-stone-500 pt-2 border-t border-yellow-200 flex justify-between items-center">
                      {dailyMenu.kaloriGoster ? (
                        <span>Tahmini Kalori: <strong className="text-amber-800 font-bold">{dailyMenu.kahvaltiKalori}</strong></span>
                      ) : (
                        <span className="text-stone-500 text-[11px]">Günün Servisi</span>
                      )}
                      <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Servis Hazır
                      </span>
                    </div>
                  </div>

                  {/* Akşam Yemeği */}
                  <div className="p-4 bg-yellow-50/70 border border-yellow-300/80 rounded-2xl space-y-2.5 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 border border-yellow-300">
                         Akşam Yemeği
                      </span>
                      <span className="text-xs font-semibold text-stone-600 bg-white px-2.5 py-0.5 rounded-lg border border-yellow-200">
                        {dailyMenu.aksamSaat}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed font-medium">
                      {dailyMenu.aksam}
                    </p>
                    <div className="text-[11px] text-stone-500 pt-2 border-t border-yellow-200 flex justify-between items-center">
                      {dailyMenu.kaloriGoster ? (
                        <span>Tahmini Kalori: <strong className="text-amber-800 font-bold">{dailyMenu.aksamKalori}</strong></span>
                      ) : (
                        <span className="text-stone-500 text-[11px]">Günün Servisi</span>
                      )}
                      <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sıcak Servis
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Tek Öğün Görünümü */
                dailyMenu.aktifOgun === "kahvalti" ? (
                  <div className="p-4 bg-yellow-50/70 border border-yellow-300/80 rounded-2xl space-y-2.5 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 border border-yellow-300">
                         Sabah Kahvaltısı Servisi
                      </span>
                      <span className="text-xs font-semibold text-stone-600 bg-white px-2.5 py-0.5 rounded-lg border border-yellow-200">
                        {dailyMenu.kahvaltiSaat}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed font-medium">
                      {dailyMenu.kahvalti}
                    </p>
                    <div className="text-[11px] text-stone-500 pt-2 border-t border-yellow-200 flex justify-between items-center">
                      {dailyMenu.kaloriGoster ? (
                        <span>Tahmini Kalori: <strong className="text-amber-800 font-bold">{dailyMenu.kahvaltiKalori}</strong></span>
                      ) : (
                        <span className="text-stone-500 text-[11px]">Günün Servisi</span>
                      )}
                      <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Servis Hazır
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50/70 border border-yellow-300/80 rounded-2xl space-y-2.5 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 border border-yellow-300">
                         Akşam Yemeği Servisi
                      </span>
                      <span className="text-xs font-semibold text-stone-600 bg-white px-2.5 py-0.5 rounded-lg border border-yellow-200">
                        {dailyMenu.aksamSaat}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed font-medium">
                      {dailyMenu.aksam}
                    </p>
                    <div className="text-[11px] text-stone-500 pt-2 border-t border-yellow-200 flex justify-between items-center">
                      {dailyMenu.kaloriGoster ? (
                        <span>Tahmini Kalori: <strong className="text-amber-800 font-bold">{dailyMenu.aksamKalori}</strong></span>
                      ) : (
                        <span className="text-stone-500 text-[11px]">Günün Servisi</span>
                      )}
                      <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sıcak Servis
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Yurt Duyuruları */}
              <div className="bg-white p-6 rounded-3xl border border-yellow-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                     Güncel Yurt Duyuruları
                  </h3>
                  <span className="text-[10px] text-stone-500">Pano</span>
                </div>
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {announcements.length === 0 ? (
                    <div className="p-4 text-center text-xs text-stone-500">
                      Aktif duyuru bulunmamaktadır.
                    </div>
                  ) : (
                    announcements.map((anc) => (
                      <div
                        key={anc.id}
                        className="p-3.5 rounded-2xl bg-yellow-50 border border-yellow-200 space-y-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-stone-800">{anc.baslik}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              anc.oncelik === "Acil"
                                ? "bg-rose-500/20 text-rose-400"
                                : anc.oncelik === "Önemli"
                                ? "bg-yellow-500/20 text-yellow-600"
                                : "bg-yellow-100 text-stone-800 border border-yellow-300 text-stone-800 font-medium"
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

              {/* Arıza & Teknik Destek Bildirimi */}
              <div className="bg-white p-6 rounded-3xl border border-yellow-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                     Arıza & Destek Bildirimi
                  </h3>
                  <span className="text-[10px] text-stone-500">Oda B-305</span>
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
                      odaNo: "305",
                      baslik: baslikInput.value.trim(),
                      kategori: (katInput.value as any) || "Tesisat",
                      oncelik: "Orta",
                      durum: "Açık",
                      bildiren: currentUser?.name || "Öğrenci",
                      tarih: new Date().toLocaleDateString("tr-TR"),
                    };

                    const updated = [newTicket, ...maintenanceTickets];
                    setMaintenanceTickets(updated);
                    if (typeof window !== "undefined") {
                      localStorage.setItem("yurtify_maintenance", JSON.stringify(updated));
                    }
                    baslikInput.value = "";
                    showToast("Arıza bildiriminiz idareye iletildi!");
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="text-stone-500 block mb-1">Kategori</label>
                    <select
                      name="arizaKat"
                      defaultValue="Tesisat"
                      className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-2.5 text-stone-900 bg-white focus:outline-none focus:border-yellow-300"
                    >
                      <option value="Tesisat">Sıhhi Tesisat / Banyo</option>
                      <option value="Elektrik">Elektrik / Aydınlatma</option>
                      <option value="İnternet">Wi-Fi / İnternet</option>
                      <option value="Mobilya">Mobilya / Dolap / Yatak</option>
                      <option value="Diğer">Diğer Konular</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-stone-500 block mb-1">Arıza Açıklaması</label>
                    <textarea
                      name="arizaBaslik"
                      required
                      rows={3}
                      placeholder="Örn: Odamızdaki duş başlığı su kaçırıyor..."
                      className="w-full bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-stone-900 bg-white placeholder-stone-400 focus:outline-none focus:border-yellow-300"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold font-bold rounded-xl cursor-pointer transition-all"
                  >
                    Talebi İdareye İlet
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-yellow-200 bg-yellow-50 px-6 py-4 text-center text-xs text-slate-500">
        Yurtify Çoklu Yurt Yönetim ve Otomasyon Sistemi
      </footer>

      {/* ======================================================== */}
      {/* ZAMAN SEÇİCİ (WHEEL / SCROLL TIME PICKER) MODALI */}
      {/* ======================================================== */}
      {timePickerModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40  animate-in fade-in duration-200"
          onClick={() => setTimePickerModal((prev) => ({ ...prev, isOpen: false }))}
        >
          <div
            className="bg-white border border-yellow-300 rounded-3xl max-w-lg w-full p-6 shadow-sm space-y-5 text-white animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Başlığı */}
            <div className="flex items-center justify-between pb-3 border-b border-yellow-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-yellow-100 text-yellow-700 border border-yellow-300 flex items-center justify-center text-lg">
                  </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                    Servis Saati Aralığını Ayarla
                  </h4>
                  <p className="text-[11px] text-stone-500 font-medium">
                    {timePickerModal.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTimePickerModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-8 h-8 rounded-full bg-yellow-100/70 hover:bg-yellow-100 text-stone-600 hover:text-stone-950 flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                
              </button>
            </div>

            {/* Hızlı Hazır Seçenekler */}
            <div>
              <span className="text-[11px] font-semibold text-stone-500 block mb-1.5 flex items-center gap-1">
                 Hızlı Şablonlar:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(timePickerModal.field === "kahvalti"
                  ? [
                      { label: "07:00 - 09:30", sH: 7, sM: 0, eH: 9, eM: 30 },
                      { label: "07:30 - 10:00", sH: 7, sM: 30, eH: 10, eM: 0 },
                      { label: "08:00 - 10:30", sH: 8, sM: 0, eH: 10, eM: 30 },
                      { label: "08:30 - 11:30", sH: 8, sM: 30, eH: 11, eM: 30 },
                      { label: "09:00 - 12:00", sH: 9, sM: 0, eH: 12, eM: 0 },
                    ]
                  : [
                      { label: "17:30 - 20:00", sH: 17, sM: 30, eH: 20, eM: 0 },
                      { label: "18:00 - 20:30", sH: 18, sM: 0, eH: 20, eM: 30 },
                      { label: "18:30 - 21:00", sH: 18, sM: 30, eH: 21, eM: 0 },
                      { label: "19:00 - 21:30", sH: 19, sM: 0, eH: 21, eM: 30 },
                      { label: "19:30 - 22:00", sH: 19, sM: 30, eH: 22, eM: 0 },
                    ]
                ).map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setTimePickerModal((prev) => ({
                        ...prev,
                        startHour: item.sH,
                        startMinute: item.sM,
                        endHour: item.eH,
                        endMinute: item.eM,
                      }));
                      setTimeout(() => {
                        document.getElementById(`wheel-sh-${item.sH}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                        document.getElementById(`wheel-sm-${item.sM}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                        document.getElementById(`wheel-eh-${item.eH}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                        document.getElementById(`wheel-em-${item.eM}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                      }, 50);
                    }}
                    className="px-2.5 py-1 rounded-xl text-xs font-mono font-medium bg-yellow-50 border border-yellow-200 text-stone-600 hover:border-yellow-300 hover:text-stone-800 font-medium hover:bg-indigo-950/20 transition-all cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kaydırmalı Saat Çarkları (Başlangıç ve Bitiş) */}
            <div className="grid grid-cols-2 gap-3.5 p-3.5 bg-yellow-50 rounded-2xl border border-yellow-200">
              {/* Başlangıç Saati Çarkı */}
              <div className="flex flex-col items-center p-3 rounded-2xl bg-yellow-50 border border-yellow-300/30">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 text-stone-900" />
                  <span className="text-xs font-bold text-yellow-600">Başlangıç Saati</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Başlangıç Saat Sütunu */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-stone-500 mb-1">Saat</span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextH = (timePickerModal.startHour + 23) % 24;
                        setTimePickerModal((p) => ({ ...p, startHour: nextH }));
                        document.getElementById(`wheel-sh-${nextH}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                      }}
                      className="text-stone-600 hover:text-stone-950 p-0.5 text-xs transition-colors cursor-pointer"
                      title="Bir saat geri"
                    >
                      ▲
                    </button>
                    <div className="h-32 w-14 overflow-y-auto scroll-smooth snap-y snap-mandatory bg-yellow-50 border border-yellow-200 rounded-xl py-12 flex flex-col items-center text-center scrollbar-none">
                      {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                        <div
                          key={`sh-${h}`}
                          id={`wheel-sh-${h}`}
                          onClick={() => {
                            setTimePickerModal((p) => ({ ...p, startHour: h }));
                            document.getElementById(`wheel-sh-${h}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                          }}
                          className={`snap-center h-8 min-h-[32px] flex items-center justify-center font-mono cursor-pointer transition-all text-sm w-full select-none ${
                            timePickerModal.startHour === h
                              ? "font-bold text-yellow-600 text-base bg-yellow-500/20 rounded-lg scale-110 shadow-sm"
                              : "text-slate-500 hover:text-stone-600"
                          }`}
                        >
                          {String(h).padStart(2, "0")}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextH = (timePickerModal.startHour + 1) % 24;
                        setTimePickerModal((p) => ({ ...p, startHour: nextH }));
                        document.getElementById(`wheel-sh-${nextH}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                      }}
                      className="text-stone-600 hover:text-stone-950 p-0.5 text-xs transition-colors cursor-pointer"
                      title="Bir saat ileri"
                    >
                      ▼
                    </button>
                  </div>

                  <span className="text-xl font-bold text-yellow-600 font-mono mt-3">:</span>

                  {/* Başlangıç Dakika Sütunu */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-stone-500 mb-1">Dakika</span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextM = (timePickerModal.startMinute + 55) % 60;
                        setTimePickerModal((p) => ({ ...p, startMinute: nextM }));
                        document.getElementById(`wheel-sm-${nextM}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                      }}
                      className="text-stone-600 hover:text-stone-950 p-0.5 text-xs transition-colors cursor-pointer"
                      title="5 dakika geri"
                    >
                      ▲
                    </button>
                    <div className="h-32 w-14 overflow-y-auto scroll-smooth snap-y snap-mandatory bg-yellow-50 border border-yellow-200 rounded-xl py-12 flex flex-col items-center text-center scrollbar-none">
                      {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                        <div
                          key={`sm-${m}`}
                          id={`wheel-sm-${m}`}
                          onClick={() => {
                            setTimePickerModal((p) => ({ ...p, startMinute: m }));
                            document.getElementById(`wheel-sm-${m}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                          }}
                          className={`snap-center h-8 min-h-[32px] flex items-center justify-center font-mono cursor-pointer transition-all text-sm w-full select-none ${
                            timePickerModal.startMinute === m
                              ? "font-bold text-yellow-600 text-base bg-yellow-500/20 rounded-lg scale-110 shadow-sm"
                              : "text-slate-500 hover:text-stone-600"
                          }`}
                        >
                          {String(m).padStart(2, "0")}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextM = (timePickerModal.startMinute + 5) % 60;
                        setTimePickerModal((p) => ({ ...p, startMinute: nextM }));
                        document.getElementById(`wheel-sm-${nextM}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                      }}
                      className="text-stone-600 hover:text-stone-950 p-0.5 text-xs transition-colors cursor-pointer"
                      title="5 dakika ileri"
                    >
                      ▼
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 px-3 py-1 rounded-xl bg-yellow-500/10 border border-yellow-300/20 text-xs font-mono font-bold text-yellow-600">
                  {String(timePickerModal.startHour).padStart(2, "0")}:{String(timePickerModal.startMinute).padStart(2, "0")}
                </div>
              </div>

              {/* Bitiş Saati Çarkı */}
              <div className="flex flex-col items-center p-3 rounded-2xl bg-yellow-50 border border-yellow-300">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-stone-800">Bitiş Saati</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Bitiş Saat Sütunu */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-stone-500 mb-1">Saat</span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextH = (timePickerModal.endHour + 23) % 24;
                        setTimePickerModal((p) => ({ ...p, endHour: nextH }));
                        document.getElementById(`wheel-eh-${nextH}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                      }}
                      className="text-stone-600 hover:text-stone-950 p-0.5 text-xs transition-colors cursor-pointer"
                      title="Bir saat geri"
                    >
                      ▲
                    </button>
                    <div className="h-32 w-14 overflow-y-auto scroll-smooth snap-y snap-mandatory bg-yellow-50 border border-yellow-200 rounded-xl py-12 flex flex-col items-center text-center scrollbar-none">
                      {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                        <div
                          key={`eh-${h}`}
                          id={`wheel-eh-${h}`}
                          onClick={() => {
                            setTimePickerModal((p) => ({ ...p, endHour: h }));
                            document.getElementById(`wheel-eh-${h}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                          }}
                          className={`snap-center h-8 min-h-[32px] flex items-center justify-center font-mono cursor-pointer transition-all text-sm w-full select-none ${
                            timePickerModal.endHour === h
                              ? "font-bold text-stone-900 text-base bg-yellow-200 rounded-lg scale-110 shadow-sm border border-yellow-400"
                              : "text-slate-500 hover:text-stone-600"
                          }`}
                        >
                          {String(h).padStart(2, "0")}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextH = (timePickerModal.endHour + 1) % 24;
                        setTimePickerModal((p) => ({ ...p, endHour: nextH }));
                        document.getElementById(`wheel-eh-${nextH}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                      }}
                      className="text-stone-600 hover:text-stone-950 p-0.5 text-xs transition-colors cursor-pointer"
                      title="Bir saat ileri"
                    >
                      ▼
                    </button>
                  </div>

                  <span className="text-xl font-bold text-yellow-600 font-mono mt-3">:</span>

                  {/* Bitiş Dakika Sütunu */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-stone-500 mb-1">Dakika</span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextM = (timePickerModal.endMinute + 55) % 60;
                        setTimePickerModal((p) => ({ ...p, endMinute: nextM }));
                        document.getElementById(`wheel-em-${nextM}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                      }}
                      className="text-stone-600 hover:text-stone-950 p-0.5 text-xs transition-colors cursor-pointer"
                      title="5 dakika geri"
                    >
                      ▲
                    </button>
                    <div className="h-32 w-14 overflow-y-auto scroll-smooth snap-y snap-mandatory bg-yellow-50 border border-yellow-200 rounded-xl py-12 flex flex-col items-center text-center scrollbar-none">
                      {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                        <div
                          key={`em-${m}`}
                          id={`wheel-em-${m}`}
                          onClick={() => {
                            setTimePickerModal((p) => ({ ...p, endMinute: m }));
                            document.getElementById(`wheel-em-${m}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                          }}
                          className={`snap-center h-8 min-h-[32px] flex items-center justify-center font-mono cursor-pointer transition-all text-sm w-full select-none ${
                            timePickerModal.endMinute === m
                              ? "font-bold text-stone-900 text-base bg-yellow-200 rounded-lg scale-110 shadow-sm border border-yellow-400"
                              : "text-slate-500 hover:text-stone-600"
                          }`}
                        >
                          {String(m).padStart(2, "0")}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextM = (timePickerModal.endMinute + 5) % 60;
                        setTimePickerModal((p) => ({ ...p, endMinute: nextM }));
                        document.getElementById(`wheel-em-${nextM}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                      }}
                      className="text-stone-600 hover:text-stone-950 p-0.5 text-xs transition-colors cursor-pointer"
                      title="5 dakika ileri"
                    >
                      ▼
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 px-3 py-1 rounded-xl bg-yellow-100 border border-yellow-300 text-xs font-mono font-bold text-stone-800">
                  {String(timePickerModal.endHour).padStart(2, "0")}:{String(timePickerModal.endMinute).padStart(2, "0")}
                </div>
              </div>
            </div>

            {/* Canlı Önizleme Çubuğu */}
            <div className="p-3.5 rounded-2xl bg-yellow-100/70 border border-yellow-300 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-800 font-medium font-medium block">
                  Uygulanacak Saat Aralığı:
                </span>
                <span className="text-base font-extrabold font-mono text-stone-800 tracking-wide">
                  {String(timePickerModal.startHour).padStart(2, "0")}:{String(timePickerModal.startMinute).padStart(2, "0")} - {String(timePickerModal.endHour).padStart(2, "0")}:{String(timePickerModal.endMinute).padStart(2, "0")}
                </span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-yellow-100 text-yellow-700 text-stone-800 border border-yellow-300">
                {timePickerModal.tip === "haftasonu" ? "Hafta Sonu" : timePickerModal.tip === "ozelgun" ? "Bayram / Özel" : "Hafta İçi"}
              </span>
            </div>

            {/* Butonlar */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-yellow-200">
              <button
                type="button"
                onClick={() => setTimePickerModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 rounded-xl bg-yellow-100/70 hover:bg-yellow-100 text-stone-600 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleApplyTimePicker}
                className="px-5 py-2.5 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-stone-900 font-bold text-xs font-bold shadow-sm  transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                 Saati Kaydet & Uygula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
