import React from 'react';
import { useConfig } from 'context/ConfigContext';
import SprintCapacityTable from './SprintCapacityTable';

/**
 * Sprint Capacity Manager Component
 * Container component for sprint capacity management
 */
const SprintCapacityManager = () => {
  const { state, dispatch, ACTION_TYPES } = useConfig();
  
  // Initialize sprint capacities
  const initializeSprintCapacities = () => {
    const { projectParams, teamResources, resourceCapacity } = state;
    
    let newSprintCapacities = [];
    for (let sprint = 1; sprint <= projectParams.totalSprints; sprint++) {
      // Calculate team capacity in user stories
      const baCapacity = teamResources.BA * resourceCapacity.BA;
      const configCapacity = teamResources.Config * resourceCapacity.Config;
      const qaCapacity = teamResources.QA * resourceCapacity.QA;
      
      // Set default allocation to match typical utilization
      newSprintCapacities.push({
        sprintNumber: sprint,
        resources: { ...teamResources },
        capacity: {
          BA: baCapacity,
          Config: configCapacity,
          QA: qaCapacity
        },
        allocated: {
          BA: Math.round(baCapacity * 0.9), // Default 90% allocation
          Config: Math.round(configCapacity * 0.8),
          QA: Math.round(qaCapacity * 0.8)
        },
        isEditable: false
      });
    }
    
    dispatch({
      type: ACTION_TYPES.SET_SPRINT_CAPACITIES,
      payload: newSprintCapacities
    });
  };
  
  return (
    <div>
      <SprintCapacityTable />
      
      <div className="mt-4 flex justify-end">
        <button
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={initializeSprintCapacities}
        >
          Reset to Default Capacity
        </button>
      </div>
    </div>
  );
};

export default SprintCapacityManager;