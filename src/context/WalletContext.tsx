// ============================================================
// WalletContext.tsx — Solana wallet adapter provider
// ============================================================

import { type FC, type ReactNode, useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork, WalletReadyState } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { SolanaMobileWalletAdapter, createDefaultAddressSelector, createDefaultAuthorizationResultCache, createDefaultWalletNotFoundHandler } from '@solana-mobile/wallet-adapter-mobile'
import { clusterApiUrl } from '@solana/web3.js'

// Import default wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css'

interface Props {
  children: ReactNode
}

class CustomPhantomWalletAdapter extends PhantomWalletAdapter {
  async connect() {
    if (this.readyState === WalletReadyState.Loadable) {
      const isAndroid = /Android/i.test(navigator.userAgent);
      if (isAndroid) {
        const url = encodeURIComponent(window.location.href);
        const ref = encodeURIComponent(window.location.origin);
        // Using Android Intent to force opening the app or fallback to Play Store
        const intentUrl = `intent://browse/${url}?ref=${ref}#Intent;scheme=phantom;package=app.phantom;S.browser_fallback_url=${encodeURIComponent('https://play.google.com/store/apps/details?id=app.phantom')};end`;
        window.location.href = intentUrl;
        return;
      }
    }
    return super.connect();
  }
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  const network  = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const wallets  = useMemo(() => [
    new SolanaMobileWalletAdapter({
      addressSelector: createDefaultAddressSelector(),
      appIdentity: {
        name: 'Tasky',
        uri: 'https://tasky.example.com',
        icon: 'favicon.ico',
      },
      authorizationResultCache: createDefaultAuthorizationResultCache(),
      cluster: 'devnet',
      onWalletNotFound: createDefaultWalletNotFoundHandler(),
    }),
    new CustomPhantomWalletAdapter()
  ], [network])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
