# 🛡️ CodeArmor AI

**Stop shipping security debt with AI-generated code.**

CodeArmor AI scans AI-generated codebases and pull requests for real, actionable security vulnerabilities and highlights risk before code reaches production.

[![Live App](https://img.shields.io/badge/Live%20App-codearmor--ai.vercel.app-blueviolet?style=for-the-badge&logo=vercel)](https://codearmor-ai.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## ✨ What CodeArmor AI Does

CodeArmor AI is built for modern developers who use AI tools to ship fast — but still need security confidence. It bridges the gap between rapid AI generation and production-grade security.

### Key Benefits:
- 🔍 **Scan Repositories** for deep-seated security vulnerabilities.
- 🔁 **Analyze Pull Requests** to understand risk delta and prevent regressions.
- 🧠 **Smart Classification** to distinguish between Definite Vulnerabilities vs. Potential Risks.
- 📊 **Security Scoring** for at-a-glance confidence.
- 🧾 **Explainable AI** findings with context and assumptions.
- 🧩 **No Noise** design to minimize false positives.

---

## 🚀 Features

### 🔐 Repository Security Scan
- Detects hardcoded secrets, authentication flaws, configuration risks, and more.
- Tailored for the unique patterns of **AI-generated** and fast-moving codebases.

### 🔁 Pull Request Security Analysis
- Analyze PR diffs for security regressions before they are merged.
- Calculates **PR Risk Delta** across categories: Auth, API, Database, and Config.
- Flags new vulnerabilities introduced in specific changes.

### 🧠 Smart Classification
- **Definite Vulnerability:** Clearly exploitable issues with high confidence.
- **Potential Risk:** Context-dependent findings that require developer review.
- No fear-mongering; just actionable insights.

### 📊 Security Scoring
- Simple visual score (🟢 Healthy, 🟡 Warning, 🔴 Critical).
- Always consistent with active findings.
- Updates dynamically on every scan.

### 🔑 GitHub Authentication
- Secure login via **GitHub OAuth**.
- No tokens exposed client-side.
- Seamlessly works with your public repositories.

---

## 🧪 Try It Out

You can test CodeArmor AI instantly using public repositories. One of our favorite test cases is analyzing complex PRs in large open-source projects.

**Example PR to test:**
- **Owner:** `facebook`
- **Repo:** `react`
- **PR:** `28703`

Alternatively, you can paste vulnerable code snippets directly into the scanner to see it in action.

👉 **Try now:** [codearmor-ai.vercel.app](https://codearmor-ai.vercel.app/)

---

## 🛠️ Tech Stack

- **Framework:** [Next.js (App Router)](https://nextjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Auth:** [NextAuth.js (GitHub OAuth)](https://next-auth.js.org/)
- **API:** GitHub REST API
- **AI Engine:** LLM-based static analysis (Groq)
- **Hosting:** [Vercel](https://vercel.com/)

---

## 📦 Local Development

Want to run CodeArmor AI locally? Follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/adnanbasil10/codearmor-ai
cd codearmor-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and add the following:

| Variable | Description |
|----------|-------------|
| `GITHUB_CLIENT_ID` | Your GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | Your GitHub OAuth App Client Secret |
| `NEXTAUTH_URL` | `http://localhost:3000` (for local dev) |
| `NEXTAUTH_SECRET` | A random 32-character string |
| `GROQ_API_KEY` | Your Groq API Key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` (or preferred model) |

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 🔒 Security & Privacy

- No secrets are stored in the application repository.
- Environment variables are securely managed via Vercel/Local Env.
- Code analysis is performed server-side for maximum security.
- **Privacy First:** No code is executed — we perform analysis only. No sensitive data is logged or exposed.

---

## 📌 Disclaimer

CodeArmor AI provides automated security analysis assistance. It is designed to augment developer workflows and does not replace professional security audits or penetration testing. **Always review findings before applying fixes.**

---

## 👋 Author

**Built with ❤️ by Adnan Basil**

If you’re a developer, founder, or security-curious — feel free to try it and share feedback!

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/adnanbasil10)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/adnanbasil)
[![X](https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/BasilAdnan)

**Built by Adnan Basil** | [GitHub](https://github.com/adnanbasil10) | [LinkedIn](https://linkedin.com/in/adnanbasil) | [X](https://x.com/BasilAdnan)
