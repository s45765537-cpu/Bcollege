"use strict";
var ChatAdminRoomCustomizationBackground = "Sheet";
var ChatAdminRoomCustomizationCurrent = null;
var ChatAdminRoomCustomizationMusic = null;

/**
 * Loads the chat Admin Custom screen properties and creates the inputs
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationLoad() {
	ChatAdminRoomCustomizationCurrent = null;
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
}

/**
 * Plays or stop the background music
 * @param {string} Music - The URL of the music to play
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationPlayMusic(Music) {

	// If no music should play
	if ((Music == null) || (Music == "")) {
		if ((ChatAdminRoomCustomizationMusic != null) && !ChatAdminRoomCustomizationMusic.paused) ChatAdminRoomCustomizationMusic.pause();
		return;
	}

	// Only allows .mp3 and .mp4 files for now
	if (!Music.trim().toLowerCase().endsWith(".mp3") && !Music.trim().toLowerCase().endsWith(".mp4")) {
		if ((ChatAdminRoomCustomizationMusic != null) && !ChatAdminRoomCustomizationMusic.paused) ChatAdminRoomCustomizationMusic.pause();
		return;
	}

	// If volume is more than zero, we start the background music at lower volume
	const vol = (Player.AudioSettings.Volume == null) ? 100 : Player.AudioSettings.Volume;
	if (vol > 0) {
		if (ChatAdminRoomCustomizationMusic == null) ChatAdminRoomCustomizationMusic = new Audio();
		let FileName = Music.trim();
		if ((ChatAdminRoomCustomizationMusic.src == null) || (ChatAdminRoomCustomizationMusic.src.indexOf(FileName) < 0)) {
			ChatAdminRoomCustomizationMusic.currentTime = 0;
			ChatAdminRoomCustomizationMusic.src = FileName;
			ChatAdminRoomCustomizationMusic.volume = Math.min(vol, 1) * 0.25;
			ChatAdminRoomCustomizationMusic.play();
			ChatAdminRoomCustomizationMusic.addEventListener('ended', function() {
				ChatAdminRoomCustomizationMusic.currentTime = 0;
				ChatAdminRoomCustomizationMusic.play();
			}, false);
		}
		if (ChatAdminRoomCustomizationMusic.paused) ChatAdminRoomCustomizationMusic.play();
	} else {
		if ((ChatAdminRoomCustomizationMusic != null) && !ChatAdminRoomCustomizationMusic.paused) ChatAdminRoomCustomizationMusic.pause();
		return;
	}

}

/**
 * Runs the customization on the current screen, can be called from elsewhere
 * @param {object} Custom - The customazation to apply
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationProcess(Custom) {

	// Make sure the customozation data is valid first
	if ((Custom == null) || (typeof Custom !== "object")) {
		ChatAdminRoomCustomizationPlayMusic("");
		return;
	}

	// The background image full image URL over the current background
	if ((Custom.ImageURL != null) && (typeof Custom.ImageURL === "string") && (Custom.ImageURL !== "") && (Custom.ImageURL.length <= 250)) {

		// Only allows .jpg and .png files for now
		let URL = Custom.ImageURL.trim();
		if (URL.toLowerCase().endsWith(".jpg") || URL.trim().toLowerCase().endsWith(".jpeg") || URL.trim().toLowerCase().endsWith(".png")) {
			DrawImageResize(URL, 0, 0, 2000, 1000);
		}

	}

	// The image filter is a full rectangle over the current background
	if ((Custom.ImageFilter != null) && (typeof Custom.ImageFilter === "string") && (Custom.ImageFilter !== "") && (Custom.ImageFilter.length <= 10))
		DrawRect(0, 0, 2000, 1000, Custom.ImageFilter);

	// The background music can be any MP3 file from the web
	if ((Custom.MusicURL != null) && (typeof Custom.MusicURL === "string") && (Custom.MusicURL.length <= 250))
		ChatAdminRoomCustomizationPlayMusic(Custom.MusicURL)
	else
		ChatAdminRoomCustomizationPlayMusic("");

}

/**
 * When the chat Admin Custom screen runs, draws the screen
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationRun() {
	ChatAdminRoomCustomizationProcess(ChatAdminRoomCustomizationCurrent);
	DrawText(TextGet("Title"), 1000, 120, "Black", "White");
	DrawText(TextGet("BackgroundImage1"), 1000, 230, "Black", "White");
	DrawText(TextGet("BackgroundImage2"), 1000, 290, "Black", "White");
	ElementPosition("InputImageURL", 1000, 350, 1500);
	DrawText(TextGet("BackgroundFilter"), 1000, 480, "Black", "White");
	ElementPosition("InputImageFilter", 1000, 540, 250);
	DrawText(TextGet("BackgroundMusic"), 1000, 660, "Black", "White");
	ElementPosition("InputMusicURL", 1000, 720, 1500);
	DrawButton(425, 840, 250, 65, TextGet("Preview"), "White");
	DrawButton(725, 840, 250, 65, TextGet("Clear"), ChatRoomPlayerIsAdmin() ? "White" : "#ebebe4", null, null, !ChatRoomPlayerIsAdmin());
	DrawButton(1025, 840, 250, 65, TextGet("Save"), ChatRoomPlayerIsAdmin() ? "White" : "#ebebe4", null, null, !ChatRoomPlayerIsAdmin());
	DrawButton(1325, 840, 250, 65, TextGet("Cancel"), "White");
}

/**
 * Handles the click events on the admin custom screen. Is called from CommonClick()
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationClick() {

	// TO DO : REMOVE
	if (MouseIn(1800, 800, 200, 200)) {
		ElementValue("InputImageURL", "https://bondageprojects.com/images/school.jpg");
		ElementValue("InputImageURL", "Screens/Room/Platform/Background/Savannah/TentInterior.jpg");
		ElementValue("InputImageFilter", "#00000080");
		ElementValue("InputMusicURL", "https://bondageprojects.com/music/relax.mp3");
	}

	// Can show a preview right away in the screen
	if (MouseIn(425, 840, 250, 65)) {
		ChatAdminRoomCustomizationCurrent = {
			ImageURL: ElementValue("InputImageURL").trim(),
			ImageFilter: ElementValue("InputImageFilter").trim(),
			MusicURL: ElementValue("InputMusicURL").trim()
		};
	}

	// Clear the current data and goes back to the admin screen
	if (MouseIn(725, 840, 250, 65) && ChatRoomPlayerIsAdmin()) {
		ChatAdminTemporaryData.Custom = null;
		ChatAdminRoomCustomizationExit();
	}

	// Admins can save the changes
	if (MouseIn(1025, 840, 250, 65) && ChatRoomPlayerIsAdmin()) {
		if (ChatAdminTemporaryData.Custom == null) ChatAdminTemporaryData.Custom = {};
		ChatAdminTemporaryData.Custom.ImageURL = ElementValue("InputImageURL").trim();
		ChatAdminTemporaryData.Custom.ImageFilter = ElementValue("InputImageFilter").trim();
		ChatAdminTemporaryData.Custom.MusicURL = ElementValue("InputMusicURL").trim();
		if ((ChatAdminTemporaryData.Custom.ImageURL == "") && (ChatAdminTemporaryData.Custom.ImageFilter == "") && (ChatAdminTemporaryData.Custom.MusicURL == ""))
			ChatAdminTemporaryData.Custom = null;
		ChatAdminRoomCustomizationExit();
	}

	// Cancels out without changes
	if (MouseIn(1325, 840, 250, 65)) ChatAdminRoomCustomizationExit();

}

/**
 * Handles exiting from the admin custom screen, removes the inputs
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationExit() {
	ChatAdminRoomCustomizationPlayMusic("");
	ElementRemove("InputImageURL");
	ElementRemove("InputImageFilter");
	ElementRemove("InputMusicURL");
	CommonSetScreen("Online", "ChatAdmin");
}
