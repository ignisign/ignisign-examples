import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { FrontUrlProvider } from '../utils/front-url-provider';
import { OAuthAPI } from '../utils/oauth-api';
import accountStorage from '../utils/account-storage.service';
import { ApiService } from '../services/api.service';
import OAuthTokenTester from '../components/OAuth/OAuthTokenTester';

interface TokenResponse {
  access_token: string;
  token_type: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

interface UserInfo {
  sub: string;
  name?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  [key: string]: any;
}

interface ErrorDetails {
  title: string;
  message: string;
  technical?: string;
  suggestion?: string;
}

// Debug data structure
interface DebugData {
  flow: {
    params?: {
      code: string | null;
      state: string | null;
      error: string | null;
      errorDescription: string | null;
    };
    storedState?: string | null;
    codeVerifier?: {
      length: number;
      prefix: string;
      suffix: string;
      hasSpecialChars: boolean;
    };
    warnings?: string[];
    storedSessionState?: string | null;
  };
  tokenExchange?: {
    started: string;
    completed?: string;
    successful?: boolean;
    error?: string;
    code: string | null;
  };
  userInfo?: {
    started: string;
    completed?: string;
    successful?: boolean;
    error?: string;
  };
  error?: string;
  stack?: string;
}

// Interface for API test results
interface ApiTestResult {
  endpoint: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

export const OAuthCallbackPage: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorDetails | null>(null);
  const [tokens, setTokens] = useState<TokenResponse | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugData | null>(null);
  const [apiTestResults, setApiTestResults] = useState<ApiTestResult[]>([]);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [isFetchingTestToken, setIsFetchingTestToken] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [showTokenTester, setShowTokenTester] = useState(false);
  
  // Use ref instead of state to track if the token exchange has been initiated
  // This avoids re-renders and dependency issues
  const tokenExchangeInitiated = useRef(false);

