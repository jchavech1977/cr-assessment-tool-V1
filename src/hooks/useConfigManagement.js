import { useEffect } from 'react';
import { useConfig } from 'context/ConfigContext';
import { 
  saveConfiguration, 
  loadConfiguration, 
  deleteConfiguration, 
  loadSavedConfigurations, 
  generateUUID 
} from 'utils/storageUtils';

/**
 * Custom hook for managing configurations
 * @returns {Object} Configuration management state and functions
 */
export const useConfigManagement = () => {
  const { state, dispatch, ACTION_TYPES } = useConfig();
  const { 
    currentConfigId, 
    currentConfigName, 
    savedConfigs, 
    hasUnsavedChanges 
  } = state;
  
  // Load saved configurations on initial render
  useEffect(() => {
    loadConfigs();
  }, []);
  
  /**
   * Load saved configurations from storage
   */
  const loadConfigs = async () => {
    try {
      const configs = await loadSavedConfigurations();
      dispatch({ 
        type: ACTION_TYPES.SET_SAVED_CONFIGS, 
        payload: configs 
      });
    } catch (error) {
      console.error('Error loading saved configurations:', error);
    }
  };
  
  /**
   * Save current configuration
   * @param {string} name - Configuration name
   * @returns {Promise<Object>} Result with success status and ID
   */
  const saveCurrentConfiguration = async (name) => {
    try {
      const configId = currentConfigId || generateUUID();
      const configName = name || currentConfigName;
      
      // Save configuration to storage
      const result = await saveConfiguration(state, configId, configName);
      
      if (result.success) {
        // Update config details
        dispatch({
          type: ACTION_TYPES.SET_CONFIG_DETAILS,
          payload: {
            id: result.id,
            name: configName,
            hasUnsavedChanges: false
          }
        });
        
        // Reload saved configurations
        await loadConfigs();
      }
      
      return result;
    } catch (error) {
      console.error('Error saving configuration:', error);
      return { success: false, id: null };
    }
  };
  
  /**
   * Load configuration by ID
   * @param {string} configId - Configuration ID to load
   * @returns {Promise<boolean>} Success indicator
   */
  const loadConfigById = async (configId) => {
    try {
      // Load configuration from storage
      const configState = await loadConfiguration(configId);
      
      if (!configState) {
        return false;
      }
      
      // Find config details
      const configDetails = savedConfigs.find(c => c.id === configId);
      
      // Update state with loaded configuration
      dispatch({
        type: ACTION_TYPES.LOAD_CONFIGURATION,
        payload: configState
      });
      
      // Update config details
      dispatch({
        type: ACTION_TYPES.SET_CONFIG_DETAILS,
        payload: {
          id: configId,
          name: configDetails?.name || 'Loaded Configuration',
          hasUnsavedChanges: false
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error loading configuration:', error);
      return false;
    }
  };
  
  /**
   * Delete configuration by ID
   * @param {string} configId - Configuration ID to delete
   * @returns {Promise<boolean>} Success indicator
   */
  const deleteConfigById = async (configId) => {
    try {
      // Delete configuration from storage
      const success = await deleteConfiguration(configId);
      
      if (success) {
        // Update saved configs list
        const updatedConfigs = savedConfigs.filter(c => c.id !== configId);
        
        dispatch({
          type: ACTION_TYPES.SET_SAVED_CONFIGS,
          payload: updatedConfigs
        });
        
        // If we deleted the active config, reset config details
        if (currentConfigId === configId) {
          dispatch({
            type: ACTION_TYPES.SET_CONFIG_DETAILS,
            payload: {
              id: null,
              name: "Untitled Configuration",
              hasUnsavedChanges: true
            }
          });
        }
      }
      
      return success;
    } catch (error) {
      console.error('Error deleting configuration:', error);
      return false;
    }
  };
  
  /**
   * Create a new configuration
   * @param {boolean} saveCurrentFirst - Whether to save current config first
   * @param {string} newConfigName - Name for the new configuration
   * @returns {Promise<boolean>} Success indicator
   */
  const createNewConfiguration = async (saveCurrentFirst = false, newConfigName = "Untitled Configuration") => {
    try {
      // If requested, save current configuration first
      if (saveCurrentFirst && hasUnsavedChanges && currentConfigId) {
        const saveResult = await saveCurrentConfiguration(currentConfigName);
        if (!saveResult.success) {
          return false;
        }
      }
      
      // Reset state to defaults
      dispatch({ type: ACTION_TYPES.RESET_STATE });
      
      // Set new configuration name
      dispatch({
        type: ACTION_TYPES.SET_CONFIG_DETAILS,
        payload: {
          id: null,
          name: newConfigName,
          hasUnsavedChanges: true
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error creating new configuration:', error);
      return false;
    }
  };
  
  /**
   * Check if there are unsaved changes and confirm action
   * @param {Function} actionCallback - Function to call if confirmed
   * @returns {Promise<boolean>} Whether the action was confirmed and executed
   */
  const confirmWithUnsavedChanges = async (actionCallback) => {
    if (hasUnsavedChanges) {
      // In a real implementation, you would show a confirmation dialog
      // Here we're just simulating with a confirm() call
      const confirmed = window.confirm('You have unsaved changes. Proceed anyway?');
      
      if (!confirmed) {
        return false;
      }
    }
    
    // Execute the callback if confirmed or no unsaved changes
    return await actionCallback();
  };
  
  return {
    currentConfigId,
    currentConfigName,
    savedConfigs,
    hasUnsavedChanges,
    saveCurrentConfiguration,
    loadConfigById,
    deleteConfigById,
    createNewConfiguration,
    confirmWithUnsavedChanges,
    loadConfigs
  };
};

export default useConfigManagement;