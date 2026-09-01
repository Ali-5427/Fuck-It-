import { insforge } from './insforge';
import { User } from '../types';
import { store } from './store';
import { ADMIN_EMAILS } from '../config/admin';

export type Unsubscribe = () => void;

export class AuthService {
  private currentUser: User | null = null;
  private unsubscribeAuth: Unsubscribe | null = null;

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener() {
    // Subscribe to InsForge auth changes
    const unsubscribe = insforge.auth.onAuthStateChange(async (event) => {
      if (event === 'signedIn' || event === 'tokenRefreshed') {
        try {
          const { data: userData } = await insforge.auth.getCurrentUser();
          const insUser = userData?.user;
          if (insUser) {
            const { data: rawProfileData } = await insforge.auth.getProfile(insUser.id);
            const profileData: any = rawProfileData;

            let userTier = (profileData?.tier as any) || 'pro';
            const trialEndsAt = profileData?.trialEndsAt as string | undefined;

            if (trialEndsAt && userTier === 'pro') {
              if (Date.now() > new Date(trialEndsAt).getTime()) {
                userTier = 'free';
                await insforge.auth.setProfile({ tier: 'free' }).catch(err => {
                  console.warn('Could not persist auto-downgrade on trial expiration:', err);
                });
              }
            }

            const emailLower = (insUser.email || '').toLowerCase();
            const isWhitelistedAdmin = ADMIN_EMAILS.includes(emailLower);
            const userRole = isWhitelistedAdmin ? 'admin' : 'developer';

            // Auto-promote role to admin in DB if user is whitelisted but not yet admin in DB
            if (isWhitelistedAdmin && profileData?.role !== 'admin') {
              await insforge.auth.setProfile({ role: 'admin' }).catch(err => {
                console.warn('Could not persist auto-promotion to admin role:', err);
              });
            }

            const appUser: User = {
              id: insUser.id,
              email: insUser.email || 'developer@apple.dev',
              name: profileData?.name || insUser.profile?.name || (insUser.email ? insUser.email.split('@')[0] : 'iOS Developer'),
              role: userRole,
              tier: userTier,
              trialEndsAt,
              teamName: (profileData?.teamName as string) || 'Apple Developer Team',
              appleTeamId: (profileData?.appleTeamId as string) || 'APL' + Math.random().toString(36).substring(2, 8).toUpperCase(),
              avatarUrl: profileData?.avatar_url || insUser.profile?.avatar_url || undefined,
              createdAt: insUser.createdAt || new Date().toISOString(),
              settings: {
                notificationsEnabled: profileData?.notificationsEnabled ?? true,
                autoRecheckOnUpload: profileData?.autoRecheckOnUpload ?? true,
                defaultExportFormat: profileData?.defaultExportFormat ?? 'markdown',
                apiKey: profileData?.apiKey || 'ar_pk_live_' + Math.random().toString(36).substring(2, 12)
              }
            };
            this.currentUser = appUser;
            store.setUser(appUser);
          }
        } catch (err) {
          console.warn('Error fetching current user state:', err);
        }
      } else if (event === 'signedOut') {
        this.currentUser = null;
        store.setUser(null);
      }
    });

    this.unsubscribeAuth = () => unsubscribe();

    // Initial check on load
    insforge.auth.getCurrentUser().then(async ({ data: userData }) => {
      const insUser = userData?.user;
      if (insUser) {
        try {
          const { data: rawProfileData } = await insforge.auth.getProfile(insUser.id);
          const profileData: any = rawProfileData;

          let userTier = (profileData?.tier as any) || 'pro';
          const trialEndsAt = profileData?.trialEndsAt as string | undefined;

          if (trialEndsAt && userTier === 'pro') {
            if (Date.now() > new Date(trialEndsAt).getTime()) {
              userTier = 'free';
              await insforge.auth.setProfile({ tier: 'free' }).catch(err => {
                console.warn('Could not persist auto-downgrade on trial expiration:', err);
              });
            }
          }

          const emailLower = (insUser.email || '').toLowerCase();
          const isWhitelistedAdmin = ADMIN_EMAILS.includes(emailLower);
          const userRole = isWhitelistedAdmin ? 'admin' : 'developer';

          // Auto-promote role to admin in DB if user is whitelisted but not yet admin in DB
          if (isWhitelistedAdmin && profileData?.role !== 'admin') {
            await insforge.auth.setProfile({ role: 'admin' }).catch(err => {
              console.warn('Could not persist auto-promotion to admin role:', err);
            });
          }

          const appUser: User = {
            id: insUser.id,
            email: insUser.email || 'developer@apple.dev',
            name: profileData?.name || insUser.profile?.name || (insUser.email ? insUser.email.split('@')[0] : 'iOS Developer'),
            role: userRole,
            tier: userTier,
            trialEndsAt,
            teamName: (profileData?.teamName as string) || 'Apple Developer Team',
            appleTeamId: (profileData?.appleTeamId as string) || 'APL' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            avatarUrl: profileData?.avatar_url || insUser.profile?.avatar_url || undefined,
            createdAt: insUser.createdAt || new Date().toISOString(),
            settings: {
              notificationsEnabled: profileData?.notificationsEnabled ?? true,
              autoRecheckOnUpload: profileData?.autoRecheckOnUpload ?? true,
              defaultExportFormat: profileData?.defaultExportFormat ?? 'markdown',
              apiKey: profileData?.apiKey || 'ar_pk_live_' + Math.random().toString(36).substring(2, 12)
            }
          };
          this.currentUser = appUser;
          store.setUser(appUser);
        } catch (err) {
          console.warn('Error fetching initial user profile:', err);
        }
      }
    }).catch(err => {
      console.warn('Error checking initial auth state:', err);
    });
  }

