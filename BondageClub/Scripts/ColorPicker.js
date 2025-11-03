"use strict";

/**
 * Callback to be executed upon exiting the color picker subscreen.
 * @type {null | ItemColorExitListener}
 */
let ColorPickerExitCallback = null;

// NOTE: Do not attach this one as a proper event listener as we need to be able to easily swap it
/**
 * The input callback to be executed upon color or opacity changes.
 * This callback should be responsible for propagating the updated element state to external variables (_e.g._ {@link ItemColorState}).
 * @type {null | ColorPickerInitOptions["onInput"]}
 */
let ColorPickerInputCallback = null;

/**
 * The default saved custom colors (see {@link GetDefaultSavedColors})
 * @type {HSVColor[]}
 */
var DefaultSavedColors = [];

/** The number of colors a player is allowed to save (see {@link DefaultSavedColors} and {@link PlayerCharacter.SavedColors}) */
const ColorPickerNumSaved = 18; //

/**
 * Parameters to be passed to {@link ColorPickerLoad}.
 * Do _not_ modify directly; use {@link ColorPickerInit} instead.
 * @type {null | Readonly<ColorPickerInitOptions>}
 */
let ColorPickerInitOptions = null;

/**
 * Helper to guard for TouchEvents
 * @param {Event} event
 * @returns {event is TouchEvent}
 */
function isTouchEvent(event) {
	// Disabled for desktop Safari has no need for touch events
	// eslint-disable-next-line
	return window.TouchEvent && event instanceof TouchEvent;
}

/**
 * Gets the coordinates of the current event on the canvas
 * @deprecated
 * @param {MouseEvent|TouchEvent} Event - The touch/mouse event
 * @returns {{X: number, Y: number}} - Coordinates of the click/touch event on the canvas
 */
function ColorPickerGetCoordinates(Event) {
	return { X: 0, Y: 0 };
}

/**
 * Hide the color picker from the canvas.
 * @return {void} - Nothing
 */
function ColorPickerHide() {
	ColorPickerUnload();
}

/**
 * Draws the color picker on the canvas
 * @param {number} X - Coordinate on the X axis
 * @param {number} Y - Coordinate on the Y axis
 * @param {number} Width - Width of the color picker
 * @param {number} Height - Height of the color picker
 * @param {HTMLInputElement} Src - Input element that can contain a hex color code
 * @param {ItemColorExitListener} [Callback] - Callback to execute when the selected color changes
 * @returns {void} - Nothing
 * @deprecated
 */
function ColorPickerDraw(X, Y, Width, Height, Src, Callback) {
}

/**
 * Parses a hex color code and converts it to a HSV object
 * @param {HexColor} Color - The RGB or RGBA hex color code
 * @param {HSVColor} [DefaultHSV] - The HSV to output if the color is not valid
 * @returns {HSVColor} - The HSV color from a hex color code
 * @see {@link https://gist.github.com/mjackson/5311256}
 */
