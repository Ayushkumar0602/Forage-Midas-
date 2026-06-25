# Github streak — Technical Documentation

## Overview
The `github-streak.js` module is an automation utility designed to maintain a consistent GitHub contribution graph. It programmatically generates daily commits to a local repository, updates a local tracking log, and pushes changes to a remote Git repository. It is intended to be triggered via `cron` or similar task schedulers to ensure continuous activity.

## Architecture
This script acts as a standalone CLI utility. It sits at the top level of a local Git repository and interfaces directly with the host system's Git installation and the local filesystem.

*   **Dependencies:** Node.js `child_process` (for Git operations), `fs` (for log persistence), and `path`.
*   **Downstream:** None; this is a leaf-node automation script.
*   **Upstream:** Depends on a initialized Git repository and proper environmental authentication (e.g., SSH keys or a GitHub Personal Access Token).

## Design Principles
*   **Idempotency:** The module checks the current date against the last recorded commit before performing any actions, ensuring that running the script multiple times per day does not create redundant commits.
*   **State Persistence:** Uses a JSON log file (`.github-streak-log.json`) to track streak metrics independently of Git commit history, facilitating faster state verification.
*   **Defensive Execution:** Implements command-line execution wrappers that catch and handle shell failures, preventing the script from crashing silently.
*   **Security-First Configuration:** Prioritizes `GITHUB_TOKEN` from environment variables, preventing hardcoded credentials.

## API Reference

### `maintainStreak()`
*   **Signature:** `async function maintainStreak()`
*   **Return Type:** `Promise<void>`
*   **Description:** The main orchestration function. Coordinates log reading, streak calculation, file modification, Git operations, and remote synchronization.

### `calculateStreak(logData, today)`
*   **Signature:** `function calculateStreak(Object logData, String today)`
*   **Parameters:**
    *   `logData`: The object parsed from the streak log.
    *   `today`: Current date string (YYYY-MM-DD).
*   **Return Type:** `Number`
*   **Description:** Implements business logic to determine if a streak is incremented, maintained, or reset based on time deltas.

### `execCommand(command, options)`
*   **Signature:** `function execCommand(String command, Object options)`
*   **Parameters:** `command` (string), `options` (optional object).
*   **Return Type:** `{ success: boolean, output?: string, error?: string }`
*   **Description:** A wrapper for `child_process.execSync` that normalizes output and captures standard errors.

## Internal Logic
1.  **State Check:** Reads `.github-streak-log.json` to determine if a commit has already occurred today.
2.  **Validation:** Verifies that the execution context is a Git-initialized directory.
3.  **Work Generation:** Appends a timestamped entry to `streak-entries.md`.
4.  **Version Control:** Stages the entry file via `git add` and creates a commit with a descriptive message including the current streak count.
5.  **State Update:** Writes new metadata (total commits, streak duration) back to the JSON log.
6.  **Remote Synchronization:** If `autoPush` is enabled, it attempts to push to `origin`. It dynamically handles authentication by injecting a `GITHUB_TOKEN` into the remote URL if provided.

## Data Flow
1.  **Input:** Reads from `streak-entries.md` (filesystem) and `.github-streak-log.json` (persistence).
2.  **Transformation:** Logic checks dates; increments integer counters; updates JSON state.
3.  **Output:** 
    *   `git commit` (System Git state).
    *   Updated `streak-entries.md` and `.github-streak-log.json` (Filesystem).
    *   `git push` (Network/Remote).

## Error Handling & Edge Cases
*   **Non-Git Directories:** Script terminates with an error code if `git rev-parse` fails.
*   **Execution Errors:** If `git commit` fails due to uncommitted changes, the script logs a warning rather than crashing, advising the user to handle existing changes.
*   **Remote Failure:** If the push fails (e.g., authentication error), the script retains the local commit and provides manual recovery instructions.
*   **Empty State:** Handles the initial run gracefully by initializing the log file if absent.

## Usage Example

### Running Manually
```bash
# Execute the script
node github-streak.js
```

### Scheduling with Crontab
To maintain a daily streak, add the following to your crontab (`crontab -e`) to execute at midnight:

```bash
# Run at 00:00 every day
0 0 * * * cd /home/user/my-repo && GITHUB_TOKEN=ghp_yourtoken node github-streak.js
```