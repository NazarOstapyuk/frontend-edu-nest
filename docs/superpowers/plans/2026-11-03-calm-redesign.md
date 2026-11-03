# Calm Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move the CRM to the approved "calm Toddler" look from the design canvas https://claude.ai/artifact/XGAiJKkVfHo5aeb1WQoBe6 (artboards: CRM admin, Login, Parent phone).

**Architecture:** Most of the look comes from `src/app/styles/theme.ts` (tokens + component overrides), so pages change little. Hand-built parts: sidebar, header, dashboard hero and attention list, login, parent header and the child page hero. No new dependencies, no API changes.

**Tech Stack:** React 19, MUI 9, Zustand, Vite.

## Design tokens (from the canvas)

- Ground `#F6F6F1` (app background, sidebar, header). Surface `#FFFFFF`. Ink `#22231C`. Muted text `#5E5F52` (labels `#66675A`, both pass 4.5:1 on the ground). Hairline inside lists `#EEEEE6`. Surface outline `0 0 0 1px rgba(34,35,28,.08)` (no drop shadows). Hover row `#FBFBF7`, nav hover `#ECEDE4`, table head `#FAFAF6`.
- Orange `#F2803F` only for the main action of a screen and active markers; text on it `#2B1A0E`; orange text/links on white `#B4511C`. Olive `#9FA07D` for themed panels (dashboard hero, login side, parent child hero) with text `#1C1D15`/`#2E2F22`; olive tint `#ECEDE2`, orange tint `#FDE6D6` for icon tiles. Debt/negative amounts `#B4471A`.
- Status chips: paid `#E6ECD9`/`#3F5A1F`, partial `#FFF0C8`/`#7A5200`, unpaid `#FDE6D6`/`#9C3F12`.
- Font Nunito (already loaded), headings 800–900, page h1 30–32px/900. Buttons are pills (radius 999, min height 44, weight 800). Cards/lists radius 20, dialogs 24, inputs 14 (white, 1px outline). Filter chips: white with outline, selected = ink background with white text.
- Tables: container white, radius 20, outline only; head row `#FAFAF6`, 12px/700 muted, no uppercase; body rows separated by `#EEEEE6`.

## Global constraints

- Frontend repo `D:\IT\EduNest`, branch `main`, commit per task, never push. Read `CLAUDE.md` first (FSD, mobile rules, `useIsPhone`, CardList, `fullScreen={isPhone}`, no new deps, no new cross-page store imports). Brand assets and colors: `src/shared/assets/brand` (add new color tokens to `brandColors` there; `app/` may import `shared/`, widgets/pages too).
- Keep all behaviour, routes, permissions and data logic. Only presentation changes.
- `npm run build` clean and `npm run lint` at the baseline (7 problems: 1 error `useForm<any>` in `EditUserModal.tsx`, 6 warnings) after every task.
- Commit trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. No code comments.
- Phone layout (`< sm`) and narrow drawer (`< md`) must keep working.

### Task 1: Theme

`src/app/styles/theme.ts`, `src/shared/assets/brand/index.ts`: tokens above as palette (`background.default #F6F6F1`, `text.secondary #5E5F52`, `divider #EEEEE6`, `grey.50 #FAFAF6`, `primary.dark #B4511C`), component overrides: `MuiPaper` (elevation 0 → outline instead of shadow where `variant="outlined"` or elevation 0 + existing border sx keeps working), `MuiCard`, `MuiDialog` paper radius 24, `MuiOutlinedInput` radius 14 + white background, `MuiTableCell` head (12px, 700, muted, background `#FAFAF6`), body border color, `MuiTableRow` hover `#FBFBF7`, `MuiButton` (pill, min height 44 desktop / 40 small, weight 800; contained primary text `#2B1A0E`; outlined/text primary `#B4511C`; `color="inherit"` stays neutral), `MuiChip` (radius 999, weight 700), `MuiTabs` indicator orange 3px, `MuiTab` selected ink. Remove the old `rgba(74,76,54,…)` values. Commit `style: calm theme tokens`.

### Task 2: Sidebar and header

