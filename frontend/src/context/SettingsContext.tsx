import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

interface SettingsContextType {
  currencySymbol: string;
  currencyCode: string;
  clinicName: string;
  isCurrencyLocked: boolean;
  formatCurrency: (amount: number) => string;
  updateCurrency: (symbol: string, code: string) => Promise<void>;
  reloadSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [currencyCode, setCurrencyCode] = useState<string>('USD');
  const [clinicName, setClinicName] = useState<string>('ApexCare HMS Enterprise');
  const [isCurrencyLocked, setIsCurrencyLocked] = useState<boolean>(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.CURRENCY_SYMBOL) setCurrencySymbol(res.data.CURRENCY_SYMBOL);
      if (res.data.CURRENCY_CODE) setCurrencyCode(res.data.CURRENCY_CODE);
      if (res.data.CLINIC_NAME) setClinicName(res.data.CLINIC_NAME);
      if (res.data.IS_CURRENCY_LOCKED) setIsCurrencyLocked(res.data.IS_CURRENCY_LOCKED === 'true');
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  const formatCurrency = (amount: number): string => {
    const formattedNum = (amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${currencySymbol} ${formattedNum}`;
  };

  const updateCurrency = async (symbol: string, code: string) => {
    try {
      await api.put('/settings', {
        CURRENCY_SYMBOL: symbol,
        CURRENCY_CODE: code,
      });
      setCurrencySymbol(symbol);
      setCurrencyCode(code);
      await fetchSettings();
    } catch (err: any) {
      throw err;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        currencySymbol,
        currencyCode,
        clinicName,
        isCurrencyLocked,
        formatCurrency,
        updateCurrency,
        reloadSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
