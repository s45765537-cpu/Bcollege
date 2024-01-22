"use strict";

var ChatRoomCharacterViewInitialize = true;
var ChatRoomCharacterViewSlideWeight = 9;
var ChatRoomCharacterViewX_Upper = 0;
var ChatRoomCharacterViewX_Lower = 0;
var ChatRoomCharacterViewZoom = 1;
var ChatRoomCharacterViewCharacterCount = 0;
/** @type {null | number} */
var ChatRoomCaracterViewMoveTarget = null;

/**
 * The name of the chat room character view.
 * @type {string}
 */
const ChatRoomCharacterViewName = "Character";

/**
 * Indicates if the chat room character view is active or not
 * @returns {boolean} - TRUE if the chat room character view is active, false if not
 */
function ChatRoomCharacterViewIsActive()
{
	return ChatRoomIsViewActive(ChatRoomCharacterViewName);
}

function ChatRoomCharacterViewRun()
{
	ChatRoomCharacterViewDraw();
}

/**
 * Alter the received message to what will be displayed in the chat log
 *
 * @param {ServerChatRoomMessage} data
 * @param {string} msg
 * @param {Character} SenderCharacter
 * @param {IChatRoomMessageMetadata} metadata
 * @returns {string|null} - The string to display or null if the message should be hidden
 */
function ChatRoomCharacterViewDisplayMessage(data, msg, SenderCharacter, metadata)
{
	return msg;
}

/**
 * Handles clicks the chatroom screen view.
 * @returns {void} - Nothing.
 */
function ChatRoomCharacterViewClick(event)
{
	// Go from character view to map view
	if (ChatRoomCharacterViewShowMapButton() && MouseIn(10, 10, 60, 60)) {
	   ChatRoomActivateView(ChatRoomMapViewName);
	   return;
	}

	// Intercepts the online game chat room clicks if we need to
	if (OnlineGameClick()) return;

	ChatRoomCharacterViewLoopCharacters((charIdx, charX, charY, space, zoom) => {
		if (MouseIn(charX, charY, space, 1000 * zoom)) {
			return ChatRoomCharacterViewClickCharacter(ChatRoomCharacterDrawlist[charIdx], charX, charY, zoom, (MouseX - charX) / zoom, (MouseY - charY) / zoom, charIdx);
		}
	});
}

function ChatRoomCharacterViewKeyDown(event)
{
	if (event.key === "Escape" && !event.shiftKey) {
		// Escape toggles between main view and chat
		ElementScrollToEnd("TextAreaChatLog");
		ElementFocus("InputChat");
		return true;
	}
	return false;
}

/**
 * Returns TRUE if the player can leave
 * @returns {boolean} - True if the player can leave
 */
function ChatRoomCharacterViewCanLeave() {
	return true;

}

/**
 * Take a screenshot of all characters in the chatroom
 * @returns {void} - Nothing
 */
function ChatRoomCharacterViewScreenshot() {
	// Get the room dimensions
	let Space = ChatRoomCharacterViewCharacterCount >= 2 ? 1000 / Math.min(ChatRoomCharacterViewCharacterCount, 5) : 500;
	let Zoom = ChatRoomCharacterViewCharacterCount >= 3 && ChatRoomCharacterViewCharacterCount < 6 ? Space / 400 : 1;
	let Y = ChatRoomCharacterViewCharacterCount <= 5 ? 1000 * (1 - Zoom) / 2 : 0;
	let X = ChatRoomCharacterViewCharacterCount === 1 ? 250 : 0;
	let Width = ChatRoomCharacterViewCharacterCount === 1 ? 500 : 1000;

	// Take the photo
	ChatRoomPhoto(X, Y, Width, 1000 * Zoom, ChatRoomCharacter);
}

/**
 * Returns TRUE if the map button can be used
 * @returns {boolean} - TRUE if can be used
 */
function ChatRoomCharacterViewShowMapButton() {
	return (!ChatRoomIsViewActive(ChatRoomMapViewName) && ChatRoomData?.MapData?.Type != "Never");
}

