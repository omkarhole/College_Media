/**
 * ============================================================
 * Secrets Manager (Rotation Ready)
 * ============================================================
 * - Centralized secret access
 * - Supports current + previous secrets
 * - Hot reload support
 * - Future compatible with Vault / AWS SM
 * ============================================================
 */

"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const logger = require("../utils/logger");

const SECRETS_FILE = path.join(__dirname, "../secrets.json");

class SecretsManager {
  constructor() {
    this.secrets = {};
    this.lastLoadedAt = null;
    this.load();
  }

  load() {
    if (!fs.existsSync(SECRETS_FILE)) {
      logger.critical("Secrets file missing", { path: SECRETS_FILE });
      process.exit(1);
    }

    try {
      const raw = fs.readFileSync(SECRETS_FILE, "utf-8");
      this.secrets = JSON.parse(raw);
      this.lastLoadedAt = new Date();

      logger.info("Secrets loaded", {
        loadedAt: this.lastLoadedAt.toISOString(),
        keys: Object.keys(this.secrets),
      });
    } catch (err) {
      logger.critical("Failed to load secrets", err);
      process.exit(1);
    }
  }

  reload() {
    logger.warn("Reloading secrets");
    this.load();
  }

  get(name) {
    const secret = this.secrets[name];
    if (!secret || !secret.current) {
      throw new Error(`Secret ${name} not found or invalid`);
    }
    return secret.current;
  }

  getRotatable(name) {
    const secret = this.secrets[name];
    if (!secret || !secret.current) {
      throw new Error(`Rotatable secret ${name} missing`);
    }

    return {
      current: secret.current,
      previous: secret.previous || null,
      rotatedAt: secret.rotatedAt || null,
    };
  }

  generate() {
    return crypto.randomBytes(64).toString("hex");
  }
}

module.exports = new SecretsManager();
