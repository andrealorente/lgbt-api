var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EventSchema = new Schema({
  _id: String,
  title: String,
  description: String,
  place: String,
  start_time: String
});

var Event = mongoose.model('events', EventSchema); //nombre de la colección en la bd

module.exports = Event;
