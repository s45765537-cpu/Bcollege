"use strict";

/**
 * @typedef {Document & {
 *   webkitFullscreenElement?: Element | null,
 *   webkitExitFullscreen?: () => Promise<void>,
 * }} FullscreenDocument
 * @typedef {Element & { webkitRequestFullscreen?: () => Promise<void> }} FullscreenHost
 */

/**
 * Fullscreen toggle button.
 * @namespace
 */
var Fullscreen = (function () {
	const buttonId = "bc-fullscreen-button";
	let loaded = false;

	/** @returns {Element | null} */
	function nativeElement() {
		return document.fullscreenElement
			|| /** @type {FullscreenDocument} */ (document).webkitFullscreenElement
			|| null;
	}

	function isStandalone() {
		return globalThis.matchMedia("(display-mode: standalone)").matches
			|| /** @type {Navigator & { standalone?: boolean }} */ (navigator).standalone === true;
	}

	function isNativeSupported() {
		const el = /** @type {FullscreenHost} */ (document.documentElement);
		return !!(el.requestFullscreen || el.webkitRequestFullscreen);
	}

	function isActive() {
		return !!nativeElement();
	}

	function isSettingEnabled() {
		const setting = Player?.GraphicsSettings?.ShowFullscreenButton;

		if (CurrentScreen === "Login") return true;

		return setting === "on" || (setting === "on_when_mobile" && CommonIsMobile);
	}

	function shouldShowButton() {
		return isSettingEnabled()
			&& (isActive() || (!isStandalone() && isNativeSupported()));
	}

	function updateButton() {
		const button = ElementWrap(buttonId);
		if (!button) return;

		const active = isActive();
		const label = InterfaceTextGet(active ? "FullscreenExit" : "FullscreenEnter");
		button.toggleAttribute("hidden", !shouldShowButton());
		button.setAttribute("aria-checked", String(active));
		button.setAttribute("aria-label", label);

		const tooltip = button.querySelector(".button-tooltip");
		if (tooltip) tooltip.textContent = label;

		ElementButton.SetImage(button, active ? "Icons/FullscreenExit.svg" : "Icons/FullscreenEnter.svg");
	}

	async function enter() {
		const el = /** @type {FullscreenHost} */ (document.documentElement);
		try {
			if (el.requestFullscreen)
				await el.requestFullscreen();
			else if (el.webkitRequestFullscreen)
				await el.webkitRequestFullscreen();
		} catch (error) {
			console.error("Fullscreen request failed:", error);
		}
	}

	async function exit() {
		try {
			if (!nativeElement()) return;
			if (document.exitFullscreen)
				await document.exitFullscreen();
			else
				await /** @type {FullscreenDocument} */ (document).webkitExitFullscreen?.();
		} catch (error) {
			console.error("Fullscreen exit failed:", error);
		}
	}

	async function toggle() {
		if (isActive())
			await exit();
		else
			await enter();
		updateButton();
	}

	function init() {
		if (loaded) return;
		loaded = true;

		if (!ElementWrap(buttonId)) {
			ElementButton.Create(
				buttonId,
				() => { CommonPromiseCatch(toggle()); },
				{
					noStyling: true,
					role: "checkbox",
					tooltip: InterfaceTextGet("FullscreenEnter"),
					image: "Icons/FullscreenEnter.svg",
				},
				{
					button: {
						classList: ["bc-fullscreen-button"],
						parent: document.body,
					},
				},
			);
		}

		document.addEventListener("fullscreenchange", updateButton);
		document.addEventListener("webkitfullscreenchange", updateButton);
		updateButton();
	}

	return {
		Init: init,
		UpdateButton: updateButton,
	};
})();
