import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const SolanaPriceChart: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=7');
        const json = await res.json();
        
        if (json.prices) {
          const formattedData = json.prices.map((item: [number, number]) => {
            const date = new Date(item[0]);
            return {
              time: date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric' }),
              price: item[1]
            };
          });
          
          setData(formattedData);
          setCurrentPrice(json.prices[json.prices.length - 1][1]);
        }
      } catch (e) {
        console.error("Failed to fetch SOL price", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrice();
  }, []);

  if (loading) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a8a70', background: 'rgba(20,241,149,0.03)', border: '1px solid rgba(20,241,149,0.15)', borderRadius: 16 }}>
        <span className="spinner" style={{ marginRight: 12 }}></span> Loading market data...
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: 'rgba(20,241,149,0.03)', border: '1px solid rgba(20,241,149,0.15)', borderRadius: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#5a8a70', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Solana (SOL) Real Value</h3>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#e0ffe8', fontFamily: "'Share Tech Mono', monospace", lineHeight: 1.2 }}>
          ${currentPrice?.toFixed(2)}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#14F195', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#14F195', display: 'inline-block', boxShadow: '0 0 8px #14F195' }}></span>
          Live from CoinGecko (Last 7 Days)
        </div>
      </div>
      
      <div style={{ height: 200, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14F195" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#14F195" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip 
              contentStyle={{ background: 'rgba(1,10,4,0.95)', border: '1px solid rgba(20,241,149,0.3)', borderRadius: 8, color: '#e0ffe8', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
              itemStyle={{ color: '#14F195', fontWeight: 800, fontFamily: "'Share Tech Mono', monospace", fontSize: '1.2rem' }}
              labelStyle={{ color: '#5a8a70', marginBottom: 4, fontSize: '0.8rem', textTransform: 'uppercase' }}
              formatter={(value: unknown) => [`$${(value as number).toFixed(2)}`, '']}
              separator=""
            />
            <Area type="monotone" dataKey="price" stroke="#14F195" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" animationDuration={1500} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
