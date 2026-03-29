<div align="center">

# 💸 ReimburseFlow

### Enterprise-Grade Reimbursement Management System

An intelligent, full-stack expense reimbursement platform with OCR scanning, multi-level approval workflows, real-time notifications, and cinematic data visualizations.

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org)

</div>

---

## ✨ Features

### 🏢 Core Functionality
- **Expense Submission** — Create, edit, and submit reimbursement requests with receipt uploads
- **Multi-Level Approval Workflows** — Role-based approval chains (Employee → Manager → Admin)
- **OCR Receipt Scanning** — Automatic data extraction from receipts using Tesseract.js
- **Real-Time Notifications** — Socket.io powered live updates for approvals and status changes

### 📊 Advanced Analytics & Visualizations
- **Interactive Dashboard** — KPI cards, trend charts, and category breakdowns via Recharts
- **3D Expense Timeline** — Immersive timeline built with React Three Fiber & Three.js
- **Approval Flow Sankey Diagram** — Animated flow visualization of approval pipelines
- **GitHub-Style Heatmap Calendar** — Activity heatmap showing daily expense patterns

### 🎨 Premium UI/UX
- **Cinematic Loader** — GSAP-powered startup animation with particle effects
- **Dark/Light Mode** — Seamless theme switching with system preference detection
- **Framer Motion Transitions** — Page transitions and micro-animations throughout
- **Glassmorphism Design** — Modern card designs with backdrop blur and gradients
- **Context-Aware Empty States** — Lottie-animated empty states with actionable suggestions
- **AI Suggestion Panel** — Intelligent category and amount suggestions

### 🔐 Security & Auth
- **Multi-Provider Authentication** — Google OAuth, Microsoft MSAL, and email/password
- **Role-Based Access Control (RBAC)** — Admin, Manager, and Employee roles
- **Security Dashboard** — Audit logs, session management, and security metrics
- **Protected Routes** — Client-side route guards with role enforcement

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI library with Suspense & lazy loading |
| **TypeScript** | Type safety across the codebase |
| **Vite** | Lightning-fast dev server & bundler |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Page transitions & animations |
| **GSAP** | Cinematic loader animations |
| **React Three Fiber** | 3D data visualizations |
| **Recharts** | 2D charts & analytics |
| **Redux Toolkit** | Global state management |
| **React Query** | Server state & caching |
| **React Hook Form + Zod** | Form handling & validation |
| **Tesseract.js** | Client-side OCR engine |
| **Radix UI** | Accessible UI primitives |
| **Lottie React** | Animated empty states & illustrations |
| **Socket.io Client** | Real-time communication |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server |
| **TypeScript** | Type-safe backend |
| **Socket.io** | WebSocket real-time events |
| **Tesseract (Server)** | Server-side OCR processing |
| **Docker** | Containerized deployment |

---

## 📁 Project Structure

```
approval-flow-pro/
├── public/                    # Static assets, favicon, manifest
├── server/                    # Backend Express API
│   ├── src/
│   │   ├── config/            # Server configuration
│   │   ├── middleware/         # Auth & validation middleware
│   │   ├── routes/            # API route handlers
│   │   ├── services/          # Business logic & OCR service
│   │   ├── types/             # Shared TypeScript types
│   │   └── index.ts           # Server entry point
│   ├── Dockerfile
│   └── package.json
├── src/                       # Frontend React application
│   ├── components/
│   │   ├── dashboard/         # Dashboard-specific widgets
│   │   ├── expenses/          # Expense form & list components
│   │   ├── layout/            # App shell, sidebar, topbar
│   │   ├── ui/                # Reusable UI primitives (shadcn/ui)
│   │   ├── viz/               # Data visualizations
│   │   │   ├── ApprovalSankey.tsx
│   │   │   ├── ExpenseTimeline3D.tsx
│   │   │   └── HeatmapCalendar.tsx
│   │   ├── AISuggestionPanel.tsx
│   │   ├── CinematicLoader.tsx
│   │   └── EmptyStates.tsx
│   ├── contexts/              # React context providers
│   ├── data/                  # Mock data & fixtures
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   ├── pages/                 # Route-level page components
│   ├── store/                 # Redux store & slices
│   ├── types/                 # TypeScript type definitions
│   ├── App.tsx                # Root app with routing
│   └── main.tsx               # Entry point
├── docker-compose.yml
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** or **bun**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SuhelMulla22/Reimbursement-Management.git
   cd Reimbursement-Management/approval-flow-pro
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   ```
   Edit the `.env` files with your API keys:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id
   VITE_MICROSOFT_TENANT_ID=your_microsoft_tenant_id
   ```

5. **Start the development server**
   ```bash
   # Frontend (from project root)
   npm run dev

   # Backend (in a separate terminal)
   cd server
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:5173
   ```

### Docker Deployment
```bash
docker-compose up --build
```

---

## 📸 Pages Overview

| Page | Description |
|---|---|
| **Login** | Multi-provider auth with animated background |
| **Dashboard** | KPI cards, charts, 3D timeline, heatmap calendar |
| **Expenses** | Filterable data grid with status badges |
| **New Expense** | OCR-powered form with AI suggestions |
| **Expense Detail** | Full expense view with comments & approval actions |
| **Approvals** | Manager/Admin approval queue with bulk actions |
| **Analytics** | Deep-dive charts, Sankey diagram, trend analysis |
| **Users** | User management panel (Admin only) |
| **Security** | Audit logs, sessions, security metrics (Admin only) |
| **Settings** | System configuration (Admin only) |
| **Notifications** | Real-time notification center |

---

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch
```

---

## 📜 Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ by [Suhel Mulla](https://github.com/SuhelMulla22)**

</div>
