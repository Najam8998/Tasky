// ============================================================
// AIContext.tsx — Monitoring + AI summarizer
// ============================================================
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';

export interface Activity {
  id: string;
  timestamp: number;
  action: string;
  details?: any;
}

interface AIContextType {
  activities: Activity[];
  logActivity: (action: string, details?: any) => void;
  insight: string;
  isAnalyzing: boolean;
  aiSummary: string;
  summarizeChat: (messages: { sender: string; text: string }[]) => void;
  clearSummary: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<Activity[]>(() => {
    try { return JSON.parse(localStorage.getItem('tasky_ai_logs') ?? '[]') as Activity[] }
    catch { return [] }
  });
  const [insight, setInsight]       = useState<string>("Initializing monitoring protocols...");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSummary, setAiSummary]   = useState('');
  const location                    = useLocation();
  const { connected, publicKey }    = useWallet();

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('tasky_ai_logs', JSON.stringify(activities));
  }, [activities]);

  const logActivity = (action: string, details?: any) => {
    const newActivity: Activity = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      action,
      details,
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 50));
  };

  // AI summarizer — reads messages and generates a human-like summary
  const summarizeChat = (messages: { sender: string; text: string }[]) => {
    if (messages.length === 0) return;
    setAiSummary('');
    setIsAnalyzing(true);

    setTimeout(() => {
      const count    = messages.length;
      const senders  = [...new Set(messages.map(m => m.sender.slice(0, 6)))];
      const keywords: string[] = [];
      const texts    = messages.map(m => m.text.toLowerCase()).join(' ');

      if (texts.includes('meet') || texts.includes('call'))       keywords.push('a video call');
      if (texts.includes('deadline') || texts.includes('by'))     keywords.push('a deadline');
      if (texts.includes('paid') || texts.includes('payment'))    keywords.push('payment confirmation');
      if (texts.includes('done') || texts.includes('finished'))   keywords.push('task completion');
      if (texts.includes('help') || texts.includes('explain'))    keywords.push('clarification needed');

      const keyStr = keywords.length > 0 ? `Key topics: ${keywords.join(', ')}.` : 'General coordination discussion.';
      const summary = `${count} messages exchanged between ${senders.length} participant${senders.length > 1 ? 's' : ''}. ${keyStr} The conversation appears to be ${messages.length > 5 ? 'progressing well' : 'in early stages'}.`;

      setAiSummary(summary);
      setIsAnalyzing(false);
      logActivity('AI Chat Summary generated');
    }, 1800);
  };

  const clearSummary = () => setAiSummary('');

  // Auto-log route changes
  useEffect(() => {
    logActivity(`Navigated → ${location.pathname}`);
  }, [location.pathname]);

  // Auto-log wallet changes
  useEffect(() => {
    if (connected && publicKey) {
      logActivity(`Wallet connected: ${publicKey.toBase58().substring(0, 8)}...`);
    }
  }, [connected, publicKey]);

  // AI analysis
  useEffect(() => {
    if (activities.length === 0) return;
    setIsAnalyzing(true);
    const timeout = setTimeout(() => {
      const recent = activities[0];
      let newInsight = '';
      const a = recent.action;

      if (a.includes('/create'))       newInsight = "User preparing to post a task. Escrow system ready to lock funds on-chain.";
      else if (a.includes('/expert'))  newInsight = "Expert marketplace active. Scanning for high-value open bounties.";
      else if (a.includes('/client'))  newInsight = "Client portal open. Monitoring active escrow balances.";
      else if (a.includes('/analytics')) newInsight = "Analytics dashboard opened. Rendering financial intelligence charts.";
      else if (a.includes('/tasks'))   newInsight = "Task detail view. Tracking escrow state and participant roles.";
      else if (a.includes('Wallet'))   newInsight = "Wallet auth confirmed. Secure channel to Solana Devnet established.";
      else if (a.includes('Task Created'))  newInsight = "New escrow funded! Smart contract interaction confirmed on Devnet.";
      else if (a.includes('Task Accepted')) newInsight = "Agreement reached. Expert-client relationship established on-chain.";
      else if (a.includes('Escrow Released')) newInsight = "SOL transferred! Escrow successfully resolved via Anchor program.";
      else if (a.includes('Dispute'))  newInsight = "Dispute detected. Admin arbitration protocol initiated.";
      else                             newInsight = "Monitoring continuous stream... All systems nominal.";

      setInsight(newInsight);
      setIsAnalyzing(false);
    }, 1200);
    return () => clearTimeout(timeout);
  }, [activities]);

  return (
    <AIContext.Provider value={{ activities, logActivity, insight, isAnalyzing, aiSummary, summarizeChat, clearSummary }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) throw new Error('useAI must be used within an AIProvider');
  return context;
};
