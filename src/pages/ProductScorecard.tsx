import React, { useState, useEffect } from 'react';
import { HeaderLight } from '../components/HeaderLight';
import { userDataService } from '../services/userDataService';

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
  },
  {
    id: 'searchVolume',
    name: 'Search Volume',
    description: 'If there is no search volume for this product then I would put a 1 if there is a ton of search volume and people looking for this type of a product put a 10'
  }
];

function LoginSection({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is already logged in (has email in localStorage)
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
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-8">
        <p className="text-green-800 font-medium">
          ✓ Logged in as: {email}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Login to Save Your Score</h3>
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

function ScoreDisplay({ score }: { score: number }) {
  const getRecommendation = (score: number): { text: string; color: string; bgColor: string } => {
    if (score >= 90) {
      return { text: 'Amazing Product', color: 'text-green-800', bgColor: 'bg-green-100' };
    } else if (score >= 80) {
      return { text: 'This is a great product', color: 'text-green-700', bgColor: 'bg-green-50' };
    } else if (score >= 70) {
      return { text: 'This is a really good product and should be a winner', color: 'text-blue-700', bgColor: 'bg-blue-50' };
    } else if (score >= 60) {
      return { text: 'Average Product I Would Go For It If You Have No Better Ideas', color: 'text-yellow-700', bgColor: 'bg-yellow-50' };
    } else {
      return { text: 'I would personally Avoid This Product', color: 'text-red-700', bgColor: 'bg-red-50' };
    }
  };

  const recommendation = getRecommendation(score);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-xl p-8 border-2 border-blue-200 mt-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Product Score</h2>
        <div className="text-6xl font-bold text-blue-600 mb-4">{Math.round(score)}</div>
        <div className={`inline-block px-6 py-3 rounded-lg font-semibold ${recommendation.bgColor} ${recommendation.color}`}>
          {recommendation.text}
        </div>
      </div>
    </div>
  );
}

export function ProductScorecard() {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    // Initialize all scores to 5
    const initialScores: Record<string, number> = {};
    categories.forEach(cat => {
      initialScores[cat.id] = 5;
    });
    return initialScores;
  });
  const [userEmail, setUserEmail] = useState('');

  // Load saved scores from localStorage
  useEffect(() => {
    const savedScores = localStorage.getItem('productScorecardScores');
    if (savedScores) {
      try {
        const parsed = JSON.parse(savedScores);
        setScores(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Error loading saved scores:', e);
      }
    }
  }, []);

  // Save scores to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('productScorecardScores', JSON.stringify(scores));
  }, [scores]);

  const handleScoreChange = (categoryId: string, value: number) => {
    setScores(prev => ({
      ...prev,
      [categoryId]: value
    }));
  };

  const calculateScore = (): number => {
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const maxPossibleScore = categories.length * 10;
    return (totalScore / maxPossibleScore) * 100;
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all scores? This cannot be undone.')) {
      const resetScores: Record<string, number> = {};
      categories.forEach(cat => {
        resetScores[cat.id] = 5;
      });
      setScores(resetScores);
      localStorage.removeItem('productScorecardScores');
    }
  };

  const currentScore = calculateScore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <HeaderLight />
      
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Product Scorecard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Rate your product across 16 key categories to get an overall score and recommendation
          </p>
        </div>

        <LoginSection onLogin={setUserEmail} />

        <div className="space-y-6 mb-8">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200 hover:border-blue-300 transition-colors"
            >
              <div className="mb-4">
                <label className="block text-lg font-semibold text-gray-900 mb-2">
                  {category.name}
                </label>
                <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={scores[category.id]}
                    onChange={(e) => handleScoreChange(category.id, parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="w-16 text-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {scores[category.id]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mb-8">
          <button
            onClick={handleReset}
            className="bg-red-500 text-white font-bold px-8 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Reset All Scores
          </button>
        </div>

        <ScoreDisplay score={currentScore} />
      </div>
    </div>
  );
}

