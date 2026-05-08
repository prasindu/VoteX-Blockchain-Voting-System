<div align="center">

<br/>

```
██╗   ██╗ ██████╗ ████████╗███████╗██╗  ██╗
██║   ██║██╔═══██╗╚══██╔══╝██╔════╝╚██╗██╔╝
██║   ██║██║   ██║   ██║   █████╗   ╚███╔╝ 
╚██╗ ██╔╝██║   ██║   ██║   ██╔══╝   ██╔██╗ 
 ╚████╔╝ ╚██████╔╝   ██║   ███████╗██╔╝ ██╗
  ╚═══╝   ╚═════╝    ╚═╝   ╚══════╝╚═╝  ╚═╝
```

### 🗳️ Blockchain-Based Intelligent Voting System

*Secure · Transparent · Decentralized*

<br/>

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity_0.8.x-363636?style=for-the-badge&logo=solidity&logoColor=white)
![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)
![IPFS](https://img.shields.io/badge/IPFS-65C2CB?style=for-the-badge&logo=ipfs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white)

<br/>

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Why VoteX?](#-why-votex)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Smart Contract](#-smart-contract)
- [Repository Structure](#-repository-structure)
- [Local Setup](#-local-setup)
- [Smart Contract Deployment](#-smart-contract-deployment)
- [Implementation Notes](#-implementation-notes)
- [Team](#-team)

---

## 🌐 Overview

**VoteX** is a full-stack decentralized application (dApp) that brings trustworthy, tamper-resistant elections to the web. By moving election logic and vote recording **on-chain**, VoteX eliminates the central points of failure and manipulation that plague traditional online voting systems.

> Traditional online voting systems struggle with trust, auditability, and tamper resistance.  
> VoteX solves this — on-chain governance, decentralized media, and AI-powered insights.

---

## 💡 Why VoteX?

| Challenge | VoteX Solution |
|-----------|----------------|
| ❌ Centralized trust | ✅ On-chain governance via smart contracts |
| ❌ Vote tampering | ✅ Immutable, verifiable Ethereum transactions |
| ❌ Opaque results | ✅ Real-time public result dashboards |
| ❌ Accessibility | ✅ MetaMask wallet UX + AI chatbot guidance |
| ❌ Media storage risks | ✅ IPFS-backed decentralized image storage |

**What makes VoteX stand out:**
- 🔗 On-chain governance logic instead of database-only trust
- 🔐 Hybrid access-control model (public & private elections)
- 🔄 Full lifecycle: **Create → Vote → Analyze → Export → Explain with AI**
- 🎨 Interview-grade frontend: state management, charting, 3D effects, wallet UX
- 📊 Practical product thinking with data export and conversational analytics

---

## 🎯 Key Features

### 🗳️ Voting & Elections
- **Public elections** — any wallet can vote
- **Private elections** — whitelist-based voter eligibility
- **Time-bounded elections** — enforced start and end windows
- **One-wallet-one-vote** — per election enforcement
- **Role-aware access** — to results and voter status

### 🖼️ Media & Metadata
- IPFS image upload for election and candidate visuals
- Decentralized image persistence via Pinata

### 📊 Results & Analytics
- Real-time bar & pie chart visualizations
- Participation analytics dashboard
- Excel export (`.xlsx`) of election outcomes

### 🤖 AI Integration
- **AI Election Assistant** — natural language Q&A over result summaries
- Powered by OpenRouter API via Express.js backend

### 🌐 Web3
- MetaMask wallet authentication
- `ethers.js` for contract reads/writes

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Admin   │  │   Vote   │  │ Results  │  │  Chatbot   │  │
│  │  .jsx    │  │  .jsx    │  │  .jsx    │  │   Page     │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       │              │              │               │         │
│  ┌────▼──────────────▼──────────────▼───────────┐  │         │
│  │        Zustand Store (useElectionStore)       │  │         │
│  └──────────────────────┬────────────────────────┘  │         │
└─────────────────────────┼────────────────────────────┼────────┘
                          │                            │
          ┌───────────────▼──────┐      ┌─────────────▼────────┐
          │   Ethereum Network   │      │  Chatbot Server       │
          │  (Voting.sol via     │      │  (Express + OpenRouter│
          │   ethers.js)         │      │   API)                │
          └───────────────┬──────┘      └──────────────────────┘
                          │
          ┌───────────────▼──────┐
          │   IPFS / Pinata      │
          │  (Election & Candidate│
          │   Media Storage)     │
          └──────────────────────┘
```

**Flow:**
1. **Admin** creates an election via `src/pages/Admin.jsx`
2. **Images** are uploaded to IPFS via `src/ipfs.js`
3. **Metadata & constraints** written to `Voting.sol` on-chain
4. **Voters** connect wallets → cast transactions via `src/pages/Vote.jsx`
5. **Results** fetched from on-chain methods → visualized in `src/pages/Results.jsx`
6. **AI summary** sent to `chatbot-server/server.js` for natural language interpretation

---

## 🛠️ Tech Stack

| Layer | Technologies | Purpose |
|-------|-------------|---------|
| **Frontend** | React 19, Vite 6, React Router 7, Tailwind CSS 4, Framer Motion | UI architecture, routing, styling, interaction |
| **Web3** | ethers.js 5, MetaMask | Wallet connection, contract reads/writes |
| **State Management** | Zustand | Shared dApp state, form state, contract instance management |
| **Blockchain** | Solidity 0.8.x, Hardhat | Smart contract development and deployment |
| **Decentralized Storage** | Pinata + IPFS gateways | Candidate/election media persistence |
| **Data Visualization** | Recharts, Chart.js | Election and vote analytics dashboards |
| **Export/Reporting** | xlsx, file-saver | Downloadable result reports |
| **AI Service** | Express, OpenRouter API | Conversational assistant over election context |
| **3D / Immersive UI** | three.js, @react-three/fiber, @react-three/drei | Branding and high-engagement visual elements |

---

## 📜 Smart Contract

> `contracts/Voting.sol`

### Features
- ✅ Election creation with validation constraints
- ✅ Candidate arrays with per-candidate vote counts
- ✅ Public / private voting permission model
- ✅ One-vote-per-wallet enforcement
- ✅ Election state transitions (`active` → `ended`)
- ✅ Access-controlled result retrieval

### Constraints

```
⚠️  Max candidates per election  →  20
⚠️  Max allowlisted voters       →  100 (private elections)
⚠️  Start time                   →  Must be in the future
⚠️  End time                     →  Must be after start time
```

---

## 📁 Repository Structure

```
myDAPP/
│
├── contracts/                  # Solidity contract + deployment script
│   ├── Voting.sol
│   └── deploy.js
│
├── src/
│   ├── pages/                  # Home, Admin, Vote, Results, Chatbot
│   ├── hooks/                  # Wallet utilities
│   └── ipfs.js                 # IPFS upload and gateway utilities
│
├── store/                      # Zustand election store + contract ABI
│   └── useElectionStore.js
│
├── chatbot-server/             # Express service for AI chat
│   └── server.js
│
└── public/                     # Media, 3D models, static assets
```

---

## ⚙️ Local Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| MetaMask | Browser Extension |
| Sepolia ETH | Required for testnet deployment |

### 1. Install Dependencies

```bash
# Frontend + Hardhat dependencies
npm install --legacy-peer-deps

# Chatbot backend dependencies
cd chatbot-server
npm install
```

### 2. Environment Configuration

Create `chatbot-server/.env`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

### 3. Run the Application

Open **two terminals:**

```bash
# Terminal 1 — Frontend
npm run dev
```

```bash
# Terminal 2 — Chatbot Backend
cd chatbot-server
npm start
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Chatbot Server | http://localhost:5000 |

---

## 🔗 Smart Contract Deployment

### Local Hardhat Network

```bash
# Terminal 1 — Start local Hardhat node
npx hardhat node
```

```bash
# Terminal 2 — Deploy contract
npx hardhat run contracts/deploy.js --network localhost
```

> ⚠️ After deployment, update the contract address in:
> - `store/useElectionStore.js`
> - `src/hooks/useWallet.js`

---

## 📝 Implementation Notes

> These are important configuration points to address before production deployment.

| Item | Current State | Production Recommendation |
|------|--------------|--------------------------|
| Contract addresses | Hardcoded in store/hook files | Move to `.env` variables |
| Pinata JWT token | Hardcoded in `src/ipfs.js` | Move to `.env` variables |
| Chat endpoints | Mixed local/hosted in UI files | Centralize in config file |

---



---

⭐ **If you found this project useful, give it a star!** ⭐

</div>
