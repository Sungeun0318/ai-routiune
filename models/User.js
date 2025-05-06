const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }
});

module.exports = mongoose.model('User', userSchema);//(05-06 14:38) 서버가 제대로 작동
