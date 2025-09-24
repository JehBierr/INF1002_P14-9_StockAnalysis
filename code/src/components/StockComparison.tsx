import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import { stockAPIService, StockMetrics } from '../services/stockAPIService';

const StockComparison: React.FC = () => {
  const [selectedStocks, setSelectedStocks] = useState<string[]>(['APPLE', 'Google']);
  const [chartType, setChartType] = useState<'price' | 'normalized' | 'returns'>('price');
  const [availableStocks, setAvailableStocks] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<{[key: string]: StockMetrics}>({});

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  useEffect(() => {
    const loadStocks = async () => {
      try {
        const stocks = await stockAPIService.getAvailableStocks();
        setAvailableStocks(stocks);
      } catch (error) {
        console.error('Error loading stocks:', error);
      }
    };
    
    loadStocks();
  }, []);

  useEffect(() => {
    if (selectedStocks.length > 0) {
      generateComparisonData();
      generatePerformanceData();
    }
  }, [selectedStocks, chartType]);

  const generateComparisonData = async () => {
    try {
      const allData: {[key: string]: any[]} = {};
      let minLength = Infinity;

      // Get data for all selected stocks
      for (const stock of selectedStocks) {
        const data = await stockAPIService.getChartData(stock);
        allData[stock] = data;
        minLength = Math.min(minLength, data.length);
      }

      // Create comparison dataset
      const comparisonArray = [];
      for (let i = 0; i < minLength; i++) {
        const dataPoint: any = {
          date: allData[selectedStocks[0]][i].date
        };

        selectedStocks.forEach(stock => {
          const row = allData[stock][i];
          if (chartType === 'price') {
            dataPoint[stock] = row.close;
          } else if (chartType === 'normalized') {
            // Normalize to starting value of 100
            const normalizedValue = (row.close / allData[stock][0].close) * 100;
            dataPoint[stock] = normalizedValue;
          } else if (chartType === 'returns') {
            dataPoint[stock] = row.dailyReturn;
          }
        });

        comparisonArray.push(dataPoint);
      }

      setComparisonData(comparisonArray);
    } catch (error) {
      console.error('Error generating comparison data:', error);
    }
  };

  const generatePerformanceData = async () => {
    try {
      const performance: {[key: string]: StockMetrics} = {};
      
      for (const stock of selectedStocks) {
        try {
          const metrics = await stockAPIService.getStockMetrics(stock);
          performance[stock] = metrics;
        } catch (error) {
          console.error(`Error getting metrics for ${stock}:`, error);
        }
      }

      setPerformanceData(performance);
    } catch (error) {
      console.error('Error generating performance data:', error);
    }
  };

  const handleStockToggle = (stock: string) => {
    setSelectedStocks(prev => {
      if (prev.includes(stock)) {
        return prev.filter(s => s !== stock);
      } else {
        return [...prev, stock];
      }
    });
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  const getChartTitle = () => {
    switch (chartType) {
      case 'price': return 'Stock Price Comparison';
      case 'normalized': return 'Normalized Returns Comparison';
      case 'returns': return 'Daily Returns Comparison';
      default: return 'Stock Comparison';
    }
  };

  const getYAxisLabel = () => {
    switch (chartType) {
      case 'price': return 'Price ($)';
      case 'normalized': return 'Normalized Value';
      case 'returns': return 'Daily Return (%)';
      default: return 'Value';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
          Stock Comparison
        </h2>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stock Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Stocks to Compare
            </label>
            <div className="space-y-2">
              {availableStocks.map(stock => (
                <label key={stock} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStocks.includes(stock)}
                    onChange={() => handleStockToggle(stock)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{stock}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Chart Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Chart Type
            </label>
            <div className="space-y-2">
              {[
                { value: 'price', label: 'Close Price' },
                { value: 'normalized', label: 'Normalized Returns' },
                { value: 'returns', label: 'Daily Returns' }
              ].map(type => (
                <label key={type.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="chartType"
                    value={type.value}
                    checked={chartType === type.value}
                    onChange={(e) => setChartType(e.target.value as any)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      {selectedStocks.length > 1 ? (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {getChartTitle()}
          </h3>
          {comparisonData.length > 0 ? (
            <ResponsiveContainer width="100%" height={500}>
              <LineChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft' }} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    chartType === 'price' ? formatCurrency(value) : 
                    chartType === 'normalized' ? value.toFixed(2) :
                    formatPercent(value),
                    name
                  ]}
                />
                <Legend />
                {selectedStocks.map((stock, index) => (
                  <Line
                    key={stock}
                    type="monotone"
                    dataKey={stock}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Loading chart data...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="flex items-center justify-center h-96 text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Please select at least 2 stocks to compare</p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Summary Table */}
      {selectedStocks.length > 0 && Object.keys(performanceData).length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Performance Summary
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
                    Total Return
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volatility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sharpe Ratio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Volume
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedStocks.map(stock => {
                  const metrics = performanceData[stock];
                  if (!metrics) return null;
                  
                  return (
                    <tr key={stock} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(metrics.maxPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                        {formatPercent(metrics.priceChangePercent || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPercent(metrics.totalReturn || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPercent(metrics.volatility || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {metrics.sharpeRatio ? metrics.sharpeRatio.toFixed(2) : '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatNumber(metrics.totalVolume)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {selectedStocks.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Best Performer</p>
                <p className="text-xl font-bold text-gray-900">
                  {Object.keys(performanceData)[0] || 'N/A'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Most Volatile</p>
                <p className="text-xl font-bold text-gray-900">
                  {Object.keys(performanceData)[0] || 'N/A'}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Highest Sharpe</p>
                <p className="text-xl font-bold text-gray-900">
                  {Object.keys(performanceData)[0] || 'N/A'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockComparison;
