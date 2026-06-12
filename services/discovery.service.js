import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import * as discoveryRunRepo from '../repositories/discovery-run.repository.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let currentRunId = null;
let activeLogs = [];
let activeChild = null;

export const getCurrentRunId = () => currentRunId;

export const getActiveRunLogs = async () => {
  return activeLogs;
};

export const stopDiscovery = async () => {
  if (!activeChild) {
    throw new Error('No active discovery run to stop.');
  }
  activeChild.kill('SIGTERM');
  return { stopped: true };
};

export const startDiscovery = async (userId) => {
  const running = await discoveryRunRepo.findRunningRun();
  if (running) {
    throw new Error('A discovery run is already in progress. Wait for it to complete.');
  }

  const run = await discoveryRunRepo.createRun({
    status: 'running',
    triggeredBy: userId,
    startedAt: new Date(),
    log: [],
  });

  currentRunId = run._id;
  activeLogs = [];

  const scriptPath = path.resolve(__dirname, '..', 'scripts', 'discover-cli-tools.js');
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    let buffer = '';

    const flush = () => {
      if (!buffer) return;
      const lines = buffer.split('\n').filter(Boolean);
      activeLogs.push(...lines);
      buffer = '';
    };

    const interval = setInterval(flush, 1500);

    const child = spawn('node', [scriptPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });
    activeChild = child;

    let summaryResult = null;

    const onData = (text) => {
      const summaryMatch = text.match(/##SUMMARY##\s+(\{.+\})/);
      if (summaryMatch) {
        try { summaryResult = JSON.parse(summaryMatch[1]); } catch (_) {}
        text = text.slice(0, summaryMatch.index);
      }
      buffer += text;
    };

    child.stdout.on('data', (chunk) => onData(chunk.toString()));
    child.stderr.on('data', (chunk) => onData(chunk.toString()));

    child.on('error', (err) => {
      clearInterval(interval);
      activeChild = null;
      buffer = '';
      const duration = Date.now() - startTime;
      activeLogs.push(`FATAL: ${err.message}`);
      currentRunId = null;
      discoveryRunRepo.updateRunById(run._id, {
        status: 'failed',
        log: activeLogs.slice(-100),
        completedAt: new Date(),
        duration,
      }).finally(() => reject(err));
    });

    child.on('close', async (code) => {
      clearInterval(interval);
      activeChild = null;
      flush();
      const duration = Date.now() - startTime;

      if (code !== 0 || !summaryResult) {
        activeLogs.push(`Process exited with code ${code}`);
        await discoveryRunRepo.updateRunById(run._id, {
          status: 'failed',
          log: activeLogs.slice(-100),
          completedAt: new Date(),
          duration,
        });
        currentRunId = null;
        return reject(new Error(`Discovery script exited with code ${code}`));
      }

      await discoveryRunRepo.updateRunById(run._id, {
        status: 'completed',
        candidates: (summaryResult.inserted || 0) + (summaryResult.errors || 0),
        inserted: summaryResult.inserted || 0,
        errors: summaryResult.errors || 0,
        accumulated: summaryResult.accumulated || 0,
        duration,
        log: activeLogs.slice(-100),
        completedAt: new Date(),
      });
      const updated = await discoveryRunRepo.findRunById(run._id);
      currentRunId = null;
      resolve(updated);
    });
  });
};

export const getRunStatus = async (runId) => {
  return await discoveryRunRepo.findRunById(runId);
};

export const getRunHistory = async () => {
  return await discoveryRunRepo.findRecentRuns(10);
};

export const getLastRun = async () => {
  return await discoveryRunRepo.findLatestRun();
};
