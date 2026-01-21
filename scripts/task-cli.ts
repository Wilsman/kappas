#!/usr/bin/env npx tsx
/**
 * Developer CLI for inspecting Tarkov task data from both APIs
 * 
 * Usage:
 *   npx tsx scripts/task-cli.ts [command] [options]
 * 
 * Commands:
 *   count                    - Show total number of tasks
 *   search-id <id>           - Search for a task by ID
 *   search-name <name>       - Search for a task by name (fuzzy)
 *   list-all                 - List all tasks (names and IDs)
 *   tarkov-dev               - Fetch and display raw tasks from Tarkov Dev API
 *   overlay                  - Fetch and display overlay data
 *   compare                  - Compare task counts between APIs
 */

const TARKOV_API_URL = 'https://api.tarkov.dev/graphql';
const OVERLAY_URL = 'https://cdn.jsdelivr.net/gh/tarkovtracker-org/tarkov-data-overlay@main/dist/overlay.json';

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
};

interface TarkovTask {
    id: string;
    name: string;
    minPlayerLevel: number;
    wikiLink: string;
    kappaRequired?: boolean;
    lightkeeperRequired?: boolean;
    factionName?: string | null;
    trader: {
        name: string;
    };
    objectives?: {
        description?: string;
        maps?: { name: string }[];
    }[];
    taskRequirements?: {
        task: { id: string; name: string };
    }[];
}

interface OverlayData {
    tasks?: Record<string, unknown>;
    tasksAdd?: Record<string, { id: string; name: string;[key: string]: unknown }>;
    $meta?: {
        version: string;
        generated: string;
    };
}

// ============================================================================
// API Fetching
// ============================================================================

async function fetchTarkovDevTasks(): Promise<TarkovTask[]> {
    console.log(`${colors.cyan}⏳ Fetching tasks from Tarkov Dev API...${colors.reset}`);

    const query = `{
    tasks(lang: en) {
      id
      name
      minPlayerLevel
      wikiLink
      kappaRequired
      lightkeeperRequired
      factionName
      trader { name }
      objectives {
        description
        maps { name }
      }
      taskRequirements {
        task { id name }
      }
    }
  }`;

    const response = await fetch(TARKOV_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }

    const result = await response.json();
    if (result.errors) {
        throw new Error(`GraphQL error: ${result.errors.map((e: { message: string }) => e.message).join(', ')}`);
    }

    return result.data.tasks;
}

async function fetchOverlay(): Promise<OverlayData> {
    console.log(`${colors.cyan}⏳ Fetching overlay data...${colors.reset}`);

    const response = await fetch(OVERLAY_URL);
    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }

    return response.json();
}

// ============================================================================
// Display Helpers
// ============================================================================

