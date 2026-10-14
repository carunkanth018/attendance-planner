Smart Attendance Prediction · Recovery Planning · Semester Tracking

A mobile-first attendance planning web application that helps students understand their current attendance, plan future absences, and estimate whether they can reach their required attendance target before the semester's teaching period ends.

Built with **React, TypeScript, and Vite**, the application combines attendance calculations, semester-aware forecasting, and an interactive daily attendance timeline in a clean, premium black interface.

---

## ✨ Features

### 📊 Attendance Overview
- Calculate current attendance percentage from attended and total periods.
- View attended periods, total periods, missed periods, and target attendance.
- Track progress toward the required attendance threshold.

### 🎯 Attendance Recovery Plan
- Calculate the additional periods required to reach an attendance target.
- Estimate the number of class days needed using the configured timetable.
- Display the expected recovery date when achievable.
- Identify period and class-day shortfalls when the target may not be reachable before teaching ends.
- Project attendance at the end of the teaching period.

### 📅 Semester-Aware Forecasting
- Configure semester commencement, last teaching day, and semester end date.
- Track calendar days and teaching days remaining.
- Account for the weekly timetable and holidays when calculating future attendance.
- Keep teaching days separate from examination and preparation periods.

### 🗓️ Daily Attendance Forecast
- View projected attendance chronologically, one date at a time.
- Plan future attendance, leave, partial attendance, and holidays.
- Recalculate subsequent attendance projections when a planned status changes.
- Distinguish normal class days, planned leave, and holidays through clear status indicators.

### 📱 Mobile-First Experience
- Responsive layouts for mobile phones, tablets, and desktop screens.
- Touch-friendly attendance controls and swipe interactions.
- Compact attendance cards and readable daily forecasts.
- Premium black theme with emerald-green accents.

### 💾 Attendance Planning and Persistence
- Edit attendance baseline values and target percentages.
- Save timetable and semester settings using the application's existing storage mechanism.
- Retain supported planning preferences between visits on the same browser and device.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | Component-based user interface |
| TypeScript | Type-safe application development |
| Vite | Development server and production build |
| CSS | Responsive styling and UI design |
| Browser storage | Persist supported settings and planning data |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed.
-
