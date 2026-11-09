/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MarketAsset, 
  BrainPrediction, 
  UserTrade 
} from './types.js';
import { AssetLogo } from './components/AssetLogo.tsx';
import { AITradeHubModal } from './components/AITradeHubModal.tsx';
import { fetchMarketsClient, fetchPredictionClient } from './services/apiClient.js';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Search,
  Activity,
  ShieldCheck,
  DollarSign
} from 'lucide-react';

const INITIAL_MARKETS: MarketAsset[] = [
  { symbol: 'BTC/USD', name: 'Bitcoin', category: 'crypto', sector: 'Crypto', region: 'Global', price: 75200.50, change24h: 1840.20, change24hPercent: 2.51, high24h: 76100.00, low24h: 73800.00, volume24h: '34.2B', currency: 'USD', precision: 2, lastUpdated: '12:00:00 PM' },
  { symbol: 'ETH/USD', name: 'Ethereum', category: 'crypto', sector: 'Crypto', region: 'Global', price: 2840.10, change24h: -45.30, change24hPercent: -1.57, high24h: 2910.00, low24h: 2810.00, volume24h: '18.5B', currency: 'USD', precision: 2, lastUpdated: '12:00:00 PM' },
  { symbol: 'SOL/USD', name: 'Solana', category: 'crypto', sector: 'Crypto', region: 'Global', price: 194.80, change24h: 8.40, change24hPercent: 4.50, high24h: 198.50, low24h: 185.20, volume24h: '4.8B', currency: 'USD', precision: 2, lastUpdated: '12:00:00 PM' },
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'stock', sector: 'Tech', region: 'USA', price: 235.40, change24h: 3.10, change24hPercent: 1.33, high24h: 237.00, low24h: 232.10, volume24h: '48.2M', currency: 'USD', precision: 2, lastUpdated: '12:00:00 PM' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', category: 'stock', sector: 'Tech', region: 'USA', price: 422.50, change24h: 5.20, change24hPercent: 1.25, high24h: 425.00, low24h: 418.00, volume24h: '22.1M', currency: 'USD', precision: 2, lastUpdated: '12:00:00 PM' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'stock', sector: 'Tech', region: 'USA', price: 145.80, change24h: 6.40, change24hPercent: 4.59, high24h: 147.20, low24h: 139.50, volume24h: '85.4M', currency: 'USD', precision: 2, lastUpdated: '12:00:00 PM' },
  { symbol: 'GOLD', name: 'Gold (XAU/USD)', category: 'commodity', sector: 'Commodity', region: 'Global', price: 2685.40, change24h: 14.50, change24hPercent: 0.54, high24h: 2695.00, low24h: 2670.00, volume24h: '12.4B', currency: 'USD', precision: 2, unit: 'oz', lastUpdated: '12:00:00 PM' },
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', category: 'forex', sector: 'Forex', region: 'Europe/USA', price: 1.0845, change24h: -0.0012, change24hPercent: -0.11, high24h: 1.0880, low24h: 1.0830, volume24h: '45B', currency: 'USD', precision: 4, lastUpdated: '12:00:00 PM' },
];

