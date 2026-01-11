const mongoose = require("mongoose");
const Account = require("../models/Account");

const transferBalance = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { fromId, toId, amount } = req.body;

    const fromAccount = await Account.findById(fromId).session(session);
    const toAccount = await Account.findById(toId).session(session);

    if (!fromAccount || !toAccount) {
      throw new Error("Account not found");
    }

    if (fromAccount.balance < amount) {
      throw new Error("Insufficient balance");
    }

    fromAccount.balance -= amount;
    toAccount.balance += amount;

    await fromAccount.save({ session });
    await toAccount.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, message: "Transfer successful" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

module.exports = { transferBalance };
