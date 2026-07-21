import { useMemo } from 'preact/hooks';
import type { LogoSpec } from '../data/types';
import { logoSVG } from '../logo/logos';

export function Logo({ spec, size = 48 }: { spec: LogoSpec; size?: number }) {
  const html = useMemo(() => logoSVG(spec, size), [spec, size]);
  return <span style={{ display: 'inline-flex', width: size, height: size }} dangerouslySetInnerHTML={{ __html: html }} />;
}