export default function App() {
  const [markets, setMarkets] = useState<MarketAsset[]>(INITIAL_MARKETS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC/USD');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userTrades, setUserTrades] = useState<UserTrade[]>([]);
  const [activeStudies] = useState<string[]>(['BOL', 'RSI']);
  const [isDemoTrade, setIsDemoTrade] = useState<boolean>(true);
  const [tradeAmount, setTradeAmount] = useState<number>(500);
  const [prediction, setPrediction] = useState<BrainPrediction | null>(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState<boolean>(false);
  const [orderFeedback, setOrderFeedback] = useState<string | null>(null);
  const [isAITradeHubOpen, setIsAITradeHubOpen] = useState<boolean>(false);

  const activeAsset = useMemo(() => 
    markets.find((m) => m.symbol === selectedSymbol) || markets[0], 
    [markets, selectedSymbol]
  );

  const filteredMarkets = useMemo(() => {
    if (selectedCategory === 'all') return markets;
    return markets.filter(m => m.category === selectedCategory);
  }, [markets, selectedCategory]);

  const loadMarkets = useCallback(async () => {
    try {
      const data = await fetchMarketsClient();
      if (Array.isArray(data) && data.length > 0) {
        setMarkets(data);
      }
    } catch (err) {
      console.error('Markets fetch error:', err);
    }
  }, []);

  const loadPrediction = useCallback(async (symbol: string) => {
    try {
      if (!prediction) {
        setIsLoadingPrediction(true);
      }
      const currentPr = markets.find(m => m.symbol === symbol)?.price || 75000;
      const pred = await fetchPredictionClient(symbol, currentPr);
      if (pred) {
        setPrediction(pred);
      }
    } catch (err) {
      console.error('Prediction fetch error:', err);
    } finally {
      setIsLoadingPrediction(false);
    }
  }, [markets, prediction]);

  useEffect(() => {
    loadMarkets();
    const timer = setInterval(() => loadMarkets(), 800);
    return () => clearInterval(timer);
  }, [loadMarkets]);

  const [lastPrice, setLastPrice] = useState<number>(0);
  const [priceTickDir, setPriceTickDir] = useState<'UP' | 'DOWN' | null>(null);

  useEffect(() => {
    if (activeAsset && activeAsset.price !== lastPrice) {
      setPriceTickDir(activeAsset.price > lastPrice ? 'UP' : 'DOWN');
      setLastPrice(activeAsset.price);
      const timer = setTimeout(() => setPriceTickDir(null), 500);
      return () => clearTimeout(timer);
    }
  }, [activeAsset, lastPrice]);

  useEffect(() => {
    if (selectedSymbol) {
      loadPrediction(selectedSymbol);
    }
  }, [selectedSymbol]);

  const handleAction = (type: 'LONG' | 'SHORT' | 'BUY' | 'SELL') => {
    if (!activeAsset) return;
    
    const units = tradeAmount / activeAsset.price;
    const newTrade: UserTrade = {
      id: Math.random().toString(36).substring(7),
      symbol: selectedSymbol,
      type,
      price: activeAsset.price,
      amount: Number(units.toFixed(4)),
      time: new Date().toLocaleString(),
      status: 'OPEN',
      isDemo: isDemoTrade,
    };

    setUserTrades([newTrade, ...userTrades]);
    setOrderFeedback(`${isDemoTrade ? '[DEMO]' : '[REAL]'} ${type} Order Executed: $${tradeAmount} (${units.toFixed(4)} ${selectedSymbol.split('/')[0]}) @ $${activeAsset.price}`);
    setTimeout(() => setOrderFeedback(null), 4000);
  };

  const getStudiesParam = () => {
    const studyMap: Record<string, string> = {
      BOL: 'BollingerBands@tv-basicstudies',
      RSI: 'RSI@tv-basicstudies',
      MACD: 'MACD@tv-basicstudies',
    };
    const studies = activeStudies.map((s) => studyMap[s]).filter(Boolean);
    return encodeURIComponent(JSON.stringify(studies));
  };

  const getTradingViewSymbol = (sym: string, asset?: MarketAsset) => {
    if (sym === 'BTC/USD') return 'BINANCE:BTCUSDT';
    if (sym === 'ETH/USD') return 'BINANCE:ETHUSDT';
    if (sym === 'SOL/USD') return 'BINANCE:SOLUSDT';
    if (sym === 'BNB/USD') return 'BINANCE:BNBUSDT';
    if (sym === 'XRP/USD') return 'BINANCE:XRPUSDT';
    if (sym === 'OIL_WTI') return 'NYMEX:CL1!';
    if (sym === 'OIL_BRENT') return 'TVC:UKOIL';
    if (sym === 'GOLD') return 'COMEX:GC1!';
    if (sym === 'SILVER') return 'COMEX:SI1!';
    if (sym === 'NATGAS') return 'NYMEX:NG1!';
    if (asset?.category === 'forex') return 'FX_IDC:' + sym.replace('/', '');
    if (sym.startsWith('^')) return 'INDEX:' + sym.replace('^', '');
    return sym;
  };

  const isPriceUp = activeAsset ? activeAsset.change24hPercent >= 0 : true;

  return (
    <div className="bg-black text-white antialiased min-h-screen flex flex-col font-sans selection:bg-emerald-400 selection:text-black">
      
      {/* Toast Notification */}
      {orderFeedback && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-lg shadow-2xl animate-in fade-in slide-in-from-top-4">
          {orderFeedback}
        </div>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 pb-20">
        
        {/* Navigation & Asset Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button className="text-neutral-500 hover:text-white transition-colors cursor-pointer hidden sm:block">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <AssetLogo symbol={selectedSymbol} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase">{selectedSymbol.split('/')[0]}</h1>
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-widest">{activeAsset?.name} ({activeAsset?.category})</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
             <button 
              onClick={() => setIsDemoTrade(!isDemoTrade)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${isDemoTrade ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'}`}
             >
               {isDemoTrade ? 'Demo Mode' : 'Live Mode'}
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Data & Chart */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Price Overview - Always White */}
            <div className="flex flex-wrap items-baseline justify-between sm:justify-start gap-4 bg-neutral-900/40 p-4 rounded-2xl border border-neutral-800">
              <div>
                <span className="text-3xl sm:text-5xl font-black tracking-tighter tabular-nums text-white block">
                  ${activeAsset?.price.toLocaleString(undefined, { minimumFractionDigits: activeAsset?.precision || 2 })}
                </span>
                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Real-time Spot Quote</span>
              </div>
              <div className="flex flex-col items-end sm:items-start">
                <span className={`text-base sm:text-lg font-black font-mono ${isPriceUp ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {isPriceUp ? '▲' : '▼'} {Math.abs(activeAsset?.change24hPercent || 0).toFixed(2)}%
                </span>
                <div className="flex items-center gap-1">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${priceTickDir === 'UP' ? 'bg-emerald-500' : priceTickDir === 'DOWN' ? 'bg-rose-500' : 'bg-neutral-800'}`}></div>
                   <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">Live Tick</span>
                </div>
              </div>
            </div>

            {/* Pressure Bar */}
            <div className="space-y-2 px-1">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-500">
                <span className="text-emerald-400">Demand: {isPriceUp ? 58 : 42}%</span>
                <span className="text-rose-500">Distribution: {isPriceUp ? 42 : 58}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${isPriceUp ? 58 : 42}%` }}></div>
                <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${isPriceUp ? 42 : 58}%` }}></div>
              </div>
            </div>

            {/* TradingView Chart - Responsive Height for Mobile with Brand Mask */}
            <div className="w-full h-[380px] sm:h-[500px] bg-neutral-950 border border-neutral-900 overflow-hidden relative rounded-2xl">
              <iframe
                key={selectedSymbol}
                title="TradingView Chart"
                src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_762c4&symbol=${encodeURIComponent(getTradingViewSymbol(selectedSymbol, activeAsset))}&interval=1&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=0&saveimage=0&toolbarbg=000000&theme=dark&style=1&timezone=Etc%2FUTC&studies=${getStudiesParam()}&locale=en&utm_source=onpiks.com&allow_symbol_change=0&hideideas=1&show_popup_button=0&enable_publishing=0`}
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
              />
              {/* Brand Watermark Mask Overlay */}
              <div className="absolute bottom-0 left-0 h-7 w-36 bg-neutral-950 pointer-events-none z-10"></div>
            </div>

            {/* SIGNAL BOX AREA - Responsive Stack */}
            {isLoadingPrediction ? (
              <div className="p-6 bg-neutral-900/50 rounded-2xl border border-white/5 animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-neutral-800 rounded-xl shrink-0"></div>
                  <div className="space-y-2">
                    <div className="h-5 w-28 bg-neutral-800 rounded"></div>
                    <div className="h-3 w-40 bg-neutral-800 rounded"></div>
                  </div>
                </div>
                <div className="space-y-2 text-right">
                   <div className="h-2 w-16 bg-neutral-800 rounded ml-auto"></div>
                   <div className="h-5 w-20 bg-neutral-800 rounded ml-auto"></div>
                </div>
              </div>
            ) : prediction ? (
              <div className={`p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 shadow-2xl transition-all duration-500 ${prediction.direction === 'UP' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${prediction.direction === 'UP' ? 'bg-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.3)]' : 'bg-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.3)]'}`}>
                    {prediction.direction === 'UP' ? <TrendingUp className="w-6 h-6 text-black" /> : <TrendingDown className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <span className={`w-2 h-2 rounded-full animate-pulse ${prediction.direction === 'UP' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                       <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">AI Signal Analysis</span>
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
                      {prediction.direction === 'UP' ? 'BUY SIGNAL' : 'SELL SIGNAL'}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Conf: {prediction.confidence}</span>
                       <span className="w-1 h-1 rounded-full bg-neutral-700"></span>
                       <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Expected: +{Math.abs(prediction.predictedCandle.predictedChangePercent).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
                <div className="sm:text-right pt-3 sm:pt-0 border-t sm:border-t-0 border-white/10 flex sm:flex-col justify-between items-center sm:items-end">
                  <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Profit Projection</p>
                  <div>
                    <p className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums">
                      +${(tradeAmount * (Math.abs(prediction.predictedCandle.predictedChangePercent) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <div className="text-[8px] font-bold text-neutral-500 uppercase tracking-tighter">For ${tradeAmount} Position</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Column: Actions & Watchlist */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Instant Execution & Amount Selector */}
            <div className="p-5 sm:p-6 bg-neutral-900/50 rounded-2xl border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400">Position Amount ($)</h3>
                <span className="text-xs font-mono text-emerald-400 font-bold">{(tradeAmount / (activeAsset?.price || 1)).toFixed(4)} {selectedSymbol.split('/')[0]}</span>
              </div>

              {/* Amount Selector Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTradeAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-black font-mono transition-all cursor-pointer border ${tradeAmount === amt ? 'bg-white text-black border-white shadow-lg' : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'}`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="relative flex items-center">
                <DollarSign className="absolute left-4 w-4 h-4 text-neutral-500" />
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full pl-10 pr-4 py-3 bg-black border border-neutral-800 rounded-xl text-white font-mono font-black text-sm focus:outline-none focus:border-white transition-colors"
                  placeholder="Enter custom amount"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <button 
                  onClick={() => handleAction('BUY')}
                  className="py-4 px-4 bg-white hover:bg-neutral-200 text-black font-black text-base sm:text-lg uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer shadow-2xl border border-white/20"
                >
                  <TrendingUp className="w-5 h-5" />
                  BUY
                </button>
                <button 
                  onClick={() => handleAction('SELL')}
                  className="py-4 px-4 bg-black hover:bg-neutral-900 text-white font-black text-base sm:text-lg uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer shadow-2xl border border-white/10"
                >
                  <TrendingDown className="w-5 h-5" />
                  SELL
                </button>
              </div>
            </div>

            {/* Asset Pulse Watchlist with Category Filter Tabs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1">
                <div className="flex items-center gap-2">
                  <Search className="w-3 h-3" />
                  <span>Market Pulse</span>
                </div>
                <span>{filteredMarkets.length} Assets</span>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['all', 'crypto', 'stock', 'forex', 'commodity'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer border ${selectedCategory === cat ? 'bg-white text-black border-white' : 'bg-neutral-900/50 text-neutral-400 border-neutral-800 hover:text-white'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {filteredMarkets.map((m) => (
                  <div 
                    key={m.symbol}
                    onClick={() => {
                      setSelectedSymbol(m.symbol);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer group ${m.symbol === selectedSymbol ? 'bg-white text-black border-white' : 'bg-neutral-900/30 border-neutral-800 hover:border-neutral-700'}`}
                  >
                    <div className="flex items-center gap-3">
                      <AssetLogo symbol={m.symbol} size="sm" />
                      <div>
                        <div className="text-xs font-black uppercase tracking-tight">{m.symbol.split('/')[0]}</div>
                        <div className="text-[7px] font-black text-neutral-500 uppercase tracking-widest">{m.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-black font-mono">${m.price.toLocaleString(undefined, { minimumFractionDigits: m.precision })}</div>
                      <div className={`text-[9px] font-black ${m.symbol === selectedSymbol ? 'text-neutral-500' : (m.change24hPercent >= 0 ? 'text-emerald-400' : 'text-rose-400')}`}>
                        {m.change24hPercent >= 0 ? '+' : ''}{m.change24hPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Simplified Footer Info */}
      <footer className="w-full px-8 py-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-600">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Network: Live</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Feed Latency: 24ms</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
           <span>Terms</span>
           <span>Privacy</span>
           <span>© 2026 Onpiks Terminal</span>
        </div>
      </footer>

      <AITradeHubModal
        isOpen={isAITradeHubOpen}
        onClose={() => setIsAITradeHubOpen(false)}
        markets={markets}
        initialSymbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
      />
    </div>
  );
}
