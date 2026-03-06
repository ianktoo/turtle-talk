'use client';

import type { ReactNode, ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'danger' | 'gold' | 'ghost' | 'connect';

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--tt-grad-primary)',
    boxShadow: 'var(--tt-shadow-primary)',
    border: '2px solid rgba(255,255,255,0.25)',
    color: '#ffffff',
  },
  danger: {
    background: 'var(--tt-grad-danger)',
    boxShadow: 'var(--tt-shadow-danger)',
    border: '2px solid rgba(255,255,255,0.25)',
    color: '#ffffff',
  },
  gold: {
    background: 'var(--tt-grad-gold)',
    boxShadow: 'var(--tt-shadow-gold)',
    border: '2px solid rgba(255,255,255,0.25)',
    color: '#ffffff',
  },
  ghost: {
    background: 'var(--tt-ghost-bg)',
    boxShadow: 'none',
    border: '1px solid var(--tt-ghost-border)',
    color: '#ffffff',
  },
  connect: {
    background: 'var(--tt-grad-connect)',
    boxShadow: 'none',
    border: '2px solid rgba(255,255,255,0.25)',
    color: '#ffffff',
    opacity: 0.85,
  },
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  icon,
  children,
  className = '',
  style,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      data-variant={variant}
      disabled={disabled}
      className={`tt-tap-shake active:scale-[0.98] active:opacity-90 ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 'var(--tt-btn-height)',
        padding: '10px 24px',
        borderRadius: 'var(--tt-radius-pill)',
        fontSize: 'var(--tt-btn-font-size)',
        fontWeight: 'var(--tt-btn-font-weight)' as React.CSSProperties['fontWeight'],
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.6 : 1,
        transition: `background var(--tt-transition-mid), box-shadow var(--tt-transition-mid)`,
        ...VARIANT_STYLES[variant],
        ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
