import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export function generateAppStoreConnectJWT(
  issuerId: string,
  keyId: string,
  privateKeyPem: string
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + 1199, // 20 minutes max limit from Apple
    aud: 'appstoreconnect-v1'
  };

  // Apple expects ES256 algorithm and headers typ: 'JWT', kid: keyId
  return jwt.sign(payload, privateKeyPem, {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: keyId,
      typ: 'JWT'
    }
  });
}

async function fetchWithTimeout(url: string, jwt: string, timeoutMs = 10000): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 401 || response.status === 403) {
      throw new Error('Apple Authentication Failed: Invalid credentials or expired token.');
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Apple API Error (${response.status}): ${errorText || response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout connecting to Apple App Store Connect API.');
    }
    throw error;
  }
}

export async function fetchAppsFromConnect(jwt: string): Promise<any[]> {
  const data = await fetchWithTimeout('https://api.appstoreconnect.apple.com/v1/apps?limit=100', jwt);
  return data.data || [];
}

export interface AppDetailsFromConnect {
  app: any;
  appInfos: any[];
  inAppPurchases: any[];
  subscriptionGroups: any[];
  privacyPolicyUrl?: string;
  ageRating?: string;
  version: string;
}

export async function fetchAppDetails(jwt: string, appId: string): Promise<AppDetailsFromConnect> {
  // Execute detail queries. Wrap sub-resources in try/catch to return partial information if some endpoints fail/are empty.
  const appDataPromise = fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/apps/${appId}`, jwt);
  
  let appInfos: any[] = [];
  let inAppPurchases: any[] = [];
  let subscriptionGroups: any[] = [];
  let privacyPolicyUrl: string | undefined;
  let ageRating: string | undefined;
  let version = '1.0.0';

  const appResponse = await appDataPromise;
  const app = appResponse.data;

  // Fetch App Store Versions
  try {
    const res = await fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/apps/${appId}/appStoreVersions`, jwt);
    if (res.data && res.data.length > 0) {
      version = res.data[0].attributes?.versionString || '1.0.0';
    }
  } catch (err) {
    console.error('[REDACTED] Error fetching App Store Versions:', err);
  }

  // 1. App Infos (localized metadata: description, subtitle, etc.)
  try {
    const res = await fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/apps/${appId}/appInfos`, jwt);
    appInfos = res.data || [];
    // Extract age rating & privacyPolicyUrl from primary appInfo if available
    if (appInfos.length > 0) {
      const attributes = appInfos[0].attributes || {};
      ageRating = attributes.ageRatingDeclaration?.rating; // e.g. FOUR_PLUS
      
      // Fetch appInfoLocalizations for privacy policy
      const infoId = appInfos[0].id;
      const locRes = await fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/appInfos/${infoId}/appInfoLocalizations`, jwt);
      if (locRes.data && locRes.data.length > 0) {
        privacyPolicyUrl = locRes.data[0].attributes?.privacyPolicyUrl;
      }
    }
  } catch (err) {
    console.error('[REDACTED] Error fetching App Infos:', err);
  }

  // 2. In App Purchases V2
  try {
    const res = await fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/apps/${appId}/inAppPurchasesV2`, jwt);
    inAppPurchases = res.data || [];
  } catch (err) {
    console.error('[REDACTED] Error fetching In-App Purchases:', err);
  }

  // 3. Subscription Groups
  try {
    const res = await fetchWithTimeout(`https://api.appstoreconnect.apple.com/v1/apps/${appId}/subscriptionGroups`, jwt);
    subscriptionGroups = res.data || [];
  } catch (err) {
    console.error('[REDACTED] Error fetching Subscription Groups:', err);
  }

  return {
    app,
    appInfos,
    inAppPurchases,
    subscriptionGroups,
    privacyPolicyUrl,
    ageRating,
    version
  };
}

export function encryptKey(text: string, secret: string): string {
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptKey(encryptedText: string, secret: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted key format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const key = crypto.createHash('sha256').update(secret).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
