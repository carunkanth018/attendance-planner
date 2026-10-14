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
- npm, included with Node.js.
- Git installed.
- A code editor such as VS Code or Antigravity.

### 1. Clone the repository

```bash
git clone https://github.com/carunkantho018/attendance-planner.git
```

### 2. Open the project

```bash
cd attendance-planner
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Open the local URL shown in your terminal, usually:

```text
http://localhost:5173
```

### 5. Build for production

```bash
npm run build
```

Vite generates the production build in the `dist` directory.

To preview the production build locally:

```bash
npm run preview
```

---

## 🧮 How Attendance Forecasting Works

The planner uses the student's recorded attendance as the baseline and projects future attendance using scheduled periods and planned daily statuses.

The basic attendance formula is:

\[
\text{Attendance \%} =
\frac{\text{Attended Periods}}{\text{Total Periods}} \times 100
\]

Future attendance is calculated according to the selected status:

| Planned status | Effect on projected attendance |
|---|---|
| Attend | Adds scheduled periods to attended and total counts |
| Leave | Adds scheduled periods to total counts only |
| Partial attendance | Adds all scheduled periods to total and only attended periods to the attended count |
| Holiday / No classes | Adds zero periods to both counts |

Recovery estimates use the configured timetable and remaining teaching dates. These are projections based on the saved inputs and planned statuses, not guarantees of actual attendance or institutional eligibility.

---

## 🎨 Design Philosophy

The interface follows a minimal, high-contrast design system:

- Pure-black background.
- Emerald-green accents for actions and positive states.
- White primary text and muted secondary text.
- Subtle borders and carefully spaced cards.
- Responsive layouts designed for mobile usability.
- Clear visual distinctions between attendance statuses.

The focus is on helping students understand their attendance position and make informed decisions without navigating a cluttered interface.

---

## 🌐 Deployment

The application can be built for deployment on platforms such as [Vercel](https://vercel.com/).

For a typical Vite project:

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Output directory:** `dist`

Connect the GitHub repository to Vercel to enable automatic deployments when changes are pushed to the configured production branch.

---

## ⚠️ Important Notes

- Attendance estimates depend on the accuracy of the student's baseline, timetable, semester dates, and planned statuses.
- Semester dates should be verified against the student's official college academic calendar.
- Browser-stored information is generally specific to the browser and device; it is not automatically synchronized across devices.
- This is a student planning utility, not an official attendance record or institutional attendance system.

---

## 🔮 Future Improvements

Potential enhancements include:

- Google Calendar integration for importing scheduled classes.
- Attendance data export and import.
- Semester history and comparisons.
- Additional attendance scenarios and recovery simulations.
- Further mobile interaction and performance improvements.

These are potential future enhancements and are not claimed as implemented features.

---

## 👨‍💻 Author

**Arun Kanth Chowdivada**

B.Tech Computer Science Engineering Student

GitHub: [@carunkantho018](https://github.com/carunkantho018)

---

*Built to make attendance planning easier, clearer, and more predictable.*
