# 🐞 Tracora — Modern Bug Tracking System

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" alt="status" />
  <img src="https://img.shields.io/badge/Tech%20Stack-Next.js%20%7C%20Node.js%20%7C%20MongoDB%20%7C%20TypeScript-blue?style=for-the-badge" alt="stack" />
  <img src="https://img.shields.io/github/license/your-username/Tracora?style=for-the-badge" alt="license" />
</p>

<p align="center">
  <b>Tracora</b> is a full-stack bug tracking system built with <code>Next.js</code>, <code>Node.js</code>, <code>MongoDB</code>, and <code>TypeScript</code>.  
  Designed for developers, testers, and managers — Tracora provides a sleek UI, powerful role-based access, and real-time collaboration for modern software teams.
</p>

---

## ✨ Features

✅ **Role-Based Access Control** — Developer, Tester, and Manager views  
✅ **Project & Feature Management** — Organize your work effectively  
✅ **Bug Lifecycle Tracking** — Report, assign, update, and resolve bugs  
✅ **Modern UI/UX** — Clean, responsive, and built with TailwindCSS + shadcn/ui  
✅ **Authentication & Authorization** — Secure login with cookies and JWT  
✅ **Optimized Developer Experience** — TypeScript, modular codebase, reusable components  

---

## 📸 Screenshots

| Dashboard | Bug List | Bug Details |
|----------|----------|-------------|
| ![Dashboard Screenshot](docs/screenshots/dashboard.png) | ![Bug List Screenshot](docs/screenshots/bugs.png) | ![Bug Details Screenshot](docs/screenshots/bug-details.png) |

---

## 🏗️ Tech Stack

| Layer | Technology |
|------|-------------|
| **Frontend** | Next.js 14, TypeScript, TailwindCSS, shadcn/ui |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **Auth** | JWT + HTTP-Only Cookies |
| **Deployment** | Vercel (Frontend), Render/Atlas (Backend & DB) |

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/AnanyaaKoundal/Tracora.git
cd Tracora
```
### 2️⃣ Install Dependencies

Using Yarn:
```bash
yarn install
```

Or using npm:
```bash
npm install
```

### 3️⃣ Configure Environment Variables

Create a .env file in the root and add:
```bash
# Server
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/tracora
JWT_SECRET=super_secret_key
JWT_EXPIRES_IN=7d

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
```

### 4️⃣ Run the App Locally

Start backend:
```bash
yarn dev:server
# or
npm run dev:server
```

Start frontend:
```bash
yarn dev
# or
npm run dev
```

Visit http://localhost:3000


## 📈 Roadmap

- [x] Core bug tracking (CRUD)
- [x] RBAC (Developer / Tester / Manager)
- [x] Authentication & secure cookies
- [ ] Real-time notifications via WebSockets
- [ ] AI-based duplicate detection
- [ ] Analytics dashboard & export support
- [ ] Multi-tenant / SaaS improvements

### 🤝 Contributing

Thanks for wanting to contribute! Please:

Fork the repo

1. Create branch: git checkout -b feature/your-feature

2. Commit your changes: git commit -m "feat: add ..."

3. Push: git push origin feature/your-feature

4. Open a Pull Request describing the change

5. Please follow the existing code style and run linters/tests before submitting.


### ❤️ Made with love

Made with ❤️ by Ananyaa
.
If you find Tracora useful, please ⭐ the repo and share feedback.