import React, { useState, useEffect, useMemo } from 'react';
import { HeaderLight } from '../components/HeaderLight';
import { userDataService } from '../services/userDataService';
import { LegalDisclaimer } from '../components/LegalDisclaimer';

interface ScorecardCategory {
  id: string;
  name: string;
  description: string;
}

const categories: ScorecardCategory[] = [
  {
    id: 'uniqueness',
    name: 'How Unique Is This Product',
    description: 'Does a product like this already exist? If a product exactly like this already exists then 1 if it\'s completely unique then 10'
  },
  {
    id: 'betterThanCompetition',
    name: 'How Much Better Than The Competition Is Your Product',
    description: 'This is a subjective score with 1 being it\'s the same and 10 being it\'s a no brainer that I have a better product'
  },
  {
    id: 'brandable',
    name: 'How Brandable Is It',
    description: 'Is this a product that would benefit from having a strong brand 1 being something that people don\'t care about having a branded product for to 10 being something like clothing or a status symbol where they want a high quality brand. Almost everything could benefit from a brand.'
  },
  {
    id: 'viral',
    name: 'How Viral Is The Product',
    description: 'Is this something that people will see and want to buy, is it something that people would want to share on social media 1 being something generic like a toilet plunger no one wants to 10 being fidget spinners or something that people really want to share and talk about'
  },
  {
    id: 'easyToShip',
    name: 'Is It Easy to ship',
    description: 'Ideally under a pound and relatively small in size, not breakable etc. 1 being something large and breakable like large pane of glass and 10 being something small and lightweight that is not breakable'
  },
  {
    id: 'premium',
    name: 'How Premium Is Your Product',
    description: 'Can you find a way to make your product the best 1 being it\'s worse then what\'s already out there and 10 being it is the best product out there by a wide margin'
  },
  {
    id: 'reorderPotential',
    name: 'Reorder Potential',
    description: 'Is your product consumable or would they be likely to reorder it 1 being they will never reorder it and 10 being they have to buy it at least once a month. You can go somewhere in between if you think people would buy it more then once a month as a gift or something like that, also if it\'s a once a year repurchase I would say that is a 5'
  },
  {
    id: 'influencers',
    name: 'Influencers Likely To Promote',
    description: 'Is this something that influencers on social media would want to promote 1 being they wouldn\'t be caught dead sharing your product 10 being they would look cool by sharing your product'
  },
  {
    id: 'profitability',
    name: 'Profitability',
    description: 'At least a 3x profitability = 7 4x = 8 5x = 9 6x+ =10'
  },
  {
    id: 'easeOfManufacturing',
    name: 'Ease of Manufacturing',
    description: 'Is this something that will be easy to manufacturer 1 being it\'s going to be complicated and there are not many people that can make this product, you need to go with different suppliers and manufacturers 10 being this is a product that many companies can manufacturer'
  },
  {
    id: 'barrierToEntry',
    name: 'Barrier to Entry',
    description: 'In many ways this is the opposite of the previous point but not always, sometimes it is easy for you to manufacturer but hard for your competition because maybe you have a supplier or something that wouldn\'t easily be able to find but for you it\'s easy. 1 being any one can do this, it\'s super easy to copy my product 10 being I am the only one in the world that can do this'
  },
  {
    id: 'marketSize',
    name: 'How Big Is the Potential Market',
    description: 'This is subjective and depends on your goals but 1 would be a product that only a very small number of people would ever buy from 10 being just about everyone could eventually buy this product.'
  },
  {
    id: 'competition',
    name: 'How much competition is there',
    description: '1 being there are more then 20 direct competitors 10 being there are no competitors'
  },
  {
    id: 'growingTrend',
    name: 'Growing trend',
    description: 'Is this something that is going to gain popularity overtime'
  },
  {
    id: 'evergreen',
    name: 'Is This Product Evergreen or Seasonal',
    description: 'Is this a product that people will be buying year round at roughly the same rate then put a 10 if it\'s very seasonal only 1 month out of the year put a 1'
  }
];

/* ───── keyword research model ───────────────────────────────── */

