/**
 * =====================================
 * Secrets Manager (Rotation Aware)
 * =====================================
 * - Supports current + previous secrets
 * - Runtime reload support
 * - Zero downtime rotation
 */

const fs = require("fs");
const path = require("path");

class SecretsManager {
  constructor() {
    this.cache = {};
    this.lastLoadedAt = null;
    this.loadSecrets();
  }

  loadSecrets() {
    const secretsPath = path.join(__dirname, "../secrets.json");

    if (!fs.existsSync(secretsPath)) {
      throw new Error("❌ secrets.json not found");
    }

    const raw = fs.readFileSync(secretsPath);
    const parsed = JSON.parse(raw);

    this.cache = parsed;
    this.lastLoadedAt = new Date();

    console.log("🔐 Secrets loaded at", this.lastLoadedAt.toISOString());
  }

  get(key) {
    return this.cache[key];
  }

  getRotatableSecret(name) {
    const secret = this.cache[name];

    if (!secret || !secret.current) {
      throw new Error(`Secret ${name} is missing`);
    }

    return {
      current: secret.current,
      previous: secret.previous || null,
      rotatedAt: secret.rotatedAt,
    };
  }

  reload() {
    console.log("🔄 Reloading secrets...");
    this.loadSecrets();
  }
}

module.exports = new SecretsManager();
