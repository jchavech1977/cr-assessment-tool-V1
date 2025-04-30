import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ReferenceLine, ResponsiveContainer, Cell
} from 'recharts';
import { useConfig } from 'context/ConfigContext';

/**
 * Impact Visualization Component
 * Displays team impact analysis in bar chart format
 */
const ImpactVisualization = () => {
  const { state } = useConfig();
  const { results } = state;
  
  // Prepare data for visualization
  const prepareTeamImpactData = () => {
    return [
      { team: 'Business Analysts', sprintImpact: results.teamImpacts.BA.currentSprint, totalImpact: results.teamImpacts.BA.total },
      { team: 'Configurators', sprintImpact: results.teamImpacts.Config.currentSprint, totalImpact: results.teamImpacts.Config.total },
      { team: 'QA Team', sprintImpact: results.teamImpacts.QA.currentSprint, totalImpact: results.teamImpacts.QA.total }
    ];
  };
  
  const data = prepareTeamImpactData();
  
  // Color scheme for visualizations
  const COLORS = {
    BA: '#0088FE',
    Config: '#00C49F', 
    QA: '#FFBB28',
    sprintImpact: '#7371FC', // Blue-ish color for current sprint impact
    totalImpact: '#14B8A6'    // Teal color for total project impact
  };
  
  // Custom label for bars
  const renderCustomBarLabel = ({ x, y, width, height, value }) => {
    // Only render if there's enough space
    if (height < 15) return null;
    
    return (
      <text 
        x={x + width / 2} 
        y={y + height / 2} 
        fill="#fff" 
        textAnchor="middle" 
        dominantBaseline="middle"
        fontSize={12}
      >
        {value.toFixed(1)}%
      </text>
    );
  };
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3">Team Impact Analysis</h3>
      <div className="p-2 bg-white rounded shadow">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 'dataMax']} />
            <YAxis type="category" dataKey="team" tick={{ fontSize: 12 }} width={120} />
            <Tooltip 
              formatter={(value, name) => [
                `${value.toFixed(1)}%`, 
                name === 'sprintImpact' ? 'Baseline Sprint Impact' : 'Total Project Impact'
              ]}
            />
            <Legend 
              payload={[
                { value: 'Baseline Sprint Impact %', type: 'square', color: COLORS.sprintImpact },
                { value: 'Total Project Impact %', type: 'square', color: COLORS.totalImpact }
              ]}
            />
            <Bar 
              dataKey="sprintImpact" 
              name="Baseline Sprint Impact %" 
              fill={COLORS.sprintImpact}
              label={renderCustomBarLabel}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`sprint-cell-${index}`} 
                  fill={entry.sprintImpact > 100 ? '#ff0000' : COLORS.sprintImpact} 
                />
              ))}
            </Bar>
            <Bar 
              dataKey="totalImpact" 
              name="Total Project Impact %" 
              fill={COLORS.totalImpact}
              label={renderCustomBarLabel}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`total-cell-${index}`} 
                  fill={entry.totalImpact > 100 ? '#ff6b6b' : COLORS.totalImpact} 
                />
              ))}
            </Bar>
            <ReferenceLine x={100} stroke="red" strokeDasharray="3 3" label={{ value: 'Capacity Limit', position: 'top', fill: 'red' }} />
          </BarChart>
        </ResponsiveContainer>
        
        <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
          <h4 className="font-medium mb-2">Understanding Impact Percentages</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium mb-1">Baseline Sprint Impact %</h5>
              <p className="text-sm text-gray-600">
                Shows how much of the available capacity in the baseline sprint (Sprint {state.projectParams.baselineSprint}) 
                would be consumed by the CRs. Values over 100% indicate that the required capacity exceeds what's available 
                in the sprint.
              </p>
            </div>
            <div>
              <h5 className="text-sm font-medium mb-1">Total Project Impact %</h5>
              <p className="text-sm text-gray-600">
                Shows how much of the remaining project capacity (from baseline sprint to end) would be consumed by the CRs.
                Values over 100% indicate that the implementation would need to extend beyond the current project timeline.
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <h5 className="text-sm font-medium mb-1">Critical Path Team</h5>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <p className="text-sm">
                <span className="font-medium">{results.criticalPath}</span> is the most constrained team and determines the 
                timeline extension of {results.additionalSprints.toFixed(2)} sprints ({results.additionalDays.toFixed(1)} days).
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-600">
          <p>* Values over 100% indicate required capacity exceeds available capacity</p>
          <p>* Red bars indicate over-allocation beyond available capacity</p>
        </div>
      </div>
    </div>
  );
};

export default ImpactVisualization;