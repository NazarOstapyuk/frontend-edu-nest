# Payroll Extra Hours and Absences (Frontend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins record a teacher's extra hours (with an optional own hourly rate) and absences in the payroll card, set the extra hour rate in salary terms, toggle whether the teacher sees the details, and show those details in «Моя зарплата».

**Architecture:** Types and calls go into `shared/api/payroll.ts`; the shared read-only widget `widgets/payrollDetail` gains «Додаткові години» and «Відсутності» sections (so the teacher cabinet gets them for free); the staff card `pages/payroll/ui/PayrollDetailDialog.tsx` adds the two add dialogs, void actions and the visibility switch, all through the existing `runDetail` so the month list stays in sync. Amounts and day counts come from the backend; never compute them on the frontend.

**Tech Stack:** React 19, TypeScript 6, MUI 9, Zustand 5, react-hook-form 7 + yup, axios.

**Spec:** backend repo `D:\IT\backend-edu-nest\docs\superpowers\specs\2026-10-23-payroll-extra-hours-absences-design.md` (API section); the exact backend contract is in the backend `CLAUDE.md`, Frontend section, bullet «Payroll extra hours and absences API».

## Global Constraints

- No new dependencies. Don't touch `axiosInstance`, theme or `RequireAuth`. No cross-page store imports.
- All UI text in Ukrainian. No code comments.
- MUI 9: `slotProps`, not `InputLabelProps`/`InputProps`; check prop types in `node_modules/@mui/material/<C>/<C>.d.ts`.
- Forms: `Controller` + MUI component, `useForm({ mode: 'all', resolver: yupResolver(schema) })`, as in `pages/payroll/ui/AdjustmentDialog.tsx`.
- Server errors are shown by the interceptor; components only keep dialogs open on failure (`.catch(() => undefined)`).
- Money: strings from the API, `formatMoney` for display, `normalizeAmount` before sending. Hours are sent as strings with a dot (`'1.5'`).
- Verification per task: `npm run build` and `npm run lint` with no errors. There are no tests in this repo.

## Review Focus

- A month that is approved: add/void buttons for hours and absences must be hidden (backend answers 400 `Payroll is approved`; showing them invites a dead end).
- Teacher cabinet with the switch off: `extraHours`, `absences`, `days.unpaidAbsenceDays`, `payrollDetailsVisible` are absent from the response; the view must still show the `extra_hours` line amount so the total adds up, and never crash on the missing keys.
- Comma decimal input («1,5» hours, «300,50» rate) must be accepted and sent with a dot.
- A voided record stays visible to staff (dimmed, «Анульовано: …») and is not counted; teachers never get voided records.
- Absences returned by the card are only those touching the month; a period crossing months shows its own `workingDays` for this month only (backend value, display as is).

---

### Task 1: API types, calls and error translations

**Files:**
- Modify: `src/shared/api/payroll.ts`
- Modify: `src/shared/api/index.ts` (re-export new types/labels)
- Modify: `src/shared/api/errorMessages.ts`

**Interfaces:**
- Produces:
  - `PayrollLineType` gains `'extra_hours'`.
  - `SalaryTerms` gains `extraHourRate: string | null; payrollDetailsVisible: boolean`.
  - `CreateSalaryTermsDto.extraHourRate?: string`; `UpdateSalaryTermsDto.extraHourRate?: string | null`.
  - `PayrollDays.unpaidAbsenceDays?: number`.
  - `PayrollWarnings.lessonsOnAbsenceDays?: string[]` (ISO dates).
  - `interface PayrollExtraHours { id?: string; date: string | null; hours: string; rate?: string | null; ownRate?: string | null; amount: string | null; comment: string | null; createdAt?: string; createdBy?: PersonRef; voidedAt?: string | null; voidReason?: string | null }` (teacher view has only `date, hours, amount, comment`).
  - `interface TeacherAbsence { id: string; teacherId?: string; startDate: string; endDate: string; paid: boolean; reason: string; workingDays?: number; createdAt: string; createdBy?: PersonRef; voidedAt: string | null; voidReason: string | null }`.
  - `PayrollDetail` gains `extraHours?: PayrollExtraHours[]; absences?: TeacherAbsence[]; payrollDetailsVisible?: boolean`.
  - `interface ExtraHoursDto { date?: string; hours: string; rate?: string; comment?: string }`, `interface AbsenceDto { startDate: string; endDate?: string; paid: boolean; reason: string }`.
  - `payrollApi` gains:
    - `addExtraHours(teacherId, month, dto: ExtraHoursDto)` → `POST /payroll/:teacherId/:month/extra-hours`, `PayrollDetail`
    - `voidExtraHours(id, reason)` → `POST /payroll-extra-hours/:id/void`, `PayrollDetail`
    - `addAbsence(teacherId, dto: AbsenceDto)` → `POST /teachers/:teacherId/absences`, `TeacherAbsence`
    - `getAbsences(teacherId, from?, to?)` → `GET /teachers/:teacherId/absences`, `TeacherAbsence[]`
    - `voidAbsence(id, reason)` → `POST /teacher-absences/:id/void`, `TeacherAbsence`
    - `setDetailsVisibility(teacherId, visible: boolean)` → `PATCH /payroll/teachers/:teacherId/details-visibility`, `{ visible: boolean }`

