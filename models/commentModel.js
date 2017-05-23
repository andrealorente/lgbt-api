var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommentSchema = new Schema({
  target_id: String,
  author_id: String,
  content: String,
  created_time: String,
  state: String,
  reports: [String]
});

var Comment = mongoose.model('comments', CommentSchema); //nombre de la colecci�n en la bd

module.exports = Comment;
