var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var MessageSchema = require('./messageModel');
var ReportSchema = require('./reportModel');

var ChannelSchema = new Schema({
  title: String,
  description: String,
  image: String,
  author: String,
  messages: [MessageSchema],
  susc: [String],
  reports: [ReportSchema],
  created_time: Date
});

var Channel = mongoose.model('channels', ChannelSchema); //nombre de la colección en la bd

module.exports = Channel;
