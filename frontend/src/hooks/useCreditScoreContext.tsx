// hooks/useCreditScoreContext.ts
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CreditScoreContextType {
  calculatedScore: number;
  setCalculatedScore: (score: number) => void;
  isRealScore: boolean;
}

const CreditScoreContext = createContext<CreditScoreContextType | undefined>(undefined);

export const CreditScoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [calculatedScore, setCalculatedScore] = useState<number>(0);
  const [isRealScore, setIsRealScore] = useState<boolean>(false);

  const updateScore = (score: number) => {
    setCalculatedScore(score);
    setIsRealScore(true);
  };

  return (
    <CreditScoreContext.Provider value={{ 
      calculatedScore, 
      setCalculatedScore: updateScore,
      isRealScore 
    }}>
      {children}
    </CreditScoreContext.Provider>
  );
};

export const useCreditScoreContext = () => {
  const context = useContext(CreditScoreContext);
  if (context === undefined) {
    throw new Error('useCreditScoreContext must be used within a CreditScoreProvider');
  }
  return context;
};