"use client";

import { useState, useEffect } from "react";
import { Student } from "../../types";

export interface NewStudentData {
  adSoyad: string;
  kullaniciAdi?: string;
  eposta?: string;
  sifre?: string;
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
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto overflow-x-hidden">
      <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-sm space-y-4 max-h-[92vh] overflow-y-auto my-auto">
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
            <label className="text-stone-600 dark:text-stone-300 block mb-1 font-semibold">Öğrenci Adı Soyadı *</label>
            <input
              type="text"
              required
              value={newStudent.adSoyad}
              onChange={(e) => {
                const name = e.target.value;
                const autoUser = name
                  .toLowerCase()
                  .trim()
                  .replace(/ğ/g, "g")
                  .replace(/ü/g, "u")
                  .replace(/ş/g, "s")
                  .replace(/ı/g, "i")
                  .replace(/ö/g, "o")
                  .replace(/ç/g, "c")
                  .replace(/\s+/g, ".")
                  .replace(/[^a-z0-9.]/g, "");
                setNewStudent((prev) => ({
                  ...prev,
                  adSoyad: name,
                  kullaniciAdi: prev.kullaniciAdi || autoUser,
                }));
              }}
              placeholder="Örn: Ayşe Yılmaz"
              className="w-full bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/30 transition-colors font-medium min-h-[44px]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-stone-600 dark:text-stone-300 font-semibold">Kullanıcı Adı *</label>
              <span className="text-[10px] text-stone-400">Öğrenci girişi için kullanılır</span>
            </div>
            <input
              type="text"
              required
              value={newStudent.kullaniciAdi || ""}
              onChange={(e) =>
                setNewStudent({
                  ...newStudent,
                  kullaniciAdi: e.target.value.toLowerCase().replace(/\s+/g, "."),
                })
              }
              placeholder="Örn: ayse.yilmaz"
              className="w-full bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/30 transition-colors font-medium min-h-[44px]"
            />
          </div>



          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-stone-600 dark:text-stone-300 block mb-1 font-semibold">Oda *</label>
              <input
                type="text"
                required
                value={newStudent.odaNo}
                onChange={(e) => setNewStudent({ ...newStudent, odaNo: e.target.value })}
                placeholder="Örn: 101"
                className="w-full bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/30 transition-colors font-medium min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-stone-600 dark:text-stone-300 block mb-1 font-semibold">Kat</label>
              <input
                type="text"
                value={newStudent.yatakNo}
                onChange={(e) => setNewStudent({ ...newStudent, yatakNo: e.target.value })}
                placeholder="Örn: 1"
                className="w-full bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/30 transition-colors font-medium min-h-[44px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#F1F5F9] dark:bg-slate-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white cursor-pointer min-h-[44px]"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold cursor-pointer min-h-[44px] transition-colors"
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
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto overflow-x-hidden">
      <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-sm space-y-4 max-h-[92vh] overflow-y-auto my-auto">
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
            <label className="text-stone-600 dark:text-stone-300 block mb-1 font-semibold">Ad Soyad *</label>
            <input
              type="text"
              required
              value={editingStudent.adSoyad}
              onChange={(e) => setEditingStudent({ ...editingStudent, adSoyad: e.target.value })}
              className="w-full bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/30 transition-colors font-medium min-h-[44px]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-stone-600 dark:text-stone-300 font-semibold">Kullanıcı Adı *</label>
              <span className="text-[10px] text-stone-400">Giriş için kullanılır</span>
            </div>
            <input
              type="text"
              required
              value={editingStudent.kullaniciAdi || ""}
              onChange={(e) =>
                setEditingStudent({
                  ...editingStudent,
                  kullaniciAdi: e.target.value.toLowerCase().replace(/\s+/g, "."),
                })
              }
              placeholder="Örn: ayse.yilmaz"
              className="w-full bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/30 transition-colors font-medium min-h-[44px]"
            />
          </div>



          <div className="p-3 bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl space-y-2">
            <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200 block">
              Oda & Kat Değiştirme:
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-stone-500 dark:text-stone-400 block mb-1">Oda:</label>
                <input
                  type="text"
                  required
                  value={editingStudent.odaNo}
                  onChange={(e) => setEditingStudent({ ...editingStudent, odaNo: e.target.value })}
                  placeholder="Örn: 305"
                  className="w-full bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 transition-colors font-medium"
                />
              </div>
              <div>
                <label className="text-stone-500 dark:text-stone-400 block mb-1">Kat:</label>
                <input
                  type="text"
                  value={editingStudent.yatakNo}
                  onChange={(e) => setEditingStudent({ ...editingStudent, yatakNo: e.target.value })}
                  placeholder="Örn: 1"
                  className="w-full bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 transition-colors font-medium"
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
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto overflow-x-hidden">
      <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-sm space-y-4 max-h-[92vh] overflow-y-auto my-auto">
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

