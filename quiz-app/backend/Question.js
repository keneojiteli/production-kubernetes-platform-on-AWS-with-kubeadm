// Question.js: defines the data structure stored in MongoDB
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: String,
  option1: String,
  option2: String,
  option3: String,
  option4: String,
  ans: Number,
});

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
