import React from 'react';
import { useConfig } from '../../../context/ConfigContext';

/**
 * Team Impact Component
 * Displays the impact of CRs on team workloads
 */
const TeamImpact = () => {
  const { state } = useConfig();
  const { 
    results, 
    projectParams 
  } = state;
  
  return (
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
        
        <div className="mt-3">
          <div className="text-sm font-medium mb-1">Capacity Status:</div>
          <div className="space-y-2">
            {renderCapacityStatus('Business Analysts', results.teamImpacts.BA.currentSprint)}
            {renderCapacityStatus('Configurators', results.teamImpacts.Config.currentSprint)}
            {renderCapacityStatus('QA Team', results.teamImpacts.QA.currentSprint)}
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          <p>* Values over 100% indicate required capacity exceeds available capacity</p>
          <p>* Baseline sprint is Sprint {projectParams.baselineSprint}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Render capacity status indicator
 * @param {string} team - Team name
 * @param {number} impact - Impact percentage
 * @returns {JSX.Element} Status indicator
 */
const renderCapacityStatus = (team, impact) => {
  let status, color, message;
  
  if (impact <= 75) {
    status = 'Good';
    color = 'bg-green-100 text-green-800';
    message = 'Sufficient capacity available';
  } else if (impact <= 100) {
    status = 'Warning';
    color = 'bg-yellow-100 text-yellow-800';
    message = 'Limited capacity available';
  } else if (impact <= 150) {
    status = 'Over Capacity';
    color = 'bg-orange-100 text-orange-800';
    message = 'Exceeds available capacity';
  } else {
    status = 'Critical';
    color = 'bg-red-100 text-red-800';
    message = 'Significantly exceeds capacity';
  }
  
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm">{team}:</span>
      <span className={`text-xs px-2 py-1 rounded ${color}`}>
        {status} ({impact.toFixed(1)}%) - {message}
      </span>
    </div>
  );
};

export default TeamImpact;