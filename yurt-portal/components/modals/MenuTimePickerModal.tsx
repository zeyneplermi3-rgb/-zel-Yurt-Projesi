"use client";

import React from "react";

interface MenuTimePickerModalProps {
  isOpen: boolean;
  title: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  onStartHourChange: (h: number) => void;
  onStartMinuteChange: (m: number) => void;
  onEndHourChange: (h: number) => void;
  onEndMinuteChange: (m: number) => void;
  onClose: () => void;
  onSave: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export default function MenuTimePickerModal({
  isOpen,
  title,
  startHour,
  startMinute,
  endHour,
  endMinute,
  onStartHourChange,
  onStartMinuteChange,
  onEndHourChange,
  onEndMinuteChange,
  onClose,
  onSave,
}: MenuTimePickerModalProps) {
  if (!isOpen) return null;

  const sHStr = String(startHour).padStart(2, "0");
  const sMStr = String(startMinute).padStart(2, "0");
  const eHStr = String(endHour).padStart(2, "0");
  const eMStr = String(endMinute).padStart(2, "0");

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  const diffMinutes = endTotalMinutes - startTotalMinutes;
  const isInvalid = diffMinutes <= 0;

  const durationText = (() => {
    if (diffMinutes <= 0) return null;
    const h = Math.floor(diffMinutes / 60);
    const m = diffMinutes % 60;
    if (h === 0) return `${m} dakika`;
    if (m === 0) return `${h} saat`;
    return `${h} saat ${m} dakika`;
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#334155]">
          <div>
            <h4 className="font-bold text-sm sm:text-base text-[#0F172A] dark:text-[#F8FAFC]">
              Servis Saatini Belirle
            </h4>
            <p className="text-[11px] sm:text-xs text-[#64748B] dark:text-[#94A3B8] font-medium mt-0.5">
              {title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Kapat"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Saat Seçim Alanları (Başlangıç ve Bitiş Dropdownları) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Başlangıç Saati */}
          <div className="p-3 bg-[#F8FAFC] dark:bg-[#1E293B]/60 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] space-y-2">
            <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] block text-center">
              Başlangıç Saati
            </span>
            <div className="flex items-center gap-1.5">
              <select
                value={startHour}
                onChange={(e) => onStartHourChange(Number(e.target.value))}
                className="w-full bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl py-2 px-1 text-center font-mono font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#0284C7] cursor-pointer min-h-[44px]"
              >
                {HOURS.map((h) => (
                  <option key={`sh-${h}`} value={h}>
                    {String(h).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span className="font-bold text-stone-500 font-mono">:</span>
              <select
                value={startMinute}
                onChange={(e) => onStartMinuteChange(Number(e.target.value))}
                className="w-full bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl py-2 px-1 text-center font-mono font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#0284C7] cursor-pointer min-h-[44px]"
              >
                {MINUTES.map((m) => (
                  <option key={`sm-${m}`} value={m}>
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bitiş Saati */}
          <div className="p-3 bg-[#F8FAFC] dark:bg-[#1E293B]/60 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] space-y-2">
            <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] block text-center">
              Bitiş Saati
            </span>
            <div className="flex items-center gap-1.5">
              <select
                value={endHour}
                onChange={(e) => onEndHourChange(Number(e.target.value))}
                className="w-full bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl py-2 px-1 text-center font-mono font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#0284C7] cursor-pointer min-h-[44px]"
              >
                {HOURS.map((h) => (
                  <option key={`eh-${h}`} value={h}>
                    {String(h).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span className="font-bold text-stone-500 font-mono">:</span>
              <select
                value={endMinute}
                onChange={(e) => onEndMinuteChange(Number(e.target.value))}
                className="w-full bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-xl py-2 px-1 text-center font-mono font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#0284C7] cursor-pointer min-h-[44px]"
              >
                {MINUTES.map((m) => (
                  <option key={`em-${m}`} value={m}>
                    {String(m).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Canlı Önizleme ve Süre Şeridi */}
        <div className="p-3 bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl text-center space-y-0.5">
          <div className="text-base sm:text-lg font-mono font-black text-[#0284C7]">
            {sHStr}:{sMStr} - {eHStr}:{eMStr}
          </div>
          {isInvalid ? (
            <span className="text-[11px] font-bold text-rose-600 block">
              Bitiş saati başlangıç saatinden sonra olmalıdır
            </span>
          ) : (
            <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium block">
              Servis Süresi: {durationText}
            </span>
          )}
        </div>

        {/* Butonlar */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#334155]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#F1F5F9] dark:bg-[#1E293B] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isInvalid}
            className="px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center cursor-pointer active:scale-95 min-h-[44px] border border-[#0369A1]"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
