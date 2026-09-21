#!/usr/bin/env node
/**
 * Fast keyword heuristic for review recall.
 *
 *   node harness/grade-review.mjs <REVIEW.md> [--json]
 *
 * An issue counts as found when the review mentions its file and, within 12 lines
 * of that mention, uses at least two of the issue's keywords. This is a cheap
 * proxy: it under-counts paraphrase and over-counts long rambling reviews.
 * For a real number use harness/judge.sh.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname( fileURLToPath( import.meta.url ) );
const { issues } = await import( resolve( HERE, '../ground-truth/issues.mjs' ) );

const args = process.argv.slice( 2 );
const asJson = args.includes( '--json' );
const path = args.find( ( a ) => ! a.startsWith( '--' ) );
if ( ! path ) {
	console.error( 'usage: grade-review.mjs <REVIEW.md> [--json]' );
	process.exit( 2 );
}

const lines = readFileSync( resolve( path ), 'utf8' ).toLowerCase().split( '\n' );
const WINDOW = 12;

function found( issue ) {
	const names = [ issue.file.toLowerCase(), basename( issue.file ).toLowerCase() ];
	const hits = [];
	lines.forEach( ( line, i ) => {
		if ( names.some( ( n ) => line.includes( n ) ) ) hits.push( i );
	} );
	if ( ! hits.length ) return { ok: false, reason: 'file never mentioned' };

	const need = Math.min( 2, issue.keywords.length );
	for ( const i of hits ) {
		const chunk = lines.slice( Math.max( 0, i - WINDOW ), i + WINDOW ).join( '\n' );
		const matched = issue.keywords.filter( ( k ) => chunk.includes( k ) );
		if ( matched.length >= need ) return { ok: true, matched };
	}
	return { ok: false, reason: 'file mentioned but keywords absent nearby' };
}

const results = issues.map( ( i ) => ( { id: i.id, sev: i.sev, cat: i.cat, file: i.file, title: i.title, ...found( i ) } ) );

if ( asJson ) {
	console.log( JSON.stringify( results, null, 2 ) );
	process.exit( 0 );
}

const C = { reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', dim: '\x1b[2m', bold: '\x1b[1m' };
const bySev = {};
for ( const r of results ) {
	bySev[ r.sev ] ||= { ok: 0, total: 0 };
	bySev[ r.sev ].total++;
	if ( r.ok ) bySev[ r.sev ].ok++;
}

for ( const r of results.filter( ( r ) => ! r.ok ) ) {
	console.log( `  ${ C.red }MISS${ C.reset } ${ r.id.padEnd( 8 ) } ${ C.dim }${ r.sev.padEnd( 8 ) }${ C.reset } ${ r.title } ${ C.dim }(${ r.reason })${ C.reset }` );
}

const ok = results.filter( ( r ) => r.ok ).length;
console.log( `\n  ${ C.bold }Recall${ C.reset } ${ ok }/${ results.length } (${ Math.round( ( ok / results.length ) * 100 ) }%)` );
for ( const sev of [ 'critical', 'high', 'medium', 'low' ] ) {
	if ( bySev[ sev ] ) console.log( `  ${ sev.padEnd( 9 ) } ${ bySev[ sev ].ok }/${ bySev[ sev ].total }` );
}
