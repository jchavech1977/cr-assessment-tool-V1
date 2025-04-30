// MonteCarloVisualization.js
import React from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ReferenceLine, ResponsiveContainer, Cell, 
  PieChart, Pie 
} from 'recharts';

// Color scheme for visualizations (reuse from main component)
const COLORS = {
  BA: '#0088FE',
  Config: '#00C49F', 
  QA: '#FFBB28',
  available: '#82ca9d',
  allocated: '#8884d8',
  capacity: '#ffc658',
  overCapacity: '#ff8042',
  timeline: '#8884d8',
  extension: '#ff8042',
  baseline: '#82ca9d'
};

const MonteCarloVisualization = ({ monteCarloResults, projectParams }) => {
  if (!monteCarloResults) {
    return (
      <div className="p-6 bg-white rounded shadow text-center text-gray-500">
        Click "Run Monte Carlo Simulation" to generate probabilistic forecasts
      </div>
    );
  }
  
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Deadline Probability Distribution Chart */}
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-lg font-medium mb-2">Deadline Probability Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monteCarloResults.deadlineHistogram}>
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
                fill="#8884d8" 
                yAxisId="count"
                name="Frequency" 
              />
              <Bar 
                dataKey="probability" 
                fill="#82ca9d" 
                yAxisId="probability" 
                name="Probability" 
              />
              <ReferenceLine 
                x={projectParams.deadline.toISOString().split('T')[0]} 
				yAxisId="count" 
                stroke="red" 
                label={{ value: 'Original Deadline', position: 'top', fill: 'red' }} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-sm text-gray-600 text-center">
          <p>Probability of meeting original deadline: {monteCarloResults.meetOriginalDeadlineProbability.toFixed(1)}%</p>
        </div>
      </div>
      
      {/* Deadline Percentiles Table */}
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-lg font-medium mb-4">Deadline Confidence Levels</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Confidence Level</th>
                <th className="px-4 py-2 border-b">Projected Deadline</th>
                <th className="px-4 py-2 border-b">Additional Days</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 border-b">10% (Optimistic)</td>
                <td className="px-4 py-2 border-b">{formatDate(monteCarloResults.deadlinePercentiles.p10)}</td>
                <td className="px-4 py-2 border-b">
                  {Math.round((new Date(monteCarloResults.deadlinePercentiles.p10) - projectParams.deadline) / (1000 * 60 * 60 * 24))} days
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 border-b">25%</td>
                <td className="px-4 py-2 border-b">{formatDate(monteCarloResults.deadlinePercentiles.p25)}</td>
                <td className="px-4 py-2 border-b">
                  {Math.round((new Date(monteCarloResults.deadlinePercentiles.p25) - projectParams.deadline) / (1000 * 60 * 60 * 24))} days
                </td>
              </tr>
              <tr className="bg-blue-50">
                <td className="px-4 py-2 border-b font-medium">50% (Median)</td>
                <td className="px-4 py-2 border-b font-medium">{formatDate(monteCarloResults.deadlinePercentiles.p50)}</td>
                <td className="px-4 py-2 border-b font-medium">
                  {Math.round((new Date(monteCarloResults.deadlinePercentiles.p50) - projectParams.deadline) / (1000 * 60 * 60 * 24))} days
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 border-b">75%</td>
                <td className="px-4 py-2 border-b">{formatDate(monteCarloResults.deadlinePercentiles.p75)}</td>
                <td className="px-4 py-2 border-b">
                  {Math.round((new Date(monteCarloResults.deadlinePercentiles.p75) - projectParams.deadline) / (1000 * 60 * 60 * 24))} days
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 border-b">90% (Conservative)</td>
                <td className="px-4 py-2 border-b">{formatDate(monteCarloResults.deadlinePercentiles.p90)}</td>
                <td className="px-4 py-2 border-b">
                  {Math.round((new Date(monteCarloResults.deadlinePercentiles.p90) - projectParams.deadline) / (1000 * 60 * 60 * 24))} days
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          <p>* The confidence level indicates the probability that the project will be completed by the specified date.</p>
          <p>* Higher confidence levels result in later projected deadlines but greater certainty of meeting them.</p>
        </div>
      </div>
      
      {/* Critical Path Analysis */}
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-lg font-medium mb-2">Critical Path Analysis</h3>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h4 className="text-sm font-medium mb-2">Critical Path Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={Object.entries(monteCarloResults.criticalPathProbabilities).map(([team, probability]) => ({
                    name: team,
                    value: probability
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {Object.keys(monteCarloResults.criticalPathProbabilities).map((team, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex-1">
            <h4 className="text-sm font-medium mb-2">Team Utilization Ranges</h4>
            <div className="space-y-4">
              {['BA', 'Config', 'QA'].map(team => (
                <div key={team} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{team === 'BA' ? 'Business Analysts' : team === 'Config' ? 'Configurators' : 'QA Team'}</span>
                    <span>{monteCarloResults.teamUtilizationPercentiles[team].min.toFixed(0)}% - {monteCarloResults.teamUtilizationPercentiles[team].max.toFixed(0)}%</span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600" 
                      style={{ width: `${monteCarloResults.teamUtilizationPercentiles[team].p50}%` }} 
                    />
                    <div 
                      className="h-full bg-blue-300 -mt-4" 
                      style={{ 
                        width: `${monteCarloResults.teamUtilizationPercentiles[team].p75 - monteCarloResults.teamUtilizationPercentiles[team].p25}%`,
                        marginLeft: `${monteCarloResults.teamUtilizationPercentiles[team].p25}%`
                      }} 
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>25th percentile: {monteCarloResults.teamUtilizationPercentiles[team].p25.toFixed(0)}%</span>
                    <span>Median: {monteCarloResults.teamUtilizationPercentiles[team].p50.toFixed(0)}%</span>
                    <span>75th percentile: {monteCarloResults.teamUtilizationPercentiles[team].p75.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Statistics */}
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-lg font-medium mb-2">Timeline Impact Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Additional Sprints</h4>
            <div className="text-sm">
              <div>Mean: {monteCarloResults.sprintStats.mean.toFixed(2)} sprints</div>
              <div>Standard Deviation: {monteCarloResults.sprintStats.stdDev.toFixed(2)} sprints</div>
              <div>95% Confidence Interval: {Math.max(0, monteCarloResults.sprintStats.mean - 1.96 * monteCarloResults.sprintStats.stdDev).toFixed(2)} to {(monteCarloResults.sprintStats.mean + 1.96 * monteCarloResults.sprintStats.stdDev).toFixed(2)} sprints</div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Additional Days</h4>
            <div className="text-sm">
              <div>Mean: {monteCarloResults.dayStats.mean.toFixed(1)} days</div>
              <div>Standard Deviation: {monteCarloResults.dayStats.stdDev.toFixed(1)} days</div>
              <div>95% Confidence Interval: {Math.max(0, monteCarloResults.dayStats.mean - 1.96 * monteCarloResults.dayStats.stdDev).toFixed(1)} to {(monteCarloResults.dayStats.mean + 1.96 * monteCarloResults.dayStats.stdDev).toFixed(1)} days</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonteCarloVisualization;