import React from 'react';
import { ConfigProvider } from 'context/ConfigContext';
import CRAssessmentTool from 'components/CRAssessmentTool';

function App() {
  return (
    <div className="App min-h-screen bg-gray-100 py-8">
      <ConfigProvider>
        <CRAssessmentTool />
      </ConfigProvider>
    </div>
  );
}

export default App;