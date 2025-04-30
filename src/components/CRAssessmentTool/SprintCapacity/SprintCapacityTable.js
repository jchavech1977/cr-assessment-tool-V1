import React from 'react';
import { useConfig } from 'context/ConfigContext';

/**
 * Sprint Capacity Table Component
 * Displays and manages sprint-by-sprint capacity
 */
const SprintCapacityTable = () => {
  const { state, dispatch, ACTION_TYPES } = useConfig();
  const { projectParams, sprintCapacities, results } = state;
  
  // Toggle sprint editability
  const toggleSprintEdit = (sprintNumber) => {
    const updatedSprintCapacities = sprintCapacities.map(sprint => 
      sprint.sprintNumber === sprintNumber 
        ? { ...sprint, isEditable: !sprint.isEditable } 
        : sprint
    );
    
    dispatch({
      type: ACTION_TYPES.SET_SPRINT_CAPACITIES,
      payload: updatedSprintCapacities
    });
  };
  
  // Update sprint capacity
  const updateSprintCapacity = (sprintNumber, team, field, value) => {
    // Find the sprint to update
    const sprintToUpdate = sprintCapacities.find(s => s.sprintNumber === sprintNumber);
    if (!sprintToUpdate) return;
    
    // Create a copy of the sprint
    let updatedSprint = { ...sprintToUpdate };
    
    // If updating resources, we need to recalculate capacity
    if (field === 'resources') {
      const newResources = { ...updatedSprint.resources, [team]: value };
      const newCapacity = { ...updatedSprint.capacity };
      newCapacity[team] = newResources[team] * state.resourceCapacity[team];
      
      updatedSprint = {
        ...updatedSprint,
        resources: newResources,
        capacity: newCapacity
      };
    }
    // If updating allocated stories
    else if (field === 'allocated') {
      updatedSprint = {
        ...updatedSprint,
        allocated: {
          ...updatedSprint.allocated,
          [team]: value
        }
      };
    }
    // For any other field
    else {
      updatedSprint = {
        ...updatedSprint,
        [field]: {
          ...updatedSprint[field],
          [team]: value
        }
      };
    }
    
    dispatch({
      type: ACTION_TYPES.UPDATE_SPRINT_CAPACITY,
      payload: {
        sprintNumber,
        changes: updatedSprint
      }
    });
  };
  
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-2 py-2 border-b">Sprint</th>
              <th className="px-2 py-2 border-b" colSpan="4">BAs</th>
              <th className="px-2 py-2 border-b" colSpan="4">Configurators</th>
              <th className="px-2 py-2 border-b" colSpan="4">QA Team</th>
              <th className="px-2 py-2 border-b">Actions</th>
            </tr>
            <tr>
              <th className="px-2 py-1 border-b"></th>
              <th className="px-2 py-1 border-b text-xs">Resources</th>
              <th className="px-2 py-1 border-b text-xs">Capacity</th>
              <th className="px-2 py-1 border-b text-xs">Allocated</th>
              <th className="px-2 py-1 border-b text-xs bg-blue-50">Utilization</th>
              <th className="px-2 py-1 border-b text-xs">Resources</th>
              <th className="px-2 py-1 border-b text-xs">Capacity</th>
              <th className="px-2 py-1 border-b text-xs">Allocated</th>
              <th className="px-2 py-1 border-b text-xs bg-blue-50">Utilization</th>
              <th className="px-2 py-1 border-b text-xs">Resources</th>
              <th className="px-2 py-1 border-b text-xs">Capacity</th>
              <th className="px-2 py-1 border-b text-xs">Allocated</th>
              <th className="px-2 py-1 border-b text-xs bg-blue-50">Utilization</th>
              <th className="px-2 py-1 border-b"></th>
            </tr>
          </thead>
          <tbody>
            {sprintCapacities.map(sprint => (
              <tr key={sprint.sprintNumber} className={sprint.sprintNumber === projectParams.baselineSprint ? "bg-blue-50" : ""}>
                <td className="px-2 py-1 border-b font-medium">
                  {sprint.sprintNumber === projectParams.baselineSprint ? 
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Sprint {sprint.sprintNumber} (Baseline)
                    </span> : 
                    `Sprint ${sprint.sprintNumber}`
                  }
                </td>
                
                {/* BA resources, capacity and allocation */}
                <td className="px-2 py-1 border-b">
                  {sprint.isEditable ? (
                    <input
                      type="number"
                      className="w-12 p-1 border rounded"
                      value={sprint.resources.BA}
                      onChange={(e) => updateSprintCapacity(sprint.sprintNumber, 'BA', 'resources', Number(e.target.value))}
                      min="0"
                    />
                  ) : sprint.resources.BA}
                </td>
                <td className="px-2 py-1 border-b">
                  {sprint.capacity.BA.toFixed(1)}
                </td>
                <td className="px-2 py-1 border-b">
                  {sprint.isEditable ? (
                    <input
                      type="number"
                      className="w-16 p-1 border rounded"
                      value={sprint.allocated.BA}
                      onChange={(e) => updateSprintCapacity(sprint.sprintNumber, 'BA', 'allocated', Number(e.target.value))}
                      min="0"
                    />
                  ) : sprint.allocated.BA}
                </td>
                <td className={`px-2 py-1 border-b ${
                  (sprint.allocated.BA / sprint.capacity.BA) * 100 > 100 ? 'bg-red-100 text-red-800 font-semibold' : 'bg-blue-50'
                }`}>
                  {((sprint.allocated.BA / (sprint.capacity.BA || 0.001)) * 100).toFixed(1)}%
                </td>
                
                {/* Configurator resources, capacity and allocation */}
                <td className="px-2 py-1 border-b">
                  {sprint.isEditable ? (
                    <input
                      type="number"
                      className="w-12 p-1 border rounded"
                      value={sprint.resources.Config}
                      onChange={(e) => updateSprintCapacity(sprint.sprintNumber, 'Config', 'resources', Number(e.target.value))}
                      min="0"
                    />
                  ) : sprint.resources.Config}
                </td>
                <td className="px-2 py-1 border-b">
                  {sprint.capacity.Config.toFixed(1)}
                </td>
                <td className="px-2 py-1 border-b">
                  {sprint.isEditable ? (
                    <input
                      type="number"
                      className="w-16 p-1 border rounded"
                      value={sprint.allocated.Config}
                      onChange={(e) => updateSprintCapacity(sprint.sprintNumber, 'Config', 'allocated', Number(e.target.value))}
                      min="0"
                    />
                  ) : sprint.allocated.Config}
                </td>
                <td className={`px-2 py-1 border-b ${
                  (sprint.allocated.Config / sprint.capacity.Config) * 100 > 100 ? 'bg-red-100 text-red-800 font-semibold' : 'bg-blue-50'
                }`}>
                  {((sprint.allocated.Config / (sprint.capacity.Config || 0.001)) * 100).toFixed(1)}%
                </td>
                
                {/* QA resources, capacity and allocation */}
                <td className="px-2 py-1 border-b">
                  {sprint.isEditable ? (
                    <input
                      type="number"
                      className="w-12 p-1 border rounded"
                      value={sprint.resources.QA}
                      onChange={(e) => updateSprintCapacity(sprint.sprintNumber, 'QA', 'resources', Number(e.target.value))}
                      min="0"
                    />
                  ) : sprint.resources.QA}
                </td>
                <td className="px-2 py-1 border-b">
                  {sprint.capacity.QA.toFixed(1)}
                </td>
                <td className="px-2 py-1 border-b">
                  {sprint.isEditable ? (
                    <input
                      type="number"
                      className="w-16 p-1 border rounded"
                      value={sprint.allocated.QA}
                      onChange={(e) => updateSprintCapacity(sprint.sprintNumber, 'QA', 'allocated', Number(e.target.value))}
                      min="0"
                    />
                  ) : sprint.allocated.QA}
                </td>
                <td className={`px-2 py-1 border-b ${
                  (sprint.allocated.QA / sprint.capacity.QA) * 100 > 100 ? 'bg-red-100 text-red-800 font-semibold' : 'bg-blue-50'
                }`}>
                  {((sprint.allocated.QA / (sprint.capacity.QA || 0.001)) * 100).toFixed(1)}%
                </td>
                
                {/* Actions */}
                <td className="px-2 py-1 border-b">
                  <button
                    className={`px-2 py-1 text-xs rounded ${sprint.isEditable ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}
                    onClick={() => toggleSprintEdit(sprint.sprintNumber)}
                  >
                    {sprint.isEditable ? 'Save' : 'Edit'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4">
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <h3 className="font-medium text-blue-800 mb-2">Baseline Sprint (Sprint {projectParams.baselineSprint}) Capacity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-semibold mb-1">Business Analysts</h4>
              <div className="text-sm text-gray-700">
                <div>Capacity: {results.capacityDetails?.capacity?.BA?.toFixed(1) || 0} user stories</div>
                <div>Allocated: {results.capacityDetails?.allocated?.BA?.toFixed(1) || 0} user stories</div>
                <div>Available: {results.capacityDetails?.available?.BA?.toFixed(1) || 0} user stories</div>
                <div>Utilization: {results.capacityDetails?.utilization?.BA?.toFixed(1) || 0}%</div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">Configurators</h4>
              <div className="text-sm text-gray-700">
                <div>Capacity: {results.capacityDetails?.capacity?.Config?.toFixed(1) || 0} user stories</div>
                <div>Allocated: {results.capacityDetails?.allocated?.Config?.toFixed(1) || 0} user stories</div>
                <div>Available: {results.capacityDetails?.available?.Config?.toFixed(1) || 0} user stories</div>
                <div>Utilization: {results.capacityDetails?.utilization?.Config?.toFixed(1) || 0}%</div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-1">QA Team</h4>
              <div className="text-sm text-gray-700">
                <div>Capacity: {results.capacityDetails?.capacity?.QA?.toFixed(1) || 0} user stories</div>
                <div>Allocated: {results.capacityDetails?.allocated?.QA?.toFixed(1) || 0} user stories</div>
                <div>Available: {results.capacityDetails?.available?.QA?.toFixed(1) || 0} user stories</div>
                <div>Utilization: {results.capacityDetails?.utilization?.QA?.toFixed(1) || 0}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SprintCapacityTable;