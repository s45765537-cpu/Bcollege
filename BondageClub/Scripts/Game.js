"use strict";

/** BC's version */
var GameVersion = "R119Beta3";

const GameVersionFormat = /^R([0-9]+)(?:(Alpha|Beta)([0-9]+)?)?$/;

/** @type {number | null} */
var GameAnimationFrameId = null;
/** @type {Worker | null} */
var GameWorker = null;

var CommonVersionUpdated = false;

/** @type {TouchList | null} */
var CommonTouchList = null;

const DEFAULT_FRAMERATE = 60;

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
	AssetInventoryIDValidate();
	CommandsLoad();
	ControllerStart();
	TextPrefetchFile(InterfaceStringsPath);
	CommonSetScreen("Character", "Login");
	ServerInit();

	// Create a blank character for our player. Its actual ID will be set when LoginResponse happens
	Player = /** @type {PlayerCharacter} */ (CharacterCreate("Female3DCG", CharacterType.SIMPLE, ""));

	// Those event listeners are all going through a lambda so that mods can
	// correctly hook into them. Using the functions directly causes a copy of
	// them to be made (well, their code, actually), breaking that ability.
	document.addEventListener("keydown", (e) => GameKeyDown(e));

	const canvas = document.getElementById("MainCanvas");
	canvas.tabIndex = 1000;

	canvas.addEventListener("keydown", (e) => GameKeyDown(e));
	canvas.addEventListener("keyup", (e) => GameKeyUp(e));

	canvas.addEventListener("mousedown", (e) => GameMouseDown(e));
	canvas.addEventListener("mouseup", (e) => GameMouseUp(e));
	canvas.addEventListener("mousemove", (e) => GameMouseMove(e));
	canvas.addEventListener("wheel", (e) => GameMouseWheel(e));
	canvas.addEventListener("mouseleave", (e) => GameMouseLeave(e));

	canvas.addEventListener("touchstart", (e) => GameTouchStart(e));
	canvas.addEventListener("touchmove", (e) => GameTouchMove(e));
	canvas.addEventListener("touchend", (e) => GameTouchEnd(e));

	GameAnimationFrameId = requestAnimationFrame(GameRun);
	// Can't use setInterval, chrome throttles it to 1 minute on inactive pages, but not in workers...
	GameWorker = new Worker("Scripts/GameWorker.js");
	GameWorker.onmessage = GameFallbackTimer;
}

// When the code is loaded, we start the game engine
window.addEventListener("load", GameStart);

function GameHandleError() {
	if (GameAnimationFrameId != null) {
		cancelAnimationFrame(GameAnimationFrameId);
		GameAnimationFrameId = null;
	}
	if (GameWorker != null) {
		GameWorker.onmessage = null;
		GameWorker.terminate();
		GameWorker = null;
	}
}

/**
 * Periodically called in the background with low frequency, so the game doesn't freeze, even if the user switches to a different tab.
 * @returns {void}
 */
function GameFallbackTimer() {
	let Timestamp = performance.now();
	if (Timestamp - TimerLastTime > 500) {
		GameRunBackground(Timestamp);
	}
}

/**
 * Main game running state, runs the drawing
 * @param {number} Timestamp
 */
function GameRun(Timestamp) {

	/** @type {(ms: number) => number} */
	const estimateFrameDuration = (ms) => (1000 / ms) | 0;

	try {
		// Compatibility; call the old function (now a no-op)
		MainRun();

		GameAnimationFrameId = null;

		if (TimerLastTime > 0 && Timestamp > 0) {
			// Default to 30 fps outside the game
			let maxUnfocusedFPS = document.hasFocus() ? 0 : Player?.GraphicsSettings?.MaxUnfocusedFPS ?? 0;
			let maxFocusedFPS = Player?.GraphicsSettings?.MaxFPS ?? DEFAULT_FRAMERATE;
			let maxFPS = maxUnfocusedFPS === 0 ? maxFocusedFPS :
				maxFocusedFPS === 0 ? maxUnfocusedFPS :
				Math.min(maxUnfocusedFPS, maxFocusedFPS);
			if (TimerLastTime + estimateFrameDuration(maxFPS) > Timestamp) {
				GameAnimationFrameId = requestAnimationFrame(GameRun);
				return;
			}
		}

		let frameTime = 10000;
		if (Timestamp > 0) {
			frameTime = Timestamp - TimerLastTime;
		}

		// Increments the time from the last frame
		TimerRunInterval = Timestamp - TimerLastTime;
		TimerLastTime = Timestamp;
		CurrentTime = CurrentTime + TimerRunInterval;

		DrawProcess(Timestamp);
		ControllerProcess();
		TimerProcess();

		ServerSendQueueProcess();

		GameAnimationFrameId = requestAnimationFrame(GameRun);

		const showFPS = Player?.GraphicsSettings?.ShowFPS;
		if (Timestamp > 0 && showFPS) {
			DrawTextFit((Math.round(10000 / frameTime) / 10).toString(), 15, 12, 30, "white", "black");
		}
	} catch (e) {
		GameHandleError();
		throw e;
	}

}

