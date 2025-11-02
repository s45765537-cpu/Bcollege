"use strict";

/** @type { "Description" | "OwnersNotes" } */
var OnlineProfileMode = "Description";
var OnlineProfileText_Desc = "";
var OnlineProfileText_ON = "";  // Owner's notes
var OnlineProfileText_ONAvailable = false;

var OnlineProfileBackground = "Sheet";

/**
 * Leading character used to signal that description is compressed
 * @readonly
 */
const ONLINE_PROFILE_DESCRIPTION_COMPRESSION_MAGIC = String.fromCharCode(9580);


/**
 * Loads the text element based on current viewing/editing mode.
 * @param {HTMLInputElement} element
 */
function OnlineProfileLoadTextArea (element) {
	switch (OnlineProfileMode) {
	case "OwnersNotes":
		element.value = OnlineProfileText_ON;
		if (InformationSheetSelection.IsOnline()  &&  InformationSheetSelection.IsFullyOwnedByPlayer()) {
			/*  Editable only by this player's owner.  */
			element.removeAttribute ("readonly");
		} else {
			element.setAttribute ("readonly", "readonly");
		}
		break;

	case "Description":
	default:
		element.value = OnlineProfileText_Desc;
		if (InformationSheetSelection.IsPlayer()) {
			/*  Editable by player.  */
			element.removeAttribute ("readonly");
		} else {
			element.setAttribute ("readonly", "readonly");
		}
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
	OnlineProfileText_ONAvailable = InformationSheetSelection.IsFullyOwnedByPlayer()  ||  OnlineProfileText_ON != "";

	ElementRemove("DescriptionInput");
	ElementCreateTextArea("DescriptionInput");
	const DescriptionInput = /** @type {HTMLInputElement} */ (document.getElementById("DescriptionInput"));
	DescriptionInput.setAttribute("maxlength", 10000);

	OnlineProfileLoadTextArea (DescriptionInput);
}

/**
 * Handles unloading the online profile screen
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
	if (OnlineProfileMode == "Description") {
		legend = TextGet (InformationSheetSelection.IsPlayer() ? "EnterDescription" : "ViewDescription");
	} else {
		legend = TextGet (InformationSheetSelection.IsFullyOwnedByPlayer() ? "EnterOwnersNotes" : "ViewOwnersNotes")
		       .replace ("OwnerName", InformationSheetSelection.OwnerName());
	}
	legend = legend.replace ("CharacterName", CharacterNickname (InformationSheetSelection));
	DrawText (legend, 910, 105, "Black", "Gray");

	ElementPositionFix("DescriptionInput", 36, 100, 160, 1790, 750);

	if (OnlineProfileText_ONAvailable) {
		const buttoncolor = OnlineProfileMode == "OwnersNotes" ? "Red" : "White";
		DrawButton(1620, 60, 90, 90, "", buttoncolor, "Icons/Management.png", TextGet ("OwnersNotes"));
	}

	if (    (OnlineProfileMode == "Description"  &&  InformationSheetSelection.IsPlayer())
	    ||  (OnlineProfileMode == "OwnersNotes"  &&  InformationSheetSelection.IsFullyOwnedByPlayer()))
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
	if (OnlineProfileText_ONAvailable  &&  MouseIn (1620, 60, 90, 90)) {
		/*  Toggle between Description and Owner's Notes.  */
		if (OnlineProfileMode == "Description") {
			OnlineProfileText_Desc = ElementValue ("DescriptionInput").trim().slice (0, 10000);
			OnlineProfileMode = "OwnersNotes";
		} else {
			OnlineProfileText_ON = ElementValue ("DescriptionInput").trim().slice (0, 10000);
			OnlineProfileMode = "Description";
		}
		OnlineProfileLoadTextArea (/** @type {HTMLInputElement} */ (document.getElementById ("DescriptionInput")));
	}
	if (    MouseIn(1720, 60, 90, 90)
	    &&  (    (OnlineProfileMode == "Description"  &&  InformationSheetSelection.IsPlayer())
	         ||  (OnlineProfileMode == "OwnersNotes"  &&  InformationSheetSelection.IsFullyOwnedByPlayer())))
	{
		OnlineProfileExit (true);
	}
	if (MouseIn(1820, 60, 90, 90)) OnlineProfileExit(false);
}

/**
 * Handles exiting while in the online profile screen. It removes the input and saves the description.
 * @param {boolean} Save - Whether or not we should save the changes
 * @returns {void} - Nothing
 */
function OnlineProfileExit (Save) {
	const ev = ElementValue ("DescriptionInput").trim().slice (0, 10000);
	if (OnlineProfileMode == "Description") {
		OnlineProfileText_Desc = ev;
	} else {
		OnlineProfileText_ON = ev;
	}

	if (Save) {
		// If the current character is the player, we update the description
		if (InformationSheetSelection.Description != OnlineProfileText_Desc  &&  InformationSheetSelection.IsPlayer()) {
			InformationSheetSelection.Description = OnlineProfileText_Desc;
			let Description = OnlineProfileText_Desc;
			const comp_val = ONLINE_PROFILE_DESCRIPTION_COMPRESSION_MAGIC + LZString.compressToUTF16 (Description);
			if (comp_val.length < Description.length  ||  Description.startsWith (ONLINE_PROFILE_DESCRIPTION_COMPRESSION_MAGIC)) {
				Description = comp_val;
			}
			ServerAccountUpdate.QueueData ({ Description });
		}

		CharacterSetOwnersNotes (InformationSheetSelection, OnlineProfileText_ON);
		ChatRoomCharacterUpdate (InformationSheetSelection);

	}
	CommonSetScreen("Character", "InformationSheet");
}
