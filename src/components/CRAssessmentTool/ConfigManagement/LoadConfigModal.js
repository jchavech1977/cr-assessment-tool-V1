import React, { useState } from 'react';
import { useConfig } from 'context/ConfigContext';
import { loadConfiguration, deleteConfiguration } from 'utils/storageUtils';

/**
 * Load Configuration Modal Component
 * Allows users to load a previously saved configuration
 */
const LoadConfigModal = ({ onClose }) => {
  const { state, dispatch, ACTION_TYPES } = useConfig();
  const { savedConfigs, currentConfigId, hasUnsavedChanges } = state;
  
  // Local state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [configToLoad, setConfigToLoad] = useState(null);
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Handle load action
  const handleLoad = (configId) => {
    // Check for unsaved changes
    if (hasUnsavedChanges) {
      setConfigToLoad(configId);
      setShowConfirmDialog(true);
      return;
    }
    
    // If no unsaved changes, load immediately
    loadSelectedConfig(configId);
  };
  
  // Load the selected configuration
  const loadSelectedConfig = async (configId) => {
    setLoading(true);
    setError('');
    
    try {
      // Load configuration from storage
      const loadedState = await loadConfiguration(configId);
      
      if (!loadedState) {
        setError('Failed to load configuration. The file may be corrupted or missing.');
        setLoading(false);
        return;
      }
      
      // Find config details
      const configDetails = savedConfigs.find(config => config.id === configId);
      
      // Update state with loaded configuration
      dispatch({
        type: ACTION_TYPES.LOAD_CONFIGURATION,
        payload: loadedState
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
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error loading configuration:', error);
      setError('An error occurred while loading the configuration.');
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };
  
  // Handle delete action
  const handleDelete = async (configId, event) => {
    // Stop event propagation to prevent triggering row click
    event.stopPropagation();
    
    // Ask for confirmation
    if (!window.confirm(`Are you sure you want to delete "${savedConfigs.find(c => c.id === configId)?.name}"?`)) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Delete configuration
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
      } else {
        setError('Failed to delete configuration');
      }
    } catch (error) {
      console.error('Error deleting configuration:', error);
      setError('An error occurred while deleting the configuration.');
    } finally {
      setLoading(false);
    }
  };
  
  // Confirmation Dialog
  const ConfirmDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Unsaved Changes</h3>
        <p className="mb-4">
          You have unsaved changes in the current configuration. Loading a new configuration will discard these changes.
        </p>
        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            onClick={() => setShowConfirmDialog(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => loadSelectedConfig(configToLoad)}
          >
            Discard Changes & Load
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {showConfirmDialog && <ConfirmDialog />}
      
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Load Configuration</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {savedConfigs.length === 0 ? (
          <p className="text-gray-500 my-4">No saved configurations found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border-b">Name</th>
                  <th className="px-4 py-2 border-b">Created</th>
                  <th className="px-4 py-2 border-b">Last Modified</th>
                  <th className="px-4 py-2 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedConfigs.map(config => (
                  <tr 
                    key={config.id} 
                    className={`${config.id === currentConfigId ? "bg-blue-50" : "hover:bg-gray-50 cursor-pointer"}`}
                    onClick={() => handleLoad(config.id)}
                  >
                    <td className="px-4 py-2 border-b font-medium">{config.name}</td>
                    <td className="px-4 py-2 border-b">{formatDate(config.createdAt)}</td>
                    <td className="px-4 py-2 border-b">{formatDate(config.lastModified)}</td>
                    <td className="px-4 py-2 border-b">
                      <div className="flex space-x-2">
                        <button
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoad(config.id);
                          }}
                        >
                          Load
                        </button>
                        <button
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          onClick={(e) => handleDelete(config.id, e)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="flex justify-end mt-4">
          <button
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoadConfigModal;