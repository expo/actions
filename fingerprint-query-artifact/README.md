<div align="center">
  <h1>expo/actions/fingerprint-query-artifact</h1>
  <p>Internal helper action for querying artifacts from the fingerprint database</p>
</div>

> **Warning**
> This is an internal helper action and should not be used standalone. Use [`fingerprint`](../fingerprint/README.md) or [`repack-app-artifact`](../repack-app-artifact/README.md) instead.

## Overview

`fingerprint-query-artifact` is an internal GitHub Action that queries the fingerprint database for previously built artifacts matching a given fingerprint hash and platform. This action is designed to be used as part of the fingerprint-based repackaging workflow.

**Do not use this action directly.** Instead, use:

- [`expo/actions/fingerprint`](../fingerprint/README.md) - For fingerprint checking with manual artifact management
- [`expo/actions/repack-app-artifact`](../repack-app-artifact/README.md) - For all-in-one repackaging with automatic artifact management

## Why is this internal?

This action is part of a larger workflow that requires careful orchestration with other actions:

1. **fingerprint** - Computes and compares fingerprints
2. **fingerprint-query-artifact** - Queries for matching artifacts (this action)
3. **repack-app** - Repacks the app with new bundles
4. **fingerprint-update-artifact** - Updates the database with new artifacts

Using this action standalone can lead to incomplete workflows and unexpected behavior.

## For Advanced Users

If you need fine-grained control over the fingerprint workflow, refer to the [repack-app example workflow](../repack-app/README.md#example-workflows) which demonstrates the complete manual setup.
