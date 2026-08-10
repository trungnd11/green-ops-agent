import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Bell } from 'lucide-react';
import { useNotificationWs } from '../app/websocket/use-notification-ws';
import { useTheme, ModePill } from '../shared';
import { Dock } from '../shared/dock';
import { Drawer } from '../shared/drawer';

function initialsOf(fullName?: string | null): string {
  if (!fullName) return 'G';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

export function DriverLayout({ children }: { children: React.ReactNode }) {
  const { theme, setMode } = useTheme();
  useNotificationWs();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('xanhsm-driver-auth') || '{}');
        const res = await fetch('/api/v1/driver/notifications/unread-count', {
          headers: { Authorization: `Bearer ${session.token || ''}` },
        });
        const json = await res.json();
        if (json.success) setUnreadCount(json.data?.count ?? 0);
      } catch {
        /* ignore */
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const session = (() => {
    try {
      return JSON.parse(localStorage.getItem('xanhsm-driver-auth') || '{}');
    } catch {
      return {};
    }
  })();

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col" data-app="driver">
      <div className="wall" aria-hidden="true">
        <div className="blob t1" />
        <div className="blob t2" />
        <div className="blob t3" />
      </div>

      <header className="topbar relative z-40">
        <div className="brand">
          <Link to="/" className="flex items-center gap-2">
            <span className="brand-mark">G</span>
            <span className="brand-word">Green<em>Ops</em></span>
          </Link>
        </div>
        <div className="top-actions">
          <ModePill theme={theme} onSelect={setMode} />
          <Link to="/notifications" className="icon-btn" aria-label="Thông báo">
            <Bell size={20} strokeWidth={1.7} />
            {unreadCount > 0 && <span className="badge-dot">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </Link>
          <Link to="/profile" className="avatar" aria-label="Hồ sơ">
            {initialsOf(session.fullName)}
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto pb-[132px]">{children}</main>

      <Dock onMenuClick={() => setDrawerOpen(true)} menuActive={drawerOpen} />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
