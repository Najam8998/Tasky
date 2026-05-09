// ============================================================
// TaskStoreContext.tsx — Global on-chain task store
// Replaces localStorage getAllTasks() with live blockchain fetch
// so all users on all devices see the same tasks.
// ============================================================
import React, {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'
import idl from '../idl/tasky.json'
import { PROGRAM_ID, type Task, type TaskStatus } from '../lib/contract'

// ── Map on-chain status byte → string ──────────────────────
function statusFromU8(n: number): TaskStatus {
  switch (n) {
    case 0:  return 'open'
    case 1:  return 'in_progress'
    case 2:  return 'completed'
    case 3:  return 'cancelled'
    case 4:  return 'disputed'
    default: return 'open'
  }
}

// ── Parse a raw chain account into our Task shape ───────────
function parseChainTask(pubkey: PublicKey, acc: any): Task {
  const d = acc.account
  const helperKey: string = d.helper.toBase58()
  const NULL_KEY = '11111111111111111111111111111111'
  return {
    id:          d.taskId as string,
    title:       d.title as string,
    description: d.description as string,
    category:    d.category as string,
    lamports:    typeof d.lamports === 'object'
                   ? (d.lamports as BN).toNumber()
                   : Number(d.lamports),
    creator:     (d.creator as PublicKey).toBase58(),
    helper:      helperKey === NULL_KEY ? null : helperKey,
    status:      statusFromU8(d.status as number),
    escrowPda:   pubkey.toBase58(),
    createdAt:   typeof d.createdAt === 'object'
                   ? (d.createdAt as BN).toNumber() * 1000
                   : Number(d.createdAt) * 1000,
    acceptedAt:  d.acceptedAt && (d.acceptedAt as BN).toNumber() > 0
                   ? (d.acceptedAt as BN).toNumber() * 1000
                   : undefined,
    completedAt: d.completedAt && (d.completedAt as BN).toNumber() > 0
                   ? (d.completedAt as BN).toNumber() * 1000
                   : undefined,
    txSignatures: [], // chain doesn't store sig list; not needed for display
  }
}

// ── Context shape ───────────────────────────────────────────
interface TaskStoreCtx {
  tasks:      Task[]
  loading:    boolean
  error:      string | null
  refresh:    () => Promise<void>
  getTask:    (id: string) => Task | null
}

const TaskStoreContext = createContext<TaskStoreCtx | undefined>(undefined)

// ── Provider ────────────────────────────────────────────────
export const TaskStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { connection } = useConnection()
  const [tasks,   setTasks]   = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Build a read-only provider (no wallet needed for reading)
      const dummyWallet = {
        publicKey:       null,
        signTransaction: async (tx: any) => tx,
        signAllTransactions: async (txs: any[]) => txs,
      }
      const provider = new AnchorProvider(
        connection,
        dummyWallet as any,
        { preflightCommitment: 'confirmed' }
      )
      const program = new Program(
        { ...idl, address: PROGRAM_ID.toBase58() } as any,
        provider
      )

      // Fetch ALL TaskAccount PDAs from the program
      const accounts = await (program.account as any).taskAccount.all()
      const parsed: Task[] = accounts.map((a: any) =>
        parseChainTask(a.publicKey as PublicKey, a)
      )
      // Sort newest first
      parsed.sort((a, b) => b.createdAt - a.createdAt)
      setTasks(parsed)
    } catch (e: any) {
      console.error('[TaskStore] Failed to fetch tasks from chain:', e)
      setError(e?.message ?? 'Failed to load tasks from blockchain.')
    } finally {
      setLoading(false)
    }
  }, [connection])

  // Auto-refresh on mount and every 30 s
  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 30_000)
    return () => clearInterval(timer)
  }, [refresh])

  const getTask = useCallback(
    (id: string) => tasks.find(t => t.id === id) ?? null,
    [tasks]
  )

  return (
    <TaskStoreContext.Provider value={{ tasks, loading, error, refresh, getTask }}>
      {children}
    </TaskStoreContext.Provider>
  )
}

// ── Hook ────────────────────────────────────────────────────
export function useTaskStore(): TaskStoreCtx {
  const ctx = useContext(TaskStoreContext)
  if (!ctx) throw new Error('useTaskStore must be used inside <TaskStoreProvider>')
  return ctx
}
