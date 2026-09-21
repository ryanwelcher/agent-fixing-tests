#!/usr/bin/env node
/**
 * Build the list of fixes the detectors claim landed, for the fix judge to verify.
 *   node harness/claims.mjs <run-dir> > claims.json
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname( fileURLToPath( import.meta.url ) );
const { issues } = await import( resolve( HERE, '../ground-truth/issues.mjs' ) );
const runDir = resolve( process.argv[ 2 ] || '.' );
const scorePath = join( runDir, 'score.json' );
if ( ! existsSync( scorePath ) ) { console.error( 'no score.json' ); process.exit( 1 ); }

const passed = new Set(
	JSON.parse( readFileSync( scorePath, 'utf8' ) ).results
		.filter( ( r ) => r.status === 'fixed' )
		.map( ( r ) => r.id )
);

console.log( JSON.stringify(
	issues.filter( ( i ) => passed.has( i.id ) )
		.map( ( { id, sev, file, title, why } ) => ( { id, severity: sev, file, defect: title, why } ) ),
	null, 2
) );
