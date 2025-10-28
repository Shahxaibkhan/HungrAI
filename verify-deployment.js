#!/usr/bin/env node

/**
 * WhatsApp AI Restaurant System - Pre-Deployment Verification
 * 
 * This script verifies that all components are properly configured
 * and ready for production deployment.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(colors[color] + message + colors.reset);
}

function logSection(title) {
  console.log('');
  log('='.repeat(60), 'cyan');
  log(`${title}`, 'bold');
  log('='.repeat(60), 'cyan');
}

function checkmark(passed) {
  return passed ? '✅' : '❌';
}

/**
 * Check if required files exist
 */
function checkFiles() {
  logSection('📁 FILE STRUCTURE VERIFICATION');
  
  const requiredFiles = [
    // Core API files
    { path: 'api/whatsapp-webhook.js', desc: 'WhatsApp Webhook Handler' },
    { path: 'api/whatsappMessenger.js', desc: 'WhatsApp Message Sender' }, 
    { path: 'api/whatsappSessionManager.js', desc: 'Session Management' },
    { path: 'api/restaurantLookup.js', desc: 'Restaurant Lookup Service' },
    { path: 'api/promptOrchestrator.js', desc: 'GPT Integration' },
    
    // Models
    { path: 'backend/src/models/Restaurant.js', desc: 'Restaurant Model' },
    { path: 'backend/src/models/MenuItem.js', desc: 'MenuItem Model' },
    { path: 'backend/src/models/Order.js', desc: 'Order Model' },
    { path: 'backend/src/models/User.js', desc: 'User Model' },
    
    // Configuration
    { path: '.env', desc: 'Environment Configuration' },
    { path: 'package.json', desc: 'Package Configuration' },
    
    // Dialogflow intents (sample check)
    { path: 'intents/greeting.json', desc: 'Dialogflow Greeting Intent' },
    { path: 'intents/show.menu.json', desc: 'Dialogflow Menu Intent' },
    
    // Documentation
    { path: 'DEPLOYMENT.md', desc: 'Deployment Guide' },
    { path: 'test-system.js', desc: 'System Test Script' }
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    const exists = fs.existsSync(file.path);
    console.log(`${checkmark(exists)} ${file.desc}`);
    if (!exists) {
      log(`   Missing: ${file.path}`, 'red');
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

/**
 * Check environment variables
 */
function checkEnvironment() {
  logSection('🔧 ENVIRONMENT CONFIGURATION');
  
  // Load .env file if it exists
  if (fs.existsSync('.env')) {
    require('dotenv').config();
    log('✅ .env file loaded', 'green');
  } else {
    log('❌ .env file not found', 'red');
    return false;
  }
  
  const requiredEnvVars = [
    { key: 'MONGODB_URI', desc: 'MongoDB Connection String' },
    { key: 'OPENAI_API_KEY', desc: 'OpenAI API Key' },
    { key: 'DIALOGFLOW_PROJECT_ID', desc: 'Dialogflow Project ID' },
    { key: 'WHATSAPP_ACCESS_TOKEN', desc: 'WhatsApp Access Token' },
    { key: 'WHATSAPP_PHONE_NUMBER_ID', desc: 'WhatsApp Phone Number ID' },
    { key: 'WHATSAPP_VERIFY_TOKEN', desc: 'WhatsApp Verify Token' }
  ];
  
  let allVarsPresent = true;
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.key];
    const exists = !!value;
    const masked = exists ? value.substring(0, 8) + '...' : 'NOT SET';
    
    console.log(`${checkmark(exists)} ${envVar.desc}: ${masked}`);
    
    if (!exists) {
      allVarsPresent = false;
    }
  }
  
  return allVarsPresent;
}

/**
 * Check Dialogflow intent files
 */
function checkDialogflowIntents() {
  logSection('🤖 DIALOGFLOW INTENT FILES');
  
  const intentDir = 'intents';
  
  if (!fs.existsSync(intentDir)) {
    log('❌ Intents directory not found', 'red');
    return false;
  }
  
  const intentFiles = fs.readdirSync(intentDir).filter(file => file.endsWith('.json'));
  
  log(`📊 Found ${intentFiles.length} intent files:`, 'blue');
  
  let validIntents = 0;
  
  for (const file of intentFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(intentDir, file), 'utf8'));
      
      // Check for required fields
      const hasName = !!content.name;
      const hasDisplayName = !!content.displayName;
      const hasTrainingPhrases = !!(content.trainingPhrases && content.trainingPhrases.length > 0);
      
      const isValid = hasName && hasDisplayName && hasTrainingPhrases;
      
      console.log(`  ${checkmark(isValid)} ${file}`);
      
      if (!isValid) {
        if (!hasName) log('    Missing: name field', 'yellow');
        if (!hasDisplayName) log('    Missing: displayName field', 'yellow');
        if (!hasTrainingPhrases) log('    Missing: trainingPhrases', 'yellow');
      } else {
        validIntents++;
      }
      
    } catch (error) {
      log(`  ❌ ${file} - Invalid JSON: ${error.message}`, 'red');
    }
  }
  
  log(`\n📈 Summary: ${validIntents}/${intentFiles.length} valid intent files`, 'cyan');
  
  return validIntents > 0;
}

