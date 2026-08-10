import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@xanh/utils';
import { requestTopup, requestWithdraw } from '../modules/wallet/api/wallet.api';
import { GlassSheet } from './glass-sheet';
import { GlassButton } from './glass-button';
import { useToast } from './toast';

const QUICK_AMOUNTS = [500000, 1000000, 2000000];

interface WalletSheetsValue {
  openTopup: () => void;
  openWithdraw: () => void;
}

const WalletSheetsContext = createContext<WalletSheetsValue | null>(null);

export function useWalletSheets(): WalletSheetsValue {
  const ctx = useContext(WalletSheetsContext);
  if (!ctx) throw new Error('useWalletSheets must be used within WalletSheetsProvider');
  return ctx;
}

export function WalletSheetsProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const toast = useToast();

  const [topupOpen, setTopupOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const [topupAmount, setTopupAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [note, setNote] = useState('');
  const [activeQuick, setActiveQuick] = useState<string | null>(null);

  const topupMut = useMutation({
    mutationFn: () => requestTopup(Number(topupAmount), 'Chuyển khoản ngân hàng'),
    onSuccess: () => {
      setTopupOpen(false);
      setTopupAmount('');
      setActiveQuick(null);
      qc.invalidateQueries({ queryKey: ['driver-dashboard'] });
      qc.invalidateQueries({ queryKey: ['driver-transactions'] });
      toast.show('Yêu cầu nạp tiền đã được gửi');
    },
    onError: (err: Error) => toast.show(err.message, 'err'),
  });

  const withdrawMut = useMutation({
    mutationFn: () => requestWithdraw(Number(withdrawAmount), bankInfo, note || undefined),
    onSuccess: () => {
      setWithdrawOpen(false);
      setWithdrawAmount('');
      setBankInfo('');
      setNote('');
      setActiveQuick(null);
      qc.invalidateQueries({ queryKey: ['driver-dashboard'] });
      qc.invalidateQueries({ queryKey: ['driver-transactions'] });
      toast.show('Yêu cầu rút tiền đã được gửi');
    },
    onError: (err: Error) => toast.show(err.message, 'err'),
  });

  const openTopup = useCallback(() => {
    setTopupAmount('');
    setActiveQuick(null);
    setTopupOpen(true);
  }, []);

  const openWithdraw = useCallback(() => {
    setWithdrawAmount('');
    setBankInfo('');
    setNote('');
    setActiveQuick(null);
    setWithdrawOpen(true);
  }, []);

  const handleQuick = (value: number, kind: 'topup' | 'withdraw') => {
    setActiveQuick(String(value));
    if (kind === 'topup') setTopupAmount(String(value));
    else setWithdrawAmount(String(value));
  };

  const value = useMemo(() => ({ openTopup, openWithdraw }), [openTopup, openWithdraw]);

  const topupAmountNum = Number(topupAmount);
  const withdrawAmountNum = Number(withdrawAmount);

  return (
    <WalletSheetsContext.Provider value={value}>
      {children}

      <GlassSheet
        open={topupOpen}
        onClose={() => setTopupOpen(false)}
        title="Nạp tiền"
        description="Số tiền sẽ được chuyển vào ví đối tác sau khi ngân hàng xác nhận."
        footer={
          <>
            <GlassButton variant="secondary" style={{ flex: 1 }} onClick={() => setTopupOpen(false)}>
              Hủy
            </GlassButton>
            <GlassButton
              style={{ flex: 1.6 }}
              isLoading={topupMut.isPending}
              disabled={!topupAmountNum || topupAmountNum < 10000}
              onClick={() => topupMut.mutate()}
            >
              Gửi yêu cầu
            </GlassButton>
          </>
        }
      >
        <div className="field">
          <label htmlFor="topupAmount">Số tiền</label>
          <div className="input-shell">
            <input
              id="topupAmount"
              type="number"
              inputMode="numeric"
              placeholder="0"
              min={10000}
              step={10000}
              value={topupAmount}
              onChange={(e) => {
                setTopupAmount(e.target.value);
                setActiveQuick(null);
              }}
            />
            <span className="meta" style={{ flex: 'none', fontWeight: 600 }}>₫</span>
          </div>
        </div>
        <div className="quick-amounts" style={{ marginTop: 12 }}>
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              className={`qamt ${activeQuick === String(amt) ? 'active' : ''}`}
              onClick={() => handleQuick(amt, 'topup')}
            >
              {amt >= 1000000 ? `${amt / 1000000}tr` : `${amt / 1000}K`}
            </button>
          ))}
        </div>
        <p className="amount-preview" style={{ marginTop: 14, minHeight: 20 }}>
          {topupAmountNum > 0 ? `Bạn sẽ nạp ${formatCurrency(topupAmountNum)}` : ''}
        </p>
        <div className="row-between" style={{ marginTop: 8 }}>
          <span className="meta" style={{ fontSize: 13 }}>Phương thức</span>
          <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Chuyển khoản ngân hàng</span>
        </div>
      </GlassSheet>

      <GlassSheet
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        title="Rút tiền"
        description={
          <>
            Số dư khả dụng: <span className="num" style={{ fontWeight: 700, color: 'var(--fg)' }}>2.847.500 ₫</span>
          </>
        }
        footer={
          <>
            <GlassButton variant="secondary" style={{ flex: 1 }} onClick={() => setWithdrawOpen(false)}>
              Hủy
            </GlassButton>
            <GlassButton
              style={{ flex: 1.6 }}
              isLoading={withdrawMut.isPending}
              disabled={!withdrawAmountNum || withdrawAmountNum < 50000 || !bankInfo.trim() || withdrawAmountNum > 2847500}
              onClick={() => withdrawMut.mutate()}
            >
              Gửi yêu cầu
            </GlassButton>
          </>
        }
      >
        <div className="field">
          <label htmlFor="withdrawAmount">Số tiền</label>
          <div className="input-shell">
            <input
              id="withdrawAmount"
              type="number"
              inputMode="numeric"
              placeholder="0"
              min={50000}
              step={50000}
              value={withdrawAmount}
              onChange={(e) => {
                setWithdrawAmount(e.target.value);
                setActiveQuick(null);
              }}
            />
            <span className="meta" style={{ flex: 'none', fontWeight: 600 }}>₫</span>
          </div>
        </div>
        <div className="quick-amounts" style={{ marginTop: 12 }}>
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              className={`qamt ${activeQuick === String(amt) ? 'active' : ''}`}
              onClick={() => handleQuick(amt, 'withdraw')}
            >
              {amt >= 1000000 ? `${amt / 1000000}tr` : `${amt / 1000}K`}
            </button>
          ))}
        </div>
        <p className="amount-preview" style={{ marginTop: 14, minHeight: 20 }}>
          {withdrawAmountNum > 0 ? `Bạn sẽ nhận ${formatCurrency(withdrawAmountNum)}` : ''}
        </p>
        {withdrawAmountNum > 0 && withdrawAmountNum > 2847500 && (
          <p className="meta" style={{ color: 'var(--danger)', marginTop: 8 }}>Số dư không đủ (khả dụng: 2.847.500 ₫)</p>
        )}
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="withdrawBank">Tài khoản nhận</label>
          <div className="input-shell">
            <input
              id="withdrawBank"
              type="text"
              placeholder="VD: Vietcombank · 1012345678"
              value={bankInfo}
              onChange={(e) => setBankInfo(e.target.value)}
            />
          </div>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="withdrawNote">
            Ghi chú <span className="meta">(không bắt buộc)</span>
          </label>
          <div className="input-shell">
            <input
              id="withdrawNote"
              type="text"
              placeholder="Ghi chú cho bộ phận quyết toán"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
      </GlassSheet>
    </WalletSheetsContext.Provider>
  );
}
