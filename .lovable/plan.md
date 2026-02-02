

# BioReport Frontend Implementation Plan

## Overview
A privacy-first, self-hosted medical data management frontend with clean architecture, ready for Laravel API integration. The design emphasizes trust, calm aesthetics, and developer-friendly code structure.

---

## 1. Design System & Visual Identity

**Color Palette: Teal/Cyan + Light Gray**
- Primary: Teal/cyan tones for trust and calmness
- Backgrounds: Light grays and off-whites with generous whitespace
- Accents: Subtle shadows, hover states, and smooth transitions
- Typography: Clean sans-serif fonts with Latin + Cyrillic support (Inter or similar)

**UI Principles:**
- Minimal, clean interfaces with breathing room
- Soft shadows and subtle animations
- High contrast text for accessibility
- Focus states and proper ARIA labels

---

## 2. Project Architecture

**Folder Structure:**
```
src/
├── api/              # Centralized API client & services
├── components/       # Reusable UI components
│   ├── auth/         # Auth-specific components
│   ├── layout/       # Header, footer, containers
│   └── ui/           # shadcn/ui components
├── contexts/         # Auth context, user state
├── hooks/            # Custom React hooks
├── i18n/             # Internationalization setup
├── lib/              # Utilities and helpers
├── pages/            # Route components
└── types/            # TypeScript interfaces
```

**Key Patterns:**
- Centralized API client with interceptors for tokens
- React Context for auth state management
- Type-safe API responses based on OpenAPI schema
- i18n-ready text extraction from the start

---

## 3. Pages & Features

### 3.1 Landing Page
A conversion-focused page explaining BioReport's value:
- Hero section with tagline emphasizing privacy and control
- Key features section (centralized storage, historical tracking, PDF extraction)
- Trust indicators (self-hosted, open-source, no third parties)
- Call-to-action buttons: "Get Started" → Register, "Login"

### 3.2 Authentication Module
Four pages matching your API:

**Register Page**
- Email + password (min 12 chars with strength indicator)
- Clear validation feedback
- Success → redirect to Account Setup

**Login Page**
- Email + password form
- "Forgot password?" link
- Handle invalid credentials gracefully
- Success → check account status → Dashboard or Account Setup

**Forgot Password Page**
- Email input only
- Confirmation message (no user enumeration)
- Link to return to login

**Reset Password Page**
- New password fields (token from URL)
- Password confirmation
- Handle expired/invalid tokens

### 3.3 Account Setup (Onboarding)
Mandatory post-registration flow:

- **Sex selection**: Male / Female toggle buttons
- **Date of birth**: Calendar picker
- **Nickname**: Optional text field
- **Language**: 2-letter code dropdown (en, uk, de, etc.)
- **Timezone**: Searchable timezone selector

Clean, step-by-step feel with progress indication.

### 3.4 Dashboard (Mocked, Quick Actions Focus)
Welcome experience for new users with:

**Quick Actions Cards:**
- "Upload Your First Report" → placeholder modal/message
- "Complete Your Profile" → link to settings if incomplete
- "Add a Family Member" → coming soon indicator
- "Explore Your Timeline" → coming soon indicator

**Summary Stats (mocked):**
- Total Reports: 0
- Family Members: 1 (you)
- Last Activity: Today

**Empty State Messaging:**
Encouraging, friendly copy: "Your health timeline starts here. Upload your first lab report to begin tracking."

### 3.5 Internal Pages

**Profile Settings**
- View/edit: nickname, language, timezone
- Display: sex, date of birth (view-only or editable)
- Save changes with success feedback

**Security Settings**
- Change password form (current + new password)
- Active sessions list (mocked placeholder)
- 2FA section (coming soon badge)

**Account Deletion (Danger Zone)**
- Clear warning about data loss
- Confirmation input (type account email)
- Delete button with loading state
- Graceful logout on completion

---

## 4. Navigation & Layout

**Top Header Navigation:**
- Logo/brand on left
- Navigation links center-right (when logged in: Dashboard, Settings)
- User menu dropdown (profile, settings, logout)
- Responsive: hamburger menu on mobile

**Logged-out state:** Logo + Login/Register buttons
**Logged-in state:** Full nav with user context

---

## 5. API Layer Architecture

**Centralized Client:**
- Base URL configuration
- Request/response interceptors
- Token management (access + refresh)
- Automatic 401 → redirect to login
- 422 validation error parsing

**Services by Domain:**
- `authService`: login, register, logout, refresh, password reset
- `accountService`: get, create, update, delete account

**Error Handling:**
- Toast notifications for errors
- Form-level validation display
- Loading states on all async actions

---

## 6. Internationalization Readiness

- All user-facing text extracted to translation keys
- i18n library setup (react-i18next)
- Default English locale with structure for adding others
- RTL-ready layouts (future-proofing)

---

## 7. Technical Quality Standards

- **TypeScript throughout** with proper interfaces
- **No code duplication** – shared hooks and utilities
- **Clean separation of concerns** – UI components don't contain API logic
- **Accessible components** – focus management, ARIA labels
- **Responsive design** – works on mobile, optimized for desktop
- **Form validation** – using react-hook-form + zod (already installed)

---

## Summary

This implementation delivers a polished, production-ready foundation that:
- Looks professional and trustworthy from day one
- Is structured for easy backend integration
- Scales cleanly as features are added
- Demonstrates the product's core value proposition

