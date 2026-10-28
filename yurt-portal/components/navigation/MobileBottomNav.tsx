"use client";

interface NavItem {
  id: string;
  label: string;
  badge?: number;
}

interface MobileBottomNavProps {
  currentTab: string;
  onTabChange: (tabId: string) => void;
  items: NavItem[];
}

export default function MobileBottomNav({
  currentTab,
  onTabChange,
  items,
}: MobileBottomNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] shadow-lg px-2 py-1 pb-[max(0.4rem,env(safe-area-inset-bottom))]"
      aria-label="Mobil Alt Menü"
    >
      <div className="flex items-center justify-around gap-0.5 max-w-lg mx-auto">
        {items.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-0.5 rounded-xl transition-all cursor-pointer relative min-h-[44px] ${
                isActive
                  ? "text-[#0284C7] font-bold bg-[#F1F5F9]"
                  : "text-[#64748B] hover:text-[#0F172A] font-medium"
              }`}
            >
              <span className="text-[11px] truncate tracking-tight text-center">
                {tab.label}
              </span>
              {typeof tab.badge === "number" && tab.badge > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
