# AGENTS.md

## Project

This repository contains the **Fox & Owl Student Tracker System**.

The system has two separate frontend applications:

- `admin` — private teacher/admin interface
- `tracker` — public read-only student progress page

Both applications use the same Firebase project and the same Cloud Firestore database.

Read `PROJECT_SPEC.md` before making architectural or Firebase-related changes.

---

## Implementation order

Work in phases.

### Phase 1 — Admin application

Implement and fully test the Admin application first.

Do NOT start implementing the Tracker application until the Admin MVP works correctly with Firebase.

Admin MVP must support:

1. Admin login/logout
2. Reading students from Firestore
3. Adding students
4. Editing students
5. Deactivating students
6. Recording lessons
7. Automatically calculating lesson coins
8. Updating student progress after a lesson
9. Recording coin transactions
10. Adding/editing/deleting payments
11. Calculating monthly income
12. Dashboard summary

After Phase 1 works and passes build/tests, stop and report completion.

### Phase 2 — Student Tracker

Implement only after Phase 1 is approved.

---

## Technology

Use:

- React
- Vite
- JavaScript
- Firebase JavaScript modular SDK
- Firebase Authentication
- Cloud Firestore
- CSS or CSS Modules

Avoid adding unnecessary frameworks.

Do not add a backend server unless explicitly requested.

---

## Firebase

Firebase is already configured manually by the project owner.

Do NOT:

- create a new Firebase project
- create a new Firestore database
- rename Firestore collections
- change Firestore Security Rules unless explicitly asked
- introduce Firebase Hosting
- introduce Firebase Functions unless explicitly requested

Use the existing Firebase project.

Firebase configuration must be read from environment variables.

Create `.env.example` files but never put the owner's real Firebase configuration into committed example files.

---

## Existing Firestore collections

The following collections already exist:

- `admins`
- `students`
- `lessonRecords`
- `payments`
- `coinTransactions`

Do not introduce `rewards`, `shop`, `redemptions`, or any store-related collections.

There is NO reward shop in this product.

---

## Security model

### Admin

Admin uses Firebase Authentication with email/password.

After authentication, verify that:

`admins/{currentUser.uid}`

exists.

Only then allow access to the Admin UI.

### Tracker

The Tracker has NO authentication.

It is public and read-only.

It may read only student progress intended for public display.

Never expose:

- payments
- lesson history
- admin information
- private notes
- email addresses
- parent contact information

---

## Coding rules

- Keep Firebase logic in dedicated service modules.
- Do not put Firestore queries directly throughout React components.
- Keep UI components small and reusable.
- Use clear descriptive filenames.
- Avoid duplicated business logic.
- Handle loading states.
- Handle Firebase errors visibly.
- Confirm destructive operations.
- Do not silently ignore failed Firebase writes.
- Use Firestore transactions or atomic operations when several related records must change together.
- Avoid hard-coded student IDs.
- Use Firestore document IDs as relational IDs.

---

## Data integrity

Student names are editable.

Never use the student name as the primary identifier.

Always use the Firestore student document ID.

A student's Firestore document ID must remain unchanged when their name or avatar changes.

---

## Validation

Before considering a phase complete:

1. Run the development app.
2. Run the production build.
3. Fix console errors.
4. Verify Firebase reads and writes.
5. Verify authentication.
6. Verify failed operations display useful errors.
7. Review the final diff for accidental changes.
8. Do not modify unrelated files.

---

## UX

The owner is not a developer.

The application must be simple and understandable without technical knowledge.

Prefer:

- clear Russian labels
- large action buttons
- obvious confirmation messages
- simple forms
- minimal manual data entry

Do not expose Firestore IDs or technical Firebase terminology in the visible UI.

All end-user interface text should be in Russian unless explicitly requested otherwise.
