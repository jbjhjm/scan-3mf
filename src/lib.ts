import * as unzipper from 'unzipper';

const possibleFiles = [
	"Metadata/Slic3r.config",
	"Metadata/Slic3r_PE.config",
	"Metadata/SuperSlicer.config",
]

export interface ScanResult { success: boolean; data?: string; }

export async function scanEntry(entry:unzipper.Entry, propRegex:RegExp): Promise<ScanResult> {
	const buffer = await entry.buffer();
	const contents = buffer.toString();
	const match = propRegex.exec(contents)
	if(!match) {
		return {success:false}
	} else {
		console.log(match[0])
		return {success:true, data:match[0]}
	}
}

export async function scanArchive(zip:unzipper.ParseStream, propRegex:RegExp): Promise<ScanResult> {
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
	return scanResponse
}

export function createCountMap(extractedData:string[]) {
	const dataCountMap = {};
	extractedData.forEach((value) => {
		dataCountMap[value] = (dataCountMap[value] || 0) + 1;
	});
	return dataCountMap;
}
