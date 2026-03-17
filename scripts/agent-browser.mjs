#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const BASE_URLS = {
  prod: 'https://beauty-decision.com',
  local: 'http://localhost:3000',
};

const PAGE_PATHS = {
  login: '/login',
  home: '/home',
  records: '/records',
  customers: '/customers',
  dashboard: '/dashboard',
  settings: '/settings',
  consultation: '/consultation',
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatTimestamp(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

function printUsage() {
  console.log('Usage:');
  console.log('  pnpm qa:agent -- open <prod|local> <page> [--flow <name>] [--session <name>] [--url <url>]');
  console.log('  pnpm qa:agent -- status <session>');
  console.log('  pnpm qa:agent -- close <session>');
}

function runAgentBrowser(args) {
  const result = spawnSync('npx', ['agent-browser', ...args], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (typeof result.status === 'number') {
    process.exit(result.status);
  }

  process.exit(1);
}

function parseFlags(args) {
  const flags = {};

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (!value.startsWith('--')) continue;
    const key = value.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith('--')) {
      flags[key] = 'true';
      continue;
    }
    flags[key] = next;
    index += 1;
  }

  return flags;
}

const [, , command, ...rest] = process.argv;

if (!command) {
  printUsage();
  process.exit(1);
}

if (command === 'open') {
  const target = rest[0];
  const page = rest[1];
  const flags = parseFlags(rest.slice(2));

  if (!target || !page) {
    printUsage();
    process.exit(1);
  }

  const baseUrl = BASE_URLS[target];
  const pagePath = PAGE_PATHS[page];
  const customUrl = flags.url;

  if (!customUrl && (!baseUrl || !pagePath)) {
    console.error(`Unknown target/page: ${target} ${page}`);
    process.exit(1);
  }

  const flow = flags.flow ?? 'manual';
  const session = flags.session ?? `qa-${target}-${page}-${flow}-${formatTimestamp(new Date())}`;
  const url = customUrl ?? `${baseUrl}${pagePath}`;

  console.log(`session=${session}`);
  console.log(`url=${url}`);
  console.log('rule=do-not-reuse-this-session-in-parallel');

  runAgentBrowser(['--session', session, 'open', url]);
}

if (command === 'status') {
  const session = rest[0];
  if (!session) {
    printUsage();
    process.exit(1);
  }

  runAgentBrowser(['--session', session, 'get', 'url']);
}

if (command === 'close') {
  const session = rest[0];
  if (!session) {
    printUsage();
    process.exit(1);
  }

  runAgentBrowser(['--session', session, 'close']);
}

printUsage();
process.exit(1);
