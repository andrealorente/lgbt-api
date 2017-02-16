var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MinUserSchema = new Schema({
  _id: String,
  name: String,
});

var UserSchema = new Schema({
  _id: String,
  name: String,
  email: String,
  followers: [MinUserSchema]
});

var User = mongoose.model('users', UserSchema); //nombre de la colección en la bd

module.exports = User;