function ColorPickerCSSToHSV(Color, DefaultHSV) {
	Color = Color || "#FFFFFF";
	var M = Color.match(/^#(([0-9a-f]{3})|([0-9a-f]{6})|([0-9a-f]{8}))$/i);
	var R, G, B;
	if (M) {
		var GRP = M[1];
		if (GRP.length == 3) {
			R = Number.parseInt(GRP[0] + GRP[0], 16) / 255;
			G = Number.parseInt(GRP[1] + GRP[1], 16) / 255;
			B = Number.parseInt(GRP[2] + GRP[2], 16) / 255;
		} else {
			R = Number.parseInt(GRP[0] + GRP[1], 16) / 255;
			G = Number.parseInt(GRP[2] + GRP[3], 16) / 255;
			B = Number.parseInt(GRP[4] + GRP[5], 16) / 255;
		}
	}

	if (isNaN(R) || isNaN(G) || isNaN(B)) {
		return DefaultHSV ? DefaultHSV : { H: 0, S: 0, V: 1 };
	}

	var Max = Math.max(R, G, B);
	var Min = Math.min(R, G, B);
	var D = Max - Min;
	var H = 0;
	var S = (Max == 0) ? 0 : D / Max;
	var V = Max;

	if (D == 0) {
		H = 0;
	} else {
		if (Max == R) {
			H = (G - B) / D + (G < B ? 6 : 0);
		} else if (Max == G) {
			H = (B - R) / D + 2;
		} else {
			H = (R - G) / D + 4;
		}
		H /= 6;
	}

	return { H: H, S: S, V: V };
}

/**
 * Converts a HSV object into a valid hex code to use in the css
 * @param {HSVColor} HSV - HSV value to convert
 * @returns {HexColor} - Hex color code corresponding to the given HSV
 */
function ColorPickerHSVToCSS(HSV) {
	var R, G, B;
	var H = HSV.H, S = HSV.S, V = HSV.V;
	var I = Math.floor(H * 6);
	var F = H * 6 - I;
	var P = V * (1 - S);
	var Q = V * (1 - F * S);
	var T = V * (1 - (1 - F) * S);

	switch (I % 6) {
		case 0: R = V; G = T; B = P; break;
		case 1: R = Q; G = V; B = P; break;
		case 2: R = P; G = V; B = T; break;
		case 3: R = P; G = Q; B = V; break;
		case 4: R = T; G = P; B = V; break;
		case 5: R = V; G = P; B = Q; break;
	}

	var RS = Math.floor(R * 255).toString(16).toUpperCase().padStart(2, "0");
	var GS = Math.floor(G * 255).toString(16).toUpperCase().padStart(2, "0");
	var BS = Math.floor(B * 255).toString(16).toUpperCase().padStart(2, "0");
	return "#" + RS + GS + BS;
}

/**
 * Returns the array of default colors for the list of favorite colors.
 * @returns {HSVColor[]} - Array of default colors
 */
function GetDefaultSavedColors() {

	if (DefaultSavedColors.length == 0) { //sets custom default values if not set yet
		DefaultSavedColors[0] = {H: 0, S: 0, V: 0.12549019607843137};
		DefaultSavedColors[1] = {H: 0, S: 0, V: 0.5019607843137255};
		DefaultSavedColors[2] = {H: 0, S: 0, V: 0.7333333333333333};
		DefaultSavedColors[3] = {H: 0, S: 0.24705882352941172, V: 0.6666666666666666};
		DefaultSavedColors[4] = {H: 0.3333333333333333, S: 0.24705882352941172, V: 0.6666666666666666};
		DefaultSavedColors[5] = {H: 0.6666666666666666, S: 0.24705882352941172, V: 0.6666666666666666};
		DefaultSavedColors[6] = {H: 0.16666666666666666, S: 0.24705882352941172, V: 0.6666666666666666};
		DefaultSavedColors[7] = {H: 0.5, S: 0.24705882352941172, V: 0.6666666666666666};
		DefaultSavedColors[8] = {H: 0.8333333333333334, S: 0.24705882352941172, V: 0.6666666666666666};
		DefaultSavedColors[9] = {H: 0, S: 0.7500000000000001, V: 0.8};
		DefaultSavedColors[10] = {H: 0.3333333333333333, S: 0.7500000000000001, V: 0.8};
		DefaultSavedColors[11] = {H: 0.6666666666666666, S: 0.7500000000000001, V: 0.8};
		DefaultSavedColors[12] = {H: 0.16666666666666666, S: 0.7500000000000001, V: 0.8};
		DefaultSavedColors[13] = {H: 0.5, S: 0.7500000000000001, V: 0.8};
		DefaultSavedColors[14] = {H: 0.8333333333333334, S: 0.7500000000000001, V: 0.8};
		DefaultSavedColors[15] = {H: 0, S: 0, V: 0.12549019607843137};
		DefaultSavedColors[16] = {H: 0, S: 0, V: 0.5019607843137255};
		DefaultSavedColors[17] = {H: 0, S: 0, V: 0.7333333333333333};
		DefaultSavedColors[18] = {H: 0, S: 0.24705882352941172, V: 0.6666666666666666};

		for (let i = 0; i < ColorPickerNumSaved; i++) { //fill rest of slots with white
			if (typeof DefaultSavedColors[i] != "object") {
				DefaultSavedColors[i] = {H: 0, S: 0, V: 1};
			}
		}
	}

	var SavedColors = [];
	for (let i = 0; i < ColorPickerNumSaved; i++) {
		SavedColors[i] = Object.assign({}, DefaultSavedColors[i]);
	}
	return SavedColors;
}

/** Namespace for constructing and managing color pickers */
var ColorPicker = {
	/**
	 * Element IDs for the {@link ColorPicker} namespace.
	 * @readonly
	 */
	ids: Object.freeze({
		root: "color-picker",
	}),

	/**
	 * The default shape of the color picker screen
	 * @readonly
	 * @type {Readonly<RectTuple>}
	 */
	defaultShape: Object.freeze([1200, 15, 800, 970]),

	/**
	 * A weakmap mapping color picker root elements to their respective {@link ScreenResizeHandler} shape
	 * @readonly
	 * @private
	 * @type {WeakMap<Element, Readonly<RectTuple>>}
	 */
	_shapes: new WeakMap,

	/**
	 * @readonly
	 * @satisfies {Record<string, (this: HTMLElement, ev: Event) => any>}
	 */
	eventListeners: {
		/** @type {(this: HTMLInputElement | HTMLColorTintElement, ev: InputEvent) => void} */
		inputColor: function (ev) {
			if (this.validity.valid) {
				this.closest("fieldset")?.dispatchEvent(new CustomEvent("input", { detail: { source: this.name } }));
			}
		},

		/** @type {(this: HTMLInputElement | HTMLColorTintElement, ev: FocusEvent) => void} */
		blurColor: function (ev) {
			this.reportValidity();
		},

		/**
		 * Perform a color or opacity change originating from manually dispatched events by the underlying inputs.
		 * Execute the logic on the fieldset because the states of the underlying inputs are _very_ strongly intertwined.
		 *
		 * See {@link ColorPicker.blurColor.inputItemColor} for the (default) callback responsible for coupling the input changes to `ItemColor...` variable states.
		 * @type {(this: HTMLFieldSetElement, ev: Event) => void}
		 */
		inputFieldset: function (ev) {
			const hueInput = /** @type {null | HTMLInputElement} */(this.elements.namedItem("hue"));
			const opacityInput = /** @type {null | HTMLInputElement} */(this.elements.namedItem("opacity"));
			const tintInput = /** @type {HTMLColorTintElement | null} */(this.elements.namedItem("tint"));
			const outputInput = /** @type {null | HTMLInputElement} */(this.elements.namedItem("output"));
			if ([hueInput, opacityInput, tintInput, outputInput].some(i => i == null || !i.validity.valid)) {
				ev.stopImmediatePropagation();
				return;
			} else if (!(ev instanceof CustomEvent)) {
				return;
			}

			switch (ev.detail.source) {
				case "output": {
					if (!CommonIsColor(outputInput.value, { allowAlpha: true })) {
						break;
					}

					const opacityMin = CommonParseInt(opacityInput.min, 10) ?? 0;
					const opacityMax = CommonParseInt(opacityInput.max, 10) ?? Infinity;
					const opacityCandidate = CommonParseInt(outputInput.value.slice(7), 16);
					if (opacityCandidate != null && !opacityInput.disabled) {
						opacityInput.valueAsNumber = CommonClamp(opacityCandidate, opacityMin, opacityMax);
					}

					const rgb = outputInput.value.slice(0, 7);
					const hsv = ColorPickerCSSToHSV(rgb);
					hueInput.valueAsNumber = Math.round(hsv.H * 360);
					this.style.setProperty("--hue", hueInput.value);
					tintInput.value = rgb;
					break;
				}
				case "opacity":
				case "tint":
				case "hue": {
					const hsv = {
						H: hueInput.validity.valid ? hueInput.valueAsNumber / 360 : 0,
						S: tintInput.validity.valid ? tintInput.saturation / 255 : 0,
						V: tintInput.validity.valid ? tintInput.brightness / 255 : 1,
					};

					// If we're dealing with an `opacity`-triggered input event:
					// (1 Only modify the output textbox if it is backed by valid hex color (so no `Default`, `White`, etc)
					// (2 Do not touch the hue or tint inputs, as this could potentially erase aforementioned non-hex colors
					if (ev.detail.source !== "opacity" || CommonIsColor(outputInput.value.slice(0, 7))) {
						// Simplify RGBA to RGB when fully opaque
						const opacity = opacityInput.validity.valid && opacityInput.valueAsNumber < 255 ? opacityInput.valueAsNumber.toString(16).toUpperCase().padStart(2, "0") : "";
						const rgb = ColorPickerHSVToCSS(hsv);
						outputInput.value = `${rgb}${opacity}`;
						if (ev.detail.source === "opacity") {
							break;
						}
					}

					this.style.setProperty("--hue", hueInput.value);
					tintInput.valueAsHSV = hsv;
					hueInput.valueAsNumber = Math.round(hsv.H * 360);
					break;
				}
			}
			ColorPickerInputCallback?.(this, ev);
		},

		/**
		 * Load a saved color or revert back to the item's initial color
		 * @type {(this: HTMLInputElement, ev: Event) => void}
		 */
		changeRadio: function (ev) {
			/** @type {null | HTMLFieldSetElement} */
			const group = this.closest("fieldset[name='color-picker']");
			const outputInput = /** @type {null | HTMLInputElement} */(group?.elements.namedItem("output"));
			const saveButton = /** @type {null | HTMLButtonElement} */(group?.elements.namedItem("save"));
			if (!group || !outputInput || !saveButton) {
				ev.stopImmediatePropagation();
				return;
			}

			if (this.value) {
				// Switch to a saved color
				ColorPicker.setColor(group, { colorString: this.value });
				saveButton.disabled = false;
			} else {
				// The first option; reset to the initial color
				let colorString = "";
				if (ItemColorState && ItemColorItem) {
					// The subscreen is backed by an actual item and proper color state: the default colors can restored accurately
					ItemColorPickerIndices.forEach(i => {
						ItemColorState.colors[i] = ItemColorState.initialColors[i];
						ItemColorItem.Color[i] = ItemColorState.initialColors[i];
					});

					const colors = ItemColorPickerIndices.map(i => ItemColorState.colors[i] ?? ItemColorState.defaultColors[i]);
					colorString = (colors.length >= 1 && colors.every(i => i === colors[0])) ? colors[0] : "";
				} else {
					// The subscreen lacks an underlying item or proper color state: the default colors can restored approximately
					// Note that this approximation does become exact when a single layer is being modified or when all layers happen to have the same default color
					colorString = CommonIsColor(outputInput.defaultValue, { allowAlpha: true }) ? outputInput.defaultValue.slice(0, 7) : outputInput.defaultValue;
				}

				ColorPicker.setColor(group, { colorString });
				if (ItemColorCharacter) {
					CharacterLoadCanvas(ItemColorCharacter);
				}
				saveButton.disabled = true;
			}

			// Change the background color of the saved color output element
			const menu = this.closest("[role='menu']");
			/** @type {null | HTMLOutputElement} */
			const output = document.querySelector(`output[for~="${menu?.id}"]`);
			if (output) {
				output.replaceChildren(...Array.from(this.labels).map(i => i.textContent.replace(" ", "")));
				output.style.backgroundColor = this.value;
			}
		},

		/**
		 * Ensure that mouse clicks close the saved color menu.
		 * Put this here rather than in `change` in order to prevent keyboard navigation from auto-closing the menu upon triggering a change.
		 * @type {(this: HTMLInputElement, ev: PointerEvent) => void}
		 */
		pointerupRadio: function (ev) {
			this.blur();
		},

		/**
		 * Ensure that `Enter` and `Space` key presses close the saved color menu while focused.
		 * @type {(this: HTMLInputElement, ev: KeyboardEvent) => void}
		 */
		keydownRadio: function (ev) {
			if (CommonKey.IsPressed(ev, "Enter") || CommonKey.IsPressed(ev, " ")) {
				this.blur();
			}
		},

		/**
		 * Save the current RGB color to the player's saved color list
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickSaveColor: function (ev) {
			/** @type {null | HTMLFieldSetElement} */
			const group = this.closest("fieldset[name='color-picker']");
			const colorInput = /** @type {null | HTMLInputElement} */(group?.elements.namedItem("output"));
			const savedColorOutput = /** @type {null | HTMLOutputElement} */(group?.elements.namedItem("saved-colors-output"));
			const savedColorGroup = /** @type {null | HTMLFieldSetElement} */(group?.elements.namedItem("saved-colors-group"));
			const savedColorInput = /** @type {null | HTMLInputElement} */(savedColorGroup?.querySelector("input:checked"));
			if (
				!colorInput?.validity.valid
				|| !savedColorOutput
				|| !savedColorGroup
				|| !savedColorInput
			) {
				return;
			}

			const index = Array.from(savedColorGroup.querySelectorAll(`input[name='${savedColorInput.name}']`)).indexOf(savedColorInput);
			if (index === -1) {
				return;
			}

			if (!CommonIsColor(colorInput.value, { allowAlpha: true })) {
				return;
			}
			const rgb = colorInput.value.slice(0, 7);

			savedColorInput.value = rgb;
			savedColorInput.labels.forEach(el => {
				el.style.backgroundColor = rgb;
				el.querySelector(".checkbox-label").replaceChildren(`${index.toString().padStart(2, " ")}: ${rgb}`);
			});

			savedColorOutput.style.backgroundColor = rgb;
			savedColorOutput.replaceChildren(`${index.toString().padStart(2, " ")}:${rgb}`);

			Player.SavedColors[index - 1] = ColorPickerCSSToHSV(rgb);
		},

		/**
		 * Exit the screen while triggering a save.
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickExit: function (ev) {
			const root = /** @type {null | HTMLElement} */(this.closest(".screen"));
			const state = root ? ColorPicker.getColor(root) : null;
			const save = this.name === "accept";
			if (!save) {
				ItemColorRevert("initial");
			}
			if (root && state) {
				ColorPickerExitCallback?.(state, save, root);
			} else {
				console.error("uhoh");
			}
			ColorPickerUnload();
		},

		/**
		 * Revert to the item's default color and opacity.
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickReset: function (ev) {
			if (ItemColorState) {
				ItemColorRevert("default");
			} else {
				const root = this.closest(".screen");
				/** @type {null | HTMLFieldSetElement} */
				const fieldset = root?.querySelector("fieldset[name='color-picker']");
				for (const e of fieldset.elements) {
					if (e instanceof HTMLInputElement || e instanceof HTMLColorTintElement) {
						e.value = e.defaultValue;
					}
				}
			}
			ColorPickerReload({ root: this.closest(".screen")?.id });
		},

		/**
		 * The default input listener responsible for coupling any slider input changes to the states of `ColorPicker...` variables.
		 * @type {ColorPickerInitOptions["onInput"]}
		 */
		inputItemColor: function (elem, ev) {
			const opacityInput = /** @type {null | HTMLInputElement} */(elem.elements.namedItem("opacity"));
			const outputInput = /** @type {null | HTMLInputElement} */(elem.elements.namedItem("output"));
			if (!opacityInput || !outputInput) {
				ev.stopImmediatePropagation();
				return;
			}

			if (CommonIsColor(outputInput.value, { allowAlpha: true })) {
				const colorValue = outputInput.value.slice(0, 7);
				ItemColorPickerIndices.forEach(i => {
					ItemColorState.colors[i] = colorValue;
					ItemColorItem.Color[i] = colorValue;
				});
			} else if (ItemColorItem.Asset.Group.ColorSchema.includes(outputInput.value)) {
				ItemColorPickerIndices.forEach(i => {
					ItemColorState.colors[i] = outputInput.value;
					ItemColorItem.Color[i] = outputInput.value;
				});
			}

			if (ItemColorState.editOpacity) {
				for (const [i, layer] of ItemColorPickerLayers.entries()) {
					const opacityValue = CommonClamp(opacityInput.valueAsNumber / 255, layer.MinOpacity, layer.MaxOpacity);
					ItemColorState.opacity[i] = opacityValue;
					ItemColorItem.Property.Opacity[i] = opacityValue;
				}
			}

			CharacterLoadCanvas(ItemColorCharacter);
		},

		/**
		 * Focusout listener for the saved color menu. Automatically closes the menu upon losing focus.
		 * @type {(this: HTMLFieldSetElement, ev: FocusEvent) => void}
		 */
		focusoutFieldset: function (ev) {
			const menuID = this.closest("[role='menu']")?.id;
			/** @type {null | HTMLButtonElement} */
			const controller = document.querySelector(`button[aria-controls~="${menuID}"]`);
			if (!controller) {
				ev.stopImmediatePropagation();
				return;
			}

			const target = ev.relatedTarget;
			if (
				target instanceof Element
				&& (this.contains(target) || Array.from(controller.labels).some(el => el.contains(target)))
			) {
				return;
			} else if (controller.getAttribute("aria-expanded") === "true") {
				controller.click();
			}
		},

		/**
		 * Click listener for opening the saved color menu.
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickComboBox: function (ev) {
			const hidden = this.getAttribute("aria-expanded") === "false";
			const elems = this.getAttribute("aria-controls")?.split(" ").map(i => document.getElementById(i)).filter(Boolean) ?? [];
			if (elems.length === 0) {
				ev.stopImmediatePropagation();
				return;
			}

			elems.forEach(e => e.toggleAttribute("hidden", hidden));
			if (!hidden) {
				/** @type {HTMLElement} */
				const input = (
					CommonFindMap(elems, (el) => el.querySelector("input:checked"))
					?? CommonFindMap(elems, (el) => el.querySelector("input"))
					?? elems[0]
				);
				input.focus();
			}
		},

		/**
		 * Blur the label children upon receiving focus
		 * @type {(this: HTMLElement, ev: FocusEvent) => void}
		 */
		focusComboLabel: function (ev) {
			// The label children are only able to receive focus due to a technicality in `focusoutFieldset`,
			// as they otherwise wouldn't appear in `FocusEvent.relatedTarget`
			this.blur();
		},
	},

	/**
	 * @param {null | string} id
	 * @param {readonly { value: string, label: string }[]} optionList
	 * @returns {HTMLElement}
	 */
	_getDropdownWidget(id, optionList) {
		id ??= ElementGenerateID();
		const comboboxID = `${id}-combobox`;
		return ElementCreate({
			tag: "div",
			classList: ["color-picker-dropdown"],
			attributes: { role: "group" },
			children: [
				ElementButton.Create(
					comboboxID,
					ColorPicker.eventListeners.clickComboBox,
					{ role: "combobox", ariaControls: id, ariaHasPopup: "menu", name: "saved-colors-combobox" },
				),
				{
					tag: "output",
					attributes: { name: "saved-colors-output", for: id, tabindex: -1 },
					children: ["-"],
					eventListeners: {
						focus: ColorPicker.eventListeners.focusComboLabel,
					},
				},
				{
					tag: "div",
					attributes: { role: "menu", id, hidden: true },
					children: [
						{
							tag: "fieldset",
							classList: ["scroll-box"],
							attributes: { name: "saved-colors-group", role: "radiogroup" },
							eventListeners: { focusout: ColorPicker.eventListeners.focusoutFieldset },
							children: [
								{ tag: "legend", children: [ItemColorText.get("SavedColors")] },
								ElementCheckbox.CreateLabelled(
									null, "-", ColorPicker.eventListeners.changeRadio,
									{ checked: true, type: "radio", name: "saved-colors", value: "" },
									{
										checkbox: {
											attributes: { role: "menuitemradio" },
											eventListeners: { pointerup: ColorPicker.eventListeners.pointerupRadio, keydown: ColorPicker.eventListeners.keydownRadio },
										},
										label: { style: { "text-align": "center" } },
										container: { attributes: { tabindex: -1 } },
									},
								),
								{ tag: "hr" },
								...optionList.map(({ value, label }) => {
									return ElementCheckbox.CreateLabelled(
										null, label, ColorPicker.eventListeners.changeRadio,
										{ type: "radio", name: "saved-colors", value },
										{
											checkbox: {
												attributes: { role: "menuitemradio" },
												eventListeners: { pointerup: ColorPicker.eventListeners.pointerupRadio, keydown: ColorPicker.eventListeners.keydownRadio },
											},
											container: { attributes: { tabindex: -1 }, style: { "background-color": value } },
										},
									);
								}),
							],
						},
					],
				},
			],
		});
	},

	/**
	 * Construct a new fieldset with the main color input elements
	 * @param {null | string} id - The ID of the element
	 * @param {null | Pick<ColorPickerInitOptions, "colorState" | "onInput">} options
	 * @returns {HTMLFieldSetElement} - The newly created color picker fieldset containing all interactive sliders and such
	 */
	create(id, options=null) {
		options ??= {};
		id ??= ElementGenerateID();
		const hueID = ElementGenerateID();
		const opacityID = ElementGenerateID();
		const tintID = ElementGenerateID();
		const outputID = ElementGenerateID();
		const datalistID = ElementGenerateID();
		const dropdownID = ElementGenerateID();

		const defaultColors = GetDefaultSavedColors().map((hsvBackup, i) => {
			const hsv = Player.SavedColors[i] ?? hsvBackup;
			const rgb = ColorPickerHSVToCSS(hsv);
			return { value: rgb, label: `${(i + 1).toString().padStart(2, " ")}: ${rgb}` };
		});

		let ret = /** @type {null | HTMLFieldSetElement} */(document.getElementById(id));
		if (!ret) {
			ret = ElementCreate({
				tag: "fieldset",
				attributes: { id, name: "color-picker" },
				style: { "--hue": "0" },
				classList: ["color-picker"],
				eventListeners: {
					input: ColorPicker.eventListeners.inputFieldset,
				},
				children: [
					{
						tag: "input",
						attributes: {
							id: hueID,
							type: "range",
							size: 0,
							min: 0,
							max: 360,
							value: 0,
							name: "hue",
							"aria-label": "hue",
							"aria-controls": `${tintID} ${opacityID}`,
						},
						classList: ["hue-input"],
						eventListeners: {
							input: ColorPicker.eventListeners.inputColor,
							blur: ColorPicker.eventListeners.blurColor,
						},
					},
					{
						tag: "div",
						classList: ["opacity-background"],
						children: [
							{
								tag: "div",
								classList: ["opacity-color-background"],
								children: [
									{
										tag: "input",
										attributes: { id: opacityID, type: "range", size: 0, min: 0, max: 255, value: 255, name: "opacity", "aria-label": "opacity" },
										classList: ["opacity-input"],
										eventListeners: {
											input: ColorPicker.eventListeners.inputColor,
											blur: ColorPicker.eventListeners.blurColor,
										},
									},
								],
							},
						],
					},
					{
						tag: "bc-tint-input",
						attributes: { id: tintID, value: "#FFFFFF", name: "tint", "aria-label": "tint" },
						classList: ["tint-input"],
						eventListeners: {
							input: ColorPicker.eventListeners.inputColor,
							blur: ColorPicker.eventListeners.blurColor,
						},
					},
					{
						tag: "label",
						children: [
							{ tag: "span", children: ["RGB(A)"] },
							{
								tag: "output",
								attributes: {
									id: outputID,
									for: `${tintID} ${opacityID} ${hueID}`,
								},
								children: [
									{
										tag: "input",
										attributes: {
											type: "text",
											maxlength: 9,
											size: 8,
											value: "",
											spellcheck: "false",
											name: "output",
											placeholder: "#RRGGBB",
											"aria-controls": `${tintID} ${opacityID} ${hueID}`,
											list: datalistID,
										},
										eventListeners: {
											input: ColorPicker.eventListeners.inputColor,
											blur: ColorPicker.eventListeners.blurColor,
										},
										children: [{
											tag: "datalist",
											attributes: { id: datalistID },
										}],
									},
								],
							},
						],
					},
					{
						tag: "label",
						children: [
							{ tag: "span", children: [ItemColorText.get("SavedColors")] },
							ColorPicker._getDropdownWidget(dropdownID, defaultColors),
						],
						attributes: { tabindex: -1 },
						eventListeners: {
							focus: ColorPicker.eventListeners.focusComboLabel,
						},
					},
					ElementButton.Create(
						null,
						ColorPicker.eventListeners.clickSaveColor,
						{ label: ItemColorText.get("SaveColor"), name: "save", disabled: true, ariaControls: dropdownID },
					),
				],
			});
		}

		ColorPickerInputCallback = options.onInput;
		if (options.colorState) {
			ColorPickerReload({ root: ret, colorState: options.colorState });
		}
		return ret;
	},

	/**
	 * Set the color and/or opacity of the passed color picker screen
	 * @param {ElementHelp.ElementOrId} root - The color picker screen or its ID
	 * @param {{ readonly colorString?: string, readonly hsv?: Readonly<HSVColor>, readonly opacity?: number }} value - The passed color (be it as string or HSV object) and opacity
	 * @param {null | { overrideEditOpacity?: boolean }} options
	 */
	setColor(root, value, options=null) {
		options ??= {};
		const screen = ElementWrap(root);
		const fieldset = /** @type {null | HTMLFieldSetElement} */(!screen || screen.matches("fieldset[name='color-picker']") ? screen : screen.querySelector("fieldset[name='color-picker']"));
		if (!fieldset) {
			return;
		}

		const outputInput = /** @type {null | HTMLInputElement} */(fieldset.elements.namedItem("output"));
		const hueInput = /** @type {null | HTMLInputElement} */(fieldset.elements.namedItem("hue"));
		const tintInput = /** @type {HTMLColorTintElement | null} */(fieldset.elements.namedItem("tint"));
		const opacityInput = /** @type {null | HTMLInputElement} */(fieldset.elements.namedItem("opacity"));
		if ([outputInput, hueInput, tintInput, opacityInput].some(i => i == null)) {
			return;
		}

		// Parse the color (if provided) and identify whether we're dealing with hexcodes or not (Default, White, etc.)
		let colorOutputText = "";
		let colorIsHex = true;
		/** @type {null | HSVColor} */
		let hsv = null;
		if (value.colorString != null) {
			const color = value.colorString;
			hsv = ColorPickerCSSToHSV(color);
			colorIsHex = CommonIsColor(color, { allowAlpha: true });
			colorOutputText = colorIsHex ? color.slice(0, 7).toUpperCase() : color;
		} else if (value.hsv) {
			hsv = { ...value.hsv };
			colorIsHex = true;
			colorOutputText = ColorPickerHSVToCSS(hsv);
		} else {
			colorIsHex = CommonIsColor(outputInput.value, { allowAlpha: true });
			colorOutputText = colorIsHex ? outputInput.value.slice(0, 7).toUpperCase() : outputInput.value;
		}

		// Parse the opacities
		/** @type {null | number} */
		let opacity = null;
		if (CommonIsFinite(value.opacity, 0, 1)) {
			opacity = Math.round(value.opacity * 255);
		} else if (CommonIsColor(value.colorString, { allowAlpha: true }) && value.colorString.length > 7) {
			const opacityCandidate = CommonParseInt(value.colorString.slice(7, 9), 16);
			if (CommonIsInteger(opacityCandidate, 0, 255)) {
				opacity = opacityCandidate;
			}
		}

		if (opacity != null) {
			const opacityMin = CommonParseInt(opacityInput.min) ?? 0;
			const opacityMax = CommonParseInt(opacityInput.max) ?? 255;
			opacity = CommonClamp(opacity, opacityMin, opacityMax);
		}

		if (hsv != null) {
			hueInput.valueAsNumber = CommonClamp(Math.round(hsv.H * 360), 0, 360);
			tintInput.valueAsHSV = hsv;
			fieldset.style.setProperty("--hue", hueInput.value);
		}

		if (opacity != null && (!opacityInput.disabled || options.overrideEditOpacity)) {
			// Only create an RGBA code when not fully opaque and when the color is a hexcode (so no Default, White, etc.)
			if (opacity !== 255 && colorIsHex) {
				colorOutputText += opacity.toString(16).padStart(2, "0").toUpperCase();
			}
			opacityInput.valueAsNumber = opacity;
		}

		outputInput.value = colorOutputText;
		fieldset.dispatchEvent(new CustomEvent("input", { detail: { source: outputInput.name } }));
	},

	/**
	 * Get the color and opacity of the passed color picker screen
	 * @param {ElementHelp.ElementOrId} root - The color picker screen or its ID
	 * @returns {null | ItemColorExitState}
	 */
	getColor(root) {
		const screen = ElementWrap(root);
		if (!screen) {
			return null;
		}

		/** @type {ItemColorExitState} */
		let state;
		if (ItemColorState) {
			// Plan A: the color picker is backed by an `ItemColorState`
			const layerIndices = Array.from(ItemColorPickerLayers.keys());
			state = {
				colors: ItemColorPickerIndices.map(i => ItemColorState.colors[i]),
				opacity: layerIndices.map(i => ItemColorState.opacity[i]),
				initialColors: ItemColorPickerIndices.map(i => ItemColorState.initialColors[i]),
				initialOpacity: layerIndices.map(i => ItemColorState.initialOpacity[i]),
				defaultColors: [...ItemColorState.defaultColors],
				defaultOpacity: [...ItemColorState.defaultOpacity],
				editOpacity: ItemColorState.editOpacity,
			};
		} else {
			// Plan B: There's no `ItemColorState`; directly extract values and initial values from the input elements
			/** @type {null | HTMLFieldSetElement} */
			const fieldset = screen?.querySelector("fieldset[name='color-picker']");
			const opacityInput = /** @type {null | HTMLInputElement} */(fieldset.elements.namedItem("opacity"));
			const outputInput = /** @type {null | HTMLInputElement} */(fieldset.elements.namedItem("output"));

			const initialOpacity = (opacityInput ? CommonParseInt(opacityInput.defaultValue) : null) ?? 255;
			let initialColor = (outputInput ? outputInput.defaultValue : "") || "Default";
			if (CommonIsColor(initialColor, { allowAlpha: true })) {
				initialColor = initialColor.slice(0, 7); // Remove the alpha component
			}

			const opacity = opacityInput?.validity.valid ? opacityInput.valueAsNumber : initialOpacity;
			let color = outputInput?.validity.valid ? outputInput.value : initialColor;
			if (CommonIsColor(color, { allowAlpha: true })) {
				color = color.slice(0, 7); // Remove the alpha component
			}

			state = {
				colors: [color],
				opacity: [opacity / 255],
				initialColors: [initialColor],
				initialOpacity: [initialOpacity / 255],
				defaultColors: [initialColor],
				defaultOpacity: [initialOpacity / 255],
				editOpacity: (opacityInput?.disabled ?? true) == false,
			};
		}
		return state;
	},

	/**
	 * Toggle the `disabled` state of the passed color picker using {@link Element.toggleAttribute}-like semantics.
	 * @param {ElementHelp.ElementOrId} root - The color picker screen or its ID
	 * @param {null | boolean} force - Toggle the `disabled` attributes if unspecified or, if a boolean is passed, force the provided value
	 * @returns {boolean} - The new `disabled` state
	 */
	toggleDisabled(root, force=null) {
		root = ElementWrap(root);
		if (!root) {
			return;
		}

		const fieldset = /** @type {null | HTMLFieldSetElement} */(root.matches("fieldset[name='color-picker']") ? root : root.querySelector("fieldset[name='color-picker']"));
		const disabled = force ?? !fieldset.disabled;
		fieldset.disabled = disabled;

		// Also disable the accept and reset buttons
		const menubarButtons = root.closest(".screen")?.querySelectorAll("[role='menuitem'][name='reset'], [role='menuitem'][name='accept']");
		menubarButtons.forEach(button => button.setAttribute("aria-disabled", disabled.toString()));
		return disabled;
	},
};

