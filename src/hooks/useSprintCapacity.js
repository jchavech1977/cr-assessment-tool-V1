import { useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';

export const useSprintCapacity = () => {
  const { state, dispatch, ACTION_TYPES } = useConfig();
  const { 
    projectParams, 
    teamResources, 
    resourceCapacity, 
    sprintCapacities 
  } = state;
  
  // Initialize sprint capacities when needed
  useEffect(() => {
    if (sprintCapacities.length === 0) {
      initializeSprintCapacities();
    }
  }, [projectParams.totalSprints]);
  
  // Initialize sprint capacities from current configuration
  const initializeSprintCapacities = () => {
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
  
  // Toggle sprint editability
  const toggleSprintEdit = (sprintNumber) => {
    const updatedSprintCapacities = sprintCapacities.map(sprint => 
      sprint.sprintNumber === sprintNumber 
        ? { ...sprint, isEditable: !sprint.isEditable } 
        : sprint
    );
    
    dispatch({
      type: ACTION_TYPES.SET_SPRINT_CAPACITIES,
      payload: updatedSprintCapacities
    });
  };
  
  // Update sprint capacity
  const updateSprintCapacity = (sprintNumber, team, field, value) => {
    // Find the sprint to update
    const sprintToUpdate = sprintCapacities.find(s => s.sprintNumber === sprintNumber);
    if (!sprintToUpdate) return;
    
    // Create a copy of the sprint to modify
    let updatedSprint = { ...sprintToUpdate };
    
    // If updating resources, we need to recalculate capacity
    if (field === 'resources') {
      const newResources = { ...updatedSprint.resources, [team]: value };
      const newCapacity = { ...updatedSprint.capacity };
      newCapacity[team] = newResources[team] * resourceCapacity[team];
      
      updatedSprint = {
        ...updatedSprint,
        resources: newResources,
        capacity: newCapacity
      };
    }
    // If updating allocated stories
    else if (field === 'allocated') {
      updatedSprint = {
        ...updatedSprint,
        allocated: {
          ...updatedSprint.allocated,
          [team]: value
        }
      };
    }
    // For any other field
    else {
      updatedSprint = {
        ...updatedSprint,
        [field]: {
          ...updatedSprint[field],
          [team]: value
        }
      };
    }
    
    dispatch({
      type: ACTION_TYPES.UPDATE_SPRINT_CAPACITY,
      payload: {
        sprintNumber,
        changes: updatedSprint
      }
    });
  };

  // Get sprint capacity for a specific sprint
  const getSprintCapacity = (sprintNumber) => {
    const sprintData = sprintCapacities.find(s => s.sprintNumber === sprintNumber);
    if (!sprintData) return { capacity: {}, allocated: {}, available: {}, utilization: {} };
    
    // Get capacity and allocated values
    const capacity = sprintData.capacity;
    const allocated = sprintData.allocated;
    
    // Calculate available capacity (unused)
    const available = {
      BA: capacity.BA - allocated.BA,
      Config: capacity.Config - allocated.Config,
      QA: capacity.QA - allocated.QA
    };
    
    // Calculate utilization as a percentage
    const utilization = {
      BA: (allocated.BA / capacity.BA) * 100,
      Config: (allocated.Config / capacity.Config) * 100,
      QA: (allocated.QA / capacity.QA) * 100
    };
    
    return {
      capacity,
      allocated,
      available,
      utilization
    };
  };
  
  // Get total remaining capacity from baseline sprint to end (in user stories)
  const getRemainingCapacity = () => {
    let totalAvailable = { BA: 0, Config: 0, QA: 0 };
    
    // Calculate from baseline sprint to end
    for (let sprint = projectParams.baselineSprint; sprint <= projectParams.totalSprints; sprint++) {
      const capacity = getSprintCapacity(sprint);
      totalAvailable.BA += capacity.available.BA;
      totalAvailable.Config += capacity.available.Config;
      totalAvailable.QA += capacity.available.QA;
    }
    
    return totalAvailable;
  };
  
  // Update sprint capacities when team resources or capacity changes
  const updateSprintCapacitiesForResourceChanges = (team, value, isCapacityChange = false) => {
    const updatedSprintCapacities = sprintCapacities.map(sprint => {
      // Skip sprints that have been customized
      if (sprint.isEditable) return sprint;
      
      // Create a copy of the sprint
      const updatedSprint = { ...sprint };
      
      if (isCapacityChange) {
        // Update capacity based on per-person capacity change
        updatedSprint.capacity = {
          ...updatedSprint.capacity,
          [team]: updatedSprint.resources[team] * value
        };
      } else {
        // Update resources
        updatedSprint.resources = {
          ...updatedSprint.resources,
          [team]: value
        };
        
        // Recalculate capacity
        updatedSprint.capacity = {
          ...updatedSprint.capacity,
          [team]: value * resourceCapacity[team]
        };
      }
      
      // Update allocated (keeping same utilization percentage)
      const utilizationPercent = isCapacityChange
        ? (sprint.allocated[team] / (sprint.resources[team] * resourceCapacity[team] || 1))
        : (sprint.allocated[team] / (sprint.capacity[team] || 1));
      
      updatedSprint.allocated = {
        ...updatedSprint.allocated,
        [team]: Math.round(updatedSprint.capacity[team] * utilizationPercent)
      };
      
      return updatedSprint;
    });
    
    dispatch({
      type: ACTION_TYPES.SET_SPRINT_CAPACITIES,
      payload: updatedSprintCapacities
    });
  };
  
  return {
    sprintCapacities,
    initializeSprintCapacities,
    toggleSprintEdit,
    updateSprintCapacity,
    getSprintCapacity,
    getRemainingCapacity,
    updateSprintCapacitiesForResourceChanges
  };
};