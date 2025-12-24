#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🗑️  Uninstalling sug-angular git hooks...');

// Define paths
const rootGitHooksDir = path.join(__dirname, '../../.git/hooks');
const preCommitPath = path.join(rootGitHooksDir, 'pre-commit');
const prepareCommitMsgPath = path.join(rootGitHooksDir, 'prepare-commit-msg');

// Function to uninstall hook
function uninstallHook(hookPath, hookName) {
  try {
    if (!fs.existsSync(hookPath)) {
      console.log(`ℹ️  ${hookName} hook not found, nothing to uninstall`);
      return true;
    }

    // Check if this is our hook by looking for our signature
    const content = fs.readFileSync(hookPath, 'utf8');
    if (!content.includes('sug-angular')) {
      console.log(`ℹ️  ${hookName} hook exists but doesn't appear to be ours, skipping`);
      return true;
    }

    // Look for backup files and restore the most recent one
    const backupFiles = fs.readdirSync(rootGitHooksDir)
      .filter(file => file.startsWith(path.basename(hookPath) + '.backup.'))
      .sort()
      .reverse();

    if (backupFiles.length > 0) {
      const latestBackup = path.join(rootGitHooksDir, backupFiles[0]);
      fs.copyFileSync(latestBackup, hookPath);
      console.log(`✅ Restored ${hookName} from backup: ${backupFiles[0]}`);

      // Clean up backup files
      backupFiles.forEach(backup => {
        fs.unlinkSync(path.join(rootGitHooksDir, backup));
      });
      console.log(`🧹 Cleaned up ${backupFiles.length} backup file(s)`);
    } else {
      fs.unlinkSync(hookPath);
      console.log(`✅ Removed ${hookName} hook`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to uninstall ${hookName} hook:`, error.message);
    return false;
  }
}

// Check if we're in the right directory structure
if (!fs.existsSync(rootGitHooksDir)) {
  console.log('ℹ️  .git/hooks directory not found. Nothing to uninstall.');
  process.exit(0);
}

// Uninstall the hooks
let success = true;
success &= uninstallHook(preCommitPath, 'pre-commit');
success &= uninstallHook(prepareCommitMsgPath, 'prepare-commit-msg');

if (success) {
  console.log('');
  console.log('🎉 Git hooks successfully uninstalled!');
} else {
  console.log('');
  console.log('❌ Some hooks failed to uninstall. Please check the errors above.');
  process.exit(1);
}
