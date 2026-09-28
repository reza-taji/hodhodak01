import type { ReactNode } from 'react';

export interface PresetAvatar {
  key: string;
  emoji: string;
  label: string;
  background: string;
}

/**
 * Playful preset avatars for 1st-graders — animals, birds, stars.
 * Keys are stored in the student record; values are pure emoji so the
 * whole catalog costs zero bytes offline.
 */
export const PRESET_AVATARS: PresetAvatar[] = [
  { key: 'preset:hoopoe', emoji: '🐦', label: 'هدهد', background: '#FFE0B2' },
  { key: 'preset:lion', emoji: '🦁', label: 'شیر', background: '#FFF3BF' },
  { key: 'preset:fox', emoji: '🦊', label: 'روباه', background: '#FFD8A8' },
  { key: 'preset:panda', emoji: '🐼', label: 'پاندا', background: '#F1F3F5' },
  { key: 'preset:rabbit', emoji: '🐰', label: 'خرگوش', background: '#F3D9FA' },
  { key: 'preset:cat', emoji: '🐱', label: 'گربه', background: '#FFE8CC' },
  { key: 'preset:owl', emoji: '🦉', label: 'جغد', background: '#E7F5FF' },
  { key: 'preset:butterfly', emoji: '🦋', label: 'پروانه', background: '#D0EBFF' },
  { key: 'preset:unicorn', emoji: '🦄', label: 'تک‌شاخ', background: '#E5DBFF' },
  { key: 'preset:star', emoji: '⭐', label: 'ستاره', background: '#FFF9DB' },
  { key: 'preset:rainbow', emoji: '🌈', label: 'رنگین‌کمان', background: '#E3FAFC' },
  { key: 'preset:rocket', emoji: '🚀', label: 'موشک', background: '#DEE2E6' },
];

/** Preset lookup built once at module level — PRESET_AVATARS never changes. */
export const PRESET_MAP = new Map(PRESET_AVATARS.map((preset) => [preset.key, preset]));

export interface ResolvedAvatar {
  src?: string;
  text?: ReactNode;
  bgcolor?: string;
}

/**
 * Resolves any stored avatar value to Avatar display props.
 * Accepts preset keys, data URLs, bare emoji (seed data), and bare URLs.
 */
export const resolveAvatar = (avatarId: string | undefined): ResolvedAvatar => {
  if (!avatarId) return { text: '🐦' };
  const preset = PRESET_MAP.get(avatarId);
  if (preset) return { text: preset.emoji, bgcolor: preset.background };
  if (avatarId.startsWith('data:image/') || avatarId.startsWith('blob:') || avatarId.startsWith('/')) {
    return { src: avatarId };
  }
  return { text: avatarId };
};