type ResearchTool = 'smartscout' | 'helium10';

interface Keyword {
  id: string;
  name: string;
  searchVolume: number;
  opportunityScore: number;
}

const MAX_KEYWORDS = 6;

const emptyKeyword = (): Keyword => ({
  id: `kw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: '',
  searchVolume: 0,
  opportunityScore: 0,
});

/** 0 → 0, 1,000 → 5, 5,000+ → 10 (linear between). */
function volumeScore(totalVolume: number): number {
  if (totalVolume <= 0) return 0;
  if (totalVolume >= 5000) return 10;
  if (totalVolume >= 1000) {
    return 5 + ((totalVolume - 1000) / 4000) * 5;
  }
  return (totalVolume / 1000) * 5;
}

/** Ratio = opportunity / volume. <1x → 0, 1x → 2, 2x → 5, 3x+ → 10 (linear between). */
function opportunityScoreFromRatio(ratio: number): number {
  if (!isFinite(ratio) || ratio < 1) return 0;
  if (ratio >= 3) return 10;
  if (ratio >= 2) return 5 + (ratio - 2) * 5;      // 2x → 5, 3x → 10
  return 2 + (ratio - 1) * 3;                       // 1x → 2, 2x → 5
}

function ratioTier(ratio: number): { label: string; color: string; bg: string; border: string } {
  if (!isFinite(ratio) || ratio < 1) {
    return { label: 'Not relevant', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
  }
  if (ratio < 2) {
    return { label: 'Weak ratio', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' };
  }
  if (ratio < 3) {
    return { label: 'Decent ratio', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' };
  }
  return { label: 'Great ratio', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' };
}

function volumeTier(total: number): { label: string; color: string; bg: string; border: string } {
  if (total < 1000) {
    return { label: 'Below floor', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
  }
  if (total < 2500) {
    return { label: 'Baseline', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' };
  }
  if (total < 5000) {
    return { label: 'Strong', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
  }
  return { label: 'Maxed out', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' };
}

/* ───── storage helpers ──────────────────────────────────────── */

const STORAGE_KEY = 'productScorecardState_v2';

interface SavedState {
  productIdea?: string;
  researchTool?: ResearchTool;
  keywords?: Keyword[];
  scores?: Record<string, number>;
}

function loadSaved(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/* ───── login (unchanged behavior) ───────────────────────────── */

function LoginSection({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('userData');
    if (savedData) {
      const data = JSON.parse(savedData);
      if (data.email) {
        setIsLoggedIn(true);
        setEmail(data.email);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await userDataService.updateEmail(email);
      setIsLoggedIn(true);
      onLogin(email);
    } catch (error) {
      console.error('Error saving email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoggedIn) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-xl px-4 py-3 mb-6 text-sm text-green-800 font-medium">
        ✓ Logged in as {email}
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Login to save your scorecard</h3>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="flex-1 px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

/* ───── keyword row ──────────────────────────────────────────── */

function KeywordRow({
  index,
  keyword,
  researchTool,
  onChange,
  onRemove,
  removable,
}: {
  index: number;
  keyword: Keyword;
  researchTool: ResearchTool;
  onChange: (patch: Partial<Keyword>) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  const ratio = keyword.searchVolume > 0 ? keyword.opportunityScore / keyword.searchVolume : 0;
  const tier = keyword.searchVolume > 0 && keyword.opportunityScore > 0 ? ratioTier(ratio) : null;
  const oppLabel = researchTool === 'smartscout' ? 'Opportunity Score' : 'Cerebro IQ Score';

  return (
    <div
      className={`relative rounded-xl border-2 bg-white shadow-sm p-4 transition-all ${
        tier ? tier.border : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center justify-center text-sm">
          {index + 1}
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_140px_160px] gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Keyword</label>
            <input
              type="text"
              value={keyword.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g. silicone kitchen tongs"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Search Volume</label>
            <input
              type="number"
              min="0"
              value={keyword.searchVolume === 0 ? '' : keyword.searchVolume}
              onChange={(e) => onChange({ searchVolume: Math.max(0, parseInt(e.target.value || '0', 10) || 0) })}
              placeholder="0"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{oppLabel}</label>
            <input
              type="number"
              min="0"
              value={keyword.opportunityScore === 0 ? '' : keyword.opportunityScore}
              onChange={(e) => onChange({ opportunityScore: Math.max(0, parseInt(e.target.value || '0', 10) || 0) })}
              placeholder="0"
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="flex-shrink-0 w-8 h-8 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center"
            aria-label="Remove keyword"
          >
            ×
          </button>
        )}
      </div>

      {tier && (
        <div className={`mt-3 flex items-center justify-between text-xs ${tier.bg} ${tier.color} rounded-lg px-3 py-2`}>
          <span className="font-semibold">{tier.label}</span>
          <span>Ratio: <span className="font-bold">{ratio.toFixed(2)}x</span> ({oppLabel.toLowerCase()} / volume)</span>
        </div>
      )}
    </div>
  );
}

