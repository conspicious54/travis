import React, { createContext, useContext, useState } from 'react';

interface ExitIntentContextType {
  showExitPopup: boolean;
  setShowExitPopup: (value: boolean) => void;
  hasTriggered: boolean;
  setHasTriggered: (value: boolean) => void;
}

const ExitIntentContext = createContext<ExitIntentContextType | undefined>(undefined);

export const ExitIntentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  return (
    <ExitIntentContext.Provider value={{ showExitPopup, setShowExitPopup, hasTriggered, setHasTriggered }}>
      {children}
    </ExitIntentContext.Provider>
  );
};

export const useExitIntent = () => {
  const context = useContext(ExitIntentContext);
  if (context === undefined) {
    throw new Error('useExitIntent must be used within an ExitIntentProvider');
  }
  return context;
};