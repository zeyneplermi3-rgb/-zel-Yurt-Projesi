export type Role = "superadmin" | "yonetici" | "ogrenci";

export interface CurrentUser {
  role: Role;
  name: string;
  details: string;
  selectedYurtId?: string;
  selectedYurtName?: string;
}

export interface Yurt {
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
  kullaniciAdi?: string;
  telefon?: string;
  eposta: string;
  sifre?: string;
  odaNo: string;
  yatakNo: string;
  veliAd?: string;
  veliTel?: string;
  kayitTarihi?: string;
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
  makineNo: string;
  tarih: string; // YYYY-MM-DD
  saatAraligi: string;
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

export type ManagerTab =
  | "genel-bakis"
  | "ogrenciler"
  | "odalar"
  | "camasirhane"
  | "arizalar"
  | "duyurular"
  | "yemek-menusu"
  | "ayarlar"
  | "ogrenci-gorunumu";

export interface MealItem {
  ad: string;
  kalori: string;
}

export interface DailyMenu {
  tarih: string;
  kahvalti: {
    saat: string;
    kalori: string;
    ogeler: MealItem[];
  };
  ogle: {
    saat: string;
    kalori: string;
    ogeler: MealItem[];
  };
  aksam: {
    saat: string;
    kalori: string;
    ogeler: MealItem[];
  };
  vejetaryen: {
    saat: string;
    kalori: string;
    ogeler: MealItem[];
  };
}

export interface MealAttendanceRecord {
  id: string;
  studentKey: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  status: "var" | "yok";
  updatedAt: string;
}

export interface YurtSettings {
  haftaIciGiris: string;
  haftaSonuGiris: string;
  ozelGunGiris: string;
  haftaIciCikis: string;
  haftaSonuCikis: string;
  kahvaltiSaat: string;
  aksamYemegiSaat: string;
  camasirhaneBaslangic: string;
  camasirhaneBitis: string;
  camasirhaneGunlukLimit?: number;
  camasirhaneYurtGunlukLimit?: number;
  camasirhaneHaftalikLimit: number;
  odaDegisimiIzni: boolean;
  misafirPolitikasi: string;
  sessizlikBaslangic: string;
  gecKalmaToleransDk: number;
}
