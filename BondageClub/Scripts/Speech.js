"use strict";

/**
 * A lookup mapping the gag effect names to their corresponding gag level numbers.
 * @type {Object.<string,number>}
 * @constant
 */
var SpeechGagLevelLookup = {
	GagTotal4: 20,
	GagTotal3: 16,
	GagTotal2: 12,
	GagTotal: 8,
	GagVeryHeavy: 7,
	GagHeavy: 6,
	GagMedium: 5,
	GagNormal: 4,
	GagEasy: 3,
	GagLight: 2,
	GagVeryLight: 1,
};

/**
 * Analyzes a phrase to determine if it is a full emote. A full emote is a phrase wrapped in "()"
 * @param {string} D - A phrase
 * @returns {boolean} - Returns TRUE if the current speech phrase is a full emote (all between parentheses)
 */
function SpeechFullEmote(D) {
	return ((D.indexOf("(") == 0) && (D.indexOf(")") == D.length - 1));
}

/**
 * Returns the gag level corresponding to the given effect array, or 0 if the effect array contains no gag effects
 * @param {string[]} Effect - The effect to lookup the gag level for
 * @return {number} - The gag level corresponding to the given effects
 */
function SpeechGetEffectGagLevel(Effect) {
	return Effect.reduce((Modifier, EffectName) => Modifier + (SpeechGagLevelLookup[EffectName] || 0), 0);
}

/**
 * Gets the cumulative gag level of an asset group. Each gagging effect has a specific numeric value. The following
 * Effect arrays are used for the calculation:
 *     - Item.Property.Effect
 *     - Item.Asset.Effect
 *     - Item.Asset.Group.Effect
 * @param {Character} C - The character, whose assets are used for the check
 * @param {string[]} AssetGroups - The name of the asset groups to look through
 * @returns {number} - Returns the total gag effect of the character's assets
 */
function SpeechGetGagLevel(C, AssetGroups) {
	const effects = CharacterGetEffects(C, AssetGroups, true);
	return SpeechGetEffectGagLevel(effects);
}

/**
 * Gets the cumulative gag level of a character
 * @param {Character} C - The character, whose assets are used for the check
 * @param {boolean} [NoDeaf=false] - Whether or not deafness affects the dialogue
 * @returns {number} - Returns the total gag effect of the character's assets
 */
function SpeechGetTotalGagLevel(C, NoDeaf=false) {
	let GagEffect = SpeechGetGagLevel(C, ["ItemMouth", "ItemMouth2", "ItemMouth3", "ItemHead", "ItemHood", "ItemNeck", "ItemDevices"]);

	if (C.ID != 0 && !NoDeaf) {
		if (Player.GetDeafLevel() >= 7) GagEffect = Math.max(GagEffect, 20);
		else if (Player.GetDeafLevel() >= 6) GagEffect = Math.max(GagEffect, 16);
		else if (Player.GetDeafLevel() >= 5) GagEffect = Math.max(GagEffect, 12);
		else if (Player.GetDeafLevel() >= 4) GagEffect = Math.max(GagEffect, 8);
		else if (Player.GetDeafLevel() >= 3) GagEffect = Math.max(GagEffect, 6);
		else if (Player.GetDeafLevel() >= 2) GagEffect = Math.max(GagEffect, 4);
		else if (Player.GetDeafLevel() >= 1) GagEffect = Math.max(GagEffect, 2);
	}
	return GagEffect;
}

/**
 * Processes the character's speech, anything between parentheses isn't touched. Effects alter the speech differently according to a character's language. Effects that can be applied are the following: gag talk, baby talk and stuttering.
 * @param {Character} C - The character, whose dialog might need to be altered
 * @param {string} CD - The character's dialog to alter
 * @param {boolean} [NoDeaf=false] - Whether or not deafness affects the dialogue
 * @returns {string} - Returns the dialog after speech effects were processed (Garbling, Stuttering, Baby talk)
 */
function SpeechGarble(C, CD, NoDeaf=false) {
	let NS = CD;

	let GagEffect = SpeechGetTotalGagLevel(C, NoDeaf);


	if (GagEffect > 0) NS = SpeechGarbleByGagLevel(GagEffect, CD);

	// No gag effect, we return the regular text
	NS = SpeechStutter(C, NS);
	NS = SpeechBabyTalk(C, NS);

	return NS;
}