        <div className="space-y-3 text-xs bg-[#F8FAFC] dark:bg-slate-800/60 p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#334155]">
          <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
            <span className="text-stone-500 dark:text-stone-400">Oda & Kat:</span>
            <span className="font-bold text-stone-800 dark:text-stone-200">
              Oda {student.odaNo} / Kat {student.yatakNo}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#E2E8F0] dark:border-[#334155]">
            <span className="text-stone-500 dark:text-stone-400">Kullanıcı Adı:</span>
            <span className="font-bold text-[#0284C7] dark:text-[#38BDF8] font-mono">
              {student.kullaniciAdi || "-"}
            </span>
          </div>
          {student.eposta && (
            <div className="flex justify-between py-1">
              <span className="text-stone-500 dark:text-stone-400">E-Posta:</span>
              <span className="text-stone-700 dark:text-stone-300">{student.eposta}</span>
            </div>
          )}
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

interface SetCapacityModalProps {
  isOpen: boolean;
  currentCapacity: number | string;
  totalStudents: number;
  onClose: () => void;
  onSave: (newCapacity: number) => void;
}

export function SetCapacityModal({
  isOpen,
  currentCapacity,
  totalStudents,
  onClose,
  onSave,
}: SetCapacityModalProps) {
  const [val, setVal] = useState<string | number>(currentCapacity);

  useEffect(() => {
    if (isOpen) {
      setVal(currentCapacity);
    }
  }, [isOpen, currentCapacity]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = typeof val === "string" ? parseInt(val.trim(), 10) : val;
    onSave(isNaN(num) || num < 0 ? 0 : num);
    onClose();
  };

  const parsedVal = typeof val === "string" ? (parseInt(val.trim(), 10) || 0) : (val || 0);

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto overflow-x-hidden">
      <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-xl space-y-4 max-h-[92vh] overflow-y-auto my-auto animate-scale-up">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F1F5F9]">
              Öğrenci Kapasitesi Belirle
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Yurt geneli toplam kontenjan
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F1F5F9] p-1.5 rounded-lg cursor-pointer transition-colors"
            aria-label="Kapat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl flex items-center justify-between text-xs">
            <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Mevcut Kayıtlı Öğrenci:</span>
            <span className="font-bold text-[#0F172A] dark:text-[#F1F5F9]">{totalStudents} Kişi</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#0F172A] dark:text-[#F1F5F9] block">
              Maksimum Kapasite (Öğrenci):
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVal(Math.max(0, parsedVal - 1))}
                className="w-10 h-10 rounded-xl bg-white dark:bg-[#1E293B] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] border border-[#E2E8F0] dark:border-[#334155] text-[#0F172A] dark:text-[#F1F5F9] font-black text-base flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs shrink-0"
                aria-label="Kapasiteyi 1 azalt"
              >
                -
              </button>
              <input
                type="number"
                min={0}
                max={99999}
                value={val}
                onChange={(e) => setVal(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Örn: 30"
                autoFocus
                className="flex-1 h-10 text-center font-bold text-base text-[#0284C7] dark:text-[#38BDF8] bg-white dark:bg-[#1E293B] border border-[#0284C7]/40 dark:border-[#38BDF8]/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0284C7]/20 focus:border-[#0284C7] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setVal(parsedVal + 1)}
                className="w-10 h-10 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-base flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs border border-[#0369A1] shrink-0"
                aria-label="Kapasiteyi 1 artır"
              >
                +
              </button>
            </div>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
              Manuel olarak dilediğiniz sayıyı yazabilir veya butonlarla artırıp azaltabilirsiniz.
            </p>
          </div>

          <div className="flex gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#334155]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-white dark:bg-[#1E293B] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] font-bold text-xs rounded-xl cursor-pointer transition-colors text-center min-h-[44px]"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs rounded-xl cursor-pointer transition-colors text-center border border-[#0369A1] shadow-xs min-h-[44px] flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Kapasiteyi Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