- [ ] **Step 1:** Add the types and calls above to `payroll.ts` (use `sheetPath` for the sheet route) and re-export in `index.ts` (`export type` separately).
- [ ] **Step 2:** Add translations to `errorMessages.ts` (keep existing `Invalid hours` and `Invalid period`; `User is not a teacher`, `Salary terms not found`, `Payroll is approved` already exist):
  - `'No extra hour rate': 'У умовах оплати немає ставки за додаткову годину. Вкажіть ставку в записі або в умовах.'`
  - `'Date is in the future': 'Дата ще не настала'`
  - `'Extra hours not found': 'Запис годин не знайдено'`
  - `'Extra hours are voided': 'Запис годин уже анульовано'`
  - `'Absence not found': 'Відсутність не знайдено'`
  - `'Absence is voided': 'Відсутність уже анульовано'`
  - `'Absence overlaps another absence': 'На ці дні вже є відсутність'`
- [ ] **Step 3:** `npm run build` and `npm run lint` clean.
- [ ] **Step 4:** Commit `feat: payroll extra hours and absences api`.

### Task 2: Extra hour rate in salary terms

**Files:**
- Modify: `src/pages/payroll/ui/TermsDialog.tsx`
- Modify: `src/pages/payroll/ui/TermsTab.tsx`

**Interfaces:**
- Consumes: `SalaryTerms.extraHourRate`, DTO fields from Task 1.

- [ ] **Step 1:** `TermsDialog`: field «Ставка за додаткову годину, грн» right after «Ставка за місяць» (optional; same `AMOUNT` regex as other amounts when non-empty; helper «Порожньо — додаткові години не оплачуються за умовами»). Default from `terms.extraHourRate ?? ''`. Payload: create sends `extraHourRate: normalizeAmount(v)` only when non-empty; update sends the normalized value or `null` when emptied.
- [ ] **Step 2:** `TermsTab`: in the «Ставка» cell under the monthly rate show a caption `Дод. година: {formatMoney(extraHourRate)}` when set.
- [ ] **Step 3:** `npm run build`, `npm run lint` clean.
- [ ] **Step 4:** Commit `feat: extra hour rate in salary terms form`.

### Task 3: Extra hours and absences in the payroll detail view

**Files:**
- Modify: `src/widgets/payrollDetail/ui/PayrollDetailView.tsx`

**Interfaces:**
- Consumes: Task 1 types.
- Produces: new optional props `onVoidExtraHours?: (id: string) => void`, `onVoidAbsence?: (id: string) => void`, `actions?: { extraHours?: ReactNode; absences?: ReactNode }` (rendered at the right of the section title, used by Task 4 for «Додати» buttons).

- [ ] **Step 1:** Base line text: when `detail.days.unpaidAbsenceDays` > 0 append `, неоплачувані відсутності: N дн.`; when also `detail.days.override` append ` (дні введено вручну, відсутності не враховано)`.
- [ ] **Step 2:** Section «Додаткові години» (after «Заняття»), shown when `extraHours` is present or an `extra_hours` line exists or `actions.extraHours` is given:
  - With `detail.extraHours`: table rows date (`formatDay`, or «за місяць» when null), `{hours} год`, rate caption `× {formatMoney(rate)}` when `rate` present (staff), comment, `createdBy` caption, voided rows dimmed with `Voided` chip and no amount, amount right-aligned (`amount` null → «—»), void button when `onVoidExtraHours` and not voided. Footer row «Разом» with the `extra_hours` line amount (0.00 when no line).
  - Without `detail.extraHours` (teacher, switch off): one row with the line `title` and amount.
  - Empty: «Немає».
