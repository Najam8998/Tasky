// Polyfill Buffer for Solana web3.js in browser
import { Buffer } from 'buffer'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).Buffer = Buffer
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