/**
 * Check package dependencies
 */
function checkDependencies() {
  logSection('📦 PACKAGE DEPENDENCIES');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = packageJson.dependencies || {};
    
    const requiredDeps = [
      'mongoose',
      'openai', 
      'axios',
      'jsonwebtoken'
    ];
    
    let allDepsPresent = true;
    
    for (const dep of requiredDeps) {
      const version = deps[dep];
      const exists = !!version;
      
      console.log(`${checkmark(exists)} ${dep}: ${version || 'NOT INSTALLED'}`);
      
      if (!exists) {
        allDepsPresent = false;
      }
    }
    
    // Check if node_modules exists
    const nodeModulesExists = fs.existsSync('node_modules');
    console.log(`${checkmark(nodeModulesExists)} node_modules directory`);
    
    if (!nodeModulesExists) {
      log('⚠️  Run "npm install" to install dependencies', 'yellow');
      allDepsPresent = false;
    }
    
    return allDepsPresent;
    
  } catch (error) {
    log('❌ Error reading package.json: ' + error.message, 'red');
    return false;
  }
}

/**
 * Generate deployment report
 */
function generateReport(checks) {
  logSection('📋 DEPLOYMENT READINESS REPORT');
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const percentage = Math.round((passed / total) * 100);
  
  log(`Overall Score: ${passed}/${total} (${percentage}%)`, percentage >= 80 ? 'green' : 'red');
  
  console.log('\nDetailed Results:');
  for (const [check, result] of Object.entries(checks)) {
    console.log(`  ${checkmark(result)} ${check.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
  }
  
  if (percentage >= 80) {
    log('\n🎉 SYSTEM READY FOR DEPLOYMENT! 🚀', 'green');
    log('\nNext Steps:', 'cyan');
    log('1. Run "npm run test" to verify system functionality', 'white');
    log('2. Deploy to Vercel/Netlify/Railway', 'white');
    log('3. Configure WhatsApp webhook URL', 'white');
    log('4. Import Dialogflow intents', 'white');
    log('5. Test with real WhatsApp messages', 'white');
  } else {
    log('\n⚠️  SYSTEM NOT READY - Fix issues above before deploying', 'yellow');
    log('\nNext Steps:', 'cyan');
    log('1. Fix failing checks above', 'white');
    log('2. Re-run this verification script', 'white');
    log('3. Proceed with deployment once all checks pass', 'white');
  }
  
  log('\n📚 See DEPLOYMENT.md for detailed instructions', 'blue');
}

/**
 * Main verification function
 */
function main() {
  log('🔍 WhatsApp AI Restaurant System - Pre-Deployment Verification\n', 'bold');
  
  const checks = {
    'File Structure': checkFiles(),
    'Environment Config': checkEnvironment(),
    'Dialogflow Intents': checkDialogflowIntents(),
    'Package Dependencies': checkDependencies()
  };
  
  generateReport(checks);
  
  // Exit with error code if any checks failed
  const allPassed = Object.values(checks).every(Boolean);
  process.exit(allPassed ? 0 : 1);
}

// Run verification
if (require.main === module) {
  main();
}

module.exports = {
  checkFiles,
  checkEnvironment,
  checkDialogflowIntents,
  checkDependencies,
  main
};