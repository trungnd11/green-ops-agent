import type { ReactNode } from 'react';

export type TileVariant = 'accent' | 'ok' | 'bad' | 'info';

const VARIANT_CLASS: Record<TileVariant, string> = {
  accent: 'accent',
  ok: 'ok',
  bad: 'bad',
  info: 'info',
};

export function IconTile({ variant = 'info', children }: { variant?: TileVariant; children: ReactNode }) {
  return <div className={`icon-tile ${VARIANT_CLASS[variant]}`}>{children}</div>;
}