/**
 * Call {@link ColorPickerLoad} with the passed parameters and perform a resize.
 * @param {ColorPickerInitOptions} options - The load parameters
 * @returns {Promise<HTMLElement>} - The root element of the color picker subscreen
 */
async function ColorPickerInit(options=null) {
	options ??= {};
	options.reset ??= true;
	ColorPickerInitOptions = options;
	await ColorPickerLoad();
	ColorPickerInitOptions = null;
	ColorPickerResize(true);
	return ElementWrap(options.root ?? ColorPicker.ids.root);
}

/** @type {ScreenLoadHandler} */
function ColorPickerLoad() {
	const options = ColorPickerInitOptions ?? {};
	let root = ElementWrap(options.root ?? ColorPicker.ids.root);
	if (root) {
		root.toggleAttribute("hidden", false);
		ColorPickerReload(options);
		return;
	}

	const colorFieldset = ColorPicker.create(null, { onInput: options.onInput ?? ColorPicker.eventListeners.inputItemColor });
	root = ElementDOMScreen.getTemplate(ColorPicker.ids.root, {
		menubarButtons: [
			ElementButton.Create(
				null, ColorPicker.eventListeners.clickExit,
				{ image: "./Icons/Accept.png", tooltip: ItemColorText.get("Accept"), name: "accept", tooltipPosition: "left" },
			),
			ElementButton.Create(
				null, ColorPicker.eventListeners.clickExit,
				{ image: "./Icons/Cancel.png", tooltip: ItemColorText.get("Cancel"), name: "cancel", tooltipPosition: "left" },
			),
			ElementButton.Create(
				null, ColorPicker.eventListeners.clickReset,
				{ image: "./Icons/Reset.png", tooltip: ItemColorText.get("Reset"), name: "reset", tooltipPosition: "left" },
			),
		],
		mainContent: [colorFieldset],
		parent: document.body,
	});
	colorFieldset.setAttribute("aria-labelledby", root.querySelector("h1")?.id ?? "");
	ColorPickerReload(options);
}

