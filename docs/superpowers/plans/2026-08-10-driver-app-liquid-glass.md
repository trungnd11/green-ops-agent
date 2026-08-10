# Driver App Liquid Glass Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the entire `@xanh/driver` React app to match `frontend/design/driver-app-liquid-glass.html` (Apple liquid glass: glass surfaces, ambient wallpaper, floating dock, bottom sheets, light/dark theme).

**Architecture:** Port the mockup's CSS token contract + glass class layer into the driver app; add small shared React components (theme hook, glass sheet, toast, pills, tiles, dock, drawer); restyle each page while keeping all API/query/routing/auth logic unchanged. Light/dark via `data-theme` attribute on `<html>`, persisted in localStorage.

**Tech Stack:** React 19, Tailwind v4 (PostCSS), TanStack Router + React Query, `@xanh/design-tokens` (CSS), `lucide-react` icons, rsbuild, pnpm workspace at `frontend/`.

## Global Constraints

- All commands run from `frontend/` (workspace root), e.g. `pnpm --filter @xanh/driver typecheck`.
- Business logic (APIs, React Query keys, TanStack Router paths, `xanhsm-driver-auth` session, WebSocket) MUST NOT change.
- Do not modify `packages/design-tokens/src/theme.css` (shared with admin) — only `driver-theme.css`.
- Do not touch the admin app or backend.
- Brand source: teal `#00C7A5`, canvas `#07111F`; fonts Manrope (display) + Inter (body) already loaded in `apps/driver/index.html`.
- Status → pill mapping (used in wallet + complaints): `PENDING`→`pending`, `APPROVED`→`ok`, `REJECTED`→`bad`; complaint `pending`→`warn`, `processing`→`pending`, `resolved`→`ok`, `rejected`→`bad`.
- Every task ends with a commit; commit only the files listed in that task.

---

### Task 1: Design tokens (dark + light glass tokens)

**Files:**
- Modify: `packages/design-tokens/src/driver-theme.css` (replace entire file)

**Interfaces:**
- Produces: CSS variables consumed by Task 2's `driver-glass.css`. Dark values on `:root`, light overrides on `:root[data-theme='light']`.

- [ ] **Step 1: Replace `driver-theme.css` with the full token contract**

```css
[data-app='driver'] {
  --app-primary: #00C7A5;
  --app-primary-hover: #13D6B3;
  --app-background: #07111F;
  --app-card: #1C2737;
  --app-input: #3A4352;
}

:root {
  --brand-teal: #00C7A5;
  --brand-teal-soft: rgba(0, 199, 165, 0.16);
  --brand-cyan: #00AEEF;
  --brand-deep: #007D73;
  --brand-lime: #A3E635;

  --accent: #00C7A5;
  --accent-on: #04211C;
  --accent-hover: #13D6B3;
  --accent-active: #00A58A;

  --teal-fg: #00C7A5;
  --danger-on: #FFFFFF;

  --success: #22C55E;
  --warn: #F5A623;
  --danger: #F05252;
  --pending: #A78BFA;

  --font-display: "Manrope", "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-body: "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;

  --text-xs: 11px; --text-sm: 13px; --text-base: 15px; --text-lg: 17px;
  --text-xl: 21px; --text-2xl: 27px; --text-3xl: 34px;

  --radius-sm: 10px; --radius-md: 14px; --radius-lg: 22px;
  --radius-xl: 28px; --radius-pill: 980px;

  --elev-flat: none;
  --elev-ring: 0 0 0 1px var(--border);
  --elev-raised: 0 18px 48px rgba(2, 8, 18, 0.42);
  --focus-ring: 0 0 0 4px color-mix(in oklab, var(--accent), transparent 68%);

  --motion-fast: 150ms;
  --motion-base: 260ms;
  --ease-out: cubic-bezier(0.28, 0, 0.22, 1);

  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px;

  --bg: #07111F;
  --bg-deep: #050B16;
  --surface: rgba(28, 40, 58, 0.58);
  --surface-strong: rgba(36, 50, 70, 0.72);
  --surface-solid: #14202F;
  --fg: #F5F9FC;
  --fg-2: #C6D0DC;
  --muted: #8A96A8;
  --meta: #5F6B7E;
  --border: rgba(255, 255, 255, 0.14);
  --border-soft: rgba(255, 255, 255, 0.08);
  --specular: rgba(255, 255, 255, 0.34);
  --sheen: rgba(255, 255, 255, 0.10);
  --wall-a: rgba(0, 199, 165, 0.20);
  --wall-b: rgba(0, 174, 239, 0.15);
  --wall-c: rgba(0, 125, 115, 0.16);
  --wall-grain: rgba(255, 255, 255, 0.02);
}

:root[data-theme='light'] {
  --bg: #EFF4F7;
  --bg-deep: #E7EEF3;
  --surface: rgba(255, 255, 255, 0.62);
  --surface-strong: rgba(255, 255, 255, 0.82);
  --surface-solid: #FFFFFF;
  --fg: #161B21;
  --fg-2: #3D4652;
  --muted: #5C6677;
  --meta: #5F6A7C;
  --border: rgba(255, 255, 255, 0.66);
  --border-soft: rgba(18, 30, 48, 0.08);
  --specular: rgba(255, 255, 255, 0.96);
  --sheen: rgba(255, 255, 255, 0.72);
  --teal-fg: #007D73;
  --danger-on: #FFFFFF;
  --success: #12834E;
  --warn: #A16207;
  --danger: #C03A3A;
  --pending: #7C4DF0;
  --wall-a: rgba(0, 199, 165, 0.16);
  --wall-b: rgba(0, 174, 239, 0.13);
  --wall-c: rgba(0, 125, 115, 0.10);
  --wall-grain: rgba(0, 0, 0, 0.015);
  --elev-raised: 0 20px 44px rgba(23, 46, 62, 0.16);
}
```

- [ ] **Step 2: Verify no consumers break**

Run: `pnpm --filter @xanh/driver build`
Expected: build succeeds (CSS only change; admin untouched).

- [ ] **Step 3: Commit**

```bash
git add packages/design-tokens/src/driver-theme.css
git commit -m "feat(design-tokens): add liquid glass token contract (dark + light)"
```

---

### Task 2: Glass CSS layer

**Files:**
- Create: `apps/driver/src/app/styles/driver-glass.css`
- Modify: `apps/driver/src/app/styles/global.css` (add import line)

**Interfaces:**
- Produces: CSS classes `.wall .blob`, `.glass`, `.glass-soft`, `.topbar`, `.brand-mark`, `.brand-word`, `.icon-btn`, `.badge-dot`, `.avatar`, `.mode-pill`, `.eyebrow`, `.h1`, `.h2`, `.section-title`, `.body2`, `.muted`, `.meta`, `.row-between`, `.card`, `.card.tap`, `.hero`, `.hero-value`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-icon`, `.action-grid`, `.action-card`, `.field`, `.input-shell`, `.textarea-shell`, `.select-shell`, `.chips`, `.chip`, `.row`, `.icon-tile` (+ `.accent/.ok/.bad/.info`), `.pill-status` (+ `.pill-ok/.pill-warn/.pill-bad/.pill-pend`), `.divider`, `.dock`, `.dock-item`, `.overlay`, `.drawer`, `.drawer-item`, `.sheet-scrim`, `.sheet`, `.sheet-handle`, `.sheet-title`, `.sheet-desc`, `.quick-amounts`, `.qamt`, `.amount-preview`, `.toast`, `.login-*`, `.stat-grid`, `.stat`, `.profile-*`, `.info-row`, `.notif`, `.unread-dot`, `.empty-state`, `.back-btn`, `.period-card`, `.complaint`, `.num`. All later tasks consume these class names — port names exactly.

- [ ] **Step 1: Create `apps/driver/src/app/styles/driver-glass.css`**

Port from `frontend/design/driver-app-liquid-glass.html` `<style>` (lines 129–570 of that file) with these adaptations: (a) remove `.device`/`.screen`/`#screen-login` rules (React app has its own layout); (b) `.dock`, `.overlay`, `.drawer`, `.sheet-scrim`, `.sheet`, `.toast` become `position: fixed` with `max-width: 468px; left: 50%; transform: translateX(-50%)` (dock: `width: calc(100% - 28px); max-width: 440px; bottom: 14px; border-radius: 26px`; drawer: `width: calc(100% - 28px); max-width: 440px; bottom: 92px; transform: translateX(-50%) translateY(24px)`, `.show` → `translateX(-50%) translateY(0)`; sheet: `left: 0; right: 0; margin: 0 auto; max-width: 468px; border-radius: 30px 30px 0 0`; toast: `top: 66px`); (c) `.main` keeps `padding-bottom: 132px`; (d) keep the `@media (prefers-reduced-motion: reduce)` block. The full ported file:

