import { Request, Response } from 'express';
import { OAuthService } from '../services/oauth.service';

export class OAuthController {
  constructor(private oauthService: OAuthService = new OAuthService()) {}

  /**
   * Test the API connection with the OAuth token
   */
  public testConnection = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        res.status(400).json({ success: false, message: 'Access token is required' });
        return;
      }
      
      const result = await this.oauthService.testConnection(accessToken);
      res.json(result);
    } catch (error) {
      console.error('Error testing connection:', error);
      res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  };

  /**
   * Refresh an OAuth token
   */
  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ success: false, message: 'Refresh token is required' });
        return;
      }
      
      const result = await this.oauthService.refreshToken(refreshToken);
      res.json(result);
    } catch (error) {
      console.error('Error refreshing token:', error);
      res.status(500).json({ success: false, message: 'Failed to refresh token', error: error.message });
    }
  };

  /**
   * Get user info from the OAuth token
   */
  public getUserInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        res.status(400).json({ success: false, message: 'Access token is required' });
        return;
      }
      
      const userInfo = await this.oauthService.getUserInfo(accessToken);
      res.json(userInfo);
    } catch (error) {
      console.error('Error getting user info:', error);
      res.status(500).json({ success: false, message: 'Failed to get user info', error: error.message });
    }
  };

  /**
   * Initialize an Ignisign client using the OAuth token
   * and test the connection to Ignisign API
   */
  public testIgnisignApi = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        res.status(400).json({ success: false, message: 'Access token is required' });
        return;
      }
      
      const result = await this.oauthService.testIgnisignApi(accessToken);
      res.json(result);
    } catch (error) {
      console.error('Error testing Ignisign API:', error);
      res.status(500).json({ success: false, message: 'Failed to test Ignisign API', error: error.message });
    }
  };

  /**
   * Run API tests for documentation purposes
   */
  public runApiTests = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        res.status(400).json({ success: false, message: 'Access token is required' });
        return;
      }
      
      const results = await this.oauthService.runApiTests(accessToken);
      res.json(results);
    } catch (error) {
      console.error('Error running API tests:', error);
      res.status(500).json({ success: false, message: 'Failed to run API tests', error: error.message });
    }
  };

  /**
   * Exchange authorization code for access and refresh tokens
   */
  public getToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, redirectUri, codeVerifier } = req.body;
      if (!code) {
        res.status(400).json({ success: false, message: 'Authorization code is required' });
        return;
      }
      
      const tokens = await this.oauthService.getToken(code, redirectUri, codeVerifier);
      res.json(tokens);
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      res.status(500).json({ success: false, message: 'Failed to exchange code for token', error: error.message });
    }
  };

  /**
   * Get a refresh token for testing purposes
   * This endpoint should be secured in production!
   */
  public getTestRefreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.oauthService.getTestRefreshToken();
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error getting test refresh token:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get test refresh token', 
        error: error.message 
      });
    }
  };

  /**
   * Validate an access token and return information about it
   */
  public validateToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        res.status(400).json({ success: false, message: 'Access token is required' });
        return;
      }
      
      const result = await this.oauthService.validateToken(accessToken);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error validating token:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to validate token', 
        error: error.message 
      });
    }
  };
}

export default new OAuthController(); 