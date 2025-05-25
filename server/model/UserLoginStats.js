const mongoose = require('mongoose');
const { startOfDay } = require('date-fns');

const UserLoginStatsSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true, 
      index: true,
    },
    count: {
      type: Number,
      required: true,
      default: 0, // Total logins for the day
    },
    userLogins: [
      {
        email: {
          type: String,
          required: true,
        },
        count: {
          type: Number,
          required: true,
          default: 1, // Login count for this user on this day
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Method to increment login count for a user
UserLoginStatsSchema.statics.incrementLogin = async function (email) {
  const startOfDay = startOfDay(new Date()); // Current date, normalized to UTC start-of-day

  console.log('Incrementing login:', {
    email,
    date: startOfDay.toISOString(),
  });

  // Find the document for the day
  const existingDoc = await this.findOne({ date: startOfDay });

  if (existingDoc) {
    // Check if the user already has a login entry for this day
    const userLoginIndex = existingDoc.userLogins.findIndex(ul => ul.email === email);

    if (userLoginIndex !== -1) {
      // Increment the user's login count
      existingDoc.userLogins[userLoginIndex].count += 1;
      existingDoc.count += 1; // Increment total count
      return await existingDoc.save();
    } else {
      // Add new user login entry
      return await this.findOneAndUpdate(
        { date: startOfDay },
        {
          $inc: { count: 1 },
          $push: {
            userLogins: { email, count: 1 },
          },
        },
        { new: true }
      );
    }
  } else {
    // Create new document for the day
    return await this.create({
      date: startOfDay,
      count: 1,
      userLogins: [{ email, count: 1 }],
    });
  }
};

// Create index for faster queries on userLogins.email
UserLoginStatsSchema.index({ 'userLogins.email': 1 });

module.exports = mongoose.model('UserLoginStats', UserLoginStatsSchema);