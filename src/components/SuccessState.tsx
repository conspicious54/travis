import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { userDataService } from '../services/userDataService';
import { Testimonials } from './Testimonials';

interface SuccessStateProps {
  theme?: 'light' | 'dark';
}

export const SuccessState: React.FC<SuccessStateProps> = ({ theme = 'dark' }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const isLight = theme === 'light';

  useEffect(() => {
    // Show calendar after success message
    const calendarTimer = setTimeout(() => {
      setShowCalendar(true);
      // Load Calendly script
      const script = document.createElement('script');
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      document.body.appendChild(script);
    }, 1000);

    return () => {
      clearTimeout(calendarTimer);
    };
  }, []);

  // Get user data for prefill
  const userData = userDataService.getCurrentData();
  const calendlyUrl = new URL('https://calendly.com/travis-passionproduct/amazon-strategy-call');
  
  // Add query parameters
  calendlyUrl.searchParams.append('hide_event_type_details', '1');
  calendlyUrl.searchParams.append('hide_gdpr_banner', '1');
  
  // Add prefill parameters if we have the data
  if (userData.email) {
    calendlyUrl.searchParams.append('email', userData.email);
  }
  if (userData.firstName) {
    calendlyUrl.searchParams.append('first_name', userData.firstName);
  }
  if (userData.lastName) {
    calendlyUrl.searchParams.append('last_name', userData.lastName);
  }

  return (
    <div className={`min-h-screen ${
      isLight ? 'bg-white' : 'bg-[#0A0A0A]'
    }`}>
      <div className="py-12 animate-popup px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className={`w-20 h-20 ${
            isLight 
              ? 'bg-blue-500/10' 
              : 'bg-[#FF0000]/10'
          } rounded-full flex items-center justify-center mx-auto mb-8`}>
            <Check className={`w-10 h-10 ${
              isLight ? 'text-blue-500' : 'text-[#FF0000]'
            }`} />
          </div>
          
          <h2 className={`text-3xl font-bold ${
            isLight ? 'text-gray-900' : 'text-white'
          } mb-4`}>
            Congrats - Your Application is Pre-Approved
          </h2>
          <h3 className={`text-xl font-bold ${
            isLight ? 'text-blue-600' : 'text-[#FF0000]'
          } mb-8`}>
            Final Step: Book Your Call Below
          </h3>

          {showCalendar && (
            <div 
              className="calendly-inline-widget" 
              data-url={calendlyUrl.toString()}
              style={{ minWidth: '320px', height: '700px' }}
            />
          )}
        </div>

        <div className="mt-16">
          <Testimonials theme={theme} />
        </div>
      </div>
    </div>
  );
};