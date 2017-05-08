var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ActivitySchema = new Schema({
  origin_id: String, 
  target_id: String,
  action: String,
  created_time: String
});

var Activity = mongoose.model('activities', ActivitySchema); //nombre de la colección en la bd

module.exports = Activity;
