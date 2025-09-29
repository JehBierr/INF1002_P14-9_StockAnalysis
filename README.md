# INF1002, P14_9
- Liew Hui Zhong 2502222
- Charissa Koh Yi En 2501810
- Ong Si Kai 2501225
- Javier Soh Jie En 2500119

# 📈 Stock Analysis Dashboard

A comprehensive stock market analysis system that processes historical stock data and provides advanced financial analysis including technical indicators, correlation analysis, and profit optimization algorithms.

## ✨ Features

- **Technical Analysis**: RSI, Moving Averages, Run Analysis
- **Financial Metrics**: Total Return, Volatility, Sharpe Ratio  
- **Correlation Analysis**: Real-time correlation matrix between stocks
- **Profit Optimization**: Maximum profit calculation with multiple transactions
- **Data Visualization**: Interactive charts and graphs
- **Multi-Currency Support**: USD, SGD and more display options
- **Validation Results**: Manual calculation verification with 5 test cases

## 🏗️ Architecture

This project combines a **Python Flask backend** for data processing with a **React TypeScript frontend** for the user interface.

- **Backend**: Python Flask API (Port 5001) - Handles all calculations and data processing
- **Frontend**: React TypeScript (Port 3000) - Provides interactive user interface
- **Data**: CSV files processed by Python backend
- **Charts**: Recharts for data visualization

## 🚀 Quick Start

### Prerequisites
- **Python 3.13+** with pip
- **Node.js 16+** with npm
- **Git** (for cloning)



1. **Setup Python Backend:**
   ```cmd
   cd code/backend
   python -m venv stockvenv 
   stockvenv\Scripts\activate
   pip install -r requirements.txt 
   python app.py
   ```
   *Keep this Command Prompt open - backend runs on http://localhost:5001*

2. **Setup React Frontend (new Command Prompt):**
   ```cmd
   cd ..  # Back to project root
   npm install
   npm run dev
   ```

3. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001/api

## 📊 Data Files

The system includes CSV files for 5 major stocks:
- **Apple** (APPLE.csv)
- **Amazon** (AMAZON.csv) 
- **Google** (GOOG_Stocks.csv)
- **Microsoft** (Microsoft_Stocks.csv)
- **Tesla** (Tesla_Stocks.csv)

All data is automatically processed by the Python backend.

## 🔧 Troubleshooting

### Backend Issues
- **Port 5001 in use**: Kill the process using that port or restart your computer
- **Python not found**: Make sure Python 3.13+ is installed and added to PATH
- **Module not found**: Run `pip install -r requirements.txt` in the backend directory

### Frontend Issues  
- **Port 3000 in use**: The app will automatically try port 3001
- **Node modules error**: Delete `node_modules` folder and run `npm install` again
- **Build errors**: Make sure you're using Node.js 16+ and npm is up to date

### Connection Issues
- **"Failed to connect to Python backend"**: Make sure the Python backend is running on port 5001
- **Empty charts**: Check browser console for errors and ensure backend is responding


## 🎯 What You'll See

Once running, you'll have access to:
- **Stock Analysis**: Individual stock charts with technical indicators
- **Max Profit Analysis**: Optimal trading strategies and transaction history  
- **Stock Comparison**: Side-by-side performance analysis
- **Market Summary**: Portfolio overview and correlation matrix

## 💡 Tips

- Keep both terminals/command prompts open while using the app
- The backend must be running before the frontend can load data
- Use the currency selector in the header to switch between USD and SGD
- Check the validation results tab to verify calculation accuracy

---

**Happy analyzing! 📈✨**

