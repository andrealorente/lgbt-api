var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessageSchema = new Schema({
    id: String,
    content: String,
    created_time: String,
    channel: String
});
//var Message = mongoose.model('message', MessageSchema);

module.exports = MessageSchema;
