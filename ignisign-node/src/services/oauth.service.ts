import axios from 'axios';
import { IGNISIGN_APPLICATION_ENV } from '@ignisign/public';
import { IgnisignSdk, IgnisignSdkUtilsService } from '@ignisign/sdk';

// Provider URL from environment or using default
const PROVIDER_URL = process.env.OAUTH_PROVIDER_URL || 'http://localhost:3056';
const IGNISIGN_SERVER_URL = process.env.IGNISIGN_SERVER_URL || 'http://localhost:3101';

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

interface ApiTestResult {
  endpoint: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

export class OAuthService {
  /**
   * Test the connection with an access token
   */
  async testConnection(accessToken: string): Promise<{ success: boolean, message: string, userData?: any }> {
    try {
      const url = `${IGNISIGN_SERVER_URL}/v4/users/me`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      // console.log('Connection test response:', response.data);
      
      return {
        success: true,
        message: 'Connection successful! Your access token is valid.',
        userData: response.data
      };
    } catch (error) {
      console.error('Connection test failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Refresh an OAuth token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      console.log('Refreshing token with refresh token:', refreshToken);
      
      // Prepare token request parameters
      const tokenParams = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: 'ignisign-js-example',
        refresh_token: refreshToken,
      });
      
      // Make the request to the OAuth provider
      const response = await axios.post(`${PROVIDER_URL}/token`, tokenParams.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
      
      console.log('Token refresh successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      if (error.response) {
        throw new Error(`Failed to refresh token: ${error.response.data.error || error.response.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Get user information using an access token
   */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    try {
      const response = await axios.get(`${PROVIDER_URL}/userinfo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting user info:', error);
      if (error.response) {
        throw new Error(`Failed to get user info: ${error.response.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Initialize Ignisign client with the access token and test it
   */
  async testIgnisignApi(accessToken: string): Promise<{ success: boolean, message: string, data?: any }> {
    try {
      const url = `${IGNISIGN_SERVER_URL}/v4/users/me`;
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      
      return {
        success: true,
        message: 'Successfully connected to Ignisign API',
        data: response.data
      };
    } catch (error) {
      console.error('Error testing Ignisign API:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Simulate getting application metadata using the access token
   */
  private async getAppMetadata(accessToken: string): Promise<any> {
    try {
      // Here we would initialize the Ignisign SDK with the OAuth token
      // For now, we'll just call a simulated API endpoint
      // In a real implementation, you would use the actual SDK methods
      
      // Normally we would do:
      // const { appId, appEnv } = IgnisignSdkUtilsService.exportAppIdAndEnv(accessToken)
      
      // But for demo purposes, we'll just return a sample response
      return {
        appId: 'oauth-example-app',
        appEnv: IGNISIGN_APPLICATION_ENV.DEVELOPMENT,
        features: ['signatures', 'webhooks', 'oauth'],
        tokenType: 'oauth'
      };
    } catch (error) {
      console.error('Error getting app metadata:', error);
      throw error;
    }
  }

  /**
   * Run a series of API tests and return results
   */
  async runApiTests(accessToken: string): Promise<ApiTestResult[]> {
    const results: ApiTestResult[] = [];
    
    // Test 1: User Info
    try {
      const startTime = Date.now();
      const userInfo = await this.getUserInfo(accessToken);
      results.push({
        endpoint: 'User Info',
        success: true,
        data: userInfo,
        duration: Date.now() - startTime
      });
    } catch (error) {
      results.push({
        endpoint: 'User Info',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: 0
      });
    }

    // Test 2: Ignisign API Connection
    try {
      const startTime = Date.now();
      const ignisignResult = await this.testIgnisignApi(accessToken);
      results.push({
        endpoint: 'Ignisign API',
        success: ignisignResult.success,
        data: ignisignResult.data,
        error: !ignisignResult.success ? ignisignResult.message : undefined,
        duration: Date.now() - startTime
      });
    } catch (error) {
      results.push({
        endpoint: 'Ignisign API',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: 0
      });
    }
    
    // Test 3: Token Validation Test
    try {
      const startTime = Date.now();
      const validationResult = await this.validateToken(accessToken);
      results.push({
        endpoint: 'Token Validation',
        success: validationResult.valid,
        data: {
          isValid: validationResult.valid,
          expiresIn: validationResult.expiresIn,
          scope: validationResult.scope
        },
        error: !validationResult.valid ? 'Token validation failed' : undefined,
        duration: Date.now() - startTime
      });
    } catch (error) {
      results.push({
        endpoint: 'Token Validation',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: 0
      });
    }
    
    return results;
  }
  
  /**
   * Validate an access token and return information about it
   */
  async validateToken(accessToken: string): Promise<{ 
    valid: boolean; 
    expiresIn?: number; 
    scope?: string;
    tokenInfo?: any;
  }> {
    try {
      // In a real implementation, you would call an introspection endpoint
      // For this example, we'll simulate a validation
      
      const response = await axios.get(`${PROVIDER_URL}/introspect`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }).catch(() => {
        // If introspection endpoint is not available, we'll check userinfo instead
        return axios.get(`${PROVIDER_URL}/userinfo`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
      });
      
      // If we get here, the token is valid
      return {
        valid: true,
        expiresIn: 3600, // Simulate 1 hour expiry
        scope: 'openid profile email',
        tokenInfo: response.data
      };
    } catch (error) {
      console.error('Token validation failed:', error);
      return {
        valid: false
      };
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async getToken(code: string, redirectUri?: string, codeVerifier?: string): Promise<TokenResponse> {
    try {
      console.log('Exchanging code for token:', {
        code: code,
        redirectUri: redirectUri,
        codeVerifier: codeVerifier ? `${codeVerifier.substring(0, 5)}...` : undefined
      });
      
      // Prepare token request parameters
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: 'ignisign-js-example',
        code: code,
      });

      // Add redirect URI if provided
      if (redirectUri) {
        tokenParams.append('redirect_uri', redirectUri);
      }
      
      // Add code verifier for PKCE if provided
      if (codeVerifier) {
        tokenParams.append('code_verifier', codeVerifier);
      }
      
      // Make the request to the OAuth provider
      const response = await axios.post(`${PROVIDER_URL}/token`, tokenParams.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
      
      console.log('Token exchange successful');
      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      if (error.response) {
        throw new Error(`Failed to exchange code for token: ${error.response.data.error || error.response.statusText}`);
      }
      throw error;
    }
  }
  
  /**
   * Get a new refresh token for testing purposes
   * This is a simulated method for development/testing only
   */
  async getTestRefreshToken(): Promise<{ refresh_token: string; expires_in: number; }> {
    try {
      // In a real-world scenario, this would be an authenticated admin endpoint
      // that generates test tokens for development purposes
      
      // For this example, we're simulating the response
      return {
        refresh_token: `test-refresh-token-${Date.now()}`,
        expires_in: 86400 // 24 hours
      };
    } catch (error) {
      console.error('Error generating test refresh token:', error);
      throw new Error('Failed to generate test refresh token');
    }
  }
}

export default new OAuthService(); 