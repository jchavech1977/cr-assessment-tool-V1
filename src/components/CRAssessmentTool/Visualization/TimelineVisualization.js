import React from 'react';
import { useConfig } from 'context/ConfigContext';
import { formatDate } from 'utils/calculationUtils';


/**
 * Timeline Visualization Component
 * Displays the impact of CRs on project timeline
 */
const TimelineVisualization = () => {
  const { state } = useConfig();
  const { projectParams, results } = state;
  
  // Format date as MM/DD/YYYY
  const formatDate = (date) => {
    if (!date || !(date instanceof Date)) return '';
    
    // Ensure we're working with a copy of the date to avoid mutation issues
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  // Calculate percentage positions for timeline
  const getPercentage = (sprint, totalSprints) => {
    return (sprint / totalSprints) * 100;
  };
  
  // Calculate extended timeline
  const totalSprints = projectParams.totalSprints;
  const extendedSprints = totalSprints + results.additionalSprints;
  
  // Calculate percentages for timeline markers
  const baselinePercentage = getPercentage(projectParams.baselineSprint, totalSprints);
  const currentPercentage = getPercentage(projectParams.currentSprint, totalSprints);
  
  // Calculate extension as percentage
  const extensionPercentage = (results.additionalSprints / totalSprints) * 100;
  
  // Get team-specific data
  const getTeamUtilization = (team) => {
    if (team === "Business Analysts") return results.teamImpacts.BA.currentSprint.toFixed(1);
    if (team === "Configurators") return results.teamImpacts.Config.currentSprint.toFixed(1);
    if (team === "QA Team") return results.teamImpacts.QA.currentSprint.toFixed(1);
    return "0.0";
  };

  const getTeamStories = (team) => {
    if (team === "Business Analysts") return results.storiesToCapacity.BA.stories.toFixed(2);
    if (team === "Configurators") return results.storiesToCapacity.Config.stories.toFixed(2);
    if (team === "QA Team") return results.storiesToCapacity.QA.stories.toFixed(2);
    return "0.00";
  };

  const getTeamAvailableCapacity = (team) => {
    if (team === "Business Analysts") return results.capacityDetails.available.BA.toFixed(1);
    if (team === "Configurators") return results.capacityDetails.available.Config.toFixed(1);
    if (team === "QA Team") return results.capacityDetails.available.QA.toFixed(1);
    return "0.0";
  };

  const getTeamCapacityShortfall = (team) => {
    const stories = team === "Business Analysts" ? results.storiesToCapacity.BA.stories :
                   team === "Configurators" ? results.storiesToCapacity.Config.stories :
                   team === "QA Team" ? results.storiesToCapacity.QA.stories : 0;
    
    const available = team === "Business Analysts" ? results.capacityDetails.available.BA :
                     team === "Configurators" ? results.capacityDetails.available.Config :
                     team === "QA Team" ? results.capacityDetails.available.QA : 0;
    
    return (stories - available > 0) ? (stories - available).toFixed(1) : "0.0";
  };
  
  // Get timeline status
  const getTimelineStatus = () => {
    if (results.additionalDays <= 0) {
      return {
        status: 'On Time',
        color: 'bg-green-100 text-green-800',
        message: 'No timeline impact'
      };
    } else if (results.additionalDays <= 5) {
      return {
        status: 'Minor Delay',
        color: 'bg-blue-100 text-blue-800',
        message: 'Minimal timeline impact'
      };
    } else if (results.additionalDays <= 20) {
      return {
        status: 'Moderate Delay',
        color: 'bg-yellow-100 text-yellow-800',
        message: 'Noticeable timeline impact'
      };
    } else if (results.additionalDays <= 40) {
      return {
        status: 'Significant Delay',
        color: 'bg-orange-100 text-orange-800',
        message: 'Substantial timeline impact'
      };
    } else {
      return {
        status: 'Major Delay',
        color: 'bg-red-100 text-red-800',
        message: 'Critical timeline impact'
      };
    }
  };
  
  const timelineStatus = getTimelineStatus();
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-3">Project Timeline Impact</h3>
      <div className="p-4 bg-white rounded shadow">
        {/* Timeline Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-medium">Original Deadline: {formatDate(projectParams.deadline)}</div>
          <div className="text-sm font-medium">
            <span className={results.additionalDays > 0 ? 'text-orange-600 font-bold' : ''}>
              New Deadline: {formatDate(results.newDeadline)}
            </span>
          </div>
        </div>
        
        {/* Visual Timeline */}
        <div className="relative h-28 bg-gray-100 rounded mb-6">
          {/* Base timeline bar */}
          <div className="absolute top-4 left-0 right-0 h-8 flex">
            {/* Past Sprints */}
            <div 
              className="bg-gray-300 h-full rounded-l" 
              style={{ width: `${getPercentage(projectParams.currentSprint - 1, totalSprints)}%` }}
            />
            
            {/* Current Sprint */}
            <div 
              className="bg-blue-500 h-full" 
              style={{ width: `${getPercentage(1, totalSprints)}%` }}
            >
              <div className="text-xs text-white text-center leading-8">
                Sprint {projectParams.currentSprint}
              </div>
            </div>
            
            {/* Sprints to Baseline (if current is before baseline) */}
            {projectParams.currentSprint < projectParams.baselineSprint && (
              <div 
                className="bg-gray-400 h-full" 
                style={{ 
                  width: `${getPercentage(projectParams.baselineSprint - projectParams.currentSprint, totalSprints)}%` 
                }}
              />
            )}
            
            {/* Baseline to End */}
            <div 
              className="bg-green-500 h-full" 
              style={{ 
                width: `${getPercentage(totalSprints - Math.max(projectParams.currentSprint, projectParams.baselineSprint) + 1, totalSprints)}%` 
              }}
            >
              <div className="text-xs text-white text-center leading-8">
                Remaining Sprints
              </div>
            </div>
          </div>
          
          {/* Baseline Sprint Marker */}
          <div 
            className="absolute top-0 bottom-0 border-l-2 border-blue-700 border-dashed"
            style={{ left: `${baselinePercentage}%` }}
          >
            <div className="absolute top-0 -left-14 bg-blue-700 text-white text-xs px-1 rounded">
              Baseline
            </div>
          </div>
          
          {/* Timeline extension */}
          {results.additionalSprints > 0 && (
            <div 
              className="absolute top-4 h-8 bg-red-500 rounded-r" 
              style={{ 
                left: `100%`,
                width: `${extensionPercentage}%`
              }}
            >
              <div className="text-xs text-white text-center leading-8">
                Extension (+{Math.ceil(results.additionalSprints)} sprints)
              </div>
            </div>
          )}
          
          {/* Timeline markers */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs">
            <div>Sprint 1</div>
            <div>Sprint {projectParams.baselineSprint} (Baseline)</div>
            <div>Sprint {projectParams.totalSprints}</div>
            {results.additionalSprints > 0 && (
              <div style={{ position: 'absolute', right: `-${extensionPercentage}%` }}>
                Sprint {Math.ceil(projectParams.totalSprints + results.additionalSprints)}
              </div>
            )}
          </div>
        </div>
        
        {/* Timeline Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Impact Summary Box */}
          <div className="p-4 border border-gray-200 bg-gray-50 rounded">
            <h4 className="font-medium mb-2">Timeline Impact Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Additional Sprints:</span>
                <span className={`font-medium ${results.additionalSprints > 0 ? 'text-orange-600' : ''}`}>
                  {results.additionalSprints.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Additional Working Days:</span>
                <span className={`font-medium ${results.additionalDays > 0 ? 'text-orange-600' : ''}`}>
                  {results.additionalDays.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Original Deadline:</span>
                <span className="font-medium">
                  {formatDate(projectParams.deadline)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">New Projected Deadline:</span>
                <span className={`font-medium ${results.additionalDays > 0 ? 'text-orange-600' : ''}`}>
                  {formatDate(results.newDeadline)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Status:</span>
                <span className={`font-medium px-2 py-0.5 rounded text-xs ${timelineStatus.color}`}>
                  {timelineStatus.status}
                </span>
              </div>
            </div>
          </div>
          
          {/* Critical Path Details */}
          <div className="p-4 border border-gray-200 bg-gray-50 rounded">
            <h4 className="font-medium mb-2">Critical Path Details</h4>
            <p className="text-sm mb-3">
              The <span className="font-medium">{results.criticalPath}</span> is the most constrained team 
              and determines the timeline extension. This team will require the most additional sprint capacity.
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Team Utilization:</span>
                <span className="font-medium">
                  {getTeamUtilization(results.criticalPath)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Stories Needed:</span>
                <span className="font-medium">
                  {getTeamStories(results.criticalPath)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Available Capacity:</span>
                <span className="font-medium">
                  {getTeamAvailableCapacity(results.criticalPath)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Capacity Shortfall:</span>
                <span className={`font-medium ${getTeamCapacityShortfall(results.criticalPath) > 0 ? 'text-red-600' : ''}`}>
                  {getTeamCapacityShortfall(results.criticalPath)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Deadline Adjustment Recommendations */}
        {results.additionalSprints > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-medium mb-2 text-blue-800">Timeline Adjustment Recommendations</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-900">
              <li>Consider extending the project deadline by {Math.ceil(results.additionalSprints)} sprints ({Math.ceil(results.additionalDays)} days)</li>
              <li>Alternatively, increasing {results.criticalPath} capacity could reduce the timeline impact</li>
              <li>Another option is to reduce the scope of the change requests to fit within the original timeline</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineVisualization;