#!/usr/bin/env node
/** Emits the answer key as JSON for the LLM judge (detector regexes stripped). */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname( fileURLToPath( import.meta.url ) );
const keyArg = process.argv.find( ( a ) => a.startsWith( '--key=' ) );
const KEY = keyArg ? resolve( keyArg.slice( 6 ) ) : resolve( HERE, '../ground-truth/issues.mjs' );
const mod = await import( KEY );

console.log( JSON.stringify( {
	issues: mod.issues.map( ( { id, cat, sev, file, title, why, crossFile } ) => ( {
		id, category: cat, severity: sev,
		file: Array.isArray( file ) ? file.join( ' + ' ) : file,
		title, why, ...( crossFile ? { also_involves: crossFile } : {} ),
	} ) ),
	decoys: ( mod.decoys || [] ).map( ( d ) => ( {
		id: d.id, file: d.file, looks_like: d.looks_like, why_its_fine: d.why_its_fine,
	} ) ),
}, null, 2 ) );
