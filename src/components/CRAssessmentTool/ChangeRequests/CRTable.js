import React, { useState } from 'react';
import { useConfig } from 'context/ConfigContext';
import CRImport from './CRImport';

/**
 * Change Request Table Component
 * Manages the list of change requests and their effort estimates
 */
const CRTable = () => {
  const { state, dispatch, ACTION_TYPES } = useConfig();
  const { crInputs } = state;
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Add a new CR
  const addCR = () => {
    dispatch({ type: ACTION_TYPES.ADD_CR });
  };
  
  // Remove a CR
  const removeCR = (id) => {
    dispatch({ 
      type: ACTION_TYPES.REMOVE_CR,
      payload: id
    });
  };
  
  // Handle CR input changes
  const handleCRChange = (id, field, value) => {
    dispatch({ 
      type: ACTION_TYPES.UPDATE_CR,
      payload: { id, field, value }
    });
  };
  
  // Calculate totals
  const totals = {
    BA: crInputs.reduce((sum, cr) => sum + Number(cr.BAHours || 0), 0),
    Config: crInputs.reduce((sum, cr) => sum + Number(cr.ConfigHours || 0), 0),
    QA: crInputs.reduce((sum, cr) => sum + Number(cr.QAHours || 0), 0),
    get total() {
      return this.BA + this.Config + this.QA;
    }
  };
  
  return (
    <div>
      {showImportModal && (
        <CRImport 
          onClose={() => setShowImportModal(false)} 
        />
      )}
      
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="text-sm text-gray-600">
            Total CRs: {crInputs.length}
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => setShowImportModal(true)}
          >
            Import CRs
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={addCR}
          >
            Add CR
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">CR Name</th>
              <th className="px-4 py-2 border-b">BA Hours</th>
              <th className="px-4 py-2 border-b">Config Hours</th>
              <th className="px-4 py-2 border-b">QA Hours</th>
              <th className="px-4 py-2 border-b">Total Hours</th>
              <th className="px-4 py-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {crInputs.map(cr => {
              const totalHours = Number(cr.BAHours || 0) + Number(cr.ConfigHours || 0) + Number(cr.QAHours || 0);
              
              return (
                <tr key={cr.id}>
                  <td className="px-4 py-2 border-b">
                    <input
                      type="text"
                      className="w-full p-1 border rounded"
                      value={cr.name}
                      onChange={(e) => handleCRChange(cr.id, 'name', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-2 border-b">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="w-full p-1 border rounded"
                      value={cr.BAHours}
                      onChange={(e) => handleCRChange(cr.id, 'BAHours', Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-2 border-b">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="w-full p-1 border rounded"
                      value={cr.ConfigHours}
                      onChange={(e) => handleCRChange(cr.id, 'ConfigHours', Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-2 border-b">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="w-full p-1 border rounded"
                      value={cr.QAHours}
                      onChange={(e) => handleCRChange(cr.id, 'QAHours', Number(e.target.value))}
                    />
                  </td>
                  <td className="px-4 py-2 border-b font-medium text-right">
                    {totalHours.toFixed(1)}
                  </td>
                  <td className="px-4 py-2 border-b">
                    <button
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => removeCR(cr.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {/* Summary row */}
            <tr className="bg-gray-50">
              <td className="px-4 py-2 border-b font-medium">Totals</td>
              <td className="px-4 py-2 border-b font-medium text-right">
                {totals.BA.toFixed(1)}
              </td>
              <td className="px-4 py-2 border-b font-medium text-right">
                {totals.Config.toFixed(1)}
              </td>
              <td className="px-4 py-2 border-b font-medium text-right">
                {totals.QA.toFixed(1)}
              </td>
              <td className="px-4 py-2 border-b font-medium text-right">
                {totals.total.toFixed(1)}
              </td>
              <td className="px-4 py-2 border-b"></td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>* Enter effort estimates in hours for each team</p>
        <p>* Hours will be converted to user stories based on standard team ratios (BA: 19hrs/story, Config: 31hrs/story, QA: 24hrs/story)</p>
      </div>
    </div>
  );
};

export default CRTable;