from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import os
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

class StockDataProcessor:
    def __init__(self):
        self.data_dir = '../public'  # Path to CSV files
        
    def load_stock_data(self, stock_name):
        """Load stock data from CSV file"""
        try:
            # Map display names back to CSV filenames
            csv_name = stock_name
            if stock_name == 'Google':
                csv_name = 'GOOG'
            
            csv_path = os.path.join(self.data_dir, f'{csv_name}.csv')
            if not os.path.exists(csv_path):
                csv_path = os.path.join(self.data_dir, f'{csv_name}_Stocks.csv')
            
            if not os.path.exists(csv_path):
                return None
                
            df = pd.read_csv(csv_path)
            return self.process_stock_data(df)
        except Exception as e:
            print(f"Error loading {stock_name}: {e}")
            return None
    
    def parse_date(self, date_str):
        """Parse various date formats"""
        try:
            # Handle DD/MM/YYYY HH:mm:ss format
            if '/' in date_str and ':' in date_str:
                date_part, time_part = date_str.split(' ')
                parts = date_part.split('/')
                if len(parts) == 3:
                    day, month, year = parts
                    return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
            
            # Handle M/D/YYYY format
            elif '/' in date_str and ':' not in date_str:
                parts = date_str.split('/')
                if len(parts) == 3:
                    month, day, year = parts
                    return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
            
            # Handle Excel serial numbers
            try:
                excel_date = float(date_str)
                if excel_date > 100000:  # Skip invalid Excel dates
                    return None
                # Convert Excel serial number to date
                base_date = datetime(1900, 1, 1)
                date = base_date + pd.Timedelta(days=excel_date - 2)
                return date.strftime('%Y-%m-%d')
            except:
                pass
                
            return None
        except:
            return None
    
    def process_stock_data(self, df):
        """Process raw stock data and calculate indicators"""
        try:
            # Clean and parse dates
            df['Date'] = df['Date'].apply(self.parse_date)
            df = df.dropna(subset=['Date'])  # Remove invalid dates
            
            # Ensure numeric columns
            numeric_cols = ['Open', 'High', 'Low', 'Close', 'Volume']
            for col in numeric_cols:
                df[col] = pd.to_numeric(df[col], errors='coerce')
            
            df = df.dropna(subset=numeric_cols)
            df = df.sort_values('Date').reset_index(drop=True)
            
            # Calculate daily returns
            df['Daily_Return'] = df['Close'].pct_change().fillna(0)
            
            # Calculate moving averages
            df['SMA_5'] = df['Close'].rolling(window=5).mean()
            df['SMA_10'] = df['Close'].rolling(window=10).mean()
            df['SMA_20'] = df['Close'].rolling(window=20).mean()
            df['SMA_50'] = df['Close'].rolling(window=50).mean()
            
            # Calculate RSI (Relative Strength Index)
            df['RSI'] = self.calculate_rsi(df['Close'], period=14)
            
            # Calculate runs (upward/downward streaks)
            df['IsUpward'] = df['Daily_Return'] > 0
            df['IsDownward'] = df['Daily_Return'] < 0
            
            # Calculate run lengths
            df['UpwardRun'] = 0
            df['DownwardRun'] = 0
            
            current_upward = 0
            current_downward = 0
            
            for i in range(len(df)):
                if df.iloc[i]['IsUpward']:
                    current_upward += 1
                    current_downward = 0
                    df.iloc[i, df.columns.get_loc('UpwardRun')] = current_upward
                elif df.iloc[i]['IsDownward']:
                    current_downward += 1
                    current_upward = 0
                    df.iloc[i, df.columns.get_loc('DownwardRun')] = current_downward
                else:
                    current_upward = 0
                    current_downward = 0
            
            return df
        except Exception as e:
            print(f"Error processing data: {e}")
            return None
    
    def get_available_stocks(self):
        """Get list of available stock files"""
        stocks = []
        for file in os.listdir(self.data_dir):
            if file.endswith('.csv'):
                stock_name = file.replace('.csv', '').replace('_Stocks', '')
                if stock_name == 'GOOG':
                    stock_name = 'Google'
                stocks.append(stock_name)
        return stocks
    
    def calculate_max_profit(self, df):
        """Calculate maximum profit using multiple transactions algorithm"""
        if len(df) < 2:
            return {'maxProfit': 0, 'transactions': []}
        
        prices = df['Close'].tolist()
        transactions = []
        max_profit = 0
        
        i = 0
        while i < len(prices) - 1:
            # Find local minimum (buy point)
            while i < len(prices) - 1 and prices[i + 1] <= prices[i]:
                i += 1
            
            if i == len(prices) - 1:
                break
            
            buy_index = i
            buy_price = prices[buy_index]
            buy_date = df.iloc[buy_index]['Date']
            
            # Find local maximum (sell point)
            while i < len(prices) - 1 and prices[i + 1] >= prices[i]:
                i += 1
            
            sell_index = i
            sell_price = prices[sell_index]
            sell_date = df.iloc[sell_index]['Date']
            profit = sell_price - buy_price
            
            if profit > 0:
                max_profit += profit
                transactions.append({
                    'buyDate': str(buy_date),
                    'sellDate': str(sell_date),
                    'buyPrice': float(buy_price),
                    'sellPrice': float(sell_price),
                    'profit': float(profit)
                })
        
        return {'maxProfit': max_profit, 'transactions': transactions}
    
    def calculate_run_analysis(self, df):
        """Calculate upward and downward run statistics"""
        upward_runs = df[df['IsUpward']]['UpwardRun'].tolist()
        downward_runs = df[df['IsDownward']]['DownwardRun'].tolist()
        
        return {
            'totalUpwardDays': int(len(df[df['IsUpward']])),
            'totalDownwardDays': int(len(df[df['IsDownward']])),
            'longestUpwardRun': int(max(upward_runs)) if upward_runs else 0,
            'longestDownwardRun': int(max(downward_runs)) if downward_runs else 0
        }
    
    def calculate_rsi(self, prices, period=14):
        """Calculate RSI (Relative Strength Index)"""
        if len(prices) < period + 1:
            return pd.Series([50.0] * len(prices), index=prices.index)
        
        # Calculate price changes
        delta = prices.diff()
        
        # Separate gains and losses
        gains = delta.where(delta > 0, 0)
        losses = -delta.where(delta < 0, 0)
        
        # Calculate average gains and losses using exponential moving average
        avg_gains = gains.ewm(span=period, adjust=False).mean()
        avg_losses = losses.ewm(span=period, adjust=False).mean()
        
        # Calculate RS and RSI
        rs = avg_gains / avg_losses
        rsi = 100 - (100 / (1 + rs))
        
        # Fill initial values with 50 (neutral RSI)
        rsi.iloc[:period] = 50.0
        
        return rsi
    
    def calculate_correlation_matrix(self, stocks_list):
        """Calculate correlation matrix between stocks using daily returns"""
        try:
            # Load data for all stocks
            stock_data = {}
            for stock in stocks_list:
                df = self.load_stock_data(stock)
                if df is not None and len(df) > 0:
                    stock_data[stock] = df['Daily_Return'].dropna()
            
            if len(stock_data) < 2:
                return {}
            
            # Create correlation matrix
            correlation_matrix = {}
            
            for stock1 in stock_data:
                correlation_matrix[stock1] = {}
                for stock2 in stock_data:
                    if stock1 == stock2:
                        correlation_matrix[stock1][stock2] = 1.0
                    else:
                        # Align the data by date to ensure same length
                        returns1 = stock_data[stock1]
                        returns2 = stock_data[stock2]
                        
                        # Find common dates
                        df1 = self.load_stock_data(stock1)
                        df2 = self.load_stock_data(stock2)
                        
                        if df1 is not None and df2 is not None:
                            # Align by date
                            df1_aligned = df1.set_index('Date')['Daily_Return']
                            df2_aligned = df2.set_index('Date')['Daily_Return']
                            
                            # Find common dates
                            common_dates = df1_aligned.index.intersection(df2_aligned.index)
                            
                            if len(common_dates) > 1:
                                aligned_returns1 = df1_aligned.loc[common_dates]
                                aligned_returns2 = df2_aligned.loc[common_dates]
                                
                                # Calculate correlation
                                correlation = float(aligned_returns1.corr(aligned_returns2))
                                correlation_matrix[stock1][stock2] = correlation if not np.isnan(correlation) else 0.0
                            else:
                                correlation_matrix[stock1][stock2] = 0.0
                        else:
                            correlation_matrix[stock1][stock2] = 0.0
            
            return correlation_matrix
            
        except Exception as e:
            print(f"Error calculating correlation matrix: {e}")
            return {}

