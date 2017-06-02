var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EventSchema = new Schema({
  title: String,
  description: String,
  image: String,
  author_id: String,
  place: String,
  created_time: String,
  start_time: String,
  end_time: String,
  comments: [String],
  assistants: [String],
  interested: [String]
});

var Event = mongoose.model('events', EventSchema); //nombre de la colección en la bd

module.exports = Event;
