import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { runAllTests } from '../test-firebase';

const TestComponents: React.FC = () => {
  const { currentUser } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  
  useEffect(() => {
    const runTests = async () => {
      const results: string[] = [];
      
      // Test authentication
      results.push(`Authentication: ${currentUser ? 'Authenticated' : 'Not authenticated'}`);
      
      // Test Firebase services
      try {
        await runAllTests();
        results.push('Firebase services test completed (check console for details)');
      } catch (error) {
        results.push(`Firebase services test failed: ${error}`);
      }
      
      setTestResults(results);
    };
    
    runTests();
  }, [currentUser]);
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Firebase Integration Tests</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">User Status</h2>
        {currentUser ? (
          <div>
            <p><strong>Name:</strong> {currentUser.displayName}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>UID:</strong> {currentUser.uid}</p>
          </div>
        ) : (
          <p>Not signed in</p>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-3">Test Results</h2>
        <ul className="list-disc pl-5 space-y-2">
          {testResults.map((result, index) => (
            <li key={index}>{result}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-gray-500">
          Check the browser console for detailed test output.
        </p>
      </div>
    </div>
  );
};

export default TestComponents;