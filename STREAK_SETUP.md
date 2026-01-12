# GitHub Streak Maintainer Setup Guide

This guide explains how to set up and use the GitHub streak maintainer script.

## Overview

The `github-streak.js` script automatically maintains your GitHub contribution streak by making daily commits and pushing them to your repository.

## Features

- ✅ Automatic daily commits
- ✅ Streak tracking and logging
- ✅ Automatic push to GitHub
- ✅ Prevents duplicate commits on the same day
- ✅ Configurable commit messages and branch
- ✅ Detailed logging

## Prerequisites

- Node.js installed (version 12 or higher)
- Git configured with your credentials
- Repository already initialized and connected to GitHub

## Quick Start

### 1. Make the script executable (optional)

```bash
chmod +x github-streak.js
```

### 2. Run manually

```bash
node github-streak.js
```

### 3. Test it works

The script will:
- Create a `streak-entries.md` file
- Create a `.github-streak-log.json` file
- Make a commit
- Push to GitHub

## Automated Daily Execution

### Option 1: Using Cron (macOS/Linux)

1. Open your crontab:
```bash
crontab -e
```

2. Add this line to run daily at midnight:
```bash
0 0 * * * cd /Users/ayushjaiswal/Desktop/for/forage-midas && /usr/local/bin/node github-streak.js >> /tmp/github-streak.log 2>&1
```

**Note**: Replace the path with your actual repository path and Node.js path (find it with `which node`).

### Option 2: Using macOS LaunchAgent

1. Create a plist file:
```bash
nano ~/Library/LaunchAgents/com.github.streak.plist
```

2. Add this content (adjust paths):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.github.streak</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/ayushjaiswal/Desktop/for/forage-midas/github-streak.js</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>0</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/tmp/github-streak.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/github-streak-error.log</string>
</dict>
</plist>
```

3. Load the agent:
```bash
launchctl load ~/Library/LaunchAgents/com.github.streak.plist
```

### Option 3: Using GitHub Actions (Recommended)

Create `.github/workflows/streak.yml`:

```yaml
name: Maintain GitHub Streak

on:
  schedule:
    - cron: '0 0 * * *'  # Run daily at midnight UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  maintain-streak:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Configure Git
        run: |
          git config --global user.name "GitHub Actions"
          git config --global user.email "actions@github.com"
          
      - name: Run streak script
        run: node github-streak.js
        
      - name: Push changes
        run: |
          git push origin main
```

## Configuration

Edit the `CONFIG` object in `github-streak.js`:

```javascript
const CONFIG = {
    logFile: '.github-streak-log.json',
    commitMessage: 'Maintain GitHub streak',
    branch: 'main', // Change to 'flow' or your preferred branch
    autoPush: true,
    verbose: true
};
```

## Authentication

### Using Personal Access Token (PAT)

1. Create a PAT on GitHub:
   - Go to Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate a new token with `repo` scope

2. Use it in the remote URL:
```bash
git remote set-url origin https://YOUR_TOKEN@github.com/USERNAME/REPO.git
```

### Using SSH

1. Set up SSH keys on GitHub
2. Change remote to SSH:
```bash
git remote set-url origin git@github.com:USERNAME/REPO.git
```

## Troubleshooting

### Script says "Not a git repository"
- Make sure you're running the script from the repository root
- Verify with: `git status`

### Push fails with authentication error
- Set up authentication (PAT or SSH) as described above
- Test with: `git push origin main`

### Cron job not running
- Check cron logs: `grep CRON /var/log/syslog` (Linux) or check Console.app (macOS)
- Verify Node.js path: `which node`
- Use absolute paths in cron

### Duplicate commits
- The script prevents duplicate commits on the same day
- If you see duplicates, check the `.github-streak-log.json` file

## Files Created

- `streak-entries.md`: Tracks daily commit entries
- `.github-streak-log.json`: Stores streak statistics and history

Both files are committed to the repository (they're not in `.gitignore` by default, but you can add them if preferred).

## Best Practices

1. **Run manually first** to ensure everything works
2. **Test authentication** before setting up automation
3. **Monitor logs** to ensure the script runs successfully
4. **Keep the script updated** if you change repository structure
5. **Use GitHub Actions** for cloud-based automation (no local machine needed)

## Security Notes

- Never commit your PAT to the repository
- Use environment variables or GitHub secrets for tokens
- Consider using SSH keys instead of PATs for better security
- Review commits regularly to ensure they're appropriate

## License

This script is provided as-is for maintaining GitHub contribution streaks. Use responsibly and in accordance with GitHub's Terms of Service.
