import React, { useState } from 'react';
import { useEmailCapture } from '../context/EmailCaptureContext';
import { userDataService } from '../services/userDataService';

export const EmailCapturePopupBooking: React.FC = () => {
  const { setIsUnlocked } = useEmailCapture();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <div className="absolute inset-0 bg-gray-500/30 backdrop-blur-md"></div>
      
      <div className="relative bg-white border-blue-200 border rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(59,130,246,0.15)]">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden">
            <img 
              src="https://yt3.googleusercontent.com/i8QyOXvpeMckQ0LPnVTwFjks-org7y9rP-2eSNPYdBPZuDDMBk3wznHbwa7oQfbT763spDyFjA=s900-c-k-c0x00ffffff-no-rj"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Unlock Your Training</h2>
          <p className="text-gray-600 mb-6">Enter your email to access my proven Amazon success formula</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                required
                placeholder="Enter your email address"
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 border focus:outline-none focus:ring-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-75 bg-blue-500 text-white hover:bg-blue-600"
            >
              {isSubmitting ? 'Processing...' : 'Get A Free Consult'}
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-500">
            By submitting, you agree to receive email communications
          </p>
        </div>
      </div>
    </div>
  );
};