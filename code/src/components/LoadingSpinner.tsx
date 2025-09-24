import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      <div className="text-lg font-medium text-gray-700">
        Loading Stock Data...
      </div>
      <div className="text-sm text-gray-500">
        Please wait while we process your CSV files
      </div>
    </div>
  );
};

export default LoadingSpinner;
