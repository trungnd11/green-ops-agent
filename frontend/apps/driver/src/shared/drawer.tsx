import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { User, MessageSquare, LogOut } from 'lucide-react';

export function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const go = (to: string) => {
    navigate({ to } as never);
    onClose();
  };

  const logout = () => {
    localStorage.removeItem('xanhsm-driver-auth');
    qc.clear();
    navigate({ to: '/login' } as never);
    onClose();
  };

  return (
    <>
      <div className={`overlay ${open ? 'show' : ''}`} onClick={onClose} />
      <div className={`drawer glass ${open ? 'show' : ''}`} data-od-id="drawer">
        <button type="button" className="drawer-item" onClick={() => go('/profile')}>
          <User size={20} strokeWidth={1.8} /> Hồ sơ
        </button>
        <button type="button" className="drawer-item" onClick={() => go('/complaints')}>
          <MessageSquare size={20} strokeWidth={1.8} /> Khiếu nại
        </button>
        <hr className="divider" style={{ margin: '6px 12px' }} />
        <button type="button" className="drawer-item danger" onClick={logout}>
          <LogOut size={20} strokeWidth={1.8} /> Đăng xuất
        </button>
      </div>
    </>
  );
}
