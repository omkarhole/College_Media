const RefreshToken = require("../models/RefreshToken");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/token.util");

/**
 * LOGIN
 */
exports.login = async (req, res) => {
  // Mock user (replace with DB check)
  const user = { _id: "64ff123abc123", role: "user" };

  const accessToken = generateAccessToken({
    userId: user._id,
    role: user.role,
  });

  const refreshToken = await generateRefreshToken(user._id);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  res.json({
    success: true,
    accessToken,
  });
};

/**
 * REFRESH TOKEN
 */
exports.refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Refresh token missing",
    });
  }

  try {
    const decoded = await verifyRefreshToken(token);

    // ROTATE refresh token
    await RefreshToken.updateOne(
      { token },
      { revoked: true }
    );

    const newRefreshToken = await generateRefreshToken(decoded.userId);
    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * LOGOUT
 */
exports.logout = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    await RefreshToken.updateOne(
      { token },
      { revoked: true }
    );
  }

  res.clearCookie("refreshToken");

  res.json({
    success: true,
    message: "Logged out successfully",
  });
};