/**
 * Main game running state, when in the background. Skips drawing if possible.
 * @param {number} Timestamp
 */
function GameRunBackground(Timestamp) {
	try {
		// Increments the time from the last frame
		TimerRunInterval = Timestamp - TimerLastTime;
		TimerLastTime = Timestamp;
		CurrentTime = CurrentTime + TimerRunInterval;

		if (CurrentCharacter == null && !ScreenIsLoading) {
			CurrentScreenFunctions.Run(Timestamp);
		}
		// Ignore gamepad when in the background
		TimerProcess();

		ServerSendQueueProcess();
	} catch (e) {
		GameHandleError();
		throw e;
	}
}

/**
 * When the user presses a key, we send the KeyDown event to the current screen if it can accept it
 * @param {KeyboardEvent} event
 */
function GameKeyDown(event) {
	KeyPress = event.keyCode || event.which;

	if (ScreenIsLoading) return;

	let handled = false;
	handleKeyDown: {
		if (ControllerIsActive() && ControllerSupportKeyDown(event)) {
			handled = true;
			break handleKeyDown;
		}

		if (CommonKey.IsPressed(event, "Escape")) {
			if (document.activeElement instanceof HTMLElement && !(document.activeElement === document.body || document.activeElement.id === "MainCanvas")) {
				document.activeElement.blur();
				handled = true;
				break handleKeyDown;
			} else if (CurrentScreenFunctions.Exit) {
				CurrentScreenFunctions.Exit();
				handled = true;
				break handleKeyDown;
			}
		}

		if (DialogKeyDown(event)) {
			handled = true;
			break handleKeyDown;
		}

		if (CurrentScreenFunctions.KeyDown && CurrentScreenFunctions.KeyDown(event)) {
			handled = true;
			break handleKeyDown;
		}
	}


	if (handled) {
		event.preventDefault();
		event.stopImmediatePropagation();
	}
	return handled;
}

function GameKeyUp(event) {
	if (ScreenIsLoading) return;
	if (StruggleMinigameIsRunning()) { return; }
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
	if (
		CommonIsMobile
		|| GameMouseIsDown
		|| event.button !== 0 // 0: Main button pressed, usually the left button or the un-initialized state
	) {
		return;
	}
	CommonMouseDown(event);
	GameMouseIsDown = true;
}

/**
 * If the user releases the mouse button, we fire the mouseup and click events for other screens
 * @param {MouseEvent} event
 */
function GameMouseUp(event) {
	if (
		CommonIsMobile
		|| !GameMouseIsDown
		|| event.button !== 0 // 0: Main button pressed, usually the left button or the un-initialized state
	) {
		return;
	}
	GameMouseMove(event, false);
	CommonMouseUp(event);
	CommonClick(event);
	GameMouseIsDown = false;
}

/**
 * If the user rolls the mouse wheel, we fire the mousewheel event for other screens
 * @type {MouseWheelEventListener}
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
	CommonClick(event);
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
function MainRun(Timestamp) {
	// This is a no-op now, only kept for compatibility
}
/** @deprecated */
function Click(event) { if (!CommonIsMobile) { CommonClick(event); } }
/** @deprecated */
function LoseFocus(event) { GameMouseLeave(event); }
