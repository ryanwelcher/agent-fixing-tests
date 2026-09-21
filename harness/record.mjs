#!/usr/bin/env node
/**
 * Append one completed run to the results ledger.
 *
 *   node harness/record.mjs <run-dir> --arm <arm> [--reviewer M] [--implementer M] [--notes "..."]
 *
 * Reads the artifacts score.sh already produced (score.json, usage.json,
 * review-grade.json, GRADE.json, lint.json) and writes a single flat row to
 * results/runs.jsonl. The ledger is append-only: it is the article's raw data.
 */

import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'node:fs';
import { resolve, join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname( fileURLToPath( import.meta.url ) );
const ROOT = resolve( HERE, '..' );
const argv = process.argv.slice( 2 );
const opt = ( n, d = null ) => { const i = argv.indexOf( `--${ n }` ); return i === -1 ? d : argv[ i + 1 ]; };
const runDir = resolve( argv.find( ( a ) => ! a.startsWith( '--' ) ) || '.' );

const readJson = ( p, d = null ) => ( existsSync( p ) ? JSON.parse( readFileSync( p, 'utf8' ) ) : d );

const score = readJson( join( runDir, 'score.json' ) );
const usage = readJson( join( runDir, 'usage.json' ) );
const heur = readJson( join( runDir, 'review-grade.json' ) );
const judge = readJson( join( runDir, 'GRADE.json' ) );
const lint = readJson( join( runDir, 'lint.json' ), { ok: null } );

if ( ! score ) { console.error( 'record: no score.json in ' + runDir ); process.exit( 1 ); }

const auto = score.results.filter( ( r ) => r.status !== 'manual' );
const fixed = auto.filter( ( r ) => r.status === 'fixed' );

const bySev = {};
for ( const r of auto ) {
	bySev[ r.sev ] ||= { fixed: 0, total: 0 };
	bySev[ r.sev ].total++;
	if ( r.status === 'fixed' ) bySev[ r.sev ].fixed++;
}
const byCat = {};
for ( const r of auto ) {
	byCat[ r.cat ] ||= { fixed: 0, total: 0 };
	byCat[ r.cat ].total++;
	if ( r.status === 'fixed' ) byCat[ r.cat ].fixed++;
}

let recallHeuristic = null;
if ( Array.isArray( heur ) ) {
	recallHeuristic = { found: heur.filter( ( h ) => h.ok ).length, total: heur.length };
}

let recallJudge = null;
if ( judge?.matched ) {
	recallJudge = {
		matched: judge.matched.length,
		missed: judge.missed?.length ?? null,
		extra_valid: judge.extra?.filter( ( e ) => e.verdict === 'valid' ).length ?? null,
		false_positives: judge.extra?.filter( ( e ) => e.verdict === 'false-positive' ).length ?? null,
	};
}

const diffPath = join( runDir, 'fix.diff' );
const diffLines = existsSync( diffPath ) ? readFileSync( diffPath, 'utf8' ).split( '\n' ).length : null;

const totals = usage?.totals || {};
const wallSeconds = ( usage?.phases || [] )
	.filter( ( p ) => p.label !== 'judge' )
	.reduce( ( a, p ) => a + ( p.wallMs ? p.wallMs / 1000 : 0 ), 0 );

// Of the defects the reviewer found, what share did the implementer actually land?
const recallCount = recallJudge?.matched ?? recallHeuristic?.found ?? null;
const recallToFix = recallCount ? Number( ( fixed.length / recallCount ).toFixed( 3 ) ) : null;

const row = {
	ts: new Date().toISOString(),
	run: basename( runDir ),
	arm: opt( 'arm', 'unknown' ),
	reviewer: opt( 'reviewer', null ),
	implementer: opt( 'implementer', null ),
	notes: opt( 'notes', null ),
	fixture: 'wp-event-manager',

	issues_total: auto.length,
	fixed: fixed.length,
	fix_rate: Number( ( fixed.length / auto.length ).toFixed( 3 ) ),
	fixed_by_severity: bySev,
	fixed_by_category: byCat,
	open_ids: auto.filter( ( r ) => r.status !== 'fixed' ).map( ( r ) => r.id ),

	recall_heuristic: recallHeuristic,
	recall_judge: recallJudge,
	recall_to_fix: recallToFix,

	lint_ok: lint.ok,
	diff_lines: diffLines,

	cost_usd: totals.cost ?? null,
	tokens_total: totals.tokens ?? null,
	tokens_output: totals.output ?? null,
	tokens_cache_read: totals.cacheRead ?? null,
	turns: totals.turns ?? null,
	tool_calls: totals.toolCalls ?? null,
	peak_context: totals.peakContext ?? null,
	wall_seconds: Math.round( wallSeconds ),

	cost_per_fix: fixed.length && totals.cost ? Number( ( totals.cost / fixed.length ).toFixed( 4 ) ) : null,
	tokens_per_fix: fixed.length && totals.tokens ? Math.round( totals.tokens / fixed.length ) : null,

	phases: ( usage?.phases || [] ).map( ( p ) => ( {
		label: p.label, model: p.model, ok: p.ok, turns: p.turns, tool_calls: p.toolCalls,
		wall_seconds: p.wallMs ? Math.round( p.wallMs / 1000 ) : null,
		cost_usd: p.cost,
		input: p.tokens.input, output: p.tokens.output,
		cache_create: p.tokens.cacheCreate, cache_read: p.tokens.cacheRead,
		billed_input: p.tokens.billedInput, total: p.tokens.total,
		peak_context: p.context.peak, context_window: p.context.window, peak_pct: p.context.peakPct,
		context_series: p.context.series,
	} ) ),
};

mkdirSync( join( ROOT, 'results' ), { recursive: true } );
appendFileSync( join( ROOT, 'results', 'runs.jsonl' ), JSON.stringify( row ) + '\n' );
console.log( `recorded ${ row.arm } / ${ row.run }: ${ row.fixed }/${ row.issues_total } fixed, $${ ( row.cost_usd ?? 0 ).toFixed( 4 ) }` );
