import React, { useState } from 'react';
import { useConfig } from 'context/ConfigContext';
import { saveConfiguration } from 'utils/storageUtils';

/**
 * New Configuration Modal Component
 * Handles creating a new configuration, with option to save existing changes
 */
const NewConfigModal = ({ onClose }) => {
  const { state, dispatch, ACTION_TYPES } = useConfig();
  const { hasUnsavedChanges, currentConfigId, currentConfigName } = state;
  
  // Local state
  const [saveFirst, setSaveFirst] = useState(hasUnsavedChanges);
  const [newConfigName, setNewConfigName] = useState('New Configuration');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Handle new configuration creation
  const handleCreateNew = async () => {
    setLoading(true);
    setError('');
    
    try {
      // If user wants to save changes first and there are changes to save
      if (saveFirst && hasUnsavedChanges && currentConfigId) {
        // Save current configuration
        const saveResult = await saveConfiguration(state, currentConfigId, currentConfigName);
        
        if (!saveResult.success) {
          setError('Failed to save current configuration before creating new one.');
          setLoading(false);
          return;
        }
      }
      
      // Reset the state to default values
      dispatch({ type: ACTION_TYPES.RESET_STATE });
      
      // Set the new configuration name
      dispatch({
        type: ACTION_TYPES.SET_CONFIG_DETAILS,
        payload: {
          id: null,
          name: newConfigName,
          hasUnsavedChanges: true
        }
      });
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Error creating new configuration:', error);
      setError('An error occurred while creating a new configuration.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Create New Configuration</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {/* New Configuration Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Configuration Name
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={newConfigName}
            onChange={(e) => setNewConfigName(e.target.value)}
            placeholder="Enter name for new configuration"
          />
        </div>
        
        {/* Save Current Configuration Option */}
        {hasUnsavedChanges && currentConfigId && (
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-600"
                checked={saveFirst}
                onChange={(e) => setSaveFirst(e.target.checked)}
              />
              <span className="ml-2">
                Save current configuration "{currentConfigName}" before creating new one
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500 ml-7">
              You have unsaved changes in the current configuration
            </p>
          </div>
        )}
        
        {/* Warning About Unsaved Changes */}
        {hasUnsavedChanges && !saveFirst && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded">
            Warning: You have unsaved changes that will be lost when creating a new configuration.
          </div>
        )}
        
        {/* Default Settings Preview */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">Default Settings</h4>
          <div className="p-3 bg-gray-50 rounded border border-gray-200 text-sm">
            <ul className="list-disc list-inside space-y-1">
              <li>Project with 22 total sprints</li>
              <li>Starting at Sprint 11 (baseline)</li>
              <li>Team sizes: 7 BA, 16 Config, 13 QA</li>
              <li>Standard capacity settings</li>
              <li>No change requests</li>
            </ul>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            onClick={handleCreateNew}
            disabled={loading || !newConfigName.trim()}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              'Create New Configuration'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewConfigModal;