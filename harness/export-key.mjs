#!/usr/bin/env node
/** Emits the answer key as JSON for the LLM judge (detector regexes stripped). */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname( fileURLToPath( import.meta.url ) );
const { issues } = await import( resolve( HERE, '../ground-truth/issues.mjs' ) );

console.log( JSON.stringify(
	issues.map( ( { id, cat, sev, file, title, why } ) => ( { id, category: cat, severity: sev, file, title, why } ) ),
	null,
	2
) );
