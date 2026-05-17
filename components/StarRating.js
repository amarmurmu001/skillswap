'use client';

import { useState } from 'react';

export default function StarRating({ value = 0, onChange, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  const sizePx = { sm: '1rem', md: '1.35rem', lg: '1.6rem' }[size] || '1.35rem';

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            fontSize: sizePx,
            cursor: readonly ? 'default' : 'pointer',
            transition: 'all 0.15s ease',
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
