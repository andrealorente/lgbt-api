var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var RelationshipSchema = require('./relationshipModel');

var UserSchema = new Schema({
  username: String,
  name: String,
  pswd: String,
  bio: String,
  email: String,
  place: String,
  public: Boolean,
  relationships: [RelationshipSchema]
});

var User = mongoose.model('users', UserSchema); //nombre de la colección en la bd

module.exports = User;
