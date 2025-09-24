import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import { TrendingUp, DollarSign, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { stockAPIService, StockMetrics, ChartData, Transaction } from '../services/stockAPIService';
import { useCurrency } from './Header';

const MaxProfitAnalysis: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const [selectedStock, setSelectedStock] = useState<string>('APPLE');
  const [maxProfit, setMaxProfit] = useState<{maxProfit: number, transactions: Transaction[]} | null>(null);
  const [stockData, setStockData] = useState<ChartData[]>([]);
  const [availableStocks, setAvailableStocks] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('2023-08-01');
  const [endDate, setEndDate] = useState<string>('2025-08-29');
  const [showAllTransactions, setShowAllTransactions] = useState<boolean>(false);

  useEffect(() => {
    const loadStocks = async () => {
      try {
        const stocks = await stockAPIService.getAvailableStocks();
        setAvailableStocks(stocks);
        
        if (stocks.length > 0) {
          const data = await stockAPIService.getStockData(stocks[0]);
          if (data.length > 0) {
            setStartDate(data[0].Date);
            setEndDate(data[data.length - 1].Date);
          }
        }
      } catch (error) {
        console.error('Error loading stocks:', error);
      }
    };
    
    loadStocks();
  }, []);

  // Update dates when selected stock changes
  useEffect(() => {
    const updateDates = async () => {
      if (selectedStock) {
        try {
          const data = await stockAPIService.getStockData(selectedStock);
          if (data.length > 0) {
            setStartDate(data[0].Date);
            setEndDate(data[data.length - 1].Date);
          }
        } catch (error) {
          console.error('Error updating dates:', error);
        }
      }
    };
    
    updateDates();
  }, [selectedStock]);

  useEffect(() => {
    const loadData = async () => {
      if (selectedStock && startDate && endDate) {
        try {
          // Load metrics and chart data in parallel
          const [metricsData, chartData] = await Promise.all([
            stockAPIService.getStockMetrics(selectedStock, startDate, endDate),
            stockAPIService.getChartData(selectedStock, startDate, endDate)
          ]);
          
          setStockData(chartData);
          setMaxProfit({
            maxProfit: metricsData.maxProfit,
            transactions: metricsData.transactions
          });
        } catch (error) {
          console.error('Error loading data:', error);
        }
      }
    };
    
    loadData();
  }, [selectedStock, startDate, endDate]);

  const formatPercent = (value: number) => `${value.toFixed(2)}%`;
  const formatNumber = (value: number) => value.toLocaleString();


  const chartData = stockData;

  // Create transaction markers for the chart
  const transactionMarkers = maxProfit?.transactions.map((transaction, index) => ({
    date: new Date(transaction.buyDate).toLocaleDateString(),
    buyPrice: transaction.buyPrice,
    sellPrice: transaction.sellPrice,
    profit: transaction.profit,
    transactionNumber: index + 1
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <DollarSign className="w-8 h-8 mr-3 text-green-600" />
          Max Profit Analysis
        </h2>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Stock
            </label>
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="input-field"
            >
              {availableStocks.map(stock => (
                <option key={stock} value={stock}>{stock}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Max Profit Summary */}
      {maxProfit && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Max Profit</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(maxProfit.maxProfit)}
                </p>
                <p className="text-sm text-gray-500">
                  From {maxProfit.transactions.length} transactions
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-3xl font-bold text-blue-600">
                  {maxProfit.transactions.length}
                </p>
                <p className="text-sm text-gray-500">
                  Buy & Sell pairs
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Profit</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(maxProfit.transactions.length > 0 ? maxProfit.maxProfit / maxProfit.transactions.length : 0)}
                </p>
                <p className="text-sm text-gray-500">
                  Per transaction
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Price Chart with Transaction Points */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {selectedStock} Price Chart with Transaction Points
        </h3>
        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value: any, name: string) => [
                name === 'close' ? formatCurrency(value) : formatNumber(value),
                name.toUpperCase()
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Close Price"
            />
            {/* Transaction markers */}
            {transactionMarkers.map((marker, index) => (
              <ReferenceLine 
                key={`buy-${index}`}
                x={marker.date} 
                stroke="#22c55e" 
                strokeDasharray="5 5"
                label={{ value: `Buy ${marker.transactionNumber}`, position: "top" }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Transaction History */}
      {maxProfit && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Transaction History
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Showing {showAllTransactions ? maxProfit.transactions.length : Math.min(10, maxProfit.transactions.length)} of {maxProfit.transactions.length} transactions
              </span>
              <button
                onClick={() => setShowAllTransactions(!showAllTransactions)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                {showAllTransactions ? 'Show Less' : 'Show All'}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buy Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buy Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(showAllTransactions ? maxProfit.transactions : maxProfit.transactions.slice(0, 10)).map((transaction, index) => {
                  const returnPercent = ((transaction.sellPrice - transaction.buyPrice) / transaction.buyPrice) * 100;
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.buyDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(transaction.buyPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.sellDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(transaction.sellPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(transaction.profit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatPercent(returnPercent)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!showAllTransactions && maxProfit.transactions.length > 10 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                ... and {maxProfit.transactions.length - 10} more transactions
              </p>
            </div>
          )}
        </div>
      )}

      {/* Algorithm Explanation */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Max Profit Algorithm Explanation
        </h3>
        <div className="prose max-w-none">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-blue-900 mb-2">Algorithm: "Best Time to Buy and Sell Stock II"</h4>
            <p className="text-blue-800 text-sm">
              This algorithm finds the maximum profit by allowing multiple transactions. 
              It identifies all local minima (buy points) and local maxima (sell points) 
              to maximize total profit across the entire dataset.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                <ArrowDownRight className="w-4 h-4 mr-2" />
                Buy Strategy
              </h4>
              <ul className="text-green-800 text-sm space-y-1">
                <li>• Find local minima (price valleys)</li>
                <li>• Buy when price starts rising</li>
                <li>• Avoid buying at peaks</li>
              </ul>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Sell Strategy
              </h4>
              <ul className="text-red-800 text-sm space-y-1">
                <li>• Find local maxima (price peaks)</li>
                <li>• Sell when price starts falling</li>
                <li>• Maximize profit per transaction</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaxProfitAnalysis;
