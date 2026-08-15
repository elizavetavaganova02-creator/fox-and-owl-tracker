# Fox & Owl Student Tracker — Project Specification

## 1. Product overview

Create a small education management system consisting of two frontend websites that share one Firebase database.

### Application A — Admin

Private teacher interface.

The teacher manages:

- students
- attendance
- homework status
- lesson activity
- lesson coins
- payments
- monthly income
- student progress

### Application B — Student Tracker

Public page with no student login.

All students appear on one shared page.

Maximum expected number of students: approximately 20.

The Tracker is visual, child-friendly and gamified.

The Tracker must NEVER display payment information or other private administrative data.

---

# 2. Repository structure

Use the following structure:

```text
fox-owl-system/
│
├── AGENTS.md
├── PROJECT_SPEC.md
│
├── admin/
│   ├── src/
│   ├── public/
│   ├── .env.local
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
└── tracker/
    ├── src/
    ├── public/
    ├── .env.local
    ├── .env.example
    ├── package.json
    └── vite.config.js
```

Admin and Tracker are two independent Vite applications.

They use the same Firebase project but may use their separately registered Firebase Web App configurations.

---

# 3. Firebase

Firebase project already exists.

Do not create another project.

Two Firebase Web Apps already exist:

1. Fox Owl Admin
2. Fox Owl Tracker

The owner will provide Firebase configuration values separately.

Use environment variables.

Example:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Create Firebase initialization in a dedicated file.

Example structure:

```text
src/
└── firebase/
    ├── config.js
    ├── auth.js
    └── firestore.js
```

Use Firebase modular SDK.

---

# 4. Existing Firestore schema

## 4.1 `admins`

Path:

```text
admins/{uid}
```

Example:

```json
{
  "role": "admin"
}
```

The document ID is the Firebase Authentication UID.

Admin access requires:

1. authenticated Firebase user
2. matching document in `admins`

---

# 4.2 `students`

Path:

```text
students/{studentId}
```

Existing structure:

```json
{
  "name": "Emma",
  "avatar": "fox",
  "coinsBalance": 0,
  "coinsEarnedTotal": 0,
  "lessonsCompleted": 0,
  "streak": 0,
  "active": true,
  "sortOrder": 1
}
```

Types:

```text
name                string
avatar              string
coinsBalance        integer
coinsEarnedTotal    integer
lessonsCompleted    integer
streak              integer
active              boolean
sortOrder           integer
```

Student names are editable.

Do not use names as references.

Always use `studentId`.

---

# 4.3 `lessonRecords`

Path:

```text
lessonRecords/{lessonId}
```

Structure:

```json
{
  "studentId": "FIRESTORE_STUDENT_ID",
  "date": "Firestore Timestamp",
  "attended": true,
  "homework": true,
  "activity": true,
  "coins": 15,
  "note": ""
}
```

Types:

```text
studentId   string
date        timestamp
attended    boolean
homework    boolean
activity    boolean
coins       integer
note        string
```

---

# 4.4 `payments`

Path:

```text
payments/{paymentId}
```

Structure:

```json
{
  "studentId": "FIRESTORE_STUDENT_ID",
  "amount": 160,
  "currency": "USD",
  "paidAt": "Firestore Timestamp",
  "monthKey": "2026-08",
  "note": ""
}
```

`monthKey` format:

```text
YYYY-MM
```

Example:

```text
2026-08
```

This field is used for monthly income calculations.

When creating a payment from the Admin interface, generate `monthKey` automatically from `paidAt`.

The teacher should not have to type it manually.

---

# 4.5 `coinTransactions`

Path:

```text
coinTransactions/{transactionId}
```

Structure:

```json
{
  "studentId": "FIRESTORE_STUDENT_ID",
  "amount": 15,
  "type": "lesson",
  "description": "Lesson reward",
  "createdAt": "Firestore Timestamp"
}
```

The system must preserve coin history instead of storing only the current balance.

---

# 5. Existing Firestore access model

Existing Firestore rules already implement the intended access model.

