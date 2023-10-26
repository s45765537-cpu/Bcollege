"use strict";
var ChatAdminRoomCustomizationBackground = "Sheet";
var ChatAdminRoomCustomizationCurrent = null;
var ChatAdminRoomCustomizationMusic = null;
var ChatAdminRoomCustomizationMode = null;
var ChatAdminRoomCustomizationMusicLibrary = [
	{
		Name: "FantasyAmbience",
		URL: "https://bondageprojects.com/music/FantasyAmbience.mp3",
		Source: "https://www.youtube.com/watch?v=enk9srBmTqQ&ab_channel=Jota-RMusicChannel"
	},
	{
		Name: "HorrorAmbience",
		URL: "https://bondageprojects.com/music/HorrorAmbience.mp3",
		Source: "https://www.youtube.com/watch?v=1JnPSMNuHtw&ab_channel=MarcvanderMeulen%E2%99%AB"
	},
	{
		Name: "WesternAmbience",
		URL: "https://bondageprojects.com/music/WesternAmbience.mp3",
		Source: "https://www.youtube.com/watch?v=wTm-WFM0v-g&ab_channel=MrSnoozeIBackgroundMusicforVideos"
	},
	{
		Name: "MetalInstrumental2021",
		URL: "https://bondageprojects.com/music/MetalInstrumental2021.mp3",
		Source: "https://www.youtube.com/watch?v=AZum7ymw_Ws&ab_channel=MaximumOfHeaven"
	},
	{
		Name: "Pop2020",
		URL: "https://bondageprojects.com/music/Pop2020.mp3",
		Source: "https://www.youtube.com/watch?v=Y7Dk3_hA3-8&ab_channel=therealahmedtn"
	},
	{
		Name: "Pop2022",
		URL: "https://bondageprojects.com/music/Pop2022.mp3",
		Source: "https://www.youtube.com/watch?v=IW0QkXpQs3k&ab_channel=MusicToListen"
	},
	{
		Name: "ProgressiveHouse2022",
		URL: "https://bondageprojects.com/music/ProgressiveHouse2022.mp3",
		Source: "https://www.youtube.com/watch?v=u6PUX87ZaX0&ab_channel=ElectroDanceMixes"
	},
	{
		Name: "ElectroDance2022",
		URL: "https://bondageprojects.com/music/ElectroDance2022.mp3",
		Source: "https://www.youtube.com/watch?v=oqGEyAFf6MI&ab_channel=ElectroDanceMixes"
	},
	{
		Name: "ElectroDance2023",
		URL: "https://bondageprojects.com/music/ElectroDance2023.mp3",
		Source: "https://www.youtube.com/watch?v=7IjvFZox1Jc&ab_channel=ElectroDanceMixes"
	},
	{
		Name: "ElectroRoyKnox",
		URL: "https://bondageprojects.com/music/ElectroRoyKnox.mp3",
		Source: "https://www.youtube.com/watch?v=dh01eSOn9_E&ab_channel=MagicMusic"
	},
	{
		Name: "DanceElectroPop",
		URL: "https://bondageprojects.com/music/DanceElectroPop.mp3",
		Source: "https://www.youtube.com/watch?v=MEkaqZecpUQ&ab_channel=NoCopyrightSounds"
	},
	{
		Name: "DarkTechno",
		URL: "https://bondageprojects.com/music/DarkTechno.mp3",
		Source: "https://www.youtube.com/watch?v=iAguE62acA8&ab_channel=AimToHeadOfficial"
	}
];

/**
 * Changes a customiation value from a chat room command
 * @param {"Image" | "Filter" | "Music"} Property - The custom property to change (Image, Filter or Music)
 * @param {string} Value - The value to set in that property
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationCommand(Property, Value) {

	// Command type & value must be valid and player must be a room administrator
	if ((Property == null) || (Value == null) || (typeof Value !== "string") || !ChatRoomPlayerIsAdmin()) return;
	Value = Value.trim();

	// Builds the custom object
	let Custom = ChatRoomData.Custom;
	if (Custom == null) Custom = { ImageURL: "", ImageFilter: "", MusicURL: "" };
	if (Property == "Image") Custom.ImageURL = Value;
	if (Property == "Filter") Custom.ImageFilter = Value;
	if (Property == "Music") Custom.MusicURL = Value;
	if ((Custom.ImageURL == "") && (Custom.ImageFilter == "") && (Custom.MusicURL == "")) Custom = null;

	// Prepares an object to update the room
	var UpdatedRoom = {
		Name: ChatRoomData.Name,
		Language: ChatRoomData.Language,
		Description: ChatRoomData.Description,
		Background: ChatRoomData.Background,
		Limit: ChatRoomData.Limit,
		Admin: ChatRoomData.Admin,
		Ban: ChatRoomData.Ban,
		BlockCategory: ChatRoomData.BlockCategory,
		Game: ChatRoomData.Game,
		Private: ChatRoomData.Private,
		Locked: ChatRoomData.Locked,
		Custom: Custom
	};

	// Sends that objet to the server for everyone to refresh the room
	ServerSend("ChatRoomAdmin", { MemberNumber: Player.ID, Room: UpdatedRoom, Action: "Update" });

}

/**
 * Loads the chat Admin Custom screen properties and creates the inputs
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationLoad() {
	ChatAdminRoomCustomizationMode = null;
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
		document.getElementById("InputImageURL").setAttribute("disabled", "disabled");
		document.getElementById("InputImageFilter").setAttribute("disabled", "disabled");
		document.getElementById("InputMusicURL").setAttribute("disabled", "disabled");
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
	if (!CommonURLHasExtension(Music, [".mp3", ".mp4"])) {
		if ((ChatAdminRoomCustomizationMusic != null) && !ChatAdminRoomCustomizationMusic.paused) ChatAdminRoomCustomizationMusic.pause();
		return;
	}

	// If volume is more than zero, we start the background music at lower volume
	const vol = (Player.AudioSettings.MusicVolume == null) ? 100 : Player.AudioSettings.MusicVolume;
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
 * @param {boolean} Draw - If we must draw directly or keep values to be used by online chat rooms
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationProcess(Custom, Draw) {

	// Make sure the customozation data is valid first
	if ((Custom == null) || (typeof Custom !== "object")) {
		ChatRoomCustomizationClear();
		return;
	}

	// The background image full image URL over the current background
	ChatRoomCustomBackground = "";
	if ((Custom.ImageURL != null) && (typeof Custom.ImageURL === "string") && (Custom.ImageURL !== "") && (Custom.ImageURL.length <= 250)) {

		// Only allows .jpg and .png files for now
		let URL = Custom.ImageURL.trim();
		if (CommonURLHasExtension(URL, [".jpg", ".jpeg", ".png"])) {
			if (Draw) DrawImageResize(URL, 0, 0, 2000, 1000);
			else ChatRoomCustomBackground = URL;
		}

	}

	// The image filter is a full rectangle over the current background
	ChatRoomCustomFilter = "";
	if ((Custom.ImageFilter != null) && (typeof Custom.ImageFilter === "string") && (Custom.ImageFilter !== "") && (Custom.ImageFilter.length <= 10)) {
		if (Draw) DrawRect(0, 0, 2000, 1000, Custom.ImageFilter);
		else ChatRoomCustomFilter = Custom.ImageFilter;
	}

	// The background music can be any MP3 file from the web
	if ((Custom.MusicURL != null) && (typeof Custom.MusicURL === "string") && (Custom.MusicURL.length <= 250))
		ChatAdminRoomCustomizationPlayMusic(Custom.MusicURL);
	else
		ChatAdminRoomCustomizationPlayMusic("");

}

/**
 * When the chat Admin Custom screen runs, draws the screen
 * @returns {void} - Nothing
 */
function ChatAdminRoomCustomizationRun() {

	// Shows the background and plays the music if needed
	ChatAdminRoomCustomizationProcess(ChatAdminRoomCustomizationCurrent, true);

	// In no special mode
	if (ChatAdminRoomCustomizationMode == null) {
		DrawText(TextGet("Title"), 1000, 120, "Black", "White");
		DrawText(TextGet("BackgroundImage1"), 1000, 230, "Black", "White");
		DrawText(TextGet("BackgroundImage2"), 1000, 290, "Black", "White");
		ElementPosition("InputImageURL", 1000, 350, 1500);
		DrawText(TextGet("BackgroundFilter"), 1000, 480, "Black", "White");
		ElementPosition("InputImageFilter", 1000, 540, 250);
		DrawText(TextGet("BackgroundMusic"), 1000, 660, "Black", "White");
		ElementPosition("InputMusicURL", 880, 720, 1360);
		DrawButton(1570, 692, 200, 65, TextGet("Library"), "White");
	}

	// In music library mode
	if (ChatAdminRoomCustomizationMode === "MusicLibrary") {
		ElementPosition("InputImageURL", 1000, -10000, 1500);
		ElementPosition("InputImageFilter", 1000, -10000, 250);
		ElementPosition("InputMusicURL", 880, 720, 1360);
		DrawText(TextGet("TitleMusicLibrary"), 1000, 120, "Black", "White");
		DrawButton(1570, 692, 200, 65, TextGet("Return"), "White");
		for (let L = 0; L < ChatAdminRoomCustomizationMusicLibrary.length; L++) {
			let X = Math.floor(L % 3) * 600 + 115;
			let Y = Math.floor(L / 3) * 100 + 210;
			DrawButton(X, Y, 500, 65, TextGet("MusicLibrary" + ChatAdminRoomCustomizationMusicLibrary[L].Name), "White");
			DrawButton(X + 500, Y, 65, 65, "", "White", "Icons/Small/YouTube.png");
		}
	}

	// Shows the bottom buttons
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
	/*if (MouseIn(1800, 800, 200, 200)) {
		ElementValue("InputImageURL", "https://bondageprojects.com/images/school.jpg");
		ElementValue("InputImageURL", "Screens/Room/Platform/Background/Savannah/TentInterior.jpg");
		ElementValue("InputImageFilter", "#00008080");
		ElementValue("InputMusicURL", "https://bondageprojects.com/music/relax.mp3");
	}*/

	// If there's no special mode loaded
	if (ChatAdminRoomCustomizationMode == null) {

		// Can show a preview right away in the screen
		if (MouseIn(1570, 692, 200, 65)) {
			ChatAdminRoomCustomizationMode = "MusicLibrary";
			return;
		}

	}

	// In Music Library mode
	if (ChatAdminRoomCustomizationMode === "MusicLibrary") {

		// Can show a preview right away in the screen
		if (MouseIn(1570, 692, 200, 65)) {
			ChatAdminRoomCustomizationMode = null;
			return;
		}

		// If a button is clicked, we select that song
		for (let L = 0; L < ChatAdminRoomCustomizationMusicLibrary.length; L++) {
			let X = Math.floor(L % 3) * 600 + 115;
			let Y = Math.floor(L / 3) * 100 + 210;
			if (MouseIn(X, Y, 500, 65)) {
				ElementValue("InputMusicURL", ChatAdminRoomCustomizationMusicLibrary[L].URL);
				return;
			}
			if (MouseIn(X + 500, Y, 65, 65)) {
				window.open(ChatAdminRoomCustomizationMusicLibrary[L].Source, '_blank').focus();
				return;
			}
		}

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
