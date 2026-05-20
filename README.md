# 📚 Limpopo Extra Lessons - Learner Portal

A full-stack, mobile-responsive learning platform for Grade 10-12 students in Limpopo. Built with React, Supabase, and deployed on Netlify.

🌐 **Live Demo**: https://gleaming-mochi-bf5c6d.netlify.app/

---

## ✨ Features

### 👨‍🎓 For Students
- 🔐 Secure registration & login with email verification
- 📖 Browse/download subject notes (PDF) filtered by grade & subject
- 📝 Submit assignments with PDF upload
- ⏰ View assignment deadlines + status badges:
  - ✅ Submitted on time
  - ⚠️ Submitted late
  - ❌ Missing (past due)
  - ⏳ Open (not yet submitted)
- 🏆 View graded marks + progress tracker per subject
- 📱 Fully responsive mobile UI with sticky header & touch-friendly buttons

### 👨‍🏫 For Admins (Teachers)
- 📤 Upload notes & assignments with due dates
- 🗑️ Manage content: view, download, delete
- 📊 Real-time analytics:
  - Total registered learners
  - Most enrolled subject
  - Subject distribution breakdown
- 📝 Grade submissions with student names + enrolled subjects visible
- 🔧 Fix student profiles via UI (no SQL needed)
- 👥 View all submissions in one dashboard

### 🔐 Security & Reliability
- Supabase Auth with secure password hashing
- Role-based access control (student vs admin routing)
- Environment variables for sensitive config
- Auto-profile creation on signup (grade, subjects, role)
- Persistent sessions across page refreshes

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **Backend** | Supabase (Auth, PostgreSQL, Storage) |
| **Deployment** | Netlify (drag-and-drop or Git auto-deploy) |
| **State** | React Context + Hooks |
| **Routing** | React Router v6 |
| **Styling** | Tailwind CSS (mobile-first, responsive) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (`node -v`)
- npm or yarn
- Supabase account (free tier)
- Netlify account (free tier)

### 1️⃣ Clone & Install
```bash
git clone https://github.com/24010696/learner-Portal.git
cd learner-portal
npm install
