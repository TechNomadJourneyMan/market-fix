'use client';

import * as React from 'react';

/**
 * Следит за классом `dark` на <html>, который ставит наш theme-toggle.
 * Нужен, чтобы карта переключала светлые/тёмные тайлы вместе с интерфейсом.
 */
export function useIsDarkTheme() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const root = document.documentElement;
    const read = () => setIsDark(root.classList.contains('dark'));

    read();

    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return isDark;
}
