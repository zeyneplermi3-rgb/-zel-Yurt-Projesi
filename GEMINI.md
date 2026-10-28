# Proje Genel Kuralları ve Geliştirme Standartları (GEMINI.md)

## 1. Mobil Öncelikli ve Tam Responsive Tasarım (ZORUNLU KURAL)
Kullanıcının kesin talimatı gereği, **sistemdeki tüm arayüzler ve sayfalar mobil cihazlarda (telefon ve tablet) kusursuz, estetik ve kullanımı kolay olacak şekilde geliştirilmelidir.**

### Temel Prensipler:
- **Responsive & Mobile-First:** Yapılan her yeni arayüz, bileşen ve sayfa tasarımı öncelikle mobil ekranlar (320px - 480px) düşünülerek tasarlanmalı, ardından masaüstü ekranlara uyarlanmalıdır.
- **Yatay Taşma Engeli (No Horizontal Overflow):** Mobilde hiçbir sayfada istemsiz sağa/sola kayma (horizontal scrollbar) olmamalı, `overflow-x: hidden`, esnek genişlikler (`w-full`, `max-w-*`) ve esnek container'lar kullanılmalıdır.
- **Dokunmatik Uyumluluk (Touch Targets):** Butonlar, linkler ve form inputları parmakla rahat basılabilecek boyutlarda (minimum 44x44px) ve yeterli aralıklarla yerleştirilmelidir.
- **Mobil Menü ve Navigasyon:** Üst menüler küçük ekranlarda mobil uyumlu açılır çekmece (drawer), hamburger menü veya mobil alt gezinme çubuğu (bottom navigation bar) ile çözülmelidir.
- **Tablo ve Liste Görünümleri:** Masaüstünde geniş olan tablolar mobilde kart görünümüne (`flex-col`, card layout) dönüştürülmeli veya düzgün bir yatay kaydırma kapsayıcısında sunulmalıdır.
- **Tipografi ve Yazı Boyutları:** Mobilde okunabilirliği yüksek, başlıkları mobilde taşmayacak uygun boyutlar (`text-base`, `text-lg`, `text-xl` vb.) tercih edilmelidir.

## 2. KESİNLİKLE EMOJİ KULLANILMAZ (ZORUNLU KURAL)
Kullanıcının kesin talimatı gereği, **kodlarda, arayüz metinlerinde, başlıklarda, butonlarda, bildirimlerde veya asistana ait yanıtlarda HİÇBİR ŞEKİLDE EMOJİ KULLANILMAYACAKTIR.**
- Arayüzde butonlar, başlıklar, kartlar, listeler veya menüler dahil olmak üzere hiçbir yerde emoji yer alamaz.
- İkon gerekirse sadece CSS, SVG veya düz metin göstergeleri kullanılabilir.
- Asistan yanıtlarında da kesinlikle hiçbir emojiye yer verilmeyecektir.

