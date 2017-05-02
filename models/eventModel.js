var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EventSchema = new Schema({
  title: String,
  description: String,
  place: String,
  start_time: String,
  comments: [String]
});

var Event = mongoose.model('events', EventSchema); //nombre de la colección en la bd

module.exports = Event;
