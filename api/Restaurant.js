const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const RestaurantSchema = new Schema({
	name: { type: String, required: true },
	slug: { type: String, unique: true, index: true, required: true },
	logo: String,
	brandColor: String,
	contactNumber: String,
	// Existing menu relationship
	menu: [{ type: Schema.Types.ObjectId, ref: 'MenuItem' }],
	// Channel enablement flags
	channels: {
		websiteWidget: { type: Boolean, default: true },
		whatsapp: { type: Boolean, default: false },
		instagram: { type: Boolean, default: false }
	},
	// WhatsApp integration fields (multi-tenant)
	whatsapp: {
		number: { type: String, index: true }, // E.164 format +923001234567
		businessId: String, // WhatsApp Business Account ID
		phoneNumberId: String, // WhatsApp Cloud API phone_number_id
		accessTokenRef: String, // Reference to secure storage (not raw token)
		verifyToken: String // Token used for webhook verification
	},
	// AI / Automation mode controls
	ai: {
		mode: { type: String, enum: ['hybrid', 'dialogflow-first', 'llm-only'], default: 'hybrid' },
		fallbackModel: { type: String, default: 'gpt-4o-mini' },
		dialogflow: {
			projectId: String,
			agentId: String, // For CX if needed
			languageCode: { type: String, default: 'en' },
			confidenceThreshold: { type: Number, default: 0.65 }
		}
	},
	// Billing / Plan / Usage tracking
	billing: {
		plan: { type: String, enum: ['starter', 'pro', 'enterprise'], default: 'starter' },
		monthlyMessageQuota: { type: Number, default: 2000 },
		messagesUsedThisMonth: { type: Number, default: 0 },
		lastReset: { type: Date, default: Date.now }
	},
	// Branding details for tone & presentation
	branding: {
		displayName: String,
		primaryColor: String,
		accentColor: String,
		tone: { type: String, enum: ['friendly', 'formal', 'playful'], default: 'friendly' }
	},
	// Operational context
	timezone: { type: String, default: 'UTC' },
	currency: { type: String, default: 'PKR' },
	// Cached menu summary for fast responses (invalidate on menu change)
	cachedMenuSummary: {
		text: String,
		updatedAt: Date
	},
	// Analytics snapshots (can be expanded later)
	analytics: {
		totalOrders: { type: Number, default: 0 },
		topItems: [{ title: String, count: Number }],
		lastOrderAt: Date
	},
	createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Restaurant', RestaurantSchema);