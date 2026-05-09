import { Program, AnchorProvider } from '@coral-xyz/anchor';
import idl from './src/idl/tasky.json' assert { type: 'json' };
import { Connection } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');
const dummyWallet = {
  publicKey: null,
  signTransaction: async (tx) => tx,
  signAllTransactions: async (txs) => txs,
};

const provider = new AnchorProvider(connection, dummyWallet, {});
const program = new Program({ ...idl, address: "11111111111111111111111111111111"} as any, provider);

console.log("Available accounts:", Object.keys(program.account));
