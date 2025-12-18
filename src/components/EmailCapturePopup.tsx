import React, { useState } from 'react';
import { useEmailCapture } from '../context/EmailCaptureContext';
import { userDataService } from '../services/userDataService';

interface EmailCapturePopupProps {
  theme?: 'light' | 'dark';
}

export const EmailCapturePopup: React.FC<EmailCapturePopupProps> = ({ theme = 'dark' }) => {
  const { setIsUnlocked } = useEmailCapture();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLight = theme === 'light';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await userDataService.updateEmail(email);
      setIsUnlocked(true);
    } catch (error) {
      console.error('Error saving email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className={`absolute inset-0 ${isLight ? 'bg-gray-500/30' : 'bg-black/60'} backdrop-blur-md`}></div>
      
      <div className={`relative ${
        isLight 
          ? 'bg-white border-blue-200' 
          : 'bg-[#0A0A0A] border-[#39FF14]/20'
        } border rounded-2xl p-8 max-w-md w-full ${
          isLight 
            ? 'shadow-[0_0_50px_rgba(59,130,246,0.15)]' 
            : 'shadow-[0_0_50px_rgba(57,255,20,0.15)]'
        }`}>
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className={`w-24 h-24 rounded-full ${
            isLight ? 'bg-blue-500' : 'bg-[#39FF14]'
          } flex items-center justify-center overflow-hidden`}>
            <img 
              src="https://yt3.googleusercontent.com/i8QyOXvpeMckQ0LPnVTwFjks-org7y9rP-2eSNPYdBPZuDDMBk3wznHbwa7oQfbT763spDyFjA=s900-c-k-c0x00ffffff-no-rj"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <h2 className={`text-3xl font-bold ${
            isLight ? 'text-gray-900' : 'text-white'
          } mb-2`}>Unlock Your Training</h2>
          <p className={`${
            isLight ? 'text-gray-600' : 'text-gray-400'
          } mb-6`}>Enter your email to access my proven Amazon success formula</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                required
                placeholder="Enter your email address"
                className={`w-full px-4 py-3 rounded-lg ${
                  isLight 
                    ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500' 
                    : 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-[#39FF14] focus:ring-[#39FF14]'
                } border focus:outline-none focus:ring-1`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-75 ${
                isLight
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-[#39FF14] text-black hover:bg-[#32D912]'
              }`}
            >
              {isSubmitting ? 'Unlocking...' : 'Get Training Now'}
            </button>
          </form>

          <p className={`mt-4 text-sm ${
            isLight ? 'text-gray-500' : 'text-gray-500'
          }`}>
            By submitting, you agree to receive email communications
          </p>
        </div>
      </div>
    </div>
  );
};