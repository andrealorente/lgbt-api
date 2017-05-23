var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RequestSchema = new Schema({
  userID: String,
  email: String,
  reason: String
});

var Request = mongoose.model('editrequests', RequestSchema); //nombre de la colección en la bd

module.exports = Request;
