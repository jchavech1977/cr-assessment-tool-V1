import React from 'react';
import { useConfig } from 'context/ConfigContext';

/**
 * Team Resources Component
 * Manages team sizes and per-person capacities
 */
const TeamResources = () => {
  const { state, dispatch, ACTION_TYPES } = useConfig();
  const { teamResources, resourceCapacity } = state;
  
  // Handle change for team size
  const handleTeamSizeChange = (team, value) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_TEAM_RESOURCES,
      payload: { [team]: value }
    });
  };
  
  // Handle change for per-person capacity
  const handleCapacityChange = (team, value) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_RESOURCE_CAPACITY,
      payload: { [team]: value }
    });
  };
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Analysts (# People)</label>
          <input
            type="number"
            className="w-full p-2 border rounded"
            value={teamResources.BA}
            onChange={(e) => handleTeamSizeChange('BA', Number(e.target.value))}
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Configurators (# People)</label>
          <input
            type="number"
            className="w-full p-2 border rounded"
            value={teamResources.Config}
            onChange={(e) => handleTeamSizeChange('Config', Number(e.target.value))}
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">QA Team (# People)</label>
          <input
            type="number"
            className="w-full p-2 border rounded"
            value={teamResources.QA}
            onChange={(e) => handleTeamSizeChange('QA', Number(e.target.value))}
            min="1"
          />
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">BA Capacity (Stories per Person)</label>
          <input
            type="number"
            className="w-full p-2 border rounded"
            value={resourceCapacity.BA}
            onChange={(e) => handleCapacityChange('BA', Number(e.target.value))}
            min="0.1"
            step="0.1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Config Capacity (Stories per Person)</label>
          <input
            type="number"
            className="w-full p-2 border rounded"
            value={resourceCapacity.Config}
            onChange={(e) => handleCapacityChange('Config', Number(e.target.value))}
            min="0.1"
            step="0.1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">QA Capacity (Stories per Person)</label>
          <input
            type="number"
            className="w-full p-2 border rounded"
            value={resourceCapacity.QA}
            onChange={(e) => handleCapacityChange('QA', Number(e.target.value))}
            min="0.1"
            step="0.1"
          />
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>* Capacity is measured in user stories per sprint that each team member can complete</p>
        <p>* Changing these values will automatically update all non-customized sprints</p>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
        <h3 className="text-sm font-medium text-blue-800 mb-1">Team Capacity Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">BA Team Capacity:</span> {teamResources.BA * resourceCapacity.BA} stories/sprint
          </div>
          <div>
            <span className="font-medium">Config Team Capacity:</span> {teamResources.Config * resourceCapacity.Config} stories/sprint
          </div>
          <div>
            <span className="font-medium">QA Team Capacity:</span> {teamResources.QA * resourceCapacity.QA} stories/sprint
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamResources;