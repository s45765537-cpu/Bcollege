"use strict";

const vm = require("vm");
const fs = require("fs");
const process = require("process");
const minimist = require("minimist");
const util = require('util');

const { NEEDED_FILES, BASE_PATH, loadCSV, entries, fromEntries, keys, isObject } = require("./Common.js");

const HELP = `\
Script for dumping and comparing pose mappings.

Usage:
	node PoseMapping.js [options]

Options:
	-h, --help          Show help
	--dump <path>       Write the current pose mappings to the specified JSON file
	--compare <path>    Compare the current pose mappings with those in the passed JSON file
`;

/** @typedef {string} AssetName */
/** @typedef {string} LayerName */
/**
 * @template T
 * @typedef {Record<AssetGroupName, Record<AssetName, Record<LayerName, T>>>} LayerMapping
 */
/** @typedef {LayerMapping<AssetPoseMapping>} AllPoseMappings */
/** @typedef {Partial<Record<AssetPoseName, Record<"-" | "+", AssetPoseName | PoseType>>>} DiffRecord */
/** @typedef {[key: AssetPoseName, value: Record<"-" | "+", AssetPoseName | PoseType>][]} DiffList */
/** @typedef {Partial<LayerMapping<DiffRecord>>} AllDiffMappings */

/**
 * @param {minimist.ParsedArgs} argv
 * @returns {{ help?: boolean, dump?: string, compare?: string }}
 */
function validateArgv(argv) {
	const { _, ...kwargs } = argv;
	delete kwargs.h;

	/** @type {string[]} */
	const invalidArguments = [];
	invalidArguments.push(..._);

	/** @type {ReturnType<typeof validateArgv>} */
	const ret = {};
	const validKeys = new Set(["help", "dump", "compare"]);
	for (const [k, v] of Object.entries(kwargs)) {
		if (validKeys.has(k)) {
			ret[k] = v;
		} else {
			invalidArguments.push(k);
		}
	}

	if (invalidArguments.length > 0) {
		throw new Error(`Found ${invalidArguments.length} unknown arguments: ${invalidArguments.join()}`);
	} else if (keys(ret).length === 0) {
		throw new Error(`Expects at least one argument`);
	} else if ("dump" in kwargs && !kwargs.dump) {
		throw new Error("Dump file path must be a non-empty string");
	} else if ("compare" in kwargs && !kwargs.compare) {
		throw new Error("Compare file path must be a non-empty string");
	}
	return ret;
}

/**
 * Dump the pose mappings, extracted from the passed assets, to the output json file specified in `outputPath`
 * @param {readonly Asset[]} assets
 * @returns {AllPoseMappings}
 */
function gatherPoseMappings(assets) {
	const layers = [...assets].sort((a, b) => {
		const groupPrio = a.Group.Name.localeCompare(b.Group.Name);
		const assetPrio = a.Name.localeCompare(b.Name);
		return groupPrio || assetPrio;
	}).flatMap(a => a.Layer);

	const ret = /** @type {AllPoseMappings} */({});
	for (const layer of layers) {
		const layerName = layer.Name ?? "";
		const assetName = layer.Asset.Name;
		const groupName = layer.Asset.Group.Name;

		if (!ret[groupName]) {
			ret[groupName] = {};
		}
		if (!ret[groupName][assetName]) {
			ret[groupName][assetName] = {};
		}

		const posesSorted = fromEntries(entries(layer.PoseMapping).sort((i, j) => i[0].localeCompare(j[0])).filter(i => i[1]));
		ret[groupName][assetName][layerName] = posesSorted;
	}
	return ret;
}

/**
 * Construct the difference between the pose mappings in `newData` and `oldData`.
 * Assets and groups absent in `oldData` are ignored.
 * @param {AllPoseMappings} newData
 * @param {Partial<AllPoseMappings>} oldData
 * @param {readonly Pose[]} poses
 * @returns {AllDiffMappings | null}
 */