/* ───── keyword research block ───────────────────────────────── */

function KeywordResearch({
  researchTool,
  setResearchTool,
  keywords,
  setKeywords,
  totalVolume,
  weightedRatio,
  volumePoints,
  opportunityPoints,
}: {
  researchTool: ResearchTool;
  setResearchTool: (t: ResearchTool) => void;
  keywords: Keyword[];
  setKeywords: React.Dispatch<React.SetStateAction<Keyword[]>>;
  totalVolume: number;
  weightedRatio: number;
  volumePoints: number;
  opportunityPoints: number;
}) {
  const addKeyword = () => {
    if (keywords.length >= MAX_KEYWORDS) return;
    setKeywords(prev => [...prev, emptyKeyword()]);
  };

  const updateKeyword = (id: string, patch: Partial<Keyword>) => {
    setKeywords(prev => prev.map(k => (k.id === id ? { ...k, ...patch } : k)));
  };

  const removeKeyword = (id: string) => {
    setKeywords(prev => prev.filter(k => k.id !== id));
  };

  const vTier = volumeTier(totalVolume);
  const rTier = weightedRatio > 0 ? ratioTier(weightedRatio) : null;

  return (
    <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Keyword Research</h2>
          <p className="text-sm text-gray-600">Stack up to {MAX_KEYWORDS} keywords. We want volume to clear 1,000 and the opportunity ratio to hit 3x.</p>
        </div>
        <div className="inline-flex rounded-lg bg-gray-100 p-1 self-start">
          <button
            type="button"
            onClick={() => setResearchTool('smartscout')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              researchTool === 'smartscout'
                ? 'bg-white text-blue-700 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            SmartScout
          </button>
          <button
            type="button"
            onClick={() => setResearchTool('helium10')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              researchTool === 'helium10'
                ? 'bg-white text-blue-700 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Helium10
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {keywords.map((kw, i) => (
          <KeywordRow
            key={kw.id}
            index={i}
            keyword={kw}
            researchTool={researchTool}
            onChange={(patch) => updateKeyword(kw.id, patch)}
            onRemove={() => removeKeyword(kw.id)}
            removable={keywords.length > 1}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addKeyword}
        disabled={keywords.length >= MAX_KEYWORDS}
        className="w-full border-2 border-dashed border-gray-300 text-gray-600 font-semibold rounded-xl py-3 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {keywords.length >= MAX_KEYWORDS ? 'Max keywords reached' : '+ Add Keyword'}
      </button>

      {/* live totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
        <div className={`rounded-xl border-2 ${vTier.border} ${vTier.bg} p-4`}>
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Search Volume</div>
            <div className={`text-xs font-bold ${vTier.color}`}>{vTier.label}</div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-2xl font-bold text-gray-900">{totalVolume.toLocaleString()}</div>
            <div className="text-xs text-gray-500">target 1,000 to 5,000+</div>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/70 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-emerald-500 transition-all"
              style={{ width: `${Math.min(100, (totalVolume / 5000) * 100)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-600">Scores <span className="font-bold">{volumePoints.toFixed(1)} / 10</span></div>
        </div>

        <div className={`rounded-xl border-2 ${rTier ? rTier.border : 'border-gray-200'} ${rTier ? rTier.bg : 'bg-gray-50'} p-4`}>
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Opportunity Ratio</div>
            <div className={`text-xs font-bold ${rTier ? rTier.color : 'text-gray-500'}`}>{rTier ? rTier.label : 'Add data'}</div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-2xl font-bold text-gray-900">{weightedRatio > 0 ? `${weightedRatio.toFixed(2)}x` : '—'}</div>
            <div className="text-xs text-gray-500">target 3x+</div>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/70 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 via-yellow-400 to-green-500 transition-all"
              style={{ width: `${Math.min(100, (weightedRatio / 3) * 100)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-600">Scores <span className="font-bold">{opportunityPoints.toFixed(1)} / 10</span></div>
        </div>
      </div>
    </div>
  );
}

/* ───── live score chip (sticky) ─────────────────────────────── */

function StickyScore({ score }: { score: number }) {
  const rounded = Math.round(score);
  const tone =
    score >= 80 ? 'from-emerald-500 to-green-600'
    : score >= 70 ? 'from-blue-500 to-indigo-600'
    : score >= 60 ? 'from-yellow-500 to-amber-600'
    : 'from-red-500 to-rose-600';

  return (
    <div className="sticky top-4 z-10 mb-6">
      <div className={`bg-gradient-to-r ${tone} text-white rounded-2xl shadow-lg px-5 py-3 flex items-center justify-between`}>
        <div className="text-sm font-semibold uppercase tracking-wide opacity-90">Live Score</div>
        <div className="text-3xl font-bold tabular-nums">{rounded}</div>
      </div>
    </div>
  );
}

/* ───── final score display ──────────────────────────────────── */

function ScoreDisplay({ score, productIdea }: { score: number; productIdea: string }) {
  const getRecommendation = (score: number): { text: string; color: string; bgColor: string; emoji: string } => {
    if (score >= 90) return { text: 'Amazing Product', color: 'text-green-800', bgColor: 'bg-green-100', emoji: '🔥' };
    if (score >= 80) return { text: 'This is a great product', color: 'text-green-700', bgColor: 'bg-green-50', emoji: '✨' };
    if (score >= 70) return { text: 'This is a really good product and should be a winner', color: 'text-blue-700', bgColor: 'bg-blue-50', emoji: '🚀' };
    if (score >= 60) return { text: 'Average Product I Would Go For It If You Have No Better Ideas', color: 'text-yellow-700', bgColor: 'bg-yellow-50', emoji: '🤔' };
    return { text: 'I would personally Avoid This Product', color: 'text-red-700', bgColor: 'bg-red-50', emoji: '⚠️' };
  };

  const recommendation = getRecommendation(score);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-xl p-8 border-2 border-blue-200 mt-8">
      <div className="text-center">
        {productIdea && (
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Product idea</div>
        )}
        {productIdea && (
          <div className="text-xl font-bold text-gray-900 mb-4">{productIdea}</div>
        )}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Product Score</h2>
        <div className="text-6xl font-bold text-blue-600 mb-4 tabular-nums">{Math.round(score)}</div>
        <div className={`inline-block px-6 py-3 rounded-lg font-semibold ${recommendation.bgColor} ${recommendation.color}`}>
          <span className="mr-2">{recommendation.emoji}</span>
          {recommendation.text}
        </div>
      </div>
    </div>
  );
}

/* ───── page ─────────────────────────────────────────────────── */

export function ProductScorecard() {
  const [productIdea, setProductIdea] = useState('');
  const [researchTool, setResearchTool] = useState<ResearchTool>('smartscout');
  const [keywords, setKeywords] = useState<Keyword[]>([emptyKeyword()]);
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    categories.forEach(cat => { initial[cat.id] = 5; });
    return initial;
  });
  const [, setUserEmail] = useState('');

  // Hydrate from storage (new key first, then legacy fallback for old slider state).
  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      if (saved.productIdea) setProductIdea(saved.productIdea);
      if (saved.researchTool) setResearchTool(saved.researchTool);
      if (saved.keywords && saved.keywords.length > 0) setKeywords(saved.keywords);
      if (saved.scores) setScores(prev => ({ ...prev, ...saved.scores }));
      return;
    }
    const legacy = localStorage.getItem('productScorecardScores');
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        setScores(prev => ({ ...prev, ...parsed }));
      } catch { /* no-op */ }
    }
  }, []);

  // Persist on every change.
  useEffect(() => {
    const payload: SavedState = { productIdea, researchTool, keywords, scores };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [productIdea, researchTool, keywords, scores]);

  const handleScoreChange = (categoryId: string, value: number) => {
    setScores(prev => ({ ...prev, [categoryId]: value }));
  };

  const totalVolume = useMemo(
    () => keywords.reduce((sum, k) => sum + (k.searchVolume || 0), 0),
    [keywords]
  );

  const totalOpportunity = useMemo(
    () => keywords.reduce((sum, k) => sum + (k.opportunityScore || 0), 0),
    [keywords]
  );

  const weightedRatio = totalVolume > 0 ? totalOpportunity / totalVolume : 0;
  const volumePoints = volumeScore(totalVolume);
  const opportunityPoints = opportunityScoreFromRatio(weightedRatio);

  const totalScore = useMemo(() => {
    const subjective = Object.values(scores).reduce((sum, s) => sum + s, 0);
    const combined = subjective + volumePoints + opportunityPoints;
    const maxPossible = categories.length * 10 + 20; // +10 for volume, +10 for opportunity
    return (combined / maxPossible) * 100;
  }, [scores, volumePoints, opportunityPoints]);

  const handleReset = () => {
    if (!window.confirm('Reset the whole scorecard? This cannot be undone.')) return;
    const resetScores: Record<string, number> = {};
    categories.forEach(cat => { resetScores[cat.id] = 5; });
    setScores(resetScores);
    setKeywords([emptyKeyword()]);
    setProductIdea('');
    setResearchTool('smartscout');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('productScorecardScores');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <HeaderLight />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">Product Scorecard</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Score your idea on real keyword data plus 15 fundamentals. Watch the number move as you go.
          </p>
        </div>

        <LoginSection onLogin={setUserEmail} />

        <StickyScore score={totalScore} />

        {/* product idea */}
        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-6 mb-6">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            What is the product idea?
          </label>
          <input
            type="text"
            value={productIdea}
            onChange={(e) => setProductIdea(e.target.value)}
            placeholder="e.g. silicone cooking tongs with a hidden spoon"
            className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-2 text-xs text-gray-500">Saved locally so you can come back and keep scoring.</p>
        </div>

        {/* keyword research */}
        <KeywordResearch
          researchTool={researchTool}
          setResearchTool={setResearchTool}
          keywords={keywords}
          setKeywords={setKeywords}
          totalVolume={totalVolume}
          weightedRatio={weightedRatio}
          volumePoints={volumePoints}
          opportunityPoints={opportunityPoints}
        />

        {/* fundamentals */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Product Fundamentals</h2>
          <p className="text-sm text-gray-600 mb-5">Score each on a 1 to 10 scale. Defaults to 5.</p>

          <div className="space-y-4">
            {categories.map((category) => {
              const value = scores[category.id];
              const barColor =
                value >= 8 ? 'accent-emerald-600'
                : value >= 6 ? 'accent-blue-600'
                : value >= 4 ? 'accent-yellow-500'
                : 'accent-red-500';
              return (
                <div
                  key={category.id}
                  className="bg-white rounded-xl shadow-sm p-5 border-2 border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-gray-900">{category.name}</div>
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    </div>
                    <div className="flex-shrink-0 w-14 h-14 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
                      <span className="text-2xl font-bold text-blue-600 tabular-nums">{value}</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={value}
                    onChange={(e) => handleScoreChange(category.id, parseInt(e.target.value))}
                    className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${barColor}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <button
            onClick={handleReset}
            className="bg-red-500 text-white font-bold px-8 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Reset Scorecard
          </button>
        </div>

        <ScoreDisplay score={totalScore} productIdea={productIdea} />
      </div>
      <LegalDisclaimer />
    </div>
  );
}

export default ProductScorecard;
