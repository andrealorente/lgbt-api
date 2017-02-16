var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({
    _id: String,
    title: String,
    content: String,
    author: String,
    tags: [String]
});

var Post = mongoose.model('posts', postSchema); //nombre de la colección en la bd

module.exports = Post;