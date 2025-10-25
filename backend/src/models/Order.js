const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const OrderSchema = new Schema({
restaurant: {type: Schema.Types.ObjectId, ref: 'Restaurant'},
user: {type: Schema.Types.ObjectId, ref: 'User'},
items: [{ itemId: {type: Schema.Types.ObjectId, ref: 'MenuItem'}, title:String, qty:Number, notes:String, price:Number }],
totalEstimate: Number,
status: {
  type: String,
  enum: ['received', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
  default: 'received'
},
statusHistory: [{
  status: String,
  timestamp: {type: Date, default: Date.now},
  note: String
}],
deliveryType: {type:String, enum:['pickup','delivery'], default:'pickup'},
customerContact: String,
estimatedReadyTime: Date,
actualDeliveryTime: Date,
createdAt: {type:Date, default:Date.now}
});


module.exports = mongoose.model('Order', OrderSchema);