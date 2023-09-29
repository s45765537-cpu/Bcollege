"use strict";
var ChatAdminRoomCustomizationBackground = "Sheet";

/**
 * Loads the chat Admin Custom screen properties and creates the inputs
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationLoad() {
	let Data = ChatAdminTemporaryData ? ChatAdminTemporaryData.Custom : ChatRoomData.Custom;
	if (Data == null) Data = {};
	ElementCreateInput("InputImageURL", "text", (Data.ImageURL == null) ? "" : Data.ImageURL, "250");
	ElementCreateInput("InputImageFilter", "text", (Data.ImageFilter == null) ? "" : Data.ImageFilter, "10");
	ElementCreateInput("InputMusicURL", "text", (Data.MusicURL == null) ? "" : Data.MusicURL, "250");
	document.getElementById("InputImageURL").setAttribute("autocomplete", "off");
	document.getElementById("InputImageFilter").setAttribute("autocomplete", "off");
	document.getElementById("InputMusicURL").setAttribute("autocomplete", "off");
	if (!ChatRoomPlayerIsAdmin()) {
		document.getElementById("InputAdminList").setAttribute("disabled", "disabled");
		document.getElementById("InputBanList").setAttribute("disabled", "disabled");
		document.getElementById("InputSize").setAttribute("disabled", "disabled");
	}
	// TO DO : REMOVE
	ElementValue("InputImageURL", "https://bondageprojects.com/images/school.jpg");
	//ElementValue("InputImageURL", "Screens/Room/Platform/Background/Savannah/TentInterior.jpg");
	ElementValue("InputImageFilter", "#00000080");
	ElementValue("InputMusicURL", "https://bondageprojects.com/music/relax.mp3");
}

/**
 * When the chat Admin Custom screen runs, draws the screen
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationRun() {
	DrawText(TextGet("Title"), 1000, 120, "Black", "Gray");
	DrawText(TextGet("BackgroundImage1"), 1000, 230, "Black", "Gray");
	DrawText(TextGet("BackgroundImage2"), 1000, 290, "Black", "Gray");
	ElementPosition("InputImageURL", 1000, 350, 1500);
	DrawText(TextGet("BackgroundFilter"), 1000, 480, "Black", "Gray");
	ElementPosition("InputImageFilter", 1000, 540, 250);
	DrawText(TextGet("BackgroundMusic"), 1000, 660, "Black", "Gray");
	ElementPosition("InputMusicURL", 1000, 720, 1500);
	DrawButton(550, 840, 250, 65, TextGet("Clear"), ChatRoomPlayerIsAdmin() ? "White" : "#ebebe4", null, null, !ChatRoomPlayerIsAdmin());
	DrawButton(850, 840, 250, 65, TextGet("Save"), ChatRoomPlayerIsAdmin() ? "White" : "#ebebe4", null, null, !ChatRoomPlayerIsAdmin());
	DrawButton(1150, 840, 250, 65, TextGet("Cancel"), "White");
}

/**
 * Handles the click events on the admin custom screen. Is called from CommonClick()
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationClick() {
	if (MouseIn(550, 840, 250, 65) && ChatRoomPlayerIsAdmin()) {
		delete ChatAdminTemporaryData.Custom;
		ChatAdminRoomCustomizationExit();
	}
	if (MouseIn(850, 840, 250, 65) && ChatRoomPlayerIsAdmin()) {
		if (ChatAdminTemporaryData.Custom == null) ChatAdminTemporaryData.Custom = {};
		ChatAdminTemporaryData.Custom.ImageURL = ElementValue("InputImageURL").trim();
		ChatAdminTemporaryData.Custom.ImageFilter = ElementValue("InputImageFilter").trim();
		ChatAdminTemporaryData.Custom.MusicURL = ElementValue("InputMusicURL").trim();
		if ((ChatAdminTemporaryData.Custom.ImageURL == "") || (ChatAdminTemporaryData.Custom.ImageFilter == "") || (ChatAdminTemporaryData.Custom.MusicURL == ""))
			delete ChatAdminTemporaryData.Custom;
		ChatAdminRoomCustomizationExit();
	}
	if (MouseIn(1150, 840, 250, 65)) ChatAdminRoomCustomizationExit();
}

/**
 * Handles exiting from the admin custom screen, removes the inputs
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationExit() {
	ElementRemove("InputImageURL");
	ElementRemove("InputImageFilter");
	ElementRemove("InputMusicURL");
	CommonSetScreen("Online", "ChatAdmin");
}
