# Institutional Store Management System

A reliable, production-ready Store Management Application built specifically for educational institutions and organizations to manage equipment inventory, issue/return operations, borrower records, QR code labeling, stock adjustments, printable receipts, and immutable activity audit trails.

---

## 1. Project Purpose

The Institutional Store Management System enables storekeepers to:
- Maintain full inventory catalogs (sports gear, electronic equipment, tools, laboratory supplies).
- Upload and automatically compress item photographs.
- Register students, teachers, and staff members, or batch import people via Excel (.xlsx / .csv).
- Issue single or multiple items to borrowers with due dates and purpose tracking.
- Record full or partial item returns with condition assessments (Good, Fair, Damaged, Needs Repair).
- Generate, print, and scan item QR codes for instant physical stock identification.
- Safely adjust physical stock counts with reason tracking and availability safeguards.
- Print professional institutional receipts for issues and returns.
- Inspect an immutable activity audit log (`/audit`) tracking every item, category, person, stock, and borrowing action.
- View real-time store dashboard analytics and export reporting data to Excel.

---

## 2. Technology Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Server Actions, Server Components)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Vanilla CSS (`globals.css`) with Tailwind utility tokens, custom CSS variables, and clean institutional palette (`#F6F6F3` background, `#FFFFFF` surfaces, `#34495E` slate primary accent).
- **Icons**: Lucide React
- **Database Infrastructure**: Supabase (PostgreSQL with RLS) + In-Memory Fallback State for zero-setup local execution.
- **Excel Processing**: `xlsx` (SheetJS) for client-side batch import and export.
- **QR Code System**: `qrcode.react` (SVG label rendering) & `html5-qrcode` (Browser camera scanning).

---

## 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Optional Supabase Configuration (Falls back to persistent local store if omitted)
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Security Note**: Never expose `SUPABASE_SERVICE_ROLE_KEY` or server secrets to client components or public repositories.

---

## 4. Main Database Entities

1. **`profiles`**: Storekeepers and system operators with institutional roles (`ADMIN`, `STOREKEEPER`, `STAFF`, `STUDENT`).
2. **`categories`**: Inventory categorization with icons, colors, and item counts.
3. **`items`**: Cataloged physical equipment, total & available quantities, condition, image URL, minimum threshold, and storage location.
4. **`people`**: Students, teachers, and staff members eligible for borrowing items.
5. **`issues` & `issue_items`**: Active/returned borrowing transactions, borrower link, expected return dates, and line items.
6. **`returns` & `return_items`**: Logged return receipts, returned quantities, item conditions, and notes.
7. **`stock_adjustments`**: Logged quantity modifications (`quantity_before`, `quantity_change`, `quantity_after`, `reason`, `notes`, `performed_by`).
8. **`audit_logs`**: Immutable audit trail (`action_type`, `details`, `performed_by`, `entity_ref`, `created_at`).

---

## 5. Main Application Routes

- `/login` - Institutional authentication
- `/dashboard` - Overview of stock, currently out items, overdue alerts, and recent activities
- `/inventory` - Catalog list with filters, QR scanner trigger, search, and sorting
- `/inventory/new` & `/inventory/[id]/edit` - Item creation and photo upload with client-side compression
- `/inventory/[id]` - Item detail page, QR code generator, printable label, stock adjustment, and timeline history
- `/issues` & `/issues/new` & `/issues/[id]` - Issue workflow & printable issue receipt
- `/returns` & `/returns/new` & `/returns/[id]` - Return workflow & printable return receipt
- `/people` & `/people/new` - Borrower management and batch Excel import with preview/validation
- `/categories` - Category management and item counts
- `/audit` - Immutably logged activity audit trail with filtering
- `/reports` - Store metrics and Excel exports
- `/settings` - Institution settings

---

## 6. How to Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
http://localhost:3000
```

---

## 7. How to Build & Deploy

```bash
# Type check TypeScript definitions
npx tsc --noEmit

# Create optimized production build
npm run build

# Start production server
npm run start
```

---

## 8. Excel Import & QR Code Behavior

- **Excel Import**: Validates columns (`Full Name`, `Admission Number`, `Role`, `Department`, `Class`, `Phone`, `Email`), prevents duplicate admission numbers, and reports skipped rows clearly.
- **QR Codes**: Encodes safe internal URLs (`/inventory/[id]`). When scanned via camera or typed into manual search, the storekeeper is immediately routed to the item page with availability metrics.
