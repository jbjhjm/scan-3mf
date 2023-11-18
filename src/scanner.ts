import * as path from 'path';
import * as fs from 'fs';
import { glob } from 'glob';
import * as unzipper from 'unzipper';
import argsParser from 'args-parser';
import { ScanResult, createCountMap, formatScanResults, scanArchive } from './lib.js';

const args = argsParser(process.argv);

if(!args.path) throw new Error('please pass path to 3dprint file root dir at --path')
if(!args.property) throw new Error('please pass name of property to scan for at --property <print_settings_id|printer_settings_id|filament_settings_id>')

const basedir = args.path;
const configFlagName = args.property;

const limit = 999;
const propRegex = new RegExp("; "+configFlagName+" = (.*)", "gm");

async function main() {
	const files = await glob(['**/*.3mf'], {
		cwd: basedir
	})
	
	console.log("searching in " + files.length + " .3mf files for property '"+configFlagName+"'")
	
	const fileStats: ScanResult[] = [];
	
	for(let index=0; index < limit && index < files.length; index++) {
		const fullPath = path.join(basedir, files[index]);
	
		const scanResponse = await scanArchive(fullPath, propRegex);
	
		if(scanResponse.success === false) {
			console.log('could not find property within file '+files[index])
		} else {
			fileStats.push(scanResponse)
		}
	}
	
	const result = formatScanResults(fileStats);
	console.dir(result)
	
}

main()
