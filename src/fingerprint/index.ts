import { getBooleanInput, getInput, group, info } from '@actions/core';
import { context as githubContext } from '@actions/github';
import { mkdirP } from '@actions/io';
import type * as Fingerprint from '@expo/fingerprint';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

import { FingerprintDbEntity, FingerprintDbManager } from './FingerprintDbManager';
import { addGlobalNodeSearchPath, installToolFromPackage } from '../actions';
import { downloadCache, uploadCache } from '../caches';
import { installPackage, resolvePackageVersion } from '../packages';
import { installSQLiteAsync } from '../sqlite';

export * from './FingerprintDbManager';

export interface FingerprintOutput {
  currentFingerprint: Fingerprint.Fingerprint;
  previousFingerprint: Fingerprint.Fingerprint | null;
  diff: Fingerprint.FingerprintDiffItem[];
}

/**
 * FingerprintState is all the outputs from `expo/actions/fingerprint` saving to a temporary file.
 * It is used to pass the fingerprint state to other actions without exceeding the maximum length of the action inputs.
 */
export interface FingerprintState extends FingerprintOutput {
  currentGitCommitHash: string;
  previousGitCommitHash: string;
}

/**
 * Shared logic to create a fingerprint diff for fingerprint actions
 */
export async function createFingerprintOutputAsync(
  dbManager: FingerprintDbManager,
  input: ReturnType<typeof collectFingerprintActionInput>
): Promise<FingerprintOutput> {
  await installFingerprintAsync(
    input.fingerprintVersion,
    input.packager,
    input.fingerprintInstallationCache
  );
  const fingerprint = require('@expo/fingerprint') as typeof import('@expo/fingerprint');
  const currentFingerprint = await fingerprint.createFingerprintAsync(input.workingDirectory);

  let previousFingerprint: FingerprintDbEntity | null = null;
  if (input.previousGitCommitHash) {
    previousFingerprint = await dbManager.getEntityFromGitCommitHashAsync(
      input.previousGitCommitHash
    );
  }

  const diff =
    previousFingerprint != null
      ? await fingerprint.diffFingerprints(previousFingerprint.fingerprint, currentFingerprint)
      : await fingerprint.diffFingerprints({ sources: [], hash: '' }, currentFingerprint);
  return {
    currentFingerprint,
    previousFingerprint: previousFingerprint?.fingerprint ?? null,
    diff,
  };
}

/**
 * Create a FingerprintDbManager instance
 */
export async function createFingerprintDbManagerAsync(
  packager: string,
  cacheKey: string
): Promise<FingerprintDbManager> {
  await installSQLiteAsync(packager);

  const dbPath = await getDbPathAsync();
  const cacheHit = (await restoreDbFromCacheAsync(cacheKey)) != null;
  if (cacheHit) {
    info(`Restored fingerprint database from cache - cacheKey[${cacheKey}]`);
  } else {
    info(
      `Missing fingerprint database from cache - will create a new database - cacheKey[${cacheKey}]`
    );
  }
  const dbManager = new FingerprintDbManager(dbPath);
  await dbManager.initAsync();
  return dbManager;
}

/**
 * Common inputs for fingerprint actions
 */
export function collectFingerprintActionInput() {
  return {
    packager: getInput('packager') || 'yarn',
    githubToken: getInput('github-token'),
    workingDirectory: getInput('working-directory'),
    fingerprintVersion: getInput('fingerprint-version') || 'latest',
    fingerprintInstallationCache:
      !getInput('fingerprint-installation-cache') ||
      getBooleanInput('fingerprint-installation-cache'),
    fingerprintDbCacheKey: getInput('fingerprint-db-cache-key'),
    previousGitCommitHash:
      getInput('previous-git-commit') ||
      (githubContext.eventName === 'pull_request'
        ? githubContext.payload.pull_request?.base?.sha
        : githubContext.payload.before),
    currentGitCommitHash:
      getInput('current-git-commit') ||
      (githubContext.eventName === 'pull_request'
        ? githubContext.payload.pull_request?.head?.sha
        : githubContext.sha),
    savingDbBranch: getInput('saving-db-branch') || undefined,
    fingerprintStateOutputFile: getInput('fingerprint-state-output-file'),
  };
}

/**
 * Save the fingerprint state to a file
 */
export function saveFingerprintStateAsync(stateFile: string, fingerprintState: FingerprintState) {
  return fs.promises.writeFile(stateFile, JSON.stringify(fingerprintState));
}

/**
 * Load the fingerprint state from a file
 */
export async function loadFingerprintStateAsync(stateFile: string): Promise<FingerprintState> {
  try {
    const stat = await fs.promises.stat(stateFile);
    if (!stat.isFile()) {
      throw new Error(`${stateFile} is not a file`);
    }
  } catch {
    throw new Error(`${stateFile} does not exist`);
  }
  return JSON.parse(await fs.promises.readFile(stateFile, 'utf8'));
}

/**
 * Install @expo/fingerprint based on given input
 */
export async function installFingerprintAsync(
  fingerprintVersion: string,
  packager: string,
  useCache: boolean = true
): Promise<string> {
  const packageName = '@expo/fingerprint';
  const version = await resolvePackageVersion(packageName, fingerprintVersion);
  const message = useCache
    ? `Installing ${packageName} (${version}) from cache or with ${packager}`
    : `Installing ${packageName} (${version}) with ${packager}`;

  return await group(message, async () => {
    const libRoot = await installPackage({
      name: packageName,
      version,
      packageManager: packager,
      packageCache: useCache,
    });

    installToolFromPackage(libRoot);
    addGlobalNodeSearchPath(path.join(libRoot, 'node_modules'));
    return libRoot;
  });
}

/**
 * Restore database from the remote cache.
 * This will install the tool back into the local tool cache.
 */
export async function restoreDbFromCacheAsync(cacheKey: string) {
  return downloadCache(path.dirname(await getDbPathAsync()), cacheKey);
}

/**
 * Save database to the remote cache.
 * This will fetch from the local tool cache.
 */
export async function saveDbToCacheAsync(cacheKey: string) {
  info(`Saving fingerprint database to cache: ${cacheKey}`);
  return uploadCache(path.dirname(await getDbPathAsync()), cacheKey);
}

/**
 * Get the path to the fingerprint database
 */
async function getDbPathAsync(): Promise<string> {
  assert(
    process.env['RUNNER_TOOL_CACHE'],
    'Could not resolve the local tool cache, RUNNER_TOOL_CACHE not defined'
  );
  const result = path.join(
    process.env['RUNNER_TOOL_CACHE'],
    'fingerprint-storage',
    'fingerprint.db'
  );
  const dir = path.dirname(result);
  if (!(await fs.promises.stat(dir).catch(() => null))) {
    await mkdirP(dir);
  }
  return result;
}
