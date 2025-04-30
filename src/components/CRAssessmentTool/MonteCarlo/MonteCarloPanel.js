import React, { useState } from 'react';
import { useConfig } from 'context/ConfigContext';
import { runMonteCarloSimulation } from 'utils/monteCarloUtils';
import MonteCarloControls from './MonteCarloControls';
import MonteCarloVisualization from './MonteCarloVisualization';
import MonteCarloSummary from './MonteCarloSummary';

/**
 * Monte Carlo Panel Component
 * Main container for Monte Carlo simulation controls and results
 */
const MonteCarloPanel = () => {
  const { state, dispatch, ACTION_TYPES } = useConfig();
  const { 
    crInputs, 
    projectParams, 
    sprintCapacities, 
    monteCarloResults, 
    simulationIterations,
    isRunningSimulation
  } = state;
  
  // Local state for active tab
  const [activeTab, setActiveTab] = useState('distribution'); // 'distribution', 'confidence', 'team'
  
  // Check if we have valid inputs for simulation
  const hasValidInputs = crInputs.length > 0 && 
    crInputs.some(cr => cr.BAHours > 0 || cr.ConfigHours > 0 || cr.QAHours > 0);
  
  // Handle set simulation iterations
  const handleSetSimulationIterations = (iterations) => {
    dispatch({
      type: ACTION_TYPES.SET_SIMULATION_ITERATIONS,
      payload: iterations
    });
  };
  
  // Handle run simulation button click
  const handleRunSimulation = async () => {
    if (!hasValidInputs) return;
    
    // Set running flag
    dispatch({
      type: ACTION_TYPES.SET_RUNNING_SIMULATION,
      payload: true
    });
    
    try {
      // Run the simulation in a setTimeout to allow UI updates
      setTimeout(() => {
        try {
          const results = runMonteCarloSimulation(
            crInputs, 
            projectParams, 
            sprintCapacities, 
            simulationIterations
          );
          
          // Update results in state
          dispatch({
            type: ACTION_TYPES.SET_MONTE_CARLO_RESULTS,
            payload: results
          });
          
          // Mark as unsaved changes
          dispatch({
            type: ACTION_TYPES.SET_UNSAVED_CHANGES,
            payload: true
          });
        } catch (error) {
          console.error("Error running Monte Carlo simulation:", error);
        } finally {
          // Reset running flag
          dispatch({
            type: ACTION_TYPES.SET_RUNNING_SIMULATION,
            payload: false
          });
        }
      }, 100);
    } catch (error) {
      console.error("Error in handleRunSimulation:", error);
      dispatch({
        type: ACTION_TYPES.SET_RUNNING_SIMULATION,
        payload: false
      });
    }
  };
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3">Monte Carlo Timeline Simulation</h3>
      
      {/* Controls */}
      <MonteCarloControls 
        simulationIterations={simulationIterations} 
        setSimulationIterations={handleSetSimulationIterations} 
        onRunSimulation={handleRunSimulation} 
        isRunningSimulation={isRunningSimulation}
        hasValidInputs={hasValidInputs}
      />
      
      {/* Results */}
      {isRunningSimulation ? (
        <div className="p-6 bg-white rounded shadow text-center mt-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p>Running simulation with {simulationIterations.toLocaleString()} iterations...</p>
          <p className="text-xs text-gray-500 mt-1">This may take a few seconds</p>
        </div>
      ) : monteCarloResults ? (
        <div className="mt-4">
          {/* Tabs */}
          <div className="mb-4 border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('distribution')}
                className={`py-2 px-4 text-sm font-medium ${
                  activeTab === 'distribution'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Deadline Distribution
              </button>
              <button
                onClick={() => setActiveTab('confidence')}
                className={`py-2 px-4 text-sm font-medium ${
                  activeTab === 'confidence'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Confidence Levels
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`py-2 px-4 text-sm font-medium ${
                  activeTab === 'team'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Team Analysis
              </button>
            </nav>
          </div>
          
          {/* Active tab content */}
          <div className="p-4 bg-white rounded shadow">
            <MonteCarloVisualization 
              monteCarloResults={monteCarloResults} 
              projectParams={projectParams}
              activeTab={activeTab}
            />
          </div>
          
          {/* Summary Section */}
          <div className="mt-4">
            <MonteCarloSummary 
              monteCarloResults={monteCarloResults} 
              projectParams={projectParams}
            />
          </div>
        </div>
      ) : (
        <div className="p-6 bg-white rounded shadow text-center mt-4">
          <p>Click "Run Monte Carlo Simulation" to generate probabilistic forecasts</p>
          {!hasValidInputs && (
            <p className="text-xs text-red-500 mt-2">
              Add CR effort estimates before running the simulation
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MonteCarloPanel;