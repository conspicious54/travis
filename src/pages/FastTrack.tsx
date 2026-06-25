import React, { useEffect, useState } from 'react';
import { ChevronDown, Lock, PlayCircle } from 'lucide-react';

const PASSWORD = 'PNB2019';
const UNLOCK_STORAGE_KEY = 'pp_fasttrack_unlocked';

type Module = { title: string; videos: string[] };

// Sproutvideo path = "{videoId}/{securityToken}" → embed URL is
// https://videos.sproutvideo.com/embed/{path}
const MODULES: Module[] = [
  {
    title: 'Module 1: Course Introduction',
    videos: [
      'aa9adbb61a1fe4c220/fe77a293b6a0ece8',
      '8c9adbb61a1fe1ce06/1e0164d64459b5bc',
      'aa9adbb61a1fe6c020/8fcd8fea4e52b7d6',
    ],
  },
  {
    title: 'Module 2: Idea',
    videos: [
      '5a9adbb61a1fe1cfd0/4dbabdd9b198b028',
      '069adbb61a1fe6c28c/0f906d8af34bea26',
      '729adbb61a1fe6c4f8/14a49519093ccfe7',
      'dc9adbb61a1feacd56/d812e5d3558e2cbb',
      'dc9adbb61a1fe4c356/bb342469b16af489',
    ],
  },
  {
    title: 'Module 3: Validate Your Idea',
    videos: [
      '489adbb61a1fe4c1c2/3c305553d57d1a5f',
      'a49adbb61a1fe4c72e/96b9c10fed48d070',
      '5a9adbb61a1fe4cad0/4f0e2e32eea213d8',
      '8c9adbb61a1fe4cb06/fa1e7ebe1fc02db3',
    ],
  },
  {
    title: 'Module 4: Create Your Brand',
    videos: [
      'aa9adbb61a1fe5c320/b87680fc75492c1e',
      '069adbb61a1fe5c18c/4ffd9d326e784902',
      '489adbb61a1fe5c0c2/2c45e101ed218271',
      '729adbb61a1fe5c7f8/a1459c65f6f0237d',
      '109adbb61a1fe5c49a/1fe0ec16d77bb33c',
    ],
  },
  {
    title: 'Module 5: Create Your Business',
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
    title: 'Module 6: Business Extended',
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
    title: 'Module 7: Crowd Fund',
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
    title: 'Module 8: Manufacturer',
    videos: [
      '069adbb61c1ce6c78c/49076201ba705681',
      '109adbb61c1ce7c39a/5b1df40ae0140656',
      'a49adbb61c1ce6c02e/7079f6a622ea6115',
      '109adbb61c1ce6c29a/b8288846ca30cbf9',
    ],
  },
  {
    title: 'Module 9: Amazon Launch',
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
    title: 'Bonus: PRC',
    videos: [
      '069adbb61f1aeace8c/61a0b86de59d6a07',
      'a49adbb61f1aeac92e/a0bad352cc04b595',
      '109adbb61f1aeacb9a/cce526f8046776fe',
      '5a9adbb61f1aeac4d0/92db5530aab15ee6',
    ],
  },
];

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
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-orange-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 md:p-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
            <Lock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 text-center mb-2">
          Fast Track Course
        </h1>
        <p className="text-gray-500 text-center mb-6 text-sm">
          Enter the password to access the course videos.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            autoFocus
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false); }}
            placeholder="Password"
            className={`w-full px-4 py-3 border-2 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-500 ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
          />
          {error && (
            <p className="text-red-600 text-sm mt-2">Incorrect password. Try again.</p>
          )}
          <button
            type="submit"
            className="w-full mt-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors"
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
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-md">
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
  isOpen,
  onToggle,
}: {
  module: Module;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-5 md:px-7 md:py-6 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 md:gap-4">
          <PlayCircle className="w-6 h-6 md:w-7 md:h-7 text-orange-600 shrink-0" />
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
              {module.title}
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              {module.videos.length} {module.videos.length === 1 ? 'lesson' : 'lessons'}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 md:w-6 md:h-6 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-6 md:px-7 md:pb-8 border-t border-gray-100 pt-5 md:pt-6">
          <div className="space-y-6 md:space-y-8">
            {module.videos.map((path, idx) => (
              <div key={path + idx}>
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Lesson {idx + 1}
                </p>
                <VideoEmbed path={path} />
              </div>
            ))}
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-white to-white">
      <header className="bg-gradient-to-br from-gray-950 via-slate-900 to-orange-950 text-white py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-orange-300 text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-2">
            Passion Product
          </p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
            Fast Track Course
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto">
            Everything you need to launch a successful Amazon product, from idea to sales.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        <div className="space-y-4 md:space-y-5">
          {MODULES.map((module, idx) => (
            <ModuleBlock
              key={module.title}
              module={module}
              isOpen={openModule === idx}
              onToggle={() => setOpenModule(openModule === idx ? null : idx)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
