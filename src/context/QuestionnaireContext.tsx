import React, { createContext, useContext, useState } from 'react';

interface QuestionnaireContextType {
  showQuestionnaire: boolean;
  setShowQuestionnaire: (value: boolean) => void;
  isSubmitted: boolean;
  setIsSubmitted: (value: boolean) => void;
}

const QuestionnaireContext = createContext<QuestionnaireContextType | undefined>(undefined);

export const QuestionnaireProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  return (
    <QuestionnaireContext.Provider value={{ 
      showQuestionnaire, 
      setShowQuestionnaire,
      isSubmitted,
      setIsSubmitted
    }}>
      {children}
    </QuestionnaireContext.Provider>
  );
};

export const useQuestionnaire = () => {
  const context = useContext(QuestionnaireContext);
  if (context === undefined) {
    throw new Error('useQuestionnaire must be used within a QuestionnaireProvider');
  }
  return context;
};