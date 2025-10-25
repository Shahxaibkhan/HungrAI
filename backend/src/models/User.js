const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const UserSchema = new Schema({
phone: {type:String, unique:true, index:true},
email: {type:String, index:true},
name: String,
preferences: {spicePref: String, dietary: [String], favorites: [String]},
consentCrossRestaurant: {type:Boolean, default:false},
createdAt: {type:Date, default:Date.now}
});


module.exports = mongoose.model('User', UserSchema);