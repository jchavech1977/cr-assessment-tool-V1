import React, { useState } from 'react';
import { useConfig } from 'context/ConfigContext';
import { saveConfiguration } from 'utils/storageUtils';

/**
 * Save Configuration Modal Component
 * Allows users to save the current configuration with a name
 */
const SaveConfigModal = ({ onClose }) => {
  const { state, dispatch, ACTION_TYPES } = useConfig();
  const { currentConfigId, currentConfigName, savedConfigs } = state;
  
  // Local state for input field
  const [configName, setConfigName] = useState(currentConfigName);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  // Handle save action
  const handleSave = async () => {
    if (!configName.trim()) {
      setSaveError('Please enter a configuration name');
      return;
    }
    
    setIsSaving(true);
    setSaveError('');
    
    try {
      // Save configuration
      const result = await saveConfiguration(state, currentConfigId, configName);
      
      if (result.success) {
        // Update config details in state
        dispatch({
          type: ACTION_TYPES.SET_CONFIG_DETAILS,
          payload: {
            id: result.id,
            name: configName,
            hasUnsavedChanges: false
          }
        });
        
        // Update saved configs list
        const existingConfigIndex = savedConfigs.findIndex(c => c.id === result.id);
        
        if (existingConfigIndex >= 0) {
          // Update existing config in the list
          const updatedConfigs = [...savedConfigs];
          updatedConfigs[existingConfigIndex] = {
            ...updatedConfigs[existingConfigIndex],
            name: configName,
            lastModified: new Date().toISOString()
          };
          
          dispatch({
            type: ACTION_TYPES.SET_SAVED_CONFIGS,
            payload: updatedConfigs
          });
        } else {
          // Add new config to the list
          dispatch({
            type: ACTION_TYPES.SET_SAVED_CONFIGS,
            payload: [
              ...savedConfigs,
              {
                id: result.id,
                name: configName,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
              }
            ]
          });
        }
        
        // Close modal
        onClose();
      } else {
        setSaveError('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      setSaveError('An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Save Configuration</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Configuration Name</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            placeholder="Enter a name for this configuration"
          />
          {saveError && (
            <p className="mt-1 text-sm text-red-600">{saveError}</p>
          )}
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveConfigModal;