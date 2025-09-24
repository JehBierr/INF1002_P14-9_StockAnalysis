// API service for communicating with Python backend
const API_BASE_URL = 'http://localhost:5001/api';

export interface StockData {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
  Daily_Return: number;
  SMA_5: number;
  SMA_10: number;
  SMA_20: number;
  SMA_50: number;
  RSI: number;
  IsUpward: boolean;
  IsDownward: boolean;
  UpwardRun: number;
  DownwardRun: number;
}

export interface StockMetrics {
  totalDays: number;
  startDate: string;
  endDate: string;
  maxPrice: number;
  minPrice: number;
  avgPrice: number;
  totalVolume: number;
  avgVolume: number;
  maxProfit: number;
  transactions: Transaction[];
  runAnalysis: RunAnalysis;
  totalReturn: number;
  volatility: number;
  sharpeRatio: number;
  currentPrice: number;
  priceChangePercent: number;
  rsi: number;
}

export interface Transaction {
  buyDate: string;
  sellDate: string;
  buyPrice: number;
  sellPrice: number;
  profit: number;
}

export interface RunAnalysis {
  totalUpwardDays: number;
  totalDownwardDays: number;
  longestUpwardRun: number;
  longestDownwardRun: number;
}

export interface ChartData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma5: number;
  sma10: number;
  sma20: number;
  sma50: number;
  rsi: number;
  dailyReturn: number;
  isUpward: boolean;
  isDownward: boolean;
  upwardRun: number;
  downwardRun: number;
}

class StockAPIService {
  private async fetchAPI<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  async getAvailableStocks(): Promise<string[]> {
    return this.fetchAPI<string[]>('/stocks');
  }

  async getStockData(stockName: string): Promise<StockData[]> {
    return this.fetchAPI<StockData[]>(`/stocks/${stockName}`);
  }

  async getStockMetrics(
    stockName: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<StockMetrics> {
    let endpoint = `/stocks/${stockName}/metrics`;
    const params = new URLSearchParams();
    
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    return this.fetchAPI<StockMetrics>(endpoint);
  }

  async getChartData(
    stockName: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<ChartData[]> {
    let endpoint = `/stocks/${stockName}/chart-data`;
    const params = new URLSearchParams();
    
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    return this.fetchAPI<ChartData[]>(endpoint);
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.fetchAPI<{ status: string; message: string }>('/health');
  }

  async getCorrelationMatrix(): Promise<{[key: string]: {[key: string]: number}}> {
    return this.fetchAPI<{[key: string]: {[key: string]: number}}>('/correlation-matrix');
  }
}

export const stockAPIService = new StockAPIService();
