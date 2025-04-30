import { useState } from 'react';
import { useConfig } from '../context/ConfigContext';
import { runMonteCarloSimulation } from '../utils/monteCarloUtils';

/**
 * Custom hook for managing Monte Carlo simulation state and operations
 * @returns {Object} Monte Carlo simulation state and functions
 */
export const useMonteCarlo = () => {
  const { state, dispatch, ACTION_TYPES } = useConfig();
  const { 
    crInputs, 
    projectParams, 
    sprintCapacities, 
    monteCarloResults,
    simulationIterations,
    isRunningSimulation
  } = state;
  
  /**
   * Set the number of iterations for the Monte Carlo simulation
   * @param {number} iterations - Number of iterations to run
   */
  const setSimulationIterations = (iterations) => {
    dispatch({
      type: ACTION_TYPES.SET_SIMULATION_ITERATIONS,
      payload: iterations
    });
  };
  
  /**
   * Run the Monte Carlo simulation
   * @returns {Promise<void>}
   */
  const runSimulation = async () => {
    // Set the running flag
    dispatch({
      type: ACTION_TYPES.SET_RUNNING_SIMULATION,
      payload: true
    });
    
    try {
      // Use setTimeout to allow UI to update before starting computation
      await new Promise(resolve => {
        setTimeout(() => {
          try {
            // Run the simulation
            const results = runMonteCarloSimulation(
              crInputs, 
              projectParams, 
              sprintCapacities, 
              simulationIterations
            );
            
            // Update the results in state
            dispatch({
              type: ACTION_TYPES.SET_MONTE_CARLO_RESULTS,
              payload: results
            });
            
            // Mark as unsaved changes
            dispatch({
              type: ACTION_TYPES.SET_UNSAVED_CHANGES,
              payload: true
            });
            
            resolve();
          } catch (error) {
            console.error("Error running Monte Carlo simulation:", error);
            resolve();
          }
        }, 100);
      });
    } finally {
      // Reset the running flag
      dispatch({
        type: ACTION_TYPES.SET_RUNNING_SIMULATION,
        payload: false
      });
    }
  };
  
  /**
   * Clear Monte Carlo simulation results
   */
  const clearResults = () => {
    dispatch({
      type: ACTION_TYPES.SET_MONTE_CARLO_RESULTS,
      payload: null
    });
  };
  
  /**
   * Get confidence level descriptions
   * @returns {Object} Confidence level descriptions
   */
  const getConfidenceLevelDescriptions = () => {
    if (!monteCarloResults) return null;
    
    return {
      p10: {
        label: '10% (Optimistic)',
        description: 'Only a 10% chance of meeting this date',
        days: Math.round((new Date(monteCarloResults.deadlinePercentiles.p10) - projectParams.deadline) / (1000 * 60 * 60 * 24))
      },
      p50: {
        label: '50% (Median)',
        description: '50/50 chance of meeting this date',
        days: Math.round((new Date(monteCarloResults.deadlinePercentiles.p50) - projectParams.deadline) / (1000 * 60 * 60 * 24))
      },
      p90: {
        label: '90% (Conservative)',
        description: '90% chance of meeting this date',
        days: Math.round((new Date(monteCarloResults.deadlinePercentiles.p90) - projectParams.deadline) / (1000 * 60 * 60 * 24))
      }
    };
  };
  
  /**
   * Get most likely critical path team
   * @returns {string} Most likely critical path team
   */
  const getMostLikelyCriticalPath = () => {
    if (!monteCarloResults || !monteCarloResults.criticalPathProbabilities) return null;
    
    return Object.entries(monteCarloResults.criticalPathProbabilities)
      .sort((a, b) => b[1] - a[1])[0];
  };
  
  return {
    monteCarloResults,
    simulationIterations,
    isRunningSimulation,
    setSimulationIterations,
    runSimulation,
    clearResults,
    getConfidenceLevelDescriptions,
    getMostLikelyCriticalPath
  };
};

export default useMonteCarlo;