// Stub util to send order to restaurant via WhatsApp (Twilio) or email.
// Replace with actual Twilio / email provider integration in production.


const axios = require('axios');


async function sendOrderViaEmail(restaurant, order){
// In MVP, just log. Integrate nodemailer or any email provider later.
console.log('Send email to', restaurant.contactNumber || restaurant.name, 'order', order._id);
}


async function sendOrderViaWhatsApp(restaurant, order){
// Placeholder: call Twilio API or Meta Business API here.
console.log('Pretend sending WhatsApp to', restaurant.contactNumber, 'order', order._id);
}


module.exports = { sendOrderViaEmail, sendOrderViaWhatsApp };