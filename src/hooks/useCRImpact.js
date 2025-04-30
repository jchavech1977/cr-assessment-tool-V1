import { useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { calculateImpact } from '../utils/calculationUtils';
import { assessCRRisk } from '../utils/riskAssessmentUtils';

export const useCRImpact = () => {
  const { state, dispatch, ACTION_TYPES } = useConfig();
  const { 
    crInputs, 
    projectParams, 
    sprintCapacities, 
    teamResources,
    riskHistory
  } = state;
  
  // Update impact calculations when relevant inputs change
  useEffect(() => {
    if (sprintCapacities.length > 0 && crInputs.length > 0) {
      // Calculate impact
      calculateAndUpdateImpact();
      
      // Calculate risk assessment
      calculateAndUpdateRiskAssessment();
    }
  }, [crInputs, projectParams, sprintCapacities, teamResources]);
  
  // Calculate and update impact data
  const calculateAndUpdateImpact = () => {
    const impactResults = calculateImpact(crInputs, projectParams, sprintCapacities);
    
    dispatch({
      type: ACTION_TYPES.SET_RESULTS,
      payload: impactResults
    });
    
    dispatch({
      type: ACTION_TYPES.SET_UNSAVED_CHANGES,
      payload: true
    });
  };
  
  // Calculate and update risk assessment
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
  
  // Add a new CR
  const addCR = () => {
    dispatch({
      type: ACTION_TYPES.ADD_CR
    });
  };
  
  // Remove a CR
  const removeCR = (id) => {
    dispatch({
      type: ACTION_TYPES.REMOVE_CR,
      payload: id
    });
  };
  
  // Update a CR field
  const updateCR = (id, field, value) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_CR,
      payload: { id, field, value }
    });
  };
  
  // Import CRs from external source
  const importCRs = (newCRs) => {
    // Validate the imported CRs
    const validatedCRs = newCRs.map((cr, index) => ({
      id: index + 1,
      name: cr.name || `CR ${index + 1}`,
      BAHours: Number(cr.BAHours) || 0,
      ConfigHours: Number(cr.ConfigHours) || 0,
      QAHours: Number(cr.QAHours) || 0
    }));
    
    dispatch({
      type: ACTION_TYPES.SET_CR_INPUTS,
      payload: validatedCRs
    });
  };
  
  return {
    crInputs,
    results: state.results,
    riskAssessment: state.riskAssessment,
    addCR,
    removeCR,
    updateCR,
    importCRs,
    calculateAndUpdateImpact,
    calculateAndUpdateRiskAssessment
  };
};