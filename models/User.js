var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  bot: { },
  googleId: { type: Number, required: true }
}));