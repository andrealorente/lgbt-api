var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ReportSchema = new Schema({
  origin_id: String,
  target_id: String,
  reason: String,
  comment: String,
  created_time: Date
});

module.exports = ReportSchema;