import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import AppSidebar from './AppSidebar';
import { Menu } from 'lucide-react';

export default function AppLayout() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${isMobile ? 'fixed inset-y-0 left-0 z-50 transition-transform duration-300' : ''} ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}>
        <AppSidebar onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
      </div>

      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        {isMobile && (
          <header className="sticky top-0 z-30 h-14 flex items-center px-4 border-b border-border bg-background/80 backdrop-blur-lg">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-secondary text-foreground"
            >
              <Menu size={22} />
            </button>
            <span className="ml-3 font-semibold text-foreground text-sm">SIX AI</span>
          </header>
        )}
        <div className="max-w-[1400px] mx-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
