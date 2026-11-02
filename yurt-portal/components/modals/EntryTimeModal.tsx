"use client";

import { useEffect, useRef } from "react";

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

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const ITEM_HEIGHT = 36;

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
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const isProgrammaticRef = useRef(false);
  const initialAlignedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      initialAlignedRef.current = false;
      return;
    }
    if (initialAlignedRef.current) return;
    initialAlignedRef.current = true;

    const alignColumn = (ref: React.RefObject<HTMLDivElement | null>, idx: number) => {
      if (!ref.current) return;
      const child = ref.current.children[idx] as HTMLElement | undefined;
      if (child) {
        const targetTop = child.offsetTop - (ref.current.clientHeight - child.clientHeight) / 2;
        ref.current.scrollTop = targetTop;
      }
    };

    const alignAll = () => {
      isProgrammaticRef.current = true;
      alignColumn(hourRef, hour);
      const mIdx = MINUTES.indexOf(minute);
      if (mIdx !== -1) alignColumn(minuteRef, mIdx);

      setTimeout(() => {
        isProgrammaticRef.current = false;
      }, 200);
    };

    requestAnimationFrame(alignAll);
    const t1 = setTimeout(alignAll, 60);
    const t2 = setTimeout(alignAll, 180);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen, hour, minute]);

  if (!isOpen) return null;

  const createScrollHandler = (
    items: number[],
    onChange: (val: number) => void
  ) => {
    return (e: React.UIEvent<HTMLDivElement>) => {
      if (isProgrammaticRef.current) return;
      const target = e.currentTarget;
      const center = target.scrollTop + target.clientHeight / 2;
      let closestIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < target.children.length; i++) {
        const child = target.children[i] as HTMLElement;
        const childCenter = child.offsetTop + child.clientHeight / 2;
        const diff = Math.abs(center - childCenter);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }
      if (items[closestIdx] !== undefined) {
        onChange(items[closestIdx]);
      }
    };
  };

  const handleItemClick = (
    ref: React.RefObject<HTMLDivElement | null>,
    index: number,
    value: number,
    onChange: (val: number) => void
  ) => {
    onChange(value);
    if (ref.current) {
      isProgrammaticRef.current = true;
      const child = ref.current.children[index] as HTMLElement | undefined;
      if (child) {
        const targetTop = child.offsetTop - (ref.current.clientHeight - child.clientHeight) / 2;
        ref.current.scrollTo({ top: targetTop, behavior: "smooth" });
      }
      setTimeout(() => {
        isProgrammaticRef.current = false;
      }, 300);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-3xl max-w-xs sm:max-w-sm w-full p-5 sm:p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#334155]">
          <div>
            <h4 className="font-bold text-sm sm:text-base text-[#0F172A] dark:text-[#F8FAFC]">
              Giriş / Çıkış Saatini Ayarla
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

        {/* Seçili Saat Göstergesi */}
        <div className="flex items-center justify-center">
          <span className="text-sm font-mono font-black text-[#0284C7] bg-[#F1F5F9] dark:bg-[#1E293B] px-3.5 py-1 rounded-xl border border-[#0284C7]/20 shadow-xs">
            {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
          </span>
        </div>

        {/* Kaydırmalı Çark (Drum-roll Picker) */}
        <div className="relative w-full h-[180px] rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
          {/* Ortadaki Vurgu Şeridi */}
          <div className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 h-[36px] rounded-xl bg-white dark:bg-[#1E293B] shadow-xs border border-[#0284C7]/25 z-0" />

          {/* Üst ve Alt Geçiş Gölgeleri */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[50px] bg-gradient-to-b from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent dark:from-[#0F172A] dark:via-[#0F172A]/80 z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[50px] bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent dark:from-[#0F172A] dark:via-[#0F172A]/80 z-10" />

          {/* Sütunlar: Saat ve Dakika */}
          <div className="relative z-20 flex items-center justify-center h-full px-4">
            {/* Saat Sütunu */}
            <div
              ref={hourRef}
              onScroll={createScrollHandler(HOURS, onHourChange)}
              className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[72px] text-center"
            >
              {HOURS.map((h, idx) => {
                const isSelected = hour === h;
                return (
                  <div
                    key={`entry-h-${h}`}
                    onClick={() => handleItemClick(hourRef, idx, h, onHourChange)}
                    className={`snap-center h-[36px] min-h-[36px] max-h-[36px] flex items-center justify-center font-mono cursor-pointer transition-all select-none ${
                      isSelected
                        ? "text-[#0F172A] dark:text-[#F8FAFC] font-black text-base sm:text-lg scale-110"
                        : "text-[#64748B]/50 text-xs sm:text-sm hover:text-[#0F172A]"
                    }`}
                  >
                    {String(h).padStart(2, "0")}
                  </div>
                );
              })}
            </div>

            <span className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] select-none px-2 mb-0.5">:</span>

            {/* Dakika Sütunu */}
            <div
              ref={minuteRef}
              onScroll={createScrollHandler(MINUTES, onMinuteChange)}
              className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[72px] text-center"
            >
              {MINUTES.map((m, idx) => {
                const isSelected = minute === m;
                return (
                  <div
                    key={`entry-m-${m}`}
                    onClick={() => handleItemClick(minuteRef, idx, m, onMinuteChange)}
                    className={`snap-center h-[36px] min-h-[36px] max-h-[36px] flex items-center justify-center font-mono cursor-pointer transition-all select-none ${
                      isSelected
                        ? "text-[#0F172A] dark:text-[#F8FAFC] font-black text-base sm:text-lg scale-110"
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
            className="px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center cursor-pointer active:scale-95 min-h-[44px] border border-[#0369A1]"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}