/**
 * Called when character is clicked
 * @param {Character} C The target character
 * @param {number} CharX Character's X position on canvas
 * @param {number} CharY Character's Y position on canvas
 * @param {number} Zoom Room zoom
 * @param {number} ClickX Click X postion relative to character, without zoom
 * @param {number} ClickY Click Y postion relative to character, without zoom
 * @param {number} Pos Index of target character
 */
function ChatRoomCharacterViewClickCharacter(C, CharX, CharY, Zoom, ClickX, ClickY, Pos) {

	// Click on name
	if (ClickY > 900) {

		// Clicking on self or current target removes whisper target
		if (C.IsPlayer() || ChatRoomTargetMemberNumber === C.MemberNumber) {
			ChatRoomSetTarget(null);
			return;
		}

		// BlockWhisper rule, if owner is in chatroom
		if (ChatRoomOwnerPresenceRule("BlockWhisper", C)) return;

		// Sensory deprivation setting: Total (no whispers) blocks whispers while blind unless both players are in the virtual realm. Then they can text each other.
		if (Player.GameplaySettings.SensDepChatLog === "SensDepExtreme" && Player.GetBlindLevel() >= 3 && !(Player.Effect.includes("VRAvatars") && C.Effect.includes("VRAvatars"))) return;

		// Sets the target
		ChatRoomSetTarget(C.MemberNumber);
		return;
	}

	// Moving character inside room
	if (ChatRoomCaracterViewMoveTarget !== null) {
		const MoveTargetPos = ChatRoomCharacter.findIndex(c => c.MemberNumber === ChatRoomCaracterViewMoveTarget);
		if (MoveTargetPos < 0) {
			ChatRoomCaracterViewMoveTarget = null;
		} else {
			if (Pos < MoveTargetPos && MouseIn(CharX + 100 * Zoom, CharY + 750 * Zoom, 90 * Zoom, 90 * Zoom)) {
				// Move left
				for (let i = 0; i < MoveTargetPos - Pos; i++) {
					ServerSend("ChatRoomAdmin", {
						MemberNumber: ChatRoomCaracterViewMoveTarget,
						Action: "MoveLeft",
						Publish: i === 0
					});
				}
				ChatRoomCaracterViewMoveTarget = null;
			} else if (MouseIn(CharX + 200 * Zoom, CharY + 750 * Zoom, 90 * Zoom, 90 * Zoom)) {
				// Swap or cancel
				if (ChatRoomCaracterViewMoveTarget !== C.MemberNumber) {
					ServerSend("ChatRoomAdmin", {
						MemberNumber: Player.ID,
						TargetMemberNumber: ChatRoomCaracterViewMoveTarget,
						DestinationMemberNumber: C.MemberNumber,
						Action: "Swap"
					});
				}
				ChatRoomCaracterViewMoveTarget = null;
			} else if ( Pos > MoveTargetPos && MouseIn(CharX + 300 * Zoom, CharY + 750 * Zoom, 90 * Zoom, 90 * Zoom)) {
				// Move right
				for (let i = 0; i < Pos - MoveTargetPos; i++) {
					ServerSend("ChatRoomAdmin", {
						MemberNumber: ChatRoomCaracterViewMoveTarget,
						Action: "MoveRight",
						Publish: i === 0
					});
				}
				ChatRoomCaracterViewMoveTarget = null;
			}
			return;
		}
	}

	// Disable examining when blind setting. If both players are in the virtual realm, then they can examine each other.
	if (Player.GameplaySettings.BlindDisableExamine && !(Player.Effect.includes("VRAvatars") && C.Effect.includes("VRAvatars")) && !C.IsPlayer() && Player.GetBlindLevel() >= 3) {
		return;
	}

	// If the arousal meter is shown for that character, we can interact with it
	if (PreferenceArousalAtLeast(C, "Manual")) {
		let MeterShow = C.IsPlayer();
		if (!C.IsPlayer() && Player.ArousalSettings.ShowOtherMeter && C.ArousalSettings) {
			if (C.ArousalSettings.Visible === "Access") {
				MeterShow = C.AllowItem;
			} else if (C.ArousalSettings.Visible === "All") {
				MeterShow = true;
			}
		}
		if (MeterShow) {
			// The arousal meter can be maximized or minimized by clicking on it
			if (MouseIn(CharX + 60 * Zoom, CharY + 400 * Zoom, 80 * Zoom, 100 * Zoom) && !C.ArousalZoom) { C.ArousalZoom = true; return; }
			if (MouseIn(CharX + 50 * Zoom, CharY + 615 * Zoom, 100 * Zoom, 85 * Zoom) && C.ArousalZoom) { C.ArousalZoom = false; return; }

			// If the player can manually control her arousal, we set the progress manual and change the facial expression, it can trigger an orgasm at 100%
			if (C.IsPlayer() && MouseIn(CharX + 50 * Zoom, CharY + 200 * Zoom, 100 * Zoom, 500 * Zoom) && C.ArousalZoom) {
				if (PreferenceArousalAtLeast(Player, "Manual") && !PreferenceArousalAtLeast(Player, "Automatic")) {
					var Arousal = Math.round((CharY + 625 * Zoom - MouseY) / (4 * Zoom));
					ActivitySetArousal(Player, Arousal);
					if (Player.ArousalSettings.AffectExpression) ActivityExpression(Player, Player.ArousalSettings.Progress);
					if (Player.ArousalSettings.Progress == 100) ActivityOrgasmPrepare(Player);
				}
				return;
			}

			// Don't do anything if the thermometer is clicked without access to it
			if (MouseIn(CharX + 50 * Zoom, CharY + 200 * Zoom, 100 * Zoom, 415 * Zoom) && C.ArousalZoom) return;
		}
	}

	// Intercepts the online game character clicks if we need to
	if (OnlineGameClickCharacter(C)) return;

	// Gives focus to the character
	ChatRoomFocusCharacter(C);
}