function getPoseMappingsDiff(newData, oldData, poses) {
	const poseNames = poses.map(p => p.Name).sort();

	/** @type {AllDiffMappings} */
	const diffMapping = {};
	for (const [groupName, assetNew] of entries(newData)) {
		const assetOld = oldData[groupName];
		if (!isObject(assetOld)) {
			continue;
		}

		for (const [assetName, layerNew] of entries(assetNew)) {
			const layerOld = assetOld[assetName];
			if (!isObject(layerOld)) {
				continue;
			}

			for (const [layerName, posesNew] of entries(layerNew)) {
				const posesOld = layerOld[layerName];
				if (!isObject(posesOld)) {
					continue;
				}

				const diff = /** @type {DiffList} */(poseNames.map(k => {
					const poseNew = posesNew[k] ?? "";
					const poseOld = posesOld[k] ?? "";
					if (poseNew === poseOld) {
						return null;
					} else {
						return [k, { "+": poseNew, "-": poseOld }];
					}
				}).filter(i => i !== null));

				if (diff.length === 0) {
					continue;
				}

				let groupDiff = diffMapping[groupName];
				if (!groupDiff) groupDiff = diffMapping[groupName] = {};
				let assetDiff = groupDiff[assetName];
				if (!assetDiff) assetDiff = groupDiff[assetName] = {};
				assetDiff[layerName] = fromEntries(diff);
			}
		}
	}
	return keys(diffMapping).length === 0 ? null : diffMapping;
}

/**
 * @returns {{ poseMapping: AllPoseMappings, poses: Pose[] }}
 */
function runVM() {
	const [commonFile, ...neededFiles] = NEEDED_FILES;
	/** @type {vm.Context & { Asset?: Asset[], Pose?: Pose[] }} */
	const context = vm.createContext({
		OuterArray: Array,
		Object: Object,
		TestingColorLayers: new Set(loadCSV("Assets/Female3DCG/LayerNames.csv", 2).map(i => i[0])),
		TestingColorGroups: new Set(loadCSV("Assets/Female3DCG/ColorGroups.csv", 2).map(i => i[0])),
	});
	vm.runInContext(fs.readFileSync(BASE_PATH + commonFile, { encoding: "utf-8" }), context, {
		filename: commonFile,
	});

	// Only patch `CommonGet` after loading `Common`, lest our monkey patch will be overriden again
	context.CommonGet = (file, callback) => {
		const data = fs.readFileSync(`../../${file}`, "utf8");
		const obj = {
			status: 200,
			responseText: data,
		};
		callback.bind(obj)(obj);
	};
	for (const file of neededFiles) {
		vm.runInContext(fs.readFileSync(BASE_PATH + file, { encoding: "utf-8" }), context, {
			filename: file,
		});
	}

	const { Asset, Pose } = context;
	if (!Asset || !Pose) {
		throw new Error("Failed to generate the `Asset` and/or `Pose` arrays");
	}

	return { poseMapping: gatherPoseMappings(Asset), poses: Pose };
}

(function () {
	const kwargs = validateArgv(minimist(
		process.argv.slice(2),
		{ string: ["compare", "dump"], alias: { "h": "help" } },
	));
	if (kwargs.help) {
		console.log(HELP);
		return;
	}

	const { poseMapping, poses } = runVM();

	if (kwargs.dump !== undefined) {
		fs.writeFileSync(kwargs.dump, JSON.stringify(poseMapping, undefined, 4));
		console.log(`Succesfully written pose mapping to "${kwargs.dump}"`);
	}

	if (kwargs.compare !== undefined) {
		/** @type {null | Record<string, any> | any[]} */
		const poseMappingOld = JSON.parse(fs.readFileSync(kwargs.compare, { encoding: "utf8" }));
		if (!isObject(poseMappingOld)) {
			throw new Error(`Invalid "${kwargs.compare}" JSON data expected a nested record`);
		}

		const diff = getPoseMappingsDiff(poseMapping, poseMappingOld, poses);
		if (diff !== null) {
			console.error(util.inspect(diff, { depth: null, colors: true }));
			process.exit(1);
		} else {
			console.log(`Succesfully compared "${kwargs.compare}" pose mappings without conflict`);
		}
	}
})();
