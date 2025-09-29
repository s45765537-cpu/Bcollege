"use strict";

/** @type {boolean} */
var PreferenceSubscreenGeneralColorPicker = false;
var PreferenceSafewordConfirm = false;

/**
 * Loads the Preferences screen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGeneralLoad() {
	ElementCreateInput("InputCharacterLabelColor", "text", Player.LabelColor);
}

/**
 * Handles click events in the preference screen that are propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGeneralRun() {
	DrawCharacter(Player, 50, 50, 0.9);

	// Draw the online preferences
	MainCanvas.textAlign = "left";
	if (PreferenceMessage != "") DrawText(TextGet(PreferenceMessage), 920, 125, "Red", "Black");
	DrawText(TextGet("CharacterLabelColor"), 500, 225, "Black", "Gray");
	ElementPosition("InputCharacterLabelColor", 990, 212, 250);

	let TextColorCSS = "";
	if (CommonIsColor(ElementValue("InputCharacterLabelColor"))) TextColorCSS = ElementValue("InputCharacterLabelColor");
	else TextColorCSS = Player.LabelColor;
	document.getElementById("InputCharacterLabelColor").style.color = TextColorCSS;
	let TextColorHSV = ColorPickerCSSToHSV(TextColorCSS);
	if (TextColorHSV.V > 0.4) {
		document.getElementById("InputCharacterLabelColor").style.backgroundColor = "#111111";
	} else{
		document.getElementById("InputCharacterLabelColor").style.backgroundColor = "#FFFFFF";
	}

	DrawButton(1140, 187, 65, 65, "", "White", "Icons/Color.png");
	DrawButton(500, 280, 90, 90, "", "White", "Icons/Next.png");
	DrawText(TextGet("AllowedInteractions") + " " + TextGet("AllowedInteraction" + Player.AllowedInteractions.toString()), 615, 325, "Black", "Gray");

	// Checkboxes (Some are not available when playing on Hardcore or Extreme)
	DrawCheckbox(500, 402, 64, 64, TextGet("ForceFullHeight"), Player.VisualSettings.ForceFullHeight);
	DrawCheckbox(500, 482, 64, 64, TextGet("DisablePickingLocksOnSelf"), Player.OnlineSharedSettings.DisablePickingLocksOnSelf);
	const onHighDifficulty = Player.GetDifficulty() >= Difficulty.HARDCORE;
	DrawCheckbox(500, 722, 64, 64, TextGet(PreferenceSafewordConfirm ? "ConfirmSafeword" : "EnableSafeword"), Player.GameplaySettings.EnableSafeword, onHighDifficulty);
	DrawCheckbox(500, 562, 64, 64, TextGet("DisableAutoMaid"), !Player.GameplaySettings.DisableAutoMaid, onHighDifficulty);
	DrawCheckbox(500, 642, 64, 64, TextGet("OfflineLockedRestrained"), Player.GameplaySettings.OfflineLockedRestrained, onHighDifficulty);
	if (onHighDifficulty) DrawTextWrap(TextGet("GeneralHardcoreWarning"), 1225, 622, 450, 100, "Red");
	DrawCheckbox(500, 802, 64, 64, TextGet("ItemsAffectExpressions"), Player.OnlineSharedSettings.ItemsAffectExpressions);

	if (PreferenceSubscreenGeneralColorPicker)
		ColorPickerDraw(1250, 185, 675, 800, /** @type {HTMLInputElement} */(document.getElementById("InputCharacterLabelColor")));
	else
		ColorPickerHide();

	MainCanvas.textAlign = "center";
}

/**
 * Handles the click events in the preference screen, general sub-screen, propagated from CommonClick()
 * @returns {void} - Nothing
 */
function PreferenceSubscreenGeneralClick() {

	// If we must change the restrain permission level
	if (MouseIn(500, 280, 90, 90)) {
		Player.AllowedInteractions++;
		if (Player.AllowedInteractions > AllowedInteractions.OwnerOnly) Player.AllowedInteractions = AllowedInteractions.Everyone;
		if (Player.GetDifficulty() >= Difficulty.EXTREME) LoginExtremeItemSettings(Player.AllowedInteractions === AllowedInteractions.Everyone);
	}

	// If we must show/hide/use the color picker
	if (MouseIn(1140, 187, 65, 65)) PreferenceSubscreenGeneralColorPicker = !PreferenceSubscreenGeneralColorPicker;

	// Preference check boxes
	if (MouseIn(500, 402, 64, 64)) Player.VisualSettings.ForceFullHeight = !Player.VisualSettings.ForceFullHeight;
	if (MouseIn(500, 482, 64, 64) ) Player.OnlineSharedSettings.DisablePickingLocksOnSelf = !Player.OnlineSharedSettings.DisablePickingLocksOnSelf;
	if (MouseIn(500, 722, 64, 64) && (Player.GetDifficulty() < Difficulty.HARDCORE)) {
		if (!Player.GameplaySettings.EnableSafeword && !Player.IsRestrained() && !Player.IsChaste()) {
			if (PreferenceSafewordConfirm) {
				Player.GameplaySettings.EnableSafeword = true;
				PreferenceSafewordConfirm = false;
			} else PreferenceSafewordConfirm = true;
		} else if (Player.GameplaySettings.EnableSafeword) {
			if (PreferenceSafewordConfirm) {
				Player.GameplaySettings.EnableSafeword = false;
				PreferenceSafewordConfirm = false;
			} else PreferenceSafewordConfirm = true;
		}
	} else PreferenceSafewordConfirm = false;
	if (MouseIn(500, 562, 64, 64) && (Player.GetDifficulty() < Difficulty.HARDCORE)) Player.GameplaySettings.DisableAutoMaid = !Player.GameplaySettings.DisableAutoMaid;
	if (MouseIn(500, 642, 64, 64) && (Player.GetDifficulty() < Difficulty.HARDCORE)) Player.GameplaySettings.OfflineLockedRestrained = !Player.GameplaySettings.OfflineLockedRestrained;
	if (MouseIn(500, 802, 64, 64)) Player.OnlineSharedSettings.ItemsAffectExpressions = !Player.OnlineSharedSettings.ItemsAffectExpressions;
}

/**
 * Exits the preference screen. Block exit when the color picker is active.
 * @returns {boolean} - Returns false if the color picker is active and input is not valid
 */
function PreferenceSubscreenGeneralExit() {
	if (PreferenceSubscreenGeneralColorPicker) {
		PreferenceSubscreenGeneralColorPicker = false;
		return false;
	}

	const color = ElementValue("InputCharacterLabelColor");
	if (!CommonIsColor(color)) {
		PreferenceMessage = "ErrorInvalidColor";
		return false;
	}

	return true;
}

/**
 * Cleans up elements that are not needed anymore
 * If the selected color is invalid, the player cannot leave the screen.
 */
function PreferenceSubscreenGeneralUnload() {
	const color = ElementValue("InputCharacterLabelColor");
	if (CommonIsColor(color)) {
		if (color !== Player.LabelColor) {
			Player.LabelColor = color;
			const elems = /** @type {HTMLElement[]} */(Array.from(document.querySelectorAll(`[style*="--label-color"][data-sender="${Player.MemberNumber}"]`)));
			elems.forEach(e => e.style.setProperty("--label-color", color));
		}
	}
	PreferenceMessage = "";
	ElementRemove("InputCharacterLabelColor");
}