```css
/* GreenOps Driver — Apple Liquid Glass (ported from design/driver-app-liquid-glass.html) */

* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; }
body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.5;
  color: var(--fg);
  background: var(--bg-deep);
  -webkit-font-smoothing: antialiased;
}
button, input, textarea, select { font-family: inherit; font-size: inherit; color: inherit; }
button { cursor: pointer; background: none; border: 0; }
a { color: inherit; text-decoration: none; }
h1, h2, h3, h4 { font-family: var(--font-display); color: var(--fg); }
:focus-visible { outline: none; box-shadow: var(--focus-ring); }
::selection { background: var(--brand-teal-soft); }
input, textarea { width: 100%; border: 0; background: transparent; outline: none; }
input::placeholder, textarea::placeholder { color: var(--meta); }
svg { display: block; }
[hidden] { display: none !important; }
.num { font-variant-numeric: tabular-nums; }

.wall {
  position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none;
  background:
    radial-gradient(62% 52% at 80% 10%, var(--wall-a), transparent 68%),
    radial-gradient(52% 46% at 14% 88%, var(--wall-b), transparent 70%),
    radial-gradient(46% 44% at 46% 62%, var(--wall-c), transparent 72%),
    linear-gradient(180deg, var(--bg), var(--bg-deep));
}
.blob { position: absolute; border-radius: 50%; filter: blur(70px); will-change: transform; }
.blob.t1 { width: 46vmax; height: 46vmax; top: -16vmax; right: -12vmax; background: radial-gradient(circle at 40% 40%, var(--wall-a), transparent 70%); animation: drift1 26s ease-in-out infinite alternate; }
.blob.t2 { width: 40vmax; height: 40vmax; bottom: -14vmax; left: -10vmax; background: radial-gradient(circle at 60% 50%, var(--wall-b), transparent 70%); animation: drift2 32s ease-in-out infinite alternate; }
.blob.t3 { width: 30vmax; height: 30vmax; top: 34%; left: 55%; background: radial-gradient(circle at 50% 50%, var(--wall-c), transparent 72%); animation: drift3 24s ease-in-out infinite alternate; }
@keyframes drift1 { from { transform: translate3d(0,0,0) rotate(0deg); } to { transform: translate3d(-4vmax, 3vmax, 0) rotate(8deg); } }
@keyframes drift2 { from { transform: translate3d(0,0,0); } to { transform: translate3d(4vmax, -3vmax, 0); } }
@keyframes drift3 { from { transform: translate3d(0,0,0) scale(1); } to { transform: translate3d(-3vmax, 2vmax, 0) scale(1.1); } }
@media (prefers-reduced-motion: reduce) { .blob { animation: none; } }

.glass {
  background:
    linear-gradient(180deg, var(--sheen) 0%, transparent 36%),
    var(--surface);
  -webkit-backdrop-filter: blur(28px) saturate(175%);
  backdrop-filter: blur(28px) saturate(175%);
  border: 1px solid var(--border);
  box-shadow:
    inset 0 1px 0 var(--specular),
    inset 0 -1px 0 rgba(0,0,0,0.03),
    var(--elev-flat);
}
.glass-soft {
  background:
    linear-gradient(180deg, var(--sheen) 0%, transparent 34%),
    var(--surface-strong);
  -webkit-backdrop-filter: blur(24px) saturate(170%);
  backdrop-filter: blur(24px) saturate(170%);
  border: 1px solid var(--border);
  box-shadow: inset 0 1px 0 var(--specular);
}

.topbar {
  position: sticky; top: 0; z-index: 40;
  display: flex; align-items: center; justify-content: space-between;
  height: 58px; padding: 0 var(--space-4);
  border-bottom: 1px solid var(--border-soft);
  background:
    linear-gradient(180deg, var(--sheen) 0%, transparent 55%),
    color-mix(in oklab, var(--bg) 42%, transparent);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  backdrop-filter: blur(30px) saturate(180%);
}
.brand { display: flex; align-items: center; gap: 9px; }
.brand-mark {
  width: 30px; height: 30px; border-radius: 9px;
  display: grid; place-items: center;
  background: linear-gradient(140deg, var(--brand-lime), var(--brand-teal) 46%, var(--brand-deep));
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 14px color-mix(in oklab, var(--brand-teal) 40%, transparent);
  color: var(--accent-on); font-family: var(--font-display); font-weight: 800; font-size: 16px;
}
.brand-word { font-family: var(--font-display); font-weight: 800; font-size: 16px; letter-spacing: -0.01em; color: var(--fg); }
.brand-word em { font-style: normal; color: var(--teal-fg); }
.top-actions { display: flex; align-items: center; gap: 6px; }
.icon-btn {
  position: relative; width: 38px; height: 38px; border-radius: 50%;
  display: grid; place-items: center; color: var(--fg-2);
  transition: background var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out);
}
.icon-btn:hover { background: var(--border-soft); color: var(--fg); }
.icon-btn:active { transform: scale(0.92); }
.badge-dot {
  position: absolute; top: 6px; right: 7px; min-width: 16px; height: 16px; padding: 0 4px;
  border-radius: 999px; background: var(--danger); color: var(--danger-on); font-size: 9px; font-weight: 700;
  display: grid; place-items: center; box-shadow: 0 0 0 2px var(--bg);
}
.avatar {
  width: 32px; height: 32px; border-radius: 50%;
  display: grid; place-items: center; font-size: 12px; font-weight: 700;
  color: var(--accent-on); background: linear-gradient(140deg, var(--brand-teal), var(--brand-deep));
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.45);
}

.eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
.h1 { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; }
.h2 { font-family: var(--font-display); font-size: var(--text-lg); font-weight: 700; letter-spacing: -0.01em; }
.section-title { font-family: var(--font-display); font-size: var(--text-lg); font-weight: 700; letter-spacing: -0.01em; color: var(--fg); }
.body2 { color: var(--fg-2); }
.muted { color: var(--muted); }
.meta { color: var(--meta); font-size: var(--text-sm); }
.row-between { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); }

.card { border-radius: var(--radius-lg); padding: var(--space-5); }
.card.tap { transition: transform var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) var(--ease-out); }
.card.tap:hover { transform: translateY(-1px); }
.card.tap:active { transform: scale(0.985); }
.hero {
  border-radius: var(--radius-xl); padding: var(--space-6) var(--space-5) var(--space-5);
  background:
    linear-gradient(180deg, var(--sheen) 0%, transparent 40%),
    linear-gradient(160deg, color-mix(in oklab, var(--brand-teal) 16%, transparent), transparent 46%),
    var(--surface);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  backdrop-filter: blur(32px) saturate(180%);
  border: 1px solid var(--border);
  box-shadow: inset 0 1px 0 var(--specular), 0 22px 50px rgba(2,8,18,0.30);
}
:root[data-theme='light'] .hero { box-shadow: inset 0 1px 0 var(--specular), 0 22px 46px rgba(23,46,62,0.12); }
.hero-value { font-family: var(--font-display); font-weight: 800; font-size: var(--text-3xl); letter-spacing: -0.02em; line-height: 1.08; }
.hero-value small { font-size: 0.52em; font-weight: 600; color: var(--muted); letter-spacing: 0; }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 48px; padding: 0 20px; border-radius: var(--radius-md);
  font-family: var(--font-body); font-size: var(--text-base); font-weight: 600;
  transition: transform var(--motion-fast) var(--ease-out), background var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) var(--ease-out);
  user-select: none;
}
.btn:active { transform: scale(0.97); }
.btn-primary { background: var(--accent); color: var(--accent-on); box-shadow: 0 8px 20px color-mix(in oklab, var(--accent) 34%, transparent); }
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:active { background: var(--accent-active); box-shadow: 0 4px 12px color-mix(in oklab, var(--accent) 28%, transparent); }
.btn-secondary {
  background: linear-gradient(180deg, var(--sheen) 0%, transparent 36%), var(--surface-strong);
  -webkit-backdrop-filter: blur(20px) saturate(160%); backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid var(--border); color: var(--fg);
  box-shadow: inset 0 1px 0 var(--specular);
}
.btn-secondary:hover { background: linear-gradient(180deg, var(--sheen) 0%, transparent 36%), color-mix(in oklab, var(--surface-strong) 82%, var(--brand-teal) 10%); }
.btn-ghost { color: var(--fg-2); min-height: 44px; padding: 0 12px; }
.btn-ghost:hover { color: var(--fg); background: var(--border-soft); }
.btn[disabled] { opacity: 0.45; pointer-events: none; }
.btn-icon { width: 48px; padding: 0; }

.action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.action-card {
  display: flex; align-items: center; justify-content: center; gap: 9px;
  min-height: 50px; border-radius: var(--radius-md);
  background: linear-gradient(180deg, var(--sheen) 0%, transparent 36%), var(--surface-strong);
  -webkit-backdrop-filter: blur(22px) saturate(170%); backdrop-filter: blur(22px) saturate(170%);
  border: 1px solid var(--border); box-shadow: inset 0 1px 0 var(--specular);
  font-weight: 600; font-size: var(--text-base); color: var(--fg);
  transition: transform var(--motion-fast) var(--ease-out), background var(--motion-fast) var(--ease-out);
}
.action-card.primary { background: var(--accent); color: var(--accent-on); border-color: transparent; box-shadow: 0 10px 22px color-mix(in oklab, var(--accent) 34%, transparent); }
.action-card.primary:hover { background: var(--accent-hover); }
.action-card.primary:active { background: var(--accent-active); }
.action-card:hover { transform: translateY(-1px); }
.action-card:active { transform: scale(0.97); }

.field { display: flex; flex-direction: column; gap: 7px; }
.field label { font-size: var(--text-sm); font-weight: 600; color: var(--fg-2); }
.input-shell {
  display: flex; align-items: center; gap: 10px;
  min-height: 48px; padding: 0 15px; border-radius: var(--radius-md);
  background: linear-gradient(180deg, var(--sheen) 0%, transparent 34%), var(--surface-strong);
  -webkit-backdrop-filter: blur(20px) saturate(160%); backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid var(--border); box-shadow: inset 0 1px 0 var(--specular);
  transition: border-color var(--motion-fast) var(--ease-out), box-shadow var(--motion-fast) var(--ease-out);
}
.input-shell:focus-within { border-color: color-mix(in oklab, var(--accent) 55%, var(--border)); box-shadow: inset 0 1px 0 var(--specular), var(--focus-ring); }
.input-shell svg { flex: none; color: var(--meta); }
.input-shell input { height: 46px; font-size: var(--text-base); }
.input-shell.err { border-color: color-mix(in oklab, var(--danger) 60%, var(--border)); }
textarea.textarea-shell {
  display: block; width: 100%; min-height: 110px; padding: 13px 15px; resize: none;
  border-radius: var(--radius-md); line-height: 1.5;
  background: linear-gradient(180deg, var(--sheen) 0%, transparent 34%), var(--surface-strong);
  -webkit-backdrop-filter: blur(20px) saturate(160%); backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid var(--border); box-shadow: inset 0 1px 0 var(--specular);
}
textarea.textarea-shell:focus { border-color: color-mix(in oklab, var(--accent) 55%, var(--border)); box-shadow: var(--focus-ring); }
.select-shell { display: flex; align-items: center; position: relative; }
.select-shell select { appearance: none; -webkit-appearance: none; padding-right: 36px; height: 46px; width: 100%; background: transparent; border: 0; outline: none; color: var(--fg); }
.select-shell svg.caret { position: absolute; right: 14px; color: var(--meta); pointer-events: none; }
.chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; padding: 2px; }
.chips::-webkit-scrollbar { display: none; }
.chip {
  flex: none; min-height: 42px; padding: 0 16px; border-radius: var(--radius-pill);
  display: inline-flex; align-items: center; gap: 6px;
  font-size: var(--text-sm); font-weight: 600; color: var(--muted);
  background: var(--surface-strong); border: 1px solid var(--border);
  box-shadow: inset 0 1px 0 var(--specular);
  transition: all var(--motion-fast) var(--ease-out);
}
.chip:hover { color: var(--fg); }
.chip.active { background: var(--surface-solid); color: var(--fg); box-shadow: inset 0 1px 0 var(--specular); }

.row { display: flex; align-items: center; gap: 13px; }
.icon-tile {
  flex: none; width: 42px; height: 42px; border-radius: 14px; display: grid; place-items: center;
  background: var(--surface-strong); border: 1px solid var(--border-soft); color: var(--fg-2);
}
.icon-tile.accent { color: var(--teal-fg); background: var(--brand-teal-soft); border-color: transparent; }
.icon-tile.ok { color: var(--success); background: color-mix(in oklab, var(--success) 14%, transparent); }
.icon-tile.bad { color: var(--danger); background: color-mix(in oklab, var(--danger) 14%, transparent); }
.icon-tile.info { color: var(--brand-cyan); background: color-mix(in oklab, var(--brand-cyan) 16%, transparent); }

.pill-status {
  display: inline-flex; align-items: center; gap: 6px; min-height: 24px; padding: 0 10px;
  border-radius: var(--radius-pill); font-size: 11px; font-weight: 700; letter-spacing: 0.02em;
}
.pill-status::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.pill-ok { color: var(--success); background: color-mix(in oklab, var(--success) 13%, transparent); }
.pill-warn { color: var(--warn); background: color-mix(in oklab, var(--warn) 14%, transparent); }
.pill-bad { color: var(--danger); background: color-mix(in oklab, var(--danger) 13%, transparent); }
.pill-pend { color: var(--pending); background: color-mix(in oklab, var(--pending) 14%, transparent); }

.divider { height: 1px; background: var(--border-soft); border: 0; margin: var(--space-4) 0; }

.dock {
  position: fixed; left: 50%; bottom: 14px; z-index: 50;
  transform: translateX(-50%);
  width: calc(100% - 28px); max-width: 440px;
  display: flex; padding: 6px; gap: 2px;
  border-radius: 26px;
  background:
    linear-gradient(180deg, var(--sheen) 0%, transparent 40%),
    color-mix(in oklab, var(--surface-solid) 72%, transparent);
  -webkit-backdrop-filter: blur(32px) saturate(190%);
  backdrop-filter: blur(32px) saturate(190%);
  border: 1px solid var(--border);
  box-shadow: inset 0 1px 0 var(--specular), 0 22px 48px rgba(2,8,18,0.42);
}
:root[data-theme='light'] .dock { box-shadow: inset 0 1px 0 var(--specular), 0 22px 44px rgba(23,46,62,0.18); }
.dock-item {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
  min-height: 54px; border-radius: 20px;
  font-size: 10px; font-weight: 600; letter-spacing: 0.02em; color: var(--muted);
  transition: all var(--motion-fast) var(--ease-out);
}
.dock-item svg { transition: transform var(--motion-fast) var(--ease-out); }
.dock-item:hover { color: var(--fg); }
.dock-item:active svg { transform: scale(0.9); }
.dock-item.active {
  background: var(--accent); color: var(--accent-on);
  box-shadow: 0 8px 18px color-mix(in oklab, var(--accent) 34%, transparent);
}
.dock-item.active:hover { color: var(--accent-on); }

.overlay {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(3, 8, 16, 0.42);
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  opacity: 0; pointer-events: none; transition: opacity var(--motion-base) var(--ease-out);
}
.overlay.show { opacity: 1; pointer-events: auto; }
.drawer {
  position: fixed; left: 50%; bottom: 92px; z-index: 61;
  width: calc(100% - 28px); max-width: 440px;
  transform: translateX(-50%) translateY(24px); opacity: 0; pointer-events: none;
  border-radius: 24px; padding: 8px;
  transition: transform var(--motion-base) var(--ease-out), opacity var(--motion-base) var(--ease-out);
}
.drawer.show { transform: translateX(-50%) translateY(0); opacity: 1; pointer-events: auto; }
.drawer-item {
  display: flex; align-items: center; gap: 12px; width: 100%;
  min-height: 52px; padding: 0 16px; border-radius: 16px;
  font-size: var(--text-base); font-weight: 500; color: var(--fg);
  transition: background var(--motion-fast) var(--ease-out);
}
.drawer-item:hover { background: var(--border-soft); }
.drawer-item svg { color: var(--fg-2); }
.drawer-item.danger { color: var(--danger); }
.drawer-item.danger svg { color: var(--danger); }

.sheet-scrim {
  position: fixed; inset: 0; z-index: 70;
  background: rgba(3, 8, 16, 0.42);
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  opacity: 0; pointer-events: none; transition: opacity var(--motion-base) var(--ease-out);
}
.sheet-scrim.show { opacity: 1; pointer-events: auto; }
.sheet {
  position: fixed; left: 50%; bottom: 0; z-index: 71;
  transform: translateX(-50%) translateY(100%);
  width: 100%; max-width: 468px;
  border-radius: 30px 30px 0 0; padding: 10px 20px calc(20px + env(safe-area-inset-bottom));
  max-height: 88%;
  overflow-y: auto;
  transition: transform var(--motion-base) var(--ease-out);
}
.sheet.show { transform: translateX(-50%) translateY(0); }
.sheet-handle { width: 40px; height: 5px; border-radius: 999px; background: var(--border); margin: 0 auto 16px; }
.sheet-title { font-family: var(--font-display); font-size: var(--text-xl); font-weight: 800; letter-spacing: -0.015em; margin-bottom: 6px; }
.sheet-desc { color: var(--muted); font-size: var(--text-sm); margin-bottom: var(--space-5); }
.quick-amounts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
.qamt {
  min-height: 44px; border-radius: var(--radius-md);
  background: var(--surface-strong); border: 1px solid var(--border); box-shadow: inset 0 1px 0 var(--specular);
  font-size: var(--text-sm); font-weight: 700; color: var(--fg-2);
  transition: all var(--motion-fast) var(--ease-out);
}
.qamt:hover { color: var(--fg); }
.qamt.active { background: var(--brand-teal-soft); border-color: color-mix(in oklab, var(--accent) 55%, var(--border)); color: var(--teal-fg); }
.amount-preview { font-size: var(--text-sm); font-weight: 700; color: var(--teal-fg); }

.toast {
  position: fixed; top: 66px; left: 50%; z-index: 90;
  transform: translate(-50%, -16px);
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px; border-radius: 999px;
  font-size: var(--text-sm); font-weight: 600; color: var(--fg);
  opacity: 0; pointer-events: none;
  transition: transform var(--motion-base) var(--ease-out), opacity var(--motion-base) var(--ease-out);
  max-width: calc(100% - 56px);
}
.toast.show { transform: translate(-50%, 0); opacity: 1; }
.toast svg { flex: none; color: var(--success); }
.toast.err svg { color: var(--danger); }

.login-wrap { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 20px; gap: 26px; }
.login-top { position: absolute; top: 0; left: 0; right: 0; display: flex; justify-content: flex-end; padding: 14px 18px; }
.login-logo { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.login-logo .brand-mark { width: 58px; height: 58px; border-radius: 18px; font-size: 30px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 18px 34px color-mix(in oklab, var(--brand-teal) 40%, transparent); }
.login-brand { font-family: var(--font-display); font-weight: 800; font-size: 20px; letter-spacing: 0.02em; }
.login-sub { font-size: var(--text-sm); color: var(--muted); margin-top: 2px; }
.login-card { width: 100%; max-width: 400px; border-radius: 26px; padding: 24px; display: flex; flex-direction: column; gap: 18px; }
.login-demo { text-align: center; font-size: var(--text-sm); color: var(--meta); }

.period-card { border-radius: var(--radius-lg); padding: var(--space-5); transition: transform var(--motion-fast) var(--ease-out); }
.period-card:hover { transform: translateY(-1px); }
.period-card:active { transform: scale(0.985); }
.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.stat { border-radius: var(--radius-lg); padding: 16px 18px; }
.stat-label { font-size: 12px; font-weight: 600; color: var(--muted); }
.stat-value { font-family: var(--font-display); font-weight: 800; font-size: 20px; letter-spacing: -0.01em; margin-top: 2px; }

.profile-head { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 26px 20px 20px; text-align: center; }
.profile-avatar { width: 76px; height: 76px; border-radius: 50%; display: grid; place-items: center; font-family: var(--font-display); font-weight: 800; font-size: 26px; color: var(--accent-on); background: linear-gradient(140deg, var(--brand-teal), var(--brand-deep)); box-shadow: inset 0 2px 0 rgba(255,255,255,0.5), 0 16px 30px color-mix(in oklab, var(--brand-teal) 36%, transparent); margin-bottom: 10px; }
.info-row { display: flex; justify-content: space-between; gap: 16px; padding: 11px 0; font-size: var(--text-base); }
.info-row + .info-row { border-top: 1px solid var(--border-soft); }
.info-row dt { color: var(--muted); flex: none; }
.info-row dd { color: var(--fg); text-align: right; font-weight: 500; }

.notif { display: flex; gap: 13px; padding: 15px 4px; cursor: pointer; border-radius: 16px; transition: background var(--motion-fast) var(--ease-out); }
.notif:hover { background: var(--border-soft); }
.notif .body { flex: 1; min-width: 0; }
.notif.unread .notif-title { font-weight: 700; }
.notif-title { font-size: var(--text-base); font-weight: 600; color: var(--fg); line-height: 1.35; }
.notif-msg { font-size: var(--text-sm); color: var(--muted); line-height: 1.45; margin-top: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.notif-time { font-size: 11px; color: var(--meta); margin-top: 6px; }
.unread-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--brand-teal); margin-top: 7px; box-shadow: 0 0 0 3px var(--brand-teal-soft); }

.complaint { display: flex; flex-direction: column; gap: 8px; text-align: left; width: 100%; }
.empty-state { text-align: center; padding: 42px 20px; color: var(--muted); }
.empty-state svg { margin: 0 auto 12px; color: var(--meta); }

.back-btn { display: inline-flex; align-items: center; gap: 4px; color: var(--fg-2); font-weight: 600; font-size: var(--text-sm); min-height: 40px; padding: 0 8px 0 2px; border-radius: 10px; }
.back-btn:hover { color: var(--fg); background: var(--border-soft); }

.mode-pill {
  display: inline-flex; align-items: center; gap: 3px; padding: 3px;
  border-radius: 999px; background: var(--surface-strong); border: 1px solid var(--border);
  box-shadow: inset 0 1px 0 var(--specular);
}
.mode-pill button {
  width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; color: var(--meta);
  transition: all var(--motion-fast) var(--ease-out);
}
.mode-pill button.on { background: var(--surface-solid); color: var(--fg); box-shadow: 0 3px 10px rgba(0,0,0,0.16); }
.mode-pill button:hover { color: var(--fg); }

@media (prefers-reduced-motion: reduce) {
  .drawer, .sheet, .toast { animation: none !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 2: Import the layer in `global.css`**

Modify `apps/driver/src/app/styles/global.css` to:

```css
@import "tailwindcss";
@import "@xanh/design-tokens/theme.css";
@import "@xanh/design-tokens/driver-theme.css";
@import "./driver-glass.css";

