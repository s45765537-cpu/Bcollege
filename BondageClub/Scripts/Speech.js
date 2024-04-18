"use strict";

const chineseRegex = /\p{Script=Hani}/u;
const chineseRandomGarbledSound = ['啊', '恩', '咕', '唔', '哈', '嗷', '呜'];

/**
 * A lookup mapping the gag effect names to their corresponding gag level numbers.
 * @satisfies {Record<GagEffectName, number>}
 * @constant
 */
var SpeechGagLevelLookup = /** @type {const} */({
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
});

/**
 * Analyzes a phrase to determine if it is a full emote. A full emote is a phrase wrapped in "()"
 * @param {string} D - A phrase
 * @returns {boolean} - Returns TRUE if the current speech phrase is a full emote (all between parentheses)
 */
function SpeechFullEmote(D) {
	return ((D.indexOf("(") == 0 || D.indexOf("（") == 0) && (D.indexOf(")") == D.length - 1 || D.indexOf("）") == D.length - 1));
}

/**
 * Returns the gag level corresponding to the given effect array, or 0 if the effect array contains no gag effects
 * @param {readonly EffectName[]} Effect - The effect to lookup the gag level for
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
 * @param {readonly AssetGroupItemName[]} AssetGroups - The name of the asset groups to look through
 * @returns {number} - Returns the total gag effect of the character's assets
 */
function SpeechGetGagLevel(C, AssetGroups) {
	const effects = CharacterGetEffects(C, AssetGroups, true);
	return SpeechGetEffectGagLevel(effects);
}

/**
 * Gets the cumulative gag level of a character
 * @deprecated - superseded by {@link SpeechTransformGagGarbleIntensity}
 * @param {Character} C - The character, whose assets are used for the check
 * @param {boolean} [NoDeaf=false] - Whether or not deafness affects the dialogue
 * @returns {number} - Returns the total gag effect of the character's assets
 */
function SpeechGetTotalGagLevel(C, NoDeaf=false) {
	return SpeechTransformGagGarbleIntensity(C, NoDeaf);
}

/**
 * Processes the character's speech, anything between parentheses isn't touched.
 *
 * Effects alter the speech differently according to a character's language.
 * Effects that can be applied are the following: gag talk, baby talk and stuttering.
 *
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
 * A PRNG(Pseudo random number generator) helper to generate random number sequence by seed.
 * Stole this function and the function below from {@link https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript stackoverflow}
 * @param {number} a - seed 1
 * @param {number} b - seed 2
 * @param {number} c - seed 3
 * @param {number} d - seed 4
 * @returns {() => number} - The function where it could be used to do PRNG magic.
 */
function sfc32(a, b, c, d) {
	return function() {
		a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
		var t = (a + b) | 0;
		a = b ^ b >>> 9;
		b = c + (c << 3) | 0;
		c = (c << 21 | c >>> 11);
		d = d + 1 | 0;
		t = t + d | 0;
		c = c + t | 0;
		return (t >>> 0) / 4294967296;
	};
}

/**
 * Random seeding tool to generate random seeding sequence that is able to be used.
 * This allows the random result always be the same when the seed is the same.
 * (This implementation is needed because dialog refreshes every frame, we have to generate garbled text that are the same.)
 * (Otherwise it will just keep flashing and changing the text.)
 *
 * @param {string} seed - The seed to generate random numbers.
 * @returns {() => number} - The function where it could be used to do PRNG magic.
 */
function randomSeeding(seed) {
	for (var i = 0, h = 1779033703 ^ seed.length; i < seed.length; i++) {
		h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
		h = h << 13 | h >>> 19;
	} return function() {
		h = Math.imul(h ^ (h >>> 16), 2246822507);
		h = Math.imul(h ^ (h >>> 13), 3266489909);
		return (h ^= h >>> 16) >>> 0;
	};
}

/**
 * Test if the current character parsed in is a Chinese character, and client user is using Chinese.
 * This is to prevent garbling Japanese kanji.
 * But for chatroom use case where two clients may have different languages
 * I don't have a definite solution yet, so let's do this for now to resolve the options not showing up first.
 * @param {string} character
 * @returns {boolean} - true if is Chinese character, false otherwise.
 */