# Initialize processor
processor = StockDataProcessor()

@app.route('/api/stocks', methods=['GET'])
def get_available_stocks():
    """Get list of available stocks"""
    stocks = processor.get_available_stocks()
    return jsonify(stocks)

@app.route('/api/stocks/<stock_name>', methods=['GET'])
def get_stock_data(stock_name):
    """Get stock data for a specific stock"""
    df = processor.load_stock_data(stock_name)
    if df is None:
        return jsonify({'error': 'Stock not found'}), 404
    
    # Convert to JSON-serializable format
    data = df.to_dict('records')
    return jsonify(data)

@app.route('/api/stocks/<stock_name>/metrics', methods=['GET'])
def get_stock_metrics(stock_name):
    """Get calculated metrics for a stock"""
    df = processor.load_stock_data(stock_name)
    if df is None:
        return jsonify({'error': 'Stock not found'}), 404
    
    # Get date range from query params
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if start_date and end_date:
        df = df[(df['Date'] >= start_date) & (df['Date'] <= end_date)]
    
    if len(df) == 0:
        return jsonify({'error': 'No data in date range'}), 404
    
    # Calculate metrics
    max_profit_result = processor.calculate_max_profit(df)
    run_analysis = processor.calculate_run_analysis(df)
    
    # Calculate financial metrics
    start_price = float(df.iloc[0]['Close'])
    end_price = float(df.iloc[-1]['Close'])
    total_return = ((end_price - start_price) / start_price) * 100
    
    # Calculate volatility (standard deviation of daily returns)
    daily_returns = df['Daily_Return'].dropna()
    volatility = float(daily_returns.std() * np.sqrt(252)) * 100  # Annualized volatility
    
    # Calculate Sharpe ratio (assuming risk-free rate of 2%)
    risk_free_rate = 0.02
    excess_return = (daily_returns.mean() * 252) - risk_free_rate  # Annualized excess return
    sharpe_ratio = float(excess_return / (daily_returns.std() * np.sqrt(252))) if daily_returns.std() > 0 else 0.0
    
    # Calculate current RSI (latest value)
    current_rsi = float(df['RSI'].iloc[-1]) if pd.notna(df['RSI'].iloc[-1]) else 50.0
    
    metrics = {
        'totalDays': int(len(df)),
        'startDate': str(df.iloc[0]['Date']),
        'endDate': str(df.iloc[-1]['Date']),
        'maxPrice': float(df['Close'].max()),
        'minPrice': float(df['Close'].min()),
        'avgPrice': float(df['Close'].mean()),
        'totalVolume': float(df['Volume'].sum()),
        'avgVolume': float(df['Volume'].mean()),
        'maxProfit': float(max_profit_result['maxProfit']),
        'transactions': max_profit_result['transactions'],
        'runAnalysis': run_analysis,
        'totalReturn': float(total_return),
        'volatility': float(volatility),
        'sharpeRatio': float(sharpe_ratio),
        'currentPrice': float(end_price),
        'priceChangePercent': float(((end_price - start_price) / start_price) * 100),
        'rsi': float(current_rsi)
    }
    
    return jsonify(metrics)

