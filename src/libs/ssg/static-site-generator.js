export class StaticSiteGenerator {
  constructor(options = {}) {
    this.options = {
      routes: [],
      outDir: 'dist',
      templatePath: 'index.html',
      publicPath: '/',
      ...options
    };
    this.generatedPages = new Map();
  }

  async generate(routes = []) {
    const routesToGenerate = routes.length > 0 ? routes : this.options.routes;
    
    console.log(`Starting static site generation for ${routesToGenerate.length} routes...`);
    
    for (const route of routesToGenerate) {
      await this.generateRoute(route);
    }
    
    console.log(`Static site generation complete. Generated ${this.generatedPages.size} pages.`);
    return this.generatedPages;
  }

  async generateRoute(route) {
    try {
      const { path, component, meta = {} } = route;
      
      console.log(`Generating route: ${path}`);
      
      const html = await this.renderRoute(route);
      
      this.generatedPages.set(path, {
        path,
        html,
        meta
      });
      
      return html;
    } catch (error) {
      console.error(`Error generating route ${route.path}:`, error);
      throw error;
    }
  }

  async renderRoute(route) {
    const { path, component } = route;
    
    const renderer = this.options.htmlRenderer;
    if (!renderer) {
      throw new Error('HTML renderer not configured');
    }
    
    return await renderer.renderRoute(route);
  }

  async writeToFile() {
    const fs = await import('fs');
    const path = await import('path');
    
    const outDir = this.options.outDir;
    
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    for (const [routePath, pageData] of this.generatedPages) {
      const filePath = path.join(outDir, this.getOutputPath(routePath));
      const dirPath = path.dirname(filePath);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      fs.writeFileSync(filePath, pageData.html, 'utf-8');
      console.log(`Written: ${filePath}`);
    }
  }

  getOutputPath(routePath) {
    if (routePath === '/') {
      return 'index.html';
    }
    
    const cleanPath = routePath.replace(/^\//, '').replace(/\/$/, '');
    return cleanPath + '.html';
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
  }

  getGeneratedPages() {
    return this.generatedPages;
  }

  clearCache() {
    this.generatedPages.clear();
  }
}
