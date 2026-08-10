import type { ReactNode } from 'react';

type PillVariant = 'ok' | 'warn' | 'bad' | 'pending';

const VARIANT_CLASS: Record<PillVariant, string> = {
  ok: 'pill-ok',
  warn: 'pill-warn',
  bad: 'pill-bad',
  pending: 'pill-pend',
};

export function StatusPill({ variant, children }: { variant: PillVariant; children: ReactNode }) {
  return <span className={`pill-status ${VARIANT_CLASS[variant]}`}>{children}</span>;
}
