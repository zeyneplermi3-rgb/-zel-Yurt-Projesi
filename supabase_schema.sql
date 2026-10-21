-- ==============================================================================
-- ÖZEL YURT PROJESİ - SUPABASE GERÇEK ZAMANLI (REALTIME) VERİTABANI ŞEMASI
-- Bu SQL kodunu Supabase Dashboard > SQL Editor ekranına yapıştırıp "RUN" butonuna basınız.
-- ==============================================================================

-- 1. YURTLAR TABLOSU
CREATE TABLE IF NOT EXISTS public.yurtlar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad VARCHAR(255) NOT NULL,
    sehir VARCHAR(100) NOT NULL,
    ilce VARCHAR(100) NOT NULL,
    adres TEXT,
    kapasite INTEGER NOT NULL DEFAULT 100,
    mevcut_ogrenci INTEGER NOT NULL DEFAULT 0,
    yetkili_ad VARCHAR(150) NOT NULL,
    yetkili_tel VARCHAR(50) NOT NULL,
    yetkili_eposta VARCHAR(150) NOT NULL,
    durum VARCHAR(30) NOT NULL DEFAULT 'aktif', -- 'aktif', 'deneme', 'askida'
    yurt_turu VARCHAR(50) NOT NULL DEFAULT 'Kız Öğrenci Yurdu',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. GÜVENLİK VE TABLO ERİŞİM POLİTİKALARI (RLS - ROW LEVEL SECURITY)
ALTER TABLE public.yurtlar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "yurtlar_tum_erisim" ON public.yurtlar;
CREATE POLICY "yurtlar_tum_erisim" ON public.yurtlar FOR ALL USING (true) WITH CHECK (true);

-- 3. ÖĞRENCİLER TABLOSU
CREATE TABLE IF NOT EXISTS public.ogrenciler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yurt_id UUID REFERENCES public.yurtlar(id) ON DELETE CASCADE,
    ad_soyad VARCHAR(150) NOT NULL,
    telefon VARCHAR(30) NOT NULL,
    eposta VARCHAR(150),
    oda_no VARCHAR(20) NOT NULL,
    yatak_no VARCHAR(10) DEFAULT '1',
    veli_ad VARCHAR(150) NOT NULL,
    veli_tel VARCHAR(30) NOT NULL,
    kayit_tarihi DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ODALAR TABLOSU
CREATE TABLE IF NOT EXISTS public.odalar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yurt_id UUID REFERENCES public.yurtlar(id) ON DELETE CASCADE,
    oda_no VARCHAR(20) NOT NULL,
    blok VARCHAR(20) DEFAULT 'A Blok',
    kat INTEGER DEFAULT 1,
    kapasite INTEGER DEFAULT 3,
    dolu_yatak INTEGER DEFAULT 0,
    oda_tipi VARCHAR(50) DEFAULT 'Standart Banyo & Balkonlu',
    durum VARCHAR(30) DEFAULT 'Aktif'
);

-- 5. ARIZA VE TEKNİK DESTEK TALEPLERİ
CREATE TABLE IF NOT EXISTS public.arizalar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yurt_id UUID REFERENCES public.yurtlar(id) ON DELETE CASCADE,
    oda_no VARCHAR(20) NOT NULL,
    baslik VARCHAR(200) NOT NULL,
    kategori VARCHAR(50) DEFAULT 'Tesisat', -- 'Tesisat', 'Elektrik', 'İnternet', 'Mobilya', 'Diğer'
    oncelik VARCHAR(20) DEFAULT 'Orta', -- 'Düşük', 'Orta', 'Acil'
    durum VARCHAR(30) DEFAULT 'Açık', -- 'Açık', 'İnceleniyor', 'Çözüldü'
    bildiren VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. DUYURULAR PANOSU
CREATE TABLE IF NOT EXISTS public.duyurular (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yurt_id UUID REFERENCES public.yurtlar(id) ON DELETE CASCADE,
    baslik VARCHAR(255) NOT NULL,
    icerik TEXT NOT NULL,
    oncelik VARCHAR(20) DEFAULT 'Normal', -- 'Normal', 'Önemli', 'Acil'
    tarih DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS & Realtime Genişletmeleri
ALTER TABLE public.ogrenciler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arizalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duyurular ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ogrenciler_tum" ON public.ogrenciler;
DROP POLICY IF EXISTS "odalar_tum" ON public.odalar;
DROP POLICY IF EXISTS "arizalar_tum" ON public.arizalar;
DROP POLICY IF EXISTS "duyurular_tum" ON public.duyurular;

CREATE POLICY "ogrenciler_tum" ON public.ogrenciler FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "odalar_tum" ON public.odalar FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "arizalar_tum" ON public.arizalar FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "duyurular_tum" ON public.duyurular FOR ALL USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'yurtlar'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.yurtlar;
  END IF;

  ALTER PUBLICATION supabase_realtime ADD TABLE public.ogrenciler, public.odalar, public.arizalar, public.duyurular;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
