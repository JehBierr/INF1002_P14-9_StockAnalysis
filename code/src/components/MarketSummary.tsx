import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, DollarSign, BarChart3, AlertCircle } 
  from 'lucide-react';
import { stockAPIService, StockMetrics } from '../services/stockAPIService';

const MarketSummary: React.FC = () => {
  const [marketData, setMarketData] = useState<{[key: string]: StockMetrics}>({});
  const [correlationMatrix, setCorrelationMatrix] = useState<{[key: string]: {[key: string]: number}}>({});
  const [availableStocks, setAvailableStocks] = useState<string[]>([]);
  const [marketOverview, setMarketOverview] = useState<any[]>([]);
  const [selectedCorrelationStock, setSelectedCorrelationStock] = useState<string>('');
  const [showCorrelationMatrix, setShowCorrelationMatrix] = useState<boolean>(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const stocks = await stockAPIService.getAvailableStocks();
        setAvailableStocks(stocks);
        
        // Set default selected stock
        if (stocks.length > 0 && !selectedCorrelationStock) {
          setSelectedCorrelationStock(stocks[0]);
        }
        
        // Load market data
        await loadMarketData(stocks);
        await loadCorrelationData();
      } catch (error) {
        console.error('Error loading market data:', error);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    // Set default selected stock when stocks are loaded
    if (availableStocks.length > 0 && !selectedCorrelationStock) {
      setSelectedCorrelationStock(availableStocks[0]);
    }
  }, [availableStocks]);

  const loadMarketData = async (stocks: string[]) => {
    try {
      const data: {[key: string]: StockMetrics} = {};
      
      for (const stock of stocks) {
        try {
          const metrics = await stockAPIService.getStockMetrics(stock);
          data[stock] = metrics;
        } catch (error) {
          console.error(`Error loading data for ${stock}:`, error);
        }
      }
      
      setMarketData(data);
      
      // Create market overview data
      const overview = stocks.map(stock => {
        const metrics = data[stock];
        if (!metrics) return null;
        
        const dataRSI = metrics.rsi || 50; // Default to 50 if RSI not available
        const rsiString = dataRSI.toString();
        const rsieditted = rsiString.replace("%", "");
        const newRSI = Number(rsieditted);
        return {
          stock,
          currentPrice: metrics.maxPrice, // Using maxPrice as current price
          dailyChange: metrics.priceChangePercent || 0,
          totalReturn: metrics.totalReturn || 0,
          volatility: metrics.volatility || 0,
          sharpeRatio: metrics.sharpeRatio || 0,
          volume: metrics.totalVolume,
          rsi: Number(newRSI.toFixed(1))
        };
      }).filter(Boolean);
      
      setMarketOverview(overview);
    } catch (error) {
      console.error('Error loading market data:', error);
    }
  };

  const loadCorrelationData = async () => {
    try {
      const correlation = await stockAPIService.getCorrelationMatrix();
      setCorrelationMatrix(correlation);
    } catch (error) {
      console.error('Error loading correlation data:', error);
    }
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  const getMarketStats = () => {
    const stocks = Object.values(marketData);
    if (stocks.length === 0) return null;

    const totalReturn = stocks.length > 0 ? stocks.reduce((sum, stock) => sum + stock.totalReturn, 0) / stocks.length : 0;
    const avgVolatility = stocks.length > 0 ? stocks.reduce((sum, stock) => sum + stock.volatility, 0) / stocks.length : 0;
    const avgSharpe = stocks.length > 0 ? stocks.reduce((sum, stock) => sum + stock.sharpeRatio, 0) / stocks.length : 0;
    const totalVolume = stocks.reduce((sum, stock) => sum + stock.totalVolume, 0);

    return {
      totalReturn,
      avgVolatility,
      avgSharpe,
      totalVolume,
      positiveStocks: stocks.length, 
      totalStocks: stocks.length
    };
  };

  const marketStats = getMarketStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <Activity className="w-8 h-8 mr-3 text-blue-600" />
          Market Summary
        </h2>
      </div>

      {/* Market Overview Stats */}
      {marketStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Market Return</p>
                <p className={`text-2xl font-bold ${
                  marketStats.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercent(marketStats.totalReturn)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Volatility</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercent(marketStats.avgVolatility)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Sharpe Ratio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {marketStats.avgSharpe.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Volume</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(marketStats.totalVolume)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Market Overview Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Stock Overview
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Daily Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Return
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volatility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RSI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sharpe Ratio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volume
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {marketOverview.map((stock: any) => (
                <tr key={stock.stock} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {stock.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(stock.currentPrice)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    stock.dailyChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercent(stock.dailyChange)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    stock.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercent(stock.totalReturn)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPercent(stock.volatility)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {stock.rsi}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {stock.sharpeRatio.toFixed(2)}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(stock.volume)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      stock.totalReturn > 10 
                        ? 'bg-green-100 text-green-800'
                        : stock.totalReturn > 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {stock.totalReturn > 10 ? 'Strong' : stock.totalReturn > 0 ? 'Positive' : 'Negative'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correlation Heatmap */}
      {Object.keys(correlationMatrix).length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Stock Correlation Matrix
          </h3>
          
          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableStocks.map(stock1 => (
                <div key={stock1} className="space-y-2">
                  <h4 className="font-medium text-gray-800">{stock1} Correlations</h4>
                  {availableStocks.map(stock2 => {
                    if (stock1 === stock2) return null;
                    const correlation = correlationMatrix[stock1]?.[stock2] || 0;
                    const intensity = Math.abs(correlation);
                    const colorClass = intensity > 0.7 
                      ? 'bg-red-100 text-red-800' 
                      : intensity > 0.4 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800';
                    
                    return (
                      <div key={stock2} className={`p-2 rounded ${colorClass} flex justify-between text-sm`}>
                        <span>{stock2}</span>
                        <span className="font-medium">{correlation.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>High Correlation (&gt;0.7)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>Moderate Correlation (0.4-0.7)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Low Correlation (&lt;0.4)</span>
              </div>
            </div>
            
            {/* Toggle button for correlation matrix */}
            <button
              onClick={() => setShowCorrelationMatrix(!showCorrelationMatrix)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors duration-200"
            >
              <span>{showCorrelationMatrix ? 'Hide' : 'Show'} Correlation Matrix</span>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${showCorrelationMatrix ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Collapsible Correlation Matrix Heatmap */}
          {showCorrelationMatrix && (
            <div className="mt-6 border-t pt-6">
              <h4 className="font-medium text-gray-800 mb-4">Complete Correlation Matrix Heatmap</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 border-b">Stock</th>
                      {availableStocks.map(stock => (
                        <th key={stock} className="px-3 py-3 text-center text-xs font-medium text-gray-500 border-b min-w-[80px]">
                          {stock}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {availableStocks.map(stock1 => (
                      <tr key={stock1} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium border-b text-gray-900">
                          {stock1}
                        </td>
                        {availableStocks.map(stock2 => {
                          const correlation = correlationMatrix[stock1]?.[stock2] || 0;
                          const intensity = Math.abs(correlation);
                          
                          // Create heatmap colors based on correlation strength
                          let cellClass = 'px-3 py-3 text-center text-xs border-b relative ';
                          
                          if (stock1 === stock2) {
                            cellClass += 'bg-gray-300 font-bold text-gray-900';
                          } else {
                            // Color based on correlation intensity
                            if (intensity > 0.7) {
                              cellClass += 'text-red-900 font-medium';
                            } else if (intensity > 0.4) {
                              cellClass += 'text-yellow-900 font-medium';
                            } else {
                              cellClass += 'text-green-900';
                            }
                          }
                          
                          // Dynamic background color based on correlation intensity
                          const getBackgroundColor = () => {
                            if (stock1 === stock2) return '#d1d5db'; // Gray for diagonal
                            
                            if (intensity > 0.7) {
                              // High correlation - Red background
                              return `rgba(239, 68, 68, ${0.3 + intensity * 0.4})`;
                            } else if (intensity > 0.4) {
                              // Moderate correlation - Yellow background
                              return `rgba(245, 158, 11, ${0.2 + intensity * 0.4})`;
                            } else {
                              // Low correlation - Green background
                              return `rgba(34, 197, 94, ${0.1 + intensity * 0.3})`;
                            }
                          };
                          
                          return (
                            <td 
                              key={stock2} 
                              className={cellClass}
                              style={{ backgroundColor: getBackgroundColor() }}
                            >
                              {stock1 === stock2 ? '1.00' : correlation.toFixed(3)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Heatmap Legend */}
              <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-4 h-4 bg-green-200 rounded"></div>
                    <div className="w-4 h-4 bg-green-400 rounded"></div>
                    <div className="w-4 h-4 bg-green-600 rounded"></div>
                  </div>
                  <span className="text-gray-600">Low Correlation (&lt;0.4)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-4 h-4 bg-yellow-200 rounded"></div>
                    <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                    <div className="w-4 h-4 bg-yellow-600 rounded"></div>
                  </div>
                  <span className="text-gray-600">Moderate Correlation (0.4-0.7)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-4 h-4 bg-red-200 rounded"></div>
                    <div className="w-4 h-4 bg-red-400 rounded"></div>
                    <div className="w-4 h-4 bg-red-600 rounded"></div>
                  </div>
                  <span className="text-gray-600">High Correlation (&gt;0.7)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Market Insights */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Market Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Market Performance
              </h4>
              <p className="text-sm text-blue-800">
                {marketStats && marketStats.positiveStocks > marketStats.totalStocks / 2
                  ? `Market is showing positive momentum with ${marketStats.positiveStocks}/${marketStats.totalStocks} stocks in positive territory.`
                  : `Market is experiencing challenges with only ${marketStats?.positiveStocks}/${marketStats?.totalStocks} stocks showing positive returns.`
                }
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Risk Assessment
              </h4>
              <p className="text-sm text-green-800">
                {marketStats && marketStats.avgVolatility > 20
                  ? 'High market volatility detected. Consider defensive positioning.'
                  : marketStats && marketStats.avgVolatility > 10
                  ? 'Moderate market volatility. Balanced approach recommended.'
                  : 'Low market volatility. Suitable for growth strategies.'
                }
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Diversification
              </h4>
              <p className="text-sm text-purple-800">
                {Object.keys(correlationMatrix).length > 0
                  ? 'Correlation analysis shows diversification opportunities across different sectors.'
                  : 'Analyzing correlation patterns to identify diversification benefits.'
                }
              </p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Recommendations
              </h4>
              <p className="text-sm text-orange-800">
                {marketStats && marketStats.avgSharpe > 1
                  ? 'Strong risk-adjusted returns across the market. Consider maintaining current positions.'
                  : 'Monitor individual stock performance and consider rebalancing portfolios.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketSummary;
