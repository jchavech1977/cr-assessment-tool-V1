import React, { useState } from 'react';
import { getRiskColor } from 'utils/riskAssessmentUtils';

/**
 * Mitigation Suggestions Component
 * Displays risk mitigation suggestions with filtering capabilities
 */
const MitigationSuggestions = ({ mitigationSuggestions }) => {
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all', 'high', 'medium'
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  if (!mitigationSuggestions || mitigationSuggestions.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded border text-center">
        <p>No mitigation suggestions available for the current risk assessment.</p>
      </div>
    );
  }
  
  // Get unique categories for filter
  const categories = ['all', ...new Set(mitigationSuggestions.map(suggestion => suggestion.category))];
  
  // Filter suggestions based on selected filters
  const filteredSuggestions = mitigationSuggestions.filter(suggestion => {
    const matchesPriority = priorityFilter === 'all' || suggestion.priority.toLowerCase() === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || suggestion.category === categoryFilter;
    return matchesPriority && matchesCategory;
  });
  
  // Group suggestions by category
  const groupedSuggestions = filteredSuggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.category]) {
      acc[suggestion.category] = [];
    }
    acc[suggestion.category].push(suggestion);
    return acc;
  }, {});
  
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex items-center">
          <span className="text-sm font-medium mr-2">Priority:</span>
          <select
            className="p-1 text-sm border rounded"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
        </div>
        
        <div className="flex items-center ml-4">
          <span className="text-sm font-medium mr-2">Category:</span>
          <select
            className="p-1 text-sm border rounded"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {filteredSuggestions.length === 0 ? (
        <div className="p-4 bg-gray-50 rounded border text-center">
          <p>No suggestions match the selected filters.</p>
        </div>
      ) : (
        <div>
          <div className="mb-2 text-sm text-gray-600">
            Showing {filteredSuggestions.length} of {mitigationSuggestions.length} suggestions
          </div>
          
          {Object.entries(groupedSuggestions).map(([category, suggestions]) => (
            <div key={category} className="mb-4">
              <h4 className="font-medium mb-2">{category} Risk Mitigations</h4>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="p-3 border-l-4 bg-gray-50 rounded-r" 
                    style={{ borderColor: getRiskColor(suggestion.risk) }}
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        <p>{suggestion.suggestion}</p>
                        <div className="mt-1 flex items-center">
                          <span 
                            className="text-xs px-2 py-0.5 rounded mr-2"
                            style={{ backgroundColor: getRiskColor(suggestion.risk), color: 'white' }}
                          >
                            {suggestion.risk} Risk
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            suggestion.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {suggestion.priority} Priority
                          </span>
                        </div>
                      </div>
                      <button className="ml-2 text-blue-600 hover:text-blue-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-1">Implementing Mitigations</h4>
        <p className="text-sm text-blue-900">
          Implementing these suggested mitigations can significantly reduce project risk. 
          Consider discussing these recommendations with project stakeholders and tracking implementation progress.
        </p>
      </div>
    </div>
  );
};

export default MitigationSuggestions;