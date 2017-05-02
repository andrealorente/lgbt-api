var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommentSchema = new Schema({
  target_id: String,
  author: String,
  content: String,
  created_time: String,
  state: String
});

var Comment = mongoose.model('comments', CommentSchema); //nombre de la colección en la bd

module.exports = Comment;
