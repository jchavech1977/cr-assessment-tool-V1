import React from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ReferenceLine, ResponsiveContainer, Cell, 
  PieChart, Pie, ComposedChart
} from 'recharts';
import { formatDate } from 'utils/calculationUtils';
/**
 * Monte Carlo Visualization Component
 * Displays the results of Monte Carlo simulations in various chart formats
 */
const MonteCarloVisualization = ({ monteCarloResults, projectParams, activeTab }) => {
  if (!monteCarloResults) {
    return (
      <div className="p-6 text-center text-gray-500">
        No simulation results available
      </div>
    );
  }
  
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
  
  // Color scheme for Monte Carlo visualizations
  const COLORS = {
    distribution: '#4361EE',
    p10: '#B7F4B7',      // Light green for p10 (optimistic)
    p50: '#59A96A',      // Medium green for p50 (median)
    p90: '#386641',      // Dark green for p90 (conservative)
    originalDeadline: '#FF6B6B', // Red for original deadline
    BA: '#0088FE',
    Config: '#00C49F', 
    QA: '#FFBB28'
  };
  
  // Render deadline distribution chart
  const renderDeadlineDistribution = () => {
    const histogramData = monteCarloResults.deadlineHistogram;
    
    return (
      <div>
        <h4 className="text-lg font-medium mb-2">Deadline Probability Distribution</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                yAxisId="count" 
                orientation="left" 
                label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fontSize: 12 }} 
              />
              <YAxis 
                yAxisId="probability" 
                orientation="right" 
                label={{ value: 'Probability (%)', angle: 90, position: 'insideRight', fontSize: 12 }} 
              />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'probability' ? `${value.toFixed(1)}%` : value, 
                  name === 'probability' ? 'Probability' : 'Frequency'
                ]}
                labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
              />
              <Bar 
                dataKey="count" 
                fill={COLORS.distribution} 
                yAxisId="count"
                name="Frequency" 
              />
              <Bar 
                dataKey="probability" 
                fill={COLORS.p50} 
                yAxisId="probability" 
                name="Probability" 
              />
              <ReferenceLine 
                x={projectParams.deadline.toISOString().split('T')[0]} 
                yAxisId="count" 
                stroke={COLORS.originalDeadline} 
                label={{ value: 'Original Deadline', position: 'top', fill: COLORS.originalDeadline }} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-sm text-gray-600 text-center">
          <p>Probability of meeting original deadline: <strong>{monteCarloResults.meetOriginalDeadlineProbability.toFixed(1)}%</strong></p>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded border">
          <h5 className="font-medium mb-2">Interpreting the Distribution</h5>
          <p className="text-sm text-gray-600">
            This chart shows the distribution of possible deadline dates based on {monteCarloResults.rawDeadlines.length.toLocaleString()} simulations.
            The height of each bar represents how frequently that deadline occurred in the simulations.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            A wider distribution indicates higher uncertainty in the project timeline.
          </p>
        </div>
      </div>
    );
  };
  
  // Render confidence levels table and visualization
  const renderConfidenceLevels = () => {
    // Create data for visualization
    const confidenceData = [
      { 
        name: '10% (Optimistic)', 
        date: formatDate(monteCarloResults.deadlinePercentiles.p10),
        days: Math.round((new Date(monteCarloResults.deadlinePercentiles.p10) - projectParams.deadline) / (1000 * 60 * 60 * 24)),
        color: COLORS.p10,
        confidence: 10
      },
      { 
        name: '25%', 
        date: formatDate(monteCarloResults.deadlinePercentiles.p25),
        days: Math.round((new Date(monteCarloResults.deadlinePercentiles.p25) - projectParams.deadline) / (1000 * 60 * 60 * 24)),
        color: COLORS.p10,
        confidence: 25
      },
      { 
        name: '50% (Median)', 
        date: formatDate(monteCarloResults.deadlinePercentiles.p50),
        days: Math.round((new Date(monteCarloResults.deadlinePercentiles.p50) - projectParams.deadline) / (1000 * 60 * 60 * 24)),
        color: COLORS.p50,
        confidence: 50
      },
      { 
        name: '75%', 
        date: formatDate(monteCarloResults.deadlinePercentiles.p75),
        days: Math.round((new Date(monteCarloResults.deadlinePercentiles.p75) - projectParams.deadline) / (1000 * 60 * 60 * 24)),
        color: COLORS.p90,
        confidence: 75
      },
      { 
        name: '90% (Conservative)', 
        date: formatDate(monteCarloResults.deadlinePercentiles.p90),
        days: Math.round((new Date(monteCarloResults.deadlinePercentiles.p90) - projectParams.deadline) / (1000 * 60 * 60 * 24)),
        color: COLORS.p90,
        confidence: 90
      }
    ];
    
    return (
      <div>
        <h4 className="text-lg font-medium mb-2">Deadline Confidence Levels</h4>
        
        {/* Confidence visualization */}
        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={confidenceData} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip formatter={(value, name) => [value, name === 'confidence' ? 'Confidence Level' : 'Additional Days']} />
              <Legend />
              <Bar dataKey="days" name="Additional Days" fill="#8884d8">
                {confidenceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Confidence table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border-b">Confidence Level</th>
                <th className="px-4 py-2 border-b">Projected Deadline</th>
                <th className="px-4 py-2 border-b">Additional Days</th>
                <th className="px-4 py-2 border-b">Description</th>
              </tr>
            </thead>
            <tbody>
              {confidenceData.map((level, index) => (
                <tr key={index} className={level.name === '50% (Median)' ? "bg-blue-50" : ""}>
                  <td className="px-4 py-2 border-b font-medium">{level.name}</td>
                  <td className="px-4 py-2 border-b">{level.date}</td>
                  <td className="px-4 py-2 border-b">
                    {level.days > 0 ? `+${level.days} days` : level.days === 0 ? 'On time' : `${level.days} days`}
                  </td>
                  <td className="px-4 py-2 border-b text-sm">
                    {level.confidence}% chance of completing by this date
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded border">
          <h5 className="font-medium mb-2">How to Use Confidence Levels</h5>
          <p className="text-sm text-gray-600">
            <strong>Lower confidence levels</strong> (10%, 25%) represent optimistic scenarios but have a higher risk of being missed.
          </p>
          <p className="text-sm text-gray-600 mt-1">
            <strong>Medium confidence level</strong> (50%) represents the median outcome with equal chances of finishing earlier or later.
          </p>
          <p className="text-sm text-gray-600 mt-1">
            <strong>Higher confidence levels</strong> (75%, 90%) provide more conservative estimates that are more likely to be met.
          </p>
        </div>
      </div>
    );
  };
  
  // Render team analysis
  const renderTeamAnalysis = () => {
    // Prepare critical path data
    const criticalPathData = Object.entries(monteCarloResults.criticalPathProbabilities)
      .map(([team, probability]) => ({
        name: team,
        value: probability
      }));
    
    // Prepare utilization data
    const utilizationData = [
      {
        name: 'Business Analysts',
        min: monteCarloResults.teamUtilizationPercentiles.BA.min,
        p25: monteCarloResults.teamUtilizationPercentiles.BA.p25,
        median: monteCarloResults.teamUtilizationPercentiles.BA.p50,
        p75: monteCarloResults.teamUtilizationPercentiles.BA.p75,
        max: monteCarloResults.teamUtilizationPercentiles.BA.max
      },
      {
        name: 'Configurators',
        min: monteCarloResults.teamUtilizationPercentiles.Config.min,
        p25: monteCarloResults.teamUtilizationPercentiles.Config.p25,
        median: monteCarloResults.teamUtilizationPercentiles.Config.p50,
        p75: monteCarloResults.teamUtilizationPercentiles.Config.p75,
        max: monteCarloResults.teamUtilizationPercentiles.Config.max
      },
      {
        name: 'QA Team',
        min: monteCarloResults.teamUtilizationPercentiles.QA.min,
        p25: monteCarloResults.teamUtilizationPercentiles.QA.p25,
        median: monteCarloResults.teamUtilizationPercentiles.QA.p50,
        p75: monteCarloResults.teamUtilizationPercentiles.QA.p75,
        max: monteCarloResults.teamUtilizationPercentiles.QA.max
      }
    ];
    
    // Custom tooltip for utilization
    const CustomUtilizationTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="p-2 bg-white border rounded shadow">
            <p className="font-medium">{label}</p>
            <p>Minimum: {payload[0].payload.min.toFixed(1)}%</p>
            <p>25th Percentile: {payload[0].payload.p25.toFixed(1)}%</p>
            <p>Median: {payload[0].payload.median.toFixed(1)}%</p>
            <p>75th Percentile: {payload[0].payload.p75.toFixed(1)}%</p>
            <p>Maximum: {payload[0].payload.max.toFixed(1)}%</p>
          </div>
        );
      }
      return null;
    };
    
    // Get most likely critical path
    const [mostLikelyTeam, mostLikelyProbability] = Object.entries(monteCarloResults.criticalPathProbabilities)
      .sort((a, b) => b[1] - a[1])[0];
    
    return (
      <div>
        <h4 className="text-lg font-medium mb-2">Team Analysis</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Critical Path Distribution */}
          <div>
            <h5 className="text-base font-medium mb-2">Critical Path Distribution</h5>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={criticalPathData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {criticalPathData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.name === 'Business Analysts' ? COLORS.BA :
                          entry.name === 'Configurators' ? COLORS.Config :
                          entry.name === 'QA Team' ? COLORS.QA : '#FF8042'
                        } 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-sm text-center">
              <p>Most likely critical path: <strong>{mostLikelyTeam}</strong> ({mostLikelyProbability.toFixed(1)}%)</p>
            </div>
          </div>
          
          {/* Team Utilization Ranges */}
          <div>
            <h5 className="text-base font-medium mb-2">Team Utilization Ranges</h5>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={utilizationData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 'dataMax']} />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip content={<CustomUtilizationTooltip />} />
                  <Legend />
                  <Bar dataKey="median" name="Median Utilization" fill="#8884d8" />
                  <ReferenceLine x={100} stroke="red" label="100%" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Sprint and Days Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-3 bg-gray-50 rounded border">
            <h5 className="font-medium mb-2">Additional Sprints Statistics</h5>
            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span>Mean:</span>
                <span className="font-medium">{monteCarloResults.sprintStats.mean.toFixed(2)} sprints</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Standard Deviation:</span>
                <span className="font-medium">{monteCarloResults.sprintStats.stdDev.toFixed(2)} sprints</span>
              </div>
              <div className="flex justify-between">
                <span>95% Confidence Interval:</span>
                <span className="font-medium">
                  {Math.max(0, monteCarloResults.sprintStats.mean - 1.96 * monteCarloResults.sprintStats.stdDev).toFixed(2)} to {(monteCarloResults.sprintStats.mean + 1.96 * monteCarloResults.sprintStats.stdDev).toFixed(2)} sprints
                </span>
              </div>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded border">
            <h5 className="font-medium mb-2">Additional Days Statistics</h5>
            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span>Mean:</span>
                <span className="font-medium">{monteCarloResults.dayStats.mean.toFixed(1)} days</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Standard Deviation:</span>
                <span className="font-medium">{monteCarloResults.dayStats.stdDev.toFixed(1)} days</span>
              </div>
              <div className="flex justify-between">
                <span>95% Confidence Interval:</span>
                <span className="font-medium">
                  {Math.max(0, monteCarloResults.dayStats.mean - 1.96 * monteCarloResults.dayStats.stdDev).toFixed(1)} to {(monteCarloResults.dayStats.mean + 1.96 * monteCarloResults.dayStats.stdDev).toFixed(1)} days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render different content based on active tab
  return (
    <div>
      {activeTab === 'distribution' && renderDeadlineDistribution()}
      {activeTab === 'confidence' && renderConfidenceLevels()}
      {activeTab === 'team' && renderTeamAnalysis()}
    </div>
  );
};

export default MonteCarloVisualization;