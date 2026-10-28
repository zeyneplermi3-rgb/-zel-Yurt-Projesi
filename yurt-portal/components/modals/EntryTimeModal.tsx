"use client";

import { useEffect } from "react";

interface EntryTimeModalProps {
  isOpen: boolean;
  title: string;
  hour: number;
  minute: number;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function EntryTimeModal({
  isOpen,
  title,
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  onClose,
  onSave,
}: EntryTimeModalProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        document.getElementById(`wheel-entry-h-${hour}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
        document.getElementById(`wheel-entry-m-${minute}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen, hour, minute]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E2E8F0] rounded-3xl max-w-xs sm:max-w-sm w-full p-5 sm:p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Basligi */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div>
            <h4 className="font-bold text-sm sm:text-base text-[#0F172A]">
              Giriş / Çıkış Saatini Ayarla
            </h4>
            <p className="text-[11px] sm:text-xs text-[#64748B] font-medium mt-0.5">
              {title}
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

        {/* Secili Saat Gostergesi */}
        <div className="flex items-center justify-center">
          <span className="text-sm font-mono font-black text-[#0284C7] bg-[#F1F5F9] px-3.5 py-1 rounded-xl border border-[#0284C7]/20 shadow-xs">
            {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
          </span>
        </div>

        {/* Kaydirmali Cark (Drum-roll Picker) */}
        <div className="relative w-full h-44 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden">
          {/* Ortadaki Vurgu Seridi */}
          <div className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 h-9 rounded-xl bg-white shadow-xs border border-[#0284C7]/25 z-0" />

          {/* Ust ve Alt Gecis Golgeleri */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent z-10" />

          {/* Sutunlar: Saat ve Dakika */}
          <div className="relative z-20 flex items-center justify-center h-full px-4">
            {/* Saat Sutunu */}
            <div className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[68px] text-center">
              {Array.from({ length: 24 }, (_, i) => i).map((h) => {
                const isSelected = hour === h;
                return (
                  <div
                    key={`entry-h-${h}`}
                    id={`wheel-entry-h-${h}`}
                    onClick={() => {
                      onHourChange(h);
                      document.getElementById(`wheel-entry-h-${h}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                    }}
                    className={`snap-center h-9 min-h-[36px] flex items-center justify-center font-mono cursor-pointer transition-all select-none ${
                      isSelected
                        ? "text-[#0F172A] font-black text-base sm:text-lg scale-110"
                        : "text-[#64748B]/50 text-xs sm:text-sm hover:text-[#0F172A]"
                    }`}
                  >
                    {String(h).padStart(2, "0")}
                  </div>
                );
              })}
            </div>

            <span className="text-base font-bold text-[#0F172A] select-none px-2 mb-0.5">:</span>

            {/* Dakika Sutunu */}
            <div className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[68px] text-center">
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => {
                const isSelected = minute === m;
                return (
                  <div
                    key={`entry-m-${m}`}
                    id={`wheel-entry-m-${m}`}
                    onClick={() => {
                      onMinuteChange(m);
                      document.getElementById(`wheel-entry-m-${m}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
                    }}
                    className={`snap-center h-9 min-h-[36px] flex items-center justify-center font-mono cursor-pointer transition-all select-none ${
                      isSelected
                        ? "text-[#0F172A] font-black text-base sm:text-lg scale-110"
                        : "text-[#64748B]/50 text-xs sm:text-sm hover:text-[#0F172A]"
                    }`}
                  >
                    {String(m).padStart(2, "0")}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center cursor-pointer active:scale-95 min-h-[44px]"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
