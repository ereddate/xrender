import { StaticSiteGenerator, RoutePreloader, HTMLRenderer, MetaInjector } from './index.js';

export function xrenderSSGPlugin(options = {}) {
  const defaultOptions = {
    routes: [],
    outDir: 'dist',
    templatePath: 'index.html',
    publicPath: '/',
    preloadData: true,
    concurrency: 5,
    minify: false,
    ...options
  };

  let ssg = null;
  let htmlRenderer = null;
  let routePreloader = null;

  return {
    name: 'xrender-ssg',

    config(config) {
      return {
        build: {
          outDir: defaultOptions.outDir,
          emptyOutDir: false
        }
      };
    },

    async buildEnd() {
      console.log('XRender SSG: Starting static site generation...');
      
      try {
        htmlRenderer = new HTMLRenderer({
          templatePath: defaultOptions.templatePath,
          publicPath: defaultOptions.publicPath,
          minify: defaultOptions.minify
        });

        routePreloader = new RoutePreloader({
          routes: defaultOptions.routes,
          preloadData: defaultOptions.preloadData,
          concurrency: defaultOptions.concurrency
        });

        ssg = new StaticSiteGenerator({
          routes: defaultOptions.routes,
          outDir: defaultOptions.outDir,
          templatePath: defaultOptions.templatePath,
          publicPath: defaultOptions.publicPath,
          htmlRenderer
        });

        await routePreloader.preloadRoutes();
        await ssg.generate();
        await ssg.writeToFile();

        console.log('XRender SSG: Static site generation completed successfully!');
      } catch (error) {
        console.error('XRender SSG: Error during static site generation:', error);
        throw error;
      }
    }
  };
}

export function xrenderSSGCompiler(options = {}) {
  return {
    name: 'xrender-ssg-compiler',
    
    enforce: 'post',
    
    async generateBundle(options, bundle) {
      console.log('XRender SSG Compiler: Processing bundle...');
      
      const fs = await import('fs');
      const path = await import('path');
      
      const outDir = options.dir || 'dist';
      
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.js')) {
          const filePath = path.join(outDir, fileName);
          const content = chunk.type === 'chunk' ? chunk.code : chunk.source;
          
          if (content) {
            fs.writeFileSync(filePath, content, 'utf-8');
          }
        }
      }
      
      console.log('XRender SSG Compiler: Bundle processing completed!');
    }
  };
}

export function xrenderSSGMiddleware(options = {}) {
  return {
    name: 'xrender-ssg-middleware',
    
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '/';
        
        if (url.endsWith('.html') || url === '/') {
          const fs = await import('fs');
          const path = await import('path');
          
          const htmlPath = url === '/' 
            ? path.join(process.cwd(), 'dist', 'index.html')
            : path.join(process.cwd(), 'dist', url);
          
          try {
            if (fs.existsSync(htmlPath)) {
              const html = fs.readFileSync(htmlPath, 'utf-8');
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(html);
              return;
            }
          } catch (error) {
            console.error('Error serving static file:', error);
          }
        }
        
        next();
      });
    }
  };
}

export default xrenderSSGPlugin;
