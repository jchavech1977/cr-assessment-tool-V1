import React, { useState, useRef } from 'react';
import { useConfig } from 'context/ConfigContext';
import Papa from 'papaparse';

/**
 * CR Import Component
 * Allows users to import CRs from CSV files or copy-pasted data
 */
const CRImport = ({ onClose }) => {
  const { dispatch, ACTION_TYPES } = useConfig();
  const fileInputRef = useRef(null);
  
  // Local state
  const [importMethod, setImportMethod] = useState('csv'); // 'csv' or 'paste'
  const [pastedData, setPastedData] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [mappings, setMappings] = useState({
    name: '',
    BAHours: '',
    ConfigHours: '',
    QAHours: ''
  });
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  
  // Expected column names and their possible aliases
  const expectedColumns = {
    name: ['name', 'cr name', 'cr_name', 'change request', 'change_request', 'title', 'description'],
    BAHours: ['ba hours', 'ba_hours', 'bahours', 'business analyst hours', 'business_analyst_hours', 'ba effort', 'ba_effort'],
    ConfigHours: ['config hours', 'config_hours', 'confighours', 'configuration hours', 'configuration_hours', 'config effort', 'config_effort', 'configurator hours'],
    QAHours: ['qa hours', 'qa_hours', 'qahours', 'quality assurance hours', 'qa effort', 'qa_effort', 'test hours', 'testing hours']
  };
  
  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Reset state
    setError('');
    setPreviewData(null);
    
    // Parse CSV file
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`Error parsing CSV: ${results.errors[0].message}`);
          return;
        }
        
        if (results.data.length === 0) {
          setError('No data found in the uploaded file');
          return;
        }
        
        // Generate preview
        processImportedData(results.data);
      },
      error: (error) => {
        setError(`Error reading file: ${error.message}`);
      }
    });
  };
  
  // Handle pasted data
  const handlePastedDataChange = (e) => {
    setPastedData(e.target.value);
    
    // If there's data, try to parse it
    if (e.target.value.trim()) {
      try {
        Papa.parse(e.target.value, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              setError(`Error parsing data: ${results.errors[0].message}`);
              return;
            }
            
            if (results.data.length === 0) {
              setError('No data found in the pasted content');
              return;
            }
            
            // Generate preview
            processImportedData(results.data);
          }
        });
      } catch (error) {
        setError(`Error parsing data: ${error.message}`);
      }
    } else {
      setPreviewData(null);
    }
  };
  
  // Process imported data and detect column mappings
  const processImportedData = (data) => {
    // Get headers from the data
    const headers = Object.keys(data[0]);
    
    // Automatically detect column mappings
    const detectedMappings = { name: '', BAHours: '', ConfigHours: '', QAHours: '' };
    
    // Try to match headers to expected columns
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      
      // Check each expected column
      Object.entries(expectedColumns).forEach(([column, possibleNames]) => {
        if (possibleNames.includes(lowerHeader) && !detectedMappings[column]) {
          detectedMappings[column] = header;
        }
      });
    });
    
    // Update mappings state
    setMappings(detectedMappings);
    
    // Generate preview data
    setPreviewData({
      headers,
      data: data.slice(0, 5) // Show first 5 rows as preview
    });
  };
  
  // Handle mapping change
  const handleMappingChange = (field, header) => {
    setMappings({
      ...mappings,
      [field]: header
    });
  };
  
  // Import CRs
  const importCRs = (mappedData) => {
    dispatch({
      type: ACTION_TYPES.SET_CR_INPUTS,
      payload: mappedData
    });
  };
  
  // Import data with current mappings
  const handleImport = () => {
    // Validate mappings
    if (!mappings.name || !mappings.BAHours || !mappings.ConfigHours || !mappings.QAHours) {
      setError('Please map all required fields before importing');
      return;
    }
    
    setImporting(true);
    setError('');
    
    try {
      // Parse data based on import method
      if (importMethod === 'csv') {
        // Re-parse the file to get all data
        const file = fileInputRef.current.files[0];
        if (!file) {
          setError('No file selected');
          setImporting(false);
          return;
        }
        
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              setError(`Error parsing CSV: ${results.errors[0].message}`);
              setImporting(false);
              return;
            }
            
            // Process parsed data
            processAndImportData(results.data);
          },
          error: (error) => {
            setError(`Error reading file: ${error.message}`);
            setImporting(false);
          }
        });
      } else {
        // Parse pasted data
        Papa.parse(pastedData, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              setError(`Error parsing data: ${results.errors[0].message}`);
              setImporting(false);
              return;
            }
            
            // Process parsed data
            processAndImportData(results.data);
          }
        });
      }
    } catch (error) {
      setError(`Import error: ${error.message}`);
      setImporting(false);
    }
  };
  
  // Process parsed data and import
  const processAndImportData = (data) => {
    // Map the data according to selected mappings
    const mappedData = data.map((row, index) => ({
      id: index + 1,
      name: String(row[mappings.name] || `CR ${index + 1}`),
      BAHours: Number(row[mappings.BAHours] || 0),
      ConfigHours: Number(row[mappings.ConfigHours] || 0),
      QAHours: Number(row[mappings.QAHours] || 0)
    }));
    
    // Import the mapped data
    importCRs(mappedData);
    
    // Reset state and close modal
    setImporting(false);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Import Change Requests</h3>
        
        {/* Import Method Selector */}
        <div className="mb-4">
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="importMethod"
                value="csv"
                checked={importMethod === 'csv'}
                onChange={() => setImportMethod('csv')}
              />
              <span className="ml-2">Import from CSV file</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="importMethod"
                value="paste"
                checked={importMethod === 'paste'}
                onChange={() => setImportMethod('paste')}
              />
              <span className="ml-2">Paste CSV data</span>
            </label>
          </div>
        </div>
        
        {/* CSV File Upload */}
        {importMethod === 'csv' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="w-full p-2 border rounded bg-gray-50"
            />
            <p className="mt-1 text-xs text-gray-500">
              The CSV file should contain columns for CR name, BA hours, Config hours, and QA hours.
            </p>
          </div>
        )}
        
        {/* Paste Data */}
        {importMethod === 'paste' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paste CSV Data
            </label>
            <textarea
              value={pastedData}
              onChange={handlePastedDataChange}
              className="w-full p-2 border rounded h-40 font-mono text-sm"
              placeholder="Paste CSV data here, including headers..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Paste data with headers for CR name, BA hours, Config hours, and QA hours.
            </p>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {/* Data Preview */}
        {previewData && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">Data Preview</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100">
                    {previewData.headers.map((header, index) => (
                      <th key={index} className="px-2 py-1 border text-xs">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {previewData.headers.map((header, colIndex) => (
                        <td key={colIndex} className="px-2 py-1 border text-xs">
                          {row[header] !== null && row[header] !== undefined ? String(row[header]) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Showing {previewData.data.length} of {previewData.data.length} rows
            </p>
          </div>
        )}
        
        {/* Column Mappings */}
        {previewData && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">Column Mappings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CR Name
                </label>
                <select
                  value={mappings.name}
                  onChange={(e) => handleMappingChange('name', e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Select Column --</option>
                  {previewData.headers.map((header, index) => (
                    <option key={index} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BA Hours
                </label>
                <select
                  value={mappings.BAHours}
                  onChange={(e) => handleMappingChange('BAHours', e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Select Column --</option>
                  {previewData.headers.map((header, index) => (
                    <option key={index} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Config Hours
                </label>
                <select
                  value={mappings.ConfigHours}
                  onChange={(e) => handleMappingChange('ConfigHours', e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Select Column --</option>
                  {previewData.headers.map((header, index) => (
                    <option key={index} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  QA Hours
                </label>
                <select
                  value={mappings.QAHours}
                  onChange={(e) => handleMappingChange('QAHours', e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Select Column --</option>
                  {previewData.headers.map((header, index) => (
                    <option key={index} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 mt-6">
          <button
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            onClick={onClose}
            disabled={importing}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            onClick={handleImport}
            disabled={!previewData || importing}
          >
            {importing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing...
              </>
            ) : (
              'Import Data'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CRImport;