function printHeader(title: string) {
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.bright}${colors.cyan}  ${title}${colors.reset}`);
    console.log('='.repeat(60) + '\n');
}

function printTask(task: TarkovTask, index?: number) {
    const prefix = index !== undefined ? `${colors.dim}[${index + 1}]${colors.reset} ` : '';
    const kappa = task.kappaRequired ? `${colors.yellow}[κ]${colors.reset}` : '';
    const lk = task.lightkeeperRequired ? `${colors.magenta}[LK]${colors.reset}` : '';

    console.log(`${prefix}${colors.bright}${task.name}${colors.reset} ${kappa}${lk}`);
    console.log(`    ${colors.dim}ID:${colors.reset} ${task.id}`);
    console.log(`    ${colors.dim}Trader:${colors.reset} ${task.trader.name}`);
    console.log(`    ${colors.dim}Level:${colors.reset} ${task.minPlayerLevel}`);

    if (task.factionName) {
        console.log(`    ${colors.dim}Faction:${colors.reset} ${task.factionName}`);
    }

    if (task.objectives && task.objectives.length > 0) {
        console.log(`    ${colors.dim}Objectives:${colors.reset} ${task.objectives.length}`);
    }

    if (task.taskRequirements && task.taskRequirements.length > 0) {
        console.log(`    ${colors.dim}Requires:${colors.reset} ${task.taskRequirements.map(r => r.task.name).join(', ')}`);
    }

    console.log(`    ${colors.dim}Wiki:${colors.reset} ${task.wikiLink}`);
    console.log('');
}

function printOverlayTask(id: string, task: { name: string;[key: string]: unknown }, index: number) {
    console.log(`${colors.dim}[${index + 1}]${colors.reset} ${colors.bright}${task.name}${colors.reset}`);
    console.log(`    ${colors.dim}ID:${colors.reset} ${id}`);
    console.log('');
}

// ============================================================================
// Commands
// ============================================================================

async function countTasks() {
    printHeader('Task Count Summary');

    const [tasks, overlay] = await Promise.all([
        fetchTarkovDevTasks(),
        fetchOverlay(),
    ]);

    const overlayAddedTasks = overlay.tasksAdd ? Object.keys(overlay.tasksAdd).length : 0;
    const overlayModifiedTasks = overlay.tasks ? Object.keys(overlay.tasks).length : 0;

    console.log(`${colors.green}✓${colors.reset} Tarkov Dev API Tasks: ${colors.bright}${tasks.length}${colors.reset}`);
    console.log(`${colors.green}✓${colors.reset} Overlay Modified Tasks: ${colors.bright}${overlayModifiedTasks}${colors.reset}`);
    console.log(`${colors.green}✓${colors.reset} Overlay Added Tasks: ${colors.bright}${overlayAddedTasks}${colors.reset}`);
    console.log('');
    console.log(`${colors.cyan}Total Combined (approx): ${colors.bright}${tasks.length + overlayAddedTasks}${colors.reset}`);

    // Kappa stats
    const kappaRequired = tasks.filter(t => t.kappaRequired).length;
    const lkRequired = tasks.filter(t => t.lightkeeperRequired).length;

    console.log('');
    console.log(`${colors.yellow}κ${colors.reset} Kappa Required: ${colors.bright}${kappaRequired}${colors.reset}`);
    console.log(`${colors.magenta}LK${colors.reset} Lightkeeper Required: ${colors.bright}${lkRequired}${colors.reset}`);
}

async function searchById(id: string) {
    printHeader(`Search by ID: ${id}`);

    const [tasks, overlay] = await Promise.all([
        fetchTarkovDevTasks(),
        fetchOverlay(),
    ]);

    // Search in Tarkov Dev tasks
    const exactMatch = tasks.find(t => t.id === id);
    const partialMatches = tasks.filter(t => t.id.toLowerCase().includes(id.toLowerCase()) && t.id !== id);

    if (exactMatch) {
        console.log(`${colors.green}✓ Exact match found in Tarkov Dev API:${colors.reset}\n`);
        printTask(exactMatch);
    }

    if (partialMatches.length > 0) {
        console.log(`${colors.yellow}⚠ Partial ID matches (${partialMatches.length}):${colors.reset}\n`);
        partialMatches.slice(0, 5).forEach((t, i) => printTask(t, i));
        if (partialMatches.length > 5) {
            console.log(`${colors.dim}  ...and ${partialMatches.length - 5} more${colors.reset}`);
        }
    }

    // Check overlay
    if (overlay.tasks?.[id]) {
        console.log(`${colors.cyan}📝 Found in overlay modifications:${colors.reset}`);
        console.log(JSON.stringify(overlay.tasks[id], null, 2));
    }

    if (overlay.tasksAdd?.[id]) {
        console.log(`${colors.cyan}➕ Found in overlay additions:${colors.reset}`);
        console.log(JSON.stringify(overlay.tasksAdd[id], null, 2));
    }

    if (!exactMatch && partialMatches.length === 0 && !overlay.tasks?.[id] && !overlay.tasksAdd?.[id]) {
        console.log(`${colors.red}✗ No tasks found with ID: ${id}${colors.reset}`);
    }
}

async function searchByName(name: string) {
    printHeader(`Search by Name: "${name}"`);

    const [tasks, overlay] = await Promise.all([
        fetchTarkovDevTasks(),
        fetchOverlay(),
    ]);

    const searchTerm = name.toLowerCase();

    // Search in Tarkov Dev tasks
    const matches = tasks.filter(t => t.name.toLowerCase().includes(searchTerm));

    if (matches.length > 0) {
        console.log(`${colors.green}✓ Found ${matches.length} match(es) in Tarkov Dev API:${colors.reset}\n`);
        matches.slice(0, 10).forEach((t, i) => printTask(t, i));
        if (matches.length > 10) {
            console.log(`${colors.dim}  ...and ${matches.length - 10} more${colors.reset}`);
        }
    }

    // Search in overlay additions
    const overlayMatches = overlay.tasksAdd
        ? Object.entries(overlay.tasksAdd).filter(([, t]) =>
            t.name.toLowerCase().includes(searchTerm)
        )
        : [];

    if (overlayMatches.length > 0) {
        console.log(`\n${colors.cyan}➕ Found ${overlayMatches.length} match(es) in overlay additions:${colors.reset}\n`);
        overlayMatches.forEach(([id, task], i) => printOverlayTask(id, task, i));
    }

    if (matches.length === 0 && overlayMatches.length === 0) {
        console.log(`${colors.red}✗ No tasks found matching: "${name}"${colors.reset}`);
    }
}

async function listAll() {
    printHeader('All Tasks');

    const tasks = await fetchTarkovDevTasks();

    console.log(`${colors.dim}Listing all ${tasks.length} tasks:${colors.reset}\n`);

    // Group by trader
    const byTrader = new Map<string, TarkovTask[]>();
    tasks.forEach(task => {
        const trader = task.trader.name;
        if (!byTrader.has(trader)) {
            byTrader.set(trader, []);
        }
        byTrader.get(trader)!.push(task);
    });

    for (const [trader, traderTasks] of byTrader) {
        console.log(`\n${colors.bright}${colors.yellow}▸ ${trader}${colors.reset} (${traderTasks.length} tasks)`);
        traderTasks.forEach(t => {
            const kappa = t.kappaRequired ? `${colors.yellow}κ${colors.reset}` : ' ';
            console.log(`  ${kappa} ${t.name} ${colors.dim}(${t.id})${colors.reset}`);
        });
    }
}

async function showTarkovDev() {
    printHeader('Tarkov Dev API - Raw Tasks');

    const tasks = await fetchTarkovDevTasks();

    console.log(`${colors.green}✓ Fetched ${tasks.length} tasks${colors.reset}\n`);

    // Show first 20 as sample
    console.log(`${colors.dim}Showing first 20 tasks:${colors.reset}\n`);
    tasks.slice(0, 20).forEach((t, i) => printTask(t, i));

    console.log(`${colors.dim}...and ${tasks.length - 20} more tasks${colors.reset}`);
}

async function showOverlay() {
    printHeader('Overlay API Data');

    const overlay = await fetchOverlay();

    console.log(`${colors.green}✓ Overlay fetched successfully${colors.reset}\n`);

    if (overlay.$meta) {
        console.log(`${colors.dim}Version:${colors.reset} ${overlay.$meta.version}`);
        console.log(`${colors.dim}Generated:${colors.reset} ${overlay.$meta.generated}`);
        console.log('');
    }

    const modifiedCount = overlay.tasks ? Object.keys(overlay.tasks).length : 0;
    const addedCount = overlay.tasksAdd ? Object.keys(overlay.tasksAdd).length : 0;

    console.log(`${colors.cyan}Modified Tasks:${colors.reset} ${modifiedCount}`);
    if (overlay.tasks && modifiedCount > 0) {
        console.log(`${colors.dim}  IDs: ${Object.keys(overlay.tasks).slice(0, 5).join(', ')}${modifiedCount > 5 ? ` +${modifiedCount - 5} more` : ''}${colors.reset}`);
    }

    console.log(`\n${colors.cyan}Added Tasks:${colors.reset} ${addedCount}`);
    if (overlay.tasksAdd && addedCount > 0) {
        Object.entries(overlay.tasksAdd).forEach(([id, task], i) => {
            printOverlayTask(id, task, i);
        });
    }
}

async function compare() {
    printHeader('API Comparison');

    const [tasks, overlay] = await Promise.all([
        fetchTarkovDevTasks(),
        fetchOverlay(),
    ]);

    console.log(`${colors.bright}Source Comparison:${colors.reset}\n`);
    console.log(`┌─────────────────────────────────────────────┐`);
    console.log(`│ Tarkov Dev API Tasks:      ${String(tasks.length).padStart(6)}          │`);
    console.log(`├─────────────────────────────────────────────┤`);
    console.log(`│ Overlay Modifications:     ${String(Object.keys(overlay.tasks || {}).length).padStart(6)}          │`);
    console.log(`│ Overlay Additions:         ${String(Object.keys(overlay.tasksAdd || {}).length).padStart(6)}          │`);
    console.log(`└─────────────────────────────────────────────┘`);

    // Check for overlapping IDs
    const apiIds = new Set(tasks.map(t => t.id));
    const modifiedIds = new Set(Object.keys(overlay.tasks || {}));

    const modifiedExisting = [...modifiedIds].filter(id => apiIds.has(id));
    const modifiedMissing = [...modifiedIds].filter(id => !apiIds.has(id));

    console.log(`\n${colors.bright}Overlay Analysis:${colors.reset}`);
    console.log(`  ${colors.green}✓${colors.reset} Modifications targeting existing tasks: ${modifiedExisting.length}`);
    if (modifiedMissing.length > 0) {
        console.log(`  ${colors.yellow}⚠${colors.reset} Modifications targeting unknown IDs: ${modifiedMissing.length}`);
        console.log(`    ${colors.dim}${modifiedMissing.join(', ')}${colors.reset}`);
    }
}

function showHelp() {
    console.log(`
