
/**
 * =====================================
 * Secret Audit Logger
 * =====================================
 */

const fs = require("fs");
const path = require("path");

const auditFile = path.join(__dirname, "secret-audit.log");

exports.logRotation = (name, oldSecret, newSecret) => {
  const entry = `[${new Date().toISOString()}] ROTATED ${name}\n`;
  fs.appendFileSync(auditFile, entry);
};

exports.logRevocation = (name) => {
  const entry = `[${new Date().toISOString()}] REVOKED ${name}\n`;
  fs.appendFileSync(auditFile, entry);
};
