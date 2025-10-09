import { setOutput } from '@actions/core';

import { executeAction } from '../actions';
import {
  collectFingerprintActionInput,
  createFingerprintDbManagerAsync,
  createFingerprintOutputAsync,
  saveFingerprintStateAsync,
} from '../fingerprint';

executeAction(runAction);

export async function runAction(input = collectFingerprintActionInput()) {
  const dbManager = await createFingerprintDbManagerAsync(
    input.packager,
    input.fingerprintDbCacheKey
  );
  const { currentFingerprint, previousFingerprint, diff } = await createFingerprintOutputAsync(
    dbManager,
    input
  );
  await dbManager.upsertFingerprintByGitCommitHashAsync(input.currentGitCommitHash, {
    fingerprint: currentFingerprint,
  });
  if (input.fingerprintStateOutputFile) {
    await saveFingerprintStateAsync(input.fingerprintStateOutputFile, {
      currentFingerprint,
      previousFingerprint,
      diff,
      currentGitCommitHash: input.currentGitCommitHash,
      previousGitCommitHash: input.previousGitCommitHash,
    });
  }

  setOutput('previous-fingerprint', previousFingerprint);
  setOutput('current-fingerprint', currentFingerprint);
  setOutput('previous-git-commit', input.previousGitCommitHash);
  setOutput('current-git-commit', input.currentGitCommitHash);
  setOutput('fingerprint-diff', diff);
}
