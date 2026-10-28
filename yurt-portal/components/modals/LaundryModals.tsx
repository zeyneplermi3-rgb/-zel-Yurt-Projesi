"use client";

import { useState } from "react";
import { LaundryMachine } from "../../types";

interface AddLaundryModalProps {
  isOpen: boolean;
  laundryMachines: LaundryMachine[];
  newLaundry: {
    ogrenciAd: string;
    odaNo: string;
    makineNo: string;
    tarih: string;
    saatAraligi: string;
    program: "Renkli & Karışık" | "Beyazlar & Pamuklu" | "Hızlı Yıkama (30 dk)" | "Kurutma & Havalandırma";
    durum: "Yıkanıyor" | "Sırada" | "Tamamlandı";
    not: string;
  };
  setNewLaundry: React.Dispatch<
    React.SetStateAction<{
      ogrenciAd: string;
      odaNo: string;
      makineNo: string;
      tarih: string;
      saatAraligi: string;
      program: "Renkli & Karışık" | "Beyazlar & Pamuklu" | "Hızlı Yıkama (30 dk)" | "Kurutma & Havalandırma";
      durum: "Yıkanıyor" | "Sırada" | "Tamamlandı";
      not: string;
    }>
  >;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddLaundryModal({
  isOpen,
  laundryMachines,
  newLaundry,
  setNewLaundry,
  onClose,
  onSubmit,
}: AddLaundryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-lg space-y-4">
        <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">Yeni Çamaşır Sırası Ekle</h3>
            <p className="text-xs text-[#64748B]">Öğrenciye makine ve saat aralığı rezerve edin.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#64748B] hover:text-[#0F172A] cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F8FAFC]"
            aria-label="Kapat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-[#64748B] font-semibold block mb-1">Öğrenci Adı Soyadı *</label>
            <input
              type="text"
              required
              placeholder="Örn: Zeynep Lermi"
              value={newLaundry.ogrenciAd}
              onChange={(e) => setNewLaundry({ ...newLaundry, ogrenciAd: e.target.value })}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/25 font-medium transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#64748B] font-semibold block mb-1">Oda Numarası *</label>
              <input
                type="text"
                required
                placeholder="Örn: 305"
                value={newLaundry.odaNo}
                onChange={(e) => setNewLaundry({ ...newLaundry, odaNo: e.target.value })}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/25 font-medium transition-all"
              />
            </div>

            <div>
              <label className="text-[#64748B] font-semibold block mb-1">Tarih *</label>
              <input
                type="date"
                required
                value={newLaundry.tarih}
                onChange={(e) => setNewLaundry({ ...newLaundry, tarih: e.target.value })}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/25 font-medium transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#64748B] font-semibold block mb-1">Makine Seçimi *</label>
              <select
                value={newLaundry.makineNo}
                onChange={(e) => setNewLaundry({ ...newLaundry, makineNo: e.target.value })}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/25 font-medium transition-all"
              >
                {laundryMachines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.tip})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[#64748B] font-semibold block mb-1">Saat Dilimi *</label>
              <input
                type="text"
                required
                placeholder="Örn: 09:00 - 10:30"
                list="laundry-time-slots"
                value={newLaundry.saatAraligi}
                onChange={(e) => setNewLaundry({ ...newLaundry, saatAraligi: e.target.value })}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/25 font-medium transition-all"
              />
              <datalist id="laundry-time-slots">
                <option value="09:00 - 10:30" />
                <option value="10:30 - 12:00" />
                <option value="13:00 - 14:30" />
                <option value="15:00 - 16:30" />
                <option value="17:00 - 18:30" />
                <option value="19:00 - 20:30" />
                <option value="20:30 - 22:00" />
              </datalist>
            </div>
          </div>

          <div>
            <label className="text-[#64748B] font-semibold block mb-1">Başlangıç Durumu</label>
            <select
              value={newLaundry.durum}
              onChange={(e) => setNewLaundry({ ...newLaundry, durum: e.target.value as any })}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/25 font-medium transition-all"
            >
              <option value="Sırada">Sırada Bekliyor</option>
              <option value="Yıkanıyor">Şu An Yıkanıyor</option>
              <option value="Tamamlandı">Tamamlandı</option>
            </select>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-bold cursor-pointer transition-colors min-h-[44px]"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold transition-all cursor-pointer border border-[#0369A1] min-h-[44px]"
            >
              Sıraya Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ManageMachinesModalProps {
  isOpen: boolean;
  laundryMachines: LaundryMachine[];
  newCustomMachine: {
    name: string;
    tur: "yikama" | "kurutma";
    kapasiteKg: string | number;
    blok: string;
  };
  setNewCustomMachine: React.Dispatch<
    React.SetStateAction<{
      name: string;
      tur: "yikama" | "kurutma";
      kapasiteKg: string | number;
      blok: string;
    }>
  >;
  onQuickSetCount: (type: "yikama" | "kurutma", delta: number) => void;
  onDeleteMachine: (id: string) => void;
  onAddCustomMachine: (e: React.FormEvent) => void;
  onClose: () => void;
  dailyLaundryLimit?: number;
  onSetDailyLaundryLimit?: (limit: number) => void;
  dailyDormLaundryLimit?: number;
  onSetDailyDormLaundryLimit?: (limit: number) => void;
}

export function ManageMachinesModal({
  isOpen,
  laundryMachines,
  newCustomMachine,
  setNewCustomMachine,
  onQuickSetCount,
  onDeleteMachine,
  onAddCustomMachine,
  onClose,
  dailyLaundryLimit = 2,
  onSetDailyLaundryLimit,
  dailyDormLaundryLimit = 25,
  onSetDailyDormLaundryLimit,
}: ManageMachinesModalProps) {
  if (!isOpen) return null;

  const washingCount = laundryMachines.filter(
    (m) => m.tur === "yikama" || m.tip.toLowerCase().includes("yıkama") || m.id.includes("Makine")
  ).length;
  const dryerCount = laundryMachines.filter(
    (m) => m.tur === "kurutma" || m.tip.toLowerCase().includes("kurutma") || m.id.includes("Kurutma")
  ).length;

  const [limitScope, setLimitScope] = useState<"kisi" | "yurt">("kisi");

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-xl space-y-4 my-8 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Basligi */}
        <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#0F172A]">
              Çamaşırhane Makine Ayarları
            </h3>
            <p className="text-xs text-[#64748B]">
              Makine sayılarını doğrudan artırıp azaltabilir veya özel makine tanımlayabilirsiniz.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Kapat"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 1. HIZLI SAYI AYARI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl">
          {/* Yikama Makineleri */}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
            <div>
              <span className="font-bold text-xs text-[#0F172A] block">Yıkama</span>
              <span className="text-[10px] text-[#64748B]">{washingCount} Makine</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onQuickSetCount("yikama", -1)}
                disabled={washingCount <= 1}
                className="w-8 h-8 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-black text-sm flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                title="Yıkama makinesi azalt"
              >
                -
              </button>
              <span className="w-6 text-center font-black text-sm text-[#0F172A]">
                {washingCount}
              </span>
              <button
                type="button"
                onClick={() => onQuickSetCount("yikama", 1)}
                className="w-8 h-8 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
                title="Yıkama makinesi artır"
              >
                +
              </button>
            </div>
          </div>

