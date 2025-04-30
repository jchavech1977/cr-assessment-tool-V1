import React from 'react';
import { formatDate } from 'utils/calculationUtils';
/**
 * Monte Carlo Summary Component
 * Displays a condensed summary of Monte Carlo simulation results
 */
const MonteCarloSummary = ({ monteCarloResults, projectParams }) => {
  if (!monteCarloResults) return null;
  
  // Format date as MM/DD/YYYY
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  // Get most likely critical path
  const [mostLikelyTeam, mostLikelyProbability] = Object.entries(monteCarloResults.criticalPathProbabilities)
    .sort((a, b) => b[1] - a[1])[0];
  
  return (
    <div className="bg-white p-4 rounded shadow">
      <h4 className="text-lg font-medium mb-3">Probabilistic Timeline Forecast</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Probability of Meeting Deadline */}
        <div className="p-3 bg-gray-50 rounded border">
          <h5 className="font-medium mb-2">Original Deadline Success</h5>
          <div className="h-10 bg-gray-200 rounded relative mb-2">
            <div 
              className="absolute inset-y-0 left-0 bg-green-500 rounded-l flex items-center justify-center" 
              style={{ width: `${monteCarloResults.meetOriginalDeadlineProbability}%` }}
            >
              <span className="text-white text-xs font-medium px-2">
                {monteCarloResults.meetOriginalDeadlineProbability.toFixed(1)}%
              </span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium">
                Probability of Meeting Original Deadline
              </span>
            </div>
          </div>
          <div className="text-sm">
            <div className="flex justify-between">
              <span>Original Deadline:</span>
              <span className="font-medium">{formatDate(projectParams.deadline)}</span>
            </div>
          </div>
        </div>
        
        {/* 50% and 90% Confidence Deadlines */}
        <div className="p-3 bg-gray-50 rounded border">
          <h5 className="font-medium mb-2">Confidence Level Deadlines</h5>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-400 mr-1"></div>
                <span className="text-sm">50% Confidence:</span>
              </div>
              <span className="font-medium">{formatDate(monteCarloResults.deadlinePercentiles.p50)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-700 mr-1"></div>
                <span className="text-sm">90% Confidence:</span>
              </div>
              <span className="font-medium">{formatDate(monteCarloResults.deadlinePercentiles.p90)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Difference:</span>
              <span className="font-medium">
                {Math.round((new Date(monteCarloResults.deadlinePercentiles.p90) - 
                  new Date(monteCarloResults.deadlinePercentiles.p50)) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          </div>
        </div>
        
        {/* Critical Path and Team Stats */}
        <div className="p-3 bg-gray-50 rounded border">
          <h5 className="font-medium mb-2">Critical Path Analysis</h5>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Most Likely Bottleneck:</span>
              <span className="font-medium">{mostLikelyTeam}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Probability:</span>
              <span className="font-medium">{mostLikelyProbability.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Mean Additional Days:</span>
              <span className="font-medium">{monteCarloResults.dayStats.mean.toFixed(1)} days</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <h5 className="font-medium text-blue-800 mb-1">Recommendation</h5>
        <p className="text-sm text-blue-900">
          {monteCarloResults.meetOriginalDeadlineProbability < 20 ? (
            <>
              <strong>High Risk:</strong> There is only a {monteCarloResults.meetOriginalDeadlineProbability.toFixed(1)}% chance of meeting 
              the original deadline. Consider adding resources to the {mostLikelyTeam} team or extending the timeline.
            </>
          ) : monteCarloResults.meetOriginalDeadlineProbability < 50 ? (
            <>
              <strong>Medium Risk:</strong> There is a {monteCarloResults.meetOriginalDeadlineProbability.toFixed(1)}% chance of meeting 
              the original deadline. For better certainty, plan with the 50% confidence date ({formatDate(monteCarloResults.deadlinePercentiles.p50)}).
            </>
          ) : (
            <>
              <strong>Good Outlook:</strong> There is a {monteCarloResults.meetOriginalDeadlineProbability.toFixed(1)}% chance of meeting 
              the original deadline. The project appears to have sufficient buffer.
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default MonteCarloSummary;