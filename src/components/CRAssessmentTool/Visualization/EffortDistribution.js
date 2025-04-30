import React from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useConfig } from 'context/ConfigContext';

/**
 * Effort Distribution Visualization Component
 * Displays how CR effort is distributed across teams
 */
const EffortDistribution = () => {
  const { state } = useConfig();
  const { results, crInputs } = state;
  
  // Prepare data for visualization
  const prepareEffortDistributionData = () => {
    const totalHours = results.storiesToCapacity.BA.hours + 
                      results.storiesToCapacity.Config.hours + 
                      results.storiesToCapacity.QA.hours;
    
    if (totalHours === 0) return [];
    
    return [
      { name: 'Business Analysts', value: results.storiesToCapacity.BA.hours, percentage: (results.storiesToCapacity.BA.hours / totalHours * 100).toFixed(1) },
      { name: 'Configurators', value: results.storiesToCapacity.Config.hours, percentage: (results.storiesToCapacity.Config.hours / totalHours * 100).toFixed(1) },
      { name: 'QA Team', value: results.storiesToCapacity.QA.hours, percentage: (results.storiesToCapacity.QA.hours / totalHours * 100).toFixed(1) }
    ];
  };
  
  const data = prepareEffortDistributionData();
  
  // Prepare data for largest CRs chart
  const prepareLargestCRsData = () => {
    return [...crInputs]
      .map(cr => ({
        id: cr.id,
        name: cr.name,
        totalHours: Number(cr.BAHours) + Number(cr.ConfigHours) + Number(cr.QAHours)
      }))
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 5); // Top 5 largest CRs
  };
  
  const largestCRs = prepareLargestCRsData();
  
  // Color scheme for visualizations
  const COLORS = {
    'Business Analysts': '#0088FE',
    'Configurators': '#00C49F', 
    'QA Team': '#FFBB28'
  };
  
  // If no CR effort, show placeholder
  if (data.length === 0 || data.every(item => item.value === 0)) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">CR Effort Distribution</h3>
        <div className="p-6 bg-white rounded shadow text-center text-gray-500">
          Add CR effort in hours to see distribution
        </div>
      </div>
    );
  }
  
  // Custom label for pie chart sections
  const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Only show labels if the segment is large enough
    if (percent < 0.05) return null;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#000" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {name}: {(percent * 100).toFixed(1)}% ({value.toFixed(0)} hrs)
      </text>
    );
  };
  
  // Calculate total effort
  const totalEffort = data.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate CR count and average size
  const crCount = crInputs.length;
  const avgCRSize = crCount > 0 ? totalEffort / crCount : 0;
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3">CR Effort Distribution</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart for Team Distribution */}
        <div className="p-3 bg-white rounded shadow">
          <h4 className="text-base font-medium mb-2">Effort by Team</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label={renderCustomizedPieLabel}
                labelLine={true}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#888'} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value.toFixed(1)} hours`, 'Effort']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            {data.map((entry, index) => (
              <div key={`legend-${index}`} className="text-sm">
                <div className="flex items-center justify-center">
                  <div 
                    className="w-3 h-3 mr-1" 
                    style={{ backgroundColor: COLORS[entry.name] || '#888' }} 
                  />
                  <span>{entry.name}</span>
                </div>
                <div>{entry.value.toFixed(1)} hours ({entry.percentage}%)</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bar Chart for Largest CRs */}
        <div className="p-3 bg-white rounded shadow">
          <h4 className="text-base font-medium mb-2">Largest Change Requests</h4>
          {largestCRs.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={largestCRs}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis 
                  label={{ value: 'Total Hours', angle: -90, position: 'insideLeft', fontSize: 12 }}
                />
                <Tooltip formatter={(value) => [`${value.toFixed(1)} hours`, 'Total Effort']} />
                <Bar dataKey="totalHours" fill="#8884d8" name="Total Hours">
                  {largestCRs.map((entry, index) => (
                    <Cell key={`cr-cell-${index}`} fill={`hsl(${220 - index * 15}, 80%, 50%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500">
              No CR data available
            </div>
          )}
        </div>
      </div>
      
      {/* Summary Statistics */}
      <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
        <h4 className="font-medium mb-2">CR Effort Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h5 className="text-sm font-medium mb-1">Total CR Effort</h5>
            <p className="text-lg font-bold">{totalEffort.toFixed(1)} hours</p>
            <p className="text-xs text-gray-600">
              Total effort across all teams and CRs
            </p>
          </div>
          <div>
            <h5 className="text-sm font-medium mb-1">Number of CRs</h5>
            <p className="text-lg font-bold">{crCount}</p>
            <p className="text-xs text-gray-600">
              Total number of change requests
            </p>
          </div>
          <div>
            <h5 className="text-sm font-medium mb-1">Average CR Size</h5>
            <p className="text-lg font-bold">{avgCRSize.toFixed(1)} hours</p>
            <p className="text-xs text-gray-600">
              Average hours per change request
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EffortDistribution;