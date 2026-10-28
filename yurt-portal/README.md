# Ozel Yurt Yonetim ve Ogrenci Portali

Modern, mobil oncelikli ve Supabase entegrasyonuna hazir yurt otomasyon ve ogrenci yonetim sistemi.

## Ozellikler

- **Coklu Rol Desteigi:** Superadmin, Yurt Yoneticisi ve Ogrenci panelleri.
- **Ogrenci Yonetimi:** Kayit, arama, filtreleme, detay ve oda tahsisi.
- **Oda & Blok Yonetimi:** Kapasite ve doluluk takibi, oda tipleri.
- **Akilli Camasirhane Randevu Sistemi:**
  - Ay ve gun gorunumu
  - Canli makine sirasi ve kullanim durumu
  - Slot ve rezervasyon takibi
- **Teknik Destek & Ariza Bildirimi:** Kategori ve oncelik bazli ariza yonetimi.
- **Yurt Icı Duyurular:** Oncelik dereceli anons sistemi.
- **Gunun Yemek Menusu:** Ogun saatleri, kalori ve menu planlamasi.
- **Yurt Ayarlari:** Giris/cikis saatleri, haftasonu kurallari ve yonetim izinleri.
- **Karanlik / Aydinlik Tema:** Sistem ve yerel hafiza (localStorage) uyumlu gece modu destegi.
- **Mobil Oncelikli Arayuz:** Tum ekranlarda (320px+) akici ve responsive kullanim.

## Kurulum ve Calistirma

Gerekli paketleri yuklemek ve gelistirme sunucusunu baslatmak icin:

```bash
npm install
npm run dev
```

Tarayicinizda `http://localhost:3000` adresini acarak uygulamayi inceleyebilirsiniz.

## Veritabani

Proje `supabase_schema.sql` dosyasinda tanimlanan Supabase semasi ile tam uyumludur. Gerekli ortam degiskenlerini `.env.local` icerisinde belirtebilirsiniz.
