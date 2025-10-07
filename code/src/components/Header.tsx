import React, { useState, createContext, useContext } from 'react';
import { DollarSign } from 'lucide-react';

// Currency Context
interface CurrencyContextType {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  formatCurrency: (value: number) => string;
  getCurrencySymbol: () => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0 },   //reference currency
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate: 1.35 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.85 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.73 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 110.0 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.45 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 1.25 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rate: 0.92 }
];

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');

  const formatCurrency = (value: number) => {        //number = input, number(rate) = output
    const currency = currencies.find(c => c.code === selectedCurrency);
    const symbol = currency?.symbol || '$';
    const convertedValue = value * (currency?.rate || 1.0);  
    return `${symbol}${convertedValue.toFixed(2)}`; 
  };

  const getCurrencySymbol = () => {
    const currency = currencies.find(c => c.code === selectedCurrency);
    return currency?.symbol || '$';
  };

  return (
    <CurrencyContext.Provider value={{        //makes currency state available throughout app
      selectedCurrency,
      setSelectedCurrency,
      formatCurrency,
      getCurrencySymbol
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

const Header: React.FC = () => {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  return (
    <header className="bg-white shadow-sm border-b border-gray-400 px-6 py-2">
      <div className="flex justify-end items-center">
        <div className="flex items-center space-x-2">
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)} //updates currency state
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {currencies.map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.code} - {currency.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};

export default Header;
