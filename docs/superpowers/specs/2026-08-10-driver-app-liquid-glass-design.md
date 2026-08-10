# Driver App — Liquid Glass Redesign

- **Date:** 2026-08-10
- **Status:** Approved by user
- **Source design:** `frontend/design/driver-app-liquid-glass.html` (Apple Liquid Glass mockup)
- **Target:** `frontend/apps/driver` (React + Tailwind v4 + TanStack Router + React Query)

## Goal

Restyle the entire driver app (all screens + layout + interactions) to match the
`driver-app-liquid-glass.html` design: glass surfaces with backdrop blur, ambient
animated wallpaper, floating dock, drawer, bottom sheets, light/dark theme toggle.
All business logic (APIs, React Query, routing, auth, WebSocket notifications) is
kept unchanged.

## Scope

- Full visual restyle of all screens: login, home, income, wallet, notifications,
  complaints (list + detail), profile.
- New layout chrome: glass topbar, floating glass dock (5 items incl. Menu),
  drawer, bottom sheets (nạp tiền / rút tiền / tạo khiếu nại), glass toast.
- Light/dark theme toggle (topbar + login), persisted in localStorage
  (`greenops-driver-theme`), applied via `data-theme` on `<html>`.
- Fonts: Manrope (display) + Inter (body) via Google Fonts in `index.html`.
- Out of scope: admin app, backend, API changes, feature changes.

## Approach (chosen: A — CSS glass layer)

A shared glass design-system CSS layer modeled on the mockup, plus CSS variables
for dark/light theming. Tailwind v4 stays for layout/typography. Rejected:
pure-Tailwind utilities (verbose, drifts from mockup) and CSS Modules
(no global consistency).

## Design tokens (extend `packages/design-tokens/src/driver-theme.css`)

Port the mockup `:root` token contract with dark (default) + light
(`[data-theme="light"]`):

- Brand: `--brand-teal #00C7A5`, `--brand-cyan #00AEEF`, `--brand-deep #007D73`,
  `--brand-lime #A3E635`, accent + hover/active, `--teal-fg`, `--danger-on`.
- Semantic: `--success`, `--warn`, `--danger`, `--pending`.
- Surface/glass: `--surface`, `--surface-strong`, `--surface-solid`,
  `--specular`, `--sheen`, `--border`, `--border-soft`.
- Text: `--fg`, `--fg-2`, `--muted`, `--meta`; backgrounds `--bg`, `--bg-deep`.
- Wallpaper: `--wall-a/b/c`, `--wall-grain`.
- Typography: `--font-display` (Manrope), `--font-body` (Inter).
- Radius, motion, space scales from the mockup.
- Light mode values override text/surface/semantic/wall tokens.

Consumer app also keeps existing Tailwind `@theme` tokens (`bg-bg-canvas`,
`text-text-primary`, etc.) — both systems coexist; glass layer takes over the
visual language.

## Style layer (new `apps/driver/src/app/styles/driver-glass.css`)

Port mockup CSS classes, adapted to the React app:

- Base: body font/color, focus ring, selection, `::placeholder`.
- Wallpaper: `.wall` + animated `.blob.t1/t2/t3` with drift keyframes +
  `prefers-reduced-motion` fallback.
- Glass material: `.glass`, `.glass-soft` (backdrop-filter blur+saturate, sheen
  gradient, inset specular highlight).
- Topbar: `.topbar` (sticky, blurred), `.brand-mark` (gradient tile "G"),
  `.brand-word`, `.icon-btn`, `.badge-dot`, `.avatar`, `.mode-pill`.
- Typography: `.eyebrow`, `.h1`, `.h2`, `.section-title`, `.body2`, `.muted`,
  `.meta`, `.row-between`.
