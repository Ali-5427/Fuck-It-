import { 
  NormalizedAppInspection, 
  Finding, 
  RejectionAnalysisResult, 
  AppMetadataDraft, 
  MetadataIssue,
  ScreenshotValidationResult,
  AdminStats 
} from '../types';
import { insforge } from './insforge';

const DEFAULT_TIMEOUT_MS = 7000;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s. Please try again.`);
    }
    throw new Error(err.message || 'Network request failed. Please check your connection.');
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  async healthCheck() {
    const res = await fetchWithTimeout('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async enhanceAuditWithAI(inspection: NormalizedAppInspection, findings: Finding[]) {
    const res = await fetchWithTimeout('/api/ai/correlate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspection, findings })
    }, 8000);
    if (!res.ok) throw new Error('AI correlation failed');
    return res.json();
  },

  async analyzeRejection(rejectionText: string): Promise<RejectionAnalysisResult> {
    const res = await fetchWithTimeout('/api/rejection/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectionText })
    }, 8000);
    if (!res.ok) throw new Error('Failed to analyze rejection message');
    return res.json();
  },

  async validateMetadata(metadata: AppMetadataDraft): Promise<{ issues: MetadataIssue[]; suggestions: string[] }> {
    const res = await fetchWithTimeout('/api/metadata/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metadata })
    });
    if (!res.ok) throw new Error('Failed to validate metadata');
    return res.json();
  },

  async validateScreenshot(width: number, height: number, fileName: string): Promise<ScreenshotValidationResult> {
    const res = await fetchWithTimeout('/api/screenshots/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ width, height, fileName })
    });
    if (!res.ok) throw new Error('Failed to validate screenshot');
    return res.json();
  },

  async getAdminStats(): Promise<AdminStats> {
    const token = await insforge.getHttpClient().getValidAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchWithTimeout('/api/admin/stats', { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch admin stats (status ${res.status})`);
    }
    return res.json();
  },

  async getAdminRules() {
    const token = await insforge.getHttpClient().getValidAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchWithTimeout('/api/admin/rules', { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch admin rules (status ${res.status})`);
    }
    return res.json();
  },

  async tryNow(query: string): Promise<{ inspection: NormalizedAppInspection; auditRun: any }> {
    const res = await fetchWithTimeout('/api/try-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    }, 8000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to check app via iTunes search');
    }
    return res.json();
  },

  async saveConnectKey(issuerId: string, keyId: string, privateKeyPem: string): Promise<{ success: boolean; maskedKey: string }> {
    const token = await insforge.getHttpClient().getValidAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchWithTimeout('/api/connect/save-key', {
      method: 'POST',
      headers,
      body: JSON.stringify({ issuerId, keyId, privateKeyPem })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save App Store Connect key.');
    }
    return res.json();
  },

  async listConnectApps(): Promise<{ connected: boolean; maskedKey?: string; apps: any[] }> {
    const token = await insforge.getHttpClient().getValidAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchWithTimeout('/api/connect/list-apps', {
      method: 'POST',
      headers
    }, 8000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to list apps from App Store Connect.');
    }
    return res.json();
  },

  async checkConnectApp(appId: string): Promise<{ inspection: NormalizedAppInspection; auditRun: any }> {
    const token = await insforge.getHttpClient().getValidAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchWithTimeout('/api/connect/check-app', {
      method: 'POST',
      headers,
      body: JSON.stringify({ appId })
    }, 8000);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to run audit check.');
    }
    return res.json();
  },

  async removeConnectKey(): Promise<{ success: boolean }> {
    const token = await insforge.getHttpClient().getValidAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchWithTimeout('/api/connect/remove-key', {
      method: 'DELETE',
      headers
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to disconnect key.');
    }
    return res.json();
  }
};
