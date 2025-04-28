import React, { useEffect, useState } from 'react';
import { FrontUrlProvider } from '../utils/front-url-provider';
import { OAuthAPI } from '../utils/oauth-api';
import accountStorage from '../utils/account-storage.service';
import { ApiService } from '../services/api.service';
import OAuthTokenTester from '../components/OAuth/OAuthTokenTester';

// Function to generate a random state value for CSRF protection
function generateRandomState() {
  // Use crypto API for better randomization when available
  let state;
  
  // Use a more secure random value generation if available
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(4);
    window.crypto.getRandomValues(array);
    state = Array.from(array, x => x.toString(16).padStart(8, '0')).join('');
  } else {
    // Fallback to Math.random()
    state = Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  console.log('Generated OAuth state:', state);
  return state;
}

// Function to generate a random code verifier for PKCE
function generateCodeVerifier() {
  // Use only URL-safe characters: alphanumeric plus '-' and '_'
  // Explicitly avoiding problematic characters like '.' and '~'
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  // Generate a code verifier of length 43-128 characters (RFC 7636 recommends min 43)
  const length = 64; // 64 is a good balance
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Function to create a code challenge from a code verifier (PKCE)
async function createCodeChallenge(codeVerifier: string) {
  // Create a SHA-256 hash of the code verifier
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  
  // Convert the hash to a base64url string
  const hashArray = Array.from(new Uint8Array(digest));
  // Direct conversion to base64
  const base64 = btoa(String.fromCharCode.apply(null, hashArray));
  // Convert base64 to base64url (URL-safe)
  const base64url = base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  console.log('Code verifier:', codeVerifier);
  console.log('Code verifier length:', codeVerifier.length);
  console.log('Code challenge:', base64url);
  console.log('Code challenge length:', base64url.length);
  
  return base64url;
}

export const OAuthTestPage: React.FC = () => {
  const [oauthUrl, setOauthUrl] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showTokenTester, setShowTokenTester] = useState<boolean>(false);
  
  // Extract the URL preparation to a separate function that can be reused
  async function prepareOAuthUrl() {
    try {
      // Generate PKCE code verifier and challenge
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await createCodeChallenge(codeVerifier);
      
      // Clear existing state and code verifier
      accountStorage.clearOAuthState();
      accountStorage.clearCodeVerifier();
      
      try {
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_code_verifier');
      } catch (e) {
        console.warn('Could not clear session storage before preparing OAuth URL', e);
      }
      
      // Store code verifier in our storage service
      accountStorage.saveCodeVerifier(codeVerifier);
      
      // Backup the code verifier in session storage as a fallback
      try {
        sessionStorage.setItem('oauth_code_verifier', codeVerifier);
        console.log('Code verifier backed up in session storage');
      } catch (e) {
        console.warn('Could not backup code verifier in session storage', e);
      }
      
      // Generate random state for CSRF protection
      const state = generateRandomState();
      
      // Save state (and log any issues)
      try {
        accountStorage.saveOAuthState(state);
        console.log('OAuth state saved successfully');
      } catch (error) {
        console.error('Error saving OAuth state:', error);
      }
      
      // Create a backup of state in session storage
      try {
        sessionStorage.setItem('oauth_state', state);
        console.log('OAuth state backed up in session storage');
      } catch (e) {
        console.warn('Could not backup state in session storage', e);
      }
      
      // Verify state and code verifier were saved properly
      const savedState = accountStorage.getOAuthState();
      const savedVerifier = accountStorage.getCodeVerifier();
      console.log('Verification after save:', {
        state: state,
        savedState: savedState,
        stateMatch: state === savedState,
        verifierSaved: !!savedVerifier
      });
      
      // Build the authorization URL using the utility
      const authUrl = OAuthAPI.getAuthorizationUrl({
        client_id: 'ignisign-js-example',
        response_type: 'code',
        scope: 'openid email profile',
        redirect_uri: `${window.location.origin}/oauth-callback`,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });
      
      setOauthUrl(authUrl);
      return authUrl;
    } catch (error) {
      console.error('Error preparing OAuth URL:', error);
      throw error;
    }
  }
  
  useEffect(() => {
    async function checkAuthAndPrepareOAuth() {
      // Check if we have a valid access token
      const hasValidToken = accountStorage.isAccessTokenValid();
      
      if (hasValidToken) {
        try {
          // Try to fetch user data from the test API
          const accountInfo = accountStorage.getAccountInfo();
          if (accountInfo) {
            setUserData(accountInfo.userInfo);
            // Test the connection to verify token validity
            const connectionResult = await ApiService.oauthTestConnection(accountInfo.accessToken);
            setIsLoggedIn(connectionResult.success);
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          // If there's an error, clear the tokens
          accountStorage.clearAccountInfo();
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
      
      // Prepare the OAuth URL regardless of login state
      await prepareOAuthUrl();
      setIsLoading(false);
    }
    
    checkAuthAndPrepareOAuth();
  }, []);
  
  const handleStartOAuth = async () => {
    console.log('Starting OAuth flow');
    
    try {
      // Get a fresh OAuth URL with new state and code verifier
      const freshUrl = await prepareOAuthUrl();
      
      console.log('OAuth URL regenerated with fresh state and code verifier');
      console.log('Redirecting to:', freshUrl);
      
      // In development, add a delay to ensure logs are visible
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          window.location.href = freshUrl;
        }, 200);
      } else {
        window.location.href = freshUrl;
      }
    } catch (error) {
      console.error('Error starting OAuth flow:', error);
      alert('Failed to start OAuth flow. Please try again.');
    }
  };
  
  const handleLogout = () => {
    // Clear all auth-related storage
    accountStorage.clearAccountInfo();
    accountStorage.clearOAuthState();
    accountStorage.clearCodeVerifier();
    
    // Also clear backup session storage
    try {
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_code_verifier');
      sessionStorage.removeItem('oauth_processed_codes');
    } catch (e) {
      console.warn('Error clearing session storage during logout:', e);
    }
    
    setIsLoggedIn(false);
    setUserData(null);
    
    // Force regeneration of OAuth URL with fresh state
    console.log('Regenerating OAuth URL with fresh state after logout');
    prepareOAuthUrl().catch(err => {
      console.error('Error regenerating OAuth URL after logout:', err);
    });
  };
  
  const handleTestConnection = async () => {
    try {
      const accountInfo = accountStorage.getAccountInfo();
      if (!accountInfo || !accountInfo.accessToken) {
        throw new Error('No access token available');
      }
      
      const result = await ApiService.oauthTestConnection(accountInfo.accessToken);
      alert(result.message);
    } catch (error) {
      alert('Error testing connection: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleToggleTokenTester = () => {
    setShowTokenTester(prev => !prev);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white shadow-md rounded-lg p-6 mt-8">
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white shadow-md rounded-lg p-6 mt-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          OpenID Connect Provider Test
        </h1>
        
        {isLoggedIn ? (
          <div>
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 my-4 rounded">
              <p className="font-medium">You are authenticated!</p>
            </div>
            
            {userData && (
              <div className="mt-4">
                <h2 className="text-xl font-semibold text-gray-700">User Information:</h2>
                <div className="bg-gray-100 p-4 rounded-md mt-2">
                  <p><strong>ID:</strong> {userData.sub}</p>
                  {userData.email && <p><strong>Email:</strong> {userData.email}</p>}
                  {userData.name && <p><strong>Name:</strong> {userData.name}</p>}
                </div>
              </div>
            )}
            
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={handleTestConnection}
              >
                Test API Connection
              </button>
              
              <button
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onClick={handleToggleTokenTester}
              >
                {showTokenTester ? "Hide Token Tester" : "Show Token Tester"}
              </button>
              
              <button
                className="px-6 py-2 border border-red-500 text-red-500 hover:bg-red-50 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>

            {showTokenTester && (
              <OAuthTokenTester
                showTokenInfo={true}
                onRefreshSuccess={(newTokens) => {
                  console.log('Tokens refreshed successfully:', newTokens);
                }}
              />
            )}
          </div>
        ) : (
          <>
            <p className="text-gray-700 mb-4">
              This page allows you to test the OpenID Connect Provider we've integrated with IgniSign.
              Clicking the button below will redirect you to the IgniSign auth server where you can 
              authenticate and authorize this test application to access your IgniSign account.
            </p>
            
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-700">How it works:</h2>
              <ol className="list-decimal pl-5 mt-2 text-gray-600 space-y-1">
                <li>Click the "Start OAuth Flow" button below</li>
                <li>You'll be redirected to the IgniSign authentication/consent page</li>
                <li>After logging in (if needed) and granting consent, you'll be redirected back with an authorization code</li>
                <li>The callback page will exchange the code for tokens</li>
                <li>You'll see your access token and user information</li>
              </ol>
            </div>
            
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-700">Technical Details:</h2>
              <ul className="list-disc pl-5 mt-2 text-gray-600 space-y-1">
                <li>This example uses the PKCE flow, which is recommended for public clients like browser apps</li>
                <li>The code verifier and challenge are generated in the browser</li>
                <li>State parameter is used to prevent CSRF attacks</li>
                <li>The token exchange happens client-side in the callback page</li>
              </ul>
            </div>
            
            <button 
              className={`mt-6 px-6 py-2 rounded-md text-white font-medium 
                ${!oauthUrl ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}`}
              onClick={handleStartOAuth}
              disabled={!oauthUrl}
            >
              Start OAuth Flow
            </button>

            <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-md">
              <h3 className="font-medium">Testing Without Authentication</h3>
              <p className="mt-1">You can test OAuth features without going through the full authentication flow:</p>
              <div className="mt-4">
                <button
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                  onClick={handleToggleTokenTester}
                >
                  {showTokenTester ? "Hide Token Tester" : "Show Token Tester"}
                </button>
              </div>
            </div>

            {showTokenTester && (
              <OAuthTokenTester 
                showTokenInfo={true} 
                onRefreshSuccess={(newTokens) => {
                  if (newTokens.access_token) {
                    // Update login state if we get a valid token
                    setIsLoggedIn(true);
                  }
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthTestPage; 