"use strict";

const PreferenceSubscreenAudioIDs = {
	grid: "preference-audio-grid"
};

function PreferenceSubscreenAudioLoad() {
	const ranges = /** @type {const} */ (["Volume", "MusicVolume"]);
	const checkboxes = /** @type {const} */ (["PlayItem", "PlayItemPlayerOnly", "Notifications"]);

	const rangeElements = ranges.map(setting => {
		const settingValue = Player.AudioSettings[setting];
		const range = ElementCreateRangeInput(`preferences-${setting}`, settingValue * 100, 0, 100, 1);
		const labelText = TextGet(setting);

		range.addEventListener("input", (ev) => {
			const value = parseInt(/** @type {HTMLInputElement} */ (ev.target).value);
			Player.AudioSettings[setting] = value / 100;
			const e = ElementWrap(`preferences-${setting}-value`);
			if (e) e.textContent = `${value}%`;
		});

		if (setting === "MusicVolume") {
			range.addEventListener("input", () => {
				AudioBackgroundMusicSetVolume(Player.AudioSettings.MusicVolume);
			});
		}

		return ElementCreate({
			tag: "div",
			classList: ["preference-settings-range"],
			attributes: { id: `preferences-${setting}` },
			children: [{
				tag: "label",
				attributes: {
					id: `preferences-${setting}-label`,
					for: `preferences-${setting}`
				},
				children: [
					`${labelText}:`
				]
			},
			range,
			{
				tag: "span",
				attributes: {
					id: `preferences-${setting}-value`,
				},
				children: [
					`${settingValue * 100}%`
				]
			}
			]
		});
	});

	const checkboxElements = checkboxes.map(setting => {
		return ElementCheckbox.CreateLabelled(`preferences-${setting}`, TextGet(`Audio${setting}`), (ev) => {
			Player.AudioSettings[setting] = /** @type {HTMLInputElement} */ (ev.target).checked;
		},
		{
			checked: Player.AudioSettings[setting],
		});
	});

	const grid = ElementCreate({
		tag: "div",
		classList: ["preference-settings-grid", "scroll-box"],
		attributes: { id: PreferenceSubscreenAudioIDs.grid },
		children: [
			...rangeElements,
			...checkboxElements
		]
	});

	ElementWrap(PreferenceIDs.subscreen)?.append(grid);
}

/**
 * Sets the audio preferences for the player. Redirected to from the main Run function if the player is in the audio
 * settings subscreen
 * @returns {void} - Nothing
 */
function PreferenceSubscreenAudioRun() {
	DrawCharacter(Player, 50, 50, 0.9);
}

/**
 * Handles click events for the audio preference settings.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenAudioClick() {
}

/**
 * Exits the preference screen.
 */
function PreferenceSubscreenAudioExit() {
	return true;
}

function PreferenceSubscreenAudioUnload() {
	// If audio has been disabled for notifications, disable each individual notification audio setting
	if (!Player.AudioSettings.Notifications) {
		for (const setting of CommonKeys(Player.NotificationSettings)) {
			let audio = Player.NotificationSettings[setting]?.Audio;
			if (typeof audio === 'number' && audio > 0) Player.NotificationSettings[setting].Audio = NotificationAudioType.NONE;
		}
	}
}

/** @type {ScreenResizeHandler} */
function PreferenceSubscreenAudioResize(onLoad) {
	const { x, y } = PreferenceSubscreenMainGrid;
	ElementSetPosition(PreferenceSubscreenAudioIDs.grid, x, y);
}
