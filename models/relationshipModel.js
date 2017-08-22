var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RelationshipSchema = new Schema({
	id: String,
	incoming_status: String,
	outgoing_status: String,
	user_data: {
		username: String,
		name: String,
		image: String,
		public: Boolean
	}
});

module.exports = RelationshipSchema;
