var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RelationshipSchema = new Schema({
	id: String,
	incoming_status: String,
	outgoing_status: String,
	user_data: {
		username: String,
		bio: String,
		public: Boolean
	}
});

module.exports = RelationshipSchema;
