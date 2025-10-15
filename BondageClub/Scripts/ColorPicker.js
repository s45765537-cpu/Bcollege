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

/** Element IDs for the {@link ColorPicker} namespace */
const ColorPickerIDs = Object.freeze({
	root: "color-picker",
});

/** Namespace for constructing and managing color pickers */
var ColorPicker = {
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

			if (ev.detail.source === "output") {
				if (CommonIsColor(outputInput.value, { allowAlpha: true })) {
					const rgb = outputInput.value.slice(0, 7);
					const hsv = ColorPickerCSSToHSV(rgb);

					const opacityMin = CommonParseInt(opacityInput.min, 10) ?? 0;
					const opacityMax = CommonParseInt(opacityInput.max, 10) ?? 255;
					const opacity = CommonClamp(CommonParseInt(outputInput.value.slice(7), 16) ?? opacityMax, opacityMin, opacityMax);

					hueInput.valueAsNumber = Math.round(hsv.H * 360);
					this.style.setProperty("--hue", hueInput.value);
					if (!opacityInput.disabled) {
						opacityInput.valueAsNumber = opacity;
					}
					tintInput.value = rgb;
				}
			} else {
				const hsv = {
					H: hueInput.validity.valid ? hueInput.valueAsNumber / 360 : 0,
					S: tintInput.validity.valid ? tintInput.saturation / 255 : 0,
					V: tintInput.validity.valid ? tintInput.brightness / 255 : 1,
				};
				// Simplify RGBA to RGB when fully opaque
				const opacity = opacityInput.validity.valid && opacityInput.valueAsNumber < 255 ? opacityInput.valueAsNumber.toString(16).toUpperCase().padStart(2, "0") : "";
				const rgb = ColorPickerHSVToCSS(hsv);
				outputInput.value = `${rgb}${opacity}`;

				this.style.setProperty("--hue", hueInput.value);
				tintInput.valueAsHSV = hsv;
				hueInput.valueAsNumber = Math.round(hsv.H * 360);
			}
			ColorPickerInputCallback?.(this, ev);
		},

		/**
		 * Load a saved color or revert back to the item's initial color
		 * @type {(this: HTMLSelectElement, ev: Event) => void}
		 */
		changeSelect: function (ev) {
			const group = this.closest("fieldset");
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
		},

		/**
		 * Save the current RGB color to the player's saved color list
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickSaveColor: function (ev) {
			const group = this.closest("fieldset");
			const colorInput = /** @type {null | HTMLInputElement} */(group?.elements.namedItem("output"));
			if (!(colorInput instanceof HTMLInputElement) || !colorInput.validity.valid) {
				return;
			}

			if (!CommonIsColor(colorInput.value, { allowAlpha: true })) {
				return;
			}
			const rgb = colorInput.value.slice(0, 7);

			/** @type {null | HTMLSelectElement} */
			const select = group?.querySelector("select[name='saved-colors']");
			const option = select?.selectedOptions[0];
			if (option?.value) {
				option.style.setProperty("background-color", rgb);
				option.label = `${option.index.toString().padStart(2, " ")}: ${rgb}`;
				option.value = rgb;
				Player.SavedColors[option.index - 1] = ColorPickerCSSToHSV(rgb);
			}
		},

		/**
		 * Exit the screen while triggering a save.
		 * @type {(this: HTMLButtonElement, ev: PointerEvent) => void}
		 */
		clickExit: function (ev) {
			const root = /** @type {null | HTMLElement} */(this.closest(".screen"));
			const state = root ? ColorPicker.getColor(root) : null;
			const save = this.name === "Accept";
			if (root && state) {
				ColorPickerExitCallback?.(state, save, root);
			} else {
				console.error("uhoh");
			}
			if (!save) {
				ItemColorRevert("initial");
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
	},

	/**
	 * Construct a new fieldset with the main color input elements
	 * @param {null | string} id - The ID of the element
	 * @param {null | Pick<ColorPickerInitOptions, "colorState" | "onInput">} options
	 * @returns {HTMLFieldSetElement} - The newly created color picker fieldset containing all interactive sliders and such
	 */
	create(id, options=null) {
		id ??= ElementGenerateID();
		const hueID = ElementGenerateID();
		const opacityID = ElementGenerateID();
		const tintID = ElementGenerateID();
		const outputID = ElementGenerateID();
		const datalistID = ElementGenerateID();
		const dropdownID = ElementGenerateID();

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
										attributes: { id: opacityID, type: "range", size: 0, min: 0, max: 255, value: 1, name: "opacity", "aria-label": "opacity" },
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
							{ tag: "span", children: ["Saved colors"] },
							ElementCreateDropdown(
								dropdownID,
								[
									{ attributes: { value: "", label: "-", selected: true } },
									{ tag: "hr" },
									...GetDefaultSavedColors().map((hsv, i) => {
										const rgb = ColorPickerHSVToCSS(Player.SavedColors[i] ?? hsv);
										return {
											attributes: { value: rgb, label: `${(i + 1).toString().padStart(2, " ")}: ${rgb}` },
											style: { "background-color": rgb },
										};
									}),
								],
								ColorPicker.eventListeners.changeSelect,
								{ name: "saved-colors" },
							),
						],
					},
					ElementButton.Create(
						null,
						ColorPicker.eventListeners.clickSaveColor,
						{ label: "Save color", name: "save", disabled: true, ariaControls: dropdownID },
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
	 * @param {HTMLElement | string} root - The color picker screen or its ID
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
	 * @param {HTMLElement | string} root - The color picker screen or its ID
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
			};
		}
		return state;
	},
};