/**
 * Draws the chatroom characters.
 * @returns {void} - Nothing.
 */
function ChatRoomCharacterViewDraw() {

	// The darkness factors varies with blindness level (1 is bright, 0 is pitch black)
	let DarkFactor = CharacterGetDarkFactor(Player);

	// Check if we should use a custom background
	const CustomBG = DrawGetCustomBackground();
	const Background = CustomBG || ChatRoomData.Background;
	if (CustomBG && (DarkFactor === 0.0 || Player.GameplaySettings.SensDepChatLog == "SensDepLight")) DarkFactor = CharacterGetDarkFactor(Player, true);

	// Determine the horizontal & vertical position and zoom levels to fit all characters evenly in the room
	const Space = ChatRoomCharacterViewCharacterCount >= 2 ? 1000 / Math.min(ChatRoomCharacterViewCharacterCount, 5) : 500;

	// Gradually slide the characters around to make room
	let weight = ChatRoomCharacterViewSlideWeight;
	// Calculate a multiplier based on current framerate to keep the speed of the animation consistent across different framerates
	let frametimeAdjustment = TimerRunInterval / (1000 / 30);
	if (ChatRoomCharacterViewInitialize || !(Player.GraphicsSettings && Player.GraphicsSettings.SmoothZoom)) {
		ChatRoomCharacterViewInitialize = false;
		weight = 0;
	}

	const zoomFrameStep = (current) => (current * weight + ((ChatRoomCharacterViewCharacterCount >= 3 ? Space / 400 : 1))) / (weight + 1);
	const slideUpperFrameStep = (current) => (current * weight + 500 - 0.5 * Space * Math.min(ChatRoomCharacterViewCharacterCount, 5))/(weight + 1);
	const slideLowerFrameStep = (current) => (current * weight + 500 - 0.5 * Space * Math.max(1, ChatRoomCharacterViewCharacterCount - 5))/(weight + 1);

	for (let i = 0; i < frametimeAdjustment; i++) {
		const nextZoom = zoomFrameStep(ChatRoomCharacterViewZoom);
		const nextUpperX = slideUpperFrameStep(ChatRoomCharacterViewX_Upper);
		const nextLowerX = slideLowerFrameStep(ChatRoomCharacterViewX_Lower);

		if (weight === 0) {
			// skip unnecessary calculations
			ChatRoomCharacterViewZoom = nextZoom;
			ChatRoomCharacterViewX_Upper = nextUpperX;
			ChatRoomCharacterViewX_Lower = nextLowerX;
			break;
		}

		const frametimeRemainder = frametimeAdjustment - i;
		if (frametimeRemainder >= 1) {
			ChatRoomCharacterViewZoom = nextZoom;
			ChatRoomCharacterViewX_Upper = nextUpperX;
			ChatRoomCharacterViewX_Lower = nextLowerX;
		} else {
			ChatRoomCharacterViewZoom += (nextZoom - ChatRoomCharacterViewZoom) * frametimeRemainder;
			ChatRoomCharacterViewX_Upper += (nextUpperX - ChatRoomCharacterViewX_Upper) * frametimeRemainder;
			ChatRoomCharacterViewX_Lower += (nextLowerX - ChatRoomCharacterViewX_Lower) * frametimeRemainder;
		}
	}

	// The more players, the higher the zoom, also changes the drawing coordinates
	const Zoom = ChatRoomCharacterViewZoom;
	// const X = ChatRoomCharacterCount >= 3 ? (Space - 500 * Zoom) / 2 : 0;
	const Y = ChatRoomCharacterViewCharacterCount <= 5 ? 1000 * (1 - Zoom) / 2 : 0;
	const InvertRoom = Player.GraphicsSettings.InvertRoom && Player.IsInverted();

	// Draw the background
	ChatRoomCharacterViewDrawBackground(Background, Y, Zoom, DarkFactor, InvertRoom);

	// Loop over the room's characters to draw each of them
	ChatRoomCharacterViewLoopCharacters((charIdx, charX, charY, _space, zoom) => {
		// Draw the background a second time for characters 6 to 10 (we do it here to correct clipping errors from the first part)
		if (charIdx === 5) ChatRoomCharacterViewDrawBackground(Background, 500, zoom, DarkFactor, InvertRoom);

		// Draw the character, it's status bubble and it's overlay
		DrawCharacter(ChatRoomCharacterDrawlist[charIdx], charX, charY, zoom);
		DrawStatus(ChatRoomCharacterDrawlist[charIdx], charX, charY, zoom);
		if (ChatRoomCharacterDrawlist[charIdx].MemberNumber != null) {
			ChatRoomCharacterViewDrawOverlay(ChatRoomCharacterDrawlist[charIdx], charX, charY, zoom, charIdx);
		}
	});

}

