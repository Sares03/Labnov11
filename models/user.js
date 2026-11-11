const mongoose = require('mongoose');
const unique = require('mongoose-unique-validator').default;
const isEmail = require('validator/lib/isEmail');

// Define the database model
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required.'],
    maxlength: [40, 'Name must not exceed 40 characters.']
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    maxlength: [40, 'Email must not exceed 40 characters.'],
    validate: [isEmail, 'Email must be valid.']
  },
  age: {
    type: Number
  },
  gender: {
    type: String
  }
});

// Use the unique validator plugin
UserSchema.plugin(unique, { message: 'That {PATH} is already taken.' });

const User = module.exports = mongoose.model('user', UserSchema);
