"use client";

interface AddMaintenanceModalProps {
  isOpen: boolean;
  newMaintenance: {
    odaNo: string;
    baslik: string;
    kategori: "Tesisat" | "Elektrik" | "İnternet" | "Mobilya" | "Diğer";
    oncelik: "Düşük" | "Orta" | "Acil";
    bildiren: string;
  };
  setNewMaintenance: React.Dispatch<
    React.SetStateAction<{
      odaNo: string;
      baslik: string;
      kategori: "Tesisat" | "Elektrik" | "İnternet" | "Mobilya" | "Diğer";
      oncelik: "Düşük" | "Orta" | "Acil";
      bildiren: string;
    }>
  >;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddMaintenanceModal({
  isOpen,
  newMaintenance,
  setNewMaintenance,
  onClose,
  onSubmit,
}: AddMaintenanceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 w-full max-w-md shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-stone-900">Yeni Arıza Kaydı</h3>
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

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-stone-500 block mb-1">Oda No</label>
              <input
                type="text"
                required
                value={newMaintenance.odaNo}
                onChange={(e) => setNewMaintenance({ ...newMaintenance, odaNo: e.target.value })}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
              />
            </div>
            <div>
              <label className="text-stone-500 block mb-1">Kategori</label>
              <select
                value={newMaintenance.kategori}
                onChange={(e) =>
                  setNewMaintenance({ ...newMaintenance, kategori: e.target.value as any })
                }
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
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
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
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
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
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
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-stone-600 hover:text-stone-900 cursor-pointer min-h-[44px]"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold cursor-pointer min-h-[44px]"
            >
              Kaydı Aç
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddAnnouncementModalProps {
  isOpen: boolean;
  newAnnouncement: {
    baslik: string;
    icerik: string;
    oncelik: "Normal" | "Önemli" | "Acil";
  };
  setNewAnnouncement: React.Dispatch<
    React.SetStateAction<{
      baslik: string;
      icerik: string;
      oncelik: "Normal" | "Önemli" | "Acil";
    }>
  >;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddAnnouncementModal({
  isOpen,
  newAnnouncement,
  setNewAnnouncement,
  onClose,
  onSubmit,
}: AddAnnouncementModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 w-full max-w-md shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-stone-900">Yeni Duyuru Yayınla</h3>
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

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-stone-500 block mb-1">Duyuru Başlığı *</label>
            <input
              type="text"
              required
              value={newAnnouncement.baslik}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, baslik: e.target.value })}
              placeholder="Duyuru başlığı..."
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <div>
            <label className="text-stone-500 block mb-1">Öncelik Derecesi</label>
            <select
              value={newAnnouncement.oncelik}
              onChange={(e) =>
                setNewAnnouncement({ ...newAnnouncement, oncelik: e.target.value as any })
              }
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
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
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-stone-600 hover:text-stone-900 cursor-pointer min-h-[44px]"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold cursor-pointer min-h-[44px]"
            >
              Yayınla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