/**
 * A helper function to check if the character that needs to be checked is in a string set.
 * We are using indexOf here because includes() is not compatiable for IE browser.
 * See below: 
 * - includes(): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
 * - indexOf(): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/indexOf
 * @param {string} stringSet - The string set that needs to be checked against to determine if characterNeedsToCheck is included.
 * @param {string} characterNeedsToCheck - The character that needs to be checked that if is included in the stringset.
 * @returns 
 */
function dialogContainsCharacter(stringSet, characterNeedsToCheck) {
	return stringSet.indexOf(characterNeedsToCheck) > -1;
}

/**
 * A helper method to check if the character parsed in is one of the following: ' .?!~-'
 * @param {string} character - The character needs to be checked.
 */
function isStandardPunctuationOrSpace(character) {
	return dialogContainsCharacter(' .?!~-', character)
}


/**
 * The core of the speech garble function, usable without being tied to a specific character
 * @param {number} GagEffect - The gag level of the speech
 * @param {string} CD - The character's dialog to alter
 * @return {string} - Garbled text
 */
function SpeechGarbleByGagLevel(GagEffect, CD, IgnoreOOC) {

	// Variables to build the new string and check if we are in a parentheses
	var NS = "";
	var Par = false;
	if (CD == null) CD = "";

	// GagTotal4 always returns mmmmm and muffles some frequent letters entirely, 75% least frequent letters
	if (GagEffect >= 20) {
		for (let L = 0; L < CD.length; L++) {
			let H = CD.charAt(L).toLowerCase();
			if (H == "(" && !IgnoreOOC) Par = true;
			if (Par) NS = NS.concat(CD.charAt(L));
			else {
				if (isStandardPunctuationOrSpace(H)) NS = NS.concat(H);
				else if (dialogContainsCharacter('zqjxkvbywgpfucdlhr', H)) NS = NS.concat(' ');
				else NS = NS.concat('m');
			}

			if (H == ")") Par = false;
		}
		return NS;
	}

	// GagTotal3 always returns mmmmm and muffles some relatively frequent letters entirely, 50% least frequent letters
	if (GagEffect >= 16) {
		for (let L = 0; L < CD.length; L++) {
			let H = CD.charAt(L).toLowerCase();
			if (H == "(" && !IgnoreOOC) Par = true;
			if (Par) NS = NS.concat(CD.charAt(L));
			else {
				if (isStandardPunctuationOrSpace(H)) NS = NS.concat(H);
				else if (dialogContainsCharacter('zqjxkvbywgpf', H)) NS = NS.concat(' ');
				else NS = NS.concat('m');
			}

			if (H == ")") Par = false;
		}
		return NS;
	}

	// GagTotal2 always returns mmmmm and muffles some less frequent letters entirely; 25% least frequent letters
	if (GagEffect >= 12) {
		for (let L = 0; L < CD.length; L++) {
			let H = CD.charAt(L).toLowerCase();
			if (H == "(" && !IgnoreOOC) Par = true;
			if (Par) NS = NS.concat(CD.charAt(L));
			else {
				if (isStandardPunctuationOrSpace(H)) NS = NS.concat(H);
				else if (dialogContainsCharacter('zqjxkv', H)) NS = NS.concat(' ');
				else NS = NS.concat('m');
			}

			if (H == ")") Par = false;
		}
		return NS;
	}

	// Total gags always returns mmmmm
	if (GagEffect >= 8) {
		for (let L = 0; L < CD.length; L++) {
			let H = CD.charAt(L).toLowerCase();
			if (H == "(" && !IgnoreOOC) Par = true;
			if (Par) NS = NS.concat(CD.charAt(L));
			else {
				if (isStandardPunctuationOrSpace(H)) NS = NS.concat(H);
				else NS = NS.concat('m');
			}

			if (H == ")") Par = false;
		}
		return NS;
	}

	// VeryHeavy garble - Close to no letter stays the same
	if (GagEffect >= 7) {
		for (let L = 0; L < CD.length; L++) {
			let H = CD.charAt(L).toLowerCase();
			if (H == "(" && !IgnoreOOC) Par = true;
			if (!Par) {
				// Regular characters
				if (dialogContainsCharacter('aeiouy', H)) NS = NS.concat('e');
				if (dialogContainsCharacter('jklr', H)) NS = NS.concat('a');
				if (dialogContainsCharacter('szh', H)) NS = NS.concat('h');
				if (dialogContainsCharacter('dfgnmwtcqxpv', H)) NS = NS.concat('m');
				if (isStandardPunctuationOrSpace(H) || H == 'b') NS = NS.concat(H);

				// Accents/Latin characters
				if (dialogContainsCharacter('áàãâéèêíìîõóòôúùû', H)) NS = NS.concat('e');
				if (H == "ç") NS = NS.concat('h');

				// Cyrillic characters
				if (dialogContainsCharacter('aeиоуюля', H)) NS = NS.concat('e');
				if (dialogContainsCharacter('cйх', H)) NS = NS.concat('к');
				if (dialogContainsCharacter('жклру', H)) NS = NS.concat('a');
				if (dialogContainsCharacter('зсгй', H)) NS = NS.concat('г');
				if (dialogContainsCharacter('брвы', H)) NS = NS.concat('ф');
				if (dialogContainsCharacter('дфгнм', H)) NS = NS.concat('м');

			} else NS = NS.concat(CD.charAt(L));
			if (H == ")") Par = false;
		}
		return NS;
	}

	// Heavy garble - Almost no letter stays the same
	if (GagEffect >= 6) {
		for (let L = 0; L < CD.length; L++) {
			let H = CD.charAt(L).toLowerCase();
			if (H == "(" && !IgnoreOOC) Par = true;
			if (!Par) {

				// Regular characters
				if (dialogContainsCharacter('aeiouyt', H)) NS = NS.concat('e');
				if (dialogContainsCharacter('cqx', H)) NS = NS.concat('k');
				if (dialogContainsCharacter('jklrw', H)) NS = NS.concat('a');
				if (dialogContainsCharacter('szh', H)) NS = NS.concat('h');
				if (dialogContainsCharacter('bpv', H)) NS = NS.concat('f');
				if (dialogContainsCharacter('dfgnm', H)) NS = NS.concat('m');
				if (isStandardPunctuationOrSpace(H)) NS = NS.concat(H);

				// Accents/Latin characters
				if (dialogContainsCharacter('áàãâéèêíìîõóòôúùû', H)) NS = NS.concat('e');
				if (H == "ç") NS = NS.concat('h');
				if (H == "ñ") NS = NS.concat('m');

				// Cyrillic characters
				if (dialogContainsCharacter('aeиоуюля', H)) NS = NS.concat('e');
				if (dialogContainsCharacter('cйх', H)) NS = NS.concat('к');
				if (dialogContainsCharacter('жклру', H)) NS = NS.concat('a');
				if (dialogContainsCharacter('зсгй', H)) NS = NS.concat('г');
				if (dialogContainsCharacter('брвы', H)) NS = NS.concat('ф');
				if (dialogContainsCharacter('дфгнм', H)) NS = NS.concat('м');

			} else NS = NS.concat(CD.charAt(L));
			if (H == ")") Par = false;
		}
		return NS;
	}

	// Medium garble - Some letters stays the same
	if (GagEffect >= 5) {
		for (let L = 0; L < CD.length; L++) {
			let H = CD.charAt(L).toLowerCase();
			if (H == "(" && !IgnoreOOC) Par = true;
			if (!Par) {

				// Regular characters
				if (dialogContainsCharacter('eiouyt', H)) NS = NS.concat('e');
				if (dialogContainsCharacter('cqxk', H)) NS = NS.concat('k');
				if (dialogContainsCharacter('jlrwa', H)) NS = NS.concat('a');
				if (dialogContainsCharacter('szh', H)) NS = NS.concat('h');
				if (dialogContainsCharacter('bpv', H)) NS = NS.concat('f');
				if (dialogContainsCharacter('dfgm', H)) NS = NS.concat('m');
				if (isStandardPunctuationOrSpace(H) || H == 'n') NS = NS.concat(H);

				// Accents/Latin characters
				if (dialogContainsCharacter('áàãâéèêíìîõóòôúùû', H)) NS = NS.concat('e');
				if (H == "ç") NS = NS.concat('h');
				if (H == "ñ") NS = NS.concat('m');

				// Cyrillic characters
				if (dialogContainsCharacter('aeиоуюля', H)) NS = NS.concat('e');
				if (dialogContainsCharacter('cйх', H)) NS = NS.concat('к');
				if (dialogContainsCharacter('жклру', H)) NS = NS.concat('a');
				if (dialogContainsCharacter('зсгй', H)) NS = NS.concat('г');
				if (dialogContainsCharacter('брвы', H)) NS = NS.concat('ф');
				if (dialogContainsCharacter('дфгнм', H)) NS = NS.concat('м');

			} else NS = NS.concat(CD.charAt(L));
			if (H == ")") Par = false;
		}
		return NS;
	}

	// Normal garble, keep vowels and a few letters the same
	if (GagEffect >= 4) {
		for (let L = 0; L < CD.length; L++) {
			let H = CD.charAt(L).toLowerCase();
			if (H == "(" && !IgnoreOOC) Par = true;
			if (!Par) {

				// Regular characters
				if (dialogContainsCharacter('vbct', H)) NS = NS.concat('e');
				if (dialogContainsCharacter('qkx', H)) NS = NS.concat('k');
				if (dialogContainsCharacter('wyjlr', H)) NS = NS.concat('a');
				if (dialogContainsCharacter('sz', H)) NS = NS.concat('h');
				if (dialogContainsCharacter('df', H)) NS = NS.concat('m');
				if (H == "p") NS = NS.concat('f');
				if (H == "g") NS = NS.concat('n');
				if (isStandardPunctuationOrSpace(H) || dialogContainsCharacter('aeioumnh', H)) NS = NS.concat(H);

				// Accents/Latin characters
				if (dialogContainsCharacter('áâà', H)) NS = NS.concat('a');
				if (dialogContainsCharacter('éêèë', H)) NS = NS.concat('e');
				if (dialogContainsCharacter('íîìï', H)) NS = NS.concat('i');
				if (dialogContainsCharacter('óôò', H)) NS = NS.concat('o');
				if (dialogContainsCharacter('úûùü', H)) NS = NS.concat('u');
				if (H == "ç") NS = NS.concat('s');
				if (H == "ñ") NS = NS.concat('n');

				// Cyrillic characters
				if (dialogContainsCharacter('вфбп', H)) NS = NS.concat('фы');
				if (dialogContainsCharacter('гкх', H)) NS = NS.concat('к');
				if (dialogContainsCharacter('вужлр', H)) NS = NS.concat('а');
				if (dialogContainsCharacter('ся', H)) NS = NS.concat('х');
				if (dialogContainsCharacter('дф', H)) NS = NS.concat('м');
				if (H == "р") NS = NS.concat('ф');
				if (H == "г") NS = NS.concat('н');

			} else NS = NS.concat(CD.charAt(L));
			if (H == ")") Par = false;
		}
		return NS;
	}

	// Easy garble, keep vowels and a some letters the same
	if (GagEffect >= 3) {
		for (let L = 0; L < CD.length; L++) {
			let H = CD.charAt(L).toLowerCase();
			if (H == "(" && !IgnoreOOC) Par = true;
			if (!Par) {

				// Regular characters
				if (dialogContainsCharacter('vbct', H)) NS = NS.concat('e');
				if (dialogContainsCharacter('qkx', H)) NS = NS.concat('k');
				if (dialogContainsCharacter('wyjlr', H)) NS = NS.concat('a');
				if (dialogContainsCharacter('sz', H)) NS = NS.concat('s');
				if (H == "d") NS = NS.concat('m');
				if (H == "p") NS = NS.concat('f');
				if (H == "g") NS = NS.concat('h');
				if (isStandardPunctuationOrSpace(H) || dialogContainsCharacter('aeioumnhf', H)) NS = NS.concat(H);

				// Accents/Latin characters
				if (dialogContainsCharacter('áâà', H)) NS = NS.concat('a');
				if (dialogContainsCharacter('éêèë', H)) NS = NS.concat('e');
				if (dialogContainsCharacter('íîìï', H)) NS = NS.concat('i');
				if (dialogContainsCharacter('óôò', H)) NS = NS.concat('o');
				if (dialogContainsCharacter('úûùü', H)) NS = NS.concat('u');
				if (H == "ç") NS = NS.concat('s');
				if (H == "ñ") NS = NS.concat('n');

				// Cyrillic characters
				if (dialogContainsCharacter('вфбп', H)) NS = NS.concat('фы');
				if (dialogContainsCharacter('гкх', H)) NS = NS.concat('к');
				if (dialogContainsCharacter('вужлр', H)) NS = NS.concat('а');
				if (dialogContainsCharacter('ся', H)) NS = NS.concat('х');
				if (dialogContainsCharacter('дф', H)) NS = NS.concat('м');
				if (H == "р") NS = NS.concat('ф');
				if (H == "г") NS = NS.concat('н');

			} else NS = NS.concat(CD.charAt(L));
			if (H == ")") Par = false;
		}
		return NS;
	}

	// Light garble, half of the letters stay the same
	if (GagEffect >= 2) {
		for (let L = 0; L < CD.length; L++) {
			let H = CD.charAt(L).toLowerCase();
			if (H == "(" && !IgnoreOOC) Par = true;
			if (!Par) {

				// Regular characters
				if (dialogContainsCharacter('ct', H)) NS = NS.concat('e');
				if (dialogContainsCharacter('qkx', H)) NS = NS.concat('k');
				if (H == "p") NS = NS.concat('f');
				if (H == "g") NS = NS.concat('n');
				if (H == "s") NS = NS.concat('z');
				if (H == "z") NS = NS.concat('s');
				if (H == "f") NS = NS.concat('h');
				if (dialogContainsCharacter('dmg', H)) NS = NS.concat('m');
				if (dialogContainsCharacter('bhnvwp', H) || isStandardPunctuationOrSpace(H) || dialogContainsCharacter('aeiouy', H)) NS = NS.concat(H);

				// Accents/Latin characters
				if (dialogContainsCharacter('áâà', H)) NS = NS.concat('a');
				if (dialogContainsCharacter('éêèë', H)) NS = NS.concat('e');
				if (dialogContainsCharacter('íîìï', H)) NS = NS.concat('i');
				if (dialogContainsCharacter('óôò', H)) NS = NS.concat('o');
				if (dialogContainsCharacter('úûùü', H)) NS = NS.concat('u');
				if (H == "ç") NS = NS.concat('s');
				if (H == "ñ") NS = NS.concat('n');

				// Cyrillic characters
				if (dialogContainsCharacter('чц', H)) NS = NS.concat('e');
				if (dialogContainsCharacter('йфв', H)) NS = NS.concat('к');
				if (dialogContainsCharacter('длщя', H)) NS = NS.concat('a');
				if (H == "з") NS = NS.concat('c');
				if (H == "с") NS = NS.concat('з');
				if (dialogContainsCharacter('дфмг', H)) NS = NS.concat('м');
				if (dialogContainsCharacter('апрокенмит', H)) NS = NS.concat(H);

			} else NS = NS.concat(CD.charAt(L));
			if (H == ")") Par = false;
		}
		return NS;
	}

	// Very Light garble, most of the letters stay the same
	if (GagEffect >= 1) {
		for (let L = 0; L < CD.length; L++) {
			let H = CD.charAt(L).toLowerCase();
			if (H == "(" && !IgnoreOOC) Par = true;
			if (!Par) {

				// Regular characters
				if (H == "t") NS = NS.concat('e');
				if (dialogContainsCharacter('cqkx', H)) NS = NS.concat('k');
				if (dialogContainsCharacter('jlr', H)) NS = NS.concat('a');
				if (dialogContainsCharacter('dmg', H)) NS = NS.concat('m');
				if (dialogContainsCharacter('bhnvwp', H) || isStandardPunctuationOrSpace(H) || dialogContainsCharacter('aeiouyfsz', H)) NS = NS.concat(H);

				// Accents/Latin characters
				if (dialogContainsCharacter('áâà', H)) NS = NS.concat('a');
				if (dialogContainsCharacter('éêèë', H)) NS = NS.concat('e');
				if (dialogContainsCharacter('íîìï', H)) NS = NS.concat('i');
				if (dialogContainsCharacter('óôò', H)) NS = NS.concat('o');
				if (dialogContainsCharacter('úûùü', H)) NS = NS.concat('u');
				if (H == "ç") NS = NS.concat('s');
				if (H == "ñ") NS = NS.concat('n');

				// Cyrillic characters
				if (dialogContainsCharacter('чц', H)) NS = NS.concat('e');
				if (dialogContainsCharacter('йфв', H)) NS = NS.concat('к');
				if (dialogContainsCharacter('длщя', H)) NS = NS.concat('a');
				if (H == "з") NS = NS.concat('c');
				if (H == "с") NS = NS.concat('з');
				if (dialogContainsCharacter('дфмг', H)) NS = NS.concat('м');
				if (dialogContainsCharacter('апрокенмит', H)) NS = NS.concat(H);

			} else NS = NS.concat(CD.charAt(L));
			if (H == ")") Par = false;
		}
		return NS;
	}

	return CD;

}