function isChineseCharacter(character) {
	if (TranslationLanguage !== 'CN') return false;

	return chineseRegex.test(character);
}

/**
 * Get the character and determine if it is a Chinese character, if it does, do random garbling according to the gagLevel.
 * This is only a hotfix for the issue where Chinese characters are not displayed because they are not properly garbled,
 * when showing as options.
 *
 * @param {string} character - The character needs to be garbled.
 * @param {number} gagLevel - Gag level.
 *
 * @return {string} - The character that being garbled.
 */
function doChineseGarbling(character, gagLevel) {
	let garbleRandomChance;
	switch(gagLevel) {
		case 0:
			return character;
		case 1:
			garbleRandomChance = .8;
			break;
		// basically for Chinese, it is impossible to understand anything when have ball gags in the mouth.
		// It seems like ball gag is at like gagLevel 2, so I decided to heavily garble it start from here.
		case 2:
			garbleRandomChance = .55;
			break;
		case 3:
			garbleRandomChance = .5;
			break;
		case 4:
			garbleRandomChance = .45;
			break;
		case 5:
			garbleRandomChance = .4;
			break;
		case 6:
			garbleRandomChance = .35;
			break;
		case 7:
			garbleRandomChance = .3;
			break;
		case 8:
			garbleRandomChance = .25;
			break;
		case 9: case 10: case 11: case 12:
			garbleRandomChance = .2;
			break;
		default:
			garbleRandomChance = .1;
	}

	const seed = randomSeeding(character + garbleRandomChance.toString());
	const garbleDecision = sfc32(seed(), seed(), seed(), seed());

	return (garbleDecision() >= garbleRandomChance)
		? chineseRandomGarbledSound[Math.floor(garbleDecision() * chineseRandomGarbledSound.length)]
		: character;
}

/**
 * Return whether the passed character belongs to either the unicode Symbol, Punctuation or Separator category.
 * @param {string} character - The character needs to be checked.
 * @returns {boolean} - Whether the passed character is equivalent to one of aforementioned punctuation characters
 */
function isPunctuationOrSpace(character) {
	const punctionOrSpace = /\p{P}|\p{Z}|\p{S}/u;
	return punctionOrSpace.test(character);
}

/**
 * Helper method to strip diacritics from characters.
 * @param {string} character - character that needs to be stripped.
 * @param {Number} gagEffect - The current gag effect level.
 * @param {boolean} capitalize - Whether to returned character should be capitalized or not
 * @returns {string} - character that being stripped after garbling.
 */
function stripDiacriticsFromCharacter(character, gagEffect, capitalize) {
	switch (character) {
		case 'á':
		case 'à':
		case 'ã':
		case 'â':
			return capitalize ? "A" : "a";
		case 'é':
		case 'ê':
		case 'è':
		case 'ë':
			return capitalize ? "E" : "e";
		case 'í':
		case 'î':
		case 'ì':
		case 'ï':
			return capitalize ? "I" : "i";
		case 'ó':
		case 'ô':
		case 'ò':
		case 'õ':
			return capitalize ? "O" : "o";
		case 'ú':
		case 'û':
		case 'ù':
		case 'ü':
			return 'u';
		case 'ñ':
			if (gagEffect >= 5) {
				return capitalize ? "M" : "m";
			} else {
				return capitalize ? "N" : "n";
			}
		case 'ç':
			if (gagEffect >= 5) {
				return capitalize ? "H" : "h";
			} else {
				return capitalize ? "S" : "s";
			}
		default:
			return capitalize ? character.toUpperCase() : character;
	}
}

/**
 * check if the character is one of the following: áàãâéèêíìîõóòôúùûñç
 * @param {string} character - The character needs to be checked.
 * @returns {boolean} - true if is one of the above, otherwise false.
 */
function isAccentedOrLatinCharacter(character) {
	return 'áàãâéèêíìîõóòôúùûñç'.includes(character);
}