@app.route('/api/stocks/<stock_name>/chart-data', methods=['GET'])
def get_chart_data(stock_name):
    """Get chart data for visualization"""
    df = processor.load_stock_data(stock_name)
    if df is None:
        return jsonify({'error': 'Stock not found'}), 404
    
    # Get date range from query params
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if start_date and end_date:
        df = df[(df['Date'] >= start_date) & (df['Date'] <= end_date)]
    
    # Prepare chart data
    chart_data = []
    for _, row in df.iterrows():
        chart_data.append({
            'date': str(row['Date']),
            'open': float(row['Open']),
            'high': float(row['High']),
            'low': float(row['Low']),
            'close': float(row['Close']),
            'volume': float(row['Volume']),
            'sma5': float(row['SMA_5']) if pd.notna(row['SMA_5']) else None,
            'sma10': float(row['SMA_10']) if pd.notna(row['SMA_10']) else None,
            'sma20': float(row['SMA_20']) if pd.notna(row['SMA_20']) else None,
            'sma50': float(row['SMA_50']) if pd.notna(row['SMA_50']) else None,
            'rsi': float(row['RSI']) if pd.notna(row['RSI']) else None,
            'dailyReturn': float(row['Daily_Return'] * 100),
            'isUpward': bool(row['IsUpward']),
            'isDownward': bool(row['IsDownward']),
            'upwardRun': int(row['UpwardRun']),
            'downwardRun': int(row['DownwardRun'])
        })
    
    return jsonify(chart_data)

@app.route('/api/correlation-matrix', methods=['GET'])
def get_correlation_matrix():
    """Get correlation matrix between all stocks"""
    try:
        stocks = processor.get_available_stocks()
        correlation_matrix = processor.calculate_correlation_matrix(stocks)
        return jsonify(correlation_matrix)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Python backend is running'})

if __name__ == '__main__':
    print("Starting Python Flask backend...")
    print("Available stocks:", processor.get_available_stocks())
    app.run(debug=True, port=5001)
