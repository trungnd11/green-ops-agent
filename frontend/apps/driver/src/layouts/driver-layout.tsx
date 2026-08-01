import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@xanh/utils';
import { useNotificationWs } from '../app/websocket/use-notification-ws';
import { Home, Wallet, Bell, Receipt, User, LogOut, MessageSquare, Grid3X3 } from 'lucide-react';

const bottomNavItems = [
  { icon: Home, label: 'Trang chủ', to: '/' },
  { icon: Receipt, label: 'Doanh thu', to: '/income' },
  { icon: Wallet, label: 'Ví', to: '/wallet' },
  { icon: Bell, label: 'Thông báo', to: '/notifications' },
];

export function DriverLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  useNotificationWs();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('xanhsm-driver-auth') || '{}');
        const res = await fetch('/api/v1/driver/notifications/unread-count', {
          headers: { Authorization: `Bearer ${session.token || ''}` },
        });
        const json = await res.json();
        if (json.success) setUnreadCount(json.data?.count ?? 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { icon: User, label: 'Hồ sơ', to: '/profile' },
    { icon: MessageSquare, label: 'Khiếu nại', to: '/complaints' },
  ];

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col bg-bg-canvas text-text-primary" data-app="driver">
      <header className={`sticky top-0 z-30 border-b transition-all duration-300 ${scrolled ? 'bg-slate-950/40 backdrop-blur-sm border-white/10' : 'bg-transparent border-transparent'}`}>
        <div className="flex items-center justify-between px-4 h-12">
          <span className="text-sm font-bold tracking-wide text-brand-teal">GreenOps</span>
          <div className="flex items-center gap-2">
            <Link to="/notifications" className="relative p-1">
              <Bell className="h-5 w-5 text-text-secondary" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-semantic-error text-[10px] font-bold text-white px-1 ring-2 ring-surface-card">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => navigate({ to: '/profile' } as any)}
              className="p-1 cursor-pointer"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-teal/20">
                <User className="h-4 w-4 text-brand-teal" />
              </div>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto pb-24 safe-area-bottom">
        {children}
      </main>

      <nav className="fixed bottom-3 left-1/2 z-[1050] flex w-[calc(100%-32px)] max-w-[416px] -translate-x-1/2 items-center rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur-sm transition-colors px-1.5 py-2 shadow-lg gap-1" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to as '/' | '/income' | '/wallet' | '/notifications'}
              onClick={() => setDrawerOpen(false)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-1.5 py-1.5 text-[10px] leading-none transition-all duration-200 rounded-xl min-w-0 flex-1 whitespace-nowrap',
                isActive ? 'text-brand-teal bg-brand-teal/10' : 'text-text-disabled hover:text-text-secondary hover:bg-bg-subtle',
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className={`flex flex-col items-center gap-0.5 px-1.5 py-1.5 text-[10px] leading-none transition-all duration-200 rounded-xl min-w-0 flex-1 cursor-pointer whitespace-nowrap ${drawerOpen ? 'text-brand-teal bg-brand-teal/10' : 'text-text-disabled hover:text-text-secondary hover:bg-bg-subtle'}`}
        >
          <Grid3X3 className="h-5 w-5" />
          <span className="text-[10px]">Menu</span>
        </button>
      </nav>

      {drawerOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[416px] rounded-2xl bg-slate-950/40 backdrop-blur-sm transition-colors border border-white/10 overflow-hidden"
            style={{ bottom: 'calc(76px + 12px)', animation: 'slideUp 0.3s ease-out', boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
            <div className="flex flex-col gap-1 px-4 pt-5 pb-4">
          {menuItems.map((item) => (
            <button
              key={item.to}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-btn text-sm text-text-primary hover:bg-bg-subtle cursor-pointer"
              onClick={() => { navigate({ to: item.to } as any); setDrawerOpen(false); }}
            >
              <item.icon className="h-5 w-5 text-text-secondary" />
              {item.label}
            </button>
          ))}
          <div className="border-t border-border-default mx-5 my-3" />
          <button
            className="flex items-center gap-3 w-full px-4 py-3 rounded-btn text-sm text-red-500 hover:bg-red-500/5 cursor-pointer"
            onClick={() => {
              localStorage.removeItem('xanhsm-driver-auth');
              queryClient.clear();
              navigate({ to: '/login' } as any);
            }}
          >
            <LogOut className="h-5 w-5" /> Đăng xuất
          </button>
        </div>
          </div>
        </div>
      )}
    </div>
  );
}
