#!/usr/bin/env node
/**
 * Deterministic scorer for the agent-fixing-tests fixture.
 *
 *   node harness/check.mjs <plugin-dir> [--json] [--baseline] [--sev critical,high]
 *
 * Reports, per seeded issue, whether the code still shows the defect.
 * --baseline asserts the opposite: every checkable issue must still be OPEN.
 * Use it after editing the fixture to prove the detectors still fire.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname( fileURLToPath( import.meta.url ) );
const { issues } = await import( resolve( HERE, '../ground-truth/issues.mjs' ) );

const args = process.argv.slice( 2 );
const flags = new Set( args.filter( ( a ) => a.startsWith( '--' ) ) );
const sevArg = args.find( ( a ) => a.startsWith( '--sev=' ) );
const sevFilter = sevArg ? sevArg.slice( 6 ).split( ',' ) : null;
const target = resolve( args.find( ( a ) => ! a.startsWith( '--' ) ) || '.' );

const cache = new Map();
function read( rel ) {
	if ( ! cache.has( rel ) ) {
		const p = join( target, rel );
		cache.set( rel, existsSync( p ) ? readFileSync( p, 'utf8' ) : null );
	}
	return cache.get( rel );
}

const results = [];

for ( const issue of issues ) {
	if ( sevFilter && ! sevFilter.includes( issue.sev ) ) continue;

	const base = { id: issue.id, cat: issue.cat, sev: issue.sev, file: issue.file, title: issue.title };

	if ( issue.codeCheck === false ) {
		results.push( { ...base, status: 'manual', notes: [ 'no reliable textual signature - grade from the review/plan' ] } );
		continue;
	}

	const src = read( issue.file );
	if ( src === null ) {
		results.push( { ...base, status: 'missing-file', notes: [ `${ issue.file } not found in target` ] } );
		continue;
	}

	const notes = [];

	for ( const re of issue.forbid || [] ) {
		if ( re.test( src ) ) notes.push( `still present: ${ re }` );
	}
	for ( const re of issue.require || [] ) {
		if ( ! re.test( src ) ) notes.push( `missing: ${ re }` );
	}
	for ( const { re, min } of issue.counts || [] ) {
		const n = ( src.match( re ) || [] ).length;
		if ( n < min ) notes.push( `only ${ n }/${ min } of ${ re }` );
	}

	results.push( { ...base, status: notes.length ? 'open' : 'fixed', notes } );
}

if ( flags.has( '--json' ) ) {
	console.log( JSON.stringify( { target, results }, null, 2 ) );
	process.exit( 0 );
}

const C = { reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', dim: '\x1b[2m', bold: '\x1b[1m' };
const mark = { fixed: `${ C.green }PASS${ C.reset }`, open: `${ C.red }OPEN${ C.reset }`, manual: `${ C.yellow }MANL${ C.reset }`, 'missing-file': `${ C.red }GONE${ C.reset }` };

if ( flags.has( '--baseline' ) ) {
	const bad = results.filter( ( r ) => r.status === 'fixed' );
	console.log( `${ C.bold }Baseline detector check${ C.reset } - ${ results.length } issues against ${ target }` );
	if ( bad.length ) {
		console.log( `${ C.red }${ bad.length } detector(s) report FIXED against the untouched fixture:${ C.reset }` );
		bad.forEach( ( r ) => console.log( `  ${ r.id }  ${ r.file }  ${ r.title }` ) );
		process.exit( 1 );
	}
	console.log( `${ C.green }OK${ C.reset } - every checkable detector fires on the untouched fixture.` );
	process.exit( 0 );
}

let byCat = {};
for ( const r of results ) {
	( byCat[ r.cat ] ||= [] ).push( r );
}

for ( const cat of Object.keys( byCat ).sort() ) {
	console.log( `\n${ C.bold }${ cat }${ C.reset }` );
	for ( const r of byCat[ cat ] ) {
		console.log( `  ${ mark[ r.status ] } ${ r.id.padEnd( 8 ) } ${ C.dim }${ r.sev.padEnd( 8 ) }${ C.reset } ${ r.title }` );
		if ( r.status === 'open' ) r.notes.forEach( ( n ) => console.log( `       ${ C.dim }${ n }${ C.reset }` ) );
	}
}

const total = results.filter( ( r ) => r.status !== 'manual' ).length;
const fixed = results.filter( ( r ) => r.status === 'fixed' ).length;
const manual = results.filter( ( r ) => r.status === 'manual' ).length;

const scoreBySev = {};
for ( const r of results ) {
	if ( r.status === 'manual' ) continue;
	scoreBySev[ r.sev ] ||= { fixed: 0, total: 0 };
	scoreBySev[ r.sev ].total++;
	if ( r.status === 'fixed' ) scoreBySev[ r.sev ].fixed++;
}

console.log( `\n${ C.bold }Score${ C.reset }  ${ fixed }/${ total } auto-checked issues fixed (${ Math.round( ( fixed / total ) * 100 ) }%)` );
for ( const sev of [ 'critical', 'high', 'medium', 'low' ] ) {
	if ( scoreBySev[ sev ] ) console.log( `  ${ sev.padEnd( 9 ) } ${ scoreBySev[ sev ].fixed }/${ scoreBySev[ sev ].total }` );
}
if ( manual ) console.log( `  ${ C.yellow }${ manual } issue(s) need manual grading${ C.reset }` );

process.exit( fixed === total ? 0 : 1 );
