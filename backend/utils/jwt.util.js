/**
 * =====================================
 * JWT Utility with Secret Rotation
 * =====================================
 */

const jwt = require("jsonwebtoken");
const secretsManager = require("../config/secrets.manager");

const TOKEN_EXPIRY = "15m";

exports.signToken = (payload) => {
  const { current } = secretsManager.getRotatableSecret("JWT_SECRET");

  return jwt.sign(payload, current, {
    expiresIn: TOKEN_EXPIRY,
  });
};

exports.verifyToken = (token) => {
  const { current, previous } =
    secretsManager.getRotatableSecret("JWT_SECRET");

  try {
    return jwt.verify(token, current);
  } catch (err) {
    if (previous) {
      return jwt.verify(token, previous);
    }
    throw err;
  }
};