Conceptually:

### Public users

Can read:

```text
students
```

Cannot write anything.

Cannot read:

```text
admins
lessonRecords
payments
coinTransactions
```

### Admin

Authenticated admin can read/write:

```text
students
lessonRecords
payments
coinTransactions
```

Do not weaken these rules.

---

# 6. PHASE 1 — Admin application

Implement this application first.

Do not implement Tracker yet.

---

# 7. Admin authentication

Create a `/login` screen.

Fields:

- Email
- Password

Button:

```text
Войти
```

Use Firebase Authentication email/password.

After successful Firebase authentication:

1. get `currentUser.uid`
2. check Firestore document:

```text
admins/{uid}
```

3. only allow the Admin application if that document exists

If authenticated Firebase user is not an admin:

- sign them out
- display an access denied message

Provide:

```text
Выйти
```

button in the Admin interface.

Persist authenticated session using Firebase's standard authentication behavior.

---

# 8. Admin navigation

Desktop-first interface.

Sidebar:

```text
Сегодня
Ученики
Уроки
Оплаты
Монеты
Статистика
```

Do not include a reward shop.

---

# 9. Admin visual direction

Use the Fox & Owl design language.

Admin should remain professional and easy to scan.

Style:

- warm light background
- white cards
- rounded corners
- soft shadows
- orange accent
- blue accent
- clean typography
- occasional fox/owl mascot illustrations
- no excessive animation

Do not make the Admin interface look like a children's game.

The playful style should be subtle.

---

# 10. Admin Dashboard — "Сегодня"

Create dashboard cards.

Minimum cards:

### Доход за месяц

Calculate:

```text
SUM(payments.amount)
```

for the selected `monthKey`.

Example:

```text
Доход августа
$2,450
```

### Активные ученики

Count:

```text
students where active == true
```

### Уроков за месяц

Count lesson records for selected month.

### Монет начислено

Sum positive lesson coin transactions for selected month.

---

# 11. Today's lesson section

Dashboard should have a simple area for quickly recording a lesson.

The teacher must not need to edit Firebase manually.

Workflow:

```text
Выбрать ученика
→ выбрать дату
→ отметить посещение
→ отметить домашнее задание
→ отметить активность
→ система показывает количество монет
→ Сохранить
```

---

# 12. Coin calculation

Each category gives 5 coins.

Formula:

```text
attendance = 5
homework   = 5
activity   = 5
```

Calculation:

```js
coins =
  (attended ? 5 : 0) +
  (homework ? 5 : 0) +
  (activity ? 5 : 0)
```

Possible values:

```text
0
5
10
15
```

The UI must calculate this automatically.

The teacher must not manually calculate the result.

Allow an optional manual bonus only if later explicitly requested.

Do not implement bonus coins in MVP.

---

# 13. Saving a lesson

Saving a lesson is one logical operation.

When the teacher presses:

```text
Сохранить урок
```

the application must:

1. create `lessonRecords/{lessonId}`
2. calculate coins
3. update the related student
4. increment `coinsBalance`
5. increment `coinsEarnedTotal`
6. increment `lessonsCompleted` when appropriate
7. create a `coinTransactions` record if coins > 0

Use a Firestore transaction or appropriate atomic operation so partial writes do not leave inconsistent data.

---

# 14. `lessonsCompleted`

Interpret this field as lessons actually completed/attended by the student.

Therefore:

```text
attended == true
```

increments:

```text
lessonsCompleted + 1
```

An absence does not increment lessons completed.

---

# 15. Editing a lesson

Lesson records must be editable.

This is important.

Example:

Original:

```text
attended: true
homework: true
activity: true
coins: 15
```

Teacher later changes homework:

```text
homework: false
```

New result:

```text
coins: 10
```

The application must calculate the difference:

```text
10 - 15 = -5
```

and adjust the student balance correctly.

Do not simply add the new value again.

Also handle attendance changes correctly:

```text
true → false
```

must decrease `lessonsCompleted` by 1.

```text
false → true
```

must increase it by 1.

