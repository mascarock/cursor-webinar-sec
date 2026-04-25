import { colorFor, initials } from '../utils';

type AvatarSize = 'sm' | 'lg';

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  /** Extra class names to add (e.g. for the tiny chip variant) */
  className?: string;
  style?: React.CSSProperties;
}

export default function Avatar({ name, size, className, style }: AvatarProps) {
  const cls = ['avatar', size ? `avatar-${size}` : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return (
    <span className={cls} style={{ background: colorFor(name), ...style }}>
      {initials(name)}
    </span>
  );
}
