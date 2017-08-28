var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RequestSchema = new Schema({
  userID: String,
  name: String,
  org: String,
  email: String,
  reason: String,
  state: String //Si está pendiente, si se ha denegado, si se ha aceptado
});

var Request = mongoose.model('editrequests', RequestSchema); //nombre de la colección en la bd

module.exports = Request;
