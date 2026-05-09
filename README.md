# Tasky — Trustless Academic Marketplace on Solana

> A decentralized peer-to-peer academic help marketplace where students post tasks, experts accept them, and payments are locked in on-chain escrow — released only when work is approved.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://tasky-najam.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Najam8998%2FTasky-181717?style=for-the-badge&logo=github)](https://github.com/Najam8998/Tasky)
[![Solana Devnet](https://img.shields.io/badge/Network-Solana%20Devnet-9945FF?style=for-the-badge&logo=solana)](https://explorer.solana.com/?cluster=devnet)

---

## Hackathon Checklist

- [x] **Project name and description** — Tasky: Trustless Academic Marketplace on Solana
- [x] **Contract deployment address (Devnet)** — `EMwmJTWq7cCVFuMY1UK77DPmVJAkyqmGwGGMh39NTESQ`
- [x] **Public GitHub repo with README + setup instructions** — [github.com/Najam8998/Tasky](https://github.com/Najam8998/Tasky)
- [x] **Live demo link** — [tasky-najam.vercel.app](https://tasky-najam.vercel.app)
- [x] **Demo video (under 3 mins)** — *(Add your video link here)*
- [x] **Consistent and considerable use of Solana libraries and SDKs** — see [Solana SDK Usage](#solana-sdk-usage) below

---

## What is Tasky?

Tasky eliminates the 30% middleman fees of traditional tutoring platforms. It connects students directly with expert tutors using **Solana smart contracts** for trustless, instant escrow payments.

| Role | What they do |
|------|-------------|
| **Client (Student)** | Posts a task with SOL bounty locked in escrow |
| **Expert (Tutor)** | Browses open tasks, accepts one, and helps the client |
| **Admin** | Resolves disputes via protected admin portal |

**No middleman. No trust required. Smart contract enforces every rule.**

---

## Contract Deployment

| Network | Program ID | Explorer |
|---------|-----------|---------|
| **Solana Devnet** | `EMwmJTWq7cCVFuMY1UK77DPmVJAkyqmGwGGMh39NTESQ` | [View on Explorer ↗](https://explorer.solana.com/address/EMwmJTWq7cCVFuMY1UK77DPmVJAkyqmGwGGMh39NTESQ?cluster=devnet) |

The smart contract is written in **Rust using the Anchor framework** and handles:
- `createTask` — locks SOL into a PDA escrow account
- `acceptTask` — registers the helper on-chain
- `releaseFunds` — transfers SOL from PDA to helper wallet
- `raiseDispute` — flags task for admin review
- `adminResolve` — force-releases or refunds based on admin decision

---

## Solana SDK Usage

This project demonstrates **deep, real-world integration** with Solana libraries across the full stack:

### `@solana/web3.js`
```ts
// solana.ts
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js'

export const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')

// Devnet airdrop for testing
export async function requestAirdrop(pubkey: string): Promise<string> {
  const pk = new PublicKey(pubkey)
  const sig = await connection.requestAirdrop(pk, LAMPORTS_PER_SOL)
  await connection.confirmTransaction(sig)
  return sig
}

// Real-time SOL balance
export async function getBalance(pubkey: string): Promise<number> {
  const lamports = await connection.getBalance(new PublicKey(pubkey))
  return lamports / LAMPORTS_PER_SOL
}
```

### `@coral-xyz/anchor` + PDA Derivation
```ts
// contract.ts
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'
import { PublicKey, SystemProgram } from '@solana/web3.js'

export const PROGRAM_ID = new PublicKey('EMwmJTWq7cCVFuMY1UK77DPmVJAkyqmGwGGMh39NTESQ')

// Derive task escrow PDA deterministically
const [pda] = PublicKey.findProgramAddressSync(
  [Buffer.from("task"), creator.toBuffer(), Buffer.from(taskId)],
  PROGRAM_ID
)

// Create task — locks SOL into PDA
await program.methods.createTask(
  taskId, title, description, category, new BN(lamports)
).accounts({
  task: pda,
  creator: creator,
  systemProgram: SystemProgram.programId,
}).rpc()

// Release escrow — sends SOL from PDA to helper
await program.methods.releaseFunds().accounts({
  task: new PublicKey(escrowPda),
  creator: wallet.publicKey,
  helper: new PublicKey(helperPubkey),
}).rpc()
```

### `@solana/wallet-adapter-react`
```ts
// Phantom wallet connection
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

const { publicKey, connected, wallet } = useWallet()
const { connection } = useConnection()

// Pass wallet context directly into Anchor for signing
const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'confirmed' })
```

### Rust Smart Contract (`TaskyProgram.rs`)
```rust
// Anchor program — deployed on Solana Devnet
#[program]
pub mod tasky {
    pub fn create_task(ctx: Context<CreateTask>, task_id: String, ..., lamports: u64) -> Result<()> {
        // Transfer SOL from creator → PDA escrow
        system_program::transfer(cpi_ctx, lamports)?;
    }

    pub fn release_funds(ctx: Context<ReleaseFunds>) -> Result<()> {
        // Transfer SOL from PDA → helper, close PDA
        **ctx.accounts.task.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.helper.to_account_info().try_borrow_mut_lamports()? += amount;
    }
}
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Blockchain** | Solana Devnet |
| **Smart Contract** | Rust + Anchor Framework |
| **Frontend** | React 19 + TypeScript + Vite |
| **Wallet** | Phantom via `@solana/wallet-adapter-react` |
| **Solana SDK** | `@solana/web3.js` + `@coral-xyz/anchor` |
| **Styling** | Vanilla CSS (responsive, dark theme) |
| **Deployment** | Vercel + GitHub |

---

## Features

- **Trustless Escrow** — SOL locked in Anchor PDAs, released only on approval
- **Unified Dashboard** — Users can be both Client and Expert simultaneously
- **Dispute Resolution** — Admin arbitration system with password-protected portal
- **Live Analytics** — Real-time Solana price chart via CoinGecko API
- **AI Monitor** — Live activity log and transaction feed
- **Mobile Responsive** — Hamburger menu, fluid layouts for all screen sizes
- **Notification System** — In-app alerts for task events
- **Transaction History** — Every on-chain action recorded with Explorer links

---

## Live Demo

**URL:** [tasky-najam.vercel.app](https://tasky-najam.vercel.app)

**Test credentials:**
- Network: **Solana Devnet** (switch Phantom to Devnet)
- Need SOL? Use the **Airdrop button** in the navbar or visit [faucet.solana.com](https://faucet.solana.com)

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- [Phantom Wallet](https://phantom.app/) browser extension set to **Devnet**

### Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/Najam8998/Tasky.git
cd Tasky

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

App runs at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Environment
No `.env` file needed — the app connects to **Solana Devnet** by default using public RPC endpoints.

---

## Project Structure

```
src/
├── components/
│   ├── Navbar.tsx          # Responsive navbar with hamburger menu
│   ├── AIPanel.tsx         # Live AI monitor + blockchain feed
│   ├── Discussion.tsx      # On-task chat system
│   └── SolanaPriceChart.tsx # Live SOL price chart
├── pages/
│   ├── Home.tsx            # Landing page + marketplace preview
│   ├── Dashboard.tsx       # Unified Client + Expert dashboard (tabbed)
│   ├── TaskDetail.tsx      # Task view with escrow actions
│   ├── AdminDashboard.tsx  # Password-protected admin portal
│   ├── Analytics.tsx       # Platform analytics
│   └── Profile.tsx         # Wallet profile page
├── lib/
│   ├── contract.ts         # Anchor smart contract integration
│   └── solana.ts           # @solana/web3.js helpers
└── context/
    ├── WalletContext.tsx    # Phantom wallet provider
    ├── AIContext.tsx        # AI monitor state
    └── NotificationContext.tsx
```

---

## Admin Portal

Access the admin panel (hidden from navbar) at:
```
/admin?key=tasky_admin_2024
```

---

## Contract Source

The full Rust/Anchor smart contract source is included at `TaskyProgram.rs` in the repo root.

---

## Demo Video

[![Tasky Demo Video](https://img.youtube.com/vi/MKadGAlJg80/maxresdefault.jpg)](https://www.youtube.com/watch?v=MKadGAlJg80)

▶️ **[Watch on YouTube](https://www.youtube.com/watch?v=MKadGAlJg80)**

---

## Author

Built for the Solana Hackathon by **Najam** — [@Najam8998](https://github.com/Najam8998)

---

*Tasky is deployed on Solana Devnet for demonstration purposes.*