html {
  font-family: 'Inter', sans-serif;
}

.ant-btn {
  box-shadow: none !important;
}
.ant-btn::after {
  display: none !important;
}
```

- [ ] **Step 3: Verify**

Run: `pnpm --filter @xanh/driver typecheck && pnpm --filter @xanh/driver build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add apps/driver/src/app/styles/driver-glass.css apps/driver/src/app/styles/global.css
git commit -m "feat(driver): add liquid glass CSS layer"
```

---

### Task 3: Theme hook, ModePill, Toast

**Files:**
- Create: `apps/driver/src/shared/theme.ts`
- Create: `apps/driver/src/shared/mode-pill.tsx`
- Create: `apps/driver/src/shared/toast.tsx`
- Create: `apps/driver/src/shared/index.ts` (replaces the empty one)

**Interfaces:**
- Consumes: Task 2 classes `.mode-pill`, `.toast`, `.glass-soft`, `.btn`.
- Produces:
  - `useTheme(): { theme: 'dark'|'light'; setMode: (m: 'dark'|'light') => void }`
  - `ModePill({ theme, onSelect }: { theme: 'dark'|'light'; onSelect: (m: 'dark'|'light') => void })`
  - `ToastProvider({ children })` + `useToast(): { show: (msg: string, type?: 'ok'|'err') => void }`

- [ ] **Step 1: Create `shared/theme.ts`**

```ts
import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

