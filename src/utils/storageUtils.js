/**
 * Utility functions for local storage operations
 */

// Storage key for configurations
const STORAGE_KEY = 'crAssessmentConfigs';

/**
 * Generate a UUID for saving configurations
 * @returns {string} A UUID string
 */
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Load saved configurations from localStorage
 * @returns {Array} Array of saved configurations
 */
export const loadSavedConfigurations = () => {
  try {
    const savedConfigsString = localStorage.getItem(STORAGE_KEY);
    if (savedConfigsString) {
      return JSON.parse(savedConfigsString);
    }
    return [];
  } catch (error) {
    console.error("Error loading saved configurations:", error);
    return [];
  }
};

/**
 * Save configurations to localStorage
 * @param {Array} configs - Array of configuration objects
 * @returns {boolean} Success indicator
 */
export const saveConfigurations = (configs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    return true;
  } catch (error) {
    console.error("Error saving configurations:", error);
    return false;
  }
};

/**
 * Process state for storage (convert Date objects to strings)
 * @param {Object} state - Application state to prepare for storage
 * @returns {Object} Processed state ready for storage
 */
export const prepareStateForStorage = (state) => {
  // Create a deep copy of the state to avoid mutating the original
  const stateCopy = JSON.parse(JSON.stringify(state));
  
  // Convert Date objects to ISO strings
  if (stateCopy.projectParams?.deadline) {
    stateCopy.projectParams.deadline = new Date(stateCopy.projectParams.deadline).toISOString();
  }
  
  if (stateCopy.results?.newDeadline) {
    stateCopy.results.newDeadline = new Date(stateCopy.results.newDeadline).toISOString();
  }
  
  // Handle dates in Monte Carlo results if they exist
  if (stateCopy.monteCarloResults) {
    if (stateCopy.monteCarloResults.deadlinePercentiles) {
      Object.keys(stateCopy.monteCarloResults.deadlinePercentiles).forEach(key => {
        const date = stateCopy.monteCarloResults.deadlinePercentiles[key];
        if (date) {
          stateCopy.monteCarloResults.deadlinePercentiles[key] = new Date(date).toISOString();
        }
      });
    }
    
    if (Array.isArray(stateCopy.monteCarloResults.rawDeadlines)) {
      stateCopy.monteCarloResults.rawDeadlines = stateCopy.monteCarloResults.rawDeadlines.map(
        date => new Date(date).toISOString()
      );
    }
    
    if (Array.isArray(stateCopy.monteCarloResults.deadlineHistogram)) {
      stateCopy.monteCarloResults.deadlineHistogram.forEach(item => {
        if (item.date) {
          item.date = new Date(item.date).toISOString();
        }
      });
    }
  }
  
  // Handle dates in risk history if it exists
  if (Array.isArray(stateCopy.riskHistory)) {
    stateCopy.riskHistory.forEach(record => {
      if (record.timestamp) {
        record.timestamp = new Date(record.timestamp).toISOString();
      }
    });
  }
  
  return stateCopy;
};

/**
 * Process state from storage (convert string dates back to Date objects)
 * @param {Object} state - State loaded from storage
 * @returns {Object} Processed state with restored Date objects
 */
export const processStateFromStorage = (state) => {
  // Create a deep copy of the state to avoid mutating the original
  const stateCopy = JSON.parse(JSON.stringify(state));
  
  // Convert ISO strings back to Date objects
  if (stateCopy.projectParams?.deadline) {
    stateCopy.projectParams.deadline = new Date(stateCopy.projectParams.deadline);
  }
  
  if (stateCopy.results?.newDeadline) {
    stateCopy.results.newDeadline = new Date(stateCopy.results.newDeadline);
  }
  
  // Handle dates in Monte Carlo results if they exist
  if (stateCopy.monteCarloResults) {
    if (stateCopy.monteCarloResults.deadlinePercentiles) {
      Object.keys(stateCopy.monteCarloResults.deadlinePercentiles).forEach(key => {
        const dateString = stateCopy.monteCarloResults.deadlinePercentiles[key];
        if (dateString) {
          stateCopy.monteCarloResults.deadlinePercentiles[key] = new Date(dateString);
        }
      });
    }
    
    if (Array.isArray(stateCopy.monteCarloResults.rawDeadlines)) {
      stateCopy.monteCarloResults.rawDeadlines = stateCopy.monteCarloResults.rawDeadlines.map(
        dateString => new Date(dateString)
      );
    }
    
    if (Array.isArray(stateCopy.monteCarloResults.deadlineHistogram)) {
      stateCopy.monteCarloResults.deadlineHistogram.forEach(item => {
        if (item.date) {
          item.date = new Date(item.date);
        }
      });
    }
  }
  
  // Handle dates in risk history if it exists
  if (Array.isArray(stateCopy.riskHistory)) {
    stateCopy.riskHistory.forEach(record => {
      if (record.timestamp) {
        record.timestamp = new Date(record.timestamp);
      }
    });
  }
  
  return stateCopy;
};

/**
 * Save a configuration
 * @param {Object} state - Current application state
 * @param {string} configId - Configuration ID (or null for new)
 * @param {string} configName - Configuration name
 * @returns {Object} Result with success flag and the configuration ID
 */
export const saveConfiguration = (state, configId, configName) => {
  try {
    const id = configId || generateUUID();
    const timestamp = new Date().toISOString();
    const processedState = prepareStateForStorage(state);
    
    // Load existing configurations
    const configs = loadSavedConfigurations();
    
    // Create or update configuration
    const newConfig = {
      id,
      name: configName,
      state: processedState,
      createdAt: configId ? undefined : timestamp,
      lastModified: timestamp
    };
    
    // Find existing config index if updating
    const existingIndex = configs.findIndex(c => c.id === id);
    
    if (existingIndex >= 0) {
      // Preserve created date if updating
      newConfig.createdAt = configs[existingIndex].createdAt;
      // Update existing config
      configs[existingIndex] = newConfig;
    } else {
      // Add new config
      configs.push(newConfig);
    }
    
    // Save to localStorage
    const success = saveConfigurations(configs);
    
    return { success, id };
  } catch (error) {
    console.error("Error saving configuration:", error);
    return { success: false, id: null };
  }
};

/**
 * Load a configuration by ID
 * @param {string} configId - ID of the configuration to load
 * @returns {Object|null} The loaded state or null if not found
 */
export const loadConfiguration = (configId) => {
  try {
    const configs = loadSavedConfigurations();
    const config = configs.find(c => c.id === configId);
    
    if (!config) return null;
    
    // Process the state to convert strings back to Date objects
    return processStateFromStorage(config.state);
  } catch (error) {
    console.error("Error loading configuration:", error);
    return null;
  }
};

/**
 * Delete a configuration
 * @param {string} configId - ID of the configuration to delete
 * @returns {boolean} Success indicator
 */
export const deleteConfiguration = (configId) => {
  try {
    const configs = loadSavedConfigurations();
    const updatedConfigs = configs.filter(c => c.id !== configId);
    return saveConfigurations(updatedConfigs);
  } catch (error) {
    console.error("Error deleting configuration:", error);
    return false;
  }
};