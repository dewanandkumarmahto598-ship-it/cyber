export function timeAgo(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const days = Math.floor(diffSec / 86400);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const CARD_GRADIENTS = [
  'none', // 0: plain card
  'linear-gradient(135deg, #ff3d6e, #ff9d2e)', // 1: sunset
  'linear-gradient(135deg, #7b2ff7, #ff3d6e)', // 2: violet sunset
  'linear-gradient(135deg, #0ea5e9, #7b2ff7)', // 3: ocean neon
  'linear-gradient(135deg, #10b981, #0ea5e9)', // 4: emerald sky
  'linear-gradient(135deg, #f59e0b, #ef4444)', // 5: solar warm
];

export const CARD_GRADIENT_NAMES = [
  'Clean Plain',
  'Coral Sunrise',
  'Violet Flame',
  'Electric Azure',
  'Emerald Breeze',
  'Solar Amber',
];

export const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
];

export function getLocalUserId(): string {
  try {
    let id = localStorage.getItem('n_current_user_id');
    if (!id) {
      id = 'u_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('n_current_user_id', id);
    }
    return id;
  } catch {
    return 'u_local_user';
  }
}
