const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const UserSchema = new Schema({
phone: {type:String, unique:true, sparse:true, index:true},
email: {type:String, index:true},
name: String,
password: String, // For restaurant owner authentication
role: {type: String, enum: ['customer', 'restaurant-owner'], default: 'customer'},
restaurantId: {type: Schema.Types.ObjectId, ref: 'Restaurant'}, // For restaurant owners
preferences: {spicePref: String, dietary: [String], favorites: [String]},
consentCrossRestaurant: {type:Boolean, default:false},
createdAt: {type:Date, default:Date.now}
});


module.exports = mongoose.model('User', UserSchema);