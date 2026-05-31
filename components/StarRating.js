'use client';

import { useState } from 'react';

export default function StarRating({ value = 0, onChange, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  const sizePx = { sm: '1rem', md: '1.35rem', lg: '1.6rem' }[size] || '1.35rem';

  return (
    <div style={{ display: 'flex', gap: 4 }} role={readonly ? 'img' : 'radiogroup'} aria-label={`Rating: ${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          role={readonly ? undefined : 'radio'}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          aria-checked={readonly ? undefined : star === display}
          tabIndex={readonly ? -1 : 0}
          onClick={() => !readonly && onChange && onChange(star)}
          onKeyDown={!readonly ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(star); } } : undefined}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            fontSize: sizePx,
            cursor: readonly ? 'default' : 'pointer',
            transition: 'color 0.15s ease, transform 0.15s ease, filter 0.15s ease',
            color: star <= display ? '#fbbf24' : 'rgba(160,160,192,0.3)',
            filter: star <= display ? 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' : 'none',
            transform: (!readonly && star <= hovered) ? 'scale(1.2)' : 'scale(1)',
            display: 'inline-block',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
