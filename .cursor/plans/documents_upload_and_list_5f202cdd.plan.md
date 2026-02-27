---
name: Documents Upload and List
overview: "Add a minimal document upload and list module: new routes `/documents` and `/documents/upload`, Dashboard entry points (Quick Action + Summary stat), API types and document service, upload page with DnD, and document list table with status badges—aligned with existing design and OpenAPI."
todos: []
isProject: false
---

# Document Upload and List Module — Development Plan

## 1. API layer (OpenAPI-aligned)

**Types** — Add to [src/types/api.ts](src/types/api.ts):

- `DocumentResource`: `uuid`, `file_size_bytes`, `mime_type`, `processed_at`, `created_at`, `updated_at`, `job_status` (string | null). OpenAPI does not expose `file_name`; display **uuid** in the “File name” column as specified.
- `DocumentListResponse`: `{ data: DocumentResource[] }`.
- `DocumentStoreResponse`: `{ uuid: string }` (POST response).

**Client** — [src/api/client.ts](src/api/client.ts):

- Add `postForm(endpoint, formData)` (or equivalent) for multipart upload: do **not** set `Content-Type` so the browser sets `multipart/form-data` with boundary. Keep `Accept: application/json` and existing auth/refresh behaviour.

**Service** — New file `src/api/services/documentService.ts`:

- `list()`: `GET /documents` → `DocumentListResponse`.
- `upload(file: File)`: build `FormData` with key `file`, call `postForm('/documents', formData)` → `DocumentStoreResponse`.
- Export from [src/api/index.ts](src/api/index.ts).

---

## 2. Routes and layout

**Routes** — [src/App.tsx](src/App.tsx) (inside `ProtectedRoute`):

- `/documents` → document list page.
- `/documents/upload` → upload page.

Lazy-load or direct import of new page components, consistent with existing pages.

---

## 3. Dashboard changes

**Quick Actions** — [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx):

- Add a **Quick Action** card: “Upload document” (reuse existing `QuickActionCard` style), `onClick` → `navigate('/documents/upload')`. Use an icon consistent with the rest (e.g. `Upload` or `FileUp` from `lucide-react`).

**Summary** — Same file:

- Replace the “Total Reports” **StatCard** with **“Total uploaded documents”**.
- Make this stat **clickable**: click → `navigate('/documents')`.
- Value: from `documentService.list()` via `useQuery`; display `data?.data?.length ?? 0` (no extra count endpoint).

**i18n** — [src/i18n/locales/en.json](src/i18n/locales/en.json):

- Add `dashboard.quickActions.uploadDocument.title` and `.description`.
- Add `dashboard.stats.totalUploadedDocuments` (replacing or alongside `totalReports` for this card).

---

## 4. Upload page (`/documents/upload`)

**New page** — `src/pages/DocumentUpload.tsx` (or `DocumentsUpload.tsx`):

- **Layout**: Same as other app pages: `MainLayout` + `PageContainer` (e.g. `size="xl"`), single-focus content.
- **UI**:
  - Centred **drag-and-drop zone** (large, clear target):
    - Icon (e.g. document/upload icon).
    - Text: “Drop your PDF here”.
    - Subtext: “Only application/pdf • Max size 10MB”.
  - **“Select file”** button as alternative to DnD.
- **Validation** (client-only, no backend rules change):
  - MIME: `application/pdf`.
  - Max size: 10 MB (`10 * 1024 * 1024` bytes).
  - On error: show message (e.g. toast or inline) and do not submit.
- **Submit**: On valid file (drop or select) → call `documentService.upload(file)`; on success → `navigate('/documents')`; on `ApiClientError` (e.g. 422) → show error (toast / inline) per project error-handling rules.
- **State**: Disable zone/button while upload in progress; optional minimal “uploading” state.

**i18n**: Keys for title, drop text, subtext, “Select file”, validation messages, errors.

---

## 5. Document list page (`/documents`)

**New page** — `src/pages/DocumentsList.tsx` (or `DocumentList.tsx`):

- **Layout**: Same as [DiagnosticReportsList](src/pages/DiagnosticReportsList.tsx): `MainLayout`, `PageContainer`, header (title + short description). No “New” button on this page (upload is from Dashboard).
- **Data**: `useQuery(['documents'], () => documentService.list())`. Use `data?.data ?? []`.
- **Presentation**: Reuse the **same visual style** as the app (cards, spacing, typography). Use the existing **Table** from [src/components/ui/table.tsx](src/components/ui/table.tsx) inside a `Card` for a clean, consistent look.
- **Columns**:
  - **File name**: display `uuid` (e.g. truncated or full, no link).
  - **Created at**: `created_at` formatted like existing dates (e.g. `toLocaleDateString` / existing `formatDate` pattern).
  - **File size**: `file_size_bytes` converted to MB (e.g. `(bytes / (1024 * 1024)).toFixed(2) + ' MB'`).
  - **Status**: `job_status` with **Badge** — map `pending` / `processing` / `done` / `failed` to existing [Badge](src/components/ui/badge.tsx) variants (e.g. `secondary`, `default`, `default`, `destructive`).
- **Behaviour**:
  - Row click: **no** navigation or action.
  - No search, pagination, sort, auto-refresh, websocket, or polling; user refreshes the page to see updates.

**Empty / loading / error**: Same patterns as DiagnosticReportsList (loading state, error card, empty state with short message).

**i18n**: Keys for page title, description, column headers, status labels, empty/error messages.

---

## 6. Status and scalability (no extra work in this phase)

- **State model** (display only): `pending → processing → done` or `failed`. Shown only via Badge; no extra indicators.
- **Domain**: Treat “document” as the **UploadedDocument** entity (raw input); no conversion, preview, or relations in this phase. Structure allows later: convert to DiagnosticReport/Prescription, attachments, pagination, filters, multi-upload, real-time updates.

---

## 7. File and dependency summary


| Area        | Action                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| Types       | Add document types in `src/types/api.ts`                                                                           |
| Client      | Add multipart helper in `src/api/client.ts`                                                                        |
| Service     | New `src/api/services/documentService.ts`; export in `src/api/index.ts`                                            |
| Routes      | Register `/documents` and `/documents/upload` in `App.tsx`                                                         |
| Dashboard   | New Quick Action card; replace one Summary stat with “Total uploaded documents” (clickable, count from list); i18n |
| Upload page | New `src/pages/DocumentUpload.tsx`; i18n                                                                           |
| List page   | New `src/pages/DocumentsList.tsx` with Table + Badge; i18n                                                         |


---

## 8. Test coverage

Properly cover new logic with tests.

## 9. Verification (after implementation)

- Run build, lint, and tests via `docker-compose exec app` as per project rules.
- Manually: upload PDF from Dashboard → redirect to list; open list from Summary; confirm table and status badges; validate file type/size on upload and error handling.