/**
 * Returns the index where the OOC part of a message starts as well as it's length.
 * Attention: Currently this function does not detect the end of OOC messages properly to mimic the old behaviour before it was introduced. So "length" ALWAYS ranges from the opening parenthesis to the end of the message!!!
 * @param {string} Message - The message to check
 * @returns {{ start: number, length: number }[]} Contains the starting position of each detected OOC section of Message (Without OOC section, this references past the end of Message); length - contains the length of the OOC section of Message
 */
function SpeechGetOOCRanges(Message) {
	let ranges = [];
	let startIndex = 0;
	let endIndex = -1;
	do
	{
		// Find the next opening bracket after the last closing bracket
		startIndex = Message.indexOf("(", endIndex+1);
		// If no opening bracket was found, there is no more OOC section and we stop
		if(startIndex < 0) { break; }

		// Find the next closing bracket after the last opening bracket
		endIndex = Message.indexOf(")", startIndex);
		// If no closing bracket was found, we use the last character of the string as end index
		if(endIndex < 0) { endIndex = Message.length - 1; }

		// Add the OOC range with start postition and length to the ranges list
		ranges.push({ start: startIndex, length: (endIndex - startIndex + 1) });
	}while(1);

	return ranges;
}

/**
 * Convenience function to check weither a character of a message is within the passed OOC range.
 * Attention: Currently this function does not detect the end of OOC messages properly to mimic the old behaviour before it was introduced. So "length" ALWAYS ranges from the opening parenthesis to the end of the message!!!
 * @param {number} index - The index of the character to check
 * @param {{ start: number, length: number }[]} oocRanges - The OOC Ranges to check
 * @returns {boolean} Returns true if the position passed in index is within a entry in oocRange
 */
function SpeechIndexInOocRange(index, oocRanges)
{
	for(let range of oocRanges)
	{
		if(index >= range.start && index < range.start + range.length) { return true; }
	}
	return false;
}

/**
 * Check if the gag garbling speech transform should apply
 * @param {Character} C
 * @returns {boolean}
 */
function SpeechTransformShouldGagGarble(C) {
	return SpeechTransformGagGarbleIntensity(C) > 0;
}

/**
 * Calculate the amount of gag garbling to apply
 *
 * @param {Character} C
 * @returns {number}
 */
function SpeechTransformGagGarbleIntensity(C) {
	let intensity = SpeechGetGagLevel(C, ["ItemMouth", "ItemMouth2", "ItemMouth3", "ItemHead", "ItemHood", "ItemNeck", "ItemDevices"]);
	intensity = intensity + InventoryCraftCount(C, "Large") * 2;
	intensity = intensity - InventoryCraftCount(C, "Small") * 2;
	return intensity;
}

/**
 * Calculate the amount of deafening to apply
 *
 * @param {Character} C
 * @returns {number}
 */
function SpeechTransformDeafenIntensity(C) {
	let intensity = SpeechTransformGagGarbleIntensity(C);

	if (Player.GetDeafLevel() >= 7) intensity = Math.max(intensity, 20);
	else if (Player.GetDeafLevel() >= 6) intensity = Math.max(intensity, 16);
	else if (Player.GetDeafLevel() >= 5) intensity = Math.max(intensity, 12);
	else if (Player.GetDeafLevel() >= 4) intensity = Math.max(intensity, 8);
	else if (Player.GetDeafLevel() >= 3) intensity = Math.max(intensity, 6);
	else if (Player.GetDeafLevel() >= 2) intensity = Math.max(intensity, 4);
	else if (Player.GetDeafLevel() >= 1) intensity = Math.max(intensity, 2);
	return intensity;
}

/**
 * The core of the speech garble function, usable without being tied to a specific character
 * @param {string} text - The string to transform
 * @param {number} intensity - The intensity of the transform
 * @param {boolean} ignoreOOC - Whether to apply over OOC or not
 * @returns {string}
 */
