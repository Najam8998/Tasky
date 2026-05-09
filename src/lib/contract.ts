// ============================================================
// contract.ts — Anchor smart contract integration
// ============================================================

import { PublicKey, clusterApiUrl, LAMPORTS_PER_SOL, Connection, SystemProgram } from '@solana/web3.js'
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'
import idl from '../idl/tasky.json'

/** Minimum SOL a wallet must hold to safely pay tx fees + remain rent-exempt */
const MIN_SOL_FOR_TX = 0.002 * LAMPORTS_PER_SOL // 0.002 SOL

/** Parse a Solana/Anchor error into a human-readable message */
function parseRpcError(e: any): string {
  // Try to extract SendTransactionError logs
  if (typeof e?.getLogs === 'function') {
    try {
      const logs: string[] = e.getLogs() ?? []
      const logStr = logs.join(' ')
      if (logStr.includes('insufficient funds for rent'))
        return 'Your wallet does not have enough SOL to cover the transaction fee. Please airdrop or fund at least 0.01 SOL on Devnet.'
      if (logStr.includes('custom program error'))
        return `Program error: ${logStr}`
      if (logs.length > 0)
        return `Transaction failed. Logs: ${logs.slice(-3).join(' | ')}`
    } catch (_) { /* ignore */ }
  }
  const msg: string = e?.message ?? String(e)
  if (msg.includes('insufficient funds for rent'))
    return 'Your wallet has insufficient SOL for rent. Airdrop some Devnet SOL from faucet.solana.com before accepting tasks.'
  if (msg.includes('Transaction simulation failed'))
    return 'Simulation failed — your wallet likely needs more Devnet SOL. Use the airdrop button or visit faucet.solana.com.'
  return msg
}

export const PROGRAM_ID = new PublicKey('EMwmJTWq7cCVFuMY1UK77DPmVJAkyqmGwGGMh39NTESQ')
export const DEVNET_RPC  = clusterApiUrl('devnet')

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed'

export interface Task {
  id: string
  title: string
  description: string
  category: string
  lamports: number          // SOL amount in lamports
  creator: string           // wallet pubkey string
  helper: string | null     // accepting wallet
  status: TaskStatus
  escrowPda: string         // PDA address
  createdAt: number
  acceptedAt?: number
  completedAt?: number
  txSignatures: TxRecord[]
}

export interface TxRecord {
  signature: string
  action: 'create' | 'accept' | 'release' | 'cancel' | 'dispute' | 'refund'
  timestamp: number
  from: string
  to: string
  lamports: number
}

// ---- Anchor Setup ----
export function getProvider(wallet: any, connection: Connection) {
  // @ts-ignore - Wallet Context matches Anchor Wallet enough for sending txs
  return new AnchorProvider(connection, wallet, { preflightCommitment: 'confirmed' })
}

export function getProgram(wallet: any, connection: Connection) {
  const provider = getProvider(wallet, connection);
  return new Program({ ...idl, address: PROGRAM_ID.toBase58() } as any, provider)
}



// ---- Contract calls ----

export async function createTaskEscrow(
  wallet: any,
  connection: Connection,
  task: Pick<Task, 'title' | 'description' | 'category' | 'lamports'>
): Promise<{ taskId: string; signature: string; pda: string }> {
  const program = getProgram(wallet, connection);
  const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const creator = wallet.publicKey as PublicKey;
  
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("task"), creator.toBuffer(), Buffer.from(taskId)],
    PROGRAM_ID
  );

  const signature = await program.methods.createTask(
    taskId, task.title, task.description, task.category, new BN(task.lamports)
  ).accounts({
    task: pda,
    creator: creator,
    systemProgram: SystemProgram.programId,
  }).rpc();

  const newTask: Task = {
    ...task,
    id: taskId,
    creator: creator.toBase58(),
    helper: null,
    status: 'open',
    escrowPda: pda.toBase58(),
    createdAt: Date.now(),
    txSignatures: [{
      signature,
      action: 'create',
      timestamp: Date.now(),
      from: creator.toBase58(),
      to: pda.toBase58(),
      lamports: task.lamports,
    }],
  };

  saveTask(newTask);
  return { taskId, signature, pda: pda.toBase58() };
}

export async function acceptTask(
  wallet: any,
  connection: Connection,
  task: Task
): Promise<{ signature: string }> {
  const program = getProgram(wallet, connection);
  if (task.status !== 'open') throw new Error('Task is not open');

  const helper = wallet.publicKey as PublicKey;

  // ── Pre-flight: ensure helper has enough SOL for tx fees ──
  const helperBalance = await connection.getBalance(helper)
  if (helperBalance < MIN_SOL_FOR_TX) {
    throw new Error(
      `Insufficient SOL: your wallet has ${(helperBalance / LAMPORTS_PER_SOL).toFixed(5)} SOL. ` +
      `You need at least 0.002 SOL to pay transaction fees. ` +
      `Request a Devnet airdrop from faucet.solana.com or use the Airdrop button.`
    )
  }

  let signature: string
  try {
    signature = await program.methods.acceptTask().accounts({
      task: new PublicKey(task.escrowPda),
      helper: helper,
    }).rpc()
  } catch (e: any) {
    throw new Error(parseRpcError(e))
  }

  const updated: Task = {
    ...task,
    helper: helper.toBase58(),
    status: 'in_progress',
    acceptedAt: Date.now(),
    txSignatures: [
      ...task.txSignatures,
      {
        signature,
        action: 'accept',
        timestamp: Date.now(),
        from: helper.toBase58(),
        to: task.escrowPda,
        lamports: 0,
      },
    ],
  };
  saveTask(updated);
  return { signature };
}

