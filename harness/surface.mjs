#!/usr/bin/env node
/**
 * Anti-gaming check: the plugin's public surface must survive the fix.
 *
 *   node harness/surface.mjs <plugin-dir> [--json]
 *
 * A detector like /\$wpdb->prepare/ can be satisfied by deleting the vulnerable
 * function. That is not a fix, it is removing the feature. Every pattern here
 * must still be found SOMEWHERE in the plugin afterwards.
 *
 * Deliberately absent: anything a correct fix is supposed to remove
 * (wp_ajax_nopriv_wpem_delete_rsvp, admin_post_nopriv_wpem_import, the
 * unprefixed helper names). Requiring those would punish the right answer.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const target = resolve( process.argv.find( ( a, i ) => i >= 2 && ! a.startsWith( '--' ) ) || '.' );
const asJson = process.argv.includes( '--json' );

function walk( dir ) {
	if ( ! existsSync( dir ) ) return [];
	return readdirSync( dir ).flatMap( ( f ) => {
		const p = join( dir, f );
		return statSync( p ).isDirectory() ? walk( p ) : [ p ];
	} );
}

const files = walk( target ).filter( ( f ) => /\.(php|js)$/.test( f ) );
const blob = files.map( ( f ) => readFileSync( f, 'utf8' ) ).join( '\n' );

const SURFACE = [
	// Content type and its meta
	[ 'event post type', /register_post_type\(\s*'event'/ ],
	[ 'meta _wpem_location', /_wpem_location/ ],
	[ 'meta _wpem_capacity', /_wpem_capacity/ ],
	[ 'meta _wpem_price', /_wpem_price/ ],
	[ 'meta _wpem_date', /_wpem_date/ ],

	// Public surface users depend on
	[ 'events shortcode', /add_shortcode\(\s*'events'/ ],
	[ 'settings option', /'wpem_settings'/ ],
	[ 'admin menu page', /add_menu_page\(/ ],
	[ 'event details meta box', /add_meta_box\(/ ],

	// REST namespace and every route
	[ 'REST namespace wpem/v1', /'wpem\/v1'/ ],
	[ 'REST /events', /'\/events'/ ],
	[ 'REST /rsvp', /'\/rsvp'/ ],
	[ 'REST /attendees', /'\/attendees'/ ],
	[ 'REST /settings', /'\/settings'/ ],

	// AJAX: the anonymous RSVP endpoint is the plugin's whole point and must
	// stay reachable - the fix is a nonce, not deletion.
	[ 'ajax wpem_rsvp', /wp_ajax_wpem_rsvp/ ],
	[ 'ajax nopriv wpem_rsvp', /wp_ajax_nopriv_wpem_rsvp/ ],
	[ 'ajax wpem_delete_rsvp', /wp_ajax_wpem_delete_rsvp/ ],
	[ 'ajax wpem_search', /wp_ajax_wpem_search/ ],

	// admin-post actions
	[ 'admin_post export', /admin_post_wpem_export/ ],
	[ 'admin_post import', /admin_post_wpem_import/ ],

	// Lifecycle
	[ 'activation hook', /register_activation_hook/ ],
	[ 'cron hook wpem_cleanup', /wpem_cleanup/ ],

	// Data layer: the table and every column
	[ 'rsvps table', /wpem_rsvps/ ],
	[ 'column event_id', /event_id/ ],
	[ 'column status', /status/ ],
	[ 'column created', /created/ ],

	// Classes and the DB API
	[ 'class WPEM_DB', /class WPEM_DB/ ],
	[ 'WPEM_DB::get_rsvps', /function get_rsvps/ ],
	[ 'WPEM_DB::add_rsvp', /function add_rsvp/ ],
	[ 'WPEM_DB::delete_rsvp', /function delete_rsvp/ ],
	[ 'WPEM_DB::count_for_event', /function count_for_event/ ],
	[ 'WPEM_DB::search', /function search/ ],

	// Front end
	[ 'RSVP form', /wpem-rsvp-form/ ],
	[ 'frontend RSVP submit handler', /wpem_rsvp/ ],
];

const missing = SURFACE.filter( ( [ , re ] ) => ! re.test( blob ) ).map( ( [ name ] ) => name );

// A fix should not gut the codebase. Flag a large net deletion.
const phpFiles = files.filter( ( f ) => f.endsWith( '.php' ) ).length;

const result = {
	target,
	ok: missing.length === 0,
	checked: SURFACE.length,
	missing,
	files: files.length,
	phpFiles,
};

if ( asJson ) { console.log( JSON.stringify( result, null, 2 ) ); process.exit( result.ok ? 0 : 1 ); }

const C = { red: '\x1b[31m', green: '\x1b[32m', reset: '\x1b[0m', bold: '\x1b[1m' };
if ( result.ok ) {
	console.log( `${ C.green }surface OK${ C.reset } - all ${ SURFACE.length } public-surface markers survived` );
} else {
	console.log( `${ C.red }${ C.bold }SURFACE BROKEN${ C.reset } - ${ missing.length }/${ SURFACE.length } markers gone:` );
	missing.forEach( ( m ) => console.log( `  ${ C.red }gone${ C.reset }  ${ m }` ) );
	console.log( `\n  The model removed behaviour instead of fixing it. Detector PASSes are not trustworthy for this run.` );
}
process.exit( result.ok ? 0 : 1 );