`src/widgets/sidebar/**`, `src/widgets/header/ui/Header.tsx`, `src/app/layouts/AdminLayout.tsx`:
- Sidebar paper background `#F6F6F1`, no border, scrolls when long. Top: mascot head 44px + logo 140px in a row (no white card). Nav items: height 42, radius 12, muted ink `#4A4B3E` 14px/600; hover `#ECEDE4`; active = white, ink, 800, outline `0 1px 2px rgba(34,35,28,.06), 0 0 0 1px rgba(34,35,28,.05)`, icon `#E06B28`; visible focus ring orange. Badge pill orange with `#2B1A0E` text.
- Group items into sections (add `section` to `NavItem`, keep existing paths/permissions/order inside a section): no title — Сьогодні, Журнал, Повідомлення, Розпорядок дня, Розклад, Харчування, Календар; «Люди» — Учні, Групи, Користувачі, Посади; «Заняття» — Гуртки, Мої заняття, Мої уроки; «Гроші» — Фінанси, Тарифи, Зарплати, Моя зарплата, Звіти; «Налаштування» (bottom) — Довідники розкладу, Причини відсутності, Історія змін, Резервні копії, Заклади, Налаштування. Section title 12px/700 `#66675A`, sentence case, hidden when the section has no visible items.
- Header: background `#F6F6F1`, no bottom border, title 22px/800 ink; avatar olive `#9FA07D` with ink initials. Institution switcher styled as a white outlined pill. Main content max width 1200, centered.
Commit `style: calm sidebar and header`.

### Task 3: Dashboard

`src/pages/dashboard/**`: read the page first. Add a hero section on top: olive panel radius 28, padding 36/40 (24 on phone), mascot (`mascotUrl`) bottom-right 230px wide (hidden on phone), date line (Kyiv, «Вівторок, 3 листопада» style), h1 40px/900 (28 on phone) «Добрий ранок/день/вечір, {firstName}.» + a sentence with the number of sections that need attention («Сьогодні 4 справи чекають на вас.» with correct Ukrainian plural, or «Сьогодні все спокійно.» at 0), primary button to the first section's page. Then «Потребує уваги»: one white list (radius 20, rows separated by hairlines, each row a real button/link: 40px icon tile with tint, bold title, muted meta, orange action text) built from the existing sections that need attention; informational sections (payments, meals totals) become two side-by-side white cards (big 34px/900 number, small breakdown list). Keep all existing data and permission logic; reuse `DashboardCard` only if it fits, else replace it. Commit `style: calm dashboard`.

### Task 4: Lists and detail pages

Pages using filters as `TextField select` stay as they are (theme handles look). Apply the canvas details where cheap and safe:
- Balance amounts: negative/debt in `#B4471A` weight 800 (finance balances, child finance tiles).
- Child finance summary tiles (`src/pages/finance/ui/CategoryTiles.tsx` or the page header): the main «До сплати» tile ink background `#22231C` with white text, others white outlined; radius 20.
- Charge/payment status chips use the status colors above.
- Children and users list name cells: initials avatar 36px with a soft tint (deterministic from the id among `#F9D9C3`, `#E3E4D4`, `#DCE6EE`, `#EAE0EE`).
Read each file before editing; keep the phone CardList variants in sync. Commit `style: calm lists and finance tiles`.

### Task 5: Login and parent cabinet

- `src/pages/login/ui/LoginPage.tsx`: canvas Login artboard: left panel (md+) 44% olive `#9FA07D` with two decorative circles (`#B4B595` large, orange small) and the full mascot at the bottom, a small «Toddler, дитячий садок і школа» line top-left; right: logo 260px, h1 «Вхід для працівників і батьків» 34px/900, muted line «Логін і пароль видає адміністрація закладу.», fields, pill submit, muted hint «Забули пароль? Зверніться до адміністратора закладу, він видасть новий.». Phone: mascot head + logo above the form.
- `src/app/layouts/ParentLayout.tsx`: ground background, header without border on the ground, logo 120px + mascot head; keep links.
- Parent child page (`src/pages/familyChild/**`, read it): olive hero panel radius 24 with the child's name, group/class and the mascot (130px, bottom-right), above the existing content; the amount due card with an orange «Оплатити» button if such an action already exists there (do not add new flows).
Commit `style: calm login and parent cabinet`.

### Task 6: Docs

Update the «Brand» line in frontend `CLAUDE.md` with the calm tokens (ground, ink, muted, outline instead of shadows, orange only for main actions, olive themed panels, status colors, section grouping of the sidebar). Commit `docs: describe calm design tokens`.