- Cards: `.card`, `.card.tap`, `.hero` (gradient + blur), `.hero-value`.
- Buttons: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`,
  `.action-grid`, `.action-card` (+ `.primary`).
- Inputs: `.field`, `.input-shell` (+ focus ring, `.err`), `.textarea-shell`,
  `.select-shell`, `.chips`, `.chip` (+ `.active`).
- Lists/status: `.row`, `.icon-tile` (`.accent/.ok/.bad/.info`), `.pill-status`
  (`.pill-ok/.pill-warn/.pill-bad/.pill-pend`), `.divider`.
- Dock: `.dock`, `.dock-item` (+ `.active`).
- Drawer: `.overlay`, `.drawer`, `.drawer-item` (+ `.danger`).
- Sheets: `.sheet-scrim`, `.sheet`, `.sheet-handle`, `.sheet-title`,
  `.sheet-desc`, `.quick-amounts`, `.qamt` (+ `.active`), `.amount-preview`.
- Toast: `.toast` (+ `.ok/.err`).
- Login: `.login-wrap`, `.login-top`, `.login-logo`, `.login-brand`,
  `.login-sub`, `.login-card`, `.login-demo`.
- Misc: `.stat-grid`, `.stat`, `.profile-head`, `.profile-avatar`, `.info-row`,
  `.notif`, `.unread-dot`, `.empty-state`, `.back-btn`, `.period-card`,
  `.complaint`.

Media queries: desktop frame (device column ≥520px with rounded bezel), reduced
motion.

## Components (new, under `apps/driver/src/shared/`)

- `glass-sheet.tsx` — bottom sheet + scrim: handle, title/desc, children,
  close button, quick amounts row, preview line, cancel/submit actions; open via
  local state, animation via `.show` class + requestAnimationFrame.
- `mode-pill.tsx` — light/dark toggle (two icon buttons).
- `status-pill.tsx` — pill + dot, variants ok/warn/bad/pending.
- `icon-tile.tsx` — 42px tile, variants accent/ok/bad/info.
- `glass-button.tsx` — wraps `.btn` variants (primary/secondary/ghost) with
  `isLoading` support.
- `dock.tsx` + `drawer.tsx` — replace the current nav block in
  `driver-layout.tsx`; drawer items: Hồ sơ, Khiếu nại, divider, Đăng xuất.
- `toast.tsx` — context-based glass toast (ok/err), replaces `@xanh/ui`
  notification usage inside the driver app only.
- `theme.ts` — theme hook: read/write `data-theme`, persist
  `greenops-driver-theme`, initial read, default dark.

Keep `lucide-react` icons (same stroke style as mockup SVGs).

## Page restyle (logic unchanged)

| Page | Changes |
|------|---------|
| `layouts/driver-layout.tsx` | Glass topbar (brand, mode-pill, bell+badge, avatar), wallpaper, dock, drawer, toast provider; remove `@xanh/ui` dialog usage from pages |
| `login-page.tsx` | Mockup layout: logo block, glass login card, input-shell, error line; keep TanStack Form + `authStore.login` |
| `home-page.tsx` | Hero balance card, action grid (nạp/rút → open sheets), settlement card w/ pill-pend, stat grid, recent transactions with icon-tiles |
| `income-list-page.tsx` | Search input-shell, period cards (glass tap) |
| `wallet-page.tsx` | Hero, action grid, chips filter, tx list with icon-tiles + status pills; replace Dialogs with GlassSheet (topup/withdraw with quick amounts + validation toasts) |
| `notification-page.tsx` | Notif rows with unread dot, mark-all-read; keep API |
| `complaint-list-page.tsx` | "Tạo khiếu nại" button opens GlassSheet; cards with status pills |
| `complaint-create-page.tsx` | Replaced by GlassSheet on list page (per mockup) — remove route/component |
| `complaint-detail-page.tsx` | Back btn, status pill, response block (`.glass-soft`) |
| `profile-page.tsx` | Avatar, info rows, balance stats, logout item |

Sheet flows keep existing mutations (`requestTopup`, `requestWithdraw`,
complaint create) with mockup validation rules (min 10k topup, min 50k + bank
required + balance check for withdraw; title+body required for complaint).

## State & data flow

- Theme: hook reads localStorage on mount, sets `data-theme` on `documentElement`;
  toggle writes both. No server state.
- All queries/mutations/auth/WebSocket unchanged.

## Error handling

- Sheet submits: inline error toast (`.toast.err`) for validation; API errors
  surface via existing mutation error paths → toast.
- Login: input-shell `.err` + error line as today.

## Testing

- Run driver app build (`turbo build` or per-app script) and typecheck.
- Manual visual check against the mockup (screens + light/dark).
- Keep existing tests passing (run `turbo test` if present in scope).

## Files touched (expected)

- `packages/design-tokens/src/driver-theme.css` — full token set (dark+light).
- `apps/driver/index.html` — Google Fonts (Manrope + Inter).
- `apps/driver/src/app/styles/global.css` — import driver-glass.css.
- `apps/driver/src/app/styles/driver-glass.css` — new glass layer.
- `apps/driver/src/shared/*` — new components (sheet, dock, drawer, toast,
  theme, pills, tiles, buttons).
- All pages + `driver-layout.tsx` restyled; `complaint-create` route removed.
