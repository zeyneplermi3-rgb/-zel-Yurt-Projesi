"use client";

import { useEffect, useRef } from "react";

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
const ITEM_HEIGHT = 36;

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
  const startHourRef = useRef<HTMLDivElement>(null);
  const startMinuteRef = useRef<HTMLDivElement>(null);
  const endHourRef = useRef<HTMLDivElement>(null);
  const endMinuteRef = useRef<HTMLDivElement>(null);
  const isProgrammaticRef = useRef(false);
  const initialAlignedRef = useRef(false);

  // Modal acildiginda carklari tam matematiksel merkez konumlarina tasi
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
      alignColumn(startHourRef, startHour);
      const smIdx = MINUTES.indexOf(startMinute);
      if (smIdx !== -1) alignColumn(startMinuteRef, smIdx);

      alignColumn(endHourRef, endHour);
      const emIdx = MINUTES.indexOf(endMinute);
      if (emIdx !== -1) alignColumn(endMinuteRef, emIdx);

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
  }, [isOpen, startHour, startMinute, endHour, endMinute]);

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
        className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#334155]">
          <div>
            <h4 className="font-bold text-sm sm:text-base text-[#0F172A] dark:text-[#F8FAFC]">
              Servis Saati Aralığını Ayarla
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

        {/* Çift Çark Seçici (Başlangıç ve Bitiş) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Başlangıç Bölümü */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-between w-full px-1 mb-2">
              <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">Başlangıç</span>
              <span className="text-xs font-mono font-extrabold text-[#0284C7] bg-[#F1F5F9] dark:bg-[#1E293B] px-2 py-0.5 rounded-lg border border-[#0284C7]/20 shadow-2xs">
                {String(startHour).padStart(2, "0")}:{String(startMinute).padStart(2, "0")}
              </span>
            </div>

            {/* Başlangıç Kaydırmalı Çarkı */}
            <div className="relative w-full h-[180px] rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
              <div className="pointer-events-none absolute inset-x-1.5 top-1/2 -translate-y-1/2 h-[36px] rounded-xl bg-white dark:bg-[#1E293B] shadow-xs border border-[#0284C7]/25 z-0" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[50px] bg-gradient-to-b from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent dark:from-[#0F172A] dark:via-[#0F172A]/80 z-10" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[50px] bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent dark:from-[#0F172A] dark:via-[#0F172A]/80 z-10" />

              <div className="relative z-20 flex items-center justify-center h-full px-1">
                {/* Saat Sütunu */}
                <div
                  ref={startHourRef}
                  onScroll={createScrollHandler(HOURS, onStartHourChange)}
                  className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[72px] text-center"
                >
                  {HOURS.map((h, idx) => {
                    const isSelected = startHour === h;
                    return (
                      <div
                        key={`sh-${h}`}
                        onClick={() => handleItemClick(startHourRef, idx, h, onStartHourChange)}
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

                <span className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] select-none px-0.5 mb-0.5">:</span>

                {/* Dakika Sütunu */}
                <div
                  ref={startMinuteRef}
                  onScroll={createScrollHandler(MINUTES, onStartMinuteChange)}
                  className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[72px] text-center"
                >
                  {MINUTES.map((m, idx) => {
                    const isSelected = startMinute === m;
                    return (
                      <div
                        key={`sm-${m}`}
                        onClick={() => handleItemClick(startMinuteRef, idx, m, onStartMinuteChange)}
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
          </div>

          {/* Bitiş Bölümü */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-between w-full px-1 mb-2">
              <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">Bitiş</span>
              <span className="text-xs font-mono font-extrabold text-[#0284C7] bg-[#F1F5F9] dark:bg-[#1E293B] px-2 py-0.5 rounded-lg border border-[#0284C7]/20 shadow-2xs">
                {String(endHour).padStart(2, "0")}:{String(endMinute).padStart(2, "0")}
              </span>
            </div>

            {/* Bitiş Kaydırmalı Çarkı */}
            <div className="relative w-full h-[180px] rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
              <div className="pointer-events-none absolute inset-x-1.5 top-1/2 -translate-y-1/2 h-[36px] rounded-xl bg-white dark:bg-[#1E293B] shadow-xs border border-[#0284C7]/30 z-0" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[50px] bg-gradient-to-b from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent dark:from-[#0F172A] dark:via-[#0F172A]/80 z-10" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[50px] bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent dark:from-[#0F172A] dark:via-[#0F172A]/80 z-10" />

              <div className="relative z-20 flex items-center justify-center h-full px-1">
                {/* Saat Sütunu */}
                <div
                  ref={endHourRef}
                  onScroll={createScrollHandler(HOURS, onEndHourChange)}
                  className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[72px] text-center"
                >
                  {HOURS.map((h, idx) => {
                    const isSelected = endHour === h;
                    return (
                      <div
                        key={`eh-${h}`}
                        onClick={() => handleItemClick(endHourRef, idx, h, onEndHourChange)}
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

                <span className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] select-none px-0.5 mb-0.5">:</span>

                {/* Dakika Sütunu */}
                <div
                  ref={endMinuteRef}
                  onScroll={createScrollHandler(MINUTES, onEndMinuteChange)}
                  className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[72px] text-center"
                >
                  {MINUTES.map((m, idx) => {
                    const isSelected = endMinute === m;
                    return (
                      <div
                        key={`em-${m}`}
                        onClick={() => handleItemClick(endMinuteRef, idx, m, onEndMinuteChange)}
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