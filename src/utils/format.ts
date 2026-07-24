/** Small formatting helpers used across the UI. */

export function formatTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatLastSeen(user?: { isOnline?: boolean; lastSeen?: string }): string {
  if (!user) return '';
  if (user.isOnline) return 'online';
  if (!user.lastSeen) return 'last seen recently';
  const diffMin = Math.round((Date.now() - new Date(user.lastSeen).getTime()) / 60000);
  if (diffMin < 1) return 'last seen just now';
  if (diffMin < 60) return `last seen ${diffMin}m ago`;
  const hrs = Math.round(diffMin / 60);
  if (hrs < 24) return `last seen ${hrs}h ago`;
  return `last seen ${Math.round(hrs / 24)}d ago`;
}

export function formatPrice(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
}

const PALETTE = ['#2E7CF6', '#2BB673', '#F5A623', '#E5484D', '#8E5CF6', '#0FB5BA'];

export function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}
