var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var RelationshipSchema = require('./relationshipModel');
var ReportSchema = require('./reportModel');

var MinChannel = new Schema({ //Pasar esto a otro archivo
  channel_id: String,
  notifications: Boolean
});

var UserSchema = new Schema({
  username: String,
  name: String,
  pswd: String,
  bio: String,
  image: String,
  gender: String,
  email: String,
  place: String,
  public: Boolean,
  relationships: [RelationshipSchema],
  channels: [MinChannel],
  reports: [ReportSchema],
  role: String,
  confirm: Boolean,
  firebase_token: String
});

var User = mongoose.model('users', UserSchema); //nombre de la colección en la bd

module.exports = User;