/**
 * Makes the character stutter if she has a vibrating item and/or is aroused. Stuttering based on arousal is toggled in the character's settings.
 * @param {Character} C - The character, whose dialog might need to be altered
 * @param {string} CD - The character's dialog to alter
 * @returns {string} - Returns the dialog after the stuttering factor was applied
 */
function SpeechStutter(C, CD) {

	// Validate nulls
	if (CD == null) CD = "";

	// Validates that the preferences allow stuttering
	if ((C.ArousalSettings == null) || (C.ArousalSettings.AffectStutter !== "None")) {

		// Gets the factor from current arousal
		var Factor = 0;
		if ((C.ArousalSettings == null) || (C.ArousalSettings.AffectStutter == null) || (C.ArousalSettings.AffectStutter == "Arousal") || (C.ArousalSettings.AffectStutter == "All"))
			if ((C.ArousalSettings != null) && (C.ArousalSettings.Progress != null) && (typeof C.ArousalSettings.Progress === "number") && !isNaN(C.ArousalSettings.Progress))
				Factor = Math.floor(C.ArousalSettings.Progress / 20);

		// Checks all items that "eggs" with an intensity, and replaces the factor if it's higher
		if (C.IsEgged() && ((C.ArousalSettings == null) || (C.ArousalSettings.AffectStutter == null) || (C.ArousalSettings.AffectStutter == "Vibration") || (C.ArousalSettings.AffectStutter == "All")))
			for (let A = 0; A < C.Appearance.length; A++) {
				var Item = C.Appearance[A];
				if (InventoryItemHasEffect(Item, "Egged", true) && Item.Property && Item.Property.Intensity && (typeof Item.Property.Intensity === "number") && !isNaN(Item.Property.Intensity) && (Item.Property.Intensity > Factor))
					Factor = Item.Property.Intensity;
			}

		// If the intensity factor is lower than 1, no stuttering occurs and we return the regular text
		if (Factor <= 0) return CD;

		// Loops in all letters to create a stuttering effect
		var Par = false;
		var CS = 1;
		var Seed = CD.length;
		for (let L = 0; L < CD.length; L++) {

			// Do not stutter the letters between parentheses
			var H = CD.charAt(L).toLowerCase();
			if (H == "(") Par = true;

			// If we are not between brackets and at the start of a word, there's a chance to stutter that word
			if (!Par && CS >= 0 && (H.match(/[[a-zа-яё]/i))) {

				// Generate a pseudo-random number using a seed, so that the same text always stutters the same way
				var R = Math.sin(Seed++) * 10000;
				R = R - Math.floor(R);
				R = Math.floor(R * 10) + Factor;
				if (CS == 1 || R >= 10) {
					CD = CD.substring(0, L) + CD.charAt(L) + "-" + CD.substring(L, CD.length);
					L += 2;
				}
				CS = -1;
			}
			if (H == ")") Par = false;
			if (H == " ") CS = 0;
		}
		return CD;

	}

	// No stutter effect, we return the regular text
	return CD;

}

/**
 * Makes the character talk like a Baby when she has drunk regression milk
 * @param {Character} C - The character, whose dialog needs to be altered
 * @param {string} CD - The character's dialog to alter
 * @returns {string} - Returns the dialog after baby talk was applied
 */
function SpeechBabyTalk(C, CD) {
	if (CD == null) CD = "";

	var Par = false;
	var NS = "";

	if (C.Effect.indexOf("RegressedTalk") >= 0) {
		for (let L = 0; L < CD.length; L++) {
			var H = CD.charAt(L).toLowerCase();
			if (H == "(") Par = true;
			if (!Par) {
				if (dialogContainsCharacter('kl', H)) NS = NS.concat('w');
				if (H == "s") NS = NS = NS.concat('sh');
				if (H == "t") NS = NS = NS.concat('st');
				if (H.match('[a-z]') || dialogContainsCharacter(" '?!.,", H)) NS = NS.concat(H);
			} else NS = NS.concat(CD.charAt(L));
			if (H == ")") Par = false;
		}
		return NS;
	}

	// Not drunk the milk, we return the regular text
	return CD;
}
