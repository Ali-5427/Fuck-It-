import { NormalizedAppInspection } from '../types';

/**
 * Note: This data source only supports listing-level checks, not binary-level checks.
 * Entitlements, permissions, and other local code checks are marked as UNKNOWN.
 */
export async function extractFromItunesLookup(appNameOrId: string): Promise<NormalizedAppInspection | null> {
  try {
    let url = '';
    const idMatch = appNameOrId.match(/id(\d+)/);
    const isId = /^\d+$/.test(appNameOrId);

    if (idMatch) {
      url = `https://itunes.apple.com/lookup?id=${idMatch[1]}`;
    } else if (isId) {
      url = `https://itunes.apple.com/lookup?id=${appNameOrId}`;
    } else {
      url = `https://itunes.apple.com/search?term=${encodeURIComponent(appNameOrId)}&entity=software&limit=1`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    
    let response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        throw new Error('TIMEOUT');
      }
      throw new Error('NETWORK_ERROR');
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      return null;
    }

    const app = data.results[0];

    // Screenshots mapping
    const screenshots: NormalizedAppInspection['screenshots'] = [];
    
    // Estimate size and mark as UNKNOWN precision
    if (app.screenshotUrls && Array.isArray(app.screenshotUrls)) {
      app.screenshotUrls.forEach((sUrl: string, index: number) => {
        screenshots.push({
          id: `screenshot_iphone_${index}`,
          name: `iPhone Screenshot ${index + 1}`,
          width: 1290, // Typical 6.7" iPhone width
          height: 2796, // Typical 6.7" iPhone height
          format: 'png',
          deviceTarget: 'iPhone',
          aspectRatio: '9:19.5',
          precision: 'UNKNOWN'
        });
      });
    }

    if (app.ipadScreenshotUrls && Array.isArray(app.ipadScreenshotUrls)) {
      app.ipadScreenshotUrls.forEach((sUrl: string, index: number) => {
        screenshots.push({
          id: `screenshot_ipad_${index}`,
          name: `iPad Screenshot ${index + 1}`,
          width: 2048, // Typical 12.9" iPad width
          height: 2732, // Typical 12.9" iPad height
          format: 'png',
          deviceTarget: 'iPad',
          aspectRatio: '3:4',
          precision: 'UNKNOWN'
        });
      });
    }

    const inspection: NormalizedAppInspection = {
      bundleId: app.bundleId || 'UNKNOWN',
      appName: app.trackName || appNameOrId,
      version: app.version || 'UNKNOWN',
      build: '1',
      minOSVersion: app.minimumOsVersion || 'UNKNOWN',
      targetDevices: app.supportedDevices || ['iPhone', 'iPad'],
      permissions: [], // Keep empty / UNKNOWN
      entitlements: [], // Keep empty
      urlSchemes: [],
      associatedDomains: [],
      frameworks: [],
      extensions: [],
      backgroundModes: [],
      privacyManifest: {
        hasPrivacyManifest: false, // Cannot detect from iTunes
        trackingEnabled: false,
        collectedDataTypes: [],
        accessedApiTypes: []
      },
      security: {
        atsAllowsArbitraryLoads: false,
        usesNonExemptEncryptionDeclared: false
      },
      features: {
        hasInAppPurchases: false,
        hasSubscriptions: false,
        hasThirdPartyAuth: false,
        hasSignInWithApple: false,
        hasAccountDeletion: false,
        hasUserGeneratedContent: false,
        hasAdvertising: false
      },
      metadata: {
        name: app.trackName,
        subtitle: app.trackCensoredName !== app.trackName ? app.trackCensoredName : undefined,
        description: app.description,
        supportUrl: app.sellerUrl,
        privacyPolicyUrl: undefined,
        category: app.primaryGenreName,
        ageRating: app.contentAdvisoryRating,
        listingProvided: true
      },
      screenshots,
      rawInfo: app
    };

    return inspection;
  } catch (error: any) {
    console.error('iTunes Extractor Error:', error);
    if (error.message === 'TIMEOUT' || error.message === 'NETWORK_ERROR') {
      throw error;
    }
    return null;
  }
}
