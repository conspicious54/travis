import React, { useState, useRef } from 'react';
import { SuccessState } from './SuccessState';
import { ProcessingScreen } from './ProcessingScreen';
import { userDataService } from '../services/userDataService';
import { useQuestionnaire } from '../context/QuestionnaireContext';

interface QuestionnaireProps {
  theme?: 'light' | 'dark';
}

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  canCommit: string;
  inspiration: string;
  goals: string;
  targetIncome: string;
  startupCapital: string;
  understanding: boolean;
}

export const Questionnaire: React.FC<QuestionnaireProps> = ({ theme = 'dark' }) => {
  const { setIsSubmitted } = useQuestionnaire();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    canCommit: '',
    inspiration: '',
    goals: '',
    targetIncome: '',
    startupCapital: '',
    understanding: false
  });

  const getWeightedProgress = (step: number) => {
    const weights = {
      1: 25, // Name (25%)
      2: 40, // Phone (15% more = 40%)
      3: 50, // Commitment (10% more = 50%)
      4: 60, // Inspiration (10% more = 60%)
      5: 70, // Goals (10% more = 70%)
      6: 80, // Income (10% more = 80%)
      7: 90, // Capital (10% more = 90%)
      8: 100 // Understanding (10% more = 100%)
    };
    return weights[step as keyof typeof weights] || 0;
  };

  const incomeOptions = [
    'No Income Right Now',
    '$1,000 - $3,000 a month',
    '$3,000 - $5,000 a month',
    '$5,000 - $8,000 a month',
    '$8,000 - $15,000 a month',
    '$15,000+ a month'
  ];

  const capitalOptions = [
    'Under $1,000',
    'Between $1,000 - $2,999',
    'Between $3,000 - $4,999',
    'Between $5,000 - $9,999',
    '$10,000 or more'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await userDataService.updateQuestionnaireData(formData);
      setIsSubmitted(true);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error saving questionnaire data:', error);
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (showSuccess) {
    return <SuccessState theme={theme} />;
  }

  if (isLoading) {
    return <ProcessingScreen theme={theme} />;
  }

  const renderStep = () => {
    const buttonClasses = `w-full font-bold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-8 ${
      isLight
        ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:-translate-y-0.5'
        : 'bg-gradient-to-r from-[#FF0000] to-[#CC0000] text-white hover:from-[#FF1A1A] hover:to-[#E60000] hover:shadow-[0_4px_12px_rgba(255,0,0,0.3)] hover:-translate-y-0.5'
    }`;

    const inputClasses = `w-full px-4 py-3 rounded-lg ${
      isLight 
        ? 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500' 
        : 'bg-white/5 border-white/10 text-white focus:border-[#FF0000] focus:ring-[#FF0000]'
    } border focus:outline-none focus:ring-1`;

    const optionButtonClasses = (selected: boolean) => `w-full px-6 py-4 rounded-lg border transition-all duration-300 ${
      selected
        ? isLight
          ? 'bg-blue-500 text-white border-blue-500'
          : 'bg-gradient-to-r from-[#FF0000] to-[#CC0000] text-white border-[#FF0000]'
        : isLight
          ? 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
          : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
    }`;

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className={`text-2xl font-bold ${
              isLight ? 'text-gray-900' : 'text-white'
            } mb-8`}>What's your name?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${
                  isLight ? 'text-gray-700' : 'text-gray-300'
                } mb-2`}>First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${
                  isLight ? 'text-gray-700' : 'text-gray-300'
                } mb-2`}>Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={inputClasses}
                />
              </div>
            </div>
            <button
              onClick={nextStep}
              disabled={!formData.firstName || !formData.lastName}
              className={buttonClasses}
            >
              Continue
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className={`text-2xl font-bold ${
              isLight ? 'text-gray-900' : 'text-white'
            } mb-8`}>What's your phone number?</h2>
            <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-6`}>
              We will be reaching out to you directly so please make sure you enter the right number.
            </p>
            <div>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={inputClasses}
                placeholder="(555) 555-5555"
              />
            </div>
            <button
              onClick={nextStep}
              disabled={!formData.phone}
              className={buttonClasses}
            >
              Continue
            </button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className={`text-2xl font-bold ${
              isLight ? 'text-gray-900' : 'text-white'
            } mb-8`}>Can you commit 5-10 hours weekly?</h2>
            <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-6`}>
              Could you commit to dedicating 5-10 hours each week to the development of your business until the launch of your first product, while having the flexibility to schedule these hours according to your availability?
            </p>
            <div className="space-y-4">
              {['Yes', 'No'].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, canCommit: option });
                    nextStep();
                  }}
                  className={optionButtonClasses(formData.canCommit === option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className={`text-2xl font-bold ${
              isLight ? 'text-gray-900' : 'text-white'
            } mb-8`}>What inspired you?</h2>
            <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-6`}>
              What inspired you to explore the possibility of starting this business venture?
            </p>
            <textarea
              required
              value={formData.inspiration}
              onChange={(e) => setFormData({ ...formData, inspiration: e.target.value })}
              className={`${inputClasses} min-h-[120px]`}
              placeholder="Share your story..."
            />
            <button
              onClick={nextStep}
              disabled={!formData.inspiration}
              className={buttonClasses}
            >
              Continue
            </button>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className={`text-2xl font-bold ${
              isLight ? 'text-gray-900' : 'text-white'
            } mb-8`}>What are your goals?</h2>
            <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-6`}>
              What exciting things could you do if you hit your income goal in just 90 days?
            </p>
            <textarea
              required
              value={formData.goals}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
              className={`${inputClasses} min-h-[120px]`}
              placeholder="Share your dreams..."
            />
            <button
              onClick={nextStep}
              disabled={!formData.goals}
              className={buttonClasses}
            >
              Continue
            </button>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className={`text-2xl font-bold ${
              isLight ? 'text-gray-900' : 'text-white'
            } mb-8`}>What's your target income?</h2>
            <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-6`}>
              What income do we need to help you obtain in order to replace your current monthly income?
            </p>
            <div className="space-y-4">
              {incomeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, targetIncome: option });
                    nextStep();
                  }}
                  className={optionButtonClasses(formData.targetIncome === option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h2 className={`text-2xl font-bold ${
              isLight ? 'text-gray-900' : 'text-white'
            } mb-8`}>What's your startup capital?</h2>
            <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} mb-6`}>
              Selling products on Amazon requires you to invest in inventory. How much have you roughly set aside to get your business started? We want to help you map out the best path forward.
            </p>
            <div className="space-y-4">
              {capitalOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setFormData({ ...formData, startupCapital: option });
                    nextStep();
                  }}
                  className={optionButtonClasses(formData.startupCapital === option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <h2 className={`text-2xl font-bold ${
              isLight ? 'text-gray-900' : 'text-white'
            } mb-8`}>Final Step</h2>
            <div className={`${
              isLight ? 'bg-gray-50' : 'bg-white/5'
            } p-6 rounded-lg border ${
              isLight ? 'border-gray-200' : 'border-white/10'
            }`}>
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.understanding}
                  onChange={(e) => setFormData({ ...formData, understanding: e.target.checked })}
                  className={`mt-1.5 h-5 w-5 rounded border-white/10 ${
                    isLight ? 'text-blue-500 focus:ring-blue-500' : 'text-[#FF0000] focus:ring-[#FF0000]'
                  }`}
                />
                <span className={isLight ? 'text-gray-700' : 'text-gray-300'}>
                  I understand that building an Amazon business is not a get rich quick scheme. It is like most great businesses with great potential upside and I understand it requires an investment in time, energy and capital.
                </span>
              </label>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!formData.understanding}
              className={buttonClasses}
            >
              Submit Application
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto px-4">
      <div className={`${
        isLight 
          ? 'bg-white border-gray-200 shadow-lg' 
          : 'bg-[#111111] border-white/20'
      } border rounded-2xl p-8`}>
        <div className={`h-1 ${
          isLight ? 'bg-gray-100' : 'bg-white/10'
        } rounded-full mb-8`}>
          <div 
            className={`h-full ${
              isLight ? 'bg-blue-500' : 'bg-[#FF0000]'
            } rounded-full transition-all duration-300`}
            style={{ width: `${getWeightedProgress(currentStep)}%` }}
          ></div>
        </div>
        {renderStep()}
      </div>
    </div>
  );
};