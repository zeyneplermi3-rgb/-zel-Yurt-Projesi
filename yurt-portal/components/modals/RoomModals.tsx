"use client";

import { Room } from "../../types";

interface AddRoomModalProps {
  isOpen: boolean;
  newRoom: {
    odaNo: string;
    blok: string;
    kat: number;
    kapasite: number;
    odaTipi: string;
  };
  setNewRoom: React.Dispatch<
    React.SetStateAction<{
      odaNo: string;
      blok: string;
      kat: number;
      kapasite: number;
      odaTipi: string;
    }>
  >;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddRoomModal({
  isOpen,
  newRoom,
  setNewRoom,
  onClose,
  onSubmit,
}: AddRoomModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 w-full max-w-md shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-stone-900">Yeni Oda Oluştur</h3>
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
              <label className="text-stone-500 block mb-1">Oda Numarası *</label>
              <input
                type="text"
                required
                placeholder="Örn: 204"
                value={newRoom.odaNo}
                onChange={(e) => setNewRoom({ ...newRoom, odaNo: e.target.value })}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
              />
            </div>
            <div>
              <label className="text-stone-500 block mb-1">Blok Seçimi</label>
              <select
                value={newRoom.blok}
                onChange={(e) => setNewRoom({ ...newRoom, blok: e.target.value })}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
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
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
              />
            </div>
            <div>
              <label className="text-stone-500 block mb-1">Yatak Kapasitesi *</label>
              <select
                value={newRoom.kapasite}
                onChange={(e) => setNewRoom({ ...newRoom, kapasite: Number(e.target.value) })}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
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
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
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
              Odayı Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditRoomModalProps {
  editingRoom: Room | null;
  setEditingRoom: (room: Room | null) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EditRoomModal({
  editingRoom,
  setEditingRoom,
  onSubmit,
}: EditRoomModalProps) {
  if (!editingRoom) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 w-full max-w-md shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-stone-900">
            Oda {editingRoom.odaNo} Ayarlarını Düzenle
          </h3>
          <button
            type="button"
            onClick={() => setEditingRoom(null)}
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
              <label className="text-stone-500 block mb-1">Oda No:</label>
              <input
                type="text"
                required
                value={editingRoom.odaNo}
                onChange={(e) => setEditingRoom({ ...editingRoom, odaNo: e.target.value })}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
              />
            </div>
            <div>
              <label className="text-stone-500 block mb-1">Blok:</label>
              <select
                value={editingRoom.blok}
                onChange={(e) => setEditingRoom({ ...editingRoom, blok: e.target.value })}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
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
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
              />
            </div>
            <div>
              <label className="text-stone-500 block mb-1">Yatak Kapasitesi:</label>
              <select
                value={editingRoom.kapasite}
                onChange={(e) => setEditingRoom({ ...editingRoom, kapasite: Number(e.target.value) })}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
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
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setEditingRoom(null)}
              className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-stone-600 hover:text-stone-900 cursor-pointer min-h-[44px]"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold cursor-pointer min-h-[44px]"
            >
              Değişiklikleri Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
