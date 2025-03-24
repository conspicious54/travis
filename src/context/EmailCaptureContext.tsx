import React, { createContext, useContext, useState } from 'react';

interface EmailCaptureContextType {
  isUnlocked: boolean;
  setIsUnlocked: (value: boolean) => void;
}

const EmailCaptureContext = createContext<EmailCaptureContextType | undefined>(undefined);

export const EmailCaptureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);

  return (
    <EmailCaptureContext.Provider value={{ isUnlocked, setIsUnlocked }}>
      {children}
    </EmailCaptureContext.Provider>
  );
};

export const useEmailCapture = () => {
  const context = useContext(EmailCaptureContext);
  if (context === undefined) {
    throw new Error('useEmailCapture must be used within an EmailCaptureProvider');
  }
  return context;
};