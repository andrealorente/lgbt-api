var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({
    title: String,
    content: String,
    author: String,
    tags: [String],
    image: String,
    state: String
});

var Post = mongoose.model('posts', postSchema); //nombre de la colección en la bd

module.exports = Post;