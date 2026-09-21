#!/usr/bin/env node
/**
 * Regenerate the article-ready outputs from the ledger.
 *
 *   node harness/report.mjs
 *
 * Reads results/runs.jsonl and writes:
 *   results/report.md    markdown tables, ready to paste into a draft
 *   results/results.csv  one row per run
 *   results/phases.csv   one row per phase per run (token/context detail)
 */

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve( dirname( fileURLToPath( import.meta.url ) ), '..' );
const LEDGER = join( ROOT, 'results', 'runs.jsonl' );

if ( ! existsSync( LEDGER ) ) { console.error( 'no results/runs.jsonl yet - run the self-test first' ); process.exit( 1 ); }

const all = readFileSync( LEDGER, 'utf8' ).split( '\n' ).filter( Boolean ).map( ( l ) => JSON.parse( l ) );

// The ledger is append-only and re-scoring a run (for example re-running
// verification after the fact) appends a second row. Keep the newest per run.
const latest = new Map();
for ( const r of all ) latest.set( r.run, r );
const rows = [ ...latest.values() ];
const superseded = all.length - rows.length;

const n = ( v, d = 0 ) => ( v === null || v === undefined ? '-' : Number( v ).toLocaleString( 'en-US', { minimumFractionDigits: d, maximumFractionDigits: d } ) );
const usd = ( v ) => ( v === null || v === undefined ? '-' : '$' + Number( v ).toFixed( 3 ) );
const pct = ( v ) => ( v === null || v === undefined ? '-' : Math.round( v * 100 ) + '%' );
const dur = ( s ) => ( s === null || s === undefined ? '-' : s >= 60 ? `${ Math.floor( s / 60 ) }m${ String( s % 60 ).padStart( 2, '0' ) }s` : `${ s }s` );

function table( headers, data ) {
	const out = [ `| ${ headers.join( ' | ' ) } |`, `| ${ headers.map( () => '---' ).join( ' | ' ) } |` ];
	for ( const r of data ) out.push( `| ${ r.join( ' | ' ) } |` );
	return out.join( '\n' );
}

const md = [];
md.push( '# Two-model review handoff: results\n' );
md.push( `_Generated ${ new Date().toISOString().slice( 0, 16 ).replace( 'T', ' ' ) } from ${ rows.length } run(s) in \`results/runs.jsonl\`${ superseded ? ` (${ superseded } superseded row(s) ignored)` : '' }._\n` );
md.push( 'Fixture: `wp-event-manager`, a WordPress plugin with 76 deliberately seeded defects' );
md.push( '(22 critical, 32 high, 13 medium, 9 low). 75 are checked by deterministic regex detectors;' );
md.push( 'one is graded by hand. Fix rate is measured on the code, not claimed by the model.\n' );

md.push( '## Headline\n' );
md.push( 'Two fix rates. **Detector** is the optimistic one: the broken pattern is gone and a' );
md.push( 'plausible API appears. **Verified** is the honest one: a judge read the code and confirmed' );
md.push( 'the defect is actually gone. Quote the verified number.\n' );
md.push( table(
	[ 'Arm', 'Reviewer', 'Implementer', 'Detector', 'Verified', 'Verified rate', 'Cost', 'Tokens', 'Wall', 'Cost/verified fix', 'Surface', 'Lint' ],
	rows.map( ( r ) => [
		'`' + r.arm + '`', r.reviewer || '-', r.implementer || '-',
		`${ r.fixed }/${ r.issues_total }`,
		r.verified_fixed === null || r.verified_fixed === undefined ? '-' : `${ r.verified_fixed }/${ r.issues_total }`,
		r.verified_fix_rate === null || r.verified_fix_rate === undefined ? '-' : pct( r.verified_fix_rate ),
		usd( r.cost_usd ), n( r.tokens_total ), dur( r.wall_seconds ),
		r.verified?.correct ? usd( r.cost_usd / r.verified.correct ) : '-',
		r.surface_ok === null || r.surface_ok === undefined ? '-' : r.surface_ok ? 'intact' : '**BROKEN**',
		r.lint_ok === null ? '-' : r.lint_ok ? 'pass' : '**FAIL**',
	] )
) );

md.push( '\n## Fix quality\n' );
md.push( 'Of the fixes the detectors passed, how many survive reading the code.\n' );
md.push( table(
	[ 'Arm', 'Implementer', 'Correct', 'Superficial', 'Removed feature', 'Uncertain', 'Regressions introduced', 'Detector overstated by' ],
	rows.map( ( r ) => {
		const v = r.verified;
		if ( ! v ) return [ '`' + r.arm + '`', r.implementer || '-', '-', '-', '-', '-', '-', '-' ];
		const overstate = r.fixed ? Math.round( ( ( r.fixed - v.correct ) / r.fixed ) * 100 ) + '%' : '-';
		return [ '`' + r.arm + '`', r.implementer || '-', v.correct, v.superficial, v.removed, v.uncertain, v.regressions, overstate ];
	} )
) );

const anyRegressions = rows.some( ( r ) => r.verified?.regressions_detail?.length );
if ( anyRegressions ) {
	md.push( '\n### Regressions the fix introduced\n' );
	for ( const r of rows ) {
		for ( const g of r.verified?.regressions_detail || [] ) {
			md.push( `- \`${ r.arm }\` — **${ g.severity }** \`${ g.file }\` — ${ g.what }` );
		}
	}
}

md.push( '\n## Fix rate by severity\n' );
const sevs = [ 'critical', 'high', 'medium', 'low' ];
md.push( table(
	[ 'Arm', 'Run', ...sevs.map( ( s ) => s[ 0 ].toUpperCase() + s.slice( 1 ) ) ],
	rows.map( ( r ) => [ '`' + r.arm + '`', r.run, ...sevs.map( ( s ) => {
		const b = r.fixed_by_severity?.[ s ];
		return b ? `${ b.fixed }/${ b.total }` : '-';
	} ) ] )
) );

