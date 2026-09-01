import { Application, AuditRun, NormalizedAppInspection, User } from '../types';
import { evaluateInspection } from '../engine/evaluator';

export const SEED_USERS: User[] = [
  {
    id: 'user_dev_01',
    email: 'developer@example.com',
    name: 'Lead iOS Engineer',
    role: 'developer',
    tier: 'pro',
    teamName: 'Apex Mobile Labs',
    appleTeamId: 'APEX892K9L',
    token: 'ar_live_sec_9942a188fbc72a',
    createdAt: '2026-08-01T10:00:00Z',
    settings: {
      notificationsEnabled: true,
      autoRecheckOnUpload: true,
      defaultExportFormat: 'markdown',
      apiKey: 'ar_pk_live_83921049281'
    }
  }
];

export const INITIAL_INSPECTIONS: Record<string, NormalizedAppInspection> = {
  // Single lightweight sample application
  app_fittrack: {
    bundleId: 'com.example.fittrack',
    appName: 'FitTrack Pro (Sample)',
    version: '1.4.0',
    build: '42',
    minOSVersion: '17.0',
    targetDevices: ['iPhone', 'Apple Watch'],
    permissions: [
      { key: 'NSCameraUsageDescription', description: 'Barcode scanning for food nutrition label logging', detected: true, status: 'DETECTED' },
      { key: 'NSLocationWhenInUseUsageDescription', description: 'Track distance and outdoor running route paths', detected: true, status: 'DETECTED' },
      { key: 'NSHealthShareUsageDescription', description: 'Read steps and heart rate to calculate daily calorie metrics', detected: true, status: 'DETECTED' },
      { key: 'NSPhotoLibraryUsageDescription', description: 'Select profile photo', detected: true, status: 'DETECTED' },
      { key: 'NSUserTrackingUsageDescription', description: '', detected: false, status: 'NOT_DETECTED' }
    ],
    entitlements: ['com.apple.developer.healthkit', 'com.apple.developer.associated-domains'],
    urlSchemes: ['fittrack'],
    associatedDomains: ['applinks:fittrack.example.com'],
    frameworks: ['GoogleSignIn', 'RevenueCat', 'StoreKit', 'HealthKit', 'FirebaseAnalytics'],
    extensions: ['FitTrackWatchExtension', 'FitTrackWidget'],
    backgroundModes: ['location'],
    privacyManifest: {
      hasPrivacyManifest: true,
      trackingEnabled: false,
      collectedDataTypes: ['Fitness', 'Health', 'Contact Info'],
      accessedApiTypes: []
    },
    security: {
      atsAllowsArbitraryLoads: false,
      usesNonExemptEncryptionDeclared: true,
      usesNonExemptEncryptionValue: false
    },
    features: {
      hasInAppPurchases: true,
      hasSubscriptions: true,
      hasThirdPartyAuth: true,
      hasSignInWithApple: false,
      hasAccountDeletion: false,
      hasUserGeneratedContent: false,
      hasAdvertising: false
    },
    metadata: {
      name: 'FitTrack Pro: Workout & Run',
      subtitle: 'GPS Running & Calorie Tracker',
      description: 'FitTrack Pro helps you log daily workouts, monitor active heart zones, and sync with Apple Health. Includes GPS run tracking and nutrition logging.',
      keywords: 'fitness,running,gps,calorie tracker,health,workout,intervals',
      supportUrl: 'https://example.com/fittrack/support',
      privacyPolicyUrl: 'https://example.com/fittrack/privacy',
      category: 'Health & Fitness',
      ageRating: '4+'
    },
    screenshots: [
      { id: 'sc1', name: '01_Dashboard.png', width: 1290, height: 2796, format: 'PNG', deviceTarget: 'iPhone 15 Pro Max', aspectRatio: '19.5:9', isValidSize: true },
      { id: 'sc2', name: '02_GPS_Run.png', width: 1290, height: 2796, format: 'PNG', deviceTarget: 'iPhone 15 Pro Max', aspectRatio: '19.5:9', isValidSize: true }
    ]
  }
};

export function createInitialSeedApps(): Application[] {
  return [
    {
      id: 'app_fittrack',
      userId: 'user_dev_01',
      name: 'FitTrack Pro (Sample)',
      bundleId: 'com.example.fittrack',
      primaryCategory: 'Health & Fitness',
      currentVersion: '1.4.0',
      currentBuild: '42',
      createdAt: '2026-08-10T14:22:00Z',
      updatedAt: '2026-08-25T01:00:00Z',
      lastAuditDate: '2026-08-25T01:00:00Z',
      lastAuditStatus: 'NOT_READY',
      remainingIssuesCount: 4,
      isDemo: true
    }
  ];
}

export function createInitialSeedAudits(): Record<string, AuditRun[]> {
  const auditsMap: Record<string, AuditRun[]> = {};

  Object.entries(INITIAL_INSPECTIONS).forEach(([appId, inspection]) => {
    const audit = evaluateInspection(inspection, appId, inspection.build, inspection.version);
    auditsMap[appId] = [audit];
  });

  return auditsMap;
}