function ChatRoomCharacterViewDrawUi() {
	// Draw the map button in the upper left if the room allows it
	if (ChatRoomCharacterViewShowMapButton()) DrawButton(10, 10, 60, 60, "", "White", "Icons/Small/ShowMap.png");
}

/**
 * Draw the background of a chat room
 * @param {string} Background - The name of the background image file
 * @param {number} Y - The starting Y co-ordinate of the image
 * @param {number} Zoom - The zoom factor based on the number of characters
 * @param {number} DarkFactor - The value (0 = fully visible, 1 = black) to tint the background
 * @param {boolean} InvertRoom - Whether the background image should be inverted
 * @returns {void} - Nothing
 */
function ChatRoomCharacterViewDrawBackground(Background, Y, Zoom, DarkFactor, InvertRoom) {
	if (DarkFactor > 0) {

		// Sets the blur level
		const BlurLevel = Player.GetBlurLevel();
		if (BlurLevel > 0) MainCanvas.filter = `blur(${BlurLevel}px)`;

		// Draw the zoomed or custom background
		if (ChatRoomCustomized && (ChatRoomCustomBackground != null) && (ChatRoomCustomBackground != ""))
			DrawImageResize(ChatRoomCustomBackground, 0, Y, 1000, 1000 * Zoom);
		else
			DrawImageZoomCanvas("Backgrounds/" + Background + ".jpg", MainCanvas, 500 * (2 - 1 / Zoom), 0, 1000 / Zoom, 1000, 0, Y, 1000, 1000 * Zoom, InvertRoom);

		// Draw the custom filter
		if (ChatRoomCustomized && (ChatRoomCustomFilter != null) && (ChatRoomCustomFilter != ""))
			DrawRect(0, Y, 1000, 1000 * Zoom, ChatRoomCustomFilter);
		MainCanvas.filter = 'none';

		// Draw an overlay if the character is partially blinded
		if (DarkFactor < 1.0)
			DrawRect(0, Y, 1000, 1000 - Y, "rgba(0,0,0," + (1.0 - DarkFactor) + ")");

	}
	const Tints = Player.GetTints();
	for (const {r, g, b, a} of Tints) {
		DrawRect(0, Y, 1000, 1000 - Y, `rgba(${r},${g},${b},${a})`);
	}
}

/**
 * Iterate over a room's characters
 *
 * This function takes a callback it will call for each character in turn after having
 * calculated their respective drawing parameters (location), accounting for the smooth zoom effect
 * @param {(charIdx: number, charX: number, charY: number, space: number, zoom: number) => boolean | void} callback
 */
function ChatRoomCharacterViewLoopCharacters(callback) {

	// Determine the horizontal & vertical position and zoom levels to fit all characters evenly in the room
	const Space = ChatRoomCharacterViewCharacterCount >= 2 ? 1000 / Math.min(ChatRoomCharacterViewCharacterCount, 5) : 500;

	// Gradually slide the characters around to make room
	let weight = ChatRoomCharacterViewSlideWeight;
	// Calculate a multiplier based on current framerate to keep the speed of the animation consistent across different framerates
	let frametimeAdjustment = TimerRunInterval / (1000 / 30);
	if (ChatRoomCharacterViewInitialize || !(Player.GraphicsSettings && Player.GraphicsSettings.SmoothZoom)) {
		ChatRoomCharacterViewInitialize = false;
		weight = 0;
	}

	const zoomFrameStep = (current) => (current * weight + ((ChatRoomCharacterViewCharacterCount >= 3 ? Space / 400 : 1))) / (weight + 1);
	const slideUpperFrameStep = (current) => (current * weight + 500 - 0.5 * Space * Math.min(ChatRoomCharacterViewCharacterCount, 5))/(weight + 1);
	const slideLowerFrameStep = (current) => (current * weight + 500 - 0.5 * Space * Math.max(1, ChatRoomCharacterViewCharacterCount - 5))/(weight + 1);

	for (let i = 0; i < frametimeAdjustment; i++) {
		const nextZoom = zoomFrameStep(ChatRoomCharacterViewZoom);
		const nextUpperX = slideUpperFrameStep(ChatRoomCharacterViewX_Upper);
		const nextLowerX = slideLowerFrameStep(ChatRoomCharacterViewX_Lower);

		if (weight === 0) {
			// skip unnecessary calculations
			ChatRoomCharacterViewZoom = nextZoom;
			ChatRoomCharacterViewX_Upper = nextUpperX;
			ChatRoomCharacterViewX_Lower = nextLowerX;
			break;
		}

		const frametimeRemainder = frametimeAdjustment - i;
		if (frametimeRemainder >= 1) {
			ChatRoomCharacterViewZoom = nextZoom;
			ChatRoomCharacterViewX_Upper = nextUpperX;
			ChatRoomCharacterViewX_Lower = nextLowerX;
		} else {
			ChatRoomCharacterViewZoom += (nextZoom - ChatRoomCharacterViewZoom) * frametimeRemainder;
			ChatRoomCharacterViewX_Upper += (nextUpperX - ChatRoomCharacterViewX_Upper) * frametimeRemainder;
			ChatRoomCharacterViewX_Lower += (nextLowerX - ChatRoomCharacterViewX_Lower) * frametimeRemainder;
		}
	}

	// The more players, the higher the zoom, also changes the drawing coordinates
	const Zoom = ChatRoomCharacterViewZoom;
	const X = ChatRoomCharacterViewCharacterCount >= 3 ? (Space - 500 * Zoom) / 2 : 0;
	const Y = ChatRoomCharacterViewCharacterCount <= 5 ? 1000 * (1 - Zoom) / 2 : 0;

	// Draw the characters (in click mode, we can open the character menu or start whispering to them)
	for (let C = 0; C < ChatRoomCharacterDrawlist.length; C++) {

		// Finds the X and Y position of the character based on it's room position
		let ChatRoomCharacterX = C >= 5 ? ChatRoomCharacterViewX_Lower : ChatRoomCharacterViewX_Upper;
		if (!(Player.GraphicsSettings && Player.GraphicsSettings.CenterChatrooms)) ChatRoomCharacterX = 0;
		const CharX = ChatRoomCharacterX + (ChatRoomCharacterViewCharacterCount == 1 ? 0 : X + (C % 5) * Space);
		const CharY = ChatRoomCharacterViewCharacterCount == 1 ? 0 : Y + Math.floor(C / 5) * 500;
		if ((ChatRoomCharacterViewCharacterCount == 1) && !ChatRoomCharacterDrawlist[C].IsPlayer()) continue;

		const res = callback(C, CharX, CharY, Space, Zoom);
		if (res) break;
	}
}

