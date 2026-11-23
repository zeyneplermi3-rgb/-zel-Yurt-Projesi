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
  onSave: () => void;
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

  const handleCommitSave = () => {
    if (isInvalid) return;
    onStartHourChange(localSHour);
    onStartMinuteChange(localSMin);
    onEndHourChange(localEHour);
    onEndMinuteChange(localEMin);
    onSave();
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

        {/* Canlı Seçim Göstergeleri */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
            <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Başlangıç:</span>
            <span className="text-sm font-mono font-black text-[#0284C7]">
              {String(localSHour).padStart(2, "0")}:{String(localSMin).padStart(2, "0")}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155]">
            <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Bitiş:</span>
            <span className="text-sm font-mono font-black text-[#0284C7]">
              {String(localEHour).padStart(2, "0")}:{String(localEMin).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Kaydırmalı Çarklar (Başlangıç ve Bitiş) */}
        <div className="grid grid-cols-2 gap-3">
          {/* 1. Başlangıç Çarkı */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1.5 block">
              Başlangıç Saati
            </span>
            <div className="relative w-full h-[132px] rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
              {/* Merkez Seçim Vurgusu */}
              <div className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 h-[44px] rounded-xl bg-white dark:bg-[#1E293B] border-2 border-[#0284C7]/30 shadow-xs z-0" />
              {/* Üst ve Alt Gölgeleme */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[40px] bg-gradient-to-b from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent dark:from-[#0F172A] dark:via-[#0F172A]/80 z-10" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40px] bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent dark:from-[#0F172A] dark:via-[#0F172A]/80 z-10" />

              <div className="relative z-20 flex items-center justify-center h-full px-1">
                {/* Saat Sütunu */}
                <div
                  ref={startHourRef}
                  onScroll={handleScroll(HOURS, setLocalSHour)}
                  className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[44px] text-center"
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

                {/* Dakika Sütunu */}
                <div
                  ref={startMinuteRef}
                  onScroll={handleScroll(MINUTES, setLocalSMin)}
                  className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[44px] text-center"
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
          </div>

          {/* 2. Bitiş Çarkı */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1.5 block">
              Bitiş Saati
            </span>
            <div className="relative w-full h-[132px] rounded-2xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] overflow-hidden">
              {/* Merkez Seçim Vurgusu */}
              <div className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 h-[44px] rounded-xl bg-white dark:bg-[#1E293B] border-2 border-[#0284C7]/30 shadow-xs z-0" />
              {/* Üst ve Alt Gölgeleme */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[40px] bg-gradient-to-b from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent dark:from-[#0F172A] dark:via-[#0F172A]/80 z-10" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40px] bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/80 to-transparent dark:from-[#0F172A] dark:via-[#0F172A]/80 z-10" />

              <div className="relative z-20 flex items-center justify-center h-full px-1">
                {/* Saat Sütunu */}
                <div
                  ref={endHourRef}
                  onScroll={handleScroll(HOURS, setLocalEHour)}
                  className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[44px] text-center"
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

                {/* Dakika Sütunu */}
                <div
                  ref={endMinuteRef}
                  onScroll={handleScroll(MINUTES, setLocalEMin)}
                  className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none py-[44px] text-center"
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
          </div>
        </div>

        {/* Hata uyarısı */}
        {isInvalid && (
          <div className="text-[11px] font-bold text-rose-600 text-center">
            Bitiş saati başlangıç saatinden sonra olmalıdır
          </div>
        )}

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
