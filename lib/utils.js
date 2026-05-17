// lib/utils.js
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatDate(dateStr) {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr) {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy · h:mm a');
  } catch {
    return dateStr;
  }
}

export function timeAgo(dateStr) {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return '';
  }
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export const CATEGORY_COLORS = {
  Tech:         { bg: 'rgba(99,102,241,0.12)', text: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  Music:        { bg: 'rgba(217,70,239,0.12)',  text: '#e879f9', border: 'rgba(217,70,239,0.25)' },
  Language:     { bg: 'rgba(20,184,166,0.12)',  text: '#2dd4bf', border: 'rgba(20,184,166,0.25)' },
  Art:          { bg: 'rgba(251,146,60,0.12)',  text: '#fb923c', border: 'rgba(251,146,60,0.25)' },
  Fitness:      { bg: 'rgba(34,197,94,0.12)',   text: '#4ade80', border: 'rgba(34,197,94,0.25)' },
  Lifestyle:    { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
  Games:        { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: 'rgba(239,68,68,0.25)' },
  Professional: { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
};
