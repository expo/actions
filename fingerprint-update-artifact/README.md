<div align="center">
  <h1>expo/actions/fingerprint-update-artifact</h1>
  <p>Internal helper action for updating the fingerprint database with artifact metadata</p>
</div>

> **Warning**
> This is an internal helper action and should not be used standalone. Use [`fingerprint`](../fingerprint/README.md) or [`repack-app-artifact`](../repack-app-artifact/README.md) instead.

## Overview

`fingerprint-update-artifact` is an internal GitHub Action that updates the fingerprint database with artifact metadata after a build or repack operation. This action stores the relationship between fingerprints and their corresponding GitHub artifacts for future reuse.

**Do not use this action directly.** Instead, use:

- [`expo/actions/fingerprint`](../fingerprint/README.md) - For fingerprint checking with manual artifact management
- [`expo/actions/repack-app-artifact`](../repack-app-artifact/README.md) - For all-in-one repackaging with automatic artifact management

## Why is this internal?

This action is part of a larger workflow that requires careful orchestration with other actions:

1. **fingerprint** - Computes and compares fingerprints
2. **fingerprint-query-artifact** - Queries for matching artifacts
3. **repack-app** - Repacks the app with new bundles
4. **fingerprint-update-artifact** - Updates the database with new artifacts (this action)

Using this action standalone can lead to:

- Incomplete fingerprint database entries
- Broken artifact references
- Workflow inconsistencies

The fingerprint database must be updated consistently with proper concurrency controls to avoid conflicts.

## For Advanced Users

If you need fine-grained control over the fingerprint workflow, refer to the [repack-app example workflow](../repack-app/README.md#example-workflows) which demonstrates the complete manual setup with proper concurrency handling.
