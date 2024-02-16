"use strict";

/** BC's version */
var GameVersion = "R101Beta4";

const GameVersionFormat = /^R([0-9]+)(?:(Alpha|Beta)([0-9]+)?)?$/;

var CommonVersionUpdated = false;

/** @type {TouchList | null} */
var CommonTouchList = null;

function GameStart() {
	ServerURL = CommonGetServer();
	//CheatImport();
	console.log("Version: " + GameVersion + ", Server: " + ServerURL);
	if (!GameVersionFormat.test(GameVersion)) console.error("GameVersion is not valid!");

	CurrentTime = CommonTime();

	CommonIsMobile = CommonDetectMobile();
	TranslationLoad();
	DrawLoad();
	AssetLoadAll();
	CommandsLoad();
	ControllerStart();
	CommonSetScreen("Character", "Login");
	ServerInit();

	document.addEventListener("keydown", GameKeyDown);

	const canvas = document.getElementById("MainCanvas");
	canvas.tabIndex = 1000;

	canvas.addEventListener("keydown", GameKeyDown);
	canvas.addEventListener("keyup", GameKeyUp);

	canvas.addEventListener("mousedown", GameMouseDown);
	canvas.addEventListener("mouseup", GameMouseUp);
	canvas.addEventListener("mousemove", GameMouseMove);
	canvas.addEventListener("wheel", GameMouseWheel);
	canvas.addEventListener("mouseleave", GameMouseLeave);

	canvas.addEventListener("touchstart", GameTouchStart);
	canvas.addEventListener("touchmove", GameTouchMove);
	canvas.addEventListener("touchend", GameTouchEnd);

	requestAnimationFrame(GameRun);
}

// When the code is loaded, we start the game engine
window.addEventListener("load", GameStart);

/**
 * Main game running state, runs the drawing
 * @param {number} Timestamp
 */
function GameRun(Timestamp) {

	// Increments the time from the last frame
	TimerRunInterval = Timestamp - TimerLastTime;
	TimerLastTime = Timestamp;
	CurrentTime = CurrentTime + TimerRunInterval;

	DrawProcess(Timestamp);
	ControllerProcess();
	TimerProcess();

	ServerSendQueueProcess();

	requestAnimationFrame(MainRun);
}

/**
 * When the user presses a key, we send the KeyDown event to the current screen if it can accept it
 * @param {KeyboardEvent} event
 */
function GameKeyDown(event) {
	if (event.repeat) return false;
	let handled = false;
	KeyPress = event.keyCode || event.which;
	if (ControllerIsActive() && ControllerSupportKeyDown(event)) {
		handled = true;
	} else if (event.key == "Escape" && CurrentScreenFunctions.Exit) {
		CurrentScreenFunctions.Exit();
		handled = true;
	} else if (DialogKeyDown(event)) {
		handled = true;
	} else if (CurrentScreenFunctions.KeyDown && CurrentScreenFunctions.KeyDown(event)) {
		handled = true;
	}

	if (handled) {
		event.preventDefault();
		event.stopImmediatePropagation();
	}
	return handled;
}

function GameKeyUp(event) {
	if(StruggleMinigameIsRunning()) { return; }
	if (CurrentScreenFunctions.KeyUp)
	{
		CurrentScreenFunctions.KeyUp(event);
	}
}

var GameMouseIsDown = false;
/**
 * If the user presses the mouse button, we fire the mousedown event for other screens
 * @param {MouseEvent} event
 */
function GameMouseDown(event) {
	if (CommonIsMobile) { return; }
	if (GameMouseIsDown) { return; }
	CommonMouseDown(event);
	GameMouseIsDown = true;
}

/**
 * If the user releases the mouse button, we fire the mouseup and click events for other screens
 * @param {MouseEvent} event
 */
function GameMouseUp(event) {
	if (CommonIsMobile) { return; }
	if (!GameMouseIsDown) { return; }
	GameMouseMove(event, false);
	CommonMouseUp(event);
	CommonClick(event);
	GameMouseIsDown = false;
}

/**
 * If the user rolls the mouse wheel, we fire the mousewheel event for other screens
 * @param {MouseEvent} event
 */
function GameMouseWheel(event) {
	if (CommonIsMobile) { return; }
	CommonMouseWheel(event);
}

/**
 * If the user moves the mouse mouse, we keep the mouse position for other scripts and fire the mousemove event for other screens
 * @param {MouseEvent} event
 */
function GameMouseMove(event, forwardToScreens = true) {
	MouseX = Math.round(event.offsetX * 2000 / MainCanvas.canvas.clientWidth);
	MouseY = Math.round(event.offsetY * 1000 / MainCanvas.canvas.clientHeight);
	if(forwardToScreens)
	{
		CommonMouseMove(event);
	}
}

/**
 * If the user starts touching the screen (mobile only), we fire the mousedown and click events for other screens
 * @param {TouchEvent} event
 */
function GameTouchStart(event) {
	if (!CommonIsMobile) { return; }
	if (GameMouseIsDown) { return; }
	GameTouchMove(event, false);
	CommonMouseDown(event);
	CommonClick(event);
	GameMouseIsDown = true;
	CommonTouchList = event.touches;
}

/**
 * If the user stops touching the screen (mobile only), we fire the mouseup event for other screens
 * @param {TouchEvent} event
 */
function GameTouchEnd(event) {
	if (!CommonIsMobile) { return; }
	if (!GameMouseIsDown) { return; }
	CommonMouseUp(event);
	GameMouseIsDown = false;
	CommonTouchList = event.touches;
}

/**
 * if the user moves the touch, we keep the mouse position for other scripts and fire the mousemove event for other screens
 * @param {TouchEvent} event
 */
function GameTouchMove(event, forwardToScreens = true) {
	if (!CommonIsMobile) { return; }
	const touch = event.changedTouches[0];
	MouseX = Math.round((touch.clientX - MainCanvas.canvas.offsetLeft) * 2000 / MainCanvas.canvas.clientWidth);
	MouseY = Math.round((touch.clientY - MainCanvas.canvas.offsetTop) * 1000 / MainCanvas.canvas.clientHeight);
	if(forwardToScreens)
	{
		CommonMouseMove(event);
	}
}

/**
 * When the mouse is away from the control, we stop keeping the coordinates,
 * we also check for false positives with "relatedTarget"
 * @param {MouseEvent} event
 */
function GameMouseLeave(event) {
	if (event.relatedTarget) {
		MouseX = -1;
		MouseY = -1;
	}
}

/** @deprecated */
function KeyDown(event) { GameKeyDown(event); }
/** @deprecated */
function MainRun(Timestamp) { GameRun(Timestamp); }
/** @deprecated */
function Click(event) { if (!CommonIsMobile) { CommonClick(event); } }
/** @deprecated */
function LoseFocus(event) { GameMouseLeave(event); }
