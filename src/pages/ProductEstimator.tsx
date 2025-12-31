import React, { useState, useEffect } from 'react';
import { HeaderLight } from '../components/HeaderLight';
import { userDataService } from '../services/userDataService';

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
      <h3 className="text-xl font-bold text-gray-900 mb-4">Login to Save Your Estimates</h3>
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

function EstimatorDial({
  label,
  value,
  onChange,
  min,
  max,
  step,
  formatValue,
  description
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  formatValue: (value: number) => string;
  description?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200 hover:border-blue-300 transition-colors">
      <div className="mb-4">
        <label className="block text-lg font-semibold text-gray-900 mb-2">
          {label}
        </label>
        {description && (
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        )}
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="w-32 text-center">
            <span className="text-2xl font-bold text-blue-600">
              {formatValue(value)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsDisplay({ revenue, profit }: { revenue: number; profit: number }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-xl p-8 border-2 border-blue-200 mt-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Your Estimates</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border-2 border-blue-200">
          <div className="text-center">
            <p className="text-gray-600 mb-2 font-medium">Monthly Revenue</p>
            <p className="text-4xl font-bold text-blue-600 mb-2">{formatCurrency(revenue)}</p>
            <p className="text-sm text-gray-500">per month</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border-2 border-green-200">
          <div className="text-center">
            <p className="text-gray-600 mb-2 font-medium">Monthly Profit</p>
            <p className="text-4xl font-bold text-green-600 mb-2">{formatCurrency(profit)}</p>
            <p className="text-sm text-gray-500">per month</p>
          </div>
        </div>
      </div>
      <div className="mt-6 text-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100">
          <p className="text-lg font-semibold text-gray-700 mb-2">Annual Projections</p>
          <div className="flex justify-center gap-8 text-sm">
            <div>
              <span className="text-gray-600">Revenue: </span>
              <span className="font-bold text-blue-600">{formatCurrency(revenue * 12)}</span>
            </div>
            <div>
              <span className="text-gray-600">Profit: </span>
              <span className="font-bold text-green-600">{formatCurrency(profit * 12)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductEstimator() {
  const [searchVolume, setSearchVolume] = useState(10000);
  const [rankPosition, setRankPosition] = useState(10);
  const [productPrice, setProductPrice] = useState(29.99);
  const [profitMargin, setProfitMargin] = useState(30);
  const [userEmail, setUserEmail] = useState('');

  // Load saved values from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('productEstimatorValues');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSearchVolume(parsed.searchVolume || 10000);
        setRankPosition(parsed.rankPosition || 10);
        setProductPrice(parsed.productPrice || 29.99);
        setProfitMargin(parsed.profitMargin || 30);
      } catch (e) {
        console.error('Error loading saved values:', e);
      }
    }
  }, []);

  // Save values to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('productEstimatorValues', JSON.stringify({
      searchVolume,
      rankPosition,
      productPrice,
      profitMargin
    }));
  }, [searchVolume, rankPosition, productPrice, profitMargin]);

  // Calculate click-through rate based on rank position
  // Better rank (lower number) = higher CTR
  const getClickThroughRate = (rank: number): number => {
    if (rank <= 1) return 0.35; // 35% CTR for rank 1
    if (rank <= 3) return 0.25; // 25% CTR for ranks 2-3
    if (rank <= 10) return 0.15; // 15% CTR for ranks 4-10
    if (rank <= 20) return 0.08; // 8% CTR for ranks 11-20
    if (rank <= 50) return 0.03; // 3% CTR for ranks 21-50
    return 0.01; // 1% CTR for ranks 51+
  };

  // Standard Amazon conversion rate (typically 10-15%, using 12% as average)
  const conversionRate = 0.12;

  // Calculate monthly revenue
  const calculateRevenue = (): number => {
    const ctr = getClickThroughRate(rankPosition);
    const clicks = searchVolume * ctr;
    const sales = clicks * conversionRate;
    return sales * productPrice;
  };

  // Calculate monthly profit
  const calculateProfit = (): number => {
    const revenue = calculateRevenue();
    return revenue * (profitMargin / 100);
  };

  const monthlyRevenue = calculateRevenue();
  const monthlyProfit = calculateProfit();

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all values? This cannot be undone.')) {
      setSearchVolume(10000);
      setRankPosition(10);
      setProductPrice(29.99);
      setProfitMargin(30);
      localStorage.removeItem('productEstimatorValues');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <HeaderLight />
      
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Profit Estimator Tool
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Estimate how much profit you can be making on Amazon with your product idea
          </p>
        </div>

        <LoginSection onLogin={setUserEmail} />

        <div className="space-y-6 mb-8">
          <EstimatorDial
            label="Average Monthly Search Volume"
            value={searchVolume}
            onChange={setSearchVolume}
            min={0}
            max={100000}
            step={1000}
            formatValue={(v) => v.toLocaleString()}
            description="The average number of monthly searches for your product keyword on Amazon"
          />

          <EstimatorDial
            label="Average Search Rank Position"
            value={rankPosition}
            onChange={setRankPosition}
            min={1}
            max={100}
            step={1}
            formatValue={(v) => `#${Math.round(v)}`}
            description="Your expected average ranking position in Amazon search results (1 is best, 100 is worst)"
          />

          <div className="bg-white rounded-xl shadow-md p-6 border-2 border-gray-200 hover:border-blue-300 transition-colors">
            <label className="block text-lg font-semibold text-gray-900 mb-2">
              Product Price
            </label>
            <p className="text-sm text-gray-600 mb-4">
              How much your product sells for on Amazon
            </p>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 font-medium">$</span>
              <input
                type="number"
                min="0"
                max="10000"
                step="0.01"
                value={productPrice}
                onChange={(e) => setProductPrice(parseFloat(e.target.value) || 0)}
                className="flex-1 px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl font-bold text-blue-600"
              />
            </div>
          </div>

          <EstimatorDial
            label="Profit Margin"
            value={profitMargin}
            onChange={setProfitMargin}
            min={0}
            max={100}
            step={1}
            formatValue={(v) => `${Math.round(v)}%`}
            description="Your expected profit margin percentage after all costs (Amazon fees, product cost, shipping, etc.)"
          />
        </div>

        <div className="flex justify-center mb-8">
          <button
            onClick={handleReset}
            className="bg-red-500 text-white font-bold px-8 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Reset All Values
          </button>
        </div>

        <ResultsDisplay revenue={monthlyRevenue} profit={monthlyProfit} />
      </div>
    </div>
  );
}

