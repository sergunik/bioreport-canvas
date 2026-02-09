## План задачі: Auth Guard + Cookie-based Session

### Контекст

Бекенд використовує **HTTP-only cookies** для JWT (access + refresh). Фронтенд наразі зберігає токени в `localStorage` і вручну ставить `Authorization: Bearer` — це **невірно** і потребує рефакторингу. Також **відсутні route guards** — усі сторінки доступні всім.

---

### Крок 1. Прибрати `tokenManager` (localStorage) з API-клієнта

**Файли:** `src/api/client.ts`, `src/api/index.ts`

Що робити:
- Видалити `tokenManager` повністю (константи `ACCESS_TOKEN_KEY`, `REFRESH_TOKEN_KEY`, об'єкт `tokenManager`).
- Прибрати з `apiClient` логіку ручного додавання `Authorization: Bearer ...` заголовка.
- Залишити `credentials: 'include'` в кожному `fetch` — цього достатньо для відправки cookies.
- Спростити 401-handler: при 401 спробувати `POST /auth/refresh` (він теж працює через cookies). Якщо refresh не вдався — не робити `window.location.href = '/login'` (це буде обов'язком route guard, а не клієнта). Замість цього просто кидати помилку. Видалити `refreshSubscribers` механізм (або залишити якщо потрібна підтримка конкурентних запитів — на твій розсуд).
- Прибрати `skipAuth` опцію з `RequestOptions` — тепер авторизація визначається наявністю cookie, а не header.
- Прибрати експорт `tokenManager` з `src/api/index.ts`.

---

### Крок 2. Оновити `authService`

**Файл:** `src/api/services/authService.ts`

Що робити:
- Видалити всі згадки `tokenManager` (import та виклики).
- `login` — просто `api.post(...)`, без `tokenManager.setTokens(...)` (він вже закоментований, просто прибрати).
- `logout` — просто `api.post(...)`, без `tokenManager.clearTokens()`.
- Видалити метод `isAuthenticated()` (бо він залежав від localStorage). Перевірка авторизації буде через виклик API (див. крок 3).

---

### Крок 3. Оновити `AuthContext` — визначення сесії через API-виклик

**Файл:** `src/contexts/AuthContext.tsx`

Що робити:
- Видалити всі згадки `tokenManager`.
- **`initAuth` (useEffect при mount):** замість `tokenManager.hasTokens()` — одразу робити `GET /account` (або `POST /auth/refresh` спочатку). Логіка:
  1. Виконати `accountService.getAccount()`.
  2. Якщо **успішно** — user авторизований, account є → `isAuthenticated: true`, `hasCompletedSetup: true`.
  3. Якщо **401** — спробувати `authService.refresh()`, потім ще раз `accountService.getAccount()`.
  4. Якщо refresh теж дав 401 — user не авторизований → `isAuthenticated: false`.
  5. Якщо `getAccount()` успішний після refresh, але повертає 404 (account не існує) — user авторизований, але account не створений → `isAuthenticated: true`, `hasCompletedSetup: false`.
  
  **Важливо:** це забезпечить збереження сесії при перезавантаженні сторінки (cookies автоматично відправляються).
- **`login`:** після успішного `authService.login()` виконати `accountService.getAccount()` для визначення `hasCompletedSetup`. Якщо account не знайдений (404 або 401 з account) — `hasCompletedSetup: false`.
- **`logout`:** просто `authService.logout()` та `dispatch({ type: 'LOGOUT' })`.

---

### Крок 4. Створити route guard компоненти

**Новий файл:** `src/components/auth/ProtectedRoute.tsx`
**Новий файл:** `src/components/auth/GuestRoute.tsx`

**`ProtectedRoute`** — обгортка для захищених сторінок:
- Бере `isAuthenticated`, `isLoading`, `hasCompletedSetup` з `useAuth()`.
- Якщо `isLoading` — показати loading spinner (або `null`).
- Якщо `!isAuthenticated` — `<Navigate to="/login" />`.
- Якщо `isAuthenticated && !hasCompletedSetup` — `<Navigate to="/account-setup" />`.
- Інакше — рендерити `<Outlet />` (або `children`).

**`GuestRoute`** — обгортка для guest-only сторінок (`/login`, `/register`, `/forgot-password`, `/reset-password`):
- Якщо `isLoading` — loading.
- Якщо `isAuthenticated` — `<Navigate to="/dashboard" />`.
- Інакше — рендерити `<Outlet />` (або `children`).

**`AccountSetupRoute`** — обгортка для `/account-setup`:
- Якщо `isLoading` — loading.
- Якщо `!isAuthenticated` — `<Navigate to="/login" />`.
- Якщо `hasCompletedSetup` — `<Navigate to="/dashboard" />`.
- Інакше — рендерити children.

Оновити експорт в `src/components/auth/index.ts`.

---

### Крок 5. Застосувати route guards в `App.tsx`

**Файл:** `src/App.tsx`

Нова структура маршрутів:

```tsx
<Routes>
  {/* Public — always accessible */}
  <Route path="/" element={<Landing />} />
  <Route path="*" element={<NotFound />} />

  {/* Guest-only — redirect to /dashboard if authenticated */}
  <Route element={<GuestRoute />}>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
  </Route>

  {/* Account setup — auth required, no account yet */}
  <Route element={<AccountSetupRoute />}>
    <Route path="/account-setup" element={<AccountSetup />} />
  </Route>

  {/* Protected — auth + account required */}
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/diagnostic-reports" element={<DiagnosticReportsList />} />
    <Route path="/diagnostic-reports/new" element={<NewDiagnosticReport />} />
    <Route path="/settings" element={<Settings />}>
      <Route index element={<Navigate to="/settings/profile" replace />} />
      <Route path="profile" element={<ProfileSettings />} />
      <Route path="security" element={<SecuritySettings />} />
      <Route path="danger" element={<DangerZone />} />
    </Route>
  </Route>
</Routes>
```

---

### Крок 6. Прибрати зайве з компонентів сторінок

**Файли:** `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/pages/AccountSetup.tsx` та інші, що використовують `tokenManager`.

Що робити:
- Видалити прямі імпорти та виклики `tokenManager` (якщо є).
- Логіка навігації після логіну/реєстрації залишається в компонентах (наприклад, `Login` після `login()` робить `navigate('/dashboard')` або `navigate('/account-setup')` залежно від `hasCompletedSetup`).

---

### Крок 7. Класифікація маршрутів (документація в коді)

Зведена таблиця відповідності (для ясності в коді):

| Фронт-маршрут | OpenAPI endpoints | Тип | Guard |
|---|---|---|---|
| `/` | — | Public | Немає |
| `/login` | `POST /auth/login` (`security: []`) | Guest-only | `GuestRoute` |
| `/register` | `POST /auth/register` (`security: []`) | Guest-only | `GuestRoute` |
| `/forgot-password` | `POST /auth/password/forgot` (`security: []`) | Guest-only | `GuestRoute` |
| `/reset-password` | `POST /auth/password/reset` (`security: []`) | Guest-only | `GuestRoute` |
| `/account-setup` | `POST /account` (auth required) | Auth + no account | `AccountSetupRoute` |
| `/dashboard` | — (використовує auth endpoints) | Protected | `ProtectedRoute` |
| `/diagnostic-reports` | `GET /diagnostic-reports` (auth required) | Protected | `ProtectedRoute` |
| `/diagnostic-reports/new` | `POST /diagnostic-reports` (auth required) | Protected | `ProtectedRoute` |
| `/settings/*` | `GET/PATCH/DELETE /account` (auth required) | Protected | `ProtectedRoute` |
| `*` (404) | — | Public | Немає |

---

### Крок 8. Тести

**Нові тестові файли:**

1. **`src/components/auth/ProtectedRoute.test.tsx`** — тести для `ProtectedRoute`:
   - Рендерить children коли `isAuthenticated && hasCompletedSetup`.
   - Редіректить на `/login` коли `!isAuthenticated`.
   - Редіректить на `/account-setup` коли `isAuthenticated && !hasCompletedSetup`.
   - Показує loading коли `isLoading`.

2. **`src/components/auth/GuestRoute.test.tsx`** — тести для `GuestRoute`:
   - Рендерить children коли `!isAuthenticated`.
   - Редіректить на `/dashboard` коли `isAuthenticated`.
   - Показує loading коли `isLoading`.

3. **`src/components/auth/AccountSetupRoute.test.tsx`** — тести для `AccountSetupRoute`:
   - Рендерить children коли `isAuthenticated && !hasCompletedSetup`.
   - Редіректить на `/login` коли `!isAuthenticated`.
   - Редіректить на `/dashboard` коли `hasCompletedSetup`.

4. **`src/contexts/AuthContext.test.tsx`** — тести для `AuthProvider`:
   - `initAuth`: успішний `getAccount()` → `isAuthenticated: true`, `hasCompletedSetup: true`.
   - `initAuth`: 401 → refresh → retry → success.
   - `initAuth`: 401 → refresh → fail → `isAuthenticated: false`.
   - `login` → встановлює user + account.
   - `logout` → скидає state.

5. **`src/api/client.test.ts`** — тести для оновленого API-клієнта:
   - Запити включають `credentials: 'include'`.
   - Не ставить `Authorization` header.
   - 401 → retry після refresh.
   - 401 → refresh fail → кидає error (без redirect).

### Крок 9. Документація
Видалити поточний вміст файлу README.md і наповнити його поточною та актуальною інформацією про проект.

---

### Порядок виконання

1. Крок 1 + Крок 2 (API-клієнт та authService) — прибрати localStorage
2. Крок 3 (AuthContext) — cookie-based session detection
3. Крок 4 (Route guards) — нові компоненти
4. Крок 5 (App.tsx) — застосувати guards
5. Крок 6 — cleanup в сторінках
6. Крок 8 — тести
7. Крок 9 — документація
8. Фінальна перевірка: `npm run lint`, `npm run test`, `npm run build`