/**
 * Draws any overlays on top of character
 * @param {Character} C The target character
 * @param {number} CharX Character's X position on canvas
 * @param {number} CharY Character's Y position on canvas
 * @param {number} Zoom Room zoom
 * @param {number} Pos Index of target character
 */
function ChatRoomCharacterViewDrawOverlay(C, CharX, CharY, Zoom, Pos) {

	// Draw the ghostlist/friendlist, whitelist/blacklist, admin icons, etc. above the character
	if (ChatRoomHideIconState == 0) {
		ChatRoomDrawCharacterStatusIcons(C, CharX, CharY, Zoom);
	}

	if (ChatRoomTargetMemberNumber == C.MemberNumber && ChatRoomHideIconState <= 1) {
		DrawImage("Icons/Small/Whisper.png", CharX + 75 * Zoom, CharY + 950 * Zoom);
	}

	if (ChatRoomCaracterViewMoveTarget !== null) {
		const MoveTargetPos = ChatRoomCharacter.findIndex(c => c.MemberNumber === ChatRoomCaracterViewMoveTarget);
		if (MoveTargetPos < 0) {
			ChatRoomCaracterViewMoveTarget = null;
		} else {
			if (ChatRoomCaracterViewMoveTarget === C.MemberNumber) {
				DrawButton(CharX + 200 * Zoom, CharY + 750 * Zoom, 90 * Zoom, 90 * Zoom, "", "White");
				DrawImageResize("Icons/Remove.png", CharX + 202 * Zoom, CharY + 752 * Zoom, 86 * Zoom, 86 * Zoom);
			} else {
				if (Pos < MoveTargetPos) {
					DrawButton(CharX + 100 * Zoom, CharY + 750 * Zoom, 90 * Zoom, 90 * Zoom, "", "White");
					DrawImageResize("Icons/Here.png", CharX + 102 * Zoom, CharY + 752 * Zoom, 86 * Zoom, 86 * Zoom);
				}
				DrawButton(CharX + 200 * Zoom, CharY + 750 * Zoom, 90 * Zoom, 90 * Zoom, "", "White");
				DrawImageResize("Icons/Swap.png", CharX + 202 * Zoom, CharY + 752 * Zoom, 86 * Zoom, 86 * Zoom);
				if (Pos > MoveTargetPos) {
					DrawButton(CharX + 300 * Zoom, CharY + 750 * Zoom, 90 * Zoom, 90 * Zoom, "", "White");
					DrawImageResize("Icons/Here.png", CharX + 302 * Zoom, CharY + 752 * Zoom, 86 * Zoom, 86 * Zoom);
				}
			}
		}
	}
}

/** Deprecated names for compatibility */

