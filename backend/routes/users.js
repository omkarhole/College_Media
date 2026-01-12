const express = require("express");
const UserMongo = require("../models/User");
const UserMock = require("../mockdb/userDB");
const {
  validateProfileUpdate,
  checkValidation,
} = require("../middleware/validationMiddleware");
const router = express.Router();
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const JWT_SECRET =
  process.env.JWT_SECRET || "college_media_secret_key";

/* ------------------
   🔐 AUTH MIDDLEWARE
------------------ */
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
const authorizeSelfOrAdmin = (paramKey = "userId") => {
  return (req, res, next) => {
    const targetId = req.params[paramKey];

    // Admin override
    if (req.currentUser.role === "admin") return next();

    // Owner-only access
    if (targetId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to access this resource",
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

/* ------------------
   📦 MULTER SETUP
------------------ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

if (!fs.existsSync("uploads/")) fs.mkdirSync("uploads/");

/* =====================================================
   👤 GET CURRENT USER PROFILE

    if (db?.useMongoDB) {
      const user = await UserMongo.findById(req.userId).select(
        "-password"
      );
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      return res.json({
        success: true,
        data: user,
      });
    }

    const user = await UserMock.findById(req.userId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

/* =====================================================
   ✏️ UPDATE PROFILE (CONCURRENT SAFE)
        });
      }

      const updatedUser = await UserMock.update(req.userId, {
        firstName,
        lastName,
        bio,
      });

      res.json({
        success: true,
        data: updatedUser,
        message: "Profile updated successfully",
      });
    } catch (err) {
      next(err); // 409 conflict handled globally
    }
  }
);

/* =====================================================
   ⚙️ UPDATE SETTINGS (CONCURRENT SAFE)
router.put("/profile/settings", verifyToken, async (req, res, next) => {
  try {
    const { email, isPrivate, notificationSettings } = req.body;
    const db = req.app.get("dbConnection");

    if (db?.useMongoDB) {
      const user = await UserMongo.findById(req.userId);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      if (email) user.email = email;
      if (typeof isPrivate !== "undefined")
        user.isPrivate = isPrivate;
      if (notificationSettings)
        user.notificationSettings = notificationSettings;

      const updatedUser = await user.safeSave();

      return res.json({
        success: true,
        data: updatedUser,
        message: "Settings updated successfully",
      });
    } catch (err) {
      next(err);
    }
router.put("/profile/settings", verifyToken, async (req, res, next) => {
  try {
    const { email, isPrivate, notificationSettings } = req.body;

    if (email) req.currentUser.email = email;
    if (typeof isPrivate !== "undefined")
      req.currentUser.isPrivate = isPrivate;
    if (notificationSettings)
      req.currentUser.notificationSettings = notificationSettings;

    const updatedUser =
      typeof req.currentUser.safeSave === "function"
        ? await req.currentUser.safeSave()
        : await UserMock.update(req.userId, req.body);

    const updatedUser = await UserMock.update(req.userId, req.body);
    res.json({
      success: true,
      data: updatedUser,
      message: "Settings updated successfully",
    });
  } catch (err) {
    next(err);
  }
});

/* =====================================================
   🤝 FOLLOW / UNFOLLOW (CONCURRENT SAFE)
===================================================== */
router.post(
  "/profile/:username/follow",
  verifyToken,
  async (req, res, next) => {
    try {
      const { username } = req.params;
      const db = req.app.get("dbConnection");

      if (db?.useMongoDB) {
        const targetUser = await UserMongo.findOne({ username });
        if (!targetUser)
          return res
            .status(404)
            .json({ success: false, message: "User not found" });

        const currentUser = await UserMongo.findById(req.userId);
        const isFollowing = currentUser.following.includes(
          targetUser._id
        );

        if (isFollowing) {
          currentUser.following.pull(targetUser._id);
          targetUser.followers.pull(req.userId);
        } else {
          currentUser.following.addToSet(targetUser._id);
          targetUser.followers.addToSet(req.userId);
        }

        // 🔥 BOTH VERSION CHECKED
        await currentUser.safeSave();
        await targetUser.safeSave();

        return res.json({
          success: true,
          data: { isFollowing: !isFollowing },
          message: isFollowing ? "Unfollowed" : "Followed",
        });
      }

      res.json({
        success: true,
        data: { isFollowing: true },
        message: "Follow action completed",
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