/**
 * Reload and refresh the color picker based on the current item color data.
 * @param {null | ColorPickerInitOptions} options
 * @returns {null | HTMLElement} The paseed root element
 */
function ColorPickerReload(options=null) {
	options ??= {};
	if (!options.colorState && !(ItemColorState && ItemColorCharacter)) {
		return null;
	}

	const root = ElementWrap(options.root ?? ColorPicker.ids.root);
	if (!root) {
		return null;
	}

	if (options.onExit) {
		ColorPickerExitCallback = options.onExit;
	} else if (options.reset) {
		ColorPickerExitCallback = null;
	}

	if (options.heading) {
		ElementDOMScreen.setHeading(root, options.heading);
	} else if (options.reset) {
		ElementDOMScreen.setHeading(root, []);
	}

	// Grab all colors and opacity and identify a suitable "singular" value for the inputs
	// When dealing with items or color groups (_i.e._ a set with potentially multiple distinct colors/opacities) the best you can do is attempt to pick the value that is the _least_ bullshit
	let singularOpacity = 0;
	let singularColor = "";
	if (options.colorState) {
		const opacities = options.colorState.opacity;
		singularOpacity = (opacities.length >= 1 && opacities.every(i => i === opacities[0])) ? opacities[0] : 1;
		const colors = options.colorState.colors;
		singularColor = (colors.length >= 1 && colors.every(i => i === colors[0])) ? colors[0] : "";
	} else {
		const opacities = Array.from(ItemColorPickerLayers.keys()).map(i => ItemColorState.opacity[i]);
		singularOpacity = (opacities.length >= 1 && opacities.every(i => i === opacities[0])) ? opacities[0] : 1;
		const colors = ItemColorPickerIndices.map(i => ItemColorState.colors[i]);
		singularColor = (colors.length >= 1 && colors.every(i => i === colors[0])) ? colors[0] : "";
	}

	// Gather the elements
	const fieldset = /** @type {null | HTMLFieldSetElement} */(root.matches("fieldset[name='color-picker']") ? root : root.querySelector("fieldset[name='color-picker']"));
	const savedColor = /** @type {null | HTMLFieldSetElement} */(fieldset?.elements.namedItem("saved-colors-group"));
	const savedColorOutput = /** @type {null | HTMLOutputElement} */(fieldset?.elements.namedItem("saved-colors-output"));
	const savedColorSave = /** @type {null | HTMLButtonElement} */(fieldset?.elements.namedItem("save"));
	const hueInput = /** @type {null | HTMLInputElement} */(fieldset?.elements.namedItem("hue"));
	const opacityInput = /** @type {null | HTMLInputElement} */(fieldset?.elements.namedItem("opacity"));
	const tintInput = /** @type {null | HTMLColorTintElement} */(fieldset?.elements.namedItem("tint"));
	const outputInput = /** @type {null | HTMLInputElement} */(fieldset?.elements.namedItem("output"));
	if (!fieldset || !savedColor || !tintInput || !opacityInput || !opacityInput || !savedColorOutput || !savedColorSave) {
		return root;
	}

	if (options.colorState?.editOpacity ?? ItemColorState.editOpacity) {
		// Configure the min/max opacity and whether the opacity is configurable in the first place
		let opacityMin = null;
		let opacityMax = null;
		for (const layer of ItemColorPickerLayers.values()) {
			opacityMin = Math.min(opacityMin ?? 1, layer.MinOpacity);
			opacityMax = Math.max(opacityMax ?? 0, layer.MaxOpacity);
		}
		opacityMin ??= 0;
		opacityMax ??= 1;

		opacityInput.style.width = `${100 * (opacityMax - opacityMin)}%`;
		opacityInput.style.left = `${100 * opacityMin}%`;
		opacityInput.min = Math.round(opacityMin * 255).toString();
		opacityInput.max = Math.round(opacityMax * 255).toString();
		opacityInput.disabled = false;
	} else {
		// Ignore the automatic width adjustments when editing is disabled as the layout tends to get wonky when `left: 100%` or when `min == max == value`
		opacityInput.style.removeProperty("width");
		opacityInput.style.removeProperty("left");
		opacityInput.min = "0";
		opacityInput.max = "255";
		opacityInput.disabled = true;
	}

	// Apply the new color and opacity
	ColorPicker.setColor(fieldset, { colorString: singularColor, opacity: singularOpacity }, { overrideEditOpacity: true });
	if (ItemColorCharacter) {
		CharacterLoadCanvas(ItemColorCharacter);
	}

	// Reset the default values
	tintInput.defaultValue = tintInput.value;
	opacityInput.defaultValue = opacityInput.value;
	outputInput.defaultValue = outputInput.value;
	hueInput.defaultValue = hueInput.value;

	// Reset the search suggestions in the RGB text input based on one's color history + any supported non-hex colors (Default, White, Asian, etc.)
	const prevColors = Array.from(ItemColorHistory);
	if (!options.colorState) {
		prevColors.push(...ItemColorItem.Asset.Group.ColorSchema.filter(i => !CommonIsColor(i)));
	}
	prevColors.sort();
	outputInput.list?.replaceChildren(...prevColors.map(value => {
		return ElementCreate({ tag: "option", attributes: { value }});
	}));

	// Repopulate the saved colors as based on `Player.SavedColors`
	/** @type {NodeListOf<HTMLInputElement>} */
	const radioInputs = savedColor.querySelectorAll("input[type='radio']");
	radioInputs.forEach((input, i) => {
		// The default (valueless) option `-`
		if (!input.value) {
			input.checked = true;
			savedColorOutput.replaceChildren(...Array.from(input.labels).map(el => el.textContent.replace(" ", "")));
			savedColorOutput.style.removeProperty("background-color");
			return root;
		}

		const hsv = Player.SavedColors[i - 1];
		const rgb = ColorPickerHSVToCSS(hsv);
		input.value = rgb;
		input.labels.forEach(el => {
			el.querySelector(".checkbox-label")?.replaceChildren(`${i.toString().padStart(2, " ")}: ${rgb}`);
			el.style.backgroundColor = rgb;
		});
	});

	if (options.disabled != null) {
		ColorPicker.toggleDisabled(root, options.disabled);
	} else if (options.reset) {
		ColorPicker.toggleDisabled(root, false);
	}

	// Set the shape of the screen
	if (options.shape) {
		ColorPicker._shapes.set(root, options.shape);
	} else if (options.reset || !ColorPicker._shapes.has(root)) {
		ColorPicker._shapes.set(root, ColorPicker.defaultShape);
	}
	return root;
}

/** @type {ScreenResizeHandler} */
function ColorPickerResize() {
	const root = document.getElementById(ColorPicker.ids.root);
	const shape = ColorPicker._shapes.get(/** @type {HTMLElement} */(root));
	if (root && shape) {
		ElementPositionFixed(root, ...shape);
	}
}

/** @type {ScreenUnloadHandler} */
function ColorPickerUnload() {
	document.getElementById(ColorPicker.ids.root)?.toggleAttribute("hidden", true);
}

/**
 * @param {boolean} [forceExit=false]
 * @satisfies {ScreenExitHandler}
 */
function ColorPickerExit(forceExit=false) {
	/** @type {null | HTMLButtonElement} */
	const combobox = document.querySelector(`#${ColorPicker.ids.root} button[role='combobox'][aria-expanded='true']`);
	if (!forceExit && combobox) {
		combobox.click();
		return;
	}
	ColorPickerExitCallback = null;
	ColorPickerInputCallback = null;
	document.getElementById(ColorPicker.ids.root)?.remove();
}
