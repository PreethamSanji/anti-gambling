const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://prakharkumar1314:4h0TKimFXaHO8MyJ@cluster0.kwskxal.mongodb.net/StakeFinal",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minLength: 3,
    maxLength: 30,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50,
  },
});

const accountSchema = new mongoose.schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
})

const User = mongoose.model("User", userSchema);
const Account = mongoose.model("Account", accountSchema)

module.exports = {
  User,
  Account
};