          {/* Kurutma Makineleri */}
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E2E8F0] shadow-xs">
            <div>
              <span className="font-bold text-xs text-[#0F172A] block">Kurutma</span>
              <span className="text-[10px] text-[#64748B]">{dryerCount} Makine</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onQuickSetCount("kurutma", -1)}
                disabled={dryerCount <= 0}
                className="w-8 h-8 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-black text-sm flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                title="Kurutma makinesi azalt"
              >
                -
              </button>
              <span className="w-6 text-center font-black text-sm text-[#0F172A]">
                {dryerCount}
              </span>
              <button
                type="button"
                onClick={() => onQuickSetCount("kurutma", 1)}
                className="w-8 h-8 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs"
                title="Kurutma makinesi artir"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* 2. GÜNLÜK MAKSİMUM ÇAMAŞIR ATMA LİMİTİ (KİŞİ BAŞI VE YURT BAŞI) */}
        <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-3">
          {/* Kapsam Seçici Sekmeler (Kişi Başı vs Yurt Başı) */}
          <div className="flex items-center gap-1 p-1 bg-white border border-[#E2E8F0] rounded-xl">
            <button
              type="button"
              onClick={() => setLimitScope("kisi")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center min-h-[34px] ${
                limitScope === "kisi"
                  ? "bg-[#0284C7] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
              }`}
            >
              Kişi Başı Limit ({dailyLaundryLimit === 0 ? "Sınırsız" : `${dailyLaundryLimit}`})
            </button>
            <button
              type="button"
              onClick={() => setLimitScope("yurt")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center min-h-[34px] ${
                limitScope === "yurt"
                  ? "bg-[#0284C7] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
              }`}
            >
              Yurt Başı Toplam ({dailyDormLaundryLimit === 0 ? "Sınırsız" : `${dailyDormLaundryLimit}`})
            </button>
          </div>

          {/* A. Kişi Başı Limit Ayarı */}
          {limitScope === "kisi" && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="font-bold text-xs text-[#0F172A] block">
                    Öğrenci Başına Günlük Hak
                  </span>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => onSetDailyLaundryLimit?.(Math.max(0, dailyLaundryLimit - 1))}
                    disabled={dailyLaundryLimit <= 0}
                    className="w-8 h-8 rounded-lg bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] font-black text-sm flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 shadow-xs"
                    title="Kişi başı limiti 1 azalt"
                    aria-label="Kişi başı limiti 1 azalt"
                  >
                    -
                  </button>
                  <div className="min-w-[110px] text-center px-2 py-1 bg-white border border-[#0284C7]/40 rounded-xl shadow-xs flex flex-col items-center justify-center focus-within:ring-2 focus-within:ring-[#0284C7]/20 focus-within:border-[#0284C7]">
                    <div className="flex items-center justify-center gap-1 w-full">
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={dailyLaundryLimit === 0 ? "" : dailyLaundryLimit}
                        placeholder="0"
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                          onSetDailyLaundryLimit?.(isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        className="w-12 text-center font-black text-xs sm:text-sm text-[#0284C7] bg-transparent focus:outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        title="Manuel sayı girin (0: Sınırsız)"
                      />
                      <span className="text-[11px] font-bold text-[#64748B]">Yıkama</span>
                    </div>
                    <span className="text-[9px] text-[#64748B] font-medium block">
                      {dailyLaundryLimit === 0 ? "0: Sınırsız" : "Günlük / Kişi"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSetDailyLaundryLimit?.(dailyLaundryLimit + 1)}
                    className="w-8 h-8 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs border border-[#0369A1]"
                    title="Kişi başı limiti 1 artır"
                    aria-label="Kişi başı limiti 1 artır"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* B. Yurt Başı Toplam Limit Ayarı */}
          {limitScope === "yurt" && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="font-bold text-xs text-[#0F172A] block">
                    Yurt Geneli Günlük Toplam Kapasite
                  </span>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const step = dailyDormLaundryLimit <= 5 ? 1 : 5;
                      onSetDailyDormLaundryLimit?.(Math.max(0, dailyDormLaundryLimit - step));
                    }}
                    disabled={dailyDormLaundryLimit <= 0}
                    className="w-8 h-8 rounded-lg bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] font-black text-sm flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 shadow-xs"
                    title="Yurt toplam limitini azalt"
                    aria-label="Yurt toplam limitini azalt"
                  >
                    -
                  </button>
                  <div className="min-w-[110px] text-center px-2 py-1 bg-white border border-[#0284C7]/40 rounded-xl shadow-xs flex flex-col items-center justify-center focus-within:ring-2 focus-within:ring-[#0284C7]/20 focus-within:border-[#0284C7]">
                    <div className="flex items-center justify-center gap-1 w-full">
                      <input
                        type="number"
                        min={0}
                        max={9999}
                        value={dailyDormLaundryLimit === 0 ? "" : dailyDormLaundryLimit}
                        placeholder="0"
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                          onSetDailyDormLaundryLimit?.(isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        className="w-14 text-center font-black text-xs sm:text-sm text-[#0284C7] bg-transparent focus:outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        title="Manuel sayı girin (0: Sınırsız)"
                      />
                      <span className="text-[11px] font-bold text-[#64748B]">Yıkama</span>
                    </div>
                    <span className="text-[9px] text-[#64748B] font-medium block">
                      {dailyDormLaundryLimit === 0 ? "0: Sınırsız" : "Günlük / Yurt"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const step = dailyDormLaundryLimit < 5 ? 1 : 5;
                      onSetDailyDormLaundryLimit?.(dailyDormLaundryLimit + step);
                    }}
                    className="w-8 h-8 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-xs border border-[#0369A1]"
                    title="Yurt toplam limitini artır"
                    aria-label="Yurt toplam limitini artır"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. MEVCUT MAKİNELER LİSTESİ */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#0F172A]">Mevcut Makineler ({laundryMachines.length})</span>
            <span className="text-[10px] text-[#64748B]">Takvim ve çizelgeler anında güncellenir</span>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl">
            {laundryMachines.map((m) => (
              <div
                key={m.id}
                className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.tur === "kurutma" || m.id.includes("Kurutma")
                        ? "bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0]"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {m.tur === "kurutma" || m.id.includes("Kurutma") ? "Kurutma" : "Yıkama"}
                  </span>
                  <div>
                    <span className="font-bold text-[#0F172A] block">{m.name}</span>
                    <span className="text-[10px] text-[#64748B]">{m.tip}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteMachine(m.id)}
                  disabled={laundryMachines.length <= 1}
                  className="text-[11px] text-[#64748B] hover:text-rose-600 font-semibold px-2 py-1 rounded cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Bu makineyi kaldır"
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. OZEL YENI MAKINE TANIMLAMA FORMU */}
        <form onSubmit={onAddCustomMachine} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-2.5 text-xs">
          <span className="font-bold text-[#0F172A] block text-xs">
            + Yeni Makine Ekle
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#64748B] block mb-1">Makine Adı / Kodu:</label>
              <input
                type="text"
                required
                placeholder="Örn: Makine 5 veya Hızlı Yıkama-1"
                value={newCustomMachine.name}
                onChange={(e) => setNewCustomMachine({ ...newCustomMachine, name: e.target.value })}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2 text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#64748B] block mb-1">Blok / Konum (İsteğe Bağlı):</label>
              <input
                type="text"
                placeholder="Örn: A Blok, Zemin Kat"
                value={newCustomMachine.blok}
                onChange={(e) => setNewCustomMachine({ ...newCustomMachine, blok: e.target.value })}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2 text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#64748B] block mb-1">Makine Türü:</label>
              <select
                value={newCustomMachine.tur}
                onChange={(e) => setNewCustomMachine({ ...newCustomMachine, tur: e.target.value as any })}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2 text-[#0F172A] focus:outline-none focus:border-[#0284C7] font-medium"
              >
                <option value="yikama">Çamaşır Yıkama Makinesi</option>
                <option value="kurutma">Kurutma Makinesi</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[#64748B] block mb-1">Kapasite (kg):</label>
              <input
                type="number"
                min="1"
                max="50"
                placeholder="Örn: 9"
                value={newCustomMachine.kapasiteKg}
                onChange={(e) => setNewCustomMachine({ ...newCustomMachine, kapasiteKg: e.target.value.replace(/^0+/, "") })}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2 text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl cursor-pointer transition-all shadow-xs text-xs min-h-[44px]"
          >
            Yeni Makineyi Ekle
          </button>
        </form>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold text-xs cursor-pointer transition-all shadow-xs min-h-[44px]"
          >
            Tamamla ve Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