Never allow balances or lesson totals to become incorrect after editing.

---

# 16. Coin transaction linkage

For all NEW lesson operations created by the application, link the lesson record to its coin transaction.

Preferred implementation:

Use the same Firestore ID for:

```text
lessonRecords/{lessonId}
```

and:

```text
coinTransactions/{lessonId}
```

when the transaction type is `lesson`.

This makes lesson edits reliable.

Existing manually created test data does not need migration during initial implementation.

---

# 17. Students page

Create:

```text
Ученики
```

Show student cards/table.

Columns/details:

- avatar
- name
- current coin balance
- total earned coins
- lessons completed
- streak
- active status

Actions:

```text
Редактировать
Скрыть / Активировать
```

Avoid permanent deletion by default.

Use:

```text
active = false
```

for students who are no longer active.

This preserves payment and lesson history.

---

# 18. Add student

Button:

```text
+ Добавить ученика
```

Form:

```text
Имя
Аватар
Начальные монеты
```

Defaults:

```text
coinsBalance = 0
coinsEarnedTotal = 0
lessonsCompleted = 0
streak = 0
active = true
```

Automatically calculate:

```text
sortOrder = current maximum + 1
```

Teacher must not manually enter `sortOrder`.

---

# 19. Edit student

Allow editing:

```text
name
avatar
active
sortOrder
```

Optionally allow manual correction of coin balance from a dedicated administrative action later.

Do not casually expose direct editing of totals in the normal student form.

Changing the student's name must never change their Firestore Document ID.

---

# 20. Avatar values

For MVP support simple avatar IDs such as:

```text
fox
owl
panda
rabbit
cat
dog
penguin
bear
hedgehog
raccoon
elephant
tiger
```

Create a central avatar mapping file.

Example:

```js
const avatars = {
  fox: "...",
  owl: "...",
};
```

Do not scatter avatar definitions through components.

If final custom images are not available yet, use clean placeholders.

---

# 21. Lessons page

Create:

```text
Уроки
```

Show lesson history.

Fields:

```text
Дата
Ученик
Посещение
ДЗ
Активность
Монеты
Заметка
```

Filters:

```text
по ученику
по месяцу
```

Actions:

```text
Редактировать
```

Deleting a lesson should require explicit confirmation.

If deleting a lesson, correctly reverse:

- student coins
- earned total
- lesson completed count
- associated coin transaction

Use an atomic transaction.

---

# 22. Payments page

Create:

```text
Оплаты
```

Show:

```text
Дата
Ученик
Сумма
Валюта
Комментарий
```

Actions:

```text
+ Добавить оплату
Редактировать
Удалить
```

Adding payment form:

```text
Ученик
Сумма
Валюта
Дата
Комментарий
```

Generate `monthKey` automatically.

---

# 23. Monthly income

At the top of Payments page show:

```text
Доход за месяц
```

Provide month selector.

Example:

```text
Август 2026
```

Calculate total only from Firestore payment records.

Never store a manually maintained monthly total.

The displayed income must always be derived from payment data.

---

# 24. Coin history page

Create:

```text
Монеты
```

Allow selection of a student.

Show chronological history:

```text
13 августа
+15
Урок

8 августа
+10
Урок
```

Current balance should come from:

```text
students.coinsBalance
```

History should come from:

```text
coinTransactions
```

---

# 25. Statistics

For MVP include:

- active students
- lessons this month
- monthly income
- total coins issued during selected month
- average attendance percentage where feasible

Avoid adding complicated analytics before basic CRUD is stable.

---

# 26. Loading and errors

All Firebase operations must have:

- loading state
- success feedback
- error feedback

Examples:

```text
Сохраняем...
Урок сохранён
Не удалось сохранить урок
```

Never leave the teacher wondering whether a button worked.

---

# 27. Confirmation dialogs

Require confirmation before:

- deleting payment
- deleting lesson
- deactivating student if appropriate

Example:

```text
Удалить этот урок?

Монеты и статистика ученика будут пересчитаны.

Отмена
Удалить
```

