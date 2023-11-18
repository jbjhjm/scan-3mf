import * as unzipper from 'unzipper';
import * as fs from 'fs';
import * as path from 'path';
import dayjs from 'dayjs';


const possibleFiles = [
	"Metadata/Slic3r.config",
	"Metadata/Slic3r_PE.config",
	"Metadata/SuperSlicer.config",
]

export interface ScanResult { 
	success: boolean; 
	property?: string; 
	fileName?: string; 
	fileEditDate?: dayjs.Dayjs; 
}

export async function scanEntry(entry:unzipper.Entry, propRegex:RegExp): Promise<ScanResult> {
	const buffer = await entry.buffer();
	const contents = buffer.toString();
	const match = propRegex.exec(contents)
	if(!match) {
		return {success:false}
	} else {
		return {success:true, property:match[0]}
	}
}

export async function scanArchive(fullPath:string, propRegex:RegExp): Promise<ScanResult> {
	const fileInfo = fs.statSync(fullPath);

	const zip = fs.createReadStream(fullPath).pipe(unzipper.Parse({forceStream: true}));
	let scanResponse:ScanResult = {success:false};
	for await (const entry of zip as unknown as Iterable<unzipper.Entry>) {
		const fileName = entry.path;

		if (possibleFiles.includes(fileName)) {
			scanResponse = await scanEntry(entry, propRegex)
			if(scanResponse.success) break;
		} else {
			entry.autodrain();
		}
	}

	const fileName = path.basename(fullPath);
	scanResponse.fileName = fileName;
	scanResponse.fileEditDate = dayjs(fileInfo.mtime)

	return scanResponse
}

export function formatScanResults(data:ScanResult[]) {
	const grouped = groupByProperty(data);

	const groupInfos = Object.values(grouped).map(group=>mergeResults(group))
	return groupInfos;
}

export function mergeResults(data:ScanResult[]) {
	const fileCount = data.length;

	// order by fileEditDate
	data.sort((a,b) => {
		return a.fileEditDate.isAfter(b.fileEditDate) ? 1 : -1
	})
	// start with most recent files
	data.reverse()

	const lastUseOfProfile = data[0].fileEditDate

	const files = data.map(scanEntry=>{
		return scanEntry.fileName + ' --- last edit: '+scanEntry.fileEditDate.format('YYYY-MM-DD')+''
	})

	return {
		property:data[0].property, 
		lastUsed:lastUseOfProfile.format('YYYY-MM-DD'),
		fileCount, 
		// files
	}
}

export function groupByProperty(data:ScanResult[]):{[k:string]:ScanResult[]} {
	const out = {};
	data.forEach(result=>{
		if(!out[result.property]) out[result.property] = []
		out[result.property].push(result)
	})
	return out;
}


export function createCountMap(extractedData:string[]) {
	const dataCountMap = {};
	extractedData.forEach((value) => {
		dataCountMap[value] = (dataCountMap[value] || 0) + 1;
	});
	return dataCountMap;
}
