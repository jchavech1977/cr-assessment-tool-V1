import React from 'react';
import { useConfig } from '../../context/ConfigContext';

const ToolHeader = ({ setShowSaveModal, setShowLoadModal, setShowNewModal }) => {
  const { state } = useConfig();
  const { currentConfigName, hasUnsavedChanges, currentConfigId } = state;
  
  return (
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
        >
          Save
        </button>
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          onClick={() => setShowLoadModal(true)}
        >
          Load
        </button>
        <button
          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          onClick={() => setShowNewModal(true)}
        >
          New
        </button>
      </div>
    </div>
  );
};

export default ToolHeader;