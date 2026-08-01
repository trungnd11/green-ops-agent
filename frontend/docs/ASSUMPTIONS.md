# Assumptions

## Design Analysis

1. **Dark theme only**: The design.pen uses a dark color scheme consistently across all screens (bg-canvas: #07111F). We assume the app is dark-only unless explicitly asked for light mode.

2. **No skeleton screens in design.pen**: The design references LoadingSkeleton as a component but doesn't show skeleton UIs on specific pages. We make reasonable skeleton layouts based on content structure.

3. **No responsive breakpoints in design.pen**: The admin screens are 1440px wide, driver screens are 390px wide. We assume:
   - Admin: desktop-first with sidebar collapse at <1024px, mobile drawer at <768px
   - Driver: mobile-first with bottom nav, max-width: 480px on desktop

4. **No empty/error states shown for every page**: Only EmptyState, ErrorState, and PermissionDenied exist as components. We assume each list page handles loading, empty, error states.

5. **No API contract provided**: API types and interfaces are inferred from the design data display. Field names may differ from actual backend.

6. **Icons**: design.pen uses Lucide icons (search, bell, chevron-down, etc.). We use lucide-react consistently.

7. **Typography**: Manrope for headings, Inter for body text. These are loaded via Google Fonts CDN.

8. **Auth flow**: Login screens exist for both admin and driver. We assume JWT-based auth with access/refresh tokens.

9. **Data format**: VND currency displayed as "13.486.551.080 ₫" (no decimals, dot separation). Dates in DD/MM/YYYY format.

10. **Language**: All UI text is in Vietnamese as shown in design.pen.

## Technical

11. **pnpm catalog**: We use pnpm catalog for dependency version management.

12. **Router context**: TanStack Router context includes queryClient. Auth context will be added when auth is fully implemented.

13. **No real API**: The app uses mock data for demonstration. API integration requires backend.

14. **Build tool**: Rsbuild with Rspack under the hood. TanStack Router plugin via Rspack.

15. **MSW**: Mock Service Worker is configured but not yet active. Set PUBLIC_ENABLE_MOCK=true to enable.

## Screens not yet implemented (in design.pen but not coded):

- Admin: A02b-d (type-specific dashboards), A03 (Tasks), A06 (Bank verification), A08-A10 (Import), A11-A12 (Revenue detail), A13-A15 (Adjustments), A16-A26 (Settlements/Requests/Complaints), A27-A32 (Reports/Notifications/Admin)
- Driver: D05-D09 (Revenue detail, Settlement detail, Confirm, Complaint), D11-D14 (Transaction detail, Deposit), D15-D20 (Withdrawal, Requests, Profile, Bank account, Security)
