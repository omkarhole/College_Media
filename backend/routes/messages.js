const express = require("express");
const MessageMongo = require("../models/Message");
const MessageMock = require("../mockdb/messageDB");
const UserMongo = require("../models/User");
const UserMock = require("../mockdb/userDB");
const { validateMessage, validateMessageId, checkValidation } = require("../middleware/validationMiddleware");
const jwt = require("jsonwebtoken");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "college_media_secret_key";

/* ---------------- JWT VERIFY MIDDLEWARE ---------------- */
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      data: null,
      message: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Invalid token.",
    });
  }
};

/* ======================
   SEND MESSAGE
====================== */
router.post("/", verifyToken, validateMessage, checkValidation, async (req, res) => {
  try {
    const { receiver, content, messageType, attachmentUrl } = req.body;
    const useMongoDB = req.app.get("dbConnection")?.useMongoDB;

    const receiverUser = useMongoDB
      ? await UserMongo.findById(receiver)
      : await UserMock.findById(receiver);

    if (!receiverUser) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Receiver not found",
      });
    }

    if (receiver === req.userId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Cannot send message to yourself",
      });
    }

    const messageData = {
      sender: req.userId,
      receiver,
      content,
      messageType: messageType || "text",
      attachmentUrl: attachmentUrl || null,
    };

    let message;
    if (useMongoDB) {
      const conversationId = MessageMongo.generateConversationId(req.userId, receiver);
      message = await MessageMongo.create({ ...messageData, conversationId });
      message = await message.populate("sender receiver", "username firstName lastName profilePicture");
    } else {
      message = await MessageMock.create(messageData);
    }

    res.status(201).json({
      success: true,
      data: message,            // 🔙 old clients
      payload: message,         // 🆕 new clients
      meta: { apiVersion: req.apiVersion },
      message: "Message sent successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      message: "Error sending message",
    });
  }
});

/* ======================
   GET CONVERSATIONS
====================== */
router.get("/conversations", verifyToken, async (req, res) => {
  try {
    const useMongoDB = req.app.get("dbConnection")?.useMongoDB;
    let conversations = [];

    if (useMongoDB) {
      const messages = await MessageMongo.find({
        $or: [{ sender: req.userId }, { receiver: req.userId }],
        deletedBy: { $nin: [req.userId] },
      })
        .populate("sender receiver", "username firstName lastName profilePicture")
        .sort({ createdAt: -1 });

      const map = new Map();
      messages.forEach((msg) => {
        if (!map.has(msg.conversationId)) {
          map.set(msg.conversationId, {
            conversationId: msg.conversationId,
            lastMessage: msg,
            unreadCount: 0,
          });
        }
        if (msg.receiver._id.toString() === req.userId && !msg.isRead) {
          map.get(msg.conversationId).unreadCount++;
        }
      });

      conversations = Array.from(map.values());
    }

    res.json({
      success: true,
      data: conversations,        // 🔙 old
      payload: conversations,     // 🆕 new
      meta: { apiVersion: req.apiVersion },
      message: "Conversations retrieved successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      data: null,
      message: "Error retrieving conversations",
    });
  }
});

/* ======================
   GET UNREAD COUNT
====================== */
router.get("/unread/count", verifyToken, async (req, res) => {
  try {
    const useMongoDB = req.app.get("dbConnection")?.useMongoDB;

    const unreadCount = useMongoDB
      ? await MessageMongo.countDocuments({
          receiver: req.userId,
          isRead: false,
          deletedBy: { $nin: [req.userId] },
        })
      : await MessageMock.countDocuments({
          receiver: req.userId,
          isRead: false,
          deletedBy: { $nin: [req.userId] },
        });

    res.json({
      success: true,
      data: { unreadCount },          // 🔙 old
      payload: { unreadCount },       // 🆕 new
      meta: { apiVersion: req.apiVersion },
      message: "Unread count retrieved successfully",
    });
  } catch {
    res.status(500).json({
      success: false,
      data: null,
      message: "Error retrieving unread count",
    });
  }
});

module.exports = router;
