import path from 'node:path';

export function platformRule(page) {
  if (page.platform === 'ptrade' && page.variant === 'guojin') {
    return {
      contentSelector: '.help-content.markdown-body',
      splitHeadingLevels: [2],
      sourceKey: guojinSourceKey(page),
      removeSelectors: ['.help-nav', '.toc', '.back-to-top', '.copy-btn'],
    };
  }

  if (page.platform === 'ptrade' && page.variant === 'shenwan') {
    return {
      contentSelector: '.vp-doc',
      splitHeadingLevels: [2],
      sourceKey: path.basename(page.local_file_path, '.html').replace(/^\d+_/, ''),
      removeSelectors: [
        '.header-anchor', '.line-numbers-wrapper', 'button.copy', '.copy',
        '.VPDocFooter', '.prev-next', '.edit-link',
      ],
    };
  }

  if (page.platform === 'qmt') {
    return {
      contentSelector: 'section.doc-page',
      splitHeadingLevels: [],
      sourceKey: 'builtin-python',
      removeSelectors: [
        '.header-anchor', '.line-numbers-wrapper', 'button.copy', '.copy',
        '.source-url', '.vp-tab-nav', '.vp-tabs-nav',
      ],
    };
  }

  if (page.platform === 'joinquant') {
    return {
      contentSelector: '#jq-api-content',
      splitHeadingLevels: [2],
      sourceKey: page.slug || path.basename(path.dirname(page.local_file_path)),
      removeSelectors: [
        '.anchorjs-link', '.header-anchor', '.line-numbers-wrapper',
        'button.copy', '.copy-code', '.doc-loading',
      ],
    };
  }

  throw new Error(`Unsupported platform/variant: ${page.platform}/${page.variant}`);
}

function guojinSourceKey(page) {
  const base = path.basename(page.local_file_path, '.html');
  if (base === 'ptradeapi') return 'strategy-api';
  if (base.includes('财务')) return 'finance';
  if (base.includes('行业')) return 'industry-concepts';
  return 'document';
}

export function outputBase(page) {
  if (page.platform === 'ptrade') return path.join('ptrade', page.variant);
  if (page.platform === 'qmt') return path.join('qmt', page.variant);
  return 'joinquant';
}

export const globalNoiseSelectors = [
  'script', 'style', 'noscript', 'iframe', 'template',
  'nav', 'aside', 'footer', 'header',
  '[hidden]', '[aria-hidden="true"]',
  '.navbar', '.sidebar', '.side-bar', '.sidenav', '.side-nav',
  '.breadcrumb', '.breadcrumbs', '.advertisement', '.recommended',
  '.login', '.register', '.customer-service', '.loading',
  '.mobile-menu', '.mobile-nav', '.menu-toggle',
  'svg', 'button',
];

export function sourceDocumentName(page) {
  if (page.platform === 'joinquant') return page.slug || 'main';
  if (page.platform === 'qmt') return 'innerapi-combined';
  return path.basename(page.local_file_path, '.html');
}
