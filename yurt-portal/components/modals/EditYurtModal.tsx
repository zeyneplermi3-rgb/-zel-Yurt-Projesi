"use client";

import { useState, useEffect } from "react";
import type { Yurt } from "../../types";

interface EditYurtModalProps {
  isOpen: boolean;
  yurt: Yurt | null;
  onClose: () => void;
  onUpdate: (updatedYurt: Partial<Yurt> & { id: string }) => Promise<void>;
}

export default function EditYurtModal({
  isOpen,
  yurt,
  onClose,
  onUpdate,
}: EditYurtModalProps) {
  const [formData, setFormData] = useState({
    ad: "",
    sehir: "İstanbul",
    ilce: "",
    adres: "",
    yurtTuru: "Kız Öğrenci Yurdu",
    durum: "aktif" as "aktif" | "askida" | "deneme",
    yetkiliAd: "",
    yetkiliTel: "",
    yetkiliEposta: "",
    admin_kullanici_adi: "",
    admin_sifre: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (yurt) {
      setFormData({
        ad: yurt.ad || "",
        sehir: yurt.sehir || "İstanbul",
        ilce: yurt.ilce || "",
        adres: yurt.adres || "",
        yurtTuru: yurt.yurtTuru || "Kız Öğrenci Yurdu",
        durum: yurt.durum || "aktif",
        yetkiliAd: yurt.yetkiliAd || "",
        yetkiliTel: yurt.yetkiliTel || "",
        yetkiliEposta: yurt.yetkiliEposta || "",
        admin_kullanici_adi: yurt.admin_kullanici_adi || yurt.yetkiliEposta || "",
        admin_sifre: yurt.admin_sifre || "mudur123456",
      });
    }
  }, [yurt, isOpen]);

  if (!isOpen || !yurt) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ad.trim() || !formData.yetkiliAd.trim() || !formData.yetkiliEposta.trim()) {
      alert("Lütfen zorunlu alanları (Yurt Adı, Yetkili Adı ve E-posta) eksiksiz doldurunuz.");
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate({
        id: yurt.id,
        ad: formData.ad.trim(),
        sehir: formData.sehir,
        ilce: formData.ilce.trim() || "Merkez",
        adres: formData.adres.trim(),
        yurtTuru: formData.yurtTuru,
        durum: formData.durum,
        yetkiliAd: formData.yetkiliAd.trim(),
        yetkiliTel: formData.yetkiliTel.trim(),
        yetkiliEposta: formData.yetkiliEposta.trim(),
        admin_kullanici_adi: formData.admin_kullanici_adi.trim() || formData.yetkiliEposta.trim(),
        admin_sifre: formData.admin_sifre || "mudur123456",
      });
      onClose();
    } catch (err) {
      console.error("Yurt güncellenirken hata:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-lg space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Başlığı */}
        <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] dark:border-[#334155]">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
              Yurt Bilgilerini Düzenle
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              {yurt.ad} bilgilerini güncelleyin.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-500 hover:text-stone-800 dark:hover:text-white p-2 rounded-xl transition-colors cursor-pointer"
            aria-label="Kapat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Düzenleme Formu */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 dark:text-slate-300 mb-1">
              Yurt Tam Adı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.ad}
              onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
              className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20 text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-slate-300 mb-1">
                Şehir <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.sehir}
                onChange={(e) => setFormData({ ...formData, sehir: e.target.value })}
                className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3 text-stone-900 dark:text-white focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20 text-xs cursor-pointer font-medium"
              >
                <option value="İstanbul">İstanbul</option>
                <option value="Ankara">Ankara</option>
                <option value="İzmir">İzmir</option>
                <option value="Eskişehir">Eskişehir</option>
                <option value="Bursa">Bursa</option>
                <option value="Antalya">Antalya</option>
                <option value="Konya">Konya</option>
                <option value="Trabzon">Trabzon</option>
                <option value="Gaziantep">Gaziantep</option>
                <option value="Kayseri">Kayseri</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-slate-300 mb-1">
                İlçe
              </label>
              <input
                type="text"
                value={formData.ilce}
                onChange={(e) => setFormData({ ...formData, ilce: e.target.value })}
                className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20 text-xs font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-slate-300 mb-1">
                Yurt Türü
              </label>
              <select
                value={formData.yurtTuru}
                onChange={(e) => setFormData({ ...formData, yurtTuru: e.target.value })}
                className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3 text-stone-900 dark:text-white focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20 text-xs cursor-pointer font-medium"
              >
                <option value="Kız Öğrenci Yurdu">Kız Öğrenci Yurdu</option>
                <option value="Erkek Öğrenci Yurdu">Erkek Öğrenci Yurdu</option>
                <option value="Karma Öğrenci Rezidansı">Karma Öğrenci Rezidansı</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-slate-300 mb-1">
                İşletme Durumu
              </label>
              <select
                value={formData.durum}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    durum: e.target.value as "aktif" | "askida" | "deneme",
                  })
                }
                className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3 text-stone-900 dark:text-white focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20 text-xs cursor-pointer font-medium"
              >
                <option value="aktif">Aktif</option>
                <option value="deneme">Deneme</option>
                <option value="askida">Askıda</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-slate-300 mb-1">
              Açık Adres
            </label>
            <input
              type="text"
              value={formData.adres}
              onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
              placeholder="Mahalle, cadde, sokak ve bina numarası"
              className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20 text-xs font-medium"
            />
          </div>

          {/* Yetkili & Yönetici Giriş Bilgileri */}
          <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#334155] space-y-3">
            <h4 className="font-bold text-[#0284C7] text-xs">
              Yurt Yöneticisi ve Giriş Bilgileri
            </h4>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-slate-300 mb-1">
                Yetkili Adı Soyadı <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.yetkiliAd}
                onChange={(e) => setFormData({ ...formData, yetkiliAd: e.target.value })}
                className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20 text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-slate-300 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.yetkiliTel}
                  onChange={(e) => setFormData({ ...formData, yetkiliTel: e.target.value })}
                  placeholder="05XX XXX XX XX"
                  className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-slate-300 mb-1">
                  Yetkili E-posta <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.yetkiliEposta}
                  onChange={(e) => setFormData({ ...formData, yetkiliEposta: e.target.value })}
                  className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20 text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-slate-300 mb-1">
                  Müdür Giriş Kullanıcı Adı
                </label>
                <input
                  type="text"
                  value={formData.admin_kullanici_adi}
                  onChange={(e) =>
                    setFormData({ ...formData, admin_kullanici_adi: e.target.value })
                  }
                  placeholder="mudur veya e-posta"
                  className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20 text-xs font-mono font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-slate-300 mb-1">
                  Müdür Giriş Şifresi
                </label>
                <input
                  type="text"
                  value={formData.admin_sifre}
                  onChange={(e) => setFormData({ ...formData, admin_sifre: e.target.value })}
                  placeholder="Giriş şifresi"
                  className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-[#334155] rounded-xl p-3 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20 text-xs font-mono font-medium"
                />
              </div>
            </div>
          </div>

          {/* Alt Eylem Butonları */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 border-t border-[#E2E8F0] dark:border-[#334155]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 font-semibold cursor-pointer min-h-[44px] transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold shadow-xs cursor-pointer min-h-[44px] transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
