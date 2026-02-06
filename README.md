# CodeArmor AI

**AI-powered security analysis for code and GitHub Pull Requests**

---

## Features

- **Code Snippet Analysis** - Paste code for instant security scanning
- **GitHub Repository Scanning** - Full repo analysis with OAuth
- **PR Analysis** - Risk delta, regression detection, definite vs potential findings
- **Rate Limiting** - Built-in abuse prevention

---

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in:

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth App Client Secret |
| `NEXTAUTH_URL` | Yes | App URL (e.g., `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Yes | Random secret for session encryption |
| `GROQ_API_KEY` | Yes | Groq API key |
| `GROQ_MODEL` | No | AI model (default: `llama-3.3-70b-versatile`) |

---

## Security

- GitHub OAuth only (no password storage)
- Server-side token management
- Input validation on all API routes
- Rate limiting per user/type
- No secrets in client bundle

---

## Limitations

- AI analysis may have false positives/negatives
- Not a replacement for security expertise
- Use responsibly

---

## License

MIT

---

**Built by Adnan Basil** | [GitHub](https://github.com/adnanbasil10) | [LinkedIn](https://linkedin.com/in/adnanbasil) | [X](https://x.com/BasilAdnan)