function SpeechTransformGagGarble(text, intensity, ignoreOOC = false) {
	// Variables to build the new string and check if we are in a parentheses
	let transformed = "";
	let inOOC = false;
	if (text == null) text = "";
	if (intensity === 0) return text;

	const oocRanges = SpeechGetOOCRanges(text);

	for (let L = 0; L < text.length; L++) {
		const HUnnormalized = text.charAt(L);
		const H = text.charAt(L).toLowerCase();
		const isCaps = HUnnormalized.toUpperCase() === HUnnormalized;
		inOOC = (!ignoreOOC && SpeechIndexInOocRange(L, oocRanges));

		/** @type {(str: string) => string} */
		const capitalize = isCaps ? (i) => i.toUpperCase() : (i) => i;

		// GagTotal4 always returns mmmmm and muffles some frequent letters entirely, 75% least frequent letters
		if (intensity >= 20) {
			if (inOOC) transformed += text.charAt(L);
			else {
				if (isPunctuationOrSpace(H)) transformed += H;
				else if ('zqjxkvbywgpfucdlhr'.includes(H)) transformed += ' ';
				else if (isChineseCharacter(H)) transformed += doChineseGarbling(H, intensity);
				else transformed += capitalize("m");
			}
		}

		// GagTotal3 always returns mmmmm and muffles some relatively frequent letters entirely, 50% least frequent letters
		else if (intensity >= 16) {
			if (inOOC) transformed += text.charAt(L);
			else {
				if (isPunctuationOrSpace(H)) transformed += H;
				else if ('zqjxkvbywgpf'.includes(H)) transformed += ' ';
				else if (isChineseCharacter(H)) transformed += doChineseGarbling(H, intensity);
				else transformed += capitalize("m");
			}
		}

		// GagTotal2 always returns mmmmm and muffles some less frequent letters entirely; 25% least frequent letters
		else if (intensity >= 12) {
			if (inOOC) transformed += text.charAt(L);
			else {
				if (isPunctuationOrSpace(H)) transformed += H;
				else if ('zqjxkv'.includes(H)) transformed += ' ';
				else if (isChineseCharacter(H)) transformed += doChineseGarbling(H, intensity);
				else transformed += capitalize("m");
			}
		}

		// Total gags always returns mmmmm
		else if (intensity >= 10) {
			if (inOOC) transformed += text.charAt(L);
			else {
				if (isPunctuationOrSpace(H)) transformed += H;
				else if (isChineseCharacter(H)) transformed += doChineseGarbling(H, intensity);
				else transformed += capitalize("m");
			}
		}

		// VeryHeavy garble - Close to no letter stays the same
		else if (intensity >= 8) {
			if (!inOOC) {

				// Regular characters
				if ('aeiouy'.includes(H)) transformed += capitalize("e");
				else if ('jklr'.includes(H)) transformed += capitalize("a");
				else if ('szh'.includes(H)) transformed += capitalize("h");
				else if ('dfgnmwtcqxpv'.includes(H)) transformed += capitalize("m");
				else if (isPunctuationOrSpace(H) || H == 'b') transformed += capitalize(H);

				// Accents/Latin characters
				else if (isAccentedOrLatinCharacter(H)) transformed += stripDiacriticsFromCharacter(H, intensity, isCaps);

				// Cyrillic characters
				else if ('аеиоуюля'.includes(H)) transformed += capitalize("e");
				else if ('сйх'.includes(H)) transformed += capitalize("к");
				else if ('жклру'.includes(H)) transformed += capitalize("a");
				else if ('зсгй'.includes(H)) transformed += capitalize("г");
				else if ('брвы'.includes(H)) transformed += capitalize("ф");
				else if ('дфгнм'.includes(H)) transformed += capitalize("м");
				else if (isChineseCharacter(H)) transformed += doChineseGarbling(H, intensity);

			} else transformed += text.charAt(L);
		}

		// Heavy garble - Almost no letter stays the same
		else if (intensity >= 7) {
			if (!inOOC) {

				// Regular characters
				if ('aeiouyt'.includes(H)) transformed += capitalize("e");
				else if ('cqx'.includes(H)) transformed += capitalize("k");
				else if ('jklrw'.includes(H)) transformed += capitalize("a");
				else if ('szh'.includes(H)) transformed += capitalize("h");
				else if ('bpv'.includes(H)) transformed += capitalize("f");
				else if ('dfgnm'.includes(H)) transformed += capitalize("m");
				else if (isPunctuationOrSpace(H)) transformed += H;

				// Accents/Latin characters
				else if (isAccentedOrLatinCharacter(H)) transformed += stripDiacriticsFromCharacter(H, intensity, isCaps);

				// Cyrillic characters
				else if ('аеиоуюля'.includes(H)) transformed += capitalize("e");
				else if ('сйх'.includes(H)) transformed += capitalize("к");
				else if ('жклру'.includes(H)) transformed += capitalize("a");
				else if ('зсгй'.includes(H)) transformed += capitalize("г");
				else if ('брвы'.includes(H)) transformed += capitalize("ф");
				else if ('дфгнм'.includes(H)) transformed += capitalize("м");
				else if (isChineseCharacter(H)) transformed += doChineseGarbling(H, intensity);

			} else transformed += text.charAt(L);
		}

		// Medium garble - Some letters stays the same
		else if (intensity >= 6) {
			if (!inOOC) {

				// Regular characters
				if ('eiouyt'.includes(H)) transformed += capitalize("e");
				else if ('cqxk'.includes(H)) transformed += capitalize("k");
				else if ('jlrwa'.includes(H)) transformed += capitalize("a");
				else if ('szh'.includes(H)) transformed += capitalize("h");
				else if ('bpv'.includes(H)) transformed += capitalize("f");
				else if ('dfgm'.includes(H)) transformed += capitalize("m");
				else if (isPunctuationOrSpace(H) || H == 'n') transformed += capitalize(H);

				// Accents/Latin characters
				else if (isAccentedOrLatinCharacter(H)) transformed += stripDiacriticsFromCharacter(H, intensity, isCaps);

				// Cyrillic characters
				else if ('аеиоуюля'.includes(H)) transformed += capitalize("e");
				else if ('сйх'.includes(H)) transformed += capitalize("к");
				else if ('жклру'.includes(H)) transformed += capitalize("a");
				else if ('зсгй'.includes(H)) transformed += capitalize("г");
				else if ('брвы'.includes(H)) transformed += capitalize("ф");
				else if ('дфгнм'.includes(H)) transformed += capitalize("м");
				else if (isChineseCharacter(H)) transformed += doChineseGarbling(H, intensity);

			} else transformed += text.charAt(L);
		}

		// Normal garble, keep vowels and a few letters the same
		else if (intensity >= 5) {
			if (!inOOC) {

				// Regular characters
				if ('vbct'.includes(H)) transformed += capitalize("e");
				else if ('qkx'.includes(H)) transformed += capitalize("k");
				else if ('wyjlr'.includes(H)) transformed += capitalize("a");
				else if ('sz'.includes(H)) transformed += capitalize("h");
				else if ('df'.includes(H)) transformed += capitalize("m");
				else if (H == "p") transformed += capitalize("f");
				else if (H == "g") transformed += capitalize("n");
				else if (isPunctuationOrSpace(H) || 'aeioumnh'.includes(H)) transformed += capitalize(H);

				// Accents/Latin characters
				else if (isAccentedOrLatinCharacter(H)) transformed += stripDiacriticsFromCharacter(H, intensity, isCaps);

				// Cyrillic characters
				else if ('вфбп'.includes(H)) transformed += capitalize("фы");
				else if ('гкх'.includes(H)) transformed += capitalize("к");
				else if ('вужлр'.includes(H)) transformed += capitalize("а");
				else if ('ся'.includes(H)) transformed += capitalize("х");
				else if ('дф'.includes(H)) transformed += capitalize("м");
				else if (H == "р") transformed += capitalize("ф");
				else if (H == "г") transformed += capitalize("н");
				else if (isChineseCharacter(H)) transformed += doChineseGarbling(H, intensity);

			} else transformed += text.charAt(L);
		}

		// Easy garble, keep vowels and a some letters the same
		else if (intensity >= 4) {
			if (!inOOC) {

				// Regular characters
				if ('vbct'.includes(H)) transformed += capitalize("e");
				else if ('qkx'.includes(H)) transformed += capitalize("k");
				else if ('wyjlr'.includes(H)) transformed += capitalize("a");
				else if ('sz'.includes(H)) transformed += capitalize("s");
				else if (H == "d") transformed += capitalize("m");
				else if (H == "p") transformed += capitalize("f");
				else if (H == "g") transformed += capitalize("h");
				else if (isPunctuationOrSpace(H) || 'aeioumnhf'.includes(H)) transformed += capitalize(H);

				// Accents/Latin characters
				else if (isAccentedOrLatinCharacter(H)) transformed += stripDiacriticsFromCharacter(H, intensity, isCaps);

				// Cyrillic characters
				if ('вфбп'.includes(H)) transformed += capitalize("фы");
				else if ('гкх'.includes(H)) transformed += capitalize("к");
				else if ('вужлр'.includes(H)) transformed += capitalize("а");
				else if ('ся'.includes(H)) transformed += capitalize("х");
				else if ('дф'.includes(H)) transformed += capitalize("м");
				else if (H == "р") transformed += capitalize("ф");
				else if (H == "г") transformed += capitalize("н");
				else if (isChineseCharacter(H)) transformed += doChineseGarbling(H, intensity);

			} else transformed += text.charAt(L);
		}

		// Light garble, half of the letters stay the same
		else if (intensity >= 3) {
			if (!inOOC) {

				// Regular characters
				if ('ct'.includes(H)) transformed += capitalize("e");
				else if ('qkx'.includes(H)) transformed += capitalize("k");
				else if ('jlr'.includes(H)) transformed += capitalize("a");
				else if (H == "s") transformed += capitalize("z");
				else if (H == "z") transformed += capitalize("s");
				else if (H == "f") transformed += capitalize("h");
				else if ('dmg'.includes(H)) transformed += capitalize("m");
				else if ('bhnvwpaeiouy'.includes(H) || isPunctuationOrSpace(H)) transformed += capitalize(H);

				// Accents/Latin characters
				else if (isAccentedOrLatinCharacter(H)) transformed += stripDiacriticsFromCharacter(H, intensity, isCaps);

				// Cyrillic characters
				else if ('чц'.includes(H)) transformed += capitalize("e");
				else if ('йфв'.includes(H)) transformed += capitalize("к");
				else if ('длщя'.includes(H)) transformed += capitalize("a");
				else if (H == "з") transformed += capitalize("c");
				else if (H == "с") transformed += capitalize("з");
				else if ('дфмг'.includes(H)) transformed += capitalize("м");
				else if ('апрокенмит'.includes(H)) transformed += capitalize(H);
				else if (isChineseCharacter(H)) transformed += doChineseGarbling(H, intensity);

			} else transformed += text.charAt(L);
		}

		// Very Light garble, most of the letters stay the same
		else if (intensity >= 2) {
			if (!inOOC) {

				// Regular characters
				if (H == "t") transformed += 'e';
				else if ('cqkx'.includes(H)) transformed += capitalize("k");
				else if ('jlr'.includes(H)) transformed += capitalize("a");
				else if ('dmg'.includes(H)) transformed += capitalize("m");
				else if ('bhnvwp'.includes(H) || isPunctuationOrSpace(H) || 'aeiouyfsz'.includes(H)) transformed += capitalize(H);

				// Accents/Latin characters
				else if (isAccentedOrLatinCharacter(H)) transformed += stripDiacriticsFromCharacter(H, intensity, isCaps);

				// Cyrillic characters
				else if ('чц'.includes(H)) transformed += capitalize("e");
				else if ('йфв'.includes(H)) transformed += capitalize("к");
				else if ('длщя'.includes(H)) transformed += capitalize("a");
				else if (H == "з") transformed += capitalize("c");
				else if (H == "с") transformed += capitalize("з");
				else if ('дфмг'.includes(H)) transformed += capitalize("м");
				else if ('апрокенмит'.includes(H)) transformed += capitalize(H);
				else if (isChineseCharacter(H)) transformed += doChineseGarbling(H, intensity);

			} else transformed += text.charAt(L);
		}

		// Almost no garble, only some letters change
		else if (intensity >= 1) {
			if (!inOOC) {

				// Regular characters
				if (H == "t") transformed += 'h';
				else if ('cqkx'.includes(H)) transformed += capitalize("k");
				else if ('dmg'.includes(H)) transformed += capitalize("m");
				else if ('bhnvwpaeiouyfszjlr'.includes(H) || isPunctuationOrSpace(H)) transformed += capitalize(H);

				// Accents/Latin characters
				else if (isAccentedOrLatinCharacter(H)) transformed += stripDiacriticsFromCharacter(H, intensity, isCaps);

				// Cyrillic characters
				else if ('чц'.includes(H)) transformed += capitalize("e");
				else if ('йфв'.includes(H)) transformed += capitalize("к");
				else if ('длщя'.includes(H)) transformed += capitalize("a");
				else if (H == "з") transformed += capitalize("c");
				else if (H == "с") transformed += capitalize("з");
				else if ('дфмг'.includes(H)) transformed += capitalize("м");
				else if ('апрокенмит'.includes(H)) transformed += capitalize(H);
				else if (isChineseCharacter(H)) transformed += doChineseGarbling(H, intensity);

			} else transformed += text.charAt(L);
		}
	}

	return transformed;
}

