# 🎯 Goal & Health Tracker

A premium, state-of-the-art Goal and Health Tracker built with React, Vite, TypeScript, and Tailwind CSS. This application helps you keep track of daily habits, weekly gym schedules, water intake, calories, sleep, and personal records for weightlifting, all locally stored and fully private in your browser.

## ✨ Features

- **📊 Dashboard**: High-level overview of daily goals progress, gym schedule, calories, protein, water, and sleep.
- **🎯 Daily Goals**: Custom goal configuration (reading, steps, etc.) with completion rings.
- **📅 Weekly Schedule**: Interactive planner for your weekly workouts and routines.
- **💧 Health Tracker**: Easy logging for water, calories, protein, and sleep with progress visualizations and 7-day history charts.
- **🏋️ Lift Tracker**: Log workouts, estimate 1RM (One Rep Max) using Epley's formula, view history charts, and track personal records (PRs).
- **⚙️ Settings**: Personalize your profile, select weight units (kg/lbs), adjust daily targets, and manage your data.
- **🔒 Privacy First**: All data is saved directly in your browser's local storage—no sign-up or remote servers required.

## 🛠️ Tech Stack

- **Frontend Core**: React 19, TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion (animations), Lucide React (icons)
- **Charts**: Recharts
- **State & Utils**: Tanstack React Query, Zod, date-fns, Sonner (toasts)
- **Build System**: Vite v6

## 🚀 Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd goal-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

### Commands

- **Development Server**: `npm run dev`
- **Build Project**: `npm run build`
- **Preview Build**: `npm run serve`
- **TypeScript Check**: `npm run typecheck`

## ☁️ Deployment (Vercel)

This project is configured to run out-of-the-box on Vercel:

1. Import your GitHub repository to Vercel.
2. The project will automatically be recognized as a **Vite** application.
3. Configure the following if not detected:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
4. Click **Deploy**!
