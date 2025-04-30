import { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { assessCRRisk } from '../utils/riskAssessmentUtils';

/**
 * Custom hook for managing risk assessment state and calculations
 * @returns {Object} Risk assessment state and functions
 */
export const useRiskAssessment = () => {
  const { state, dispatch, ACTION_TYPES } = useConfig();
  const { 
    crInputs, 
    projectParams, 
    sprintCapacities, 
    teamResources,
    riskAssessment,
    riskHistory
  } = state;
  
  // Calculate risk assessment when inputs change
  useEffect(() => {
    if (sprintCapacities.length > 0 && crInputs.length > 0) {
      calculateAndUpdateRiskAssessment();
    }
  }, [crInputs, projectParams, sprintCapacities, teamResources]);
  
  /**
   * Calculate and update risk assessment
   */
  const calculateAndUpdateRiskAssessment = () => {
    const assessment = assessCRRisk(crInputs, projectParams, sprintCapacities, teamResources);
    
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
  
  /**
   * Clear risk history
   */
  const clearRiskHistory = () => {
    dispatch({
      type: ACTION_TYPES.SET_RISK_HISTORY,
      payload: []
    });
  };
  
  /**
   * Calculate risk scores for a different set of CRs without updating state
   * Useful for what-if scenarios
   * @param {Array} alternativeCRs - Alternative set of CRs to assess
   * @returns {Object} Risk assessment results
   */
  const calculateAlternativeRiskScenario = (alternativeCRs) => {
    return assessCRRisk(alternativeCRs, projectParams, sprintCapacities, teamResources);
  };
  
  /**
   * Generate risk reduction recommendations
   * @returns {Array} Array of recommended actions to reduce risk
   */
  const generateRiskReductionRecommendations = () => {
    if (!riskAssessment) return [];
    
    // Start with the mitigation suggestions from the risk assessment
    const recommendations = [...riskAssessment.mitigationSuggestions];
    
    // Add specific recommendations based on risk components
    const { riskComponents } = riskAssessment;
    
    // If capacity risk is high, add specific recommendations
    if (riskComponents.capacityRisk.score > 0.75) {
      const criticalTeam = riskComponents.capacityRisk.details.criticalTeam;
      
      if (criticalTeam) {
        recommendations.push({
          category: 'Capacity',
          risk: riskComponents.capacityRisk.level,
          suggestion: `Consider adding temporary contractors to the ${criticalTeam} team.`,
          priority: 'High'
        });
      }
    }
    
    // If estimation risk is high due to large CRs, recommend breaking them down
    if (riskComponents.estimationRisk.score > 0.6 && 
        riskComponents.estimationRisk.details.largeCRs.length > 0) {
      
      const largeCRIds = riskComponents.estimationRisk.details.largeCRs;
      const largeCRs = crInputs.filter(cr => largeCRIds.includes(cr.id));
      
      if (largeCRs.length > 0) {
        const largestCR = largeCRs.reduce((max, cr) => {
          const total = cr.BAHours + cr.ConfigHours + cr.QAHours;
          return total > (max.BAHours + max.ConfigHours + max.QAHours) ? cr : max;
        }, largeCRs[0]);
        
        recommendations.push({
          category: 'Estimation',
          risk: riskComponents.estimationRisk.level,
          suggestion: `Break down "${largestCR.name}" (${largestCR.BAHours + largestCR.ConfigHours + largestCR.QAHours} hours) into smaller CRs.`,
          priority: 'High'
        });
      }
    }
    
    return recommendations;
  };
  
  return {
    riskAssessment,
    riskHistory,
    calculateAndUpdateRiskAssessment,
    clearRiskHistory,
    calculateAlternativeRiskScenario,
    generateRiskReductionRecommendations
  };
};

export default useRiskAssessment;