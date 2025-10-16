import { glob } from 'glob';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Determines the absolute path to the source app.
 */
export async function determineSourceAppPathAsync(sourceApp: string): Promise<string> {
  const sourceAppPath = path.resolve(sourceApp);
  let isFile = false;
  try {
    const stat = await fs.promises.stat(sourceAppPath);
    isFile = stat.isFile();
  } catch {
    throw new Error(`The source app file does not exist: ${sourceApp}`);
  }

  if (isFile) {
    return sourceAppPath;
  }

  const isAppDirectory = (
    await Promise.all([
      pathExistsAsync(path.join(sourceAppPath, 'Info.plist')),
      pathExistsAsync(path.join(sourceAppPath, 'Frameworks')),
    ])
  ).every((exists) => exists);
  if (isAppDirectory) {
    const baseName = path.basename(sourceAppPath);
    const targetPath = path.join(path.dirname(sourceAppPath), `${baseName}.app`);
    await fs.promises.rename(sourceAppPath, targetPath);
    return targetPath;
  }

  const candidates = await glob('**/*.{apk,aab,ipa}', { cwd: sourceAppPath, absolute: true });
  if (candidates.length === 0) {
    throw new Error(`No app files found in the directory: ${sourceApp}`);
  }
  if (candidates.length > 1) {
    throw new Error(`Multiple app files found in the directory: ${sourceApp}`);
  }
  return candidates[0];
}

export async function pathExistsAsync(path: string): Promise<boolean> {
  try {
    await fs.promises.stat(path);
    return true;
  } catch {
    return false;
  }
}
