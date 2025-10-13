import { getInput } from '@actions/core';
import * as github from '@actions/github';
import { type Fingerprint as FingerprintType } from '@expo/fingerprint';
import assert from 'node:assert';

import { executeAction } from '../actions';
import {
  FingerprintDbManager,
  createFingerprintDbManagerAsync,
  loadFingerprintStateAsync,
} from '../fingerprint';

executeAction(runAction);

async function runAction() {
  const fingerprintStateFile = getInput('fingerprint-state-file', { required: true });
  const platform = getInput('platform', { required: true });
  const artifactId = getInput('artifact-id', { required: true });
  const artifactUrl = getInput('artifact-url', { required: true });
  const artifactDigest = getInput('artifact-digest', { required: true });
  const packager = getInput('packager');
  const fingerprintDbCacheKey = getInput('fingerprint-db-cache-key');
  const fingerprintDbCachePath = getInput('fingerprint-db-cache-path');

  const { currentFingerprint, currentGitCommitHash } =
    await loadFingerprintStateAsync(fingerprintStateFile);

  const dbManager = await createFingerprintDbManagerAsync(
    packager,
    fingerprintDbCacheKey,
    fingerprintDbCachePath
  );

  await updateFingerprintDbAsync({
    dbManager,
    fingerprintDbCacheKey,
    gitCommitHash: currentGitCommitHash,
    fingerprint: currentFingerprint,
    platform,
    githubArtifact: {
      artifactId,
      artifactUrl,
      artifactDigest,
      workflowRunId: String(github.context.runId),
      platform,
    },
  });
}

async function updateFingerprintDbAsync(params: {
  dbManager: FingerprintDbManager;
  fingerprintDbCacheKey: string;
  gitCommitHash: string;
  fingerprint: FingerprintType;
  platform: string;
  githubArtifact: {
    artifactId: string;
    artifactUrl: string;
    artifactDigest: string;
    workflowRunId: string;
    platform: string;
  };
}) {
  await params.dbManager.upsertFingerprintByGitCommitHashAsync(params.gitCommitHash, {
    fingerprint: params.fingerprint,
  });
  const fingerprintEntity = await params.dbManager.getEntityFromGitCommitHashAsync(
    params.gitCommitHash
  );
  assert(fingerprintEntity, 'Fingerprint entity should exist after upsert');

  const artifactsManager = params.dbManager.getArtifactsManager();
  await artifactsManager.insertArtifactAsync({
    fingerprintId: fingerprintEntity.id,
    artifactId: params.githubArtifact.artifactId,
    artifactUrl: params.githubArtifact.artifactUrl,
    artifactDigest: params.githubArtifact.artifactDigest,
    workflowRunId: params.githubArtifact.workflowRunId,
    platform: params.githubArtifact.platform,
  });
}
