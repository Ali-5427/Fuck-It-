import { NormalizedAppInspection } from '../types';
import { AppDetailsFromConnect } from '../server/appStoreConnect';

/**
 * Maps App Store Connect API details into the unified NormalizedAppInspection format.
 * Connect API metadata provides live store metadata, builds, IAPs, and screenshots.
 */
export function extractFromAppStoreConnect(
  details: AppDetailsFromConnect
): NormalizedAppInspection {
  const { 
    app, 
    appInfos, 
    inAppPurchases, 
    subscriptionGroups, 
    privacyPolicyUrl, 
    supportUrl,
    description: fetchedDescription,
    subtitle: fetchedSubtitle,
    keywords,
    ageRating, 
    version,
    buildNumber,
    minOsVersion,
    usesNonExemptEncryption,
    screenshots 
  } = details;

  // Localized info mapping fallback
  const primaryInfo = appInfos[0]?.attributes || {};
  const name = app.attributes?.name || primaryInfo.name || 'App Store Connect App';
  const subtitle = fetchedSubtitle || primaryInfo.subtitle || undefined;
  const description = fetchedDescription || primaryInfo.description || undefined;

  // Age rating normalization: e.g. "FOUR_PLUS" -> "4+", "TWELVE_PLUS" -> "12+"
  let normalizedAgeRating = '4+';
  if (ageRating) {
    const match = ageRating.match(/^([A-Z_]+)_PLUS$/);
    if (match) {
      const words: Record<string, string> = {
        FOUR: '4',
        NINE: '9',
        TWELVE: '12',
        SEVENTEEN: '17'
      };
      normalizedAgeRating = `${words[match[1]] || match[1]}+`;
    } else if (ageRating === 'NO_RATING') {
      normalizedAgeRating = '4+';
    }
  }

  // Categories
  const category = app.relationships?.primaryCategory?.data?.id || 'Utilities';

  return {
    bundleId: app.attributes?.bundleId || 'UNKNOWN',
    appName: name,
    version: version || '1.0.0',
    build: buildNumber || '1',
    minOSVersion: minOsVersion || 'UNKNOWN',
    targetDevices: ['iPhone', 'iPad'],
    permissions: [],
    entitlements: [],
    urlSchemes: [],
    associatedDomains: [],
    frameworks: [],
    extensions: [],
    backgroundModes: [],
    privacyManifest: {
      hasPrivacyManifest: 'UNKNOWN', // Cannot check via basic Connect metadata
      trackingEnabled: 'UNKNOWN',
      collectedDataTypes: [],
      accessedApiTypes: []
    },
    security: {
      atsAllowsArbitraryLoads: 'UNKNOWN',
      usesNonExemptEncryptionDeclared: usesNonExemptEncryption !== undefined ? usesNonExemptEncryption : 'UNKNOWN'
    },
    features: {
      hasInAppPurchases: inAppPurchases.length > 0,
      hasSubscriptions: subscriptionGroups.length > 0,
      hasThirdPartyAuth: 'UNKNOWN',
      hasSignInWithApple: 'UNKNOWN',
      hasAccountDeletion: 'UNKNOWN',
      hasUserGeneratedContent: 'UNKNOWN',
      hasAdvertising: 'UNKNOWN'
    },
    metadata: {
      name,
      subtitle,
      description,
      keywords,
      privacyPolicyUrl,
      supportUrl: supportUrl || undefined,
      category,
      ageRating: normalizedAgeRating,
      listingProvided: false
    },
    screenshots: screenshots && screenshots.length > 0
      ? screenshots.map((s, idx) => ({
          id: `ss_connect_${idx + 1}`,
          name: `Screenshot ${idx + 1}`,
          width: s.width,
          height: s.height,
          format: 'PNG',
          deviceTarget: s.deviceType || 'iPhone 6.7"',
          aspectRatio: s.height > s.width ? '9:19.5' : '19.5:9',
          isValidSize: true,
          precision: 'EXACT' as const
        }))
      : [],
    rawInfo: details
  };
}