/**
 * Call {@link ColorPickerLoad} with the passed parameters and perform a resize.
 * @param {ColorPickerInitOptions} options - The load parameters
 * @returns {Promise<HTMLElement>} - The root element of the color picker subscreen
 */
async function ColorPickerInit(options=null) {
	ColorPickerInitOptions = options;
	await ColorPickerLoad();
	ColorPickerInitOptions = null;
	ColorPickerResize(true);
	return ElementWrap(options?.root ?? ColorPickerIDs.root);
}

/** @type {ScreenLoadHandler} */
function ColorPickerLoad() {
	const options = ColorPickerInitOptions ?? {};
	let root = ElementWrap(options.root ?? ColorPickerIDs.root);
	if (root) {
		root.toggleAttribute("hidden", false);
		ColorPickerReload(options);
		return;
	}

	const colorFieldset = ColorPicker.create(null, { onInput: options.onInput ?? ColorPicker.eventListeners.inputItemColor });
	colorFieldset.setAttribute("aria-labelledby", "color-picker-header");

	root = ElementDOMScreen.getTemplate(ColorPickerIDs.root, {
		menubarButtons: [
			ElementButton.Create(
				null, ColorPicker.eventListeners.clickExit,
				{ image: "./Icons/Accept.png", tooltip: "Accept", name: "Accept", tooltipPosition: "left" },
			),
			ElementButton.Create(
				null, ColorPicker.eventListeners.clickExit,
				{ image: "./Icons/Cancel.png", tooltip: "Cancel", name: "Cancel", tooltipPosition: "left" },
			),
			ElementButton.Create(
				null, ColorPicker.eventListeners.clickReset,
				{ image: "./Icons/Reset.png", tooltip: "Reset", name: "Reset", tooltipPosition: "left" },
			),
		],
		mainContent: [colorFieldset],
		parent: document.body,
	});
	ColorPickerReload(options);
}

/**
 * Reload and refresh the color picker based on the current item color data.
 * @param {null | ColorPickerInitOptions} options
 */
function ColorPickerReload(options=null) {
	options ??= {};
	if (!options.colorState && !(ItemColorState && ItemColorCharacter)) {
		return;
	}

	const root = ElementWrap(options.root ?? ColorPickerIDs.root);
	if (!root) {
		return;
	}

	if (options.onExit) {
		ColorPickerExitCallback = options.onExit;
	}
	if (options.heading) {
		const heading = CommonIsArray(options.heading) ? options.heading : [options.heading];
		root.querySelector("h1")?.replaceChildren(...heading);
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
	const select = /** @type {null | HTMLSelectElement} */(fieldset?.elements.namedItem("saved-colors"));
	const selectSave = /** @type {null | HTMLButtonElement} */(fieldset?.elements.namedItem("save"));
	const hueInput = /** @type {null | HTMLInputElement} */(fieldset?.elements.namedItem("hue"));
	const opacityInput = /** @type {null | HTMLInputElement} */(fieldset?.elements.namedItem("opacity"));
	const tintInput = /** @type {null | HTMLColorTintElement} */(fieldset?.elements.namedItem("tint"));
	const outputInput = /** @type {null | HTMLInputElement} */(fieldset?.elements.namedItem("output"));
	if (!fieldset || !select || !tintInput || !opacityInput || !opacityInput || !selectSave) {
		return;
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
	if (!options.colorState) {
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
	selectSave.disabled = true;
	select.value = "";
	for (const option of select.options) {
		if (option.index === 0) {
			continue;
		}

		const value = ColorPickerHSVToCSS(Player.SavedColors[option.index - 1]);
		if (value === option.value) {
			continue;
		}

		option.value = value;
		option.label = `${option.index.toString().padStart(2, " ")}: ${value}`;
		option.style.setProperty("background-color", value);
	}
}

/** @type {ScreenResizeHandler} */
function ColorPickerResize() {
	ElementPositionFixed(ColorPickerIDs.root, 1200, 15, 800, 970);
}

/** @type {ScreenUnloadHandler} */
function ColorPickerUnload() {
	document.getElementById(ColorPickerIDs.root)?.toggleAttribute("hidden", true);
}

/** @type {ScreenExitHandler} */
function ColorPickerExit() {
	ColorPickerExitCallback = null;
	ColorPickerInputCallback = null;
	document.getElementById(ColorPickerIDs.root)?.remove();
}