/** @deprecated - Use {@link ChatRoomCharacterViewInitialize} instead! */
var ChatRoomCharacterInitialize = ChatRoomCharacterViewInitialize;
/** @deprecated - Use {@link ChatRoomCharacterViewX_Upper} instead! */
var ChatRoomCharacterX_Upper = ChatRoomCharacterViewX_Upper;
/** @deprecated - Use {@link ChatRoomCharacterViewX_Lower} instead! */
var ChatRoomCharacterX_Lower = ChatRoomCharacterViewX_Lower;
/** @deprecated - Use {@link ChatRoomCharacterViewZoom} instead! */
var ChatRoomCharacterZoom = ChatRoomCharacterViewZoom;
/** @deprecated - Use {@link ChatRoomCharacterViewSlideWeight} instead! */
var ChatRoomSlideWeight = ChatRoomCharacterViewSlideWeight;
/** @deprecated - Use {@link ChatRoomCharacterViewCharacterCount} instead! */
var ChatRoomCharacterCount = ChatRoomCharacterViewCharacterCount;
/** @deprecated - Use {@link ChatRoomCaracterViewMoveTarget} instead! */
var ChatRoomMoveTarget = ChatRoomCaracterViewMoveTarget;

/**
 * Returns TRUE if the map button can be used
 * @deprecated - Use {@link ChatRoomCharacterViewShowMapButton} instead!
 * @returns {boolean} - TRUE if can be used
 */
function ChatRoomMapButton() {
	return ChatRoomCharacterViewShowMapButton();
}

/**
 * Draws the chatroom characters.
 * @deprecated - Use {@link ChatRoomCharacterViewDraw} instead!
 * @returns {void} - Nothing.
 */
function ChatRoomDrawCharacter() {
	return ChatRoomCharacterViewDraw();
}

/**
 * Draw the background of a chat room
 * @deprecated - Use {@link ChatRoomCharacterViewDrawBackground} instead!
 * @param {string} Background - The name of the background image file
 * @param {number} Y - The starting Y co-ordinate of the image
 * @param {number} Zoom - The zoom factor based on the number of characters
 * @param {number} DarkFactor - The value (0 = fully visible, 1 = black) to tint the background
 * @param {boolean} InvertRoom - Whether the background image should be inverted
 * @returns {void} - Nothing
 */
function ChatRoomDrawBackground(Background, Y, Zoom, DarkFactor, InvertRoom)
{
	return ChatRoomCharacterViewDrawBackground(Background, Y, Zoom, DarkFactor, InvertRoom)
}

/**
 * Iterate over a room's characters
 *
 * This function takes a callback it will call for each character in turn after having
 * calculated their respective drawing parameters (location), accounting for the smooth zoom effect
 * @deprecated - Use {@link ChatRoomCharacterViewLoopCharacters} instead!
 * @param {(charIdx: number, charX: number, charY: number, space: number, zoom: number) => boolean | void} callback
 */
function ChatRoomLoopCharacters(callback) {
	return ChatRoomCharacterViewLoopCharacters(callback);
}

/**
 * Draws any overlays on top of character
 * @deprecated - Use {@link ChatRoomCharacterViewDrawOverlay} instead!
 * @param {Character} C The target character
 * @param {number} CharX Character's X position on canvas
 * @param {number} CharY Character's Y position on canvas
 * @param {number} Zoom Room zoom
 * @param {number} Pos Index of target character
 */
function ChatRoomDrawCharacterOverlay(C, CharX, CharY, Zoom, Pos) {
	return ChatRoomCharacterViewDrawOverlay(C, CharX, CharY, Zoom, Pos);
}

/**
 * Called when character is clicked
 * @deprecated - Use {@link ChatRoomCharacterViewClickCharacter} instead!
 * @param {Character} C The target character
 * @param {number} CharX Character's X position on canvas
 * @param {number} CharY Character's Y position on canvas
 * @param {number} Zoom Room zoom
 * @param {number} ClickX Click X postion relative to character, without zoom
 * @param {number} ClickY Click Y postion relative to character, without zoom
 * @param {number} Pos Index of target character
 */
function ChatRoomClickCharacter(C, CharX, CharY, Zoom, ClickX, ClickY, Pos) {
	return ChatRoomCharacterViewClickCharacter(C, CharX, CharY, Zoom, ClickX, ClickY, Pos);
}
