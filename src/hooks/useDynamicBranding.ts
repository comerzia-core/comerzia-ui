import { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';

const DEFAULT_ICON = '/shop_trim.png';
const DEFAULT_TITLE = 'Comerzia ERP';

/**
 * Hook to dynamically update the application's Favicon, Document Title,
 * Apple Touch Icon, and Web App Manifest (PWA) based on the authenticated
 * company's commercial name and logo URL.
 */
export const useDynamicBranding = () => {
  const userProfile = useAuthStore((state) => state.userProfile);
  const companySettings = userProfile?.companySettings;

  useEffect(() => {
    const commercialName = companySettings?.commercialName?.trim() || '';
    const logoUrl = companySettings?.logoUrl?.trim() || '';

    // 1. Título del Documento
    if (commercialName) {
      document.title = `${commercialName} | Comerzia`;
    } else {
      document.title = DEFAULT_TITLE;
    }

    // 2. Favicon (<link rel="icon">)
    let favicon = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = logoUrl || DEFAULT_ICON;

    // 3. Apple Touch Icon (<link rel="apple-touch-icon">)
    let appleIcon = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = logoUrl || DEFAULT_ICON;

    // 4. Web App Manifest Dinámico para PWA Mobile
    const manifestName = commercialName || 'Comerzia ERP';
    const manifestShortName = commercialName
      ? (commercialName.length > 12 ? commercialName.substring(0, 12) : commercialName)
      : 'Comerzia';
    const iconSrc = logoUrl || DEFAULT_ICON;

    const dynamicManifest = {
      name: manifestName,
      short_name: manifestShortName,
      description: `Sistema de Gestión - ${manifestName}`,
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#3b82f6',
      icons: [
        {
          src: iconSrc,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: iconSrc,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    };

    const manifestBlob = new Blob([JSON.stringify(dynamicManifest)], { type: 'application/manifest+json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);

    let manifestLink = document.querySelector<HTMLLinkElement>("link[rel='manifest']");
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }

    const oldBlobUrl = manifestLink.getAttribute('data-blob-url');
    if (oldBlobUrl) {
      URL.revokeObjectURL(oldBlobUrl);
    }

    manifestLink.href = manifestUrl;
    manifestLink.setAttribute('data-blob-url', manifestUrl);

    return () => {
      const currentBlobUrl = manifestLink?.getAttribute('data-blob-url');
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [companySettings?.commercialName, companySettings?.logoUrl]);
};
