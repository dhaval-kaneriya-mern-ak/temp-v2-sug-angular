#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Installing git hooks for sug-angular...');

// Define paths
const rootGitHooksDir = path.join(__dirname, '../../.git/hooks');
const preCommitPath = path.join(rootGitHooksDir, 'pre-commit');
const prepareCommitMsgPath = path.join(rootGitHooksDir, 'prepare-commit-msg');

// Check if we're in the right directory structure
if (!fs.existsSync(path.join(__dirname, '../../.git'))) {
  console.log('ℹ️  Not in a git repository or not in the expected directory structure.');
  console.log('   Skipping git hooks installation.');
  process.exit(0);
}

// Check if this is running from sug-angular directory
if (!fs.existsSync(path.join(__dirname, '../package.json'))) {
  console.log('ℹ️  Not running from sug-angular directory. Skipping git hooks installation.');
  process.exit(0);
}

// Function to reset git hooks path to default
function resetHooksPath() {
  try {
    // Check current hookspath
    let currentHooksPath = '';
    try {
      currentHooksPath = execSync('git config core.hookspath', { cwd: path.join(__dirname, '../..'), encoding: 'utf8' }).trim();
    } catch (error) {
      // No hookspath set, which is what we want
      console.log('ℹ️  Git hooks path is already set to default location');
      return true;
    }

    if (currentHooksPath) {
      console.log(`🔄 Current hooks path: ${currentHooksPath}`);
      console.log('🔧 Resetting git hooks path to default (.git/hooks/)...');

      // Reset to default hooks directory
      execSync('git config --unset core.hookspath', { cwd: path.join(__dirname, '../..') });

      console.log('✅ Git hooks path reset to default location');
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to reset git hooks path:', error.message);
    return false;
  }

  return true;
}

// Reset hooks path before installing
if (!resetHooksPath()) {
  console.log('⚠️  Warning: Could not reset git hooks path. Hooks may not work properly.');
}

// Pre-commit hook content
const preCommitContent = `#!/bin/bash

echo "🔍 Checking for file changes..."

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only)

echo "📁 Staged files:"
echo "$STAGED_FILES"

# Check if any sug-angular files are changed
if echo "$STAGED_FILES" | grep -q "^sug-angular/"; then
  echo ""
  echo "🚀 Detected sug-angular changes, running quality checks..."
  echo "📂 Entering sug-angular directory..."

  # Change to sug-angular directory
  cd sug-angular

  # Check if we're in the right directory
  if [ ! -f "package.json" ]; then
    echo "❌ Error: Could not find sug-angular package.json"
    exit 1
  fi

  echo "🔧 Running lint-staged..."
  npx lint-staged
  if [ $? -ne 0 ]; then
    echo "❌ lint-staged failed"
    exit 1
  fi

  # echo "🧪 Running tests..."
  # npm run test:ci
  # if [ $? -ne 0 ]; then
  #   echo "❌ Tests failed"
  #   exit 1
  # fi

  echo "🏗️  Running build (this may take a moment)..."
  npm run build:all -- --skip-nx-cache
  if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
  fi

  # Return to root directory
  cd ..

  echo "✅ All sug-angular quality checks passed!"
else
  echo ""
  echo "ℹ️  No sug-angular files changed, skipping sug-angular checks"
fi

# Continue with main repo hooks (if any) here
echo "✅ Pre-commit checks completed successfully!"

exit 0`;

// Prepare-commit-msg hook content
const prepareCommitMsgContent = `#!/bin/sh

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only)

# Check if any sug-angular files are changed
if echo "$STAGED_FILES" | grep -q "^sug-angular/"; then
  echo "🔍 Validating commit message format for sug-angular changes..."

  # Read the commit message
  commit_msg=$(cat "$1")

  # Function to validate commit message (copied from sug-angular)
  validate_commit_msg() {
    # Allow ticket formats: "MAR-123: Description" or "A5X0-T34: Description"
    if echo "$commit_msg" | grep -qE "^[A-Z0-9]+-[A-Z0-9]+: .+"; then
      return 0
    fi

    # Invalid format
    echo "❌ Invalid commit message format!"
    echo ""
    echo "Commit message must follow this format:"
    echo "  • Must start with ticket ID followed by a colon and a space"
    echo "  • Include descriptive message that is sentence case or title case"
    echo "  • For example: 'MAR-123: Update component' or 'A5X0-T34: Fix bug'"
    echo ""
    echo "Your message: '$commit_msg'"
    return 1
  }

  # Validate the commit message
  if ! validate_commit_msg; then
    exit 1
  fi

  echo "✅ Commit message format is valid"
else
  echo "ℹ️  No sug-angular files changed, skipping commit message validation"
fi

exit 0`;

// Function to install hook
function installHook(hookPath, content, hookName) {
  try {
    // Create backup if hook already exists
    if (fs.existsSync(hookPath)) {
      const backupPath = hookPath + '.backup.' + Date.now();
      fs.copyFileSync(hookPath, backupPath);
      console.log(`📁 Backed up existing ${hookName} to ${path.basename(backupPath)}`);
    }

    // Write the hook file
    fs.writeFileSync(hookPath, content);

    // Make it executable
    fs.chmodSync(hookPath, 0o755);

    console.log(`✅ Installed ${hookName} hook`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to install ${hookName} hook:`, error.message);
    return false;
  }
}

// Install the hooks
let success = true;

// Ensure .git/hooks directory exists
if (!fs.existsSync(rootGitHooksDir)) {
  console.error('❌ .git/hooks directory not found. Are you in a git repository?');
  process.exit(1);
}

// Install pre-commit hook
success &= installHook(preCommitPath, preCommitContent, 'pre-commit');

// Install prepare-commit-msg hook
success &= installHook(prepareCommitMsgPath, prepareCommitMsgContent, 'prepare-commit-msg');

if (success) {
  console.log('');
  console.log('🎉 Git hooks successfully installed!');
  console.log('');
  console.log('ℹ️  These hooks will:');
  console.log('   • Run lint-staged and build when sug-angular files are committed');
  console.log('   • Validate commit message format for sug-angular changes');
  console.log('   • Skip all checks when no sug-angular files are changed');
  console.log('');
  console.log('🔧 Hooks installed at:');
  console.log(`   • ${preCommitPath}`);
  console.log(`   • ${prepareCommitMsgPath}`);
} else {
  console.log('');
  console.log('❌ Some hooks failed to install. Please check the errors above.');
  process.exit(1);
}
