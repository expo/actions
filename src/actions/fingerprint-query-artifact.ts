import { getInput, setOutput } from '@actions/core';

import { executeAction } from '../actions';
import { createFingerprintDbManagerAsync, loadFingerprintStateAsync } from '../fingerprint';

executeAction(runAction);

async function runAction() {
  const fingerprintStateFile = getInput('fingerprint-state-file', { required: true });
  const platform = getInput('platform', { required: true });
  const packager = getInput('packager');
  const fingerprintDbCacheKey = getInput('fingerprint-db-cache-key');

  const { currentFingerprint, diff } = await loadFingerprintStateAsync(fingerprintStateFile);
  const dbManager = await createFingerprintDbManagerAsync(packager, fingerprintDbCacheKey);
  const githubArtifact = await dbManager.getFirstGitHubArtifactAsync(
    currentFingerprint.hash,
    platform
  );

  if (githubArtifact && diff.length === 0) {
    setOutput('artifact-id', githubArtifact.artifactId);
    setOutput('artifact-url', githubArtifact.artifactUrl);
    setOutput('run-id', githubArtifact.workflowRunId);
  } else {
    setOutput('artifact-id', '');
    setOutput('artifact-url', '');
    setOutput('run-id', '');
  }
}
