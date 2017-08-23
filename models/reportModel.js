var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ReportSchema = new Schema({
  origin_id: String,
  target_id: String,
  target_type: Number,
  reason: String
});

module.exports = ReportSchema;