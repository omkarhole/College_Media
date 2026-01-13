/**
 * =====================================
 * Hot Reload Secrets Middleware
 * =====================================
 */

const secretsManager = require("../config/secrets.manager");

let lastReload = Date.now();

module.exports = (req, res, next) => {
  const now = Date.now();

  // reload every 5 minutes
  if (now - lastReload > 5 * 60 * 1000) {
    secretsManager.reload();
    lastReload = now;
  }

  next();
};
