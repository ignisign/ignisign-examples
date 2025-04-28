/**
 * Service to handle account information storage
 */

// Define the structure for stored account information
export interface StoredAccountInfo {
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: number; // Unix timestamp when the token expires
  userInfo?: {
    sub: string;
    email?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    [key: string]: any;
  };
  lastUpdated: number; // Timestamp when this info was last updated
}

// Local storage keys
export const STORAGE_KEYS = {
  ACCOUNT_INFO: 'oauth_account_info',
  STATE: 'oauth_state',
  CODE_VERIFIER: 'oauth_code_verifier',
  REFRESH_TOKEN: 'oauth_refresh_token',
};

// Storage type enum
enum StorageType {
  LOCAL,
  SESSION,
  MEMORY
}

export class AccountStorageService {
  private static instance: AccountStorageService;
  private storageType: StorageType;
  private memoryStorage: Record<string, string> = {};

  constructor() {
    this.storageType = this.determineStorageType();
    console.log(`Using storage type: ${StorageType[this.storageType]}`);
  }
  
  /**
   * Determine which storage type to use
   */
  private determineStorageType(): StorageType {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return StorageType.LOCAL;
    } catch (e) {
      try {
        const testKey = '__storage_test__';
        sessionStorage.setItem(testKey, testKey);
        sessionStorage.removeItem(testKey);
        console.warn('LocalStorage not available, using SessionStorage instead. OAuth state will not persist across browser sessions.');
        return StorageType.SESSION;
      } catch (e) {
        console.warn('Both LocalStorage and SessionStorage not available, using in-memory storage. OAuth state will not persist across page reloads.');
        return StorageType.MEMORY;
      }
    }
  }
  
  /**
   * Set an item in the appropriate storage
   */
  private setItem(key: string, value: string): void {
    switch (this.storageType) {
      case StorageType.LOCAL:
        localStorage.setItem(key, value);
        break;
      case StorageType.SESSION:
        sessionStorage.setItem(key, value);
        break;
      case StorageType.MEMORY:
        this.memoryStorage[key] = value;
        break;
    }
  }
  
  /**
   * Get an item from the appropriate storage
   */
  private getItem(key: string): string | null {
    switch (this.storageType) {
      case StorageType.LOCAL:
        return localStorage.getItem(key);
      case StorageType.SESSION:
        return sessionStorage.getItem(key);
      case StorageType.MEMORY:
        return this.memoryStorage[key] || null;
    }
  }
  
  /**
   * Remove an item from the appropriate storage
   */
  private removeItem(key: string): void {
    switch (this.storageType) {
      case StorageType.LOCAL:
        localStorage.removeItem(key);
        break;
      case StorageType.SESSION:
        sessionStorage.removeItem(key);
        break;
      case StorageType.MEMORY:
        delete this.memoryStorage[key];
        break;
    }
  }
  
  /**
   * Save account information to storage
   * @param accountInfo The account information to save
   */
  saveAccountInfo(accountInfo: Partial<StoredAccountInfo>): void {
    try {
      // Get existing account info
      const existingInfo = this.getAccountInfo() || { accessToken: '', lastUpdated: Date.now() };
      
      // Merge with new info
      const updatedInfo: StoredAccountInfo = {
        ...existingInfo,
        ...accountInfo,
        lastUpdated: Date.now(),
      };
      
      this.setItem(STORAGE_KEYS.ACCOUNT_INFO, JSON.stringify(updatedInfo));
      console.log('Account information saved successfully');
    } catch (error) {
      console.error('Failed to save account information:', error);
    }
  }
  
  /**
   * Get account information from storage
   * @returns The stored account information or null if not found
   */
  getAccountInfo(): StoredAccountInfo | null {
    try {
      const info = this.getItem(STORAGE_KEYS.ACCOUNT_INFO);
      if (!info) return null;
      
      return JSON.parse(info) as StoredAccountInfo;
    } catch (error) {
      console.error('Failed to retrieve account information:', error);
      return null;
    }
  }
  
  /**
   * Clear all account information from storage
   */
  clearAccountInfo(): void {
    try {
      this.removeItem(STORAGE_KEYS.ACCOUNT_INFO);
      console.log('Account information cleared');
    } catch (error) {
      console.error('Failed to clear account information:', error);
    }
  }
  
  /**
   * Check if the access token is valid (exists and not expired)
   * @returns True if the token is valid, false otherwise
   */
  isAccessTokenValid(): boolean {
    const info = this.getAccountInfo();
    if (!info || !info.accessToken) return false;
    
    // Check if token has an expiry and if it's still valid
    if (info.tokenExpiry) {
      // Add a 10-second buffer to avoid edge cases
      return Date.now() < (info.tokenExpiry - 10) * 1000;
    }
    
    // If no expiry info, check if token was updated in the last hour (conservative approach)
    return Date.now() - info.lastUpdated < 60 * 60 * 1000;
  }
  
  /**
   * Store OAuth state for CSRF protection
   * @param state The state value
   */
  saveOAuthState(state: string): void {
    try {
      this.setItem(STORAGE_KEYS.STATE, state);
      console.log('OAuth state saved:', state.substring(0, 5) + '...');
    } catch (error) {
      console.error('Failed to save OAuth state:', error);
    }
  }
  
  /**
   * Get stored OAuth state
   * @returns The stored state or null if not found
   */
  getOAuthState(): string | null {
    try {
      const state = this.getItem(STORAGE_KEYS.STATE);
      if (!state) {
        console.warn('No OAuth state found in storage');
      }
      return state;
    } catch (error) {
      console.error('Failed to retrieve OAuth state:', error);
      return null;
    }
  }
  
  /**
   * Clear stored OAuth state
   */
  clearOAuthState(): void {
    try {
      this.removeItem(STORAGE_KEYS.STATE);
      console.log('OAuth state cleared');
    } catch (error) {
      console.error('Failed to clear OAuth state:', error);
    }
  }
  
  /**
   * Store PKCE code verifier
   * @param codeVerifier The code verifier string
   */
  saveCodeVerifier(codeVerifier: string): void {
    try {
      this.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
      console.log('Code verifier saved');
    } catch (error) {
      console.error('Failed to save code verifier:', error);
    }
  }
  
  /**
   * Get stored PKCE code verifier
   * @returns The stored code verifier or null if not found
   */
  getCodeVerifier(): string | null {
    try {
      const verifier = this.getItem(STORAGE_KEYS.CODE_VERIFIER);
      if (!verifier) {
        console.warn('No code verifier found in storage');
        
        // Add debug information for troubleshooting
        this.dumpStorageState();
      }
      return verifier;
    } catch (error) {
      console.error('Failed to retrieve code verifier:', error);
      return null;
    }
  }
  
  /**
   * Clear stored PKCE code verifier
   */
  clearCodeVerifier(): void {
    try {
      this.removeItem(STORAGE_KEYS.CODE_VERIFIER);
      console.log('Code verifier cleared');
    } catch (error) {
      console.error('Failed to clear code verifier:', error);
    }
  }
  
  /**
   * Dump storage state for debugging
   */
  dumpStorageState(): void {
    try {
      console.log('===== Storage Debug Info =====');
      console.log('Storage type:', StorageType[this.storageType]);
      console.log('Local storage available:', this.isLocalStorageAvailable());
      console.log('Session storage available:', this.isSessionStorageAvailable());
      
      // Check key existence without exposing sensitive values
      console.log('Keys status:');
      console.log('- ACCOUNT_INFO exists:', this.getItem(STORAGE_KEYS.ACCOUNT_INFO) !== null);
      console.log('- STATE exists:', this.getItem(STORAGE_KEYS.STATE) !== null);
      console.log('- CODE_VERIFIER exists:', this.getItem(STORAGE_KEYS.CODE_VERIFIER) !== null);
      console.log('- REFRESH_TOKEN exists:', this.getItem(STORAGE_KEYS.REFRESH_TOKEN) !== null);
      
      // Show local storage keys
      if (this.storageType === StorageType.LOCAL) {
        console.log('All localStorage keys:');
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          console.log(`- ${key}`);
        }
      }
      
      console.log('=============================');
    } catch (e) {
      console.error('Error dumping storage state:', e);
    }
  }
  
  /**
   * Check if localStorage is available
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__test_local__';
      localStorage.setItem(testKey, testKey);
      const result = localStorage.getItem(testKey) === testKey;
      localStorage.removeItem(testKey);
      return result;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Check if sessionStorage is available
   */
  private isSessionStorageAvailable(): boolean {
    try {
      const testKey = '__test_session__';
      sessionStorage.setItem(testKey, testKey);
      const result = sessionStorage.getItem(testKey) === testKey;
      sessionStorage.removeItem(testKey);
      return result;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Get the singleton instance
   * @returns The singleton instance
   */
  static getInstance(): AccountStorageService {
    if (!AccountStorageService.instance) {
      AccountStorageService.instance = new AccountStorageService();
    }
    return AccountStorageService.instance;
  }
}

export default AccountStorageService.getInstance(); 