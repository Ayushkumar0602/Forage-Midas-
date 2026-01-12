#!/usr/bin/env node

/**
 * GitHub Streak Maintainer
 * 
 * This script maintains a consistent GitHub contribution streak by making
 * daily commits and pushing them to the repository.
 * 
 * Usage:
 *   node github-streak.js
 * 
 * Or add to crontab for daily execution:
 *   0 0 * * * cd /path/to/repo && node github-streak.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    logFile: '.github-streak-log.json',
    commitMessage: 'Maintain GitHub streak',
    branch: 'main', // or 'flow' - change as needed
    autoPush: true,
    verbose: true,
    // Optional: Set your GitHub PAT here or use GITHUB_TOKEN environment variable
    // For security, prefer using environment variable: export GITHUB_TOKEN=your_token
    githubToken: process.env.GITHUB_TOKEN || null
};

/**
 * Logs a message if verbose mode is enabled
 */
function log(message) {
    if (CONFIG.verbose) {
        console.log(`[GitHub Streak] ${new Date().toISOString()} - ${message}`);
    }
}

/**
 * Executes a shell command and returns the output
 */
function execCommand(command, options = {}) {
    try {
        const output = execSync(command, {
            encoding: 'utf-8',
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options
        });
        return { success: true, output };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Reads the streak log file
 */
function readStreakLog() {
    const logPath = path.join(process.cwd(), CONFIG.logFile);
    
    if (!fs.existsSync(logPath)) {
        return {
            lastCommitDate: null,
            totalCommits: 0,
            streakDays: 0,
            commits: []
        };
    }
    
    try {
        const content = fs.readFileSync(logPath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        log(`Error reading log file: ${error.message}`);
        return {
            lastCommitDate: null,
            totalCommits: 0,
            streakDays: 0,
            commits: []
        };
    }
}

/**
 * Writes to the streak log file
 */
function writeStreakLog(data) {
    const logPath = path.join(process.cwd(), CONFIG.logFile);
    
    try {
        fs.writeFileSync(logPath, JSON.stringify(data, null, 2), 'utf-8');
        log(`Streak log updated: ${data.streakDays} day streak`);
    } catch (error) {
        log(`Error writing log file: ${error.message}`);
    }
}

/**
 * Gets today's date in YYYY-MM-DD format
 */
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Checks if a commit was made today
 */
function hasCommittedToday(logData) {
    if (!logData.lastCommitDate) {
        return false;
    }
    return logData.lastCommitDate === getTodayDate();
}

/**
 * Calculates the streak days
 */
function calculateStreak(logData, today) {
    if (!logData.lastCommitDate) {
        return 1;
    }
    
    const lastDate = new Date(logData.lastCommitDate);
    const todayDate = new Date(today);
    const diffTime = todayDate - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        // Consecutive day
        return logData.streakDays + 1;
    } else if (diffDays === 0) {
        // Same day
        return logData.streakDays;
    } else {
        // Streak broken, start over
        return 1;
    }
}

/**
 * Creates a commit entry file
 */
function createCommitEntry() {
    const entryPath = path.join(process.cwd(), 'streak-entries.md');
    const today = new Date().toISOString();
    const entry = `\n## ${today}\n\n- GitHub streak maintained\n`;
    
    if (fs.existsSync(entryPath)) {
        fs.appendFileSync(entryPath, entry, 'utf-8');
    } else {
        const header = `# GitHub Streak Entries\n\nThis file tracks daily commits to maintain GitHub contribution streak.\n${entry}`;
        fs.writeFileSync(entryPath, header, 'utf-8');
    }
    
    return entryPath;
}

/**
 * Main function to maintain the streak
 */
async function maintainStreak() {
    log('Starting GitHub streak maintenance...');
    
    // Read current streak log
    const logData = readStreakLog();
    const today = getTodayDate();
    
    // Check if already committed today
    if (hasCommittedToday(logData)) {
        log(`Already committed today (${today}). Streak: ${logData.streakDays} days`);
        return;
    }
    
    // Check if we're in a git repository
    const gitCheck = execCommand('git rev-parse --git-dir', { silent: true });
    if (!gitCheck.success) {
        log('Error: Not a git repository. Please run this script from a git repository.');
        process.exit(1);
    }
    
    // Get current branch
    const branchCheck = execCommand('git branch --show-current', { silent: true });
    const currentBranch = branchCheck.success ? branchCheck.output.trim() : CONFIG.branch;
    
    log(`Current branch: ${currentBranch}`);
    
    // Create commit entry
    const entryPath = createCommitEntry();
    log(`Created commit entry: ${entryPath}`);
    
    // Stage the entry file (log file will be added after update)
    log('Staging changes...');
    const addResult = execCommand(`git add ${entryPath}`);
    if (!addResult.success) {
        log('Error: Failed to stage files');
        process.exit(1);
    }
    
    // Calculate streak before committing
    const newStreakDays = calculateStreak(logData, today);
    const commitMessage = `${CONFIG.commitMessage} - ${today} (Day ${newStreakDays})`;
    
    // Create commit
    log(`Creating commit: ${commitMessage}`);
    const commitResult = execCommand(`git commit -m "${commitMessage}"`);
    
    if (!commitResult.success) {
        log('Warning: Commit failed. This might be because there are no changes or uncommitted changes exist.');
        // Try to see if there are any changes
        const statusCheck = execCommand('git status --porcelain', { silent: true });
        if (statusCheck.success && statusCheck.output.trim()) {
            log('There are uncommitted changes. Please commit or stash them first.');
        }
        return;
    }
    
    // Update streak log
    const updatedLog = {
        lastCommitDate: today,
        totalCommits: logData.totalCommits + 1,
        streakDays: newStreakDays,
        commits: [
            ...logData.commits.slice(-29), // Keep last 30 commits
            {
                date: today,
                message: commitMessage,
                branch: currentBranch
            }
        ]
    };
    writeStreakLog(updatedLog);
    
    // Stage and commit the updated log file if it exists
    const logPath = path.join(process.cwd(), CONFIG.logFile);
    if (fs.existsSync(logPath)) {
        execCommand(`git add ${CONFIG.logFile}`);
        const logCommitResult = execCommand(`git commit -m "Update streak log - ${today}"`);
        if (!logCommitResult.success) {
            log('Note: Could not commit log file update (may already be committed)');
        }
    }
    
    // Push to remote if enabled
    if (CONFIG.autoPush) {
        log(`Pushing to origin/${currentBranch}...`);
        
        // Use PAT if configured
        let pushCommand = `git push origin ${currentBranch}`;
        if (CONFIG.githubToken) {
            // Temporarily set remote URL with token
            const remoteUrl = execCommand('git config --get remote.origin.url', { silent: true });
            const repoUrl = remoteUrl.success ? remoteUrl.output.trim() : '';
            
            if (repoUrl && repoUrl.includes('github.com')) {
                // Extract repo path from URL
                const repoMatch = repoUrl.match(/github\.com[\/:](.+?)(?:\.git)?$/);
                if (repoMatch) {
                    const repoPath = repoMatch[1];
                    const tokenUrl = `https://${CONFIG.githubToken}@github.com/${repoPath}`;
                    pushCommand = `git push ${tokenUrl} ${currentBranch}`;
                    log('Using PAT for authentication');
                }
            }
        }
        
        const pushResult = execCommand(pushCommand, { 
            env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
        });
        
        if (pushResult.success) {
            log(`✅ Successfully pushed! Streak: ${newStreakDays} days`);
        } else {
            log(`⚠️  Commit created locally but push failed. Streak: ${newStreakDays} days`);
            log('You may need to push manually: git push');
            log('Or set GITHUB_TOKEN environment variable: export GITHUB_TOKEN=your_token');
        }
    } else {
        log(`✅ Commit created locally. Streak: ${newStreakDays} days`);
        log('Run "git push" to push to remote.');
    }
    
    log('GitHub streak maintenance completed!');
}

// Run the script
maintainStreak().catch(error => {
    log(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
});
