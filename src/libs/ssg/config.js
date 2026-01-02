export const ssgConfig = {
  enabled: true,
  routes: [],
  outDir: 'dist',
  templatePath: 'index.html',
  publicPath: '/',
  preloadData: true,
  concurrency: 5,
  minify: false,
  
  meta: {
    title: 'XRender App',
    description: 'A lightweight frontend framework',
    keywords: 'xrender, javascript, framework',
    charset: 'UTF-8',
    viewport: 'width=device-width, initial-scale=1.0',
    author: '',
    robots: 'index, follow',
    ogType: 'website',
    twitterCard: 'summary_large_image',
    themeColor: '#ffffff',
    favicon: '/favicon.ico',
    manifest: '/manifest.json'
  },
  
  customMeta: [],
  
  structuredData: {
    enabled: false,
    organization: null,
    article: null
  },
  
  excludeRoutes: [],
  includeRoutes: [],
  
  onRouteGenerated: null,
  onBuildComplete: null,
  onError: null
};

export function configureSSG(config) {
  return {
    ...ssgConfig,
    ...config
  };
}
