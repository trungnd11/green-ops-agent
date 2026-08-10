import { Link, useLocation } from '@tanstack/react-router';
import { Home, Receipt, Wallet, Bell, Grid3X3 } from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home, label: 'Trang chủ', to: '/' },
  { icon: Receipt, label: 'Doanh thu', to: '/income' },
  { icon: Wallet, label: 'Ví', to: '/wallet' },
  { icon: Bell, label: 'Thông báo', to: '/notifications' },
];

export function Dock({ onMenuClick, menuActive }: { onMenuClick: () => void; menuActive: boolean }) {
  const location = useLocation();
  return (
    <nav className="dock" data-od-id="dock">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Link key={item.to} to={item.to as '/' | '/income' | '/wallet' | '/notifications'} className={`dock-item ${isActive ? 'active' : ''}`}>
            <item.icon size={22} strokeWidth={1.7} />
            {item.label}
          </Link>
        );
      })}
      <button type="button" className={`dock-item ${menuActive ? 'active' : ''}`} onClick={onMenuClick}>
        <Grid3X3 size={22} strokeWidth={1.7} />
        Menu
      </button>
    </nav>
  );
}
