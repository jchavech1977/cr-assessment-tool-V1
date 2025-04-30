import React from 'react';
import { useConfig } from 'context/ConfigContext';

/**
 * Project Parameters Component
 * Manages project-level settings like sprints, deadlines, etc.
 */
const ProjectParameters = () => {
  const { state, dispatch, ACTION_TYPES } = useConfig();
  const { projectParams } = state;
  
  // Handle change for any project parameter
  const handleParamChange = (field, value) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_PROJECT_PARAMS,
      payload: { [field]: value }
    });
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Total Sprints</label>
        <input
          type="number"
          className="w-full p-2 border rounded"
          value={projectParams.totalSprints}
          onChange={(e) => handleParamChange('totalSprints', Number(e.target.value))}
          min="1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Current Sprint</label>
        <input
          type="number"
          className="w-full p-2 border rounded"
          value={projectParams.currentSprint}
          onChange={(e) => handleParamChange('currentSprint', Number(e.target.value))}
          min="1"
          max={projectParams.totalSprints}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Baseline Sprint</label>
        <input
          type="number"
          className="w-full p-2 border rounded"
          value={projectParams.baselineSprint}
          onChange={(e) => handleParamChange('baselineSprint', Number(e.target.value))}
          min="1"
          max={projectParams.totalSprints}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sprint Duration (days)</label>
        <input
          type="number"
          className="w-full p-2 border rounded"
          value={projectParams.sprintDurationDays}
          onChange={(e) => handleParamChange('sprintDurationDays', Number(e.target.value))}
          min="1"
          max="60"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
        <input
          type="date"
          className="w-full p-2 border rounded"
          value={projectParams.deadline.toISOString().split('T')[0]}
          onChange={(e) => handleParamChange('deadline', new Date(e.target.value + 'T12:00:00'))}
        />
      </div>
      
      <div className="lg:col-span-5 mt-2">
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Project Timeline Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Project Start:</span> Sprint 1
            </div>
            <div>
              <span className="font-medium">Current Position:</span> Sprint {projectParams.currentSprint} of {projectParams.totalSprints}
            </div>
            <div>
              <span className="font-medium">Baseline for CR Impact:</span> Sprint {projectParams.baselineSprint}
            </div>
            <div>
              <span className="font-medium">Project Completion:</span> {Math.round(projectParams.currentSprint / projectParams.totalSprints * 100)}% complete
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectParameters;