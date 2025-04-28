/**
 * Utility service for interacting with the OAuth provider
 */

// Get provider URL from environment or use default
const PROVIDER_URL = 'http://localhost:3056';

interface TokenRequestParams {
  grant_type: 'authorization_code' | 'refresh_token';
  client_id: string;
  code?: string;
  code_verifier?: string;
  refresh_token?: string;
  redirect_uri?: string;
}

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

/**
 * OAuth API service for interacting with the OAuth provider
 */
export const OAuthAPI = {
  /**
   * Get the authorization URL to initiate the OAuth flow
   * @param params The authorization parameters
   * @returns The complete authorization URL
   */
  getAuthorizationUrl: (params: {
    client_id: string;
    response_type: string;
    scope: string;
    redirect_uri: string;
    state: string;
    code_challenge: string;
    code_challenge_method: string;
  }): string => {
    const url = new URL(`${PROVIDER_URL}/authorize`);
    
    // Add all parameters to the URL
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    return url.toString();
  },
  
  /**
   * Exchange an authorization code for tokens
   * @param params The token request parameters
   * @returns The token response
   */
  exchangeCodeForToken: async (params: {
    code: string;
    code_verifier: string;
    redirect_uri: string;
    verbose?: boolean;
  }): Promise<TokenResponse> => {
    const verbose = params.verbose || false;
    
    if (verbose) {
      console.log('Exchanging code for token with verbose logging enabled');
      console.log('Code:', params.code);
      console.log('Code verifier length:', params.code_verifier.length);
      console.log('Code verifier prefix:', params.code_verifier.substring(0, 10));
      console.log('Redirect URI:', params.redirect_uri);
    } else {
      console.log('Exchanging code for token with params:', {
        code: params.code,
        code_verifier: `${params.code_verifier.substring(0, 5)}...${params.code_verifier.substring(params.code_verifier.length - 5)}`,
        redirect_uri: params.redirect_uri,
      });
    }
    
    // Check for problematic characters in code_verifier
    const hasSpecialChars = /[.~]/.test(params.code_verifier);
    if (hasSpecialChars) {
      console.warn('Code verifier contains potentially problematic characters (. or ~)');
    }
    
    const tokenParams: Record<string, string> = {
      grant_type: 'authorization_code',
      client_id: 'ignisign-js-example',
      code: params.code,
      code_verifier: params.code_verifier,
      redirect_uri: params.redirect_uri,
    };
    
    // Use URLSearchParams for proper encoding of parameters
    const body = new URLSearchParams();
    Object.entries(tokenParams).forEach(([key, value]) => {
      body.append(key, value);
    });
    
    if (verbose) {
      console.log('Token request body:', body.toString());
    } else {
      console.log('Token request body (partial):', body.toString().substring(0, 50) + '...');
    }
    
    try {
      // Add a small random delay to prevent race conditions (0-200ms)
      const delay = Math.floor(Math.random() * 200);
      if (delay > 0) {
        console.log(`Adding artificial delay of ${delay}ms before token request to prevent race conditions`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const response = await fetch(`${PROVIDER_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString(),
      });
      
      if (!response.ok) {
        // Try to parse error response
        let errorData = {};
        let errorText = '';
        
        try {
          errorText = await response.text();
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            // Not JSON - use the raw text
          }
        } catch (e) {
          // Couldn't get response text
        }
        
        const errorMessage = `Failed to exchange token: ${(errorData as any).error || response.statusText}\nStatus: ${response.status}\n${errorText || ''}`;
        console.error(errorMessage);
        
        // In case of PKCE verification failure, try to provide more context
        if ((errorData as any).error === 'invalid_grant' || errorText.includes('PKCE')) {
          console.error('PKCE verification likely failed. This usually happens when the code_verifier doesn\'t match what was used for the code_challenge.');
        }
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error during token exchange:', error);
      throw error;
    }
  },
  
  /**
   * Refresh an access token using a refresh token
   * @param refreshToken The refresh token
   * @returns The new token response
   */
  refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
    console.log('Refreshing token');
    
    const tokenParams: Record<string, string> = {
      grant_type: 'refresh_token',
      client_id: 'ignisign-js-example',
      refresh_token: refreshToken,
    };
    
    const response = await fetch(`${PROVIDER_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenParams).toString(),
    });
    
    if (!response.ok) {
      // Try to parse error response
      let errorData = {};
      let errorText = '';
      
      try {
        errorText = await response.text();
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Not JSON - use the raw text
        }
      } catch (e) {
        // Couldn't get response text
      }
      
      throw new Error(`Failed to refresh token: ${(errorData as any).error || response.statusText}\nStatus: ${response.status}\n${errorText || ''}`);
    }
    
    return await response.json();
  },
  
  /**
   * Get user information using an access token
   * @param accessToken The access token
   * @returns User information
   */
  getUserInfo: async (accessToken: string): Promise<UserInfo> => {
    const response = await fetch(`${PROVIDER_URL}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`);
    }
    
    return await response.json();
  },
};

export default OAuthAPI; 