- [ ] **Step 3:** Section «Відсутності» shown only when `detail.absences` is present: rows `formatDay(startDate)` (– `formatDay(endDate)` when different), chip «Оплачувана» / «Неоплачувана» (warning color for unpaid), reason, caption `робочих днів у місяці: {workingDays}` when defined, `createdBy`, voided styling, void button when `onVoidAbsence` and not voided. Empty: «Немає».
- [ ] **Step 4:** Warning (only when `showWarnings`): `lessonsOnAbsenceDays?.length` > 0 → `Alert severity="warning"`: «Є заняття в дні відсутності: {dates via formatDay, comma-separated}. Перевірте відсутність або запис заняття.»
- [ ] **Step 5:** `npm run build`, `npm run lint` clean (teacher page `MyPayrollPage` compiles without changes).
- [ ] **Step 6:** Commit `feat: extra hours and absences in payroll detail view`.

### Task 4: Staff card actions, visibility switch and docs

**Files:**
- Create: `src/pages/payroll/ui/ExtraHoursDialog.tsx`
- Create: `src/pages/payroll/ui/AbsenceDialog.tsx`
- Modify: `src/pages/payroll/ui/PayrollDetailDialog.tsx`
- Modify: `CLAUDE.md` (Payroll paragraph)

**Interfaces:**
- Consumes: `payrollApi.*` from Task 1, view props from Task 3, `usePayrollStore` (`runDetail`, `isSaving`, `month`).

- [ ] **Step 1:** `ExtraHoursDialog({ onClose })`: toggle «За день» / «За місяць» (`ToggleButtonGroup`, default «За день»); date (`type="date"`, required in day mode, must be inside the store `month` and ≤ `localToday()`: «Дата має бути в цьому місяці» / «Дата ще не настала»; default = today when inside the month, else the month's last day); hours (required, `/^\d{1,3}([.,]\d{1,2})?$/`, > 0, ≤ 24 in day mode «Не більше 24 годин за день», ≤ 400 in month mode «Не більше 400 годин»); own rate (optional, amount regex, > 0; helper «Порожньо — ставка з умов оплати»); comment (optional, ≤ 200). Submit via `runDetail((t, m) => payrollApi.addExtraHours(t, m, dto))`, hours/rate normalized with a dot, empty optional fields omitted. Title «Додаткові години», button «Додати».
- [ ] **Step 2:** `AbsenceDialog({ onClose })`: start date (required), end date (default = start, ≥ start «Кінець раніше за початок», ≤ start + 91 days «Не довше 92 днів»), `Switch` «Оплачувана (лікарняний, відпустка тощо)» default off with caption «Неоплачувана відсутність зменшує відпрацьовані дні», reason (required, ≤ 200). Default start = today when inside the store `month`, else the month's first day. Submit via `runDetail(async (t, m) => { await payrollApi.addAbsence(t, dto); return payrollApi.getDetail(t, m) })`. Title «Відсутність», button «Додати».
- [ ] **Step 3:** `PayrollDetailDialog`:
  - Pass to `PayrollDetailView`: `actions` with «Додати» buttons (only `canEdit && draft`) opening the two dialogs; `onVoidExtraHours`/`onVoidAbsence` only when `canEdit && draft`.
  - Void through `ReasonDialog` (titles «Анулювати додаткові години», «Анулювати відсутність»); hours: `runDetail(() => payrollApi.voidExtraHours(id, reason))`; absence: `runDetail(async (t, m) => { await payrollApi.voidAbsence(id, reason); return payrollApi.getDetail(t, m) })`.
  - Visibility switch under the status chip when `detail.payrollDetailsVisible !== undefined`: `Switch` labelled «Педагог бачить додаткові години й відсутності в «Моя зарплата»», disabled unless `canEdit` or while saving; on change `runDetail(async (t, m) => { await payrollApi.setDetailsVisibility(t, checked); return payrollApi.getDetail(t, m) })`.
- [ ] **Step 4:** `CLAUDE.md` Payroll paragraph: mention the «Додаткові години» and «Відсутності» blocks (add/void in drafts), the extra hour rate in terms, the visibility switch in the card, and that the teacher sees the blocks only when the switch is on.
- [ ] **Step 5:** `npm run build`, `npm run lint` clean.
- [ ] **Step 6:** Commit `feat: record extra hours and absences in the payroll card`.
