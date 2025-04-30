// MonteCarloSummary.js
import React from 'react';

const MonteCarloSummary = ({ monteCarloResults, projectParams, onViewFullAnalysis }) => {
  if (!monteCarloResults) return null;
  
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Probabilistic Timeline Forecast</h3>
      <div className="bg-white p-3 rounded shadow">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <div className="text-sm font-medium">Deadline (50% Confidence):</div>
            <div className="text-lg">{formatDate(monteCarloResults.deadlinePercentiles.p50)}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Deadline (90% Confidence):</div>
            <div className="text-lg">{formatDate(monteCarloResults.deadlinePercentiles.p90)}</div>
          </div>
        </div>
        
        <div className="h-14 bg-gray-100 rounded mt-3 relative">
          <div 
            className="absolute inset-y-0 left-0 bg-green-500 rounded-l" 
            style={{ width: `${monteCarloResults.meetOriginalDeadlineProbability}%` }}
          >
            <div className="h-full flex items-center justify-center text-white text-xs px-2">
              {monteCarloResults.meetOriginalDeadlineProbability.toFixed(1)}%
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-sm">
            Probability of Meeting Original Deadline
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-600">
          <p>* Based on {monteCarloResults.rawDeadlines.length.toLocaleString()} simulations</p>
          <p>* Most likely critical path: {Object.entries(monteCarloResults.criticalPathProbabilities).sort((a, b) => b[1] - a[1])[0][0]} ({Object.entries(monteCarloResults.criticalPathProbabilities).sort((a, b) => b[1] - a[1])[0][1].toFixed(1)}%)</p>
        </div>
        
        <button 
          className="w-full mt-3 px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          onClick={onViewFullAnalysis}
        >
          View Full Monte Carlo Analysis
        </button>
      </div>
    </div>
  );
};

export default MonteCarloSummary;