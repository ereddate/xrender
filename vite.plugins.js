import fs from 'fs';
import path from 'path';

export function versionPlugin(moduleName) {
  return {
    name: 'version-injector',
    config() {
      const versionsPath = path.resolve(process.cwd(), 'src/libs/versions.json');
      let version = '1.0.0';
      
      try {
        const versions = JSON.parse(fs.readFileSync(versionsPath, 'utf-8'));
        if (versions[moduleName] && versions[moduleName].version) {
          version = versions[moduleName].version;
        }
      } catch (error) {
        console.warn(`Failed to read version for ${moduleName}:`, error.message);
      }
      
      return {
        define: {
          '__VERSION__': JSON.stringify(version),
          '__MODULE_NAME__': JSON.stringify(moduleName)
        }
      };
    }
  };
}
