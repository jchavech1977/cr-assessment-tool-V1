import React from 'react';

/**
 * Monte Carlo Controls Component
 * Provides controls for configuring and running Monte Carlo simulations
 */
const MonteCarloControls = ({ 
  simulationIterations, 
  setSimulationIterations, 
  onRunSimulation,
  isRunningSimulation,
  hasValidInputs
}) => {
  return (
    <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center p-4 bg-white rounded shadow">
      <div className="mb-3 md:mb-0">
        <h4 className="font-medium mb-1">Simulation Settings</h4>
        <p className="text-sm text-gray-600">
          Monte Carlo simulations model uncertainty by running multiple scenarios with random variations.
        </p>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <label className="text-sm mr-2">Iterations:</label>
          <select 
            className="p-1 border rounded"
            value={simulationIterations}
            onChange={(e) => setSimulationIterations(Number(e.target.value))}
            disabled={isRunningSimulation}
          >
            <option value={1000}>1,000</option>
            <option value={5000}>5,000</option>
            <option value={10000}>10,000</option>
            <option value={20000}>20,000</option>
          </select>
          <div className="text-xs text-gray-500 ml-2">
            <span className="hidden md:inline">More iterations = higher accuracy but slower</span>
          </div>
        </div>
        <button
          className={`px-4 py-2 ${
            !hasValidInputs || isRunningSimulation 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white rounded flex items-center`}
          onClick={onRunSimulation}
          disabled={!hasValidInputs || isRunningSimulation}
        >
          {isRunningSimulation ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Running...
            </>
          ) : (
            'Run Monte Carlo Simulation'
          )}
        </button>
      </div>
    </div>
  );
};

export default MonteCarloControls;