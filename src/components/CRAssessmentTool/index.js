import React, { useState, useEffect } from 'react';
import { useConfig } from 'context/ConfigContext';
import { useConfigManagement } from 'hooks/useConfigManagement';
import CRTable from './ChangeRequests/CRTable';
import ProjectParameters from './ProjectSettings/ProjectParameters';
import TeamResources from './ProjectSettings/TeamResources';
import SprintCapacityManager from './SprintCapacity/SprintCapacityManager';
import VisualizationTabs from './Visualization/VisualizationTabs';
import ImpactSummary from './Results/ImpactSummary';
import SaveConfigModal from './ConfigManagement/SaveConfigModal';
import LoadConfigModal from './ConfigManagement/LoadConfigModal';
import NewConfigModal from './ConfigManagement/NewConfigModal';
import { calculateImpact } from 'utils/calculationUtils';
import { loadSavedConfigurations } from 'utils/storageUtils';

/**
 * CRAssessmentTool
 * Main container component for the Change Request Impact Assessment Tool
 */
const CRAssessmentTool = () => {
  const { state, dispatch, ACTION_TYPES } = useConfig();
  const { 
    activeVisTab, 
    currentConfigName, 
    hasUnsavedChanges, 
    currentConfigId,
    crInputs,
    projectParams,
    sprintCapacities
  } = state;
  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  
  // Load saved configurations on initial render
  useEffect(() => {
    const loadConfigs = async () => {
      const configs = await loadSavedConfigurations();
      dispatch({ 
        type: ACTION_TYPES.SET_SAVED_CONFIGS, 
        payload: configs 
      });
    };
    
    loadConfigs();
  }, []);
  
  // Update results when inputs change
  useEffect(() => {
    if (sprintCapacities.length > 0 && crInputs.length > 0) {
      calculateAndUpdateImpact();
    }
  }, [crInputs, projectParams, sprintCapacities]);
  
  // Setup keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+S or Cmd+S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        setShowSaveModal(true);
      }
      // Ctrl+O or Cmd+O to open/load
      else if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
        event.preventDefault();
        setShowLoadModal(true);
      }
      // Ctrl+N or Cmd+N to create new
      else if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        setShowNewModal(true);
      }
    };
    
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Calculate and update impact data
  const calculateAndUpdateImpact = () => {
    const impactResults = calculateImpact(crInputs, projectParams, sprintCapacities);
    
    dispatch({
      type: ACTION_TYPES.SET_RESULTS,
      payload: impactResults
    });
    
    dispatch({
      type: ACTION_TYPES.SET_UNSAVED_CHANGES,
      payload: true
    });
  };
  
  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow">
      {/* Modals */}
      {showSaveModal && <SaveConfigModal onClose={() => setShowSaveModal(false)} />}
      {showLoadModal && <LoadConfigModal onClose={() => setShowLoadModal(false)} />}
      {showNewModal && <NewConfigModal onClose={() => setShowNewModal(false)} />}
      
      {/* Header with configuration buttons */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Change Request Impact Assessment Tool</h1>
        <div className="flex space-x-2">
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">
              {currentConfigId ? currentConfigName + (hasUnsavedChanges ? " *" : "") : "Untitled Configuration *"}
            </span>
          </div>
          <button
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            onClick={() => setShowSaveModal(true)}
            title="Save configuration (Ctrl+S)"
          >
            Save
          </button>
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            onClick={() => setShowLoadModal(true)}
            title="Load configuration (Ctrl+O)"
          >
            Load
          </button>
          <button
            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            onClick={() => setShowNewModal(true)}
            title="New configuration (Ctrl+N)"
          >
            New
          </button>
        </div>
      </div>
      
      {/* Project Settings Section */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Project Parameters</h2>
        <ProjectParameters />
      </div>
      
      {/* Team Resources Section */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Default Team Resources & Capacity</h2>
        <TeamResources />
      </div>
      
      {/* Sprint Capacity Section */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Sprint-by-Sprint Capacity Management</h2>
        <SprintCapacityManager />
      </div>
      
      {/* Change Requests Section */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Change Requests</h2>
        <CRTable />
      </div>
      
      {/* Visualization Tabs */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Impact Visualizations</h2>
        <VisualizationTabs />
      </div>
      
      {/* Results Section */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Impact Assessment Results</h2>
        <ImpactSummary />
      </div>
      
      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>CR Assessment Tool | All calculations are estimates and should be verified</p>
      </div>
    </div>
  );
};

export default CRAssessmentTool;