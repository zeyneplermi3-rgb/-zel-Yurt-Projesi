"use client";

import React, { useEffect, useRef, useState } from "react";

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
  onSave: (sh?: number, sm?: number, eh?: number, em?: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const ITEM_HEIGHT = 44;

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
  const [localSHour, setLocalSHour] = useState(startHour);
  const [localSMin, setLocalSMin] = useState(startMinute);
  const [localEHour, setLocalEHour] = useState(endHour);
  const [localEMin, setLocalEMin] = useState(endMinute);

  const startHourRef = useRef<HTMLDivElement>(null);
  const startMinuteRef = useRef<HTMLDivElement>(null);
  const endHourRef = useRef<HTMLDivElement>(null);
  const endMinuteRef = useRef<HTMLDivElement>(null);

  // Modal acildiginda yerel state'i senkronize et ve carklari tam konuma kaydir
  useEffect(() => {
    if (!isOpen) return;

    setLocalSHour(startHour);
    setLocalSMin(startMinute);
    setLocalEHour(endHour);
    setLocalEMin(endMinute);

    const scrollToTarget = () => {
      if (startHourRef.current) {
        startHourRef.current.scrollTop = startHour * ITEM_HEIGHT;
      }
      if (startMinuteRef.current) {
        const mIdx = Math.max(0, MINUTES.indexOf(startMinute));
        startMinuteRef.current.scrollTop = mIdx * ITEM_HEIGHT;
      }
      if (endHourRef.current) {
        endHourRef.current.scrollTop = endHour * ITEM_HEIGHT;
      }
      if (endMinuteRef.current) {
        const emIdx = Math.max(0, MINUTES.indexOf(endMinute));
        endMinuteRef.current.scrollTop = emIdx * ITEM_HEIGHT;
      }
    };

    // DOM yerlestikten sonra aninda hizala
    const timer = setTimeout(scrollToTarget, 30);
    return () => clearTimeout(timer);
  }, [isOpen, startHour, startMinute, endHour, endMinute]);

  if (!isOpen) return null;

  const startTotalMinutes = localSHour * 60 + localSMin;
  const endTotalMinutes = localEHour * 60 + localEMin;
  const isInvalid = endTotalMinutes <= startTotalMinutes;

  const handleScroll = (
    items: number[],
    setter: (val: number) => void
  ) => {
    return (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const idx = Math.round(target.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      if (items[clamped] !== undefined) {
        setter(items[clamped]);
      }
    };
  };

  const handleItemClick = (
    ref: React.RefObject<HTMLDivElement | null>,
    idx: number,
    val: number,
    setter: (v: number) => void
  ) => {
    setter(val);
    if (ref.current) {
      ref.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "smooth" });
    }
  };

  // Fare ile dikey surukleme destegi
  const handleMouseDown = (ref: React.RefObject<HTMLDivElement | null>) => (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const startY = e.clientY;
    const initialScrollTop = el.scrollTop;

    const onMouseMove = (ev: MouseEvent) => {
      el.scrollTop = initialScrollTop - (ev.clientY - startY);
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Bir adim ileri / geri buton destegi
  const handleStep = (
    ref: React.RefObject<HTMLDivElement | null>,
    items: number[],
    currentVal: number,
    direction: -1 | 1,
    setter: (v: number) => void
  ) => {
    const currentIdx = items.indexOf(currentVal);
    const newIdx = Math.max(0, Math.min(items.length - 1, currentIdx + direction));
    const nextVal = items[newIdx];
    if (nextVal !== undefined) {
      setter(nextVal);
      if (ref.current) {
        ref.current.scrollTo({ top: newIdx * ITEM_HEIGHT, behavior: "smooth" });
      }
    }
  };

  const handleCommitSave = () => {
    let finalSH = localSHour;
    let finalSM = localSMin;
    let finalEH = localEHour;
    let finalEM = localEMin;

    if (startHourRef.current) {
      const idx = Math.round(startHourRef.current.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(HOURS.length - 1, idx));
      if (HOURS[clamped] !== undefined) finalSH = HOURS[clamped];
    }
    if (startMinuteRef.current) {
      const idx = Math.round(startMinuteRef.current.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(MINUTES.length - 1, idx));
      if (MINUTES[clamped] !== undefined) finalSM = MINUTES[clamped];
    }
    if (endHourRef.current) {
      const idx = Math.round(endHourRef.current.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(HOURS.length - 1, idx));
      if (HOURS[clamped] !== undefined) finalEH = HOURS[clamped];
    }
    if (endMinuteRef.current) {
      const idx = Math.round(endMinuteRef.current.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(MINUTES.length - 1, idx));
      if (MINUTES[clamped] !== undefined) finalEM = MINUTES[clamped];
    }

    const startTotal = finalSH * 60 + finalSM;
    const endTotal = finalEH * 60 + finalEM;
    if (endTotal <= startTotal) return;

    onStartHourChange(finalSH);
    onStartMinuteChange(finalSM);
    onEndHourChange(finalEH);
    onEndMinuteChange(finalEM);
    onSave(finalSH, finalSM, finalEH, finalEM);
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
        {/* Modal Basligi */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#334155]">
          <div>
            <h4 className="font-bold text-sm sm:text-base text-[#0F172A] dark:text-[#F8FAFC]">
              Servis Saatini Ayarla
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


        {/* Kaydirmali Carklar (Baslangic ve Bitis) */}
        <div className="grid grid-cols-2 gap-3">
          {/* 1. Baslangic Carki */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1.5 block">
              Baslangic Saati
            </span>
            <div className="relative w-full rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] p-1">
              {/* Yukari Butonlari */}
              <div className="flex justify-around items-center pb-1 border-b border-[#E2E8F0]/50 dark:border-[#334155]/50">
                <button
                  type="button"
                  onClick={() => handleStep(startHourRef, HOURS, localSHour, -1, setLocalSHour)}
                  className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-[#64748B] cursor-pointer"
                  title="Saat Azalt"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <div className="w-2" />
                <button
                  type="button"
                  onClick={() => handleStep(startMinuteRef, MINUTES, localSMin, -1, setLocalSMin)}
                  className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-[#64748B] cursor-pointer"
                  title="Dakika Azalt"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </div>

              {/* Cark Kapsayici */}
              <div className="relative w-full h-[132px] overflow-hidden">
                {/* Merkez Secim Vurgusu */}
                <div className="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 h-[44px] rounded-xl bg-white dark:bg-[#1E293B] border-2 border-[#0284C7]/30 shadow-xs z-0" />
                {/* Ust ve Alt Golgeleme */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[36px] bg-gradient-to-b from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent dark:from-[#0F172A] dark:via-[#0F172A]/80 z-10" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[36px] bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent dark:from-[#0F172A] dark:via-[#0F172A]/80 z-10" />

                <div className="relative z-20 flex items-center justify-center h-full px-1">
                  {/* Saat Sutunu */}
                  <div
                    ref={startHourRef}
                    onScroll={handleScroll(HOURS, setLocalSHour)}
                    onMouseDown={handleMouseDown(startHourRef)}
                    className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[44px] text-center cursor-grab active:cursor-grabbing select-none"
                  >
                    {HOURS.map((h, idx) => {
                      const isSelected = localSHour === h;
                      return (
                        <div
                          key={`sh-${h}`}
                          onClick={() => handleItemClick(startHourRef, idx, h, setLocalSHour)}
                          className={`snap-center h-[44px] min-h-[44px] flex items-center justify-center font-mono cursor-pointer transition-all select-none ${
                            isSelected
                              ? "text-[#0284C7] dark:text-[#38BDF8] font-black text-lg scale-110"
                              : "text-[#64748B] text-xs opacity-50 hover:opacity-100"
                          }`}
                        >
                          {String(h).padStart(2, "0")}
                        </div>
                      );
                    })}
                  </div>

                  <span className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] select-none px-0.5">:</span>

                  {/* Dakika Sutunu */}
                  <div
                    ref={startMinuteRef}
                    onScroll={handleScroll(MINUTES, setLocalSMin)}
                    onMouseDown={handleMouseDown(startMinuteRef)}
                    className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[44px] text-center cursor-grab active:cursor-grabbing select-none"
                  >
                    {MINUTES.map((m, idx) => {
                      const isSelected = localSMin === m;
                      return (
                        <div
                          key={`sm-${m}`}
                          onClick={() => handleItemClick(startMinuteRef, idx, m, setLocalSMin)}
                          className={`snap-center h-[44px] min-h-[44px] flex items-center justify-center font-mono cursor-pointer transition-all select-none ${
                            isSelected
                              ? "text-[#0284C7] dark:text-[#38BDF8] font-black text-lg scale-110"
                              : "text-[#64748B] text-xs opacity-50 hover:opacity-100"
                          }`}
                        >
                          {String(m).padStart(2, "0")}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Asagi Butonlari */}
              <div className="flex justify-around items-center pt-1 border-t border-[#E2E8F0]/50 dark:border-[#334155]/50">
                <button
                  type="button"
                  onClick={() => handleStep(startHourRef, HOURS, localSHour, 1, setLocalSHour)}
                  className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-[#64748B] cursor-pointer"
                  title="Saat Artir"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="w-2" />
                <button
                  type="button"
                  onClick={() => handleStep(startMinuteRef, MINUTES, localSMin, 1, setLocalSMin)}
                  className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-[#64748B] cursor-pointer"
                  title="Dakika Artir"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Bitis Carki */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1.5 block">
              Bitis Saati
            </span>
            <div className="relative w-full rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] p-1">
              {/* Yukari Butonlari */}
              <div className="flex justify-around items-center pb-1 border-b border-[#E2E8F0]/50 dark:border-[#334155]/50">
                <button
                  type="button"
                  onClick={() => handleStep(endHourRef, HOURS, localEHour, -1, setLocalEHour)}
                  className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-[#64748B] cursor-pointer"
                  title="Saat Azalt"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <div className="w-2" />
                <button
                  type="button"
                  onClick={() => handleStep(endMinuteRef, MINUTES, localEMin, -1, setLocalEMin)}
                  className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-[#64748B] cursor-pointer"
                  title="Dakika Azalt"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </div>

              {/* Cark Kapsayici */}
              <div className="relative w-full h-[132px] overflow-hidden">
                {/* Merkez Secim Vurgusu */}
                <div className="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 h-[44px] rounded-xl bg-white dark:bg-[#1E293B] border-2 border-[#0284C7]/30 shadow-xs z-0" />
                {/* Ust ve Alt Golgeleme */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[36px] bg-gradient-to-b from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent dark:from-[#0F172A] dark:via-[#0F172A]/80 z-10" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[36px] bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent dark:from-[#0F172A] dark:via-[#0F172A]/80 z-10" />

                <div className="relative z-20 flex items-center justify-center h-full px-1">
                  {/* Saat Sutunu */}
                  <div
                    ref={endHourRef}
                    onScroll={handleScroll(HOURS, setLocalEHour)}
                    onMouseDown={handleMouseDown(endHourRef)}
                    className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[44px] text-center cursor-grab active:cursor-grabbing select-none"
                  >
                    {HOURS.map((h, idx) => {
                      const isSelected = localEHour === h;
                      return (
                        <div
                          key={`eh-${h}`}
                          onClick={() => handleItemClick(endHourRef, idx, h, setLocalEHour)}
                          className={`snap-center h-[44px] min-h-[44px] flex items-center justify-center font-mono cursor-pointer transition-all select-none ${
                            isSelected
                              ? "text-[#0284C7] dark:text-[#38BDF8] font-black text-lg scale-110"
                              : "text-[#64748B] text-xs opacity-50 hover:opacity-100"
                          }`}
                        >
                          {String(h).padStart(2, "0")}
                        </div>
                      );
                    })}
                  </div>

                  <span className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] select-none px-0.5">:</span>

                  {/* Dakika Sutunu */}
                  <div
                    ref={endMinuteRef}
                    onScroll={handleScroll(MINUTES, setLocalEMin)}
                    onMouseDown={handleMouseDown(endMinuteRef)}
                    className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[44px] text-center cursor-grab active:cursor-grabbing select-none"
                  >
                    {MINUTES.map((m, idx) => {
                      const isSelected = localEMin === m;
                      return (
                        <div
                          key={`em-${m}`}
                          onClick={() => handleItemClick(endMinuteRef, idx, m, setLocalEMin)}
                          className={`snap-center h-[44px] min-h-[44px] flex items-center justify-center font-mono cursor-pointer transition-all select-none ${
                            isSelected
                              ? "text-[#0284C7] dark:text-[#38BDF8] font-black text-lg scale-110"
                              : "text-[#64748B] text-xs opacity-50 hover:opacity-100"
                          }`}
                        >
                          {String(m).padStart(2, "0")}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Asagi Butonlari */}
              <div className="flex justify-around items-center pt-1 border-t border-[#E2E8F0]/50 dark:border-[#334155]/50">
                <button
                  type="button"
                  onClick={() => handleStep(endHourRef, HOURS, localEHour, 1, setLocalEHour)}
                  className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-[#64748B] cursor-pointer"
                  title="Saat Artir"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="w-2" />
                <button
                  type="button"
                  onClick={() => handleStep(endMinuteRef, MINUTES, localEMin, 1, setLocalEMin)}
                  className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded text-[#64748B] cursor-pointer"
                  title="Dakika Artir"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hata uyarisi */}
        {isInvalid && (
          <div className="text-[11px] font-bold text-rose-600 text-center">
            Bitis saati baslangic saatinden sonra olmalidir
          </div>
        )}

        {/* Butonlar */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#334155]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#F1F5F9] dark:bg-[#1E293B] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
          >
            Vazgec
          </button>
          <button
            type="button"
            onClick={handleCommitSave}
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
