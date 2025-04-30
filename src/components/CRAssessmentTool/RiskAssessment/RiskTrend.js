import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ReferenceLine, ResponsiveContainer
} from 'recharts';
import { getRiskColor } from 'utils/riskAssessmentUtils';

/**
 * Risk Trend Chart Component
 * Displays risk score trends over time
 */
const RiskTrend = ({ riskHistory }) => {
  if (!riskHistory || riskHistory.length < 2) {
    return null;
  }
  
  // Format history data for the chart
  const data = riskHistory.map((record, index) => ({
    index,
    timestamp: new Date(record.timestamp).toLocaleTimeString(),
    overallRisk: record.overallScore * 100,
    capacity: record.componentScores.capacity * 100,
    estimation: record.componentScores.estimation * 100,
    complexity: record.componentScores.complexity * 100,
    dependency: record.componentScores.dependency * 100,
    resource: record.componentScores.resource * 100,
    riskLevel: record.riskLevel
  }));
  
  // Custom tooltip to show time and values
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-white border rounded shadow">
          <p className="font-medium">{payload[0].payload.timestamp}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}
            </p>
          ))}
          <p style={{ color: getRiskColor(payload[0].payload.riskLevel) }}>
            Risk Level: {payload[0].payload.riskLevel}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="p-2 bg-white rounded shadow">
      <h4 className="text-base font-medium mb-2">Risk Score Trend</h4>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 10 }} 
            label={{ value: 'Time', position: 'insideBottom', offset: 0 }}
          />
          <YAxis 
            label={{ value: 'Risk Score', angle: -90, position: 'insideLeft', fontSize: 12 }} 
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          
          <Line 
            type="monotone" 
            dataKey="overallRisk" 
            name="Overall Risk" 
            stroke="#8884d8" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line type="monotone" dataKey="capacity" name="Capacity Risk" stroke="#0088FE" />
          <Line type="monotone" dataKey="complexity" name="Complexity Risk" stroke="#00C49F" />
          <Line type="monotone" dataKey="estimation" name="Estimation Risk" stroke="#FFBB28" />
          
          {/* Reference lines for risk thresholds */}
          <ReferenceLine 
            y={75} 
            stroke={getRiskColor('High')} 
            strokeDasharray="3 3" 
            label={{ value: 'High Risk', position: 'right', fill: getRiskColor('High') }} 
          />
          <ReferenceLine 
            y={50} 
            stroke={getRiskColor('Medium')} 
            strokeDasharray="3 3" 
            label={{ value: 'Medium Risk', position: 'right', fill: getRiskColor('Medium') }} 
          />
          <ReferenceLine 
            y={25} 
            stroke={getRiskColor('Low')} 
            strokeDasharray="3 3" 
            label={{ value: 'Low Risk', position: 'right', fill: getRiskColor('Low') }} 
          />
        </LineChart>
      </ResponsiveContainer>
      
      <div className="mt-2 text-sm">
        <p>This chart shows how risk scores have changed as you've modified the CR inputs and project parameters.</p>
        {data.length > 0 && (
          <div className="mt-1">
            <span className="font-medium">Current Risk Score: </span>
            <span 
              style={{ color: getRiskColor(data[data.length - 1].riskLevel) }}
              className="font-medium"
            >
              {data[data.length - 1].overallRisk.toFixed(1)} ({data[data.length - 1].riskLevel})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskTrend;