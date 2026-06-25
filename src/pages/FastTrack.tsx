import React, { useEffect, useState } from 'react';
import { ChevronDown, Lock, Sparkles, PlayCircle, CheckCircle2 } from 'lucide-react';

const PASSWORD = 'PNB2019';
const UNLOCK_STORAGE_KEY = 'pp_fasttrack_unlocked';

type Module = { number: string; title: string; subtitle: string; videos: string[] };

// Sproutvideo path = "{videoId}/{securityToken}" → embed URL is
// https://videos.sproutvideo.com/embed/{path}
const MODULES: Module[] = [
  {
    number: '01',
    title: 'Course Introduction',
    subtitle: 'Welcome and how to get the most out of Fast Track',
    videos: [
      'aa9adbb61a1fe4c220/fe77a293b6a0ece8',
      '8c9adbb61a1fe1ce06/1e0164d64459b5bc',
      'aa9adbb61a1fe6c020/8fcd8fea4e52b7d6',
    ],
  },
  {
    number: '02',
    title: 'Idea',
    subtitle: 'How to find product ideas worth pursuing',
    videos: [
      '5a9adbb61a1fe1cfd0/4dbabdd9b198b028',
      '069adbb61a1fe6c28c/0f906d8af34bea26',
      '729adbb61a1fe6c4f8/14a49519093ccfe7',
      'dc9adbb61a1feacd56/d812e5d3558e2cbb',
      'dc9adbb61a1fe4c356/bb342469b16af489',
    ],
  },
  {
    number: '03',
    title: 'Validate Your Idea',
    subtitle: 'Make sure people actually want what you’re building',
    videos: [
      '489adbb61a1fe4c1c2/3c305553d57d1a5f',
      'a49adbb61a1fe4c72e/96b9c10fed48d070',
      '5a9adbb61a1fe4cad0/4f0e2e32eea213d8',
      '8c9adbb61a1fe4cb06/fa1e7ebe1fc02db3',
    ],
  },
  {
    number: '04',
    title: 'Create Your Brand',
    subtitle: 'Name, design, and positioning that resonates',
    videos: [
      'aa9adbb61a1fe5c320/b87680fc75492c1e',
      '069adbb61a1fe5c18c/4ffd9d326e784902',
      '489adbb61a1fe5c0c2/2c45e101ed218271',
      '729adbb61a1fe5c7f8/a1459c65f6f0237d',
      '109adbb61a1fe5c49a/1fe0ec16d77bb33c',
    ],
  },
  {
    number: '05',
    title: 'Create Your Business',
    subtitle: 'Set up the foundation: legal, financial, operational',
    videos: [
      '069adbb61a1feace8c/bb8a48a1f6fb4ea4',
      '489adbb61a1feacfc2/c5df6001e139271f',
      'a49adbb61a1feac92e/0026ecbc1692f7fa',
      'aa9adbb61a1febcd20/5b826aed89d0ded0',
      '489adbb61a1febcec2/21783602b0235fa7',
      '069adbb61c1ae0c78c/6b11871ea8115d61',
      'a49adbb61c1ae0c02e/fcea16c993d79d02',
      '109adbb61c1ae0c29a/24c95a522f909c07',
      'dc9adbb61c1ae3c756/19081c7b7749b1d5',
      '069adbb61c1ae3c48c/e7530de87434c8b1',
      'a49adbb61c1ae3c32e/34f69cdb9eb5db91',
    ],
  },
  {
    number: '06',
    title: 'Business Extended',
    subtitle: 'Going deeper on systems, teams, and scale',
    videos: [
      '729adbb61c1ae6c7f8/402803970c20892d',
      'aa9adbb61c1ae4c120/d3289eb59558e9a6',
      'ee9adbb61c1ae8cb64/e76af93a6fa58cc5',
      '069adbb61c1de5c58c/b6b2b84353522776',
      '489adbb61c1de2c3c2/573ddc4845692350',
      'ee9adbb61c1de2c664/55892d46b63e7815',
      '8c9adbb61c1de2c906/607eb72e96090afa',
    ],
  },
  {
    number: '07',
    title: 'Crowd Fund',
    subtitle: 'How to fund your first run before risking your own money',
    videos: [
      'aa9adbb61c1de3c120/4b9a1c121cb6d8a5',
      '729adbb61c1de3c5f8/f3243e905d863fb0',
      'dc9adbb61c1de0c356/350dae7c528505ce',
      '109adbb61c1de0c59a/dea4241b3c219ca7',
      '489adbb61c1de1c0c2/47d72c0b7be46d85',
      '8c9adbb61c1de1ca06/5f1f6279e6a883b2',
      'aa9adbb61c1deecc20/b363a0e414838821',
      '729adbb61c1defc9f8/e288df9e3eb6c03f',
      'dc9adbb61c1ce7c556/613a2eae903590a1',
    ],
  },
  {
    number: '08',
    title: 'Manufacturer',
    subtitle: 'Source, negotiate, and quality-check your supplier',
    videos: [
      '069adbb61c1ce6c78c/49076201ba705681',
      '109adbb61c1ce7c39a/5b1df40ae0140656',
      'a49adbb61c1ce6c02e/7079f6a622ea6115',
      '109adbb61c1ce6c29a/b8288846ca30cbf9',
    ],
  },
  {
    number: '09',
    title: 'Amazon Launch',
    subtitle: 'Listing, ranking, and selling your first units',
    videos: [
      'dc9adbb61c1ce4c656/f15b7cf1804e429b',
      'a49adbb61c1ce4c22e/09af46a4b3cecd61',
      'dc9adbb61c1ce3c156/8f08e6ab954281b2',
      '069adbb61c1ce3c28c/47fbd46812135480',
      '729adbb61c1ce3c4f8/0d81edcee58de4e3',
      '109adbb61c1ce3c79a/46421fe719c65ad8',
      'aa9adbb61c1ce2c120/fd83fc618ba4daed',
      '109adbb61c1ce2c69a/f4d174185ef5c438',
    ],
  },
  {
    number: 'B',
    title: 'PRC Bonus',
    subtitle: 'Product Research Code — bonus deep-dives',
    videos: [
      '069adbb61f1aeace8c/61a0b86de59d6a07',
      'a49adbb61f1aeac92e/a0bad352cc04b595',
      '109adbb61f1aeacb9a/cce526f8046776fe',
      '5a9adbb61f1aeac4d0/92db5530aab15ee6',
    ],
  },
];

