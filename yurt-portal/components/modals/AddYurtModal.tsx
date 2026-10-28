"use client";

interface AddYurtModalProps {
  isOpen: boolean;
  newYurt: {
    ad: string;
    sehir: string;
    ilce: string;
    adres: string;
    kapasite: number;
    yetkiliAd: string;
    yetkiliTel: string;
    yetkiliEposta: string;
    yurtTuru: string;
  };
  setNewYurt: React.Dispatch<
    React.SetStateAction<{
      ad: string;
      sehir: string;
      ilce: string;
      adres: string;
      kapasite: number;
      yetkiliAd: string;
      yetkiliTel: string;
      yetkiliEposta: string;
      yurtTuru: string;
    }>
  >;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function AddYurtModal({
  isOpen,
  newYurt,
  setNewYurt,
  onClose,
  onSubmit,
}: AddYurtModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-sm space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b border-[#E2E8F0]">
          <div>
            <h3 className="text-xl font-bold text-stone-900">Yeni Yurt Kaydı Ekle</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Yurt işletmesini sisteme tanımlayın.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-600 hover:text-stone-950 p-1 cursor-pointer"
            aria-label="Kapat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
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
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-600 mb-1">Şehir</label>
              <select
                value={newYurt.sehir}
                onChange={(e) => setNewYurt({ ...newYurt, sehir: e.target.value })}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20"
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
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20"
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
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-600 mb-1">Yurt Türü</label>
              <select
                value={newYurt.yurtTuru}
                onChange={(e) => setNewYurt({ ...newYurt, yurtTuru: e.target.value })}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-stone-900 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="Kız Öğrenci Yurdu">Kız Öğrenci Yurdu</option>
                <option value="Erkek Öğrenci Yurdu">Erkek Öğrenci Yurdu</option>
                <option value="Karma Öğrenci Rezidansı">Karma Öğrenci Rezidansı</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E2E8F0]">
            <p className="font-bold text-[#0284C7] mb-2">Yurt Yöneticisi / İletişim Bilgileri</p>
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
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20"
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
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20 font-mono"
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
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-stone-600 cursor-pointer min-h-[44px]"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold shadow-sm cursor-pointer min-h-[44px]"
            >
              Yurdu Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
