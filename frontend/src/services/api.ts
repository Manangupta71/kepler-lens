import type { FeatureDictItem, GuessResult, ModelStats, RoundData } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export async function fetchRound(): Promise<RoundData> {
  const res = await fetch(`${API_BASE_URL}/api/round`);
  if (!res.ok) {
    throw new Error(`Failed to fetch game round: ${res.status} ${res.statusText}`);
  }
  return res.json();
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
  if (!res.ok) {
    throw new Error(`Failed to submit guess: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchFeatures(): Promise<Record<string, FeatureDictItem>> {
  const res = await fetch(`${API_BASE_URL}/api/features`);
  if (!res.ok) {
    throw new Error(`Failed to fetch features dictionary: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchStats(): Promise<ModelStats> {
  const res = await fetch(`${API_BASE_URL}/api/stats`);
  if (!res.ok) {
    throw new Error(`Failed to fetch model stats: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
