import React, { useState } from 'react';
import { getRiskColor } from 'utils/riskAssessmentUtils';
import RiskBreakdown from './RiskBreakdown';
import MitigationSuggestions from './MitigationSuggestions';

/**
 * Risk Assessment Panel Component
 * Displays overall risk assessment information and details
 */
const RiskAssessmentPanel = ({ riskAssessment }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'breakdown', 'mitigation'
  
  if (!riskAssessment) return <div>Loading risk assessment...</div>;
  
  const { overallRiskScore, riskLevel, riskComponents, mitigationSuggestions } = riskAssessment;
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">CR Risk Assessment</h3>
      
      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'breakdown'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Risk Breakdown
          </button>
          <button
            onClick={() => setActiveTab('mitigation')}
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === 'mitigation'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mitigation
          </button>
        </nav>
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* Overall Risk Score */}
          <div className="mb-6 text-center">
            <div className="inline-block w-32 h-32 rounded-full border-8" 
                style={{ borderColor: getRiskColor(riskLevel) }}>
              <div className="flex items-center justify-center h-full">
                <div>
                  <div className="text-3xl font-bold">{Math.round(overallRiskScore.score * 100)}</div>
                  <div className="text-sm font-medium" style={{ color: getRiskColor(riskLevel) }}>
                    {riskLevel} Risk
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Primary Risk Driver: {overallRiskScore.primaryRiskDriver}
            </div>
          </div>
          
          {/* Risk Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded border">
              <h4 className="font-medium mb-1">Capacity Risk</h4>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: getRiskColor(riskComponents.capacityRisk.level) }}></div>
                <span className="font-medium">{riskComponents.capacityRisk.level}</span>
                <span className="ml-1 text-sm">({Math.round(riskComponents.capacityRisk.score * 100)})</span>
              </div>
              <p className="text-xs mt-1 text-gray-600">
                {riskComponents.capacityRisk.details.criticalTeam 
                  ? `${riskComponents.capacityRisk.details.criticalTeam} is the most constrained team` 
                  : 'Team capacity utilization risk'}
              </p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded border">
              <h4 className="font-medium mb-1">Complexity Risk</h4>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: getRiskColor(riskComponents.complexityRisk.level) }}></div>
                <span className="font-medium">{riskComponents.complexityRisk.level}</span>
                <span className="ml-1 text-sm">({Math.round(riskComponents.complexityRisk.score * 100)})</span>
              </div>
              <p className="text-xs mt-1 text-gray-600">
                {riskComponents.complexityRisk.details.totalEffort 
                  ? `${riskComponents.complexityRisk.details.totalEffort.toFixed(0)} total hours across ${riskComponents.complexityRisk.details.crCount} CRs` 
                  : 'Technical complexity risk'}
              </p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded border">
              <h4 className="font-medium mb-1">Estimation Risk</h4>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: getRiskColor(riskComponents.estimationRisk.level) }}></div>
                <span className="font-medium">{riskComponents.estimationRisk.level}</span>
                <span className="ml-1 text-sm">({Math.round(riskComponents.estimationRisk.score * 100)})</span>
              </div>
              <p className="text-xs mt-1 text-gray-600">
                {(riskComponents.estimationRisk.details.largeCRs?.length > 0) 
                  ? `${riskComponents.estimationRisk.details.largeCRs.length} large CRs identified` 
                  : 'Estimation uncertainty risk'}
              </p>
            </div>
          </div>
          
          {/* Top Mitigations */}
          {mitigationSuggestions && mitigationSuggestions.length > 0 && (
            <div>
              <h4 className="text-lg font-medium mb-2">Top Mitigation Actions</h4>
              <div className="space-y-2">
                {mitigationSuggestions
                  .filter(s => s.priority === 'High')
                  .slice(0, 2)
                  .map((suggestion, index) => (
                    <div key={index} className="p-2 border-l-4 bg-gray-50" 
                        style={{ borderColor: getRiskColor(suggestion.risk) }}>
                      <div className="flex items-start">
                        <span className="w-20 text-xs font-medium px-2 py-1 rounded mr-2"
                              style={{ 
                                backgroundColor: getRiskColor(suggestion.risk),
                                color: '#fff'
                              }}>
                          {suggestion.category}
                        </span>
                        <span className="flex-1 text-sm">{suggestion.suggestion}</span>
                      </div>
                    </div>
                ))}
                
                {mitigationSuggestions.length > 2 && (
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                    onClick={() => setActiveTab('mitigation')}
                  >
                    View all {mitigationSuggestions.length} suggestions →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Risk Breakdown Tab */}
      {activeTab === 'breakdown' && (
        <RiskBreakdown riskComponents={riskComponents} />
      )}
      
      {/* Mitigation Tab */}
      {activeTab === 'mitigation' && (
        <MitigationSuggestions mitigationSuggestions={mitigationSuggestions} />
      )}
    </div>
  );
};

export default RiskAssessmentPanel;