export async function cancelTask(
  wallet: any,
  connection: Connection,
  task: Task
): Promise<{ signature: string }> {
  const program = getProgram(wallet, connection);
  if (task.status !== 'open') throw new Error('Task must be open to cancel and refund');
  if (task.creator !== wallet.publicKey.toBase58()) throw new Error('Only the creator can cancel this task');

  let signature: string
  try {
    signature = await program.methods.cancelTask().accounts({
      task: new PublicKey(task.escrowPda),
      creator: wallet.publicKey,
    }).rpc()
  } catch (e: any) {
    throw new Error(parseRpcError(e))
  }

  return { signature };
}

export async function editTask(
  wallet: any,
  connection: Connection,
  task: Task,
  title: string,
  description: string,
  category: string
): Promise<{ signature: string }> {
  const program = getProgram(wallet, connection);
  if (task.status !== 'open') throw new Error('Task must be open to edit');
  if (task.creator !== wallet.publicKey.toBase58()) throw new Error('Only the creator can edit this task');

  let signature: string
  try {
    signature = await program.methods.editTask(title, description, category).accounts({
      task: new PublicKey(task.escrowPda),
      creator: wallet.publicKey,
    }).rpc()
  } catch (e: any) {
    throw new Error(parseRpcError(e))
  }

  return { signature };
}

export async function releaseEscrow(
  wallet: any,
  connection: Connection,
  task: Task
): Promise<{ signature: string }> {
  const program = getProgram(wallet, connection);
  if (task.status !== 'in_progress') throw new Error('Task not in progress');
  if (task.creator !== wallet.publicKey.toBase58()) throw new Error('Only client can release funds');
  if (!task.helper) throw new Error('No helper assigned');

  let relSig: string
  try {
    relSig = await program.methods.releaseFunds().accounts({
      task: new PublicKey(task.escrowPda),
      creator: wallet.publicKey,
      helper: new PublicKey(task.helper),
    }).rpc()
  } catch (e: any) {
    throw new Error(parseRpcError(e))
  }

  const updated: Task = {
    ...task,
    status: 'completed',
    completedAt: Date.now(),
    txSignatures: [
      ...task.txSignatures,
      {
        signature: relSig,
        action: 'release',
        timestamp: Date.now(),
        from: task.escrowPda,
        to: task.helper,
        lamports: task.lamports,
      },
    ],
  };
  saveTask(updated);
  return { signature: relSig };
}

export async function getEscrowBalance(taskId: string): Promise<number> {
  const task = getTask(taskId);
  if (!task || task.status === 'completed') return 0;
  return task.lamports;
}

export async function raiseDispute(
  wallet: any,
  connection: Connection,
  task: Task
): Promise<{ signature: string }> {
  const program = getProgram(wallet, connection);
  if (task.status !== 'in_progress') throw new Error('Task not in progress');

  const signature = await program.methods.raiseDispute().accounts({
    task: new PublicKey(task.escrowPda),
    signer: wallet.publicKey,
  }).rpc();

  const updated: Task = {
    ...task,
    status: 'disputed',
    txSignatures: [
      ...task.txSignatures,
      {
        signature,
        action: 'dispute',
        timestamp: Date.now(),
        from: wallet.publicKey.toBase58(),
        to: PROGRAM_ID.toBase58(),
        lamports: 0,
      },
    ],
  };
  saveTask(updated);
  return { signature };
}

export async function adminResolve(
  wallet: any,
  connection: Connection,
  task: Task,
  resolution: 'release' | 'refund'
): Promise<{ signature: string }> {
  const program = getProgram(wallet, connection);
  if (task.status !== 'disputed') throw new Error('Task not disputed');

  const signature = await program.methods.adminResolve(resolution === 'release').accounts({
    task: new PublicKey(task.escrowPda),
    admin: wallet.publicKey,
    creator: new PublicKey(task.creator),
    helper: new PublicKey(task.helper!),
  }).rpc();

  const updated: Task = {
    ...task,
    status: resolution === 'release' ? 'completed' : 'cancelled',
    completedAt: Date.now(),
    txSignatures: [
      ...task.txSignatures,
      {
        signature,
        action: resolution,
        timestamp: Date.now(),
        from: task.escrowPda,
        to: resolution === 'release' ? task.helper! : task.creator,
        lamports: task.lamports,
      },
    ],
  };
  saveTask(updated);
  return { signature };
}



// ---- localStorage persistence (Hybrid Caching) ----

function saveTask(task: Task): void {
  const all = getAllTasks()
  const idx = all.findIndex(t => t.id === task.id)
  if (idx >= 0) all[idx] = task
  else all.unshift(task)
  localStorage.setItem('tasky_tasks', JSON.stringify(all))
}

export function getTask(taskId: string): Task | null {
  return getAllTasks().find(t => t.id === taskId) ?? null
}

export function getAllTasks(): Task[] {
  try {
    return JSON.parse(localStorage.getItem('tasky_tasks') ?? '[]') as Task[]
  } catch {
    return []
  }
}

export function solToLamports(sol: number): number {
  return Math.round(sol * LAMPORTS_PER_SOL)
}

export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL
}

export function shortPubkey(pk: string): string {
  if (!pk || pk.length < 10) return pk
  return `${pk.slice(0, 5)}...${pk.slice(-4)}`
}

export function explorerUrl(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`
}