const THEME_KEY = 'greenops-driver-theme';

function readInitial(): ThemeMode {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(readInitial);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);

  const setMode = useCallback((mode: ThemeMode) => setTheme(mode), []);

  return { theme, setMode };
}
```

- [ ] **Step 2: Create `shared/mode-pill.tsx`**

```tsx
import { Sun, Moon } from 'lucide-react';
import type { ThemeMode } from './theme';

interface ModePillProps {
  theme: ThemeMode;
  onSelect: (mode: ThemeMode) => void;
}

export function ModePill({ theme, onSelect }: ModePillProps) {
  return (
    <div className="mode-pill" role="group" aria-label="Chế độ giao diện">
      <button
        type="button"
        className={theme === 'light' ? 'on' : ''}
        aria-label="Chế độ sáng"
        onClick={() => onSelect('light')}
      >
        <Sun size={16} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        className={theme === 'dark' ? 'on' : ''}
        aria-label="Chế độ tối"
        onClick={() => onSelect('dark')}
      >
        <Moon size={16} strokeWidth={1.8} />
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create `shared/toast.tsx`**

```tsx
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

type ToastType = 'ok' | 'err';

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('ok');
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((msg: string, t: ToastType = 'ok') => {
    setMessage(msg);
    setType(t);
    setVisible(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setVisible(false), 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className={`toast glass-soft ${type} ${visible ? 'show' : ''}`} role="status">
        <CheckCircle2 size={18} strokeWidth={2} />
        <span>{message}</span>
      </div>
    </ToastContext.Provider>
  );
}
```

- [ ] **Step 4: Replace `shared/index.ts`**

```ts
export { useTheme, type ThemeMode } from './theme';
export { ModePill } from './mode-pill';
export { ToastProvider, useToast } from './toast';
```

- [ ] **Step 5: Verify**

Run: `pnpm --filter @xanh/driver typecheck`
Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add apps/driver/src/shared
git commit -m "feat(driver): add theme hook, mode pill and glass toast"
```

---

### Task 4: StatusPill, IconTile, GlassButton, GlassSheet

**Files:**
- Create: `apps/driver/src/shared/status-pill.tsx`
- Create: `apps/driver/src/shared/icon-tile.tsx`
- Create: `apps/driver/src/shared/glass-button.tsx`
- Create: `apps/driver/src/shared/glass-sheet.tsx`
- Modify: `apps/driver/src/shared/index.ts`

**Interfaces:**
- Consumes: Task 2 classes `.pill-status`, `.pill-ok/.pill-warn/.pill-bad/.pill-pend`, `.icon-tile`, `.btn`, `.sheet`, `.sheet-scrim`, `.icon-btn`.
- Produces:
  - `StatusPill({ variant: 'ok'|'warn'|'bad'|'pending'; children })`
  - `IconTile({ variant?: 'accent'|'ok'|'bad'|'info'; children })`
  - `GlassButton({ variant?: 'primary'|'secondary'|'ghost'; isLoading?: boolean; ...rest })`
  - `GlassSheet({ open; onClose; title; description?; children; footer? })`

- [ ] **Step 1: Create `shared/status-pill.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `shared/icon-tile.tsx`**

```tsx
import type { ReactNode } from 'react';

type TileVariant = 'accent' | 'ok' | 'bad' | 'info';

const VARIANT_CLASS: Record<TileVariant, string> = {
  accent: 'accent',
  ok: 'ok',
  bad: 'bad',
  info: 'info',
};

export function IconTile({ variant = 'info', children }: { variant?: TileVariant; children: ReactNode }) {
  return <div className={`icon-tile ${VARIANT_CLASS[variant]}`}>{children}</div>;
}
```

- [ ] **Step 3: Create `shared/glass-button.tsx`**

```tsx
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
  children: ReactNode;
}

export function GlassButton({ variant = 'primary', isLoading = false, children, className, disabled, ...rest }: GlassButtonProps) {
  const variantClass =
    variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-secondary' : 'btn-ghost';
  return (
    <button className={`btn ${variantClass} ${className || ''}`} disabled={disabled || isLoading} {...rest}>
      {isLoading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Create `shared/glass-sheet.tsx`**

```tsx
import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface GlassSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function GlassSheet({ open, onClose, title, description, children, footer }: GlassSheetProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open && !shown) return null;

  return (
    <>
      <div className={`sheet-scrim ${shown ? 'show' : ''}`} onClick={onClose} />
      <div className={`sheet glass ${shown ? 'show' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-handle" />
        <div className="row-between" style={{ marginBottom: 6 }}>
          <h2 className="sheet-title">{title}</h2>
          <button type="button" className="icon-btn" aria-label="Đóng" onClick={onClose}>
            <X size={18} strokeWidth={1.9} />
          </button>
        </div>
        {description && <p className="sheet-desc">{description}</p>}
        {children}
        {footer && <div className="row-between" style={{ marginTop: 20 }}>{footer}</div>}
      </div>
    </>
  );
}
```

- [ ] **Step 5: Update `shared/index.ts`**

```ts
export { useTheme, type ThemeMode } from './theme';
export { ModePill } from './mode-pill';
export { ToastProvider, useToast } from './toast';
export { StatusPill } from './status-pill';
export { IconTile } from './icon-tile';
export { GlassButton } from './glass-button';
export { GlassSheet } from './glass-sheet';
```

- [ ] **Step 6: Verify**

Run: `pnpm --filter @xanh/driver typecheck`
Expected: passes.

- [ ] **Step 7: Commit**

```bash
git add apps/driver/src/shared
git commit -m "feat(driver): add shared glass components (pill, tile, button, sheet)"
```

---

### Task 5: Wallet sheets provider (topup/withdraw)

**Files:**
- Create: `apps/driver/src/shared/wallet-sheets.tsx`

**Interfaces:**
- Consumes: `GlassSheet` (Task 4), `useToast` (Task 3), `requestTopup`/`requestWithdraw` from `modules/wallet/api/wallet.api` (existing), `formatCurrency` from `@xanh/utils` (existing).
- Produces: `WalletSheetsProvider({ children })` + `useWalletSheets(): { openTopup(): void; openWithdraw(): void }`. The provider owns the two `GlassSheet`s and the `requestTopup`/`requestWithdraw` mutations with query invalidation (keys `driver-dashboard`, `driver-transactions`).

- [ ] **Step 1: Create `shared/wallet-sheets.tsx`**

```tsx
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
          {topupAmountNum > 0 ? `Bạn sẽ nạp ${formatCurrency(topupAmountNum)} ₫` : ''}
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
          {withdrawAmountNum > 0 ? `Bạn sẽ nhận ${formatCurrency(withdrawAmountNum)} ₫` : ''}
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
```

Note: the withdraw balance shown in the sheet (2.847.500 ₫) intentionally mirrors the mockup's demo balance; the provider lives above the router and cannot safely read the authenticated dashboard query, so the constant is kept exactly like the design file.

- [ ] **Step 2: Verify**

Run: `pnpm --filter @xanh/driver typecheck`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add apps/driver/src/shared/wallet-sheets.tsx
git commit -m "feat(driver): add wallet topup/withdraw glass sheets provider"
```

---

### Task 6: Layout restyle (wallpaper, glass topbar, dock, drawer)

**Files:**
- Modify: `apps/driver/src/layouts/driver-layout.tsx` (replace entire file)
- Modify: `apps/driver/src/shared/index.ts` (add `Dock` and `Drawer` exports)

**Interfaces:**
- Consumes: Task 3 `useTheme`/`ModePill`/`useToast`, Task 4 `IconTile`/`GlassButton`, Task 5 `WalletSheetsProvider`, Task 2 classes.
- Produces: `Dock({ onMenuClick }: { onMenuClick: () => void })` and `Drawer({ open, onClose }: { open: boolean; onClose: () => void })` — new files below.

- [ ] **Step 1: Create `apps/driver/src/shared/dock.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `apps/driver/src/shared/drawer.tsx`**

```tsx
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
```

- [ ] **Step 3: Replace `apps/driver/src/layouts/driver-layout.tsx`**

```tsx
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
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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
```

Note: `WalletSheetsProvider` is intentionally NOT here — it must wrap both layout pages AND the login flow is separate. It will be mounted in `AppProviders` (Task 5b below) so Home and Wallet pages can both open sheets.

- [ ] **Step 3b: Mount providers in `apps/driver/src/app/providers/index.tsx`**

Replace the file with:

```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { UIProvider } from '@xanh/ui';
import { RouterProvider } from '@tanstack/react-router';
import { router } from '../router';
import { queryClient } from '../query/query-client';
import { ToastProvider, WalletSheetsProvider } from '../../shared';

export function AppProviders() {
  return (
    <UIProvider>
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <WalletSheetsProvider>
            <RouterProvider router={router} />
          </WalletSheetsProvider>
        </QueryClientProvider>
      </ToastProvider>
    </UIProvider>
  );
}
```

- [ ] **Step 3c: Update `apps/driver/src/shared/index.ts`**

```ts
export { useTheme, type ThemeMode } from './theme';
export { ModePill } from './mode-pill';
export { ToastProvider, useToast } from './toast';
export { StatusPill } from './status-pill';
export { IconTile } from './icon-tile';
export { GlassButton } from './glass-button';
export { GlassSheet } from './glass-sheet';
export { WalletSheetsProvider, useWalletSheets } from './wallet-sheets';
```

- [ ] **Step 4: Verify**

Run: `pnpm --filter @xanh/driver typecheck`
Expected: passes (home page still renders old markup inside new chrome).

- [ ] **Step 5: Commit**

```bash
git add apps/driver/src/layouts/driver-layout.tsx apps/driver/src/app/providers/index.tsx apps/driver/src/shared/dock.tsx apps/driver/src/shared/drawer.tsx apps/driver/src/shared/index.ts
git commit -m "feat(driver): glass layout chrome (topbar, wallpaper, dock, drawer)"
```

---

### Task 7: Login page restyle

**Files:**
- Modify: `apps/driver/src/modules/authentication/pages/login-page.tsx` (replace entire file)

**Interfaces:**
- Consumes: `useTheme`/`ModePill`/`useToast` (shared), Task 2 classes, existing `authStore`/`router` from `app/router`, TanStack Form logic preserved.

- [ ] **Step 1: Replace `login-page.tsx`**

```tsx
import { useNavigate } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { LogIn } from 'lucide-react';
import { authStore, router } from '../../../app/router';
import { useTheme, ModePill, useToast } from '../../../shared';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập mã tài xế hoặc SĐT'),
});

export function LoginPage() {
  const navigate = useNavigate();
  const { theme, setMode } = useTheme();
  const toast = useToast();

  const form = useForm({
    defaultValues: { identifier: '' },
    validators: {
      onChange: ({ value }: { value: { identifier: string } }) => {
        const result = loginSchema.safeParse(value);
        if (!result.success) {
          const fieldErrors = result.error.flatten().fieldErrors;
          return {
            fields: {
              identifier: fieldErrors.identifier?.join(', '),
            },
          };
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      try {
        const session = await authStore.login(value.identifier);
        router.options.context = {
          ...router.options.context,
          auth: {
            isAuthenticated: true,
            fullName: session.fullName,
          },
        } as any;
        toast.show('Đăng nhập thành công');
        navigate({ to: '/' });
      } catch (err) {
        form.setErrorMap({
          onSubmit: err instanceof Error ? err.message : 'Đăng nhập thất bại',
        });
      }
    },
  });

  const serverError = form.useStore((state) => state.errorMap?.onSubmit);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden" data-app="driver">
      <div className="wall" aria-hidden="true">
        <div className="blob t1" />
        <div className="blob t2" />
        <div className="blob t3" />
      </div>

      <div className="login-top relative z-10">
        <ModePill theme={theme} onSelect={setMode} />
      </div>

      <div className="login-wrap relative z-10">
        <div className="login-logo">
          <div className="brand-mark">G</div>
          <div className="text-center">
            <div className="login-brand">GREENOPS</div>
            <div className="login-sub">Đối tác tài xế</div>
          </div>
        </div>

        <form className="login-card glass" onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} noValidate>
          <form.Field name="identifier">
            {(field) => (
              <div className="field">
                <label htmlFor="loginId">Mã tài xế / SĐT</label>
                <div className={`input-shell ${field.state.meta.errors.length > 0 ? 'err' : ''}`}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="8" r="4" />
                    <path d="M4.5 20a6.5 6.5 0 0 1 13 0" />
                  </svg>
                  <input
                    id="loginId"
                    type="text"
                    placeholder="Nhập mã tài xế hoặc SĐT"
                    autoComplete="username"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
                {field.state.meta.errors.length > 0 && (
                  <p className="meta" style={{ color: 'var(--danger)' }}>{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          {serverError && (
            <p className="meta" style={{ color: 'var(--danger)' }} role="alert">{serverError}</p>
          )}

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 3a9 9 0 1 0 9 9" />
                  </svg>
                ) : (
                  <LogIn className="h-[18px] w-[18px]" strokeWidth={1.9} />
                )}
                Đăng nhập
              </button>
            )}
          </form.Subscribe>
          <p className="login-demo">Demo: nhập bất kỳ nội dung để vào ứng dụng</p>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm --filter @xanh/driver typecheck`
Expected: passes. Manual: `pnpm --filter @xanh/driver dev` → open http://localhost:3002 → login screen shows glass card + theme toggle.

- [ ] **Step 3: Commit**

```bash
git add apps/driver/src/modules/authentication/pages/login-page.tsx
git commit -m "style(driver): liquid glass login page"
```

---

### Task 8: Home page restyle

**Files:**
- Modify: `apps/driver/src/modules/home/pages/home-page.tsx` (replace entire file)

**Interfaces:**
- Consumes: `useWalletSheets` (Task 5), `IconTile`/`GlassButton`/`StatusPill` (Task 4), Task 2 classes, `fetchDashboard` (existing), `formatCurrency`/`formatDateTime` (existing).
- Produces: nothing new (page only).

TX type → icon-tile variant mapping (fixed): `revenue`→ok, `topup`→accent, `withdraw`→info, `bonus`→ok, `penalty`→bad, `adjustment`→info.

- [ ] **Step 1: Replace `home-page.tsx`**

```tsx
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@xanh/ui/skeleton";
import { fetchDashboard } from "../../wallet/api/wallet.api";
import { formatCurrency, formatDateTime } from "@xanh/utils";
import { IconTile, StatusPill, useWalletSheets } from "../../../shared";

const TX_LABEL: Record<string, string> = {
  revenue: "Thanh toán chuyến đi",
  topup: "Nạp tiền từ ví",
  withdraw: "Rút tiền về ngân hàng",
  bonus: "Thưởng hoàn thành",
  penalty: "Phạt vi phạm",
  adjustment: "Điều chỉnh",
};

const TX_TILE: Record<string, "ok" | "accent" | "info" | "bad"> = {
  revenue: "ok",
  topup: "accent",
  withdraw: "info",
  bonus: "ok",
  penalty: "bad",
  adjustment: "info",
};

export function HomePage() {
  const { openTopup, openWithdraw } = useWalletSheets();
  const { data: dash, isLoading } = useQuery({
    queryKey: ["driver-dashboard"],
    queryFn: fetchDashboard,
  });

  const balance = dash?.availableBalance ?? 0;
  const totalBalance = dash?.totalBalance ?? 0;
  const held = totalBalance - balance;

  if (isLoading) return (
    <div className="space-y-4 p-4">
      <Skeleton variant="text" className="mb-2" />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
      <Skeleton variant="table" />
    </div>
  );

  return (
    <div className="screen-pad" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div className="row-between">
        <div>
          <p className="muted" style={{ fontSize: 14 }}>Xin chào,</p>
          <h2 className="h1">{dash?.fullName || "..."}</h2>
          <p className="meta" style={{ marginTop: 3 }}>
            {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).replace(/^./, (c) => c.toUpperCase())}
          </p>
        </div>
        <div className="icon-tile accent" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5h16M4 9h10M4 13h16M4 17h7" />
          </svg>
        </div>
      </div>

      <div className="hero" data-od-id="home-balance">
        <p className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Số dư khả dụng</p>
        <p className="hero-value num" style={{ marginTop: 6 }}>{formatCurrency(balance)}</p>
        <div className="row-between" style={{ marginTop: 16, borderTop: "1px solid var(--border-soft)", paddingTop: 14 }}>
          <span className="meta">Tạm giữ</span>
          <span className="muted num" style={{ fontWeight: 600 }}>{formatCurrency(held)}</span>
        </div>
      </div>

      <div className="action-grid" data-od-id="home-actions">
        <button type="button" className="action-card primary" onClick={openTopup}>
          <ArrowUp size={19} strokeWidth={1.9} /> Nạp tiền
        </button>
        <button type="button" className="action-card" onClick={openWithdraw}>
          <ArrowDown size={19} strokeWidth={1.9} /> Rút tiền
        </button>
      </div>

      <div className="card glass tap" data-od-id="home-settlement">
        <div className="row-between">
          <div>
            <p className="section-title">Quyết toán chờ phản hồi</p>
            <p className="meta" style={{ marginTop: 4 }}>{dash?.latestPeriod || "—"}</p>
          </div>
          <StatusPill variant="pending">Đang xử lý</StatusPill>
        </div>
        <div className="row-between" style={{ marginTop: 14 }}>
          <span className="muted" style={{ fontSize: 13 }}>Doanh thu kỳ</span>
          <span className="num" style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}>
            {formatCurrency(dash?.latestRevenue || 0)}
          </span>
        </div>
      </div>

      <div className="stat-grid" data-od-id="home-stats">
        <div className="stat glass">
          <p className="stat-label">Doanh thu chuyến</p>
          <p className="stat-value num">{formatCurrency(dash?.latestRevenue || 0)}</p>
          <p className="meta" style={{ marginTop: 4 }}>{dash?.latestPeriod || "Kỳ gần nhất"}</p>
        </div>
        <div className="stat glass">
          <p className="stat-label">Chuyến hoàn thành</p>
          <p className="stat-value num">{dash?.latestTrips || 0}</p>
          <p className="meta" style={{ marginTop: 4 }}>{dash?.latestPeriod || "Kỳ gần nhất"}</p>
        </div>
      </div>

      <div>
        <div className="row-between" style={{ marginBottom: 12 }}>
          <h3 className="section-title">Giao dịch gần đây</h3>
        </div>
        <div className="card glass" style={{ padding: "8px 20px", display: "flex", flexDirection: "column" }} data-od-id="home-txs">
          {(dash?.recentTransactions || []).slice(0, 5).map((tx, i, arr) => (
            <div key={tx.transactionCode || i}>
              <div className="row" style={{ padding: "14px 0" }}>
                <IconTile variant={TX_TILE[tx.transactionType] || "info"}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8 12.5l2.6 2.6L16 9.5" />
                  </svg>
                </IconTile>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{TX_LABEL[tx.transactionType] || tx.transactionType}</p>
                  <p className="meta" style={{ marginTop: 2 }}>{formatDateTime(tx.createdAt)}</p>
                </div>
                <span className="num" style={{ fontWeight: 700, color: tx.amount > 0 ? "var(--success)" : "var(--danger)" }}>
                  {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
                </span>
              </div>
              {i < arr.length - 1 && <hr className="divider" style={{ margin: 0 }} />}
            </div>
          ))}
          {(!dash?.recentTransactions || dash.recentTransactions.length === 0) && (
            <p className="meta" style={{ textAlign: "center", padding: "26px 0" }}>Chưa có giao dịch</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm --filter @xanh/driver typecheck`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add apps/driver/src/modules/home/pages/home-page.tsx
git commit -m "style(driver): liquid glass home page"
```

---

### Task 9: Wallet page restyle

**Files:**
- Modify: `apps/driver/src/modules/wallet/pages/wallet-page.tsx` (replace entire file)

**Interfaces:**
- Consumes: `useWalletSheets` (Task 5), `StatusPill`/`IconTile` (Task 4), Task 2 classes, `fetchDashboard`/`fetchTransactions` (existing), `formatCurrency`/`formatDateTime` (existing). The old `@xanh/ui` Dialog + mutation logic moves into Task 5's provider — this page only reads.

- [ ] **Step 1: Replace `wallet-page.tsx`**

```tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@xanh/ui/skeleton";
import { ArrowUp, ArrowDown } from "lucide-react";
import { fetchDashboard, fetchTransactions, type DashboardData, type TransactionItem } from "../api/wallet.api";
import { formatCurrency, formatDateTime } from "@xanh/utils";
import { IconTile, StatusPill, useWalletSheets } from "../../../shared";

const TX_LABEL: Record<string, string> = {
  revenue: "Doanh thu chuyến",
  topup: "Nạp tiền",
  withdraw: "Rút tiền",
  bonus: "Thưởng",
  penalty: "Phạt",
  adjustment: "Điều chỉnh",
};

const TX_TILE: Record<string, "ok" | "accent" | "info" | "bad"> = {
  revenue: "ok",
  topup: "accent",
  withdraw: "info",
  bonus: "ok",
  penalty: "bad",
  adjustment: "info",
};

const STATUS_PILL: Record<string, "pending" | "ok" | "bad"> = {
  PENDING: "pending",
  APPROVED: "ok",
  REJECTED: "bad",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Thành công",
  REJECTED: "Từ chối",
};

export function WalletPage() {
  const { openTopup, openWithdraw } = useWalletSheets();
  const [filter, setFilter] = useState("");

  const filterMap: Record<string, string> = {
    Nạp: "topup",
    Rút: "withdraw",
    "Doanh thu": "revenue",
    Phạt: "penalty",
    "Điều chỉnh": "adjustment",
  };
  const typeFilter = filter ? filterMap[filter] : undefined;

  const { data: dash, isLoading: dashLoading } = useQuery<DashboardData>({
    queryKey: ["driver-dashboard"],
    queryFn: fetchDashboard,
  });

  const { data: txData, isLoading: txLoading, isFetching: txFetching } = useQuery<TransactionItem[]>({
    queryKey: ["driver-transactions", typeFilter],
    queryFn: () => fetchTransactions(0, 50, typeFilter),
    placeholderData: (prev) => prev,
  });

  const balance = dash?.availableBalance ?? 0;
  const totalBalance = dash?.totalBalance ?? 0;
  const held = totalBalance - balance;

  if (dashLoading || txLoading) return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-24">
      <Skeleton variant="text" className="w-20" />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
      <Skeleton variant="table" />
    </div>
  );

  const transactions = txData || [];

  return (
    <div className="screen-pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h1 className="h1">Ví</h1>

      <div className="hero" data-od-id="wallet-balance">
        <p className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Số dư khả dụng</p>
        <p className="hero-value num" style={{ marginTop: 6 }}>{formatCurrency(balance)}</p>
        <div className="row-between" style={{ marginTop: 16, borderTop: "1px solid var(--border-soft)", paddingTop: 14 }}>
          <span className="meta">Tổng số dư</span>
          <span className="muted num" style={{ fontWeight: 600 }}>{formatCurrency(totalBalance)}</span>
        </div>
        <div className="row-between" style={{ marginTop: 8 }}>
          <span className="meta">Tạm giữ</span>
          <span className="muted num" style={{ fontWeight: 600 }}>{formatCurrency(held)}</span>
        </div>
      </div>

      <div className="action-grid" data-od-id="wallet-actions">
        <button type="button" className="action-card primary" onClick={openTopup}>
          <ArrowUp size={19} strokeWidth={1.9} /> Nạp tiền
        </button>
        <button type="button" className="action-card" onClick={openWithdraw}>
          <ArrowDown size={19} strokeWidth={1.9} /> Rút tiền
        </button>
      </div>

      <div className="chips" data-od-id="wallet-filters" style={{ margin: "0 -4px" }}>
        {["", "Nạp", "Rút", "Doanh thu", "Phạt", "Điều chỉnh"].map((chip) => (
          <button
            key={chip}
            type="button"
            className={`chip ${filter === chip ? "active" : ""}`}
            onClick={() => setFilter(chip)}
          >
            {chip || "Tất cả"}
          </button>
        ))}
      </div>

      {txFetching ? (
        <div className="flex flex-col gap-3">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : (
        <div className="card glass" style={{ padding: "8px 20px", display: "flex", flexDirection: "column" }} data-od-id="wallet-txlist">
          {transactions.map((tx, i, arr) => (
            <div key={tx.transactionCode || i}>
              <div className="row" style={{ padding: "14px 0" }}>
                <IconTile variant={TX_TILE[tx.transactionType] || "info"}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M8 12.5l2.6 2.6L16 9.5" />
                  </svg>
                </IconTile>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{TX_LABEL[tx.transactionType] || tx.transactionType}</p>
                  <p className="meta" style={{ marginTop: 2 }}>{formatDateTime(tx.createdAt)}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="num" style={{ fontWeight: 700, color: tx.amount > 0 ? "var(--success)" : "var(--danger)" }}>
                    {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
                  </span>
                  <p style={{ marginTop: 4 }}>
                    <StatusPill variant={STATUS_PILL[tx.status] || "pending"}>{STATUS_LABEL[tx.status] || tx.status}</StatusPill>
                  </p>
                </div>
              </div>
              {i < arr.length - 1 && <hr className="divider" style={{ margin: 0 }} />}
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="meta" style={{ textAlign: "center", padding: "26px 0" }}>Không có giao dịch</p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm --filter @xanh/driver typecheck`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add apps/driver/src/modules/wallet/pages/wallet-page.tsx
git commit -m "style(driver): liquid glass wallet page with glass sheets"
```

---

### Task 10: Income page restyle

**Files:**
- Modify: `apps/driver/src/modules/income/pages/income-list-page.tsx` (replace entire file)

**Interfaces:**
- Consumes: Task 2 classes, `fetchRevenueHistory` (existing), `formatCurrency` (existing). Keep debounce + `driver-revenue` query key.

- [ ] **Step 1: Replace `income-list-page.tsx`**

```tsx
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Search } from "lucide-react";
import { Skeleton } from "@xanh/ui/skeleton";
import { fetchRevenueHistory } from "../api/income.api";
import { formatCurrency } from "@xanh/utils";

export function IncomeListPage() {
  const [keyword, setKeyword] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(keyword), 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  const { data: periods, isFetching } = useQuery({
    queryKey: ["driver-revenue", debounced],
    queryFn: () => fetchRevenueHistory(debounced || undefined),
    placeholderData: (prev) => prev,
  });

  if (!periods) return (
    <div className="space-y-4 p-4">
      <div className="input-shell" style={{ opacity: 0.5 }}>
        <Search size={17} strokeWidth={1.8} />
        <input type="search" placeholder="Tìm kiếm theo tháng, quý..." disabled />
      </div>
      <Skeleton variant="card" />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
    </div>
  );

  return (
    <div className="screen-pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="row-between">
        <h1 className="h1">Doanh thu</h1>
      </div>
      <div className="input-shell" data-od-id="income-search">
        <Search size={17} strokeWidth={1.8} />
        <input
          type="search"
          placeholder="Tìm kiếm theo tháng, quý..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>
      <div id="incomeList" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {isFetching ? (
          <>
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </>
        ) : (periods || []).map((period, i) => (
          <div key={i} className="period-card glass tap" data-od-id={`income-period-${i + 1}`}>
            <div className="row-between">
              <div>
                <h3 className="h2">{period.periodName}</h3>
                <p className="meta" style={{ marginTop: 3 }}>{period.startDate} – {period.endDate}</p>
              </div>
              <ChevronRight size={18} strokeWidth={1.8} style={{ color: "var(--meta)" }} />
            </div>
            <hr className="divider" style={{ margin: "14px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <div className="row-between">
                <span className="muted" style={{ fontSize: 13 }}>Doanh thu</span>
                <span className="num" style={{ fontWeight: 600 }}>{formatCurrency(period.totalRevenue)}</span>
              </div>
              <div className="row-between">
                <span className="muted" style={{ fontSize: 13 }}>Chuyến</span>
                <span className="num" style={{ fontWeight: 600 }}>{period.totalTrips}</span>
              </div>
              <div className="row-between">
                <span className="muted" style={{ fontSize: 13 }}>Thực nhận</span>
                <span className="num" style={{ fontWeight: 600, color: "var(--success)" }}>{formatCurrency(period.earnedAmount)}</span>
              </div>
            </div>
          </div>
        ))}
        {!isFetching && (!periods || periods.length === 0) && (
          <p className="meta" style={{ textAlign: "center", padding: "28px 0" }}>
            {keyword ? "Không tìm thấy kỳ doanh thu" : "Chưa có dữ liệu doanh thu"}
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm --filter @xanh/driver typecheck`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add apps/driver/src/modules/income/pages/income-list-page.tsx
git commit -m "style(driver): liquid glass income page"
```

---

### Task 11: Notifications page restyle

**Files:**
- Modify: `apps/driver/src/modules/notification/pages/notification-page.tsx` (replace entire file)

**Interfaces:**
- Consumes: `IconTile` (Task 4), Task 2 classes, `fetchNotifications`/`markAllRead`/`markRead` (existing), `formatDateTime` (existing). Keep navigation behavior.

Type → tile variant mapping (fixed): `withdrawal_approved`→ok, `withdrawal_rejected`→bad, `topup_approved`→accent, `complaint_resolved`→ok, `complaint_rejected`→bad, default→info.

- [ ] **Step 1: Replace `notification-page.tsx`**

```tsx
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, XCircle, Banknote, CheckCircle, MessageSquare, type LucideIcon } from "lucide-react";
import { fetchNotifications, markAllRead, markRead } from "../api/notification.api";
import { formatDateTime } from "@xanh/utils";
import { IconTile, type TileVariant } from "../../../shared/icon-tile";

const TYPE_ICON: Record<string, LucideIcon> = {
  withdrawal_approved: ArrowUpRight,
  withdrawal_rejected: XCircle,
  topup_approved: Banknote,
  complaint_resolved: CheckCircle,
  complaint_rejected: XCircle,
};

const TYPE_TILE: Record<string, TileVariant> = {
  withdrawal_approved: "ok",
  withdrawal_rejected: "bad",
  topup_approved: "accent",
  complaint_resolved: "ok",
  complaint_rejected: "bad",
};

export function NotificationPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["driver-notifications", page],
    queryFn: () => fetchNotifications(page),
  });

  const markMut = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["driver-notifications"] }),
  });

  const handleClick = (notif: { id: string; type: string; isRead: boolean; referenceType?: string; referenceId?: string }) => {
    if (!notif.isRead) {
      markRead(notif.id).then(() => {
        qc.invalidateQueries({ queryKey: ["driver-notifications"] });
        qc.invalidateQueries({ queryKey: ["driver-notifications-unread"] });
      });
    }
    if (notif.type?.startsWith("withdrawal") || notif.type?.startsWith("topup")) {
      navigate({ to: "/wallet" } as any);
    } else if (notif.type?.startsWith("complaint")) {
      navigate({ to: "/complaints" } as any);
    }
  };

  return (
    <div className="screen-pad" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="row-between" style={{ marginBottom: 10 }}>
        <h1 className="h1">Thông báo</h1>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ fontSize: 13, color: "var(--teal-fg)", fontWeight: 600 }}
          onClick={() => markMut.mutate()}
        >
          Đã đọc tất cả
        </button>
      </div>
      <div id="notifList" style={{ display: "flex", flexDirection: "column" }}>
        {(data?.items || []).length === 0 && !isLoading && (
          <p className="meta" style={{ textAlign: "center", padding: "32px 0" }}>Không có thông báo</p>
        )}
        {(data?.items || []).map((notif, i, arr) => {
          const Icon = TYPE_ICON[notif.type] || MessageSquare;
          return (
            <div key={notif.id}>
              <div
                className={`notif ${!notif.isRead ? "unread" : ""}`}
                style={{ opacity: notif.isRead ? 0.7 : 1 }}
                onClick={() => handleClick(notif)}
              >
                <IconTile variant={TYPE_TILE[notif.type] || "info"}>
                  <Icon size={18} strokeWidth={1.8} />
                </IconTile>
                <div className="body">
                  <p className="notif-title">{notif.title}</p>
                  <p className="notif-msg">{notif.message}</p>
                  <p className="notif-time">{formatDateTime(notif.createdAt)}</p>
                </div>
                {!notif.isRead && <span className="unread-dot" />}
              </div>
              {i < arr.length - 1 && <hr className="divider" style={{ margin: 0 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Fix `IconTile` export (add `TileVariant` type)**

Modify `apps/driver/src/shared/icon-tile.tsx`:

```tsx
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
```

- [ ] **Step 3: Verify**

Run: `pnpm --filter @xanh/driver typecheck`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add apps/driver/src/modules/notification/pages/notification-page.tsx apps/driver/src/shared/icon-tile.tsx
git commit -m "style(driver): liquid glass notifications page"
```

---

### Task 12: Complaints (list + detail + create sheet)

**Files:**
- Modify: `apps/driver/src/modules/complaint/pages/complaint-list-page.tsx` (replace entire file)
- Modify: `apps/driver/src/modules/complaint/pages/complaint-detail-page.tsx` (replace entire file)
- Delete: `apps/driver/src/modules/complaint/pages/complaint-create-page.tsx`
- Delete: `apps/driver/src/modules/complaint/routes/complaint-create.tsx`
- Modify: `apps/driver/src/routeTree.gen.ts` (remove create route import + child)

**Interfaces:**
- Consumes: `GlassSheet`/`GlassButton`/`StatusPill`/`useToast` (shared), `fetchMyComplaints`/`createComplaint` (existing), `formatDateTime` (existing), Task 2 classes.
- Status pill mapping: `pending`→warn, `processing`→pending, `resolved`→ok, `rejected`→bad.

- [ ] **Step 1: Replace `complaint-list-page.tsx`** (create sheet inline)

```tsx
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@xanh/ui/skeleton";
import { Plus, ChevronRight } from "lucide-react";
import { fetchMyComplaints, createComplaint } from "../api/complaint.api";
import { formatDateTime } from "@xanh/utils";
import { StatusPill, GlassSheet, GlassButton, useToast, type PillVariant } from "../../../shared";

const STATUS_PILL: Record<string, PillVariant> = {
  pending: "warn",
  processing: "pending",
  resolved: "ok",
  rejected: "bad",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  resolved: "Đã giải quyết",
  rejected: "Đã từ chối",
};

const CATEGORIES = [
  { value: "doanh_thu", label: "Doanh thu" },
  { value: "khau_tru", label: "Khấu trừ" },
  { value: "phat", label: "Phạt" },
  { value: "khac", label: "Khác" },
];

export function ComplaintListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [category, setCategory] = useState("khac");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["driver-complaints", page],
    queryFn: () => fetchMyComplaints(page),
  });

  const createMut = useMutation({
    mutationFn: () => createComplaint({ category, title: title.trim(), description: description.trim() || undefined }),
    onSuccess: () => {
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      setCategory("khac");
      qc.invalidateQueries({ queryKey: ["driver-complaints"] });
      toast.show("Khiếu nại đã được gửi");
    },
    onError: (err: Error) => toast.show(err.message, "err"),
  });

  if (isLoading) return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton variant="text" className="w-24" />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
      <Skeleton variant="card" />
    </div>
  );

  return (
    <div className="screen-pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="row-between">
        <h1 className="h1">Khiếu nại</h1>
        <button
          type="button"
          className="btn btn-primary"
          style={{ minHeight: 44, padding: "0 16px", fontSize: 14 }}
          onClick={() => {
            setCategory("khac");
            setTitle("");
            setDescription("");
            setCreateOpen(true);
          }}
        >
          <Plus size={16} strokeWidth={2} /> Tạo khiếu nại
        </button>
      </div>

      {error && (
        <div className="card glass" style={{ borderColor: "color-mix(in oklab, var(--danger) 40%, var(--border))", color: "var(--danger)" }}>
          {error.message}
        </div>
      )}

      <div id="complaintList" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data?.items?.map((c) => (
          <button
            key={c.id}
            type="button"
            className="card glass tap complaint"
            onClick={() => navigate({ to: `/complaints/${c.id}` } as never)}
          >
            <div className="row-between">
              <h3 className="h2" style={{ textAlign: "left" }}>{c.title}</h3>
              <StatusPill variant={STATUS_PILL[c.status] || "pending"}>{STATUS_LABEL[c.status] || c.status}</StatusPill>
            </div>
            <p className="muted" style={{ fontSize: 13, textAlign: "left" }}>{c.code} · Gửi {formatDateTime(c.createdAt)}</p>
            <div className="row-between">
              <span className="meta">{CATEGORIES.find((x) => x.value === c.category)?.label || c.category}</span>
              <ChevronRight size={16} strokeWidth={1.8} style={{ color: "var(--meta)" }} />
            </div>
          </button>
        ))}
        {(!data || data.items.length === 0) && !error && (
          <p className="meta" style={{ textAlign: "center", padding: "28px 0" }}>Bạn chưa có khiếu nại nào</p>
        )}
      </div>

      <GlassSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tạo khiếu nại"
        description="Mô tả vấn đề để bộ phận vận hành xử lý trong 3–5 ngày làm việc."
        footer={
          <>
            <GlassButton variant="secondary" style={{ flex: 1 }} onClick={() => setCreateOpen(false)}>Hủy</GlassButton>
            <GlassButton
              style={{ flex: 1.6 }}
              isLoading={createMut.isPending}
              disabled={!title.trim() || !description.trim()}
              onClick={() => createMut.mutate()}
            >
              Gửi khiếu nại
            </GlassButton>
          </>
        }
      >
        <div className="field">
          <label htmlFor="complaintType">Loại khiếu nại</label>
          <div className="input-shell select-shell">
            <select id="complaintType" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <svg className="caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="complaintTitle">Tiêu đề</label>
          <div className="input-shell">
            <input
              id="complaintTitle"
              type="text"
              placeholder="Tóm tắt vấn đề"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="complaintBody">Nội dung</label>
          <textarea
            id="complaintBody"
            className="textarea-shell"
            placeholder="Mô tả chi tiết: ngày, chuyến, số tiền liên quan..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </GlassSheet>
    </div>
  );
}
```

- [ ] **Step 2: Replace `complaint-detail-page.tsx`**

```tsx
import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { fetchMyComplaints } from "../api/complaint.api";
import { formatDateTime } from "@xanh/utils";
import { StatusPill, type PillVariant } from "../../../shared";

const STATUS_PILL: Record<string, PillVariant> = {
  pending: "warn",
  processing: "pending",
  resolved: "ok",
  rejected: "bad",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  resolved: "Đã giải quyết",
  rejected: "Đã từ chối",
};

const CATEGORY_LABEL: Record<string, string> = {
  doanh_thu: "Doanh thu",
  khau_tru: "Khấu trừ",
  phat: "Phạt",
  khac: "Khác",
};

export function ComplaintDetailPage() {
  const { id } = useParams({ from: "/_auth/complaints/$id" });
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["driver-complaints", "all"],
    queryFn: () => fetchMyComplaints(0, 100),
    select: (d) => d.items.find((c) => c.id === id),
  });

  if (!data) return <div className="p-4 meta">Đang tải...</div>;

  return (
    <div className="screen-pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="row-between">
        <button type="button" className="back-btn" onClick={() => navigate({ to: "/complaints" } as never)}>
          <ArrowLeft size={18} strokeWidth={2} /> Khiếu nại
        </button>
        <StatusPill variant={STATUS_PILL[data.status] || "pending"}>{STATUS_LABEL[data.status] || data.status}</StatusPill>
      </div>

      <div className="card glass" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h1 className="h2">{data.title}</h1>
        <p className="meta">{data.code} · Gửi {formatDateTime(data.createdAt)}</p>
        <hr className="divider" style={{ margin: 0 }} />
        <div>
          <p className="section-title" style={{ fontSize: 15, marginBottom: 6 }}>Nội dung khiếu nại</p>
          <p className="body2" style={{ fontSize: 15, lineHeight: 1.6 }}>
            {data.description || "Không có mô tả."}
            {data.amount > 0 && ` Số tiền: ${data.amount.toLocaleString("vi-VN")} ₫`}
          </p>
        </div>
        {data.response && (
          <div className="glass-soft" style={{ borderRadius: 16, padding: 16 }}>
            <p className="section-title" style={{ fontSize: 14, marginBottom: 6 }}>
              {data.status === "rejected" ? "Lý do từ chối" : "Phản hồi"}
              {data.respondedAt ? ` · ${formatDateTime(data.respondedAt)}` : ""}
            </p>
            <p className="body2" style={{ fontSize: 14, lineHeight: 1.6 }}>{data.response}</p>
            {data.respondedByName && (
              <p className="meta" style={{ marginTop: 8 }}>Bởi {data.respondedByName}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Delete create page + route, update route tree**

```bash
git rm apps/driver/src/modules/complaint/pages/complaint-create-page.tsx apps/driver/src/modules/complaint/routes/complaint-create.tsx
```

Edit `apps/driver/src/routeTree.gen.ts`:
- Remove line: `import { Route as AuthComplaintCreateRoute } from './modules/complaint/routes/complaint-create';`
- Remove line: `AuthComplaintCreateRoute,` (from `AuthRoute.addChildren([...])`)

- [ ] **Step 4: Export `PillVariant` type**

Modify `apps/driver/src/shared/status-pill.tsx` first line:

```tsx
export type PillVariant = 'ok' | 'warn' | 'bad' | 'pending';
```

(keep the rest of the file unchanged)

Modify `apps/driver/src/shared/index.ts` — add the re-export line:

```ts
export type { PillVariant } from './status-pill';
```

- [ ] **Step 5: Verify**

Run: `pnpm --filter @xanh/driver typecheck`
Expected: passes (no imports of the deleted page remain).

- [ ] **Step 6: Commit**

```bash
git add -A apps/driver/src/modules/complaint apps/driver/src/routeTree.gen.ts apps/driver/src/shared/status-pill.tsx apps/driver/src/shared/index.ts
git commit -m "style(driver): liquid glass complaints with create sheet; drop create page"
```

---

### Task 13: Profile page restyle

**Files:**
- Modify: `apps/driver/src/modules/profile/pages/profile-page.tsx` (replace entire file)

**Interfaces:**
- Consumes: `StatusPill` (not used here), Task 2 classes, `fetchProfile` (existing), `formatCurrency` (existing). Logout button uses the same session-clearing behavior as the drawer (localStorage remove + queryClient.clear + navigate `/login`).

- [ ] **Step 1: Replace `profile-page.tsx`**

```tsx
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Skeleton } from "@xanh/ui/skeleton";
import { LogOut } from "lucide-react";
import { fetchProfile } from "../api/profile.api";
import { formatCurrency } from "@xanh/utils";

export function ProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["driver-profile"],
    queryFn: fetchProfile,
  });

  if (isLoading) return (
    <div className="space-y-4 p-4">
      <Skeleton variant="text" className="w-24" />
      <Skeleton variant="avatar" />
      <Skeleton variant="card" />
    </div>
  );

  const info = [
    { label: "Số điện thoại", value: profile?.phone || "—" },
    { label: "Email", value: profile?.email || "—" },
    { label: "CCCD", value: profile?.cccd || "—" },
    { label: "Ngày sinh", value: profile?.birthDate || "—" },
    { label: "Địa chỉ", value: profile?.address || "—" },
    { label: "Số GPLX", value: profile?.licenseNumber || "—" },
    { label: "Hạng GPLX", value: profile?.licenseClass || "—" },
    { label: "Ngày tham gia", value: profile?.joinDate || "—" },
    { label: "Tiền cọc", value: profile?.depositAmount ? formatCurrency(profile.depositAmount) : "—" },
  ];

  const logout = () => {
    localStorage.removeItem("xanhsm-driver-auth");
    qc.clear();
    navigate({ to: "/login" } as never);
  };

  return (
    <div className="screen-pad" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="row-between">
        <h1 className="h1">Hồ sơ</h1>
      </div>

      <div className="card glass" data-od-id="profile-head">
        <div className="profile-head">
          <div className="profile-avatar">
            {profile?.fullName?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <h2 className="h1" style={{ fontSize: 22 }}>{profile?.fullName || "..."}</h2>
          <p className="muted" style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.04em" }}>{profile?.driverCode || ""}</p>
          <div className="stat-grid" style={{ width: "100%", marginTop: 16 }}>
            <div className="stat glass-soft">
              <p className="stat-label">Số dư</p>
              <p className="stat-value num">{formatCurrency(profile?.availableBalance || 0)}</p>
            </div>
            <div className="stat glass-soft">
              <p className="stat-label">Tổng số dư</p>
              <p className="stat-value num">{formatCurrency(profile?.totalBalance || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card glass" data-od-id="profile-info">
        <h3 className="section-title" style={{ marginBottom: 6 }}>Thông tin cá nhân</h3>
        <dl style={{ marginTop: 8 }}>
          {info.map((row) => (
            <div key={row.label} className="info-row">
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="card glass" style={{ padding: 8 }}>
        <button type="button" className="drawer-item danger" onClick={logout}>
          <LogOut size={19} strokeWidth={1.8} /> Đăng xuất
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm --filter @xanh/driver typecheck`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add apps/driver/src/modules/profile/pages/profile-page.tsx
git commit -m "style(driver): liquid glass profile page"
```

---

### Task 14: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full check suite**

Run from `frontend/`:

```bash
pnpm --filter @xanh/driver typecheck
pnpm --filter @xanh/driver lint
pnpm --filter @xanh/driver build
pnpm --filter @xanh/driver test
```

Expected: all four succeed. If lint flags unused imports (e.g. `Wallet` type in notification page), fix them and re-run.

- [ ] **Step 2: Manual visual pass**

Run: `pnpm --filter @xanh/driver dev`, open http://localhost:3002, verify against `frontend/design/driver-app-liquid-glass.html`:
- Login screen: glass card, brand mark, theme toggle top-right; login works.
- Home: hero balance, action grid (Nạp/Rút open bottom sheets), settlement card, stat grid, recent transactions.
- Wallet: hero, filters, tx list with pills; sheets validate (min 10k topup / min 50k + bank for withdraw).
- Income: search + period cards.
- Notifications: unread dots, mark all read.
- Complaints: create sheet (select + title + textarea), detail with response block.
- Profile: avatar, info rows, logout.
- Toggle light/dark on login and topbar — whole app switches; persists after reload.

- [ ] **Step 3: Commit any fixes made during Step 2**

```bash
git add -A apps/driver/src
git commit -m "fix(driver): final liquid glass polish"
```

(If nothing changed, skip this commit.)
