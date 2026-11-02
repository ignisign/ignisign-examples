/**
 * SECURITY: URL validation utilities to prevent open redirect vulnerabilities
 */

/**
 * Validates if a URL is safe to open/redirect to
 * Prevents open redirect attacks by checking if URL is from trusted domains
 * @param url - The URL to validate
 * @param allowedDomains - Optional list of allowed domains. Defaults to same-origin only.
 * @returns true if URL is safe, false otherwise
 */
export const isUrlSafe = (url: string, allowedDomains?: string[]): boolean => {
  try {
    // Empty or null URL
    if (!url || url.trim() === '') {
      return false;
    }

    // Parse the URL
    const parsedUrl = new URL(url, window.location.origin);

    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (dangerousProtocols.some(protocol => parsedUrl.protocol.toLowerCase().startsWith(protocol))) {
      console.warn('Blocked URL with dangerous protocol:', parsedUrl.protocol);
      return false;
    }

    // If no allowed domains specified, only allow same-origin
    if (!allowedDomains || allowedDomains.length === 0) {
      return parsedUrl.origin === window.location.origin;
    }

    // Check if URL domain is in allowed list
    const urlHostname = parsedUrl.hostname.toLowerCase();
    return allowedDomains.some(domain => {
      const normalizedDomain = domain.toLowerCase().replace(/^https?:\/\//, '');
      return urlHostname === normalizedDomain || urlHostname.endsWith(`.${normalizedDomain}`);
    });
  } catch (error) {
    console.error('URL validation error:', error);
    return false;
  }
};

/**
 * Opens a URL in a new tab after validating it
 * @param url - The URL to open
 * @param allowedDomains - Optional list of allowed domains
 * @returns true if URL was opened, false if blocked
 */
export const safeWindowOpen = (url: string, allowedDomains?: string[]): boolean => {
  if (!isUrlSafe(url, allowedDomains)) {
    console.error('Blocked attempt to open unsafe URL:', url);
    return false;
  }

  const newWindow = window.open(url, '_blank');
  if (newWindow) {
    // Security: Prevent the new tab from accessing window.opener
    newWindow.opener = null;
    return true;
  }

  return false;
};
