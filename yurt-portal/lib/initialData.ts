import {
  Student,
  Room,
  LaundrySlot,
  LaundryMachine,
  MaintenanceTicket,
  Announcement,
  MealAttendanceRecord,
} from "../types";

export const defaultStudents: Student[] = [];

export const defaultRooms: Room[] = [];

export const defaultLaundrySlots: LaundrySlot[] = [];

export const defaultLaundryMachines: LaundryMachine[] = [];

export const defaultMaintenanceTickets: MaintenanceTicket[] = [];

export const defaultAnnouncements: Announcement[] = [];

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
  kahvalti: "",
  kahvaltiSaat: "07:30 - 10:00",
  kahvaltiKalori: "",
  aksam: "",
  aksamSaat: "18:00 - 20:30",
  aksamKalori: "",
  tarih: "",
};

export const defaultYurtSettings = {
  ad: "Karahan Yükseköğrenim Kız Öğrenci Yurdu",
  sehir: "Ankara",
  ilce: "Yenimahalle",
  adres: "",
  yetkiliAd: "Aybuke Karahan",
  yetkiliTel: "",
  kapasite: 30,
  sonGirisHaftaIci: "23:00",
  sonGirisHaftaSonu: "23:45",
  ilkCikisHaftaIci: "06:00",
  ilkCikisHaftaSonu: "06:30",
  adminKullaniciAdi: "mudur",
  adminEposta: "mudur@gmail.com",
  adminSifre: "mudur123456",
  superadminKullaniciAdi: "superadmin",
  superadminEposta: "superadmin@yurtify.com",
  superadminSifre: "Admin*2026!",
  adminGirisAktif: true,
  hizliGirisIzin: false,
  guvenliOturum: true,
};

export const defaultMealAttendance: MealAttendanceRecord[] = [];
