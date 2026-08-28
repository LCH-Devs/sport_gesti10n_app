'use client';

import React, { createContext, useContext, useState } from 'react';

type ChromeContextType = {
  hideChrome: boolean;
  setHideChrome: (hidden: boolean) => void;
};

const ChromeContext = createContext<ChromeContextType | undefined>(undefined);

export function ChromeProvider({ children }: { children: React.ReactNode }) {
  const [hideChrome, setHideChrome] = useState(false);
  return (
    <ChromeContext.Provider value={{ hideChrome, setHideChrome }}>
      {children}
    </ChromeContext.Provider>
  );
}

export function useChrome() {
  const context = useContext(ChromeContext);
  if (!context) {
    throw new Error('useChrome must be used within ChromeProvider');
  }
  return context;
}
