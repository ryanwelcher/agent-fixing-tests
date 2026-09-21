#!/usr/bin/env node
/**
 * Token, cost and context telemetry from a stream-json transcript.
 *
 *   node harness/usage.mjs text  <file.jsonl>                      final assistant text
 *   node harness/usage.mjs phase <file.jsonl> [--label L] [--model M] [--wall S]
 *   node harness/usage.mjs report <run-dir> [--json]
 *
 * Billed tokens come from the result envelope. Context growth is reconstructed
 * per assistant turn as input + cache_creation + cache_read, which is what the
 * model actually had in its window on that request.
 */

import { readFileSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';

const argv = process.argv.slice( 2 );
const cmd = argv[ 0 ];
const positional = argv.slice( 1 ).filter( ( a ) => ! a.startsWith( '--' ) );
function opt( name, fallback = null ) {
	const i = argv.indexOf( `--${ name }` );
	return i === -1 ? fallback : argv[ i + 1 ];
}

function lines( file ) {
	if ( ! existsSync( file ) ) return [];
	return readFileSync( file, 'utf8' )
		.split( '\n' )
		.filter( Boolean )
		.map( ( l ) => {
			try { return JSON.parse( l ); } catch { return null; }
		} )
		.filter( Boolean );
}

function parse( file ) {
	const events = lines( file );
	const result = events.find( ( e ) => e.type === 'result' );

	// Assistant messages stream twice (partial + final); dedupe on message id.
	const turns = new Map();
	const tools = {};
	let toolCalls = 0;

	for ( const e of events ) {
		if ( e.type !== 'assistant' || ! e.message ) continue;
		const u = e.message.usage;
		if ( u ) {
			turns.set( e.message.id, {
				context: ( u.input_tokens || 0 ) + ( u.cache_creation_input_tokens || 0 ) + ( u.cache_read_input_tokens || 0 ),
				output: u.output_tokens || 0,
			} );
		}
		for ( const block of e.message.content || [] ) {
			if ( block.type === 'tool_use' ) {
				// Same message may stream twice; count per unique block id.
				if ( ! tools[ block.name ] ) tools[ block.name ] = new Set();
				tools[ block.name ].add( block.id );
			}
		}
	}

	const toolCounts = {};
	for ( const [ name, ids ] of Object.entries( tools ) ) {
		toolCounts[ name ] = ids.size;
		toolCalls += ids.size;
	}

	const series = [ ...turns.values() ].map( ( t ) => t.context );
	const u = result?.usage || {};
	const modelUsage = result?.modelUsage || {};
	const contextWindow = Math.max( 0, ...Object.values( modelUsage ).map( ( m ) => m.contextWindow || 0 ) );
	const peak = series.length ? Math.max( ...series ) : 0;

	const billedInput = ( u.input_tokens || 0 ) + ( u.cache_creation_input_tokens || 0 ) + ( u.cache_read_input_tokens || 0 );

	return {
		file: basename( file ),
		ok: result ? ! result.is_error : false,
		subtype: result?.subtype || 'no-result',
		turns: result?.num_turns ?? series.length,
		wallMs: result?.duration_ms ?? null,
		apiMs: result?.duration_api_ms ?? null,
		cost: result?.total_cost_usd ?? 0,
		tokens: {
			input: u.input_tokens || 0,
			output: u.output_tokens || 0,
			cacheCreate: u.cache_creation_input_tokens || 0,
			cacheRead: u.cache_read_input_tokens || 0,
			billedInput,
			total: billedInput + ( u.output_tokens || 0 ),
		},
		context: {
			peak,
			window: contextWindow || null,
			peakPct: contextWindow ? Math.round( ( peak / contextWindow ) * 100 ) : null,
			firstTurn: series[ 0 ] ?? 0,
			series,
		},
		toolCalls,
		toolCounts,
		models: Object.fromEntries( Object.entries( modelUsage ).map( ( [ k, v ] ) => [ k, { cost: v.costUSD, in: v.inputTokens, out: v.outputTokens } ] ) ),
	};
}

function finalText( file ) {
	const events = lines( file );
	const result = events.find( ( e ) => e.type === 'result' );
	if ( result?.result ) return result.result;
	const assistants = events.filter( ( e ) => e.type === 'assistant' && e.message );
	const last = assistants[ assistants.length - 1 ];
	return ( last?.message?.content || [] ).filter( ( b ) => b.type === 'text' ).map( ( b ) => b.text ).join( '\n' );
}

const fmt = ( n ) => n.toLocaleString( 'en-US' );
const usd = ( n ) => '$' + n.toFixed( 4 );

if ( cmd === 'text' ) {
	console.log( finalText( resolve( positional[ 0 ] ) ) );
	process.exit( 0 );
}

if ( cmd === 'phase' ) {
	const out = parse( resolve( positional[ 0 ] ) );
	out.label = opt( 'label', 'phase' );
	out.model = opt( 'model', null );
	const wall = opt( 'wall' );
	if ( wall ) out.wallSeconds = Number( wall );
	console.log( JSON.stringify( out, null, 2 ) );
	process.exit( 0 );
}

if ( cmd === 'report' ) {
	const runDir = resolve( positional[ 0 ] || '.' );
	const order = [ 'review', 'fix', 'oneshot', 'skill', 'judge', 'verify' ];
	const found = readdirSync( runDir ).filter( ( f ) => f.endsWith( '.jsonl' ) );
	found.sort( ( a, b ) => order.indexOf( a.replace( '.jsonl', '' ) ) - order.indexOf( b.replace( '.jsonl', '' ) ) );

	const phases = found.map( ( f ) => {
		const p = parse( join( runDir, f ) );
		p.label = f.replace( '.jsonl', '' );
		const meta = join( runDir, `${ p.label }-meta.json` );
		if ( existsSync( meta ) ) Object.assign( p, { model: JSON.parse( readFileSync( meta, 'utf8' ) ).model } );
		return p;
	} );

	// The judge and the fix verifier grade the run; they are measurement, not
	// part of the run's own cost. Counting them would inflate cost-per-fix.
	const GRADING = new Set( [ 'judge', 'verify' ] );
	const billable = phases.filter( ( p ) => ! GRADING.has( p.label ) );

	const report = {
		run: basename( runDir ),
		phases,
		totals: {
			cost: billable.reduce( ( a, p ) => a + p.cost, 0 ),
			tokens: billable.reduce( ( a, p ) => a + p.tokens.total, 0 ),
			output: billable.reduce( ( a, p ) => a + p.tokens.output, 0 ),
			cacheRead: billable.reduce( ( a, p ) => a + p.tokens.cacheRead, 0 ),
			turns: billable.reduce( ( a, p ) => a + p.turns, 0 ),
			toolCalls: billable.reduce( ( a, p ) => a + p.toolCalls, 0 ),
			peakContext: Math.max( 0, ...billable.map( ( p ) => p.context.peak ) ),
		},
	};

	const scorePath = join( runDir, 'score.json' );
	if ( existsSync( scorePath ) ) {
		const results = JSON.parse( readFileSync( scorePath, 'utf8' ) ).results;
		const auto = results.filter( ( r ) => r.status !== 'manual' );
		const fixed = auto.filter( ( r ) => r.status === 'fixed' ).length;
		report.score = { fixed, total: auto.length };
		report.efficiency = {
			costPerIssueFixed: fixed ? report.totals.cost / fixed : null,
			tokensPerIssueFixed: fixed ? Math.round( report.totals.tokens / fixed ) : null,
		};
	}

	writeFileSync( join( runDir, 'usage.json' ), JSON.stringify( report, null, 2 ) );

	if ( argv.includes( '--json' ) ) {
		console.log( JSON.stringify( report, null, 2 ) );
		process.exit( 0 );
	}

	const B = '\x1b[1m', D = '\x1b[2m', R = '\x1b[0m', Y = '\x1b[33m';
	console.log( `\n${ B }phase      model        turns  tools   output    cache-rd   billed-in     total      cost   peak-ctx${ R }` );
	for ( const p of phases ) {
		const tag = GRADING.has( p.label ) ? `${ D }${ p.label }*${ R }` : p.label;
		console.log(
			'  ' + tag.padEnd( 9 ) +
			( p.model || '?' ).padEnd( 12 ) +
			String( p.turns ).padStart( 5 ) +
			String( p.toolCalls ).padStart( 7 ) +
			fmt( p.tokens.output ).padStart( 9 ) +
			fmt( p.tokens.cacheRead ).padStart( 11 ) +
			fmt( p.tokens.billedInput ).padStart( 12 ) +
			fmt( p.tokens.total ).padStart( 10 ) +
			usd( p.cost ).padStart( 10 ) +
			( fmt( p.context.peak ) + ( p.context.peakPct !== null ? ` (${ p.context.peakPct }%)` : '' ) ).padStart( 15 )
		);
		if ( ! p.ok ) console.log( `  ${ Y }  ^ phase did not complete cleanly: ${ p.subtype }${ R }` );
	}

	const t = report.totals;
	console.log( `  ${ '-'.repeat( 96 ) }` );
	console.log(
		'  ' + `${ B }run total${ R }`.padEnd( 30 ) +
		String( t.turns ).padStart( 5 ) +
		String( t.toolCalls ).padStart( 7 ) +
		fmt( t.output ).padStart( 9 ) +
		fmt( t.cacheRead ).padStart( 11 ) +
		''.padStart( 12 ) +
		fmt( t.tokens ).padStart( 10 ) +
		usd( t.cost ).padStart( 10 ) +
		fmt( t.peakContext ).padStart( 15 )
	);
	if ( phases.some( ( p ) => GRADING.has( p.label ) ) ) console.log( `  ${ D }* grading phases excluded from run total - they measure the run, they are not part of it${ R }` );

	if ( report.score ) {
		console.log( `\n  ${ B }issues fixed${ R }  ${ report.score.fixed }/${ report.score.total }` );
		console.log( `  ${ B }cost / fix${ R }    ${ usd( report.efficiency.costPerIssueFixed ) }` );
		console.log( `  ${ B }tokens / fix${ R }  ${ fmt( report.efficiency.tokensPerIssueFixed ) }` );
	}

	console.log( `\n  ${ D }context growth per turn${ R }` );
	for ( const p of billable ) {
		const s = p.context.series;
		if ( ! s.length ) continue;
		const spark = s.map( ( v ) => '▁▂▃▄▅▆▇█'[ Math.min( 7, Math.floor( ( v / ( p.context.window || Math.max( ...s ) ) ) * 8 ) ) ] ).join( '' );
		console.log( `    ${ p.label.padEnd( 9 ) } ${ spark }  ${ fmt( s[ 0 ] ) } -> ${ fmt( s[ s.length - 1 ] ) }` );
	}
	console.log();
	process.exit( 0 );
}

console.error( 'usage: usage.mjs text|phase|report <path> [flags]' );
process.exit( 2 );
