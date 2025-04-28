import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import accountStorage, { StoredAccountInfo } from '../utils/account-storage.service';
import { OAuthAPI } from '../utils/oauth-api';
import { ApiService } from '../services/api.service';

interface AuthContextType {
  isAuthenticated: boolean;
  userInfo: any | null;
  isLoading: boolean;
  login: (accessToken: string, refreshToken?: string, expiresIn?: number, userInfo?: any) => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  getAccessToken: () => string | null;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userInfo: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  refreshToken: async () => false,
  getAccessToken: () => null,
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tokenInfo, setTokenInfo] = useState<{
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
  }>({
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  });

  // Initialize auth state from storage on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const accountInfo = accountStorage.getAccountInfo();
        
        if (accountInfo && accountStorage.isAccessTokenValid()) {
          // We have a valid token
          setIsAuthenticated(true);
          setUserInfo(accountInfo.userInfo || null);
          setTokenInfo({
            accessToken: accountInfo.accessToken,
            refreshToken: accountInfo.refreshToken || null,
            expiresAt: accountInfo.tokenExpiry || null,
          });
          
          // Test connection to verify the token is still valid
          try {
            await ApiService.oauthTestConnection(accountInfo.accessToken);
          } catch (error) {
            console.error('Error testing connection with stored token:', error);
            // If the token is invalid, log out
            logout();
            return;
          }
        } else {
          // No valid token, clean up
          setIsAuthenticated(false);
          setUserInfo(null);
          setTokenInfo({
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // In case of error, log out
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  // Log in function
  const login = (
    accessToken: string, 
    refreshToken?: string, 
    expiresIn?: number, 
    userInfoData?: any
  ) => {
    if (!accessToken) {
      console.error('No access token provided for login');
      return;
    }
    
    // Calculate token expiry
    const expiresAt = expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : null;
    
    // Update state
    setIsAuthenticated(true);
    setUserInfo(userInfoData || null);
    setTokenInfo({
      accessToken,
      refreshToken: refreshToken || null,
      expiresAt,
    });
    
    // Save to storage
    accountStorage.saveAccountInfo({
      accessToken,
      refreshToken,
      tokenExpiry: expiresAt || undefined,
      userInfo: userInfoData || undefined,
    });
  };

  // Log out function
  const logout = () => {
    // Clear auth state
    setIsAuthenticated(false);
    setUserInfo(null);
    setTokenInfo({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    });
    
    // Clear storage
    accountStorage.clearAccountInfo();
    accountStorage.clearOAuthState();
    accountStorage.clearCodeVerifier();
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    if (!tokenInfo.refreshToken) {
      console.error('No refresh token available');
      return false;
    }
    
    try {
      const refreshData = await ApiService.oauthRefreshToken(tokenInfo.refreshToken);
      
      // Get new user info if available
      let newUserInfo = userInfo;
      if (refreshData.access_token) {
        try {
          newUserInfo = await ApiService.oauthGetUserInfo(refreshData.access_token);
        } catch (userInfoError) {
          console.error('Error fetching user info after token refresh:', userInfoError);
        }
      }
      
      // Update tokens
      login(
        refreshData.access_token,
        refreshData.refresh_token || tokenInfo.refreshToken,
        refreshData.expires_in,
        newUserInfo
      );
      
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      
      // If refresh fails, log out
      logout();
      return false;
    }
  };
  
  // Function to get the access token (will try to refresh if needed)
  const getAccessToken = (): string | null => {
    if (!tokenInfo.accessToken) return null;
    
    // Check if token needs refresh and there's a refresh token
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (tokenInfo.expiresAt && nowInSeconds >= tokenInfo.expiresAt && tokenInfo.refreshToken) {
      // Token is expired and we have a refresh token
      // Start refresh in background, but still return the current token
      // This allows the app to continue working while refreshing
      refreshToken().catch(console.error);
    }
    
    return tokenInfo.accessToken;
  };

  // Create the context value object
  const contextValue: AuthContextType = {
    isAuthenticated,
    userInfo,
    isLoading,
    login,
    logout,
    refreshToken,
    getAccessToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 