/**
 * The core of the speech garble function, usable without being tied to a specific character
 * @deprecated
 * @param {number} GagEffect - The gag level of the speech
 * @param {string} CD - The character's dialog to alter
 * @param {boolean} IgnoreOOC
 * @return {string} - Garbled text
 */
function SpeechGarbleByGagLevel(GagEffect, CD, IgnoreOOC=false) {
	return SpeechTransformGagGarble(CD, GagEffect, IgnoreOOC);
}

/**
 * Check if the stutter talk speech transform should apply
 * @param {Character} C
 * @returns {boolean}
 */
function SpeechTransformShouldStutter(C) {
	return SpeechTransformStutterIntensity(C) > 0;
}

/**
 * Calculate the intensity of the stuttering effect
 * @param {Character} C
 * @returns {number}
 */
function SpeechTransformStutterIntensity(C) {
	const arousalProgress = CommonIsNumeric(C.ArousalSettings?.Progress) ? C.ArousalSettings?.Progress : 0;
	const stutterMode = C.ArousalSettings?.AffectStutter;
	// Validates that the preferences allow stuttering
	if (!C.ArousalSettings || stutterMode === "None") return 0;

	// Gets the factor from current arousal
	let intensity = 0;
	if (stutterMode === "Arousal" || stutterMode === "All") {
		intensity = Math.floor(arousalProgress / 20);
	}

	// Checks all items that "eggs" with an intensity, and replaces the factor if it's higher
	if (C.IsEgged() && (stutterMode === "Vibration" || stutterMode === "All")) {
		for (let item of C.Appearance) {
			if (!InventoryItemHasEffect(item, "Egged", true)) continue;
			const itemIntensity = InventoryGetItemProperty(item, "Intensity");
			if (itemIntensity <= intensity) continue;
			intensity = item.Property.Intensity;
		}
	}
	return intensity;
}

