import { NormalizedAppInspection } from '../types';
import { AppDetailsFromConnect } from '../server/appStoreConnect';

/**
 * Note: This extractor maps App Store Connect API details into the unified NormalizedAppInspection format.
 * Since it is a listing-level data source, binary-level details like local frameworks, permissions,
 * and entitlements are marked as empty/defaulted.
 */
export function extractFromAppStoreConnect(
  details: AppDetailsFromConnect
): NormalizedAppInspection {
  const { app, appInfos, inAppPurchases, subscriptionGroups, privacyPolicyUrl, ageRating, version } = details;

  // Localized info mapping
  const primaryInfo = appInfos[0]?.attributes || {};
  const name = app.attributes?.name || primaryInfo.name || 'App Store Connect App';
  const subtitle = primaryInfo.subtitle || undefined;
  const description = primaryInfo.description || undefined;

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
    build: '1',
    minOSVersion: 'UNKNOWN',
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
      usesNonExemptEncryptionDeclared: 'UNKNOWN'
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
      privacyPolicyUrl,
      supportUrl: undefined, // Connect API doesn't expose support URL in basic response
      category,
      ageRating: normalizedAgeRating,
      listingProvided: false
    },
    screenshots: [], // Screenshot scanning is not supported via basic App Store Connect API lookup
    rawInfo: details
  };
}
