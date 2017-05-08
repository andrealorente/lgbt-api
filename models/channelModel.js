var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var MessageSchema = require('./messageModel');

var ChannelSchema = new Schema({
  title: String,
  description: String,
  author: String,
  messages: [MessageSchema]
});

var Channel = mongoose.model('channels', ChannelSchema); //nombre de la colección en la bd

module.exports = Channel;
