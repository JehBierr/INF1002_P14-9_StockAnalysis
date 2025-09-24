import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Activity, DollarSign } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header, { CurrencyProvider } from './components/Header';
import StockAnalysis from './components/StockAnalysis';
import StockComparison from './components/StockComparison';
import MarketSummary from './components/MarketSummary';
import MaxProfitAnalysis from './components/MaxProfitAnalysis';
import LoadingSpinner from './components/LoadingSpinner';
import { stockAPIService } from './services/stockAPIService';

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'Stock Analysis',
    label: 'Stock Analysis',
    icon: TrendingUp,
    path: '/stock-analysis'
  },
  {
    id: 'max-profit-analysis',
    label: 'Max Profit Analysis',
    icon: DollarSign,
    path: '/max-profit-analysis'
  },
  {
    id: 'stock-comparison',
    label: 'Stock Comparison',
    icon: BarChart3,
    path: '/stock-comparison'
  },
  {
    id: 'market-summary',
    label: 'Market Summary',
    icon: Activity,
    path: '/market-summary'
  }
];

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Test connection to Python backend
        await stockAPIService.healthCheck();
        setError(null);
      } catch (err) {
        setError('Failed to connect to Python backend. Please ensure the Python server is running on http://localhost:5001');
        console.error('Error connecting to Python backend:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-4">Error Loading Data</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <CurrencyProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex h-screen">
          {/* Sidebar */}
          <Sidebar navigationItems={navigationItems} />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            
            <main className="flex-1 p-6 overflow-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/stock-analysis" replace />} />
                <Route path="/stock-analysis" element={<StockAnalysis />} />
                <Route path="/max-profit-analysis" element={<MaxProfitAnalysis />} />
                <Route path="/stock-comparison" element={<StockComparison />} />
                <Route path="/market-summary" element={<MarketSummary />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </CurrencyProvider>
  );
}

export default App;
