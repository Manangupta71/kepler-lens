import type { FeatureDictItem, GuessResult, ModelStats, RoundData } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function parseJsonResponse<T>(res: Response, endpoint: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    throw new Error(`Server returned error ${res.status} (${res.statusText}) on ${endpoint}`);
  }

  if (contentType.includes('text/html')) {
    const text = await res.text();
    if (text.trim().startsWith('<!doctype') || text.trim().startsWith('<html')) {
      throw new Error(
        `Backend API not connected: received HTML instead of JSON. Ensure VITE_API_BASE_URL is set in your Vercel Environment Variables to your Railway backend URL (e.g. https://kepler-lens-production.up.railway.app) and redeployed.`
      );
    }
  }

  try {
    return await res.json();
  } catch {
    throw new Error(
      `Could not parse JSON response from backend. Verify that VITE_API_BASE_URL is pointing to a live FastAPI instance.`
    );
  }
}

export async function fetchRound(): Promise<RoundData> {
  const res = await fetch(`${API_BASE_URL}/api/round`);
  return parseJsonResponse<RoundData>(res, '/api/round');
}

export async function submitGuess(
  id: string,
  guess: 'CONFIRMED' | 'FALSE POSITIVE'
): Promise<GuessResult> {
  const res = await fetch(`${API_BASE_URL}/api/guess`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, guess }),
  });
  return parseJsonResponse<GuessResult>(res, '/api/guess');
}

export async function fetchFeatures(): Promise<Record<string, FeatureDictItem>> {
  const res = await fetch(`${API_BASE_URL}/api/features`);
  return parseJsonResponse<Record<string, FeatureDictItem>>(res, '/api/features');
}

export async function fetchStats(): Promise<ModelStats> {
  const res = await fetch(`${API_BASE_URL}/api/stats`);
  return parseJsonResponse<ModelStats>(res, '/api/stats');
}
