#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionsPath = path.join(__dirname, '../src/libs/versions.json');
const distLibsPath = path.join(__dirname, '../dist/libs');
const modules = ['xrender', 'fetch', 'router', 'store', 'i18n', 'touchs'];

function readVersions() {
  try {
    const data = fs.readFileSync(versionsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read versions.json:', error.message);
    process.exit(1);
  }
}

function copyDirectory(src, dest) {
  try {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }

    return true;
  } catch (error) {
    console.error(`Failed to copy ${src} to ${dest}:`, error.message);
    return false;
  }
}

function createLatestLinks() {
  const versions = readVersions();
  
  console.log('\n🔗 Creating latest links...\n');

  modules.forEach(moduleName => {
    const moduleInfo = versions[moduleName];
    if (!moduleInfo) {
      console.warn(`⚠ Module "${moduleName}" not found in versions.json`);
      return;
    }

    const version = moduleInfo.version;
    const versionDir = path.join(distLibsPath, moduleName, version);
    const latestDir = path.join(distLibsPath, moduleName, 'latest');

    if (!fs.existsSync(versionDir)) {
      console.warn(`⚠ Version directory not found: ${versionDir}`);
      console.warn(`  Please build ${moduleName} first: npm run build:${moduleName}`);
      return;
    }

    console.log(`📦 ${moduleName}: ${version} → latest`);

    if (fs.existsSync(latestDir)) {
      fs.rmSync(latestDir, { recursive: true, force: true });
    }

    const success = copyDirectory(versionDir, latestDir);
    
    if (success) {
      console.log(`  ✓ Created latest link for ${moduleName}`);
    } else {
      console.error(`  ✗ Failed to create latest link for ${moduleName}`);
    }
  });

  console.log('\n✅ Latest links created successfully!\n');
}

function cleanOldVersions(keepCount = 3) {
  const versions = readVersions();
  
  console.log('\n🧹 Cleaning old versions...\n');

  modules.forEach(moduleName => {
    const moduleInfo = versions[moduleName];
    if (!moduleInfo) return;

    const moduleDir = path.join(distLibsPath, moduleName);
    
    if (!fs.existsSync(moduleDir)) {
      console.warn(`⚠ Module directory not found: ${moduleDir}`);
      return;
    }

    const entries = fs.readdirSync(moduleDir, { withFileTypes: true });
    const versionDirs = entries
      .filter(entry => entry.isDirectory() && entry.name !== 'latest')
      .map(entry => entry.name)
      .sort((a, b) => {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        
        for (let i = 0; i < 3; i++) {
          if (aParts[i] !== bParts[i]) {
            return bParts[i] - aParts[i];
          }
        }
        return 0;
      });

    const currentVersion = moduleInfo.version;
    const versionsToRemove = versionDirs.filter(v => v !== currentVersion).slice(keepCount);

    if (versionsToRemove.length === 0) {
      console.log(`📦 ${moduleName}: No old versions to remove`);
      return;
    }

    console.log(`📦 ${moduleName}: Removing ${versionsToRemove.length} old version(s)`);

    versionsToRemove.forEach(version => {
      const versionDir = path.join(moduleDir, version);
      try {
        fs.rmSync(versionDir, { recursive: true, force: true });
        console.log(`  ✓ Removed ${version}`);
      } catch (error) {
        console.error(`  ✗ Failed to remove ${version}:`, error.message);
      }
    });
  });

  console.log('\n✅ Old versions cleaned!\n');
}

function listVersions() {
  const versions = readVersions();
  
  console.log('\n📦 Available Module Versions:\n');

  modules.forEach(moduleName => {
    const moduleInfo = versions[moduleName];
    if (!moduleInfo) return;

    const moduleDir = path.join(distLibsPath, moduleName);
    
    if (!fs.existsSync(moduleDir)) {
      console.log(`📦 ${moduleInfo.name}: Not built yet`);
      return;
    }

    const entries = fs.readdirSync(moduleDir, { withFileTypes: true });
    const versionDirs = entries
      .filter(entry => entry.isDirectory() && entry.name !== 'latest')
      .map(entry => entry.name)
      .sort((a, b) => {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        
        for (let i = 0; i < 3; i++) {
          if (aParts[i] !== bParts[i]) {
            return bParts[i] - aParts[i];
          }
        }
        return 0;
      });

    console.log(`📦 ${moduleInfo.name}:`);
    versionDirs.forEach((version, index) => {
      const isLatest = version === moduleInfo.version;
      const marker = isLatest ? ' ← current' : '';
      console.log(`  ${index + 1}. ${version}${marker}`);
    });
  });

  console.log('');
}

const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'latest':
    createLatestLinks();
    break;
    
  case 'clean':
    const keepCount = parseInt(args[0]) || 3;
    cleanOldVersions(keepCount);
    break;
    
  case 'list':
    listVersions();
    break;
    
  default:
    console.log(`
XRender Post-Build Scripts

Usage:
  node scripts/post-build.js latest          Create latest links for all modules
  node scripts/post-build.js clean [count]   Clean old versions (keep last N, default: 3)
  node scripts/post-build.js list            List all available versions

Examples:
  node scripts/post-build.js latest           Create latest links
  node scripts/post-build.js clean            Clean old versions (keep last 3)
  node scripts/post-build.js clean 5         Clean old versions (keep last 5)
  node scripts/post-build.js list            List all versions
    `);
    break;
}
