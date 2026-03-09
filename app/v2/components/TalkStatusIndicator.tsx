'use client';

export type TalkStatus = 'ok' | 'warning' | 'error';

export interface TalkStatusIndicatorProps {
  status?: TalkStatus;
  hasError?: boolean;
}

export default function TalkStatusIndicator({ status, hasError }: TalkStatusIndicatorProps) {
  const resolved: TalkStatus = status ?? (hasError ? 'error' : 'ok');
  const color =
    resolved === 'error'
      ? 'var(--v2-status-error)'
      : resolved === 'warning'
        ? 'var(--v2-status-warning)'
        : 'var(--v2-status-ok)';

  return (
    <div
      role="status"
      aria-label={resolved === 'error' ? 'Error' : resolved === 'warning' ? 'Connecting' : 'Ready'}
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        boxShadow: `0 0 0 2px var(--v2-bg)`,
      }}
    />
  );
}
