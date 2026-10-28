"use client";

import { Student } from "../../types";

export interface NewStudentData {
  adSoyad: string;
  eposta: string;
  sifre: string;
  odaNo: string;
  yatakNo: string;
  telefon?: string;
  veliAd?: string;
  veliTel?: string;
}

interface AddStudentModalProps {
  isOpen: boolean;
  newStudent: NewStudentData;
  setNewStudent: React.Dispatch<React.SetStateAction<NewStudentData>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddStudentModal({
  isOpen,
  newStudent,
  setNewStudent,
  onClose,
  onSubmit,
}: AddStudentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 w-full max-w-lg shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-stone-900">Yeni Öğrenci Kaydı</h3>
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
            <label className="text-stone-500 block mb-1">Ad Soyad *</label>
            <input
              type="text"
              required
              value={newStudent.adSoyad}
              onChange={(e) => setNewStudent({ ...newStudent, adSoyad: e.target.value })}
              placeholder="Ad Soyad..."
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <div>
            <label className="text-stone-500 block mb-1">E-Posta</label>
            <input
              type="text"
              inputMode="email"
              value={newStudent.eposta}
              onChange={(e) => setNewStudent({ ...newStudent, eposta: e.target.value })}
              placeholder="ogrenci@gmail.com"
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <div>
            <label className="text-stone-500 block mb-1">Öğrenci Giriş Şifresi</label>
            <input
              type="text"
              value={newStudent.sifre}
              onChange={(e) => setNewStudent({ ...newStudent, sifre: e.target.value })}
              placeholder="Varsayılan: ogrenci123"
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7] font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-stone-500 block mb-1">Oda *</label>
              <input
                type="text"
                required
                value={newStudent.odaNo}
                onChange={(e) => setNewStudent({ ...newStudent, odaNo: e.target.value })}
                placeholder="Örn: 101"
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
              />
            </div>
            <div>
              <label className="text-stone-500 block mb-1">Kat</label>
              <input
                type="text"
                value={newStudent.yatakNo}
                onChange={(e) => setNewStudent({ ...newStudent, yatakNo: e.target.value })}
                placeholder="Örn: 1"
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
              Kaydet ve Odaya Yerleştir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditStudentModalProps {
  editingStudent: Student | null;
  setEditingStudent: (student: Student | null) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EditStudentModal({
  editingStudent,
  setEditingStudent,
  onSubmit,
}: EditStudentModalProps) {
  if (!editingStudent) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 w-full max-w-lg shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-stone-900">Öğrenci Bilgilerini Düzenle</h3>
          <button
            type="button"
            onClick={() => setEditingStudent(null)}
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
            <label className="text-stone-500 block mb-1">Ad Soyad:</label>
            <input
              type="text"
              required
              value={editingStudent.adSoyad}
              onChange={(e) => setEditingStudent({ ...editingStudent, adSoyad: e.target.value })}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <div>
            <label className="text-stone-500 block mb-1">E-Posta:</label>
            <input
              type="email"
              value={editingStudent.eposta}
              onChange={(e) => setEditingStudent({ ...editingStudent, eposta: e.target.value })}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          <div>
            <label className="text-stone-500 block mb-1">Öğrenci Giriş Şifresi:</label>
            <input
              type="text"
              value={editingStudent.sifre || "ogrenci123"}
              onChange={(e) => setEditingStudent({ ...editingStudent, sifre: e.target.value })}
              placeholder="Örn: ogrenci123"
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7] font-mono"
            />
          </div>

          <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-2xl space-y-2">
            <span className="text-[11px] font-bold text-stone-800 block">
              Oda & Kat Değiştirme:
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-stone-500 block mb-1">Oda:</label>
                <input
                  type="text"
                  required
                  value={editingStudent.odaNo}
                  onChange={(e) => setEditingStudent({ ...editingStudent, odaNo: e.target.value })}
                  placeholder="Örn: 305"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
                />
              </div>
              <div>
                <label className="text-stone-500 block mb-1">Kat:</label>
                <input
                  type="text"
                  value={editingStudent.yatakNo}
                  onChange={(e) => setEditingStudent({ ...editingStudent, yatakNo: e.target.value })}
                  placeholder="Örn: 1"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2.5 text-stone-900 focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setEditingStudent(null)}
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

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
  onEdit: (student: Student) => void;
}

export function StudentDetailModal({
  student,
  onClose,
  onEdit,
}: StudentDetailModalProps) {
  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 w-full max-w-md shadow-sm space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#0284C7] border border-[#E2E8F0]">
              Öğrenci Kütük Kartı
            </span>
            <h3 className="text-xl font-black text-stone-900 mt-1">
              {student.adSoyad}
            </h3>
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

        <div className="space-y-3 text-xs bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
          <div className="flex justify-between py-1 border-b border-[#E2E8F0]">
            <span className="text-stone-500">Oda & Kat:</span>
            <span className="font-bold text-stone-800">
              Oda {student.odaNo} / Kat {student.yatakNo}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-stone-500">E-Posta:</span>
            <span className="text-stone-700">{student.eposta}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onEdit(student)}
            className="flex-1 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs cursor-pointer min-h-[44px]"
          >
            Bilgileri / Odayı Düzenle
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-stone-700 font-bold text-xs cursor-pointer min-h-[44px]"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
