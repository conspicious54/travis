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
  relevancy: number; // 1–5
}

const MAX_KEYWORDS = 20;
const DEFAULT_CONVERSION_RATE = 0.10;

const emptyKeyword = (): Keyword => ({
  id: `kw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: '',
  searchVolume: 0,
  opportunityScore: 0,
  relevancy: 3,
});

/** Rough Amazon organic CTR by rank position (page 1 = pos 1–16). Values compiled from
 *  public click-share studies; use as directional, not surgical. */
function ctrAtPosition(pos: number): number {
  if (pos <= 1) return 0.28;
  if (pos === 2) return 0.14;
  if (pos === 3) return 0.09;
  if (pos === 4) return 0.06;
  if (pos === 5) return 0.045;
  if (pos <= 10) return 0.025;
  if (pos <= 15) return 0.012;
  if (pos <= 20) return 0.007;
  if (pos <= 30) return 0.004;
  if (pos <= 50) return 0.002;
  return 0.001;
}

/** Estimate the organic rank a listing can realistically land at.
 *  Blends ratio (your "opportunity / volume" bar) with relevancy (1–5).
 *  Quality ∈ [0,1]: 1 = 3x ratio AND perfect relevancy → pos ~3;
 *  Quality 0 → page-two territory. */
function estimatePosition(ratio: number, relevancy: number): number {
  if (!isFinite(ratio) || ratio <= 0) return 60;
  const ratioQuality = Math.min(ratio / 3, 1);
  const relQuality = Math.max(1, Math.min(5, relevancy)) / 5;
  const quality = ratioQuality * relQuality;
  const pos = 3 + Math.pow(1 - quality, 1.5) * 60;
  return Math.round(pos);
}

function estimateMonthlySales(sv: number, pos: number, conversionRate = DEFAULT_CONVERSION_RATE): number {
  if (sv <= 0) return 0;
  return sv * ctrAtPosition(pos) * conversionRate;
}

function relevancyTier(r: number): { label: string; color: string; bg: string } {
  if (r <= 1) return { label: 'Barely related', color: 'text-red-700', bg: 'bg-red-100' };
  if (r === 2) return { label: 'Weak match', color: 'text-orange-700', bg: 'bg-orange-100' };
  if (r === 3) return { label: 'OK match', color: 'text-yellow-700', bg: 'bg-yellow-100' };
  if (r === 4) return { label: 'Strong match', color: 'text-blue-700', bg: 'bg-blue-100' };
  return { label: 'Bullseye', color: 'text-green-700', bg: 'bg-green-100' };
}

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
const IDEAS_KEY = 'productScorecardIdeas_v1';

interface SavedState {
  productIdea?: string;
  researchTool?: ResearchTool;
  keywords?: Keyword[];
  scores?: Record<string, number>;
}

interface IdeaSnapshot {
  productIdea: string;
  researchTool: ResearchTool;
  keywords: Keyword[];
  scores: Record<string, number>;
}

interface SavedIdea {
  id: string;
  name: string;
  savedAt: string; // ISO
  state: IdeaSnapshot;
  computed: {
    totalScore: number;
    totalVolume: number;
    weightedRatio: number;
    volumePoints: number;
    opportunityPoints: number;
    totalMonthlySales: number;
    keywordCount: number;
  };
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

function loadIdeas(): SavedIdea[] {
  try {
    const raw = localStorage.getItem(IDEAS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveIdeas(ideas: SavedIdea[]) {
  try {
    localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas));
  } catch (e) {
    console.error('Could not save ideas', e);
  }
}

function computeMetrics(state: IdeaSnapshot) {
  const totalVolume = state.keywords.reduce((s, k) => s + (k.searchVolume || 0), 0);
  const totalOpportunity = state.keywords.reduce((s, k) => s + (k.opportunityScore || 0), 0);
  const weightedRatio = totalVolume > 0 ? totalOpportunity / totalVolume : 0;
  const volumePoints = volumeScore(totalVolume);
  const opportunityPoints = opportunityScoreFromRatio(weightedRatio);
  const totalMonthlySales = state.keywords.reduce((sum, k) => {
    if (k.searchVolume <= 0 || k.opportunityScore <= 0) return sum;
    const r = k.opportunityScore / k.searchVolume;
    const pos = estimatePosition(r, k.relevancy);
    return sum + estimateMonthlySales(k.searchVolume, pos);
  }, 0);
  const subjective = Object.values(state.scores).reduce((s, v) => s + v, 0);
  const combined = subjective + volumePoints + opportunityPoints;
  const maxPossible = categories.length * 10 + 20;
  const totalScore = (combined / maxPossible) * 100;
  const keywordCount = state.keywords.filter(k => k.searchVolume > 0 && k.opportunityScore > 0).length;
  return { totalScore, totalVolume, weightedRatio, volumePoints, opportunityPoints, totalMonthlySales, keywordCount };
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
  const relTier = relevancyTier(keyword.relevancy);
  const hasData = keyword.searchVolume > 0 && keyword.opportunityScore > 0;
  const estPos = hasData ? estimatePosition(ratio, keyword.relevancy) : null;
  const estSales = estPos !== null ? estimateMonthlySales(keyword.searchVolume, estPos) : 0;

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

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_120px_140px_140px] gap-3">
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
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Search Vol</label>
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

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Relevancy</label>
            <select
              value={keyword.relevancy}
              onChange={(e) => onChange({ relevancy: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value={1}>1 — Barely related</option>
              <option value={2}>2 — Weak match</option>
              <option value={3}>3 — OK match</option>
              <option value={4}>4 — Strong match</option>
              <option value={5}>5 — Bullseye</option>
            </select>
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

      {hasData && tier && estPos !== null && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className={`text-xs ${tier.bg} ${tier.color} rounded-lg px-3 py-2 flex items-center justify-between`}>
            <span className="font-semibold">{tier.label}</span>
            <span>{ratio.toFixed(2)}x</span>
          </div>
          <div className={`text-xs ${relTier.bg} ${relTier.color} rounded-lg px-3 py-2 flex items-center justify-between`}>
            <span className="font-semibold">{relTier.label}</span>
            <span>Rank ~#{estPos}</span>
          </div>
          <div className="text-xs bg-indigo-50 text-indigo-700 rounded-lg px-3 py-2 flex items-center justify-between">
            <span className="font-semibold">Est. sales / mo</span>
            <span className="font-bold">
              {estSales >= 1 ? Math.round(estSales).toLocaleString() : estSales.toFixed(1)}
            </span>
          </div>
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
  totalMonthlySales,
}: {
  researchTool: ResearchTool;
  setResearchTool: (t: ResearchTool) => void;
  keywords: Keyword[];
  setKeywords: React.Dispatch<React.SetStateAction<Keyword[]>>;
  totalVolume: number;
  weightedRatio: number;
  volumePoints: number;
  opportunityPoints: number;
  totalMonthlySales: number;
}) {
  const [uploadStatus, setUploadStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadStatus(null);
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      // Prefer the 2nd sheet (where the sales-estimator template keeps keywords); fall back to the 1st.
      const sheetName = wb.SheetNames[1] || wb.SheetNames[0];
      if (!sheetName) {
        setUploadStatus({ kind: 'err', msg: 'No sheets found in that file.' });
        return;
      }
      const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], { header: 1, blankrows: false });

      const parsed: Keyword[] = [];
      for (const row of rows) {
        if (!Array.isArray(row)) continue;
        const name = String(row[0] ?? '').trim();
        const svRaw = row[1];
        const oppRaw = row[2];
        const relRaw = row[3];
        const sv = typeof svRaw === 'number' ? svRaw : parseInt(String(svRaw).replace(/[,\s]/g, ''), 10);
        const opp = typeof oppRaw === 'number' ? oppRaw : parseInt(String(oppRaw).replace(/[,\s]/g, ''), 10);
        if (!name || !isFinite(sv) || !isFinite(opp) || sv <= 0) continue;
        let rel = 3;
        if (relRaw !== undefined && relRaw !== null && String(relRaw).trim() !== '') {
          const r = typeof relRaw === 'number' ? relRaw : parseFloat(String(relRaw));
          if (isFinite(r)) rel = Math.max(1, Math.min(5, Math.round(r)));
        }
        parsed.push({
          id: `kw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${parsed.length}`,
          name,
          searchVolume: Math.max(0, Math.round(sv)),
          opportunityScore: Math.max(0, Math.round(opp)),
          relevancy: rel,
        });
        if (parsed.length >= MAX_KEYWORDS) break;
      }

      if (parsed.length === 0) {
        setUploadStatus({ kind: 'err', msg: `No usable rows found on "${sheetName}". Expected columns: keyword, search volume, opportunity/IQ, relevancy.` });
        return;
      }
      setKeywords(parsed);
      setUploadStatus({ kind: 'ok', msg: `Imported ${parsed.length} keyword${parsed.length === 1 ? '' : 's'} from "${sheetName}".` });
    } catch (err) {
      console.error(err);
      setUploadStatus({ kind: 'err', msg: 'Could not parse that file. Try an .xlsx, .xls, or .csv export.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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

      {/* uploader */}
      <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-4 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-blue-900">Upload your sales estimator</div>
            <div className="text-xs text-blue-800 mt-0.5">
              We read tab 2 and pull the first four columns: keyword, search volume, opportunity (or Cerebro IQ), relevancy (1 to 5). .xlsx, .xls, or .csv.
            </div>
          </div>
          <label className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? 'Parsing…' : 'Choose file'}
          </label>
        </div>
        {uploadStatus && (
          <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${
            uploadStatus.kind === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {uploadStatus.msg}
          </div>
        )}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
        <div className={`rounded-xl border-2 ${vTier.border} ${vTier.bg} p-4`}>
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Search Volume</div>
            <div className={`text-xs font-bold ${vTier.color}`}>{vTier.label}</div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-2xl font-bold text-gray-900">{totalVolume.toLocaleString()}</div>
            <div className="text-xs text-gray-500">target 1k to 5k+</div>
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

        <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Est. Sales / Month</div>
            <div className="text-xs font-bold text-indigo-700">Modeled</div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-2xl font-bold text-gray-900">
              {totalMonthlySales > 0 ? Math.round(totalMonthlySales).toLocaleString() : '—'}
            </div>
            <div className="text-xs text-gray-500">across all keywords</div>
          </div>
          <div className="mt-2 text-xs text-gray-600 leading-tight">
            Volume × Amazon CTR by rank × {Math.round(DEFAULT_CONVERSION_RATE * 100)}% conversion. Rough estimate.
          </div>
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

/* ───── save-idea modal ──────────────────────────────────────── */

function SaveIdeaModal({
  open,
  defaultName,
  existingNames,
  onCancel,
  onSave,
}: {
  open: boolean;
  defaultName: string;
  existingNames: string[];
  onCancel: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setName(defaultName || '');
  }, [open, defaultName]);

  if (!open) return null;

  const trimmed = name.trim();
  const willOverwrite = existingNames.includes(trimmed) && trimmed.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Save this idea</h3>
        <p className="text-sm text-gray-600 mb-4">Give it a name so you can compare it to other ideas later.</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. silicone cooking tongs"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && trimmed) onSave(trimmed);
            if (e.key === 'Escape') onCancel();
          }}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
        />
        {willOverwrite && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            An idea named "{trimmed}" already exists. Saving will overwrite it.
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => trimmed && onSave(trimmed)}
            disabled={!trimmed}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {willOverwrite ? 'Overwrite' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───── compare view ─────────────────────────────────────────── */

function recommendation(score: number): { text: string; color: string; bg: string; emoji: string } {
  if (score >= 90) return { text: 'Amazing', color: 'text-green-800', bg: 'bg-green-100', emoji: '🔥' };
  if (score >= 80) return { text: 'Great', color: 'text-green-700', bg: 'bg-green-50', emoji: '✨' };
  if (score >= 70) return { text: 'Winner', color: 'text-blue-700', bg: 'bg-blue-50', emoji: '🚀' };
  if (score >= 60) return { text: 'Average', color: 'text-yellow-700', bg: 'bg-yellow-50', emoji: '🤔' };
  return { text: 'Avoid', color: 'text-red-700', bg: 'bg-red-50', emoji: '⚠️' };
}

function CompareView({
  savedIdeas,
  onLoad,
  onDelete,
  onBack,
}: {
  savedIdeas: SavedIdea[];
  onLoad: (idea: SavedIdea) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(savedIdeas.map(i => i.id)));

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toShow = savedIdeas.filter(i => selected.has(i.id));
  const bestScore = toShow.reduce((max, i) => Math.max(max, i.computed.totalScore), 0);

  if (savedIdeas.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-10 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No saved ideas yet</h2>
        <p className="text-gray-600 mb-6">Go back and score an idea, then save it. You'll be able to compare them here.</p>
        <button
          onClick={onBack}
          className="bg-blue-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to scoring
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* selector */}
      <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Select ideas to compare</h2>
          <div className="text-sm text-gray-600">{toShow.length} of {savedIdeas.length} selected</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {savedIdeas.map(idea => {
            const isSelected = selected.has(idea.id);
            return (
              <label
                key={idea.id}
                className={`flex items-center gap-3 border-2 rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                  isSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(idea.id)}
                  className="w-4 h-4 accent-blue-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{idea.name}</div>
                  <div className="text-xs text-gray-500">Score {Math.round(idea.computed.totalScore)}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* side-by-side cards */}
      {toShow.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-10 text-center text-gray-600">
          Pick at least one idea above to see its scorecard.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${toShow.length}, minmax(240px, 1fr))` }}
          >
            {toShow.map(idea => {
              const isBest = toShow.length > 1 && idea.computed.totalScore === bestScore && bestScore > 0;
              const rec = recommendation(idea.computed.totalScore);
              return (
                <div
                  key={idea.id}
                  className={`relative bg-white rounded-2xl shadow-md border-2 p-5 ${
                    isBest ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-gray-200'
                  }`}
                >
                  {isBest && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                      🏆 Top score
                    </div>
                  )}
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    {new Date(idea.savedAt).toLocaleDateString()}
                  </div>
                  <div className="font-bold text-gray-900 text-base mb-3 truncate" title={idea.name}>
                    {idea.name}
                  </div>

                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold text-blue-600 tabular-nums">
                      {Math.round(idea.computed.totalScore)}
                    </div>
                    <div className={`inline-block mt-2 text-xs font-semibold px-2 py-1 rounded ${rec.bg} ${rec.color}`}>
                      <span className="mr-1">{rec.emoji}</span>{rec.text}
                    </div>
                  </div>

                  <dl className="space-y-2 text-sm">
                    <Metric label="Keywords" value={String(idea.computed.keywordCount)} />
                    <Metric label="Search volume" value={idea.computed.totalVolume.toLocaleString()} />
                    <Metric
                      label="Opp ratio"
                      value={idea.computed.weightedRatio > 0 ? `${idea.computed.weightedRatio.toFixed(2)}x` : '—'}
                    />
                    <Metric
                      label="Est sales / mo"
                      value={idea.computed.totalMonthlySales > 0 ? Math.round(idea.computed.totalMonthlySales).toLocaleString() : '—'}
                    />
                    <Metric label="Volume score" value={`${idea.computed.volumePoints.toFixed(1)} / 10`} />
                    <Metric label="Opportunity score" value={`${idea.computed.opportunityPoints.toFixed(1)} / 10`} />
                    <Metric label="Research tool" value={idea.state.researchTool === 'smartscout' ? 'SmartScout' : 'Helium10'} />
                  </dl>

                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={() => onLoad(idea)}
                      className="flex-1 bg-blue-600 text-white font-semibold text-sm py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${idea.name}"?`)) onDelete(idea.id);
                      }}
                      className="px-3 bg-gray-100 text-gray-700 font-semibold text-sm py-2 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
                      aria-label="Delete idea"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm font-semibold text-gray-900 tabular-nums">{value}</dd>
    </div>
  );
}

