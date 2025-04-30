import React from 'react';
import { useConfig } from '../../../context/ConfigContext';
import { formatDate } from '../../../utils/dateUtils';

/**
 * Timeline Impact Component
 * Displays the impact of CRs on project timeline
 */
const TimelineImpact = () => {
  const { state } = useConfig();
  const { 
    results, 
    projectParams 
  } = state;
  
  // Calculate days difference between dates
  const getDaysDifference = (date1, date2) => {
    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  // Get timeline extension percentage
  const getExtensionPercentage = () => {
    if (!results.additionalSprints) return 0;
    return (results.additionalSprints / projectParams.totalSprints) * 100;
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
  const daysDifference = getDaysDifference(projectParams.deadline, results.newDeadline);
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Timeline Impact</h3>
      <div className="bg-white p-3 rounded shadow">
        <div className="mb-3">
          <span className={`px-2 py-1 rounded ${timelineStatus.color}`}>
            {timelineStatus.status}
          </span>
        </div>
        
        <div className="mb-2">
          <span className="font-medium">Additional Sprints Required:</span> {results.additionalSprints.toFixed(2)} sprints
        </div>
        <div className="mb-2">
          <span className="font-medium">Additional Days Required:</span> {results.additionalDays.toFixed(1)} days
        </div>
        <div className="mb-2">
          <span className="font-medium">Original Deadline:</span> {formatDate(projectParams.deadline)}
        </div>
        <div className="mb-4">
          <span className="font-medium">New Projected Deadline:</span> <span className={daysDifference > 0 ? 'text-red-600 font-medium' : ''}>{formatDate(results.newDeadline)}</span>
        </div>
        
        {/* Visual Timeline Representation */}
        <div className="relative h-16 bg-gray-100 rounded mb-3">
          {/* Original Timeline */}
          <div className="absolute top-2 left-0 right-0 h-6 bg-blue-500 rounded">
            <div className="text-xs text-white text-center leading-6">
              Original Timeline
            </div>
          </div>
          
          {/* Extension */}
          {results.additionalSprints > 0 && (
            <div 
              className="absolute top-2 h-6 bg-red-500 rounded-r" 
              style={{ 
                left: '100%',
                width: `${getExtensionPercentage()}%`,
                transform: 'translateX(-100%)'
              }}
            >
              <div className="text-xs text-white text-center leading-6">
                Extension
              </div>
            </div>
          )}
          
          {/* Timeline markers */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs">
            <div>Start</div>
            <div>Current Sprint</div>
            <div>Original End</div>
            {results.additionalSprints > 0 && (
              <div style={{ marginLeft: `${getExtensionPercentage()}%` }}>
                New End
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
          <p>
            {timelineStatus.message}. The critical path is determined by the <strong>{results.criticalPath}</strong> team's capacity.
          </p>
          {results.additionalDays > 0 && (
            <p className="mt-1 italic">
              Consider adding resources or adjusting scope to maintain the original timeline.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineImpact;