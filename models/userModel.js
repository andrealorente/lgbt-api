var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  username: String,
  name: String,
  pswd: String,
  bio: String,
  email: String,
  place: String,
  public: Boolean,
  follows: [String],
  followers: [String],
});

var User = mongoose.model('users', UserSchema); //nombre de la colección en la bd

module.exports = User;
