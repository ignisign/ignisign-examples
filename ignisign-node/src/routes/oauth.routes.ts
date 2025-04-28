import { Router } from 'express';
import OAuthController from '../controllers/oauth.controller';

const router = Router();

// Test the connection with an access token
router.post('/test-connection', OAuthController.testConnection);

// Refresh an OAuth token
router.post('/refresh-token', OAuthController.refreshToken);

// Get user information
router.post('/user-info', OAuthController.getUserInfo);

// Test Ignisign API integration
router.post('/test-ignisign-api', OAuthController.testIgnisignApi);

// Run API tests
router.post('/run-api-tests', OAuthController.runApiTests);

// Exchange authorization code for tokens
router.post('/token', OAuthController.getToken);

// Get a refresh token for testing (development only)
router.get('/test-refresh-token', OAuthController.getTestRefreshToken);

// Validate an access token
router.post('/validate-token', OAuthController.validateToken);

export default router; 