/**
 * Transform a string to add a stuttering effect
 * @param {string} text
 * @param {number} intensity
 * @returns {string}
 */
function SpeechTransformStutter(text, intensity) {
	if (typeof text !== "string") text = "";

	let inOOC = false;
	let inWord = 1;
	let seed = text.length;
	const oocRanges = SpeechGetOOCRanges(text);
	// Loops in all letters to create a stuttering effect
	for (let L = 0; L < text.length; L++) {

		// Do not stutter the letters between parentheses
		const char = text.charAt(L).toLowerCase();
		inOOC = SpeechIndexInOocRange(L, oocRanges);

		// If we are not between brackets and at the start of a word, there's a chance to stutter that word
		if (!inOOC && inWord >= 0 && (char.match(/[[a-zа-яё]/i))) {

			// Generate a pseudo-random number using a seed, so that the same text always stutters the same way
			let R = Math.sin(seed++) * 10000;
			R = R - Math.floor(R);
			R = Math.floor(R * 10) + intensity;
			if (inWord == 1 || R >= 10) {
				text = text.substring(0, L) + text.charAt(L) + "-" + text.substring(L, text.length);
				L += 2;
			}
			inWord = -1;
		}

		if (char === " ") inWord = 0;
	}

	return text;
}

/**
 * Makes the character stutter if she has a vibrating item and/or is aroused. Stuttering based on arousal is toggled in the character's settings.
 * @deprecated
 * @param {Character} C - The character, whose dialog might need to be altered
 * @param {string} CD - The character's dialog to alter
 * @returns {string} - Returns the dialog after the stuttering factor was applied
 */
function SpeechStutter(C, CD) {
	const Factor = SpeechTransformStutterIntensity(C);
	if (Factor === 0) return CD;

	return SpeechTransformStutter(CD, Factor);
}

/**
 * Check if the baby talk string transform effect should apply
 * @param {Character} C
 */
function SpeechTransformShouldBabyTalk(C) {
	return C.HasEffect("RegressedTalk");
}

/**
 * Transform a string to add a baby talk effect
 *
 * @param {string} text
 * @returns {string}
 */
function SpeechTransformBabyTalk(text) {
	if (typeof text !== "string") text = "";

	let inOOC = false;
	let transformed = "";
	const oocRanges = SpeechGetOOCRanges(text);
	for (let charIdx = 0; charIdx < text.length; charIdx++) {
		var char = text.charAt(charIdx).toLowerCase();
		inOOC = SpeechIndexInOocRange(charIdx, oocRanges);
		if (inOOC) {
			transformed += text.charAt(charIdx);
			continue;
		}

		if ('kl'.includes(char)) transformed += 'w';
		else if (char == "s") transformed += 'sh';
		else if (char == "t") transformed += 'th';
		else if (isPunctuationOrSpace(char) || char.match('[a-z]')) transformed += char;
		// Let's do light Chinese garbling for now for ABDL.
		else if (isChineseCharacter(char)) transformed += doChineseGarbling(char, 1);
	}
	return transformed;
}

/**
 * Makes the character talk like a Baby when she has drunk regression milk
 * @deprecated
 * @param {Character} C - The character, whose dialog needs to be altered
 * @param {string} CD - The character's dialog to alter
 * @returns {string} - Returns the dialog after baby talk was applied
 */
function SpeechBabyTalk(C, CD) {
	// Not drunk the milk, we return the regular text
	if (!SpeechTransformShouldBabyTalk(C)) return CD;

	return SpeechTransformBabyTalk(CD);
}

/**
 * Anonymize character names from a string, replacing them with "Someone".
 *
 * Used as part of sensory-deprivation processing.
 *
 * @param {string} msg
 * @param {readonly Character[]} characters
 */
function SpeechAnonymize(msg, characters) {
	const names = [];
	for (const C of characters) {
		if (!ChatRoomIsCharacterImpactedBySensoryDeprivation(C)) continue;
		names.push(C.Name);

		const nick = CharacterNickname(C);
		if (nick && nick !== C.Name) {
			names.push(nick);
		}
	}

	if (names.length === 0) return msg;

	names.sort((a, b) => b.length - a.length);

	// Hopefully there are no regex characters to escape from that pattern :-S
	const reg = new RegExp(`\\b(?:${names.join("|")})\\b`, "g");

	// Now replace with the placeholder, lowercasing if it's not the first thing in the string
	const replacement = InterfaceTextGet("Someone");
	function replacer(_match, offset, _string, _groups) {
		return offset === 0 ? replacement : replacement.toLowerCase();
	}
	msg = msg.replace(reg, replacer);

	return msg;
}