/* ───── page ─────────────────────────────────────────────────── */

type View = 'score' | 'compare';

export function ProductScorecard() {
  const [view, setView] = useState<View>('score');
  const [productIdea, setProductIdea] = useState('');
  const [researchTool, setResearchTool] = useState<ResearchTool>('smartscout');
  const [keywords, setKeywords] = useState<Keyword[]>([emptyKeyword()]);
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    categories.forEach(cat => { initial[cat.id] = 5; });
    return initial;
  });
  const [, setUserEmail] = useState('');
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  // Hydrate from storage (new key first, then legacy fallback for old slider state).
  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      if (saved.productIdea) setProductIdea(saved.productIdea);
      if (saved.researchTool) setResearchTool(saved.researchTool);
      if (saved.keywords && saved.keywords.length > 0) {
        // backfill relevancy for state saved before the field existed
        setKeywords(saved.keywords.map(k => ({
          ...k,
          relevancy: typeof k.relevancy === 'number' && k.relevancy >= 1 && k.relevancy <= 5 ? k.relevancy : 3,
        })));
      }
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

  // Load the saved-ideas list once.
  useEffect(() => {
    setSavedIdeas(loadIdeas());
  }, []);

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

  const totalMonthlySales = useMemo(() => {
    return keywords.reduce((sum, k) => {
      if (k.searchVolume <= 0 || k.opportunityScore <= 0) return sum;
      const r = k.opportunityScore / k.searchVolume;
      const pos = estimatePosition(r, k.relevancy);
      return sum + estimateMonthlySales(k.searchVolume, pos);
    }, 0);
  }, [keywords]);

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

  const clearForm = () => {
    const resetScores: Record<string, number> = {};
    categories.forEach(cat => { resetScores[cat.id] = 5; });
    setScores(resetScores);
    setKeywords([emptyKeyword()]);
    setProductIdea('');
    setResearchTool('smartscout');
  };

  const handleNewIdea = () => {
    const hasAnything = productIdea.trim() || keywords.some(k => k.name || k.searchVolume > 0);
    if (hasAnything && !window.confirm('Clear the current form to start a new idea? Save it first if you want to compare later.')) return;
    clearForm();
  };

  const handleSaveIdea = (name: string) => {
    const snapshot: IdeaSnapshot = { productIdea, researchTool, keywords, scores };
    const computed = computeMetrics(snapshot);
    const existingIdx = savedIdeas.findIndex(i => i.name.toLowerCase() === name.toLowerCase());
    const idea: SavedIdea = {
      id: existingIdx >= 0 ? savedIdeas[existingIdx].id : `idea-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      savedAt: new Date().toISOString(),
      state: snapshot,
      computed: {
        totalScore: computed.totalScore,
        totalVolume: computed.totalVolume,
        weightedRatio: computed.weightedRatio,
        volumePoints: computed.volumePoints,
        opportunityPoints: computed.opportunityPoints,
        totalMonthlySales: computed.totalMonthlySales,
        keywordCount: computed.keywordCount,
      },
    };
    const next = existingIdx >= 0
      ? savedIdeas.map((it, i) => (i === existingIdx ? idea : it))
      : [...savedIdeas, idea];
    setSavedIdeas(next);
    saveIdeas(next);
    setSaveModalOpen(false);
  };

  const handleLoadIdea = (idea: SavedIdea) => {
    const snap = idea.state;
    setProductIdea(snap.productIdea || '');
    setResearchTool(snap.researchTool || 'smartscout');
    setKeywords(
      (snap.keywords && snap.keywords.length > 0 ? snap.keywords : [emptyKeyword()]).map(k => ({
        ...k,
        relevancy: typeof k.relevancy === 'number' && k.relevancy >= 1 && k.relevancy <= 5 ? k.relevancy : 3,
      }))
    );
    const nextScores: Record<string, number> = {};
    categories.forEach(cat => { nextScores[cat.id] = 5; });
    setScores({ ...nextScores, ...(snap.scores || {}) });
    setView('score');
  };

  const handleDeleteIdea = (id: string) => {
    const next = savedIdeas.filter(i => i.id !== id);
    setSavedIdeas(next);
    saveIdeas(next);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <HeaderLight />

      <SaveIdeaModal
        open={saveModalOpen}
        defaultName={productIdea}
        existingNames={savedIdeas.map(i => i.name)}
        onCancel={() => setSaveModalOpen(false)}
        onSave={handleSaveIdea}
      />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">Product Scorecard</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Score your idea on real keyword data plus 15 fundamentals. Save it, then compare side by side.
          </p>
        </div>

        <LoginSection onLogin={setUserEmail} />

        {/* view toggle + save/new */}
        <div className="bg-white rounded-2xl shadow-md border-2 border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="inline-flex rounded-lg bg-gray-100 p-1 self-start">
              <button
                type="button"
                onClick={() => setView('score')}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                  view === 'score' ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Score an idea
              </button>
              <button
                type="button"
                onClick={() => setView('compare')}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                  view === 'compare' ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Compare ({savedIdeas.length})
              </button>
            </div>
            {view === 'score' && (
              <div className="flex gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleNewIdea}
                  className="px-4 py-2 bg-gray-100 text-gray-800 font-semibold text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                  + New idea
                </button>
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save this idea
                </button>
              </div>
            )}
          </div>
        </div>

        {view === 'compare' ? (
          <CompareView
            savedIdeas={savedIdeas}
            onLoad={handleLoadIdea}
            onDelete={handleDeleteIdea}
            onBack={() => setView('score')}
          />
        ) : (
        <>
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
          totalMonthlySales={totalMonthlySales}
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
        </>
        )}
      </div>
      <LegalDisclaimer />
    </div>
  );
}

export default ProductScorecard;
