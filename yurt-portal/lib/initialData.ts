import {
  Student,
  Room,
  LaundrySlot,
  LaundryMachine,
  MaintenanceTicket,
  Announcement,
  MealAttendanceRecord,
} from "../types";

export const defaultStudents: Student[] = [
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

export const defaultRooms: Room[] = [
  { id: "r-101", odaNo: "101", blok: "A Blok", kat: 1, kapasite: 3, doluYatak: 2, odaTipi: "Standart Balkonlu", durum: "Aktif" },
  { id: "r-104", odaNo: "104", blok: "A Blok", kat: 1, kapasite: 2, doluYatak: 2, odaTipi: "Geniş Suit", durum: "Aktif" },
  { id: "r-201", odaNo: "201", blok: "A Blok", kat: 2, kapasite: 1, doluYatak: 1, odaTipi: "Tek Kişilik VIP", durum: "Aktif" },
  { id: "r-202", odaNo: "202", blok: "B Blok", kat: 2, kapasite: 3, doluYatak: 2, odaTipi: "Standart 3 Kişilik", durum: "Aktif" },
  { id: "r-305", odaNo: "305", blok: "B Blok", kat: 3, kapasite: 4, doluYatak: 3, odaTipi: "4 Kişilik Ferah", durum: "Aktif" },
  { id: "r-306", odaNo: "306", blok: "B Blok", kat: 3, kapasite: 2, doluYatak: 0, odaTipi: "2 Kişilik Çalışma Odalı", durum: "Aktif" },
];

export const defaultLaundrySlots: LaundrySlot[] = [
  {
    id: "lnd-1",
    ogrenciAd: "Zeynep Lermi",
    odaNo: "305",
    makineNo: "Makine 1 (A-1)",
    tarih: "",
    saatAraligi: "09:00 - 10:30",
    program: "Renkli & Karışık",
    durum: "Yıkanıyor",
    not: "40°C Standart yıkama",
  },
  {
    id: "lnd-2",
    ogrenciAd: "Merve Kaya",
    odaNo: "104",
    makineNo: "Makine 2 (A-2)",
    tarih: "",
    saatAraligi: "10:30 - 12:00",
    program: "Beyazlar & Pamuklu",
    durum: "Sırada",
    not: "Çamaşır sepeti makine yanında",
  },
  {
    id: "lnd-3",
    ogrenciAd: "Ayşe Demir",
    odaNo: "201",
    makineNo: "Kurutma 1 (K-1)",
    tarih: "",
    saatAraligi: "13:00 - 14:30",
    program: "Kurutma & Havalandırma",
    durum: "Sırada",
    not: "Orta ısıda kurutma",
  },
  {
    id: "lnd-4",
    ogrenciAd: "Büşra Çelik",
    odaNo: "202",
    makineNo: "Makine 3 (B-1)",
    tarih: "",
    saatAraligi: "15:00 - 16:30",
    program: "Hızlı Yıkama (30 dk)",
    durum: "Sırada",
  },
  {
    id: "lnd-5",
    ogrenciAd: "Elif Yılmaz",
    odaNo: "101",
    makineNo: "Makine 1 (A-1)",
    tarih: "",
    saatAraligi: "17:00 - 18:30",
    program: "Renkli & Karışık",
    durum: "Sırada",
  },
  {
    id: "lnd-6",
    ogrenciAd: "Selin Şahin",
    odaNo: "306",
    makineNo: "Makine 2 (A-2)",
    tarih: "",
    saatAraligi: "11:00 - 12:30",
    program: "Renkli & Karışık",
    durum: "Sırada",
  },
  {
    id: "lnd-7",
    ogrenciAd: "Zeynep Lermi",
    odaNo: "305",
    makineNo: "Kurutma 2 (K-2)",
    tarih: "",
    saatAraligi: "14:00 - 15:30",
    program: "Kurutma & Havalandırma",
    durum: "Sırada",
  },
];

export const defaultLaundryMachines: LaundryMachine[] = [
  { id: "Makine 1 (A-1)", name: "Makine 1 (A Blok)", tip: "Yıkama • 9 kg", tur: "yikama", kapasiteKg: 9 },
  { id: "Makine 2 (A-2)", name: "Makine 2 (A Blok)", tip: "Yıkama • 9 kg", tur: "yikama", kapasiteKg: 9 },
  { id: "Makine 3 (B-1)", name: "Makine 3 (B Blok)", tip: "Yıkama • 8 kg", tur: "yikama", kapasiteKg: 8 },
  { id: "Makine 4 (B-2)", name: "Makine 4 (B Blok)", tip: "Yıkama • 8 kg", tur: "yikama", kapasiteKg: 8 },
  { id: "Kurutma 1 (K-1)", name: "Kurutma 1 (Merkez)", tip: "Kurutma • 10 kg", tur: "kurutma", kapasiteKg: 10 },
  { id: "Kurutma 2 (K-2)", name: "Kurutma 2 (Merkez)", tip: "Kurutma • 10 kg", tur: "kurutma", kapasiteKg: 10 },
];

export const defaultMaintenanceTickets: MaintenanceTicket[] = [
  { id: "mnt-1", odaNo: "305", baslik: "Banyo bataryası damlatıyor", kategori: "Tesisat", oncelik: "Orta", durum: "Açık", bildiren: "Zeynep Lermi", tarih: "18.10.2026" },
  { id: "mnt-2", odaNo: "104", baslik: "Oda Wi-Fi sinyali çok zayıf", kategori: "İnternet", oncelik: "Acil", durum: "İnceleniyor", bildiren: "Merve Kaya", tarih: "17.10.2026" },
  { id: "mnt-3", odaNo: "201", baslik: "Masa lambası duyu değişimi", kategori: "Elektrik", oncelik: "Düşük", durum: "Çözüldü", bildiren: "Ayşe Demir", tarih: "15.10.2026" },
];

export const defaultAnnouncements: Announcement[] = [
  { id: "anc-1", baslik: "Yurt Düzeni ve Genel Bilgilendirme", icerik: "Ortak alanların temiz tutulması ve dinlenme saatlerinde sessizliğe özen gösterilmesi rica olunur.", oncelik: "Önemli", tarih: "18.10.2026" },
  { id: "anc-2", baslik: "Haftalık Çamaşırhane & Ütü Odası Programı", icerik: "B Blok kat sakinleri için çamaşırhane Salı ve Cuma günleri 09:00 - 21:00 arası rezerve edilmiştir.", oncelik: "Normal", tarih: "17.10.2026" },
  { id: "anc-3", baslik: "Merkezi Isıtma & Sıcak Su Saatleri", icerik: "Kış tarifesi gereği kaloriferler sabah 06:00-09:00 ve akşam 17:00-24:00 saatleri arasında kesintisiz devrededir.", oncelik: "Normal", tarih: "15.10.2026" },
];

export const defaultDailyMenu = {
  gorunumModu: "birlikte" as "tek" | "birlikte",
  aktifOgun: "kahvalti" as "kahvalti" | "aksam",
  kaloriGoster: true,
  gunTipi: "haftaici" as "haftaici" | "haftasonu" | "ozelgun",
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
};

export const defaultYurtSettings = {
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
  hizliGirisIzin: true,
  guvenliOturum: true,
};

export const defaultMealAttendance: MealAttendanceRecord[] = [
  { id: "att-1", studentKey: "zeynep.lermi@gmail.com", studentName: "Zeynep Lermi", date: "2026-10-28", status: "var", updatedAt: "12:00" },
  { id: "att-2", studentKey: "elif.yilmaz@gmail.com", studentName: "Elif Yılmaz", date: "2026-10-28", status: "var", updatedAt: "12:15" },
  { id: "att-3", studentKey: "ayse.demir@gmail.com", studentName: "Ayşe Demir", date: "2026-10-28", status: "yok", updatedAt: "12:30" },
  { id: "att-4", studentKey: "fatma.kaya@gmail.com", studentName: "Fatma Kaya", date: "2026-10-28", status: "var", updatedAt: "12:45" },
];
