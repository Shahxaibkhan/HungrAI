// Direct deployment copy of whatsapp-webhook to ensure Netlify uses latest code.
// Original source located previously at api/whatsapp-webhook.js
// Instrumentation included for build verification.

const BUILD_VERSION = 'v2025-10-28-2';
const TOKEN_TAIL = process.env.WHATSAPP_ACCESS_TOKEN ? process.env.WHATSAPP_ACCESS_TOKEN.slice(-8) : 'NO_TOKEN';
console.log(`[BOOT] whatsapp-webhook starting build=${BUILD_VERSION} tokenTail=****${TOKEN_TAIL}`);

const { connectDB } = require('../../api/dbConnection');
const WhatsAppMessenger = require('../../api/whatsappMessenger');
const WhatsAppSessionManager = require('../../api/whatsappSessionManager');
const RestaurantLookup = require('../../api/restaurantLookup');
const { classifyMessage } = require('../../api/intentRouter');

const messenger = new WhatsAppMessenger();
const sessionManager = new WhatsAppSessionManager();

function normalizeMessage(entry) {
	try {
		const changes = entry.changes || [];
		for (const change of changes) {
			const value = change.value || {};
			const messages = value.messages || [];
			if (!messages.length) continue;
			return messages.map(m => ({
				from: m.from,
				id: m.id,
				timestamp: m.timestamp,
				type: m.type,
				text: m.text?.body || '',
				raw: m,
				whatsappBusinessAccountId: value.metadata?.display_phone_number,
				phoneNumberId: value.metadata?.phone_number_id
			}));
		}
	} catch (e) {
		console.error('[WHATSAPP] normalize error', e.message);
	}
	return [];
}

async function handleFastPathResponse(userNumber, intent, restaurant) {
	switch (intent) {
		case 'greeting':
			await messenger.sendTextMessage(
				userNumber,
				`Welcome to ${restaurant.name}! 👋\n\nI can help you:\n• View our menu\n• Place an order\n• Track your order\n\nJust tell me what you'd like to do!`
			);
			break;
		case 'show_menu':
			const menu = await RestaurantLookup.getRestaurantMenu(restaurant);
			if (menu.length > 0) {
				await messenger.sendMenuMessage(
					userNumber,
					`🍽️ ${restaurant.name} Menu`,
					menu
				);
			} else {
				await messenger.sendTextMessage(
					userNumber,
					'Our menu is being updated. Please check back soon!'
				);
			}
			break;
		case 'help':
			await messenger.sendTextMessage(userNumber, "You can ask for 'menu', 'cart', 'checkout', or say hello! 😊");
			break;
		case 'cart_status':
			await messenger.sendTextMessage(userNumber, '🛒 Your cart is currently empty. Say \"menu\" to browse items.');
			break;
		case 'checkout':
			await messenger.sendTextMessage(userNumber, '✅ To place an order, first add items by saying \"menu\" then specify items.');
			break;
		default:
			await messenger.sendTextMessage(userNumber, 'How can I help you today? Try \"menu\" or \"cart\".');
	}
}

async function handleDialogflowResponse(userNumber, text, restaurant, dialogflowResponse) {
	const intentName = dialogflowResponse?.intent?.displayName;
	const parameters = dialogflowResponse?.parameters || {};
	console.log('🤖 Dialogflow intent:', intentName, 'Parameters:', parameters);
	// Minimal handling for this copy (extend as needed)
	await messenger.sendTextMessage(userNumber, dialogflowResponse?.fulfillmentText || 'Acknowledged.');
}

async function handleGPTFallback(userNumber, text, restaurant, session) {
	try {
		const PromptOrchestrator = require('../../api/promptOrchestrator');
		const orchestrator = new PromptOrchestrator();
		const context = {
			restaurant: restaurant.name,
			menu: await RestaurantLookup.getRestaurantMenu(restaurant),
			cart: await sessionManager.getCart(restaurant.slug, userNumber),
			userMessage: text
		};
		const response = await orchestrator.generateResponse(context);
		await messenger.sendTextMessage(userNumber, response);
	} catch (err) {
		console.error('GPT fallback error:', err);
		await messenger.sendTextMessage(userNumber, "I'm not sure how to help with that. Try asking about our menu or placing an order!");
	}
}

async function processUserMessage(message, restaurant) {
	const { from, text } = message;
	const restaurantSlug = restaurant.slug;
	try {
		const session = await sessionManager.getSession(restaurantSlug, from);
		const routing = await classifyMessage({ text, restaurant });
		console.log('🎯 Message routing:', routing);
		switch (routing.route) {
			case 'fast':
				await handleFastPathResponse(from, routing.intent, restaurant);
				break;
			case 'dialogflow':
				await handleDialogflowResponse(from, text, restaurant, routing.dialogflowResponse);
				break;
			case 'llm':
				await handleGPTFallback(from, text, restaurant, session);
				break;
			case 'ignore':
				console.log('🪻 Ignoring empty message');
				break;
			default:
				console.warn('⚠️ Unknown routing route received:', routing);
				await messenger.sendTextMessage(from, "I'm not sure how to help with that. Can you try rephrasing?");
		}
		await sessionManager.updateSession(restaurantSlug, from, {
			lastMessage: text,
			lastIntent: routing.intent || 'unknown'
		});
	} catch (error) {
		console.error('Error processing user message:', error);
		await messenger.sendTextMessage(from, 'Sorry, I\'m having trouble right now. Please try again in a moment.');
	}
}

async function handler(event) {
	try {
		await connectDB();
		if (event.httpMethod === 'GET') {
			const params = event.queryStringParameters || {};
			const mode = params['hub.mode'];
			const token = params['hub.verify_token'];
			const challenge = params['hub.challenge'];
			if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
				console.log('[WHATSAPP] Webhook verified');
				return { statusCode: 200, body: challenge };
			}
			return { statusCode: 403, body: 'Forbidden' };
		}
		if (event.httpMethod !== 'POST') {
			return { statusCode: 405, body: 'Method Not Allowed' };
		}
		const body = JSON.parse(event.body || '{}');
		const entry = body.entry || [];
		const allMessages = [];
		for (const ent of entry) {
			const msgs = normalizeMessage(ent);
			allMessages.push(...msgs);
		}
		if (!allMessages.length) {
			return { statusCode: 200, body: JSON.stringify({ ok: true, messages: 0 }) };
		}
		for (const msg of allMessages) {
			console.log(`[WHATSAPP INBOUND] from=${msg.from} type=${msg.type} text="${msg.text}"`);
			const restaurant = await RestaurantLookup.findRestaurantByPhoneNumberId(msg.phoneNumberId);
			if (!restaurant) {
				console.error('❌ No restaurant found for phone number ID:', msg.phoneNumberId);
				await messenger.sendTextMessage(msg.from, 'Sorry, this restaurant is not available right now. Please try again later.');
				continue;
			}
			await processUserMessage(msg, restaurant);
		}
		return { statusCode: 200, body: JSON.stringify({ received: allMessages.length }) };
	} catch (err) {
		console.error('[WHATSAPP] Handler error', err);
		return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
	}
}

module.exports.handler = handler;
