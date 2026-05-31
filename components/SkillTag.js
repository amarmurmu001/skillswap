'use client';

import { CATEGORY_COLORS } from '@/lib/utils';

export default function SkillTag({ skill, variant = 'offer', onRemove, size = 'md' }) {
  if (!skill) return null;

  const colors = CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.Tech;
  const isOffer = variant === 'offer';

  const sizeStyles = {
    sm: { padding: '0.2rem 0.6rem', fontSize: '0.72rem' },
    md: { padding: '0.3rem 0.75rem', fontSize: '0.78rem' },
    lg: { padding: '0.45rem 1rem',   fontSize: '0.875rem' },
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.35rem',
      borderRadius: '9999px',
      fontWeight: 600,
      letterSpacing: '0.01em',
      transition: 'background 0.2s ease, color 0.2s ease, border-color 0.2s ease',
      background: isOffer ? colors.bg : 'rgba(217,70,239,0.1)',
      color: isOffer ? colors.text : '#e879f9',
      border: `1px solid ${isOffer ? colors.border : 'rgba(217,70,239,0.2)'}`,
      ...sizeStyles[size],
    }}>
      {skill.name}
      {onRemove && (
        <button
          onClick={() => onRemove(skill.id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'inherit', opacity: 0.7,
            display: 'flex', alignItems: 'center',
            padding: 0, fontSize: '0.8rem',
            lineHeight: 1,
          }}
          title="Remove"
        >
          ×
        </button>
      )}
    </span>
  );
}
