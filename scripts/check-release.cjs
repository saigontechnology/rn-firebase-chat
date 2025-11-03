#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Checking package release readiness...\n');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
let allChecks = true;

// Check 1: Required fields
console.log('📋 Checking required package.json fields...');
const requiredFields = ['name', 'version', 'description', 'main', 'types', 'repository', 'license'];
requiredFields.forEach(field => {
  if (packageJson[field]) {
    console.log(`  ✅ ${field}: ${packageJson[field]}`);
  } else {
    console.log(`  ❌ ${field}: missing`);
    allChecks = false;
  }
});

// Check 2: Files array
console.log('\n📁 Checking files configuration...');
if (packageJson.files && packageJson.files.length > 0) {
  console.log(`  ✅ files: ${packageJson.files.join(', ')}`);
  
  // Check if specified files exist
  packageJson.files.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`    ✅ ${file} exists`);
    } else {
      console.log(`    ⚠️  ${file} does not exist yet (will be created during build)`);
    }
  });
} else {
  console.log('  ❌ files: not specified');
  allChecks = false;
}

// Check 3: Build output
console.log('\n🔨 Checking build configuration...');
if (packageJson['react-native-builder-bob']) {
  console.log('  ✅ React Native Builder Bob configured');
  const bobConfig = packageJson['react-native-builder-bob'];
  console.log(`    Source: ${bobConfig.source}`);
  console.log(`    Output: ${bobConfig.output}`);
  console.log(`    Targets: ${bobConfig.targets.join(', ')}`);
} else {
  console.log('  ❌ React Native Builder Bob not configured');
  allChecks = false;
}

// Check 4: Scripts
console.log('\n⚙️  Checking required scripts...');
const requiredScripts = ['prepack', 'prepare'];
requiredScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`  ✅ ${script}: ${packageJson.scripts[script]}`);
  } else {
    console.log(`  ❌ ${script}: missing`);
    allChecks = false;
  }
});

// Check 5: Git status
console.log('\n🔄 Checking git status...');
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim() === '') {
    console.log('  ✅ Working directory is clean');
  } else {
    console.log('  ⚠️  Working directory has uncommitted changes:');
    console.log(gitStatus);
  }
} catch (error) {
  console.log('  ❌ Git status check failed');
  allChecks = false;
}

// Check 6: NPM login
console.log('\n👤 Checking npm authentication...');
try {
  const npmUser = execSync('npm whoami --registry https://registry.npmjs.org/', { encoding: 'utf8', stdio: 'pipe' }).trim();
  console.log(`  ✅ Logged in as: ${npmUser}`);
} catch (error) {
  console.log('  ❌ Not logged into npm');
  console.log('  Run: npm login');
  allChecks = false;
}

// Check 7: Dependencies
console.log('\n📦 Checking dependencies...');
if (packageJson.peerDependencies) {
  console.log(`  ✅ Peer dependencies: ${Object.keys(packageJson.peerDependencies).join(', ')}`);
} else {
  console.log('  ⚠️  No peer dependencies specified');
}

// Check 8: TypeScript
console.log('\n📝 Checking TypeScript configuration...');
if (fs.existsSync('tsconfig.json') && fs.existsSync('tsconfig.build.json')) {
  console.log('  ✅ TypeScript configuration files exist');
} else {
  console.log('  ❌ Missing TypeScript configuration');
  allChecks = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allChecks) {
  console.log('🎉 Package is ready for release!');
  console.log('\nNext steps:');
  console.log('  • Run: yarn release:dry (to test)');
  console.log('  • Run: yarn release (to publish)');
} else {
  console.log('⚠️  Some issues need to be addressed before release');
}
console.log('='.repeat(50));