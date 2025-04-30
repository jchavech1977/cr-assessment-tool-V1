import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  projectParams: {
    totalSprints: 22,
    currentSprint: 11,
    baselineSprint: 11,
    deadline: new Date('2026-04-17T12:00:00'),
    sprintDurationDays: 20,
  },
  resourceCapacity: {
    BA: 5,
    Config: 3,
    QA: 4,
  },
  teamResources: {
    BA: 7,
    Config: 16,
    QA: 13,
  },
  sprintCapacities: [],
  crInputs: [{ id: 1, name: "CR 1", BAHours: 0, ConfigHours: 0, QAHours: 0 }],
  riskAssessment: null,
  riskHistory: [],
  monteCarloResults: null,
  simulationIterations: 5000,
  results: {
    additionalSprints: 0,
    additionalDays: 0,
    newDeadline: new Date('2026-04-17T12:00:00'),
    criticalPath: "",
    teamImpacts: { 
      BA: { currentSprint: 0, total: 0 },
      Config: { currentSprint: 0, total: 0 },
      QA: { currentSprint: 0, total: 0 }
    },
    capacityDetails: {
      capacity: { BA: 0, Config: 0, QA: 0 },
      allocated: { BA: 0, Config: 0, QA: 0 },
      available: { BA: 0, Config: 0, QA: 0 },
      utilization: { BA: 0, Config: 0, QA: 0 }
    },
    storiesToCapacity: {
      BA: { hours: 0, stories: 0, capacityImpact: 0 },
      Config: { hours: 0, stories: 0, capacityImpact: 0 },
      QA: { hours: 0, stories: 0, capacityImpact: 0 }
    }
  },
  currentConfigId: null,
  currentConfigName: "Untitled Configuration",
  savedConfigs: [],
  hasUnsavedChanges: false,
  isRunningSimulation: false,
  activeVisTab: 'capacity'
};

// Action types
const ACTION_TYPES = {
  UPDATE_PROJECT_PARAMS: 'UPDATE_PROJECT_PARAMS',
  UPDATE_RESOURCE_CAPACITY: 'UPDATE_RESOURCE_CAPACITY',
  UPDATE_TEAM_RESOURCES: 'UPDATE_TEAM_RESOURCES',
  SET_SPRINT_CAPACITIES: 'SET_SPRINT_CAPACITIES',
  UPDATE_SPRINT_CAPACITY: 'UPDATE_SPRINT_CAPACITY',
  ADD_CR: 'ADD_CR',
  REMOVE_CR: 'REMOVE_CR',
  UPDATE_CR: 'UPDATE_CR',
  SET_CR_INPUTS: 'SET_CR_INPUTS',
  SET_RISK_ASSESSMENT: 'SET_RISK_ASSESSMENT',
  ADD_RISK_HISTORY: 'ADD_RISK_HISTORY',
  SET_MONTE_CARLO_RESULTS: 'SET_MONTE_CARLO_RESULTS',
  SET_SIMULATION_ITERATIONS: 'SET_SIMULATION_ITERATIONS',
  SET_RESULTS: 'SET_RESULTS',
  SET_CONFIG_DETAILS: 'SET_CONFIG_DETAILS',
  SET_SAVED_CONFIGS: 'SET_SAVED_CONFIGS',
  SET_UNSAVED_CHANGES: 'SET_UNSAVED_CHANGES',
  SET_RUNNING_SIMULATION: 'SET_RUNNING_SIMULATION',
  LOAD_CONFIGURATION: 'LOAD_CONFIGURATION',
  RESET_STATE: 'RESET_STATE',
  SET_ACTIVE_VIS_TAB: 'SET_ACTIVE_VIS_TAB'
};