  // Google OAuth Sign-in
  public async signInWithGoogle(): Promise<User> {
    const { data, error } = await insforge.auth.signInWithOAuth('google', {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
    return {} as User;
  }

  // Email & Password Registration
  public async registerWithEmail(
    email: string, 
    pass: string, 
    name: string, 
    tier: 'free' | 'pro' | 'studio' = 'pro',
    appleTeamId?: string,
    teamName?: string
  ): Promise<User> {
    const { data: regData, error: regError } = await insforge.auth.signUp({
      email,
      password: pass,
      name,
    });
    if (regError) throw regError;
    const insUser = regData?.user;
    if (!insUser) throw new Error('Registration failed.');

    const trialEndsAt = new Date(Date.now() + 30*24*60*60*1000).toISOString();

    const isWhitelistedAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
    const userRole = isWhitelistedAdmin ? 'admin' : 'developer';

    const appUser: User = {
      id: insUser.id,
      email: insUser.email || email,
      name: name || email.split('@')[0],
      role: userRole,
      tier: 'pro',
      trialEndsAt,
      teamName: teamName || 'Indie Studio',
      appleTeamId: appleTeamId || 'DEV' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
      settings: {
        notificationsEnabled: true,
        autoRecheckOnUpload: true,
        defaultExportFormat: 'markdown',
        apiKey: 'ar_pk_live_' + Math.random().toString(36).substring(2, 12)
      }
    };

    const { error: profileError } = await insforge.auth.setProfile({
      name: appUser.name,
      role: appUser.role,
      tier: appUser.tier,
      trialEndsAt: appUser.trialEndsAt,
      teamName: appUser.teamName,
      appleTeamId: appUser.appleTeamId,
      notificationsEnabled: appUser.settings?.notificationsEnabled ?? true,
      autoRecheckOnUpload: appUser.settings?.autoRecheckOnUpload ?? true,
      defaultExportFormat: appUser.settings?.defaultExportFormat ?? 'markdown',
      apiKey: appUser.settings?.apiKey,
    });
    if (profileError) throw profileError;

    this.currentUser = appUser;
    store.setUser(appUser);
    return appUser;
  }

  // Email & Password Login
  public async loginWithEmail(email: string, pass: string): Promise<User> {
    const { data: logData, error: logError } = await insforge.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (logError) throw logError;
    const insUser = logData?.user;
    if (!insUser) throw new Error('User not found.');

    const { data: rawProfileData } = await insforge.auth.getProfile(insUser.id);
    const profileData: any = rawProfileData;

    let userTier = (profileData?.tier as any) || 'pro';
    const trialEndsAt = profileData?.trialEndsAt as string | undefined;

    if (trialEndsAt && userTier === 'pro') {
      if (Date.now() > new Date(trialEndsAt).getTime()) {
        userTier = 'free';
        await insforge.auth.setProfile({ tier: 'free' }).catch(err => {
          console.warn('Could not persist auto-downgrade on trial expiration:', err);
        });
      }
    }

    const emailLower = email.toLowerCase();
    const isWhitelistedAdmin = ADMIN_EMAILS.includes(emailLower);
    const userRole = isWhitelistedAdmin ? 'admin' : 'developer';

    // Auto-promote role to admin in DB if user is whitelisted but not yet admin in DB
    if (isWhitelistedAdmin && profileData?.role !== 'admin') {
      await insforge.auth.setProfile({ role: 'admin' }).catch(err => {
        console.warn('Could not persist auto-promotion to admin role:', err);
      });
    }

    const appUser: User = {
      id: insUser.id,
      email,
      name: profileData?.name || insUser.profile?.name || email.split('@')[0],
      role: userRole,
      tier: userTier,
      trialEndsAt,
      teamName: (profileData?.teamName as string) || 'Apple Developer Team',
      appleTeamId: (profileData?.appleTeamId as string) || 'APL982019',
      createdAt: insUser.createdAt || new Date().toISOString(),
      settings: {
        notificationsEnabled: profileData?.notificationsEnabled ?? true,
        autoRecheckOnUpload: profileData?.autoRecheckOnUpload ?? true,
        defaultExportFormat: profileData?.defaultExportFormat ?? 'markdown',
        apiKey: profileData?.apiKey || 'ar_pk_live_' + Math.random().toString(36).substring(2, 12)
      }
    };

    this.currentUser = appUser;
    store.setUser(appUser);
    return appUser;
  }

  // Password Reset Email
  public async sendPasswordReset(email: string): Promise<void> {
    const { error } = await insforge.auth.sendResetPasswordEmail({
      email,
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) throw error;
  }

  // Sign Out
  public async signOut(): Promise<void> {
    const { error } = await insforge.auth.signOut();
    if (error) throw error;
    this.currentUser = null;
    store.setUser(null);
  }

  // Sync profile updates to InsForge
  public async updateUserProfile(updates: Partial<User>): Promise<void> {
    if (!this.currentUser) return;
    
    const profileUpdate: Record<string, any> = {};
    if (updates.name) profileUpdate.name = updates.name;
    if (updates.tier) profileUpdate.tier = updates.tier;
    if (updates.teamName) profileUpdate.teamName = updates.teamName;
    if (updates.appleTeamId) profileUpdate.appleTeamId = updates.appleTeamId;
    if (updates.avatarUrl) profileUpdate.avatar_url = updates.avatarUrl;
    if (updates.settings) {
      if (updates.settings.notificationsEnabled !== undefined) profileUpdate.notificationsEnabled = updates.settings.notificationsEnabled;
      if (updates.settings.autoRecheckOnUpload !== undefined) profileUpdate.autoRecheckOnUpload = updates.settings.autoRecheckOnUpload;
      if (updates.settings.defaultExportFormat !== undefined) profileUpdate.defaultExportFormat = updates.settings.defaultExportFormat;
      if (updates.settings.apiKey !== undefined) profileUpdate.apiKey = updates.settings.apiKey;
    }

    const { error } = await insforge.auth.setProfile(profileUpdate);
    if (error) throw error;

    this.currentUser = {
      ...this.currentUser,
      ...updates,
      settings: {
        ...(this.currentUser.settings || {}),
        ...(updates.settings || {})
      }
    };
    store.setUser(this.currentUser);
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }
}

export const authService = new AuthService();
