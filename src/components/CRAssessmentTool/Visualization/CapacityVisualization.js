import React from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ReferenceLine, ResponsiveContainer, ComposedChart
} from 'recharts';
import { useConfig } from 'context/ConfigContext';

/**
 * Capacity Visualization Component
 * Displays charts for team capacity across sprints
 */
const CapacityVisualization = () => {
  const { state } = useConfig();
  const { projectParams, sprintCapacities, results } = state;
  
  // Color scheme for visualizations
  const COLORS = {
    BA: '#0088FE',
    Config: '#00C49F', 
    QA: '#FFBB28',
    available: '#82ca9d',
    allocated: '#8884d8',
    capacity: '#ffc658',
    overCapacity: '#ff8042'
  };
  
  // Prepare data for visualization
  const prepareSprintCapacityData = () => {
    // Prepare data for all sprints starting from baseline
    return sprintCapacities
      .filter(sprint => sprint.sprintNumber >= projectParams.baselineSprint)
      .map(sprint => {
        // Calculate available capacity and utilization
        const available = {
          BA: sprint.capacity.BA - sprint.allocated.BA,
          Config: sprint.capacity.Config - sprint.allocated.Config,
          QA: sprint.capacity.QA - sprint.allocated.QA
        };
        
        const utilization = {
          BA: (sprint.allocated.BA / Math.max(0.001, sprint.capacity.BA)) * 100,
          Config: (sprint.allocated.Config / Math.max(0.001, sprint.capacity.Config)) * 100,
          QA: (sprint.allocated.QA / Math.max(0.001, sprint.capacity.QA)) * 100
        };
        
        return {
          sprint: `Sprint ${sprint.sprintNumber}`,
          sprintNumber: sprint.sprintNumber,
          BACapacity: sprint.capacity.BA,
          BAAllocated: sprint.allocated.BA,
          BAAvailable: available.BA,
          ConfigCapacity: sprint.capacity.Config,
          ConfigAllocated: sprint.allocated.Config, 
          ConfigAvailable: available.Config,
          QACapacity: sprint.capacity.QA,
          QAAllocated: sprint.allocated.QA,
          QAAvailable: available.QA,
          BAUtilization: utilization.BA,
          ConfigUtilization: utilization.Config,
          QAUtilization: utilization.QA
        };
      });
  };
  
  const data = prepareSprintCapacityData();
  
  // Custom tooltip for capacity charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-white border rounded shadow">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3">Team Capacity Across Sprints</h3>
      <div className="grid grid-cols-1 gap-4">
        {/* Business Analysts Capacity Chart */}
        <div className="p-2 bg-white rounded shadow">
          <h4 className="text-sm font-medium mb-2">Business Analysts - Capacity vs. Allocation</h4>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sprint" tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'User Stories', angle: -90, position: 'insideLeft', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="BACapacity" name="Capacity" fill={COLORS.capacity} />
              <Bar dataKey="BAAllocated" name="Allocated" fill={COLORS.allocated} />
              <ReferenceLine y={0} stroke="#000" />
              {results.storiesToCapacity.BA.stories > 0 && (
                <ReferenceLine 
                  y={results.storiesToCapacity.BA.stories} 
                  stroke="red" 
                  strokeDasharray="3 3" 
                  label={{ value: 'CR Impact', position: 'top', fill: 'red', fontSize: 12 }} 
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Configurators Capacity Chart */}
        <div className="p-2 bg-white rounded shadow">
          <h4 className="text-sm font-medium mb-2">Configurators - Capacity vs. Allocation</h4>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sprint" tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'User Stories', angle: -90, position: 'insideLeft', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="ConfigCapacity" name="Capacity" fill={COLORS.capacity} />
              <Bar dataKey="ConfigAllocated" name="Allocated" fill={COLORS.allocated} />
              <ReferenceLine y={0} stroke="#000" />
              {results.storiesToCapacity.Config.stories > 0 && (
                <ReferenceLine 
                  y={results.storiesToCapacity.Config.stories} 
                  stroke="red" 
                  strokeDasharray="3 3" 
                  label={{ value: 'CR Impact', position: 'top', fill: 'red', fontSize: 12 }} 
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* QA Team Capacity Chart */}
        <div className="p-2 bg-white rounded shadow">
          <h4 className="text-sm font-medium mb-2">QA Team - Capacity vs. Allocation</h4>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sprint" tick={{ fontSize: 12 }} />
              <YAxis label={{ value: 'User Stories', angle: -90, position: 'insideLeft', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="QACapacity" name="Capacity" fill={COLORS.capacity} />
              <Bar dataKey="QAAllocated" name="Allocated" fill={COLORS.allocated} />
              <ReferenceLine y={0} stroke="#000" />
              {results.storiesToCapacity.QA.stories > 0 && (
                <ReferenceLine 
                  y={results.storiesToCapacity.QA.stories} 
                  stroke="red" 
                  strokeDasharray="3 3" 
                  label={{ value: 'CR Impact', position: 'top', fill: 'red', fontSize: 12 }} 
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
        <h4 className="text-sm font-medium mb-2">Utilization Rate by Team</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sprint" tick={{ fontSize: 12 }} />
            <YAxis 
              label={{ value: 'Utilization %', angle: -90, position: 'insideLeft', fontSize: 12 }}
              domain={[0, 'dataMax']}
            />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="BAUtilization" name="BA Utilization" stroke={COLORS.BA} />
            <Line type="monotone" dataKey="ConfigUtilization" name="Config Utilization" stroke={COLORS.Config} />
            <Line type="monotone" dataKey="QAUtilization" name="QA Utilization" stroke={COLORS.QA} />
            <ReferenceLine y={100} stroke="red" strokeDasharray="3 3" label={{ value: 'Full Capacity', position: 'top', fill: 'red' }} />
            <ReferenceLine y={75} stroke="orange" strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-2 text-xs text-gray-500">
          <p>* Utilization over 75% may indicate sustainability risks</p>
          <p>* Utilization over 100% indicates over-allocation</p>
        </div>
      </div>
    </div>
  );
};

export default CapacityVisualization;