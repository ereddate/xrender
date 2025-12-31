#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionsPath = path.join(__dirname, '../src/libs/versions.json');
const modules = ['fetch', 'router', 'store', 'i18n', 'touchs'];

function readVersions() {
  try {
    const data = fs.readFileSync(versionsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read versions.json:', error.message);
    process.exit(1);
  }
}

function writeVersions(versions) {
  try {
    fs.writeFileSync(versionsPath, JSON.stringify(versions, null, 2), 'utf-8');
    console.log('✓ versions.json updated');
  } catch (error) {
    console.error('Failed to write versions.json:', error.message);
    process.exit(1);
  }
}

function updateModuleVersion(moduleName, newVersion) {
  const versions = readVersions();
  
  if (!versions[moduleName]) {
    console.error(`Module "${moduleName}" not found in versions.json`);
    process.exit(1);
  }
  
  const oldVersion = versions[moduleName].version;
  versions[moduleName].version = newVersion;
  writeVersions(versions);
  
  console.log(`✓ ${moduleName}: ${oldVersion} → ${newVersion}`);
  
  return newVersion;
}

function updateModuleSourceFile(moduleName, version) {
  const modulePath = path.join(__dirname, `../src/libs/${moduleName}/index.js`);
  
  try {
    let content = fs.readFileSync(modulePath, 'utf-8');
    
    const versionRegex = /static\s+version\s*=\s*['"][\d.]+['"]/;
    const newVersionLine = `static version = '${version}'`;
    
    if (versionRegex.test(content)) {
      content = content.replace(versionRegex, newVersionLine);
      fs.writeFileSync(modulePath, content, 'utf-8');
      console.log(`✓ Updated ${moduleName}/index.js to version ${version}`);
    } else {
      console.warn(`⚠ No version property found in ${moduleName}/index.js`);
    }
  } catch (error) {
    console.error(`Failed to update ${moduleName}/index.js:`, error.message);
  }
}

function updateCoreVersion(version) {
  const corePath = path.join(__dirname, '../src/libs/core.js');
  
  try {
    let content = fs.readFileSync(corePath, 'utf-8');
    
    const versionRegex = /static\s+version\s*=\s*['"][\d.]+['"]/;
    const newVersionLine = `static version = '${version}'`;
    
    if (versionRegex.test(content)) {
      content = content.replace(versionRegex, newVersionLine);
      fs.writeFileSync(corePath, content, 'utf-8');
      console.log(`✓ Updated core.js to version ${version}`);
    } else {
      console.warn(`⚠ No version property found in core.js`);
    }
  } catch (error) {
    console.error(`Failed to update core.js:`, error.message);
  }
}

function bumpVersion(version, type = 'patch') {
  const parts = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2]++;
      break;
  }
  
  return parts.join('.');
}

function printVersions() {
  const versions = readVersions();
  
  console.log('\n📦 XRender Module Versions:\n');
  
  Object.entries(versions).forEach(([key, info]) => {
    console.log(`  ${info.name.padEnd(20)} ${info.version.padEnd(10)} ${info.description}`);
  });
  
  console.log('');
}

const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'get':
    const versions = readVersions();
    const moduleName = args[0];
    
    if (moduleName) {
      if (versions[moduleName]) {
        console.log(versions[moduleName].version);
      } else {
        console.error(`Module "${moduleName}" not found`);
        process.exit(1);
      }
    } else {
      printVersions();
    }
    break;
    
  case 'get-json':
    const jsonVersions = readVersions();
    const jsonModule = args[0];
    
    if (jsonModule) {
      if (jsonVersions[jsonModule]) {
        console.log(JSON.stringify(jsonVersions[jsonModule]));
      } else {
        console.error(`Module "${jsonModule}" not found`);
        process.exit(1);
      }
    } else {
      console.log(JSON.stringify(jsonVersions, null, 2));
    }
    break;
    
  case 'set':
    if (args.length < 2) {
      console.error('Usage: node version.js set <module> <version>');
      process.exit(1);
    }
    
    const modName = args[0];
    const newVer = args[1];
    
    if (!/^\d+\.\d+\.\d+$/.test(newVer)) {
      console.error('Version must be in format X.Y.Z (e.g., 1.0.0)');
      process.exit(1);
    }
    
    updateModuleVersion(modName, newVer);
    updateModuleSourceFile(modName, newVer);
    break;
    
  case 'bump':
    const bumpModule = args[0] || 'xrender';
    const bumpType = args[1] || 'patch';
    
    if (!['major', 'minor', 'patch'].includes(bumpType)) {
      console.error('Bump type must be one of: major, minor, patch');
      process.exit(1);
    }
    
    const currentVersions = readVersions();
    const currentVersion = currentVersions[bumpModule]?.version;
    
    if (!currentVersion) {
      console.error(`Module "${bumpModule}" not found`);
      process.exit(1);
    }
    
    const bumpedVersion = bumpVersion(currentVersion, bumpType);
    updateModuleVersion(bumpModule, bumpedVersion);
    
    if (bumpModule === 'xrender') {
      updateCoreVersion(bumpedVersion);
    } else {
      updateModuleSourceFile(bumpModule, bumpedVersion);
    }
    break;
    
  case 'bump-all':
    const allVersions = readVersions();
    const allType = args[0] || 'patch';
    
    if (!['major', 'minor', 'patch'].includes(allType)) {
      console.error('Bump type must be one of: major, minor, patch');
      process.exit(1);
    }
    
    Object.keys(allVersions).forEach(key => {
      const currentVer = allVersions[key].version;
      const bumpedVer = bumpVersion(currentVer, allType);
      allVersions[key].version = bumpedVer;
      
      if (key === 'xrender') {
        updateCoreVersion(bumpedVer);
      } else {
        updateModuleSourceFile(key, bumpedVer);
      }
      
      console.log(`✓ ${key}: ${currentVer} → ${bumpedVer}`);
    });
    
    writeVersions(allVersions);
    break;
    
  default:
    console.log(`
XRender Version Manager

Usage:
  node scripts/version.js get [module]          Get version of a module or all modules
  node scripts/version.js get-json [module]     Get version info as JSON
  node scripts/version.js set <module> <version> Set version of a module
  node scripts/version.js bump [module] [type]   Bump version (major/minor/patch)
  node scripts/version.js bump-all [type]        Bump all modules

Examples:
  node scripts/version.js get                    Get all versions
  node scripts/version.js get fetch              Get fetch version
  node scripts/version.js get-json fetch         Get fetch version info as JSON
  node scripts/version.js set fetch 1.2.0        Set fetch version to 1.2.0
  node scripts/version.js bump fetch minor       Bump fetch minor version
  node scripts/version.js bump-all patch         Bump all modules patch version
    `);
    break;
}
