const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const MenuItemSchema = new Schema({
restaurant: {type: Schema.Types.ObjectId, ref: 'Restaurant'},
title: String,
description: String,
price: Number, // PKR
tags: [String],
image: String,
inventoryCount: {type:Number, default:1000},
isLowSelling: {type:Boolean, default:false}
});


module.exports = mongoose.model('MenuItem', MenuItemSchema);