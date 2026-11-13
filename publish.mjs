#!/usr/bin/env node
// Publishes the Socifyr Make custom app (SDK app) using the Make CLI.
//
//   npm install -g @makehq/cli   (one-time)
//   make-cli login               (token needs sdk-apps:read + sdk-apps:write)
//   node publish.mjs             (create + update everything, idempotent)
//   node publish.mjs --validate  (offline: validate every JSON section file)
//
// make-cli takes section bodies as inline JSONC. We read the files from ./app,
// validate them, and pass each body via --body=<json> (execFile-style args, no
// shell quoting issues on Windows).

import { execFileSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = dirname(fileURLToPath(import.meta.url));
const appDir = join(root, 'app');

const APP_NAME = 'socifyr';
const APP_VERSION = process.env.MAKE_APP_VERSION ?? '1';

const MODULES = [
	{
		name: 'createTextPost',
		typeId: 4,
		label: 'Create a Text Post',
		description: 'Publish a text post to one or more connected social accounts immediately.',
	},
	{
		name: 'scheduleTextPost',
		typeId: 4,
		label: 'Schedule a Text Post',
		description: 'Schedule a text post for a future datetime (timezone-aware).',
	},
	{
		name: 'createMediaPost',
		typeId: 4,
		label: 'Create a Media Post',
		description: 'Publish photos, a video, or a document from media IDs or public URLs.',
	},
	{
		name: 'publishDraft',
		typeId: 4,
		label: 'Publish a Draft',
		description: 'Dispatch a saved Socifyr draft for publishing.',
	},
	{
		name: 'getContent',
		typeId: 4,
		label: 'Get a Post',
		description: 'Fetch one post by ID with its current status.',
	},
	{
		name: 'listContent',
		typeId: 9,
		label: 'Search Posts',
		description: 'List posts with optional status/type/platform filters and pagination.',
	},
	{
		name: 'deleteContent',
		typeId: 4,
		label: 'Delete a Post',
		description: 'Delete a post or draft by ID.',
	},
];

function readSection(...parts) {
	const file = join(appDir, ...parts);
	if (!existsSync(file)) {
		throw new Error(`Missing section file: ${file}`);
	}
	const text = readFileSync(file, 'utf-8');
	try {
		return JSON.parse(text);
	} catch (error) {
		throw new Error(`Invalid JSON in ${file}: ${error.message}`);
	}
}

function loadAllSections() {
	const sections = {
		base: readSection('base.json'),
		connectionParameters: readSection('connection', 'parameters.json'),
		modules: {},
	};
	for (const module of MODULES) {
		sections.modules[module.name] = {
			parameters: readSection('modules', module.name, 'parameters.json'),
			api: readSection('modules', module.name, 'api.json'),
			interface: readSection('modules', module.name, 'interface.json'),
		};
	}
	return sections;
}

function runMakeCli(args) {
	const bin = process.platform === 'win32' ? 'make-cli.cmd' : 'make-cli';
	try {
		execFileSync(bin, args, { stdio: 'inherit' });
	} catch (error) {
		if (error.code === 'ENOENT') {
			console.error(
				'make-cli not found. Install it: npm install -g @makehq/cli && make-cli login',
			);
			process.exit(1);
		}
		throw error;
	}
}

// make-cli rejects a duplicate `create` with a non-zero exit; treat that as
// "already exists" and keep going so the script is idempotent.
function runMakeCliTolerant(args) {
	const bin = process.platform === 'win32' ? 'make-cli.cmd' : 'make-cli';
	try {
		execFileSync(bin, args, { stdio: 'inherit' });
		return true;
	} catch {
		console.log(`(already exists, continuing): ${args.slice(0, 3).join(' ')}`);
		return false;
	}
}

function main() {
	const validateOnly = process.argv.includes('--validate');
	const sections = loadAllSections();

	if (validateOnly) {
		const count =
			2 +
			Object.keys(sections.modules).length * 3;
		console.log(
			`OK — ${count} section files parsed, modules: ${MODULES.map((m) => m.name).join(', ')}`,
		);
		return;
	}

	console.log(`Publishing Make app "${APP_NAME}" v${APP_VERSION}`);

	runMakeCliTolerant([
		'sdk-apps',
		'create',
		`--name=${APP_NAME}`,
		`--label=Socifyr`,
		`--description=Publish and schedule posts on 18 social platforms (Instagram, LinkedIn, X, TikTok, Facebook, YouTube, Threads, Pinterest, Reddit, Bluesky, Telegram, Discord, Mastodon, Nostr, Slack, Dev.to, Hashnode, Tumblr) via API key.`,
		`--theme=#5B5FE3`,
		`--language=en`,
		`--audience=global`,
	]);

	runMakeCli([
		'sdk-apps',
		'set-section',
		`--name=${APP_NAME}`,
		`--version=${APP_VERSION}`,
		`--section=base`,
		`--body=${JSON.stringify(sections.base)}`,
	]);

	const readme = readFileSync(join(appDir, 'docs.md'), 'utf-8');
	runMakeCli([
		'sdk-apps',
		'set-docs',
		`--name=${APP_NAME}`,
		`--version=${APP_VERSION}`,
		`--docs=${readme}`,
	]);

	runMakeCliTolerant([
		'sdk-connections',
		'create',
		`--app-name=${APP_NAME}`,
		`--type=apikey`,
		`--label=Socifyr API Key`,
	]);

	runMakeCli([
		'sdk-connections',
		'set-section',
		`--connection-name=${APP_NAME}`,
		`--section=parameters`,
		`--body=${JSON.stringify(sections.connectionParameters)}`,
	]);

	for (const module of MODULES) {
		runMakeCliTolerant([
			'sdk-modules',
			'create',
			`--app-name=${APP_NAME}`,
			`--app-version=${APP_VERSION}`,
			`--name=${module.name}`,
			`--type-id=${module.typeId}`,
			`--label=${module.label}`,
			`--description=${module.description}`,
		]);

		runMakeCli([
			'sdk-modules',
			'update',
			`--app-name=${APP_NAME}`,
			`--app-version=${APP_VERSION}`,
			`--module-name=${module.name}`,
			`--connection=${APP_NAME}`,
		]);

		for (const section of ['parameters', 'api', 'interface']) {
			runMakeCli([
				'sdk-modules',
				'set-section',
				`--app-name=${APP_NAME}`,
				`--app-version=${APP_VERSION}`,
				`--module-name=${module.name}`,
				`--section=${section}`,
				`--body=${JSON.stringify(sections.modules[module.name][section])}`,
			]);
		}
	}

	console.log(
		`\nDone. Open Make → Custom Apps → ${APP_NAME} to test each module against a live connection, then request publication to the Make community library.`,
	);
}

main();
