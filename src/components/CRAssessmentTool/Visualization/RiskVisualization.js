import React, { useState, useEffect } from 'react';
import { useConfig } from 'context/ConfigContext';
import { assessCRRisk, getRiskColor } from 'utils/riskAssessmentUtils';
import RiskAssessmentPanel from '../RiskAssessment/RiskAssessmentPanel';
import RiskTrend from '../RiskAssessment/RiskTrend';

/**
 * Risk Visualization Component
 * Displays risk assessment information with visualizations
 */
const RiskVisualization = () => {
  const { state, dispatch, ACTION_TYPES } = useConfig();
  const { 
    crInputs, 
    projectParams, 
    sprintCapacities, 
    teamResources,
    riskHistory
  } = state;
  
  const [riskAssessment, setRiskAssessment] = useState(null);
  
  // Calculate risk assessment when inputs change
  useEffect(() => {
    if (sprintCapacities.length > 0 && crInputs.length > 0) {
      calculateRiskAssessment();
    }
  }, [crInputs, projectParams, sprintCapacities, teamResources]);
  
  // Calculate risk assessment
  const calculateRiskAssessment = () => {
    const assessment = assessCRRisk(crInputs, projectParams, sprintCapacities, teamResources);
    setRiskAssessment(assessment);
    
    dispatch({
      type: ACTION_TYPES.SET_RISK_ASSESSMENT,
      payload: assessment
    });
    
    // Add to history when significant changes occur
    if (!riskHistory.length || 
        Math.abs(assessment.overallRiskScore.score - (riskHistory[riskHistory.length-1]?.overallScore || 0)) > 0.05) {
      const timestamp = new Date();
      
      dispatch({
        type: ACTION_TYPES.ADD_RISK_HISTORY,
        payload: {
          timestamp,
          overallScore: assessment.overallRiskScore.score,
          riskLevel: assessment.riskLevel,
          componentScores: {
            capacity: assessment.riskComponents.capacityRisk.score,
            estimation: assessment.riskComponents.estimationRisk.score,
            complexity: assessment.riskComponents.complexityRisk.score,
            dependency: assessment.riskComponents.dependencyRisk.score,
            resource: assessment.riskComponents.resourceRisk.score
          }
        }
      });
    }
  };
  
  return (
    <div className="mb-6">
      {riskAssessment ? (
        <>
          <RiskAssessmentPanel riskAssessment={riskAssessment} />
          
          {riskHistory.length > 1 && (
            <div className="mt-6">
              <RiskTrend riskHistory={riskHistory} />
            </div>
          )}
        </>
      ) : (
        <div className="p-6 bg-white rounded shadow text-center text-gray-500">
          Add CR efforts to see risk assessment
        </div>
      )}
    </div>
  );
};

export default RiskVisualization;