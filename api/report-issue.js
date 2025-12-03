import { config as loadEnv } from 'dotenv';

loadEnv();

const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
const normalizeOrigin = (origin) => origin?.trim().replace(/\/$/, '') || '';
const defaultOrigins = [
	'http://localhost:4173',
	'http://127.0.0.1:4173',
	'http://localhost:3000',
	'http://127.0.0.1:3000',
];
const allowedOrigins = [
	...new Set(
		[...defaultOrigins, ...(process.env.ALLOWED_ORIGINS || '').split(',')]
			.map(normalizeOrigin)
			.filter(Boolean)
	),
];

function setCors(res, origin) {
	res.setHeader('Access-Control-Allow-Origin', origin);
	res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
	res.setHeader(
		'Access-Control-Allow-Headers',
		'Content-Type, X-Requested-With'
	);
	res.setHeader('Access-Control-Max-Age', '86400');
}

function isOriginAllowed(origin) {
	const normalized = normalizeOrigin(origin);
	if (!normalized) return false;
	return allowedOrigins.some(
		(allowed) =>
			normalized === allowed ||
			normalized.startsWith(`${allowed}/`) ||
			normalized === allowed.replace('localhost', '127.0.0.1') ||
			normalized === allowed.replace('127.0.0.1', 'localhost')
	);
}

function parseBody(req) {
	if (req.body && typeof req.body === 'object') return req.body;
	if (typeof req.body === 'string' && req.body.trim()) {
		try {
			return JSON.parse(req.body);
		} catch {
			return {};
		}
	}
	return {};
}

export default async function handler(req, res) {
	const origin = normalizeOrigin(req.headers.origin);
	const allow = isOriginAllowed(origin);

	if (!allow) {
		setCors(res, allowedOrigins[0] || '*');
		res.status(403).json({ ok: false, error: 'Origin is not allowed.' });
		return;
	}

	setCors(res, origin);

	if (req.method === 'OPTIONS') {
		res.status(204).end();
		return;
	}

	if (req.method !== 'POST') {
		res.status(405).json({ ok: false, error: 'Method not allowed.' });
		return;
	}

	if (!slackWebhookUrl) {
		res
			.status(500)
			.json({ ok: false, error: 'Slack webhook is not configured.' });
		return;
	}

	const { itemName = '', message = '' } = parseBody(req);
	const trimmedName = String(itemName || '').trim();
	const trimmedMessage = String(message || '').trim();

	if (!trimmedName || !trimmedMessage) {
		res.status(400).json({
			ok: false,
			error: 'Item name and message are required.',
		});
		return;
	}

	if (trimmedMessage.length > 1200) {
		res.status(400).json({
			ok: false,
			error: 'Message is too long.',
		});
		return;
	}

	const payload = {
		text: `New loot correction submitted`,
		blocks: [
			{
				type: 'header',
				text: {
					type: 'plain_text',
					text: 'Arc Looter Feedback',
				},
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `*Item*: ${trimmedName}`,
				},
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `*Feedback:*\n${trimmedMessage}`,
				},
				accessory: {
					type: 'image',
					image_url: 'https://arclooter.xyz/fav.jpeg',
					alt_text: 'arc icon',
				},
			},
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: `Origin: ${origin}`,
					},
				],
			},
		],
	};

	try {
		const response = await fetch(slackWebhookUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			throw new Error(`Slack responded with ${response.status}`);
		}
	} catch (error) {
		console.error('Failed to post to Slack', error);
		res
			.status(502)
			.json({ ok: false, error: 'Failed to send message to Slack.' });
		return;
	}

	res.status(200).json({ ok: true });
}
