/**
 * ============================================================
 * DEPENDENCY VERSION LOCKING ENFORCEMENT – NODE.JS
 * Issue: No Dependency Version Locking (#739)
 * ============================================================
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/* ============================================================
   CONFIG
============================================================ */
const CONFIG = {
  PROJECT_ROOT: process.cwd(),
  PACKAGE_JSON: 'package.json',
  LOCK_FILES: ['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock'],
  DISALLOWED_RANGES: ['^', '~', '*'],
};

/* ============================================================
   UTILS
============================================================ */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function log(msg) {
  console.log(`[LOCK-CHECK] ${msg}`);
}

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

/* ============================================================
   CHECK: LOCK FILE PRESENT
============================================================ */
function checkLockFile() {
  const found = CONFIG.LOCK_FILES.find((file) =>
    fileExists(path.join(CONFIG.PROJECT_ROOT, file))
  );

  if (!found) {
    fail('No dependency lock file found. Commit package-lock.json or yarn.lock.');
  }

  log(`Lock file detected: ${found}`);
}

/* ============================================================
   CHECK: VERSION RANGES
============================================================ */
function checkDependencyVersions(deps = {}, section) {
  Object.entries(deps).forEach(([name, version]) => {
    CONFIG.DISALLOWED_RANGES.forEach((range) => {
      if (version.startsWith(range)) {
        fail(
          `Disallowed version range "${version}" for dependency "${name}" in ${section}`
        );
      }
    });
  });
}

/* ============================================================
   CHECK: PACKAGE.JSON
============================================================ */
function validatePackageJSON() {
  const pkgPath = path.join(CONFIG.PROJECT_ROOT, CONFIG.PACKAGE_JSON);

  if (!fileExists(pkgPath)) {
    fail('package.json not found');
  }

  const pkg = readJSON(pkgPath);

  checkDependencyVersions(pkg.dependencies || {}, 'dependencies');
  checkDependencyVersions(pkg.devDependencies || {}, 'devDependencies');

  log('All dependency versions are locked');
}

/* ============================================================
   CHECK: CLEAN INSTALL
============================================================ */
function verifyDeterministicInstall() {
  try {
    log('Verifying deterministic install using npm ci...');
    execSync('npm ci --ignore-scripts', {
      stdio: 'ignore',
    });
    log('Deterministic install verified');
  } catch (err) {
    fail('npm ci failed. Dependency tree is not reproducible.');
  }
}

/* ============================================================
   MAIN
============================================================ */
function main() {
  log('Starting dependency version locking checks');

  checkLockFile();
  validatePackageJSON();
  verifyDeterministicInstall();

  log('✅ Dependency version locking enforced successfully');
}

main();

/* ============================================================
   END OF FILE (~200 LINES)
============================================================ */
