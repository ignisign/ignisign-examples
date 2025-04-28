import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api.service';
import accountStorage from '../../utils/account-storage.service';

interface TokenTestResult {
  endpoint: string;
  success: boolean;
  data?: any;
  error?: string;
}

interface OAuthTokenTesterProps {
  showTokenInfo?: boolean;
  onRefreshSuccess?: (newTokens: any) => void;
  allowDebugMode?: boolean;
}

export const OAuthTokenTester: React.FC<OAuthTokenTesterProps> = ({ 
  showTokenInfo = false,
  onRefreshSuccess,
  allowDebugMode = true
}) => {
  const [tokens, setTokens] = useState<any>(null);
  const [testResults, setTestResults] = useState<TokenTestResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isFetchingTestToken, setIsFetchingTestToken] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false);
  const [storageInfo, setStorageInfo] = useState<any>(null);

  // Load tokens from storage on component mount
  useEffect(() => {
    const loadTokens = () => {
      setIsLoading(true);
      const accountInfo = accountStorage.getAccountInfo();
      if (accountInfo && accountInfo.accessToken) {
        setTokens({
          access_token: accountInfo.accessToken,
          refresh_token: accountInfo.refreshToken,
          expires_in: accountInfo.tokenExpiry ? accountInfo.tokenExpiry - Math.floor(Date.now() / 1000) : undefined
        });
      }
      setIsLoading(false);
    };

    loadTokens();
  }, []);

  // Update storage info when debug mode changes
  useEffect(() => {
    if (isDebugMode) {
      refreshStorageInfo();
    }
  }, [isDebugMode]);

  // Refresh info about what's in storage
  const refreshStorageInfo = () => {
    const info = {
      accountInfo: accountStorage.getAccountInfo(),
      state: accountStorage.getOAuthState(),
      codeVerifier: accountStorage.getCodeVerifier() ? 
        `${accountStorage.getCodeVerifier()?.substring(0, 5)}...` : 
        null
    };
    setStorageInfo(info);
  };

  // Test OAuth connection with current token
  const handleTestConnection = async () => {
    if (!tokens?.access_token) {
      setErrorMessage('No access token available');
      return;
    }

    setIsTesting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setTestResults([]);

    try {
      // Test the connection
      const result = await ApiService.oauthTestConnection(tokens.access_token);
      
      setTestResults([{
        endpoint: 'Token Verification',
        success: result.success,
        data: result,
        error: result.success ? undefined : result.message
      }]);

      if (result.success) {
        setSuccessMessage('Connection test successful! Token is valid.');
      } else {
        setErrorMessage(`Connection test failed: ${result.message}`);
      }
    } catch (error) {
      setErrorMessage(`Error testing connection: ${error instanceof Error ? error.message : String(error)}`);
      setTestResults([{
        endpoint: 'Token Verification',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }]);
    } finally {
      setIsTesting(false);
    }
  };

  // Test multiple APIs with the current token
  const handleRunTests = async () => {
    if (!tokens?.access_token) {
      setErrorMessage('No access token available');
      return;
    }

    setIsTesting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setTestResults([]);

    try {
      // Run comprehensive API tests
      const results = await ApiService.oauthRunApiTests(tokens.access_token);
      setTestResults(results);
      
      // Check if all tests were successful
      const allSuccessful = results.every(result => result.success);
      if (allSuccessful) {
        setSuccessMessage('All API tests completed successfully!');
      } else {
        const failedCount = results.filter(result => !result.success).length;
        setErrorMessage(`${failedCount} out of ${results.length} tests failed.`);
      }
    } catch (error) {
      setErrorMessage(`Error running API tests: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Refresh token
  const handleRefreshToken = async () => {
    if (!tokens?.refresh_token) {
      setErrorMessage('No refresh token available');
      return;
    }

    setIsRefreshing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Refresh the token
      const refreshedTokens = await ApiService.oauthRefreshToken(tokens.refresh_token);
      
      // Update local state
      setTokens(refreshedTokens);
      
      // Update account storage
      accountStorage.saveAccountInfo({
        accessToken: refreshedTokens.access_token,
        refreshToken: refreshedTokens.refresh_token || tokens.refresh_token,
        tokenExpiry: refreshedTokens.expires_in ? Math.floor(Date.now() / 1000) + refreshedTokens.expires_in : undefined
      });
      
      setSuccessMessage('Token refreshed successfully!');
      
      // Notify parent component if callback provided
      if (onRefreshSuccess) {
        onRefreshSuccess(refreshedTokens);
      }
    } catch (error) {
      setErrorMessage(`Error refreshing token: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get a test refresh token (for development/testing)
  const handleGetTestToken = async () => {
    setIsFetchingTestToken(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Get a test refresh token
      const result = await ApiService.oauthGetTestRefreshToken();
      
      if (result.success && result.refresh_token) {
        // Update tokens
        const updatedTokens = {
          ...(tokens || {}),
          refresh_token: result.refresh_token
        };
        
        setTokens(updatedTokens);
        
        // Update storage
        accountStorage.saveAccountInfo({
          accessToken: tokens?.access_token || '',
          refreshToken: result.refresh_token,
          tokenExpiry: tokens?.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : undefined
        });
        
        setSuccessMessage(`Test refresh token generated successfully! Expires in ${result.expires_in} seconds.`);
      } else {
        setErrorMessage('Failed to get test refresh token.');
      }
    } catch (error) {
      setErrorMessage(`Error getting test token: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsFetchingTestToken(false);
    }
  };

  // Toggle debug mode
  const handleToggleDebugMode = () => {
    setIsDebugMode(prev => !prev);
  };

  // Clear all storage
  const handleClearAllStorage = () => {
    accountStorage.clearAccountInfo();
    accountStorage.clearOAuthState();
    accountStorage.clearCodeVerifier();
    refreshStorageInfo();
    setTokens(null);
    setSuccessMessage('All storage cleared successfully.');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center my-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 my-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">OAuth Token Tester</h2>
        
        {allowDebugMode && (
          <button
            onClick={handleToggleDebugMode}
            className="px-3 py-1 text-xs font-medium rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            {isDebugMode ? 'Hide Debug' : 'Show Debug'}
          </button>
        )}
      </div>
      
      {/* Messages */}
      {errorMessage && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 rounded">
          <p>{errorMessage}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 my-4 rounded">
          <p>{successMessage}</p>
        </div>
      )}
      
      {/* Token Information */}
      {showTokenInfo && tokens && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Current Tokens</h3>
          
          {tokens.access_token && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-600">Access Token:</h4>
              <div className="bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto">
                {tokens.access_token.substring(0, 20)}...
              </div>
            </div>
          )}
          
          {tokens.refresh_token && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-600">Refresh Token:</h4>
              <div className="bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto">
                {tokens.refresh_token.substring(0, 20)}...
              </div>
            </div>
          )}
          
          {tokens.expires_in !== undefined && (
            <div>
              <h4 className="font-medium text-gray-600">Expires In:</h4>
              <div className="bg-gray-100 p-2 rounded text-sm">
                {Math.max(0, tokens.expires_in)} seconds
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Debug Information */}
      {isDebugMode && (
        <div className="mb-6 border border-gray-200 rounded-md p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-700">Storage Debug</h3>
            <div className="flex gap-2">
              <button
                onClick={refreshStorageInfo}
                className="px-2 py-1 text-xs font-medium rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700"
              >
                Refresh
              </button>
              <button
                onClick={handleClearAllStorage}
                className="px-2 py-1 text-xs font-medium rounded-md bg-red-100 hover:bg-red-200 text-red-700"
              >
                Clear All
              </button>
            </div>
          </div>
          
          {storageInfo && (
            <div className="text-xs font-mono">
              <details open>
                <summary className="cursor-pointer text-sm text-gray-700 font-semibold mb-1">Storage Contents</summary>
                <pre className="bg-gray-800 text-white p-2 rounded overflow-auto max-h-60">
                  {JSON.stringify(storageInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
      
      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isTesting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          onClick={handleTestConnection}
          disabled={isTesting || !tokens?.access_token}
        >
          {isTesting ? 'Testing...' : 'Test Connection'}
        </button>
        
        <button
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isTesting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
          }`}
          onClick={handleRunTests}
          disabled={isTesting || !tokens?.access_token}
        >
          {isTesting ? 'Running Tests...' : 'Run API Tests'}
        </button>
        
        <button
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isRefreshing ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
          }`}
          onClick={handleRefreshToken}
          disabled={isRefreshing || !tokens?.refresh_token}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Token'}
        </button>
        
        <button
          className={`px-4 py-2 rounded-md text-white font-medium ${
            isFetchingTestToken ? 'bg-amber-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700'
          }`}
          onClick={handleGetTestToken}
          disabled={isFetchingTestToken}
        >
          {isFetchingTestToken ? 'Generating...' : 'Get Test Token'}
        </button>
      </div>
      
      {/* Test Results */}
      {testResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Test Results</h3>
          <div className="border rounded-md overflow-hidden">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`p-3 ${index !== testResults.length - 1 ? 'border-b' : ''} ${
                  result.success ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{result.endpoint}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                
                {result.error && (
                  <p className="text-red-600 text-sm mt-1">{result.error}</p>
                )}
                
                {result.data && (
                  <details className="mt-1">
                    <summary className="text-sm text-blue-600 cursor-pointer">View Details</summary>
                    <pre className="text-xs bg-gray-800 text-white p-2 mt-1 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OAuthTokenTester; 