// Reducer function
function configReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.UPDATE_PROJECT_PARAMS:
      return { 
        ...state, 
        projectParams: { ...state.projectParams, ...action.payload },
        hasUnsavedChanges: true 
      };
      
    case ACTION_TYPES.UPDATE_RESOURCE_CAPACITY:
      return { 
        ...state, 
        resourceCapacity: { ...state.resourceCapacity, ...action.payload },
        hasUnsavedChanges: true 
      };
      
    case ACTION_TYPES.UPDATE_TEAM_RESOURCES:
      return { 
        ...state, 
        teamResources: { ...state.teamResources, ...action.payload },
        hasUnsavedChanges: true 
      };
      
    case ACTION_TYPES.SET_SPRINT_CAPACITIES:
      return { 
        ...state, 
        sprintCapacities: action.payload,
        hasUnsavedChanges: true 
      };
      
    case ACTION_TYPES.UPDATE_SPRINT_CAPACITY:
      return {
        ...state,
        sprintCapacities: state.sprintCapacities.map(sprint => 
          sprint.sprintNumber === action.payload.sprintNumber 
            ? { ...sprint, ...action.payload.changes } 
            : sprint
        ),
        hasUnsavedChanges: true
      };
      
    case ACTION_TYPES.ADD_CR:
      const newId = state.crInputs.length > 0 
        ? Math.max(...state.crInputs.map(cr => cr.id)) + 1 
        : 1;
      return {
        ...state,
        crInputs: [...state.crInputs, { 
          id: newId, 
          name: `CR ${newId}`, 
          BAHours: 0, 
          ConfigHours: 0, 
          QAHours: 0 
        }],
        hasUnsavedChanges: true
      };
      
    case ACTION_TYPES.REMOVE_CR:
      return {
        ...state,
        crInputs: state.crInputs.filter(cr => cr.id !== action.payload),
        hasUnsavedChanges: true
      };
      
    case ACTION_TYPES.UPDATE_CR:
      return {
        ...state,
        crInputs: state.crInputs.map(cr => 
          cr.id === action.payload.id 
            ? { ...cr, [action.payload.field]: action.payload.value } 
            : cr
        ),
        hasUnsavedChanges: true
      };
      
    case ACTION_TYPES.SET_CR_INPUTS:
      return {
        ...state,
        crInputs: action.payload,
        hasUnsavedChanges: true
      };
      
    case ACTION_TYPES.SET_RISK_ASSESSMENT:
      return {
        ...state,
        riskAssessment: action.payload
      };
      
    case ACTION_TYPES.ADD_RISK_HISTORY:
      return {
        ...state,
        riskHistory: [...state.riskHistory, action.payload]
      };
      
    case ACTION_TYPES.SET_MONTE_CARLO_RESULTS:
      return {
        ...state,
        monteCarloResults: action.payload
      };
      
    case ACTION_TYPES.SET_SIMULATION_ITERATIONS:
      return {
        ...state,
        simulationIterations: action.payload
      };
      
    case ACTION_TYPES.SET_RESULTS:
      return {
        ...state,
        results: action.payload
      };
      
    case ACTION_TYPES.SET_CONFIG_DETAILS:
      return { 
        ...state, 
        currentConfigId: action.payload.id, 
        currentConfigName: action.payload.name,
        hasUnsavedChanges: action.payload.hasUnsavedChanges ?? false
      };
      
    case ACTION_TYPES.SET_SAVED_CONFIGS:
      return {
        ...state,
        savedConfigs: action.payload
      };
      
    case ACTION_TYPES.SET_UNSAVED_CHANGES:
      return {
        ...state,
        hasUnsavedChanges: action.payload
      };
      
    case ACTION_TYPES.SET_RUNNING_SIMULATION:
      return {
        ...state,
        isRunningSimulation: action.payload
      };
      
    case ACTION_TYPES.LOAD_CONFIGURATION:
      return {
        ...state,
        ...action.payload,
        hasUnsavedChanges: false
      };
      
    case ACTION_TYPES.RESET_STATE:
      return {
        ...initialState,
        savedConfigs: state.savedConfigs // Preserve saved configurations
      };
    
    case ACTION_TYPES.SET_ACTIVE_VIS_TAB:
      return {
        ...state,
        activeVisTab: action.payload
      };
      
    default:
      return state;
  }
}

// Create context
const ConfigContext = createContext();

// Provider component
export const ConfigProvider = ({ children }) => {
  const [state, dispatch] = useReducer(configReducer, initialState);
  
  // Initialize sprint capacities when needed
  useEffect(() => {
    if (state.sprintCapacities.length === 0) {
      // Initialize with default capacities
      const newSprintCapacities = [];
      for (let sprint = 1; sprint <= state.projectParams.totalSprints; sprint++) {
        // Calculate team capacity in user stories
        const baCapacity = state.teamResources.BA * state.resourceCapacity.BA;
        const configCapacity = state.teamResources.Config * state.resourceCapacity.Config;
        const qaCapacity = state.teamResources.QA * state.resourceCapacity.QA;
        
        // Set default allocation to match typical utilization
        newSprintCapacities.push({
          sprintNumber: sprint,
          resources: { ...state.teamResources },
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
    }
  }, [
    state.sprintCapacities.length, 
    state.projectParams.totalSprints, 
    state.teamResources, 
    state.resourceCapacity
  ]);
  
  return (
    <ConfigContext.Provider value={{ state, dispatch, ACTION_TYPES }}>
      {children}
    </ConfigContext.Provider>
  );
};

// Hook for using the config context
export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};