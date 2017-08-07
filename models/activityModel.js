var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ActivitySchema = new Schema({
  origin_id: String,
  target_id: String,
  action: String,
  created_time: Date,
  type: Number // puede ser 1: Elemento Post, 2: Event, 3: User, 4: Canal --> Para mostrar en la app un enlace u otro
});

var Activity = mongoose.model('activities', ActivitySchema); //nombre de la colección en la bd

module.exports = Activity;