const TOTAL_LESSONS = MODULES.reduce((sum, m) => sum + m.videos.length, 0);

/* ───── password gate ───────────────────────────────────────────── */

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() === PASSWORD) {
      try { localStorage.setItem(UNLOCK_STORAGE_KEY, '1'); } catch { /* no-op */ }
      onUnlock();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-slate-950 via-gray-900 to-orange-950">
      {/* Decorative blurred orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-orange-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative max-w-md w-full bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20">
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Lock className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
        </div>
        <p className="text-orange-600 text-xs font-bold uppercase tracking-[0.2em] text-center mb-2">
          Passion Product
        </p>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 text-center mb-2 tracking-tight">
          Fast Track Course
        </h1>
        <p className="text-gray-500 text-center mb-6 text-sm">
          Enter your password to access the course.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            autoFocus
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false); }}
            placeholder="Password"
            className={`w-full px-4 py-3.5 border-2 rounded-xl text-base focus:outline-none focus:ring-4 transition-all ${error ? 'border-red-400 bg-red-50 focus:ring-red-100' : 'border-gray-200 focus:border-orange-500 focus:ring-orange-100'}`}
          />
          {error && (
            <p className="text-red-600 text-sm mt-2 font-medium">Incorrect password. Try again.</p>
          )}
          <button
            type="submit"
            className="w-full mt-4 py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 active:scale-[0.99]"
          >
            Unlock Course
          </button>
        </form>
      </div>
    </div>
  );
}

/* ───── single video embed ──────────────────────────────────────── */

function VideoEmbed({ path }: { path: string }) {
  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5">
      <iframe
        src={`https://videos.sproutvideo.com/embed/${path}`}
        className="absolute inset-0 w-full h-full"
        frameBorder={0}
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        title="Course Video"
      />
    </div>
  );
}

/* ───── accordion module block ──────────────────────────────────── */

function ModuleBlock({
  module,
  index,
  isOpen,
  onToggle,
}: {
  module: Module;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isBonus = module.number === 'B';

  return (
    <div
      className={`relative bg-white border rounded-2xl shadow-sm overflow-hidden transition-all duration-200 ${
        isOpen ? 'border-orange-300 shadow-lg shadow-orange-500/5' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      {/* Bonus modules get a small ribbon */}
      {isBonus && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-bl-lg shadow">
            <Sparkles className="w-3 h-3 inline-block mr-1 -mt-0.5" />
            Bonus
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 md:gap-5 px-5 py-5 md:px-7 md:py-6 text-left transition-colors"
      >
        {/* Module number badge */}
        <div
          className={`shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center font-black text-xl md:text-2xl tracking-tight transition-all ${
            isOpen
              ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/30'
              : 'bg-gray-100 text-gray-400 group-hover:bg-orange-50'
          }`}
        >
          {module.number}
        </div>

        {/* Title + subtitle + count */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
            {module.title}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5 leading-snug line-clamp-1">
            {module.subtitle}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-gray-400">
            <PlayCircle className="w-3.5 h-3.5" />
            <span>{module.videos.length} {module.videos.length === 1 ? 'lesson' : 'lessons'}</span>
          </div>
        </div>

        <ChevronDown
          className={`w-5 h-5 md:w-6 md:h-6 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-orange-600' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 bg-gradient-to-b from-orange-50/30 to-white px-4 py-7 md:px-7 md:py-9">
          <div className="space-y-8 md:space-y-10">
            {module.videos.map((path, idx) => (
              <div key={path + idx}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 rounded-full bg-white border-2 border-orange-300 text-orange-700 text-xs font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Lesson {idx + 1}
                  </p>
                </div>
                <VideoEmbed path={path} />
              </div>
            ))}

            {/* Module-complete footer pill */}
            <div className="flex justify-center pt-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                <CheckCircle2 className="w-4 h-4" />
                End of {module.title}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── main export ─────────────────────────────────────────────── */

export function FastTrack() {
  const [unlocked, setUnlocked] = useState(false);
  const [openModule, setOpenModule] = useState<number | null>(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(UNLOCK_STORAGE_KEY) === '1') {
        setUnlocked(true);
      }
    } catch { /* no-op */ }
  }, []);

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-white">
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-gray-900 to-orange-950 text-white py-12 md:py-20">
        {/* Decorative blurred accents */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="text-orange-300 text-xs md:text-sm font-bold uppercase tracking-[0.25em] mb-3">
            Passion Product
          </p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 bg-gradient-to-b from-white to-orange-100 bg-clip-text text-transparent">
            Fast Track Course
          </h1>
          <p className="text-slate-300 text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-7">
            Everything you need to launch a successful Amazon product, from first idea to first sale.
          </p>

          {/* Stats row */}
          <div className="inline-flex flex-wrap items-center justify-center gap-3 md:gap-4 text-sm">
            <div className="bg-white/10 backdrop-blur border border-white/20 px-4 py-2 rounded-full flex items-center gap-2">
              <span className="font-black text-white text-base">{MODULES.length}</span>
              <span className="text-slate-300">Modules</span>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/20 px-4 py-2 rounded-full flex items-center gap-2">
              <span className="font-black text-white text-base">{TOTAL_LESSONS}</span>
              <span className="text-slate-300">Lessons</span>
            </div>
            <div className="bg-white/10 backdrop-blur border border-white/20 px-4 py-2 rounded-full flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="text-slate-300">Bonus included</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        {/* Section eyebrow */}
        <div className="mb-6 md:mb-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400">
            Course Curriculum
          </p>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
        </div>

        <div className="space-y-3 md:space-y-4">
          {MODULES.map((module, idx) => (
            <ModuleBlock
              key={module.title}
              module={module}
              index={idx}
              isOpen={openModule === idx}
              onToggle={() => setOpenModule(openModule === idx ? null : idx)}
            />
          ))}
        </div>

        {/* Closing note */}
        <p className="text-center text-xs text-gray-400 mt-12">
          Bookmark this page to come back any time — your unlock is saved on this device.
        </p>
      </main>
    </div>
  );
}