${colors.bright}${colors.cyan}Tarkov Task CLI${colors.reset}
${colors.dim}Developer tool for inspecting task data from Tarkov Dev API and overlay${colors.reset}

${colors.bright}Usage:${colors.reset}
  npx tsx scripts/task-cli.ts [command] [options]

${colors.bright}Commands:${colors.reset}
  ${colors.green}count${colors.reset}                  Show total number of tasks from all sources
  ${colors.green}search-id <id>${colors.reset}         Search for a task by ID (exact or partial)
  ${colors.green}search-name <name>${colors.reset}     Search for a task by name (fuzzy match)
  ${colors.green}list-all${colors.reset}               List all tasks grouped by trader
  ${colors.green}tarkov-dev${colors.reset}             Fetch and display tasks from Tarkov Dev API
  ${colors.green}overlay${colors.reset}                Fetch and display overlay data
  ${colors.green}compare${colors.reset}                Compare task data between APIs

${colors.bright}Examples:${colors.reset}
  npx tsx scripts/task-cli.ts count
  npx tsx scripts/task-cli.ts search-id 5c51aac186f77432ea65c552
  npx tsx scripts/task-cli.ts search-name "friend from"
  npx tsx scripts/task-cli.ts list-all
`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
        switch (command) {
            case 'count':
                await countTasks();
                break;
            case 'search-id':
                if (!args[1]) {
                    console.error(`${colors.red}Error: Please provide a task ID${colors.reset}`);
                    process.exit(1);
                }
                await searchById(args[1]);
                break;
            case 'search-name':
                if (!args[1]) {
                    console.error(`${colors.red}Error: Please provide a search term${colors.reset}`);
                    process.exit(1);
                }
                await searchByName(args.slice(1).join(' '));
                break;
            case 'list-all':
                await listAll();
                break;
            case 'tarkov-dev':
                await showTarkovDev();
                break;
            case 'overlay':
                await showOverlay();
                break;
            case 'compare':
                await compare();
                break;
            case 'help':
            case '--help':
            case '-h':
            default:
                showHelp();
                break;
        }
    } catch (error) {
        console.error(`${colors.red}Error: ${error instanceof Error ? error.message : error}${colors.reset}`);
        process.exit(1);
    }
}

main();
