"use strict";

/**
 * Namespace with functions for converting pose name arrays into records
 * @namespace
 */
const PoseToMapping = /** @type {const} */({
	/**
     * Unflatten a pose name array, converting it into a record mapping pose categories to aforementioned pose names
     * @param {readonly AssetPoseName[]} poses - The to-be unflattened pose array
     * @param {null | string} warningPrefix - A prefix to-be prepended to any warning messages
     * @returns {Partial<Record<AssetPoseCategory, AssetPoseName[]>>}
     */
	Array: function (poses, warningPrefix=null) {
		const prefix = warningPrefix == null ? "" : `${warningPrefix}: `;

		/** @type {Partial<Record<AssetPoseCategory, AssetPoseName[]>>} */
		const poseMapping = {};
		if (!CommonIsArray(poses)) {
			console.warn(`${prefix}Invalid pose array type: ${typeof poses}`);
			return poseMapping;
		}

		for (const poseName of poses) {
			const pose = PoseRecord[poseName];
			if (!pose) {
				console.warn(`${prefix}Ignoring invalid "${poseName}" pose`);
				continue;
			}

			const poseList = poseMapping[pose.Category];
			if (poseList) {
				poseList.push(poseName);
			} else {
				poseMapping[pose.Category] = [poseName];
			}
		}
		return poseMapping;
	},
	/**
     * Unflatten a pose name array, converting it into a record mapping pose categories to a single pose.
     * A warning will be logged if multiple poses within the same category are present.
     * @param {readonly AssetPoseName[]} poses - The to-be unflattened pose array
     * @param {null | string} warningPrefix - A prefix to-be prepended to any warning messages
     * @returns {Partial<Record<AssetPoseCategory, AssetPoseName>>}
     */
	Scalar: function (poses, warningPrefix=null) {
		const prefix = warningPrefix == null ? "" : `${warningPrefix}: `;

		/** @type {Partial<Record<AssetPoseCategory, AssetPoseName>>} */
		const poseMapping = {};
		if (!CommonIsArray(poses)) {
			console.warn(`${prefix}Invalid pose array type: ${typeof poses}`);
			return poseMapping;
		}

		for (const poseName of poses) {
			const pose = PoseRecord[poseName];
			if (!pose) {
				console.warn(`${prefix}Ignoring invalid "${poseName}" pose`);
				continue;
			}
			if (poseMapping[pose.Category]) {
				const invalidPoses = [poseMapping[pose.Category], poseName];
				console.warn(`${prefix}Found two or more poses within the ${pose.Category} category: ${invalidPoses}`);
			}
			poseMapping[pose.Category] = poseName;
		}
		return poseMapping;
	},
});

/**
 * Checks whether the given character can change to the named pose (without aid by default).
 * @param {Character} C - The character to check
 * @param {AssetPoseName} poseName - The name of the pose to check for
 * @returns {boolean} - Returns true if the character has no conflicting items and is not prevented from changing to
 * the provided pose
 */
function PoseCanChangeUnaided(C, poseName) {
	const pose = PoseRecord[poseName];
	if (!pose || !C) {
		return false;
	}

	const canChange = PoseAvailable(C, pose.Category, pose.Name);
	if (!canChange) {
		return false;
	}

	// Add special casing for BodyLower, forcing usage of the "kneel/stand up" button if one or more standing poses have explicit support
	const standingPoses = /** @type {const} */(["LegsClosed", "LegsOpen", "Spread"]);
	return !standingPoses.some(p => PoseSetByItems(C, pose.Category, p));
}

/**
 * Returns whether a pose is available.
 * @param {Character} C - Character to check for the pose
 * @param {AssetPoseCategory} category - The pose category
 * @param {AssetPoseName} poseName - The pose in question
 * @returns {boolean}
 */
function PoseAvailable(C, category, poseName) {
	if (!C) {
		return false;
	}
	const poseList = C.AllowedActivePoseMapping[category];
	return !poseList || poseList.includes(poseName);
}

/**
 * Returns whether any poses are available in the passed category
 * @param {Character} C - Character to check for the pose category
 * @param {AssetPoseCategory} category - The pose category in question
 * @returns {boolean}
 */
function PoseCategoryAvailable(C, category) {
	if (!C) {
		return false;
	}
	const poseNames = C.AllowedActivePoseMapping[category];
	return !poseNames || poseNames.length > 0;
}

/**
 * Return whether the items on a character set a given pose.
 * Note that this does not guarantee that the pose is actually active.
 * @param {Character} C - Character to check for the pose
 * @param {AssetPoseCategory} category - The pose category
 * @param {AssetPoseName} poseName - The pose in question
 * @returns {boolean}
 */
function PoseSetByItems(C, category, poseName) {
	if (!C) {
		return false;
	}
	const poseList = C.AllowedActivePoseMapping[category];
	return poseList && poseList.includes(poseName);
}
