"use strict";

/** @type { "Description" | "OwnersNotes" } */
var OnlineProfileMode = "Description";
var OnlineProfileText_Desc = "";
var OnlineProfileText_ON = "";  // Owner's notes
var OnlineProfileText_ONAvailable = false;

const OnlineProfileText_MaxLen_Desc = 10000;
const OnlineProfileText_MaxLen_ON = 4000;

var OnlineProfileBackground = "Sheet";

/**
 * Leading character used to signal that description is compressed
 * @readonly
 */
const ONLINE_PROFILE_DESCRIPTION_COMPRESSION_MAGIC = String.fromCharCode(9580);

/**
 * Setup OnlineProfile UI in a specific mode.
 *
 * @param {"Description" | "OwnersNotes"} mode - Initial display mode.
 * @returns {void}
 */
function OnlineProfileStart(mode) {
	OnlineProfileMode = mode;
	CommonSetScreen("Character", "OnlineProfile");
}

/**
 * Loads the text element based on current viewing/editing mode.
 * @param {HTMLInputElement} element
 * @returns {void}
 */
function OnlineProfileLoadTextArea(element) {
	switch (OnlineProfileMode) {
	case "OwnersNotes":
		/*  Editable only by this player's owner.  */
		element.toggleAttribute("readonly", !(InformationSheetSelection.IsOnline() && InformationSheetSelection.IsFullyOwnedByPlayer()));
		element.setAttribute("maxlength", OnlineProfileText_MaxLen_ON);
		element.value = OnlineProfileText_ON;
		break;

	case "Description":
	default:
		/*  Editable by player.  */
		element.toggleAttribute("readonly", !InformationSheetSelection.IsPlayer());
		element.setAttribute("maxlength", OnlineProfileText_MaxLen_Desc);
		element.value = OnlineProfileText_Desc;
		break;
	}
}

/**
 * Loads the online profile screen by creating its input
 * @type {ScreenLoadHandler}
 */
async function OnlineProfileLoad() {
	OnlineProfileText_Desc = typeof InformationSheetSelection.Description === "string"  ? InformationSheetSelection.Description : "";
	OnlineProfileText_ON = typeof InformationSheetSelection.Ownership?.Notes === "string"  ? InformationSheetSelection.Ownership.Notes : "";
	OnlineProfileText_ONAvailable = InformationSheetSelection.IsFullyOwnedByPlayer() || OnlineProfileText_ON != "";

	ElementRemove("DescriptionInput");
	ElementCreateTextArea("DescriptionInput");
	const DescriptionInput = /** @type {HTMLInputElement} */ (document.getElementById("DescriptionInput"));

	OnlineProfileLoadTextArea(DescriptionInput);
}

/**
 * Handles unloading the online profile screen
 * @returns {void}
 */
function OnlineProfileUnload() {
	ElementRemove("DescriptionInput");
	OnlineProfileText_Desc = "";
	OnlineProfileText_ON = "";
	OnlineProfileMode = "Description";
}

/**
 * Runs and draws the online profile screen
 * @returns {void} - Nothing
 */
function OnlineProfileRun() {
	// Sets the screen controls
	let legend = "";
	let maxlen = 0;
	if (OnlineProfileMode == "Description") {
		legend = TextGet(InformationSheetSelection.IsPlayer() ? "EnterDescription" : "ViewDescription");
		maxlen = OnlineProfileText_MaxLen_Desc;
	} else {
		legend = TextGet(InformationSheetSelection.IsFullyOwnedByPlayer() ? "EnterOwnersNotes" : "ViewOwnersNotes")
		       .replace("OwnerName", InformationSheetSelection.OwnerName());
		maxlen = OnlineProfileText_MaxLen_ON;
	}
	legend = legend.replace("CharacterName", CharacterNickname(InformationSheetSelection))
	               .replace("MAXLEN", maxlen.toString());
	DrawText(legend, 910, 105, "Black", "Gray");

	ElementPositionFix("DescriptionInput", 36, 100, 160, 1790, 750);

	if (OnlineProfileText_ONAvailable) {
		const buttoncolor = OnlineProfileMode == "OwnersNotes" ? "Red" : "White";
		DrawButton(1620, 60, 90, 90, "", buttoncolor, "Icons/Management.png", TextGet("OwnersNotes"));
	}

	if ((OnlineProfileMode == "Description" && InformationSheetSelection.IsPlayer())
		|| (OnlineProfileMode == "OwnersNotes" && InformationSheetSelection.IsFullyOwnedByPlayer()))
	{
		DrawButton(1720, 60, 90, 90, "", "White", "Icons/Accept.png", TextGet("LeaveSave"));
		DrawButton(1820, 60, 90, 90, "", "White", "Icons/Cancel.png", TextGet("LeaveNoSave"));
	} else {
		DrawButton(1820, 60, 90, 90, "", "White", "Icons/Exit.png", TextGet("Leave"));
	}
}

/**
 * Handles clicks in the online profile screen
 * @returns {void} - Nothing
 */
function OnlineProfileClick() {
	if (OnlineProfileText_ONAvailable && MouseIn(1620, 60, 90, 90)) {
		/*  Toggle between Description and Owner's Notes.  */
		const ev = ElementValue("DescriptionInput").trim();
		if (OnlineProfileMode == "Description") {
			OnlineProfileText_Desc = ev.slice(0, OnlineProfileText_MaxLen_Desc);
			OnlineProfileMode = "OwnersNotes";
		} else {
			OnlineProfileText_ON = ev.slice(0, OnlineProfileText_MaxLen_ON);
			OnlineProfileMode = "Description";
		}
		OnlineProfileLoadTextArea(/** @type {HTMLInputElement} */ (document.getElementById("DescriptionInput")));
	}
	if (MouseIn(1720, 60, 90, 90)
		&& (   (OnlineProfileMode == "Description" && InformationSheetSelection.IsPlayer())
	            || (OnlineProfileMode == "OwnersNotes" && InformationSheetSelection.IsFullyOwnedByPlayer())))
	{
		OnlineProfileExit(true);
	}
	if (MouseIn(1820, 60, 90, 90)) OnlineProfileExit(false);
}

/**
 * Handles exiting while in the online profile screen. It removes the input and saves the description.
 * @param {boolean} Save - Whether or not we should save the changes
 * @returns {void} - Nothing
 */
function OnlineProfileExit(Save) {
	if (Save) {
		const ev = ElementValue("DescriptionInput").trim();
		if (OnlineProfileMode == "Description") {
			OnlineProfileText_Desc = ev.slice(0, OnlineProfileText_MaxLen_Desc);
		} else {
			OnlineProfileText_ON = ev.slice(0, OnlineProfileText_MaxLen_ON);
		}

		// If the current character is the player, we update the description
		if (InformationSheetSelection.Description != OnlineProfileText_Desc && InformationSheetSelection.IsPlayer()) {
			InformationSheetSelection.Description = OnlineProfileText_Desc;
			let Description = OnlineProfileText_Desc;
			const comp_val = ONLINE_PROFILE_DESCRIPTION_COMPRESSION_MAGIC + LZString.compressToUTF16(Description);
			if (comp_val.length < Description.length || Description.startsWith(ONLINE_PROFILE_DESCRIPTION_COMPRESSION_MAGIC)) {
				Description = comp_val;
			}
			ServerAccountUpdate.QueueData({ Description });
		}

		CharacterSetOwnersNotes(InformationSheetSelection, OnlineProfileText_ON);
	}
	CommonSetScreen("Character", "InformationSheet");
}