---

# 28. Responsive behavior

Admin is primarily desktop-oriented.

Optimize first for:

```text
1280px+
```

It should remain usable on tablets.

Mobile Admin optimization is secondary.

---

# 29. PHASE 1 completion criteria

Admin MVP is complete only when all of the following work against the real Firebase project:

- [ ] Admin can log in
- [ ] Non-admin cannot access Admin UI
- [ ] Admin can log out
- [ ] Emma and Alice load from Firestore
- [ ] Admin can add a student
- [ ] New student appears in Firestore
- [ ] Admin can edit a student name
- [ ] Admin can deactivate a student
- [ ] Admin can create a lesson
- [ ] Coins are calculated automatically
- [ ] Student coin balance changes correctly
- [ ] `coinsEarnedTotal` changes correctly
- [ ] `lessonsCompleted` changes correctly
- [ ] Coin transaction is created
- [ ] Lesson can be edited without double-counting coins
- [ ] Lesson can be removed with totals restored
- [ ] Payment can be created
- [ ] Payment can be edited
- [ ] Payment can be removed
- [ ] Monthly income recalculates correctly
- [ ] Production build succeeds
- [ ] Browser console has no important errors

After completing these items:

STOP.

Do not implement Tracker until the owner reviews the Admin.

---

# 30. PHASE 2 — Student Tracker specification

Do not implement during Phase 1.

Keep this section as architectural context.

---

# 31. Tracker purpose

Public shared page.

NO individual student accounts.

NO login.

All students appear on the same page.

Designed for no more than approximately 20 students.

---

# 32. Tracker data

Tracker reads:

```text
students
```

Only display students where:

```text
active == true
```

Order by:

```text
sortOrder
```

Use real-time Firestore updates if practical.

---

# 33. Tracker student card

Each student card should display:

```text
avatar
name
coinsBalance
lessonsCompleted
streak
```

Never display:

```text
payments
email
parent data
private notes
lesson notes
admin information
```

---

# 34. Tracker header

Show a friendly group header.

Example:

```text
Трекер учеников
Вместе учимся, растём и достигаем целей!
```

Summary cards may include:

```text
Ученики
Уроков пройдено
Монет заработано
```

Do NOT include a store.

---

# 35. Tracker design

Style should match the established Fox & Owl world.

Visual direction:

- bright blue sky
- soft clouds
- floating islands
- cute 3D-style fox and owl mascots
- rounded cards
- colorful animal avatars
- playful coin icons
- child-friendly but polished

The student grid remains the main focus.

Do not make it difficult to compare students.

---

# 36. Tracker interaction

Tracker is read-only.

No student should be able to:

- change their name
- change coins
- add lessons
- change progress
- access payments

All edits happen through Admin.

---

# 37. Shared data flow

Expected flow:

```text
ADMIN
    ↓
teacher makes change
    ↓
FIRESTORE
    ↓
TRACKER
    ↓
updated public progress
```

Examples:

```text
Admin adds Max
→ Max appears on Tracker
```

```text
Admin records Emma's +15 coin lesson
→ Emma's Tracker balance updates
```

```text
Admin renames Emma to Emily
→ Tracker shows Emily
```

The Firestore Document ID remains unchanged.

---

# 38. Deployment

Do not deploy during initial development unless explicitly requested.

Eventually both applications will be hosted using GitHub/GitHub Pages.

Keep build configuration compatible with static hosting.

Do not introduce server-only dependencies.

---

# 39. Out of scope

Do NOT implement unless explicitly requested later:

- reward store
- online payments
- Stripe
- student authentication
- parent authentication
- chat
- email system
- Firebase Hosting
- Firebase Functions
- complex permissions
- multiple teachers
- school management system
- subscription billing
- homework file uploads

---

# 40. First implementation objective

The first concrete milestone is:

> Launch the Admin app locally, sign in as the existing Firebase admin, and display the existing Emma and Alice records from Firestore.

Do not build the entire application in one step.

Implement incrementally and verify Firebase behavior after each major feature.
