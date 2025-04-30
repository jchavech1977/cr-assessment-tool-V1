import React from 'react';
import { useConfig } from 'context/ConfigContext';
import { formatDate } from 'utils/calculationUtils';
/**
 * Impact Summary Component
 * Displays a summary of the CR impact assessment results
 */
const ImpactSummary = () => {
  const { state } = useConfig();
  const { results } = state;
  
  // Format date as MM/DD/YYYY
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Hours to Stories Conversion Table */}
      <div>
        <h3 className="text-lg font-medium mb-2">Hours to User Stories Conversion</h3>
        <div className="bg-white p-3 rounded shadow mb-6">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-2 py-1">Team</th>
                <th className="text-left px-2 py-1">Hours Required</th>
                <th className="text-left px-2 py-1">Stories Equivalent</th>
                <th className="text-left px-2 py-1">Per-Resource Impact</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-2 py-1">Business Analysts</td>
                <td className="px-2 py-1">{results.storiesToCapacity?.BA?.hours?.toFixed(1) || 0}</td>
                <td className="px-2 py-1">{results.storiesToCapacity?.BA?.stories?.toFixed(2) || 0}</td>
                <td className="px-2 py-1">{results.storiesToCapacity?.BA?.capacityImpact?.toFixed(2) || 0} stories per person</td>
              </tr>
              <tr>
                <td className="px-2 py-1">Configurators</td>
                <td className="px-2 py-1">{results.storiesToCapacity?.Config?.hours?.toFixed(1) || 0}</td>
                <td className="px-2 py-1">{results.storiesToCapacity?.Config?.stories?.toFixed(2) || 0}</td>
                <td className="px-2 py-1">{results.storiesToCapacity?.Config?.capacityImpact?.toFixed(2) || 0} stories per person</td>
              </tr>
              <tr>
                <td className="px-2 py-1">QA Team</td>
                <td className="px-2 py-1">{results.storiesToCapacity?.QA?.hours?.toFixed(1) || 0}</td>
                <td className="px-2 py-1">{results.storiesToCapacity?.QA?.stories?.toFixed(2) || 0}</td>
                <td className="px-2 py-1">{results.storiesToCapacity?.QA?.capacityImpact?.toFixed(2) || 0} stories per person</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-2 text-xs text-gray-500">
            <span>* Hours converted to stories using standard ratios (BA: 19hrs/story, Config: 31hrs/story, QA: 24hrs/story)</span>
          </div>
          <div className="text-xs text-gray-500">
            <span>* Per-Resource Impact shows the workload per person in the team</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Timeline Impact</h3>
          <div className="bg-white p-3 rounded shadow">
            <div className="mb-2">
              <span className="font-medium">Additional Sprints Required:</span> {results.additionalSprints.toFixed(2)} sprints
            </div>
            <div className="mb-2">
              <span className="font-medium">Additional Days Required:</span> {results.additionalDays.toFixed(1)} days
            </div>
            <div className="mb-2">
              <span className="font-medium">Original Deadline:</span> {formatDate(state.projectParams.deadline)}
            </div>
            <div>
              <span className="font-medium">New Projected Deadline:</span> {formatDate(results.newDeadline)}
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Team Workload Impact</h3>
          <div className="bg-white p-3 rounded shadow">
            <div className="mb-3">
              <span className="font-medium">Critical Path Team:</span> {results.criticalPath}
            </div>
            
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-2 py-1">Team</th>
                  <th className="text-left px-2 py-1">Baseline Sprint Impact</th>
                  <th className="text-left px-2 py-1">Total Project Impact</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-2 py-1">Business Analysts</td>
                  <td className={`px-2 py-1 ${results.teamImpacts.BA.currentSprint > 100 ? 'text-red-600 font-semibold' : ''}`}>
                    {results.teamImpacts.BA.currentSprint.toFixed(1)}%
                  </td>
                  <td className="px-2 py-1">{results.teamImpacts.BA.total.toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="px-2 py-1">Configurators</td>
                  <td className={`px-2 py-1 ${results.teamImpacts.Config.currentSprint > 100 ? 'text-red-600 font-semibold' : ''}`}>
                    {results.teamImpacts.Config.currentSprint.toFixed(1)}%
                  </td>
                  <td className="px-2 py-1">{results.teamImpacts.Config.total.toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="px-2 py-1">QA Team</td>
                  <td className={`px-2 py-1 ${results.teamImpacts.QA.currentSprint > 100 ? 'text-red-600 font-semibold' : ''}`}>
                    {results.teamImpacts.QA.currentSprint.toFixed(1)}%
                  </td>
                  <td className="px-2 py-1">{results.teamImpacts.QA.total.toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-2 text-xs text-gray-500">
              <span>* Values over 100% indicate required capacity exceeds available capacity</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Impact Status</h3>
          <div className="bg-white p-3 rounded shadow">
            <div className="mb-2">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded inline-block mb-2">
                Capacity Impact Analysis
              </span>
              <p className="text-sm">
                Based on current inputs, this CR batch would require {results.additionalSprints.toFixed(1)} additional sprints, 
                primarily due to constraints in the {results.criticalPath} team.
              </p>
            </div>
            
            <div className="mt-4">
              <span className="font-medium">Recommendations:</span>
              <ul className="mt-2 text-sm list-disc list-inside">
                <li>Review team allocation in baseline sprint</li>
                <li>Consider resource adjustments for critical path team</li>
                <li>Evaluate CR priority and potential scope reduction</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactSummary;