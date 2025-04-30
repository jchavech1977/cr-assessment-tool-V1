import React from 'react';
import { useConfig } from 'context/ConfigContext';
import CapacityVisualization from './CapacityVisualization';
import ImpactVisualization from './ImpactVisualization';
import EffortDistribution from './EffortDistribution';
import TimelineVisualization from './TimelineVisualization';
import RiskVisualization from './RiskVisualization';
import MonteCarloPanel from '../MonteCarlo/MonteCarloPanel';

/**
 * Visualization Tabs Component
 * Manages tabs for different visualizations
 */
const VisualizationTabs = () => {
  const { state, dispatch, ACTION_TYPES } = useConfig();
  const { activeVisTab } = state;
  
  // Tab definitions
  const tabs = [
    { id: 'capacity', label: 'Team Capacity' },
    { id: 'impact', label: 'Team Impact' },
    { id: 'distribution', label: 'CR Effort Distribution' },
    { id: 'timeline', label: 'Timeline Impact' },
    { id: 'risk', label: 'Risk Assessment' },
    { id: 'monteCarlo', label: 'Monte Carlo' }
  ];
  
  // Set active tab
  const setActiveTab = (tabId) => {
    dispatch({ 
      type: ACTION_TYPES.SET_ACTIVE_VIS_TAB, 
      payload: tabId 
    });
  };
  
  return (
    <div>
      <div className="mb-4">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-4 text-sm font-medium ${
                  activeVisTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      <div className="p-4 bg-white rounded shadow">
        {activeVisTab === 'capacity' && <CapacityVisualization />}
        {activeVisTab === 'impact' && <ImpactVisualization />}
        {activeVisTab === 'distribution' && <EffortDistribution />}
        {activeVisTab === 'timeline' && <TimelineVisualization />}
        {activeVisTab === 'risk' && <RiskVisualization />}
        {activeVisTab === 'monteCarlo' && <MonteCarloPanel />}
      </div>
    </div>
  );
};

export default VisualizationTabs;