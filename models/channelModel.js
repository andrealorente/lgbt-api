var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MinUserSchema = new Schema({
  _id: String,
  name: String,
});

var ChannelSchema = new Schema({
  _id: String,
  title: String,
  description: String,
  author: [MinUserSchema]
});

var Channel = mongoose.model('channels', ChannelSchema); //nombre de la colección en la bd

module.exports = Channel;
