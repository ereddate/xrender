export class MetaInjector {
  constructor(options = {}) {
    this.options = {
      defaultMeta: {
        title: 'XRender App',
        description: 'A lightweight frontend framework',
        keywords: 'xrender, javascript, framework',
        charset: 'UTF-8',
        viewport: 'width=device-width, initial-scale=1.0'
      },
      ...options
    };
  }

  injectMeta(meta = {}, routePath = '/') {
    const mergedMeta = { ...this.options.defaultMeta, ...meta };
    
    const metaTags = [];
    
    metaTags.push(`<meta charset="${mergedMeta.charset || 'UTF-8'}">`);
    metaTags.push(`<meta name="viewport" content="${mergedMeta.viewport || 'width=device-width, initial-scale=1.0'}">`);
    
    if (mergedMeta.title) {
      metaTags.push(`<title>${this.escapeHtml(mergedMeta.title)}</title>`);
    }
    
    if (mergedMeta.description) {
      metaTags.push(`<meta name="description" content="${this.escapeHtml(mergedMeta.description)}">`);
    }
    
    if (mergedMeta.keywords) {
      metaTags.push(`<meta name="keywords" content="${this.escapeHtml(mergedMeta.keywords)}">`);
    }
    
    if (mergedMeta.author) {
      metaTags.push(`<meta name="author" content="${this.escapeHtml(mergedMeta.author)}">`);
    }
    
    if (mergedMeta.robots) {
      metaTags.push(`<meta name="robots" content="${this.escapeHtml(mergedMeta.robots)}">`);
    }
    
    if (mergedMeta.ogTitle) {
      metaTags.push(`<meta property="og:title" content="${this.escapeHtml(mergedMeta.ogTitle)}">`);
    }
    
    if (mergedMeta.ogDescription) {
      metaTags.push(`<meta property="og:description" content="${this.escapeHtml(mergedMeta.ogDescription)}">`);
    }
    
    if (mergedMeta.ogImage) {
      metaTags.push(`<meta property="og:image" content="${this.escapeHtml(mergedMeta.ogImage)}">`);
    }
    
    if (mergedMeta.ogUrl) {
      metaTags.push(`<meta property="og:url" content="${this.escapeHtml(mergedMeta.ogUrl)}">`);
    }
    
    if (mergedMeta.ogType) {
      metaTags.push(`<meta property="og:type" content="${this.escapeHtml(mergedMeta.ogType)}">`);
    }
    
    if (mergedMeta.twitterCard) {
      metaTags.push(`<meta name="twitter:card" content="${this.escapeHtml(mergedMeta.twitterCard)}">`);
    }
    
    if (mergedMeta.twitterTitle) {
      metaTags.push(`<meta name="twitter:title" content="${this.escapeHtml(mergedMeta.twitterTitle)}">`);
    }
    
    if (mergedMeta.twitterDescription) {
      metaTags.push(`<meta name="twitter:description" content="${this.escapeHtml(mergedMeta.twitterDescription)}">`);
    }
    
    if (mergedMeta.twitterImage) {
      metaTags.push(`<meta name="twitter:image" content="${this.escapeHtml(mergedMeta.twitterImage)}">`);
    }
    
    if (mergedMeta.canonical) {
      metaTags.push(`<link rel="canonical" href="${this.escapeHtml(mergedMeta.canonical)}">`);
    }
    
    if (routePath && routePath !== '/') {
      const canonicalUrl = mergedMeta.canonical 
        ? `${mergedMeta.canonical.replace(/\/$/, '')}${routePath}`
        : routePath;
      metaTags.push(`<link rel="canonical" href="${this.escapeHtml(canonicalUrl)}">`);
    }
    
    if (mergedMeta.favicon) {
      metaTags.push(`<link rel="icon" type="image/x-icon" href="${this.escapeHtml(mergedMeta.favicon)}">`);
    }
    
    if (mergedMeta.manifest) {
      metaTags.push(`<link rel="manifest" href="${this.escapeHtml(mergedMeta.manifest)}">`);
    }
    
    if (mergedMeta.themeColor) {
      metaTags.push(`<meta name="theme-color" content="${this.escapeHtml(mergedMeta.themeColor)}">`);
    }
    
    if (mergedMeta.customMeta && Array.isArray(mergedMeta.customMeta)) {
      mergedMeta.customMeta.forEach(customTag => {
        if (customTag.name) {
          metaTags.push(`<meta name="${this.escapeHtml(customTag.name)}" content="${this.escapeHtml(customTag.content)}">`);
        } else if (customTag.property) {
          metaTags.push(`<meta property="${this.escapeHtml(customTag.property)}" content="${this.escapeHtml(customTag.content)}">`);
        } else if (customTag.httpEquiv) {
          metaTags.push(`<meta http-equiv="${this.escapeHtml(customTag.httpEquiv)}" content="${this.escapeHtml(customTag.content)}">`);
        }
      });
    }
    
    return metaTags.join('\n    ');
  }

  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  generateStructuredData(data, type = 'WebPage') {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': type,
      ...data
    };
    
    return `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;
  }

  generateBreadcrumbList(items) {
    const itemList = items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }));
    
    return this.generateStructuredData({
      '@type': 'BreadcrumbList',
      itemListElement: itemList
    }, 'BreadcrumbList');
  }

  generateOrganizationData(organization) {
    return this.generateStructuredData({
      '@type': 'Organization',
      name: organization.name,
      url: organization.url,
      logo: organization.logo,
      description: organization.description,
      contactPoint: organization.contactPoint
    }, 'Organization');
  }

  generateArticleData(article) {
    return this.generateStructuredData({
      '@type': 'Article',
      headline: article.headline,
      image: article.image,
      author: article.author,
      publisher: article.publisher,
      datePublished: article.datePublished,
      dateModified: article.dateModified,
      description: article.description
    }, 'Article');
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
  }

  setDefaultMeta(meta) {
    this.options.defaultMeta = { ...this.options.defaultMeta, ...meta };
  }
}
