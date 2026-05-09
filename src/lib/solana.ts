// ============================================================
// solana.ts — Devnet helpers
// ============================================================

import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js'

export const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')

/**
 * Request a devnet airdrop of 1 SOL (for testing)
 */
export async function requestAirdrop(pubkey: string): Promise<string> {
  const pk = new PublicKey(pubkey)
  const sig = await connection.requestAirdrop(pk, LAMPORTS_PER_SOL)
  await connection.confirmTransaction(sig)
  return sig
}

/**
 * Get SOL balance in SOL (not lamports)
 */
export async function getBalance(pubkey: string): Promise<number> {
  const pk = new PublicKey(pubkey)
  const lamports = await connection.getBalance(pk)
  return lamports / LAMPORTS_PER_SOL
}
