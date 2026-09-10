# Blockchain-Based Image Sharing and Tamper Accountability System 🔗

A blockchain-based media sharing and tamper accountability system that replaces direct file transfer with smart contract-controlled viewing permissions.

> "The system enables secure image sharing by replacing file transfer with blockchain-controlled viewing permissions, while ensuring tamper detection and immutable accountability of access events."

---

## What it does

Instead of sending someone an image or video file directly, this system:

1. **Stores media on IPFS** (via Pinata) — the file never reaches the viewer directly
2. **Registers access rules on Ethereum** — who can view, how many times, and until when
3. **Logs every access attempt on-chain** — immutable audit trail that cannot be deleted
4. **Detects tampering** — SHA-256 hash stored on-chain, recomputed at access time

| Feature | How |
|---|---|
| Access control | Smart contract whitelist per viewer address |
| View limits | Enforced by contract — auto-blocks after N views |
| Expiry | Unix timestamp checked on every access |
| Tamper detection | SHA-256 hash stored on-chain, verified on view |
| Audit log | Ethereum events — permanent, immutable |
| Storage | IPFS via Pinata — decentralised, content-addressed |

---

## Tech stack

- **Frontend** — React, ethers.js, axios
- **Backend** — Node.js, Express, multer, crypto
- **Blockchain** — Ethereum (Ganache local testnet), Solidity
- **Storage** — IPFS via Pinata
- **Wallet** — MetaMask

---

## Project structure

```
blockchain-image-system/
├── backend/
│   ├── server.js          # Express API — upload, serve, metadata
│   ├── abi.json           # Contract ABI (copied from Remix after deploy)
│   ├── .env               # Secrets — never committed (see below)
│   └── uploads/           # Temp folder — files deleted after Pinata upload
│
└── frontend/
    ├── src/
    │   ├── App.js
    │   ├── blockchain.js  # ethers.js connection helper
    │   ├── abi.json       # Same ABI as backend
    │   ├── index.css
    │   └── pages/
    │       ├── UploadPage.js
    │       ├── ViewPage.js
    │       └── Dashboard.js
    └── public/
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Ganache](https://trufflesuite.com/ganache/) desktop app
- [MetaMask](https://metamask.io/) browser extension
- [Remix IDE](https://remix.ethereum.org/) (browser-based, no install)
- [Pinata](https://pinata.cloud/) account (free tier works)

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/blockchain-image-system.git
cd blockchain-image-system
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Create your `.env` file

Inside the `backend/` folder, create a file called `.env`:

```env
CONTRACT_ADDRESS=0xYourDeployedContractAddress
PRIVATE_KEY=0xYourGanacheAccountPrivateKey
PINATA_KEY=your_pinata_api_key
PINATA_SECRET=your_pinata_api_secret
PINATA_GATEWAY=https://yourname.mypinata.cloud
```

> **Never commit this file.** It is already in `.gitignore`.

### 5. Get your Pinata credentials

1. Sign up at [pinata.cloud](https://pinata.cloud)
2. Go to **API Keys** → **New Key**
3. Enable **Files → Write** and **Gateways → Read**
4. Copy the API Key and Secret into your `.env`
5. Copy your Gateway URL from the Gateways tab

---

## Running the project

Follow this order every time.

### Step 1 — Start Ganache

Open Ganache desktop → click your saved workspace → confirm accounts show 100 ETH.

### Step 2 — Deploy the smart contract

1. Open [Remix IDE](https://remix.ethereum.org)
2. Create `ImageAccessControl.sol` and paste the contract code (see `contract/ImageAccessControl.sol`)
3. Compiler tab → version **0.8.19**, EVM version **london** → Compile
4. Deploy tab → Environment: **Browser Extension - MetaMask**
5. Turn **off** "Verify Contract on Explorers"
6. Gas limit: `3000000` → click **Deploy** → confirm in MetaMask
7. Copy the deployed contract address
8. Update `CONTRACT_ADDRESS` in `backend/.env`
9. Update `CONTRACT_ADDRESS` in `frontend/src/blockchain.js`
10. Copy the ABI from Remix → paste into both `backend/abi.json` and `frontend/src/abi.json`

### Step 3 — Start the backend

```bash
cd backend
node server.js
# Backend running on port 3001
```

### Step 4 — Start the frontend

```bash
cd frontend
npm start
# Opens localhost:3000
```

---

## Usage

### Upload media

1. Go to **Upload** page
2. Select an image (JPEG, PNG, GIF, WebP) or video (MP4, WebM, MOV)
3. Set view limit and validity period
4. Click **Upload media**
5. Note the **Media ID** returned

### Grant access to a viewer

1. Open Remix → Deployed Contracts → expand your contract
2. Find **grantAccess**
3. Enter the Media ID and the viewer's MetaMask wallet address
4. Click **transact** → confirm in MetaMask

### View media

1. Go to **View Image** page
2. Switch MetaMask to the viewer's account
3. Enter the Media ID → click **Request Access**
4. Confirm the MetaMask transaction
5. Media loads with ✓ **Authentic** or ⚠ **Tampered** badge

### Check the audit log

1. Go to **Audit Log** page
2. Enter the Media ID → click **Load log**
3. Every access attempt (granted and denied) is shown with viewer address and block number

---

## Smart contract

The `ImageAccessControl` contract (Solidity 0.8.x) exposes:

| Function | Description |
|---|---|
| `uploadImage(cid, hash, limit, days)` | Register media on-chain |
| `grantAccess(id, viewer)` | Whitelist a viewer address |
| `viewImage(id)` | Enforce policy, log attempt, return granted/denied |
| `getImage(id)` | Read metadata (owner, hash, limits, expiry) |
| `getLogCount(id)` | Number of access attempts |

---

## Security notes

- The system **cannot prevent screen recording or physical photography** of the display
- It **makes misuse detectable and provable** via the immutable on-chain audit log
- SHA-256 collision resistance makes hash forgery computationally infeasible
- Smart contract code is immutable once deployed — access rules cannot be changed after the fact
- Private keys and API secrets are stored only in `.env` and never committed to version control

---

## Environment variables reference

| Variable | Description |
|---|---|
| `CONTRACT_ADDRESS` | Ethereum address of the deployed contract |
| `PRIVATE_KEY` | Private key of the owner wallet (Ganache account) |
| `PINATA_KEY` | Pinata API key |
| `PINATA_SECRET` | Pinata API secret |
| `PINATA_GATEWAY` | Your Pinata gateway URL |

---

## Limitations

- Runs on a **local Ganache testnet** — not production-ready without migration to a public network (Polygon, Ethereum mainnet)
- SHA-256 hashing of large video files in the browser may take 5–30 seconds
- No end-to-end encryption of media — Pinata can technically access stored files

---

## Future scope

- End-to-end encryption using asymmetric cryptography
- Migration to Polygon or Arbitrum for low-cost production deployment
- Zero-knowledge proofs for anonymous viewer verification
- Mobile app with WalletConnect integration
- Video streaming with chunked IPFS access control

---

## License

MIT
