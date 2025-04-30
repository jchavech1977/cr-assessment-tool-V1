import React from 'react';
import { getRiskColor } from 'utils/riskAssessmentUtils';

/**
 * Risk Breakdown Component
 * Displays detailed breakdown of all risk components
 */
const RiskBreakdown = ({ riskComponents }) => {
  if (!riskComponents) return <div>No risk assessment data available</div>;
  
  return (
    <div className="space-y-6">
      {/* Capacity Risk Detail */}
      <div>
        <h4 className="font-medium mb-2 flex items-center">
          <span className="w-3 h-3 rounded-full mr-1" 
                style={{ backgroundColor: getRiskColor(riskComponents.capacityRisk.level) }}></span>
          Capacity Risk
          <span className="ml-2 text-sm px-2 py-0.5 rounded" 
                style={{ backgroundColor: getRiskColor(riskComponents.capacityRisk.level), color: '#fff' }}>
            {riskComponents.capacityRisk.level}
          </span>
        </h4>
        
        <div className="p-3 bg-gray-50 rounded border">
          <div className="mb-3">
            <p className="text-sm mb-1">Current utilization for each team based on available capacity:</p>
            <div className="space-y-2">
              {Object.entries(riskComponents.capacityRisk.details.teamUtilization).map(([team, utilization]) => (
                <div key={team} className="flex items-center">
                  <span className="w-16 text-sm font-medium">{team}:</span>
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${Math.min(100, utilization * 100)}%`,
                        backgroundColor: utilization > 1 ? '#F44336' : '#4CAF50'
                      }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm">
                    {(utilization * 100).toFixed(1)}%
                    {utilization > 1 && <span className="text-red-600"> (Exceeds Capacity)</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium mb-1">Stories Needed</h5>
              <ul className="text-sm list-disc list-inside">
                <li>BA: {riskComponents.capacityRisk.details.storiesNeeded.BA.toFixed(2)} stories</li>
                <li>Config: {riskComponents.capacityRisk.details.storiesNeeded.Config.toFixed(2)} stories</li>
                <li>QA: {riskComponents.capacityRisk.details.storiesNeeded.QA.toFixed(2)} stories</li>
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-medium mb-1">Available Capacity</h5>
              <ul className="text-sm list-disc list-inside">
                <li>BA: {riskComponents.capacityRisk.details.availableCapacity.BA.toFixed(2)} stories</li>
                <li>Config: {riskComponents.capacityRisk.details.availableCapacity.Config.toFixed(2)} stories</li>
                <li>QA: {riskComponents.capacityRisk.details.availableCapacity.QA.toFixed(2)} stories</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-blue-50 rounded">
            <p className="text-sm">
              <span className="font-medium">Critical Team: </span>
              {riskComponents.capacityRisk.details.criticalTeam || 'None'} 
              {riskComponents.capacityRisk.details.criticalTeam && (
                <span> (Risk Score: {(riskComponents.capacityRisk.details.teamRiskScores[riskComponents.capacityRisk.details.criticalTeam] * 100).toFixed(0)})</span>
              )}
            </p>
          </div>
        </div>
      </div>
      
      {/* Estimation Risk Detail */}
      <div>
        <h4 className="font-medium mb-2 flex items-center">
          <span className="w-3 h-3 rounded-full mr-1" 
                style={{ backgroundColor: getRiskColor(riskComponents.estimationRisk.level) }}></span>
          Estimation Risk
          <span className="ml-2 text-sm px-2 py-0.5 rounded" 
                style={{ backgroundColor: getRiskColor(riskComponents.estimationRisk.level), color: '#fff' }}>
            {riskComponents.estimationRisk.level}
          </span>
        </h4>
        
        <div className="p-3 bg-gray-50 rounded border">
          <div className="mb-3">
            <p className="text-sm mb-1">Estimation risk factors:</p>
            <div className="space-y-2">
              {Object.entries(riskComponents.estimationRisk.details.riskFactors).map(([factor, score]) => (
                <div key={factor} className="flex items-center">
                  <span className="w-32 text-sm font-medium">
                    {factor === 'largeSize' ? 'Large CRs' : 
                     factor === 'missingDetails' ? 'Missing Details' :
                     factor === 'unbalancedEffort' ? 'Unbalanced Effort' :
                     factor === 'newCrType' ? 'New CR Types' : factor}:
                  </span>
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${score * 100}%`,
                        backgroundColor: score > 0.5 ? '#FF9800' : '#4CAF50'
                      }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm">{(score * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium mb-1">Large CRs</h5>
              <p className="text-sm">
                {riskComponents.estimationRisk.details.largeCRs.length > 0 ?
                  `${riskComponents.estimationRisk.details.largeCRs.length} CRs with >100 hours for at least one team` :
                  'No large CRs detected'
                }
              </p>
            </div>
            <div>
              <h5 className="text-sm font-medium mb-1">CRs with Missing Details</h5>
              <p className="text-sm">
                {riskComponents.estimationRisk.details.incompleteCRs.length > 0 ?
                  `${riskComponents.estimationRisk.details.incompleteCRs.length} CRs with zero hours for at least one team` :
                  'No CRs with missing team estimates'
                }
              </p>
            </div>
          </div>
          
          <div className="mt-3">
            <h5 className="text-sm font-medium mb-1">Unbalanced Effort CRs</h5>
            <p className="text-sm">
              {riskComponents.estimationRisk.details.unbalancedCRs.length > 0 ?
                `${riskComponents.estimationRisk.details.unbalancedCRs.length} CRs with unusual effort distribution between teams` :
                'No CRs with unusual effort distribution'
              }
            </p>
          </div>
        </div>
      </div>
      
      {/* Complexity Risk Detail */}
      <div>
        <h4 className="font-medium mb-2 flex items-center">
          <span className="w-3 h-3 rounded-full mr-1" 
                style={{ backgroundColor: getRiskColor(riskComponents.complexityRisk.level) }}></span>
          Complexity Risk
          <span className="ml-2 text-sm px-2 py-0.5 rounded" 
                style={{ backgroundColor: getRiskColor(riskComponents.complexityRisk.level), color: '#fff' }}>
            {riskComponents.complexityRisk.level}
          </span>
        </h4>
        
        <div className="p-3 bg-gray-50 rounded border">
          <div className="mb-3">
            <p className="text-sm mb-1">Complexity factors:</p>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-32 text-sm font-medium">Size Complexity:</span>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${riskComponents.complexityRisk.details.sizeComplexityScore * 100}%`,
                      backgroundColor: riskComponents.complexityRisk.details.sizeComplexityScore > 0.5 ? '#FF9800' : '#4CAF50'
                    }}
                  ></div>
                </div>
                <span className="ml-2 text-sm">{(riskComponents.complexityRisk.details.sizeComplexityScore * 100).toFixed(0)}%</span>
              </div>
              
              <div className="flex items-center">
                <span className="w-32 text-sm font-medium">Integration:</span>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${riskComponents.complexityRisk.details.integrationComplexityScore * 100}%`,
                      backgroundColor: riskComponents.complexityRisk.details.integrationComplexityScore > 0.5 ? '#FF9800' : '#4CAF50'
                    }}
                  ></div>
                </div>
                <span className="ml-2 text-sm">{(riskComponents.complexityRisk.details.integrationComplexityScore * 100).toFixed(0)}%</span>
              </div>
              
              <div className="flex items-center">
                <span className="w-32 text-sm font-medium">Coordination:</span>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${riskComponents.complexityRisk.details.coordinationComplexityScore * 100}%`,
                      backgroundColor: riskComponents.complexityRisk.details.coordinationComplexityScore > 0.5 ? '#FF9800' : '#4CAF50'
                    }}
                  ></div>
                </div>
                <span className="ml-2 text-sm">{(riskComponents.complexityRisk.details.coordinationComplexityScore * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium mb-1">Total Effort</h5>
              <p className="text-sm">{riskComponents.complexityRisk.details.totalEffort.toFixed(0)} total hours</p>
            </div>
            <div>
              <h5 className="text-sm font-medium mb-1">Number of CRs</h5>
              <p className="text-sm">{riskComponents.complexityRisk.details.crCount} change requests</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Resource and Dependency Risk (combined in smaller section) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2 flex items-center">
            <span className="w-3 h-3 rounded-full mr-1" 
                  style={{ backgroundColor: getRiskColor(riskComponents.resourceRisk.level) }}></span>
            Resource Risk
            <span className="ml-2 text-sm px-2 py-0.5 rounded" 
                  style={{ backgroundColor: getRiskColor(riskComponents.resourceRisk.level), color: '#fff' }}>
              {riskComponents.resourceRisk.level}
            </span>
          </h4>
          
          <div className="p-3 bg-gray-50 rounded border">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Project Completion:</span>
                <span className="text-sm">{(riskComponents.resourceRisk.details.projectCompletionRatio * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Late Project Risk:</span>
                <span className="text-sm">{(riskComponents.resourceRisk.details.lateProjectRisk * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Team Size Risk:</span>
                <span className="text-sm">
                  BA: {(riskComponents.resourceRisk.details.teamSizeRisk.BA * 100).toFixed(0)}%,
                  Config: {(riskComponents.resourceRisk.details.teamSizeRisk.Config * 100).toFixed(0)}%,
                  QA: {(riskComponents.resourceRisk.details.teamSizeRisk.QA * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2 flex items-center">
            <span className="w-3 h-3 rounded-full mr-1" 
                  style={{ backgroundColor: getRiskColor(riskComponents.dependencyRisk.level) }}></span>
            Dependency Risk
            <span className="ml-2 text-sm px-2 py-0.5 rounded" 
                  style={{ backgroundColor: getRiskColor(riskComponents.dependencyRisk.level), color: '#fff' }}>
              {riskComponents.dependencyRisk.level}
            </span>
          </h4>
          
          <div className="p-3 bg-gray-50 rounded border">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Number of CRs:</span>
                <span className="text-sm">{riskComponents.dependencyRisk.details.crCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">CR Count Risk:</span>
                <span className="text-sm">{(riskComponents.dependencyRisk.details.crCountRisk * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Known Dependencies:</span>
                <span className="text-sm">Not tracked</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskBreakdown;