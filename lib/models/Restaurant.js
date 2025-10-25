const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const RestaurantSchema = new Schema({
name: String,
slug: {type:String, unique:true, index:true},
logo: String,
brandColor: String,
contactNumber: String,
menu: [{ type: Schema.Types.ObjectId, ref: 'MenuItem' }],
channels: { websiteWidget: {type:Boolean, default:true}, whatsapp: { type: Boolean, default: false }, instagram:{ type: Boolean, default: false } },
createdAt: {type:Date, default:Date.now}
});


module.exports = mongoose.model('Restaurant', RestaurantSchema);