  useEffect(() => {
    // Create a flag to ensure the effect only runs once
    let isMounted = true;
    
    async function handleCallback() {
      // Skip if we already started the token exchange
      if (tokenExchangeInitiated.current) {
        console.log('Token exchange already initiated, skipping duplicate callback handling');
        return;
      }
      
      // Mark the token exchange as initiated
      tokenExchangeInitiated.current = true;
      
      try {
        if (!isMounted) return;
        setIsLoading(true);
        
        // Initialize debugData with proper structure
        const debugData: DebugData = {
          flow: {
            params: {
              code: null,
              state: null,
              error: null,
              errorDescription: null
            },
            storedState: null,
            codeVerifier: undefined,
            storedSessionState: null
          }
        };
        
        // Get the URL search params
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        debugData.flow.params = {
          code: code ? `${code.substring(0, 8)}...` : null,
          state,
          error,
          errorDescription
        };

        // Handle error response from authorization server
        if (error) {
          console.error(`OAuth error: ${error}`, errorDescription);
          setError({
            title: 'Authorization Failed',
            message: `The authorization server returned an error: ${error}`,
            technical: errorDescription || 'No additional error details provided',
            suggestion: 'Please try again or contact support if the issue persists.'
          });
          setDebugInfo(debugData);
          setIsLoading(false);
          return;
        }

        // Verify we have required parameters
        if (!code) {
          console.error('No authorization code received');
          setError({
            title: 'Missing Authorization Code',
            message: 'No authorization code was received from the server.',
            suggestion: 'This usually indicates a problem with the authorization process. Please try again.'
          });
          setDebugInfo(debugData);
          setIsLoading(false);
          return;
        }

        // Verify state parameter to prevent CSRF attacks
        const savedState = accountStorage.getOAuthState();
        debugData.flow.storedState = savedState;
        
        console.log('State check:', { 
          receivedState: state, 
          savedState: savedState,
          isStorageAvailable: typeof localStorage !== 'undefined',
          isDevelopment: process.env.NODE_ENV === 'development'
        });

        // Try to recover state from session storage as backup
        let recoveredState = null;
        try {
          recoveredState = sessionStorage.getItem('oauth_state');
          if (recoveredState) {
            console.log('Found backup state in session storage:', recoveredState);
            debugData.flow.storedSessionState = recoveredState;
          }
        } catch (e) {
          console.warn('Error checking session storage for state:', e);
        }

        if (!state) {
          console.error('No state parameter received');
          setError({
            title: 'Security Error',
            message: 'The state parameter is missing from the response.',
            technical: 'State parameter is required to prevent CSRF attacks.',
            suggestion: 'This could indicate a security issue. Please try again from the beginning.'
          });
          setDebugInfo(debugData);
          setIsLoading(false);
          return;
        }
        
        // In development mode, we can optionally bypass state validation to make testing easier
        const bypassStateValidation = process.env.NODE_ENV === 'development';
        
        // First check if the primary state matches
        let isStateValid = (savedState && state === savedState);
        
        // If primary state doesn't match, check the backup state
        if (!isStateValid && recoveredState && state === recoveredState) {
          console.log('Primary state didn\'t match, but backup state matches');
          debugData.flow.warnings = debugData.flow.warnings || [];
          debugData.flow.warnings.push('Using recovered state from session storage for validation');
          isStateValid = true;
        }
        
        // Handle the state validation result
        if (!isStateValid && !bypassStateValidation) {
          console.error('State validation failed', { 
            state, 
            savedState, 
            recoveredState,
            primaryMatch: (savedState && state === savedState),
            backupMatch: (recoveredState && state === recoveredState)
          });
          
          setError({
            title: 'Security Validation Failed',
            message: 'The state parameter does not match the expected value.',
            technical: 'This could indicate a CSRF attack or that the authorization flow was interrupted.',
            suggestion: 'Please try again from the beginning of the authorization process.'
          });
          setDebugInfo(debugData);
          setIsLoading(false);
          return;
        } else if (!isStateValid && bypassStateValidation) {
          console.warn('State validation bypassed in development mode');
          debugData.flow.warnings = debugData.flow.warnings || [];
          debugData.flow.warnings.push('State validation bypassed in development mode for testing purposes');
        }

        // Clean up saved state
        accountStorage.clearOAuthState();
        try {
          sessionStorage.removeItem('oauth_state');
        } catch (e) {
          console.warn('Error clearing session storage state:', e);
        }

        // Get code verifier from storage for PKCE
        let codeVerifier = accountStorage.getCodeVerifier();
        
        // If code verifier is missing, try to recover or create a fallback strategy
        if (!codeVerifier) {
          console.error('No code verifier found');
          
          // Option 1: Try recovering from sessionStorage if we're using localStorage
          try {
            const sessionVerifier = sessionStorage.getItem('oauth_code_verifier');
            if (sessionVerifier) {
              console.log('Recovered code verifier from session storage');
              codeVerifier = sessionVerifier;
              debugData.flow.warnings = debugData.flow.warnings || [];
              debugData.flow.warnings.push('Recovered code verifier from session storage');
            }
          } catch (e) {
            console.error('Error trying to recover from session storage:', e);
          }
          
          // Option 2: Check if we're in development mode and provide a recovery option
          if (!codeVerifier && process.env.NODE_ENV === 'development') {
            // In development mode, we could try to continue with a demo flow
            // or show a special recovery option for the user
            setError({
              title: 'PKCE Verification Failed',
              message: 'The code verifier was not found in your browser storage.',
              technical: 'The code_verifier is required for PKCE flow but was not found in localStorage.',
              suggestion: 'Try clearing your browser cache and starting again. If using incognito mode, make sure localStorage is enabled.'
            });
            
            // Provide additional options for development testing
            setSuccessMessage(
              'Since you are in development mode, you may choose to use a manual token acquisition process instead.'
            );
            
            // Set debug info and show the token tester interface
            setDebugInfo(debugData);
            setShowTokenTester(true);
            setIsLoading(false);
            return;
          }
          
          if (!codeVerifier) {
            setError({
              title: 'PKCE Verification Failed',
              message: 'The code verifier was not found in your browser storage.',
              technical: 'The code_verifier is required for PKCE flow but was not found in localStorage.',
              suggestion: 'Try clearing your browser cache and starting again. If using incognito mode, make sure localStorage is enabled.'
            });
            setDebugInfo(debugData);
            setIsLoading(false);
            return;
          }
        }

        // Log code verifier for debugging (only first and last few chars for security)
        console.log(`Using code_verifier: ${codeVerifier.substring(0, 5)}...${codeVerifier.substring(codeVerifier.length - 5)}`);
        console.log(`code_verifier length: ${codeVerifier.length}`);
        
        // Check for special characters that might cause issues
        const hasSpecialChars = /[.~]/.test(codeVerifier);
        if (hasSpecialChars) {
          console.warn('Code verifier contains potentially problematic characters (. or ~)');
        }

        debugData.flow.codeVerifier = {
          length: codeVerifier.length,
          prefix: codeVerifier.substring(0, 5),
          suffix: codeVerifier.substring(codeVerifier.length - 5),
          hasSpecialChars
        };

        // Clean up code verifier
        accountStorage.clearCodeVerifier();

        // Exchange code for tokens using the OAuthAPI utility
        try {
          debugData.tokenExchange = { 
            started: new Date().toISOString(),
            code: code ? `${code.substring(0, 8)}...` : null
          };
          
          // Check if this authorization code was already used
          let processedCodesArray = [];
          try {
            const processedCodes = sessionStorage.getItem('oauth_processed_codes');
            processedCodesArray = processedCodes ? JSON.parse(processedCodes) : [];
            
            console.log('Processed codes check:', { 
              currentCode: code.substring(0, 8) + '...', 
              processedCodesCount: processedCodesArray.length,
              processedCodes: processedCodesArray.map((c: string) => c.substring(0, 8) + '...')
            });
            
            if (processedCodesArray.includes(code)) {
              console.warn('Authorization code already processed, silently skipping duplicate token exchange');
              debugData.flow.warnings = debugData.flow.warnings || [];
              debugData.flow.warnings.push('Silently skipped duplicate token exchange for already processed code');
              
              // Instead of showing an error, let's check if we already have tokens
              // If we do, we can just show them again
              if (tokens && tokens.access_token) {
                console.log('Using existing tokens from previous exchange');
                debugData.tokenExchange.successful = true;
                debugData.tokenExchange.completed = new Date().toISOString();
                setDebugInfo(debugData);
                setIsLoading(false);
                return;
              }
              
              // If we don't have tokens yet, continue with the exchange anyway
              // This handles cases where the code was marked as processed
              // but the exchange wasn't actually completed
              console.log('No tokens found, proceeding with token exchange anyway');
            }
          } catch (e) {
            console.error('Error checking processed codes:', e);
            // Continue with the token exchange even if checking fails
            debugData.flow.warnings = debugData.flow.warnings || [];
            debugData.flow.warnings.push('Error checking processed codes: ' + String(e));
          }
          
          // Remove the code tracking before the exchange
          // We'll add it after a successful exchange instead

          console.log('Initiating token exchange with code:', code.substring(0, 8) + '...');
          const tokenData = await OAuthAPI.exchangeCodeForToken({
            code,
            code_verifier: codeVerifier,
            redirect_uri: `${window.location.origin}/oauth-callback`,
            verbose: true // Enable verbose logging for troubleshooting
          });
          
          console.log('Token exchange successful:', { 
            token_type: tokenData.token_type,
            expires_in: tokenData.expires_in, 
            refresh_token: tokenData.refresh_token ? 'present' : 'absent'
          });
          
          // Now that the exchange was successful, add the code to processed codes
          try {
            processedCodesArray.push(code);
            // Keep only the last 5 codes to prevent storage bloat
            const recentCodes = processedCodesArray.slice(-5);
            sessionStorage.setItem('oauth_processed_codes', JSON.stringify(recentCodes));
            console.log('Added current code to processed codes list after successful exchange, new count:', recentCodes.length);
          } catch (e) {
            console.error('Error saving processed codes:', e);
            // Continue even if saving fails
          }
          
          debugData.tokenExchange.successful = true;
          debugData.tokenExchange.completed = new Date().toISOString();
          
          setTokens(tokenData);
          
          // Fetch user info using our backend service
          if (tokenData.access_token) {
            try {
              debugData.userInfo = { started: new Date().toISOString() };
              const userInfoData = await ApiService.oauthGetUserInfo(tokenData.access_token);
              setUserInfo(userInfoData);
              debugData.userInfo.successful = true;
              debugData.userInfo.completed = new Date().toISOString();
              
              // Store data in account storage for later use
              accountStorage.saveAccountInfo({
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                tokenExpiry: tokenData.expires_in ? Math.floor(Date.now() / 1000) + tokenData.expires_in : undefined,
                userInfo: userInfoData
              });
            } catch (userInfoError) {
              console.error('Error fetching user info:', userInfoError);
              debugData.userInfo.error = userInfoError.message;
              debugData.userInfo.completed = new Date().toISOString();
            }
          }
          
          setSuccessMessage('Authentication successful! Access token received.');
        } catch (tokenError) {
          console.error('Error exchanging code for token:', tokenError);
          debugData.tokenExchange.error = tokenError.message;
          debugData.tokenExchange.completed = new Date().toISOString();
          
          // Extract more detailed error information
          let errorDetails = 'Unknown error occurred during token exchange.';
          let suggestion = 'Please try again or contact support.';
          
          if (tokenError.message.includes('invalid_grant')) {
            errorDetails = 'The authorization code is invalid or has expired. This could happen if the code was already used or if it has timed out.';
            suggestion = 'Please try the authorization process again from the beginning.';
          } else if (tokenError.message.includes('invalid_client')) {
            errorDetails = 'Client authentication failed. The client ID might be incorrect or the client is not allowed to use this grant type.';
            suggestion = 'Please check the client configuration and try again.';
          } else if (tokenError.message.includes('invalid_request')) {
            errorDetails = 'The request is missing a required parameter, includes an invalid parameter, or is otherwise malformed.';
            suggestion = 'Please check the request parameters and try again.';
          }
          
          setError({
            title: 'Token Exchange Failed',
            message: 'Failed to exchange the authorization code for tokens.',
            technical: tokenError.message,
            suggestion: suggestion
          });
        }
        
        setDebugInfo(debugData);
        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;
        
        console.error('Error during OAuth callback:', err);
        console.error('Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
        });
        
        setError({
          title: 'OAuth Flow Error',
          message: 'An unexpected error occurred during the OAuth flow.',
          technical: err instanceof Error ? err.message : String(err),
          suggestion: 'Please try again later or contact support.'
        });
        
        setDebugInfo({
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined
        });
        
        setIsLoading(false);
      }
    }

    handleCallback();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [location]);  // Remove tokenExchangeRequested from dependencies

  const handleRefreshToken = async () => {
    if (!tokens?.refresh_token) {
      setError({
        title: 'Refresh Not Available',
        message: 'No refresh token available to perform this operation.',
        suggestion: 'Try starting a new authorization flow to get a refresh token.'
      });
      return;
    }
    
    try {
      setIsRefreshing(true);
      setSuccessMessage(null);
      setError(null);
      
      // Use our backend service to refresh the token
      const refreshData = await ApiService.oauthRefreshToken(tokens.refresh_token);
      setTokens(refreshData);
      setSuccessMessage('Token refreshed successfully!');
      
      // Update user info with new token
      if (refreshData.access_token) {
        try {
          const userInfoData = await ApiService.oauthGetUserInfo(refreshData.access_token);
          setUserInfo(userInfoData);
          
          // Update stored tokens
          accountStorage.saveAccountInfo({
            accessToken: refreshData.access_token,
            refreshToken: refreshData.refresh_token || tokens.refresh_token,
            tokenExpiry: refreshData.expires_in ? Math.floor(Date.now() / 1000) + refreshData.expires_in : undefined,
            userInfo: userInfoData
          });
        } catch (userInfoError) {
          console.error('Error fetching user info after token refresh:', userInfoError);
        }
      }
      
      setIsRefreshing(false);
    } catch (err) {
      console.error('Error refreshing token:', err);
      
      setError({
        title: 'Token Refresh Failed',
        message: 'Failed to refresh the access token.',
        technical: err instanceof Error ? err.message : String(err),
        suggestion: 'Your session may have expired. Try authorizing again.'
      });
      
      setIsRefreshing(false);
    }
  };
  
  const handleTestApi = async () => {
    if (!tokens?.access_token) {
      setError({
        title: 'Authentication Required',
        message: 'You need to be authenticated to test the API.',
        suggestion: 'Please start the authorization flow to get an access token.'
      });
      return;
    }
    
    setIsTestingApi(true);
    setApiTestResults([]);
    
    try {
      // Use our backend service to run tests
      const results = await ApiService.oauthRunApiTests(tokens.access_token);
      setApiTestResults(results);
    } catch (error) {
      console.error('Error running API tests:', error);
      setError({
        title: 'API Test Failed',
        message: 'Failed to run API tests.',
        technical: error instanceof Error ? error.message : String(error),
        suggestion: 'Check your network connection and try again.'
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleFetchTestRefreshToken = async () => {
    try {
      setIsFetchingTestToken(true);
      setSuccessMessage(null);
      setError(null);
      
      // Get a test refresh token from the server
      const result = await ApiService.oauthGetTestRefreshToken();
      
      if (result.success && result.refresh_token) {
        // If we already have tokens, just update the refresh token
        if (tokens) {
          setTokens({
            ...tokens,
            refresh_token: result.refresh_token
          });
        } else {
          // If we don't have tokens yet, create a basic structure
          setTokens({
            access_token: '',
            token_type: 'bearer',
            refresh_token: result.refresh_token
          });
        }
        
        setSuccessMessage(`Test refresh token generated successfully! Expires in ${result.expires_in} seconds.`);
      } else {
        setError({
          title: 'Token Generation Failed',
          message: 'Failed to generate a test refresh token.',
          technical: result.error || 'Unknown error',
          suggestion: 'Please try again or contact the administrator.'
        });
      }
    } catch (err) {
      console.error('Error fetching test refresh token:', err);
      
      setError({
        title: 'Test Token Generation Failed',
        message: 'Failed to get a test refresh token.',
        technical: err instanceof Error ? err.message : String(err),
        suggestion: 'Please check your network connection and try again.'
      });
    } finally {
      setIsFetchingTestToken(false);
    }
  };
  
  const handleValidateToken = async () => {
    if (!tokens?.access_token) {
      setError({
        title: 'Validation Not Available',
        message: 'No access token available to validate.',
        suggestion: 'You need an access token first. Try authenticating or using refresh token.'
      });
      return;
    }
    
    try {
      setIsValidatingToken(true);
      setError(null);
      
      // Validate the token
      const result = await ApiService.oauthValidateToken(tokens.access_token);
      setValidationResult(result);
      
      if (!result.valid) {
        setError({
          title: 'Token Validation Failed',
          message: 'The access token is invalid or has expired.',
          suggestion: 'Try refreshing the token or starting a new authorization flow.'
        });
      }
    } catch (err) {
      console.error('Error validating token:', err);
      
      setError({
        title: 'Validation Failed',
        message: 'Failed to validate the access token.',
        technical: err instanceof Error ? err.message : String(err),
        suggestion: 'Please try again later.'
      });
    } finally {
      setIsValidatingToken(false);
    }
  };

  const goBack = () => {
    history.push(FrontUrlProvider.oauthTestPage());
  };

  const handleToggleTokenTester = () => {
    setShowTokenTester(prev => !prev);
  };
  
  /**
   * Force a new token exchange attempt for debugging purposes
   */
  const handleDebugRetry = () => {
    // Reset the tokenExchangeInitiated flag to allow another attempt
    tokenExchangeInitiated.current = false;
    
    // Create a copy of the current search params but with a timestamp to make it unique
    const searchParams = new URLSearchParams(location.search);
    searchParams.append('_debug_ts', Date.now().toString());
    
    // Reset UI state
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);
    
    // Force the effect to run again
    history.replace({
      pathname: location.pathname,
      search: searchParams.toString()
    });
    
    console.log('Debug: Manually triggering a new token exchange attempt');
  };
  
  const renderErrorDetails = () => {
    if (!error) return null;
    
    return (
      <div>
        <h2 className="text-xl font-semibold text-red-600">
          {error.title}
        </h2>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 rounded">
          <p className="font-medium">
            {error.message}
          </p>
          {error.technical && (
            <p className="mt-2 text-sm whitespace-pre-wrap font-mono">
              Technical details: {error.technical}
            </p>
          )}
          {error.suggestion && (
            <p className="mt-2 text-sm">
              <strong>Suggestion:</strong> {error.suggestion}
            </p>
          )}
        </div>
        
        {debugInfo && (
          <div className="mt-4">
            <details className="bg-gray-100 p-4 rounded" open>
              <summary className="font-medium cursor-pointer">Debug Information</summary>
              <pre className="mt-2 text-xs overflow-auto p-2 bg-gray-700 text-white rounded">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded"
                  onClick={handleDebugRetry}
                >
                  Retry Token Exchange
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                  onClick={() => {
                    // Clear processed codes from session storage
                    sessionStorage.removeItem('oauth_processed_codes');
                    console.log('Cleared processed codes from session storage');
                    alert('Cleared processed codes from session storage');
                  }}
                >
                  Clear Processed Codes
                </button>
                <button
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded"
                  onClick={() => {
                    // Copy debug info to clipboard
                    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
                      .then(() => alert('Debug info copied to clipboard'))
                      .catch(err => alert('Failed to copy: ' + err));
                  }}
                >
                  Copy Debug Info
                </button>
              </div>
            </details>
          </div>
        )}
        
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={goBack}
          >
            Back to Test Page
          </button>
          <button
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={handleToggleTokenTester}
          >
            {showTokenTester ? "Hide Token Tester" : "Show Advanced Token Tester"}
          </button>
        </div>
      </div>
    );
  };
  
  const renderApiTestResults = () => {
    if (apiTestResults.length === 0) return null;
    
    return (
      <div className="mt-6">
        <h2 className="text-xl font-semibold text-gray-800">API Test Results:</h2>
        <div className="bg-gray-50 rounded-md mt-2 divide-y divide-gray-200">
          {apiTestResults.map((result, index) => (
            <div key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">{result.endpoint}</div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {result.success ? 'Success' : 'Failed'} ({result.duration}ms)
                </div>
              </div>
              {result.data && (
                <details className="mt-2">
                  <summary className="text-sm text-blue-600 cursor-pointer">View Response</summary>
                  <pre className="mt-1 text-xs bg-gray-800 text-white p-2 rounded overflow-auto">{JSON.stringify(result.data, null, 2)}</pre>
                </details>
              )}
              {result.error && (
                <p className="mt-1 text-sm text-red-600">{result.error}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderValidationResult = () => {
    if (!validationResult) return null;
    
    return (
      <div className="mt-6">
        <h2 className="text-xl font-semibold text-gray-800">Token Validation:</h2>
        <div className={`mt-2 p-4 rounded ${validationResult.valid ? 'bg-green-100' : 'bg-red-100'}`}>
          <p className="font-medium">
            Status: {validationResult.valid ? 'Valid' : 'Invalid'}
          </p>
          {validationResult.valid && (
            <>
              <p>Expires in: {validationResult.expiresIn} seconds</p>
              <p>Scope: {validationResult.scope}</p>
              {validationResult.tokenInfo && (
                <details className="mt-2">
                  <summary className="text-sm text-blue-600 cursor-pointer">Token Info</summary>
                  <pre className="mt-1 text-xs bg-gray-800 text-white p-2 rounded overflow-auto">
                    {JSON.stringify(validationResult.tokenInfo, null, 2)}
                  </pre>
                </details>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white shadow-md rounded-lg p-6 mt-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          OAuth Callback
        </h1>

        {isLoading ? (
          <div className="flex flex-col items-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mb-4"></div>
            <p className="text-gray-600">Processing authorization code...</p>
            
            {/* Add debug button to help troubleshoot issues */}
            <button 
              onClick={handleDebugRetry}
              className="mt-6 px-4 py-2 text-xs bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              Debug: Force Retry
            </button>
          </div>
        ) : error ? (
          renderErrorDetails()
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Authentication Successful!
            </h2>
            
            {successMessage && (
              <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 my-4 rounded">
                <p>{successMessage}</p>
              </div>
            )}

            {tokens && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Access Token:
                </h2>
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm mt-2 mb-4">
                  {tokens.access_token}
                </pre>

                {tokens.id_token && (
                  <>
                    <h2 className="text-xl font-semibold text-gray-800">
                      ID Token:
                    </h2>
                    <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm mt-2 mb-4">
                      {tokens.id_token}
                    </pre>
                  </>
                )}

                {tokens.refresh_token && (
                  <>
                    <h2 className="text-xl font-semibold text-gray-800">
                      Refresh Token:
                    </h2>
                    <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm mt-2 mb-4">
                      {tokens.refresh_token}
                    </pre>
                    
                    <button
                      className={`px-6 py-2 border border-purple-600 rounded-md font-medium
                        ${isRefreshing 
                          ? 'bg-purple-200 text-purple-400 cursor-not-allowed' 
                          : 'bg-white text-purple-600 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'}`}
                      onClick={handleRefreshToken}
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? "Refreshing..." : "Force Token Refresh"}
                    </button>
                  </>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className={`px-6 py-2 border border-indigo-600 rounded-md font-medium
                      ${isValidatingToken 
                        ? 'bg-indigo-200 text-indigo-400 cursor-not-allowed' 
                        : 'bg-white text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'}`}
                    onClick={handleValidateToken}
                    disabled={isValidatingToken}
                  >
                    {isValidatingToken ? "Validating..." : "Validate Token"}
                  </button>
                </div>

                {renderValidationResult()}
              </div>
            )}

            {userInfo && (
              <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  User Information:
                </h2>
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm mt-2 mb-4">
                  {JSON.stringify(userInfo, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="mt-6 flex flex-wrap gap-4">
              <button
                className={`px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${isTestingApi ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleTestApi}
                disabled={isTestingApi}
              >
                {isTestingApi ? "Testing APIs..." : "Test Ignisign API"}
              </button>
              
              <button
                className={`px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${isFetchingTestToken ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleFetchTestRefreshToken}
                disabled={isFetchingTestToken}
              >
                {isFetchingTestToken ? "Generating..." : "Get Test Refresh Token"}
              </button>
              
              <button
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={handleToggleTokenTester}
              >
                {showTokenTester ? "Hide Token Tester" : "Show Advanced Token Tester"} 
              </button>
              
              <button
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={goBack}
              >
                Back to Test Page
              </button>
            </div>

            {showTokenTester && (
              <div className="mt-6">
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Advanced Token Testing</h3>
                  <p className="text-gray-600 mb-4">
                    Use the component below for comprehensive OAuth token testing, including API validation, token refresh, and more.
                  </p>
                  <OAuthTokenTester 
                    showTokenInfo={false} 
                    onRefreshSuccess={(newTokens) => {
                      setTokens(newTokens);
                      setSuccessMessage('Token refreshed successfully via the testing component!');
                    }} 
                  />
                </div>
              </div>
            )}
            
            {renderApiTestResults()}
            
            {debugInfo && (
              <div className="mt-6">
                <details className="bg-gray-100 p-4 rounded">
                  <summary className="font-medium cursor-pointer">Debug Information</summary>
                  <pre className="mt-2 text-xs overflow-auto p-2 bg-gray-700 text-white rounded">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackPage; 