md.push( '\n## Fix rate by category\n' );
const cats = [ ...new Set( rows.flatMap( ( r ) => Object.keys( r.fixed_by_category || {} ) ) ) ].sort();
md.push( table(
	[ 'Arm', 'Run', ...cats ],
	rows.map( ( r ) => [ '`' + r.arm + '`', r.run, ...cats.map( ( c ) => {
		const b = r.fixed_by_category?.[ c ];
		return b ? `${ b.fixed }/${ b.total }` : '-';
	} ) ] )
) );

md.push( '\n## Review recall vs. fixes landed\n' );
md.push( 'The gap between what the reviewer found and what the implementer landed is the cost of the handoff.\n' );
md.push( table(
	[ 'Arm', 'Run', 'Judge recall', 'False positives', 'Fixed', 'Found→fixed' ],
	rows.map( ( r ) => [
		'`' + r.arm + '`', r.run,
		r.recall_judge ? `${ r.recall_judge.matched }/${ r.issues_total + 1 }` : ( r.recall_heuristic ? `~${ r.recall_heuristic.found }/${ r.recall_heuristic.total } (heur.)` : '-' ),
		r.recall_judge?.false_positives ?? '-',
		r.fixed, r.recall_to_fix === null ? '-' : pct( r.recall_to_fix ),
	] )
) );

md.push( '\n## Tokens and context, per phase\n' );
md.push( table(
	[ 'Arm', 'Phase', 'Model', 'Turns', 'Tools', 'Output', 'Cache read', 'Billed in', 'Total', 'Cost', 'Peak context' ],
	rows.flatMap( ( r ) => ( r.phases || [] ).filter( ( p ) => p.label !== 'judge' ).map( ( p ) => [
		'`' + r.arm + '`', p.label, p.model || '-', n( p.turns ), n( p.tool_calls ),
		n( p.output ), n( p.cache_read ), n( p.billed_input ), n( p.total ), usd( p.cost_usd ),
		p.peak_context ? `${ n( p.peak_context ) }${ p.peak_pct ? ` (${ p.peak_pct }%)` : '' }` : '-',
	] ) )
) );

md.push( '\n## Where the handoff leaked\n' );
md.push( 'Defects the reviewer was looking at but the code still exhibits afterwards.\n' );
for ( const r of rows ) {
	md.push( `\n**\`${ r.arm }\` / ${ r.run }** — ${ r.open_ids.length } still open:\n` );
	md.push( '```\n' + ( r.open_ids.join( ' ' ) || '(none)' ) + '\n```' );
}

md.push( '\n## Raw data\n' );
md.push( '- `results/runs.jsonl` — one JSON object per run, the source of truth.' );
md.push( '- `results/results.csv` — one row per run.' );
md.push( '- `results/phases.csv` — one row per phase, with the per-turn context series.' );
md.push( '- `runs/<name>/` — transcripts (`*.jsonl`), `REVIEW.md`, `PLAN.md`, `IMPLEMENTATION.md`, `fix.diff`.\n' );

writeFileSync( join( ROOT, 'results', 'report.md' ), md.join( '\n' ) + '\n' );

const csvEsc = ( v ) => {
	const s = v === null || v === undefined ? '' : String( v );
	return /[",\n]/.test( s ) ? '"' + s.replace( /"/g, '""' ) + '"' : s;
};

const runCols = [ 'ts', 'run', 'arm', 'reviewer', 'implementer', 'issues_total', 'fixed', 'fix_rate',
	'verified_fixed', 'verified_fix_rate', 'verified_superficial', 'verified_removed', 'regressions',
	'recall_to_fix', 'lint_ok', 'surface_ok', 'diff_lines', 'cost_usd', 'tokens_total', 'tokens_output',
	'tokens_cache_read', 'turns', 'tool_calls', 'peak_context', 'wall_seconds', 'cost_per_fix', 'tokens_per_fix', 'notes' ];
const flat = ( r, c ) => {
	if ( c === 'verified_superficial' ) return r.verified?.superficial ?? null;
	if ( c === 'verified_removed' ) return r.verified?.removed ?? null;
	if ( c === 'regressions' ) return r.verified?.regressions ?? null;
	return r[ c ];
};
writeFileSync(
	join( ROOT, 'results', 'results.csv' ),
	[ runCols.join( ',' ), ...rows.map( ( r ) => runCols.map( ( c ) => csvEsc( flat( r, c ) ) ).join( ',' ) ) ].join( '\n' ) + '\n'
);

const phaseCols = [ 'run', 'arm', 'label', 'model', 'ok', 'turns', 'tool_calls', 'wall_seconds', 'cost_usd',
	'input', 'output', 'cache_create', 'cache_read', 'billed_input', 'total', 'peak_context', 'context_window', 'peak_pct', 'context_series' ];
const phaseRows = rows.flatMap( ( r ) => ( r.phases || [] ).map( ( p ) => phaseCols.map( ( c ) => {
	if ( c === 'run' ) return csvEsc( r.run );
	if ( c === 'arm' ) return csvEsc( r.arm );
	if ( c === 'context_series' ) return csvEsc( ( p.context_series || [] ).join( ' ' ) );
	return csvEsc( p[ c ] );
} ).join( ',' ) ) );
writeFileSync( join( ROOT, 'results', 'phases.csv' ), [ phaseCols.join( ',' ), ...phaseRows ].join( '\n' ) + '\n' );

console.log( `report: ${ rows.length } run(s)${ superseded ? `, ${ superseded } superseded` : '' } -> results/report.md, results.csv, phases.csv` );
