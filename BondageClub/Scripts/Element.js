"use strict";

/**
 * Generate and return a unique {@link HTMLElement.id}.
 *
 * IDs consist of base36-encoded integers whose value is incremented each time this function is called.
 */
var ElementGenerateID = (() => {
	let id = 0;
	return function() { return (id++).toString(36); };
})();

/**
 * Handles the value of a HTML element. It sets the value of the element when the Value parameter is provided or it returns the value when the parameter is omitted
 * @param {string | null} ID - The id of the element for which we want to get/set the value.
 * @param {string} [Value] - The value to give to the element (if applicable)
 * @returns {string} - The value of the element (When no value parameter was passed to the function)
 */
function ElementValue(ID, Value) {
	ID ??= ElementGenerateID();
	const e = /** @type {HTMLInputElement} */(document.getElementById(ID));
	if (!e) {
		console.error("ElementValue called on a missing element: " + ID.toString());
		return "";
	}

	if (Value == null)
		return e.value.trim();

	e.value = Value;
	e.dispatchEvent(new InputEvent("input"));
	return "";
}

/**
 * Disable all clickable elements within `root` for the given duration.
 * @param {Element} root - The root element
 * @param {null | string} [query] - The query for identifying all clickable elements within `root`
 * @param {number} [timeout] - The timeout in ms
 * @returns {number} - The timeout ID as returned by {@link setTimeout}
 */
function ElementClickTimeout(root, query=null, timeout=250) {
	query ??= "button,a,input,select,radio,[role='button'],[role='link']";
	const elemClickable = /** @type {HTMLElement[]} */(Array.from(root.querySelectorAll(query)));
	const elemDisabledStates = elemClickable.map(e => /** @type {const} */([e, e.hasAttribute("disabled"), e.getAttribute("aria-disabled")]));
	elemDisabledStates.forEach(([e, disabled, ariaDisabled]) => {
		if (!disabled && ariaDisabled !== "true") {
			e.toggleAttribute("disabled", true);
			e.setAttribute("aria-disabled", "true");
		}
	});

	return setTimeout(() => {
		elemDisabledStates.forEach(([e, disabled, ariaDisabled]) => {
			if (!disabled) {
				e.toggleAttribute("disabled", false);
			}
			if (ariaDisabled !== "true") {
				e.removeAttribute("aria-disabled");
			}
		});
	}, timeout);
}

/**
 * Handles the content of a HTML element. It sets the content of the element when the Content parameter is provided or it returns the value when the parameter is omitted
 * @param {string | null} ID - The id of the element for which we want to get/set the value.
 * @param {string} [Content] - The content/inner HTML to give to the element (if applicable)
 * @returns {string} - The content of the element (When no Content parameter was passed to the function)
 */
function ElementContent(ID, Content) {
	ID ??= ElementGenerateID();
	const e = document.getElementById(ID);
	if (!e) {
		console.error("ElementContent called on a missing element: " + ID.toString());
		return "";
	}

	if (Content == null)
		return e.innerHTML;

	e.innerHTML = Content;
	return "";
}

/** @satisfies {ElementNoParent} */
const ElementNoParent = 0;

/**
 * @template {keyof HTMLElementScalarTagNameMap} T
 * @param {HTMLOptions<T>} options - Options for customizing the element
 * @returns {HTMLElementTagNameMap[T]} - The created element
 */
function ElementCreate(options) {
	const elem = document.createElement(options.tag);

	for (const [k, v] of Object.entries(options.attributes ?? {})) {
		if (v == null || v === false) {
			continue;
		} else if (v === true) {
			elem.toggleAttribute(k, true);
		} else {
			elem.setAttribute(k, v);
		}
	}
	for (const [eventName, listener] of Object.entries(options.eventListeners ?? {})) {
		if (listener != null) {
			elem.addEventListener(eventName, listener);
		}
	}
	for (const [k, v] of Object.entries(options.style ?? {})) {
		if (v != null) {
			elem.style.setProperty(k, /** @type {any} */(v));
		}
	}
	for (const [k, v] of Object.entries(options.dataAttributes ?? {})) {
		if (v == null || v === false) {
			continue;
		} else if (v === true) {
			elem.dataset[k] = "";
		} else {
			elem.dataset[k] = v.toString();
		}
	}
	for (const cls of options.classList ?? []) {
		if (cls != null) {
			elem.classList.add(cls);
		}
	}

	if (options.innerHTML) { elem.innerHTML = options.innerHTML; }

	/** @type {(i: unknown) => i is Node | string} */
	const isNode = (i) => typeof i === "string" || (typeof i === "object" && "nodeValue" in i);
	for (const childElem of options.children ?? []) {
		if (childElem != null) {
			if (isNode(childElem)) {
				elem.append(childElem);
			} else {
				ElementCreate({ ...childElem, parent: elem });
			}
		}
	}
	if (options.parent) { options.parent.appendChild(elem); }
	return elem;
}

/**
 * Creates a new from element in the main document.
 *
 * @param {string | null} ID - The id of the form to create
 * @returns {HTMLFormElement}
 */
function ElementCreateForm(ID) {
	ID ??= ElementGenerateID();
	return /** @type {HTMLFormElement} */ (document.getElementById(ID)) ?? ElementCreate({
		tag: "form",
		attributes: {
			id: ID,
			name: ID,
			method: "dialog",
			["screen-generated"]: CurrentScreen,
		},
		parent: document.body,
	});
}

/**
 * Creates a new text area element in the main document. Does not create a new element if there is already an existing one with the same ID
 * @param {string | null} ID - The id of the text area to create.
 * @param {HTMLElement} [form] - The form the element belongs to
 * @returns {HTMLTextAreaElement}
 */
function ElementCreateTextArea(ID, form) {
	ID ??= ElementGenerateID();
	return /** @type {HTMLTextAreaElement} */ (document.getElementById(ID)) ?? ElementCreate({
		tag: "textarea",
		attributes: {
			id: ID,
			name: ID,
			["screen-generated"]: CurrentScreen,
		},
		parent: form ?? document.body,
		classList: ["HideOnPopup"],
	});
}

/**
 * Blur event listener for `number`-based `<input>` elements that automatically sanitizes the input value the moment the element is deselected.
 * @this {HTMLInputElement}
 * @param {FocusEvent} event
 */
function ElementNumberInputBlur(event) {
	let value = "";
	if (Number.isNaN(this.valueAsNumber)) {
		value = this.defaultValue;
	} else {
		const min = this.min ? Number(this.min) : -Infinity;
		const max = this.max ? Number(this.max) : Infinity;
		const requiresInt = this.inputMode === "numeric";
		value = CommonClamp(
			requiresInt ? Math.round(this.valueAsNumber) : this.valueAsNumber,
			Number.isNaN(min) ? -Infinity : min,
			Number.isNaN(max) ? Infinity : max,
		).toString();
	}

	if (value !== this.value) {
		this.value = value;
		this.dispatchEvent(new Event("input"));
		this.dispatchEvent(new Event("change"));
	}
}

/**
 * Wheel event listener for `number`-based `<input>` elements. Allows one to increment/decrement the value
 * @this {HTMLInputElement}
 * @param {WheelEvent} event
 */
function ElementNumberInputWheel(event) {
	if (this.disabled || this.readOnly) {
		event.stopImmediatePropagation();
		return;
	}

	let min = this.min ? Number(this.min) : -Infinity;
	let max = this.max ? Number(this.max) : Infinity;
	let step = this.step ? Number(this.step) : 1;
	if (Number.isNaN(min)) { min = -Infinity; }
	if (Number.isNaN(max)) { max = Infinity; }
	if (Number.isNaN(step)) { step = 1; }

	let value = this.valueAsNumber;
	if (event.deltaY < 0) {
		value = CommonClamp(value + step, min, max);
	} else if (event.deltaY > 0) {
		value = CommonClamp(value - step, min, max);
	}

	if (value !== this.valueAsNumber) {
		this.valueAsNumber = value;
		this.dispatchEvent(new Event("input"));
		if (document.activeElement !== this) {
			this.dispatchEvent(new Event("change"));
		}
	}

	event.preventDefault();
	event.stopPropagation();
}

/**
 * Creates a new text input element in the main document.Does not create a new element if there is already an existing one with the same ID
 * @param {string | null} ID - The id of the input tag to create.
 * @param {string} Type - Type of the input tag to create.
 * @param {string} Value - Value of the input tag to create.
 * @param {string | number} [MaxLength] - Maximum input tag of the input to create.
 * @param {Node} [form] - The form the element belongs to
 * @returns {HTMLInputElement} - The created HTML input element
 */
function ElementCreateInput(ID, Type, Value, MaxLength, form) {
	ID ??= ElementGenerateID();
	let e = /** @type {HTMLInputElement} */ (document.getElementById(ID));
	if (e) {
		return e;
	}

	e = ElementCreate({
		tag: "input",
		attributes: {
			id: ID,
			name: ID,
			type: Type,
			value: Value,
			maxLength: typeof MaxLength === "number" ? MaxLength : Number.parseInt(MaxLength, 10),
			["screen-generated"]: CurrentScreen,
		},
		parent: form ?? document.body,
		classList: ["HideOnPopup"],
		eventListeners: {
			focus() { this.removeAttribute("readonly"); },
		},
	});

	switch (Type) {
		case "number":
			e.inputMode = "numeric";
			e.addEventListener("blur", ElementNumberInputBlur);
			e.addEventListener("wheel", ElementNumberInputWheel);
			break;
	}

	return e;
}

/**
 * Creates a new range input element in the main document. Does not create a new element if there is already an
 * existing one with the same id
 * @param {string | null} id - The id of the input tag to create
 * @param {number} value - The initial value of the input
 * @param {number} min - The minimum value of the input
 * @param {number} max - The maximum value of the input
 * @param {number} step - The increment size of the input
 * @param {ThumbIcon} [thumbIcon] - The icon to use for the range input's "thumb" (handle). If not set, the slider will
 * have a default appearance with no custom thumb.
 * @param {boolean} [vertical] - Whether this range input is a vertical slider (defaults to false)
 * @returns {HTMLInputElement} - The created HTML input element
 */
function ElementCreateRangeInput(id, value, min, max, step, thumbIcon, vertical) {
	id ??= ElementGenerateID();
	return /** @type {HTMLInputElement} */ (document.getElementById(id)) ?? ElementCreate({
		tag: "input",
		attributes: {
			id,
			name: id,
			type: "range",
			min: min.toString(),
			max: max.toString(),
			step: step.toString(),
			value: value.toString(),
			["screen-generated"]: CurrentScreen,
		},
		dataAttributes: thumbIcon ? { thumb: thumbIcon.toLowerCase() } : {},
		parent: document.body,
		classList: [
			"HideOnPopup",
			"range-input",
			vertical ? "Vertical" : null,
		],
		eventListeners: {
			focus() { this.removeAttribute("readonly"); },
		},
	});
}

/**
 * Construct a `<select>`-based dropdown menu.
 * @param {string | null} id - The name of the select item.
 * @param {readonly (string | Omit<HTMLOptions<"option">, "tag">)[]} optionsList - The list of options for the current select statement. Can be supplied as a simple string or a more extensive `<option>` config.
 * @param {(this: HTMLSelectElement, event: Event) => any} onChange - An event listener to be called, when the value of the drop down box changes
 * @param {null | { required?: boolean, multiple?: boolean, disabled?: boolean, size?: number }} [options] - Additional `<select>`-specific properties
 * @param {null | Partial<Record<"select", Omit<HTMLOptions<"select">, "tag">>>} htmlOptions - Additional {@link ElementCreate} options to-be applied to the respective (child) element
 * @returns {HTMLSelectElement} - The created element
 */
function ElementCreateDropdown(id, optionsList, onChange, options=null, htmlOptions=null) {
	id ??= ElementGenerateID();
	let select = /** @type {null | HTMLSelectElement} */(document.getElementById(id));
	if (select != null) {
		console.error(`Element "${id}" already exists`);
		return select;
	}

	options ??= {};
	const booleanAttributes = Object.fromEntries(/** @type {const} */([
		["required", options.required ? "" : undefined],
		["multiple", options.multiple ? "" : undefined],
		["disabled", options.disabled ? "" : undefined],
		["size", options.size != null ? options.size.toString() : undefined],
	]).filter(i => i[1] != null));

	const selectOptions = htmlOptions?.select ?? {};
	select = ElementCreate({
		...htmlOptions,
		tag: "select",
		classList: [
			...(selectOptions.classList ?? []),
			"HideOnPopup",
			"custom-select",
		],
		attributes: {
			...(selectOptions.attributes ?? {}),
			id,
			["screen-generated"]: CurrentScreen,
			...booleanAttributes,
		},
		parent: selectOptions.parent ?? document.body,
		eventListeners: {
			...(selectOptions.eventListeners ?? {}),
			change(ev) {
				if (!this.validity) {
					ev.stopImmediatePropagation();
					return;
				}
			},
		},
		children: [
			...(selectOptions.children ?? []),
			...optionsList.map(content => {
				if (typeof content === "string") {
					return { tag: /** @type {const} */("option"), children: [content] };
				} else {
					return { tag: /** @type {const} */("option"), ...content };
				}
			}),
		],
	});
	select.addEventListener("change", onChange);
	return select;
}

/**
 * Creates a new div element in the main document. Does not create a new element if there is already an existing one with the same ID
 * @param {string | null} ID - The id of the div tag to create.
 * @returns {HTMLDivElement} - The created (or pre-existing) div element
 */
function ElementCreateDiv(ID) {
	ID ??= ElementGenerateID();
	return /** @type {HTMLDivElement} */(document.getElementById(ID)) ?? ElementCreate({
		tag: "div",
		attributes: {
			id: ID,
			["screen-generated"]: CurrentScreen,
		},
		parent: document.body,
		classList: ["HideOnPopup"],
	});
}

/**
 * Removes an element from the main document
 * @param {ElementHelp.ElementOrId} elementOrId - The id of the tag to remove from the document.
 * @returns {void} - Nothing
 */
function ElementRemove(elementOrId) {
	ElementWrap(elementOrId)?.remove();
}

/**
 * Draws an existing HTML element at a specific position within the document. The element is "centered" on the given coordinates by dividing its height and width by two.
 * @param {ElementHelp.ElementOrId} ElementOrID - The id of the input tag to (re-)position.
 * @param {number} X - Center point of the element on the X axis.
 * @param {number} Y - Center point of the element on the Y axis.
 * @param {number} W - Width of the element.
 * @param {number} [H] - Height of the element.
 * @returns {void} - Nothing
 */
function ElementPosition(ElementOrID, X, Y, W, H) {
	const E = ElementWrap(ElementOrID);

	if (!E) {
		console.warn("A call to ElementPosition was made on non-existent element with ID '" + ElementOrID + "'");
		return;
	}

	// For a vertical slider, swap the width and the height (the transformation is handled by CSS)
	if (E.tagName.toLowerCase() === "input" && E.getAttribute("type") === "range" && E.classList.contains("Vertical")) {
		[W, H] = [H, W];
	}

	// compute font size and apply
	ElementSetFontSize(E);
	const font = parseFloat(E.style.fontSize);

	// compute dimensions
	const height = H != null ? ElementCanvasScaledHeight(H) : 4 + font * 1.15;
	const width = ElementCanvasScaledWidth(W);

	// compute top/left to center
	const posX = ElementCanvasScaledY(Y, 'top') - height / 2;
	const posY = ElementCanvasScaledX(X - W / 2, 'left');

	Object.assign(E.style, {
		position: 'fixed',
		top: posX + 'px',
		left: posY + 'px',
		width: width + 'px',
		height: height + 'px'
	});
}

/**
 * Draws an existing HTML element at a specific position within the document. The element will not be centered on its given coordinates unlike the ElementPosition function.
 * Not same as ElementPositionFix. Calculates Font size itself.
 * @param {ElementHelp.ElementOrId} ElementOrID - The id of the input tag to (re-)position or the element itself.
 * @param {number} X - Starting point of the element on the X axis.
 * @param {number} Y - Starting point of the element on the Y axis.
 * @param {number} W - Width of the element.
 * @param {number} [H] - Height of the element.
 * @param {ElementHelp.AnchorXY} [anchorPosition]
 * @returns {void} - Nothing
 */
function ElementPositionFixed(ElementOrID, X, Y, W, H, anchorPosition = 'top-left') {
	const E = ElementWrap(ElementOrID);

	// Verify the element exists
	if (!E) {
		const id = typeof ElementOrID === "string" ? ElementOrID : ElementOrID?.id;
		console.warn(`A call to ElementPositionFix was made on non-existent element with ID "${id}"`);
		return;
	}

	ElementSetFontSize(E);
	ElementSetPosition(E, X, Y, anchorPosition);
	ElementSetSize(E, W, H ?? null);
}

/**
 * Draws an existing HTML element at a specific position within the document. The element will not be centered on its given coordinates unlike the ElementPosition function.
 * @param {ElementHelp.ElementOrId} ElementOrID - The id of the input tag to (re-)position.
 * @param {number} Font - The size of the font to use.
 * @param {number} X - Starting point of the element on the X axis.
 * @param {number} Y - Starting point of the element on the Y axis.
 * @param {number} W - Width of the element.
 * @param {number} H - Height of the element.
 * @param {ElementHelp.AnchorXY} [anchorPosition]
 * @returns {void} - Nothing
 */
function ElementPositionFix(ElementOrID, Font, X, Y, W, H, anchorPosition = 'top-left') {
	const E = ElementWrap(ElementOrID);
	// Verify the element exists
	if (!E) {
		console.warn("A call to ElementPositionFix was made on non-existent element with ID '" + ElementOrID + "'");
		return;
	}

	ElementSetFontSize(E, Font);
	ElementSetPosition(E, X, Y, anchorPosition);
	ElementSetSize(E, W, H);
}

/**
 * Sets a custom data-attribute to a specified value on a specified element
 * @param {ElementHelp.ElementOrId} ElementOrId - The id of the element to create/set the data attribute of.
 * @param {string} Name - Name of the data attribute. ("data-" will be automatically appended to it.)
 * @param {string} Value - Value to give to the attribute.
 * @returns {void} - Nothing
 */
function ElementSetDataAttribute(ElementOrId, Name, Value) {
	const element = ElementWrap(ElementOrId);
	if (element != null) {
		element.setAttribute(("data-" + Name).toLowerCase(), Value.toString().toLowerCase());
	}
}

/**
 * Sets an attribute to a specified value on a specified element
 * @param {ElementHelp.ElementOrId} ElementOrId - The id of the element to create/set the data attribute of.
 * @param {string} Name - Name of the attribute.
 * @param {string} Value - Value to give to the attribute.
 * @returns {void} - Nothing
 */
function ElementSetAttribute(ElementOrId, Name, Value) {
	const element = ElementWrap(ElementOrId);
	if (element != null) {
		element.setAttribute(Name, Value);
	}
}

/**
 * Removes an attribute from a specified element.
 * @param {ElementHelp.ElementOrId} ElementOrId - The id of the element from which to remove the attribute.
 * @param {string} Name - Name of the attribute to remove.
 * @returns {void} - Nothing
 */
function ElementRemoveAttribute(ElementOrId, Name) {
	const element = ElementWrap(ElementOrId);
	if (element != null) {
		element.removeAttribute(Name);
	}
}

/**
 * Scrolls to the end of a specified element
 * @param {ElementHelp.ElementOrId} ElementOrId - The id of the element to scroll down to the bottom of.
 * @returns {void} - Nothing
 */
function ElementScrollToEnd(ElementOrId) {
	const element = ElementWrap(ElementOrId);
	if (element != null) element.scrollTop = element.scrollHeight;
}

/**
 * Returns the given element's scroll position as a percentage, with the top of the element being close to 0 depending on scroll bar size, and the bottom being around 1.
 * To clarify, this is the position of the bottom edge of the scroll bar.
 * @param {ElementHelp.ElementOrId} ElementOrId - The id of the element to find the scroll percentage of.
 * @returns {(number|null)} - A float representing the scroll percentage.
 */
function ElementGetScrollPercentage(ElementOrId) {
	const element = ElementWrap(ElementOrId);
	if (element != null) {
		if (element.scrollTop === 0) return 0;
		return (element.scrollTop + element.clientHeight) / element.scrollHeight;
	}

	return null;
}

/**
 * Checks if a given HTML element is scrolled to the very bottom.
 * @param {ElementHelp.ElementOrId} ElementOrId - The id of the element to check for scroll height.
 * @returns {boolean} - Returns TRUE if the specified element is scrolled to the very bottom
 */
function ElementIsScrolledToEnd(ElementOrId) {
	const element = ElementWrap(ElementOrId);
	return element != null && element.scrollHeight - element.scrollTop - element.clientHeight <= 1;
}

/**
 * Sets the scroll position of an element to a specified percentage of its scrollable content.
 * Ideally scroll percentage should be gotten with {@link ElementGetScrollPercentage}
 *
 * @param {ElementHelp.ElementOrId} ElementOrId
 * @param {number} scrollPercentage
 * @param {ScrollBehavior} scrollBehavior
 * @returns {void}
 */
function ElementSetScrollPercentage(ElementOrId, scrollPercentage, scrollBehavior = 'auto') {
	const element = ElementWrap(ElementOrId);
	if (!element) {
		console.error(`Element with ID "${ElementOrId}" not found.`);
		return;
	}

	if (scrollPercentage < 0 || scrollPercentage > 1) {
		console.error("scrollPercentage must be between 0 and 1 (inclusive).");
		return;
	}

	const scrollHeight = element.scrollHeight;
	const clientHeight = element.clientHeight;
	const newScrollTop = Math.max(0, (scrollPercentage * scrollHeight - clientHeight)); // Clamp to 0 for valid range

	element.scrollTo({
		top: newScrollTop,
		behavior: scrollBehavior
	});
}

/**
 * Gives focus to a specified existing element for non-mobile users.
 * @param {ElementHelp.ElementOrId} ElementOrId - The id of the element to give focus to.
 * @returns {void} - Nothing
 */
function ElementFocus(ElementOrId) {
	ElementWrap(ElementOrId)?.focus();
}

/**
 * Toggles (non-nested) HTML elements that were created by a given screen. When toggled off, they are hidden (not removed)
 * @param {string} Screen - Screen for which to hide the elements generated
 * @param {boolean} ShouldDisplay - TRUE if we are toggling on the elements, FALSE if we are hiding them.
 */
function ElementToggleGeneratedElements(Screen, ShouldDisplay) {
	const displayState = ShouldDisplay ? "" : "none";
	const elements = /** @type {HTMLElement[]} */(Array.from(document.querySelectorAll(`[screen-generated="${Screen}"]`)));
	for (const e of elements) {
		if (e.parentElement === null || e.parentElement === document.body) {
			e.style.display = displayState;
		}
	}
}

/**
 * Namespace for creating (DOM-based) dropdown menus filled with checkboxes
 * @namespace
 */
var ElementCheckboxDropdown = {
	/**
	 * @param {string} idPrefix
	 * @param {string} idSuffix
	 * @param {string} spanText
	 * @param {(this: HTMLInputElement, event: Event) => void} listener
	 * @param {boolean} checked
	 * @returns {HTMLOptions<"label">}
	 */
	_CreateCheckboxPair(idPrefix, idSuffix, spanText, listener, checked=false) {
		return {
			tag: "label",
			classList: ["dropdown-checkbox-grid"],
			attributes: { id: `${idPrefix}-pair-${idSuffix}` },
			children: [
				ElementCheckbox.Create(`${idPrefix}-checkbox-${idSuffix}`, listener, { checked }),
				{
					tag: "span",
					classList: ["dropdown-checkbox-label"],
					attributes: { id: `${idPrefix}-label-${idSuffix}` },
					children: [spanText],
				},
			],
		};
	},

	/**
	 * Construct a dropdown menu with labeled checkboxes
	 * @param {string | null} id - The ID of the element
	 * @param {readonly string[]} checkboxList - The checkbox labels
	 * @param {(this: HTMLInputElement, event: Event) => void} eventListener - The event listener to-be attached to all checkboxes
	 * @param {Object} [options]
	 * @param {HTMLElement} [options.parent] - The parent element of the dropdown menu; defaults to {@link document.body}
	 * @param {boolean} [options.checked] - Whether all checkboxes should be initially checked
	 * @returns {HTMLDivElement} - The created dropdown menu
	 */
	FromList(id, checkboxList, eventListener, options=null) {
		id ??= ElementGenerateID();
		return /** @type {null | HTMLDivElement} */(document.getElementById(id)) ?? ElementCreate({
			tag: "div",
			attributes: { id, ["screen-generated"]: CurrentScreen },
			parent: options?.parent ?? document.body,
			classList: ["HideOnPopup", "dropdown", "scroll-box"],
			style: { display: "none" },
			children: checkboxList.map((o) => this._CreateCheckboxPair(id, o, o, eventListener, options?.checked)),
		});
	},

	/**
	 * Construct a dropdown menu with labeled checkboxes, each group of checkboxes having a header associated with them
	 * @param {string | null} id - The ID of the element
	 * @param {Record<string, readonly string[]>} checkboxRecord - The checkbox labels
	 * @param {(this: HTMLInputElement, event: Event) => void} eventListener - The event listener to-be attached to all checkboxes
	 * @param {Object} [options]
	 * @param {HTMLElement} [options.parent] - The parent element of the dropdown menu; defaults to {@link document.body}
	 * @param {boolean} [options.checked] - Whether all checkboxes should be initially checked
	 * @returns {HTMLDivElement} - The created dropdown menu
	 */
	FromRecord(id, checkboxRecord, eventListener, options=null) {
		id ??= ElementGenerateID();
		return /** @type {null | HTMLDivElement} */(document.getElementById(id)) ?? ElementCreate({
			tag: "div",
			attributes: { id, ["screen-generated"]: CurrentScreen },
			parent: options?.parent ?? document.body,
			classList: ["HideOnPopup", "dropdown", "scroll-box"],
			style: { display: "none" },
			children: Object.entries(checkboxRecord).flatMap(([header, checkboxList]) => {
				return [
					{
						tag: "span",
						classList: ["dropdown-header"],
						attributes: { id: `${id}-header-${header}` },
						children: [header],
					},
					{
						tag: "div",
						classList: ["dropdown-grid"],
						attributes: { id: `${id}-grid-${header}` },
						children: checkboxList.map((o) => this._CreateCheckboxPair(id, `${header}-${o}`, o, eventListener, options?.checked)),
					},
				];
			}),
		});
	},
};

/**
 * Construct a search-based `<input>` element that offers suggestions based on the passed callbacks output.
 *
 * The search suggestions are constructed lazily once the search input is focused.
 * @example
 * <input type="search" id={id} list={`${id}-datalist`}>
 *     <datalist id={`${id}-datalist`}>
 *         <option value="..." />
 *         ...
 *     </datalist>
 * </input>
 * @param {string | null} id - The ID of the to-be created search input; `${id}-datalist` will be assigned the search input's datalist
 * @param {() => Iterable<string>} dataCallback - A callback returning all values that will be converted into a datalist `<option>`
 * @param {Object} [options]
 * @param {null | string} [options.value] - Value of the search input
 * @param {null | Node} [options.parent] - The parent element of the search input; defaults to {@link document.body}
 * @param {null | number} [options.maxLength] - Maximum input length of the search input
 * @returns {HTMLInputElement} - The newly created search input
 */
function ElementCreateSearchInput(id, dataCallback, options=null) {
	id ??= ElementGenerateID();
	let elem = /** @type {HTMLInputElement | null} */(document.getElementById(id));
	if (elem) {
		console.error(`Element "${id}" already exists`);
		return elem;
	}

	options ??= {};
	elem = ElementCreateInput(id, "search", options.value ?? "", options.maxLength, options.parent);
	elem.appendChild(ElementCreate({ tag: "datalist", attributes: { id: `${id}-datalist` } }));
	elem.setAttribute("list", `${id}-datalist`);
	elem.addEventListener("focus", async function() {
		if (this.list?.children.length !== 0) {
			return;
		}

		for (const value of dataCallback()) {
			this.list.appendChild(ElementCreate({ tag: "option", attributes: { value } }));
		}
	});
	return elem;
}

/**
 * Namespace for creating HTML buttons
 * @namespace
 */
var ElementButton = {
	/**
	 * @private
	 * @readonly
	 */
	_TooltipPositions: Object.freeze({
		left: "button-tooltip-left",
		right: "button-tooltip-right",
		top: "button-tooltip-top",
		bottom: "button-tooltip-bottom",
	}),

	/**
	 * @private
	 * @readonly
	 */
	_LabelPositions: Object.freeze({
		top: "button-label-top",
		center: "button-label-center",
		bottom: "button-label-bottom",
	}),

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: KeyboardEvent) => Promise<void>}
	 */
	_KeyDown: async function _KeyDown(ev) {
		if (CommonKey.GetModifiers(ev)) {
			return;
		}
		switch (ev.key) {
			case "Enter":
			case " ":
				ev.preventDefault();

				if (this.disabled || this.getAttribute("aria-disabled") === "true") {
					ev.stopImmediatePropagation();
					return;
				} else if (!ev.repeat) {
					this.click();
					this.setAttribute("data-active", true);
				}
				ev.stopPropagation();
				break;
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: KeyboardEvent) => Promise<void>}
	 */
	_KeyUp: async function _KeyUp(ev) {
		if (ev.shiftKey || ev.ctrlKey || ev.metaKey || ev.altKey) {
			return;
		}
		switch (ev.key) {
			case "Enter":
			case " ":
				if (this.disabled || this.getAttribute("aria-disabled") === "true") {
					ev.stopImmediatePropagation();
					return;
				}
				this.removeAttribute("data-active");
				break;
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: MouseEvent) => void}
	 */
	_MouseDown: function _MouseDown(ev) {
		// Prevent tooltips from handling any click-related actions intended for the button
		if (ev.target instanceof Element && ev.target.classList.contains("button-tooltip")) {
			ev.stopImmediatePropagation();
			ev.preventDefault();
		}
		document.addEventListener("mouseup", ElementButton._MouseUp);
	},

	/**
	 * @private
	 * @type {(this: Document, ev: MouseEvent) => void}
	 */
	_MouseUp: function _MouseUp(ev) {
		const activeElement = document.activeElement;
		/** @type {null | HTMLButtonElement} */
		const button = activeElement instanceof Element && activeElement.closest("button.button");
		if (!button) {
			return;
		}

		if (activeElement.closest(".button-tooltip")) {
			ev.stopImmediatePropagation();
			return;
		}

		// Fix buttons not automatically losing focus after a click event
		button.blur();
		document.removeEventListener("mouseup", ElementButton._MouseUp);
	},

	_GetClickTouchListeners: function _GetClickTouchListeners() {
		/** @type {null | number} */
		let holdAndClickTimeoutID = null;
		/** Whether a touch-based hold-and-click action was detected */
		let holdAndClick = false;

		/**
		 * @satisfies {TimerHandler}
		 * @type {(elem: HTMLButtonElement, ev: TouchEvent) => void}
		 */
		function touchstartTimeout(elem, ev) {
			holdAndClickTimeoutID = null;
			holdAndClick = true;
			elem.dispatchEvent(new PointerEvent("bcTouchHold", ev));
		}

		/** @type {(this: HTMLButtonElement, ev: TouchEvent) => void} */
		function touchstart(ev) {
			if (ev.target instanceof Element && ev.target.classList.contains("button-tooltip")) {
				ev.stopImmediatePropagation();
				return;
			}

			holdAndClick = false;
			if (!this.disabled) {
				holdAndClickTimeoutID ??= setTimeout(touchstartTimeout, 300, this, ev);
			}
		}

		/** @type {(this: HTMLButtonElement, ev: TouchEvent) => void} */
		function touchmove(ev) {
			if (holdAndClickTimeoutID != null) {
				clearTimeout(holdAndClickTimeoutID);
				holdAndClickTimeoutID = null;
			}
		}

		/** @type {(this: HTMLButtonElement, ev: TouchEvent) => void} */
		function touchend(ev) {
			if (ev.target instanceof Element && ev.target.classList.contains("button-tooltip")) {
				ev.stopImmediatePropagation();
				return;
			}

			if (!holdAndClick) {
				this.blur();
			} else {
				ev.preventDefault();
			}
		}

		/** @type {(this: HTMLButtonElement, ev: MouseEvent | PointerEvent) => void} */
		function click(ev) {
			if (ev.target instanceof Element && ev.target.classList.contains("button-tooltip")) {
				ev.stopImmediatePropagation();
			} else if (holdAndClick) {
				ev.stopImmediatePropagation();
				holdAndClick = false;
			} else if (this.getAttribute("aria-disabled") === "true") {
				this.dispatchEvent(new PointerEvent("bcClickDisabled", ev));
				ev.stopImmediatePropagation();
			}
		}

		/** @type {(this: HTMLButtonElement, ev: FocusEvent) => void} */
		function blur(ev) {
			this.removeAttribute("data-show-tooltip");
			if (holdAndClickTimeoutID != null) {
				clearTimeout(holdAndClickTimeoutID);
				holdAndClickTimeoutID = null;
			}
			holdAndClick = false;
		}

		/** @type {(this: HTMLButtonElement, ev: MouseEvent | PointerEvent) => void} */
		function bcTouchHold(ev) {
			this.focus({ preventScroll: true });
			this.toggleAttribute("data-show-tooltip", true);
		}

		return { click, touchend, touchmove, touchstart, blur, bcTouchHold, touchcancel: touchend };
	},

	/**
	 * Navigate the passed elements children in a depth-first search manner,
	 * yielding all elements matching the `query` selector and whose parent does _not_ satisify the passed `filter`
	 * @param {Element} root
	 * @param {string} query
	 * @param {(el: Element) => boolean} filter
	 * @returns {Generator<Element, void>}
	 */
	_QueryDFS: function *_QueryDFS(root, query, filter) {
		for (const elem of root.children) {
			if (elem.matches(query)) {
				yield elem;
			}

			if (filter(elem)) {
				continue;
			} else {
				yield *ElementButton._QueryDFS(elem, query, filter);
			}
		}
	},

	/**
	 * Click event listener for radio buttons.
	 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/radio_role
	 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/menuitemradio_role
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickRadio: function _ClickRadio(ev) {
		// Take precaution against nested radio groups/menus, as one might accidentally query a sibbling that belongs to a different group
		// Particularly important for menus embedded in other menus or menubars
		const role = this.getAttribute("role");
		const isRadio = role === "radio";
		const parent = this.parentElement?.closest(isRadio ? "[role='radiogroup']" : "[role='menu'], [role='menubar']");
		if (!parent) {
			return;
		}

		// Ensure that `radio` buttons to switch the tabindex of the active radio to 0, while `menuitemradio` buttons do not
		if (this.getAttribute("aria-checked") === "true") {
			if (parent.getAttribute("aria-required") === "true") {
				if (!this.hasAttribute("data-allow-required-clicks")) {
					ev.stopImmediatePropagation();
				}
			} else {
				this.setAttribute("aria-checked", "false");
				if (isRadio) {
					/** @type {(e: Element) => boolean} */
					const filter = (e) => e.getAttribute("role") === "radiogroup" || !ElementCheckVisibility(e);
					const first = ElementButton._QueryDFS(parent, `[role='${role}']`, filter).next();
					if (first.value) {
						this.tabIndex = -1;
						first.value.setAttribute("tabindex", "0");
					}
				}
				if (this.getAttribute("aria-expanded") === "true") {
					this.setAttribute("aria-expanded", "false");
				}
			}
		} else {
			/** @type {(e: Element) => boolean} */
			const filter = isRadio
				? (e) => e.getAttribute("role") === "radiogroup"
				: (e) => e.getAttribute("role") === "menu" || e.getAttribute("role") === "menuitem";
			let prev = ElementButton._QueryDFS(parent, `[role='${role}'][aria-checked='true']`, filter).next();
			if (!prev.value && isRadio) {
				prev = ElementButton._QueryDFS(parent, `[role='${role}'][tabindex='0']`, filter).next();
			}

			if (prev.value) {
				prev.value.setAttribute("aria-checked", "false");
				if (prev.value.getAttribute("aria-expanded") === "true") {
					prev.value.setAttribute("aria-expanded", "false");
				}
				if (isRadio) {
					prev.value.setAttribute("tabindex", "-1");
				}
			}

			if (this.getAttribute("aria-expanded") === "false") {
				this.setAttribute("aria-expanded", "true");
			}
			if (isRadio) {
				this.tabIndex = 0;
			}
			this.setAttribute("aria-checked", "true");
		}
	},

	/**
	 * Click event listener for spin buttons.
	 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/spinbutton_role
	 * @private
	 * @type {(this: HTMLButtonElement, ev: MouseEvent) => void}
	 */
	_ClickSpin: function _ClickSpin(ev) {
		const min = Number.parseInt(this.getAttribute("aria-valuemin"), 10);
		const max = Number.parseInt(this.getAttribute("aria-valuemax"), 10);
		const now = Number.parseInt(this.getAttribute("aria-valuenow"), 10);
		if (Number.isNaN(min) || Number.isNaN(max)) {
			ev.stopImmediatePropagation();
			return;
		}

		if (Number.isNaN(now) || now < min || now === max) {
			this.setAttribute("aria-valuenow", min);
		} else if (now > max) {
			this.setAttribute("aria-valuenow", max);
		} else {
			this.setAttribute("aria-valuenow", now + 1);
		}
	},

	/**
	 * Keydown event listener for spin buttons.
	 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/spinbutton_role
	 * @private
	 * @type {(this: HTMLButtonElement, ev: KeyboardEvent) => void}
	 */
	_KeyDownSpin: function _KeyDownSpin(ev) {
		if (CommonKey.GetModifiers(ev)) {
			return;
		}

		// Decrement the current value such that the next click action will bring it to the correct, expected value
		let valuenow = null;
		switch (ev.key) {
			case "ArrowRight":
			case "ArrowUp":
				valuenow = this.getAttribute("aria-valuenow");
				break;
			case "ArrowLeft":
			case "ArrowDown":
				valuenow = Number.parseInt(this.getAttribute("aria-valuenow"), 10) - 2;
				break;
			case "Home":
				valuenow = Number.parseInt(this.getAttribute("aria-valuemax"), 10) - 1;
				break;
			case "End":
				valuenow = this.getAttribute("aria-valuemax");
				break;
		}

		if (valuenow != null) {
			this.setAttribute("aria-valuenow", valuenow);
			this.click();
			ev.stopPropagation();
			ev.preventDefault();
		}
	},

	/**
	 * @this {HTMLElement}
	 * @param {KeyboardEvent} ev
	 */
	_KeyDownRadio: function _KeyDownRadio(ev) {
		if (CommonKey.GetModifiers(ev)) {
			return;
		}

		switch (ev.key) {
			case "ArrowRight":
			case "ArrowDown":
			case "ArrowLeft":
			case "ArrowUp": {
				const sibblings = Array.from(this.closest("[role='radiogroup']")?.querySelectorAll("button[role='radio']") ?? []).filter(e => ElementCheckVisibility(e));
				const thisIdx = sibblings.indexOf(this);
				if (thisIdx === -1) {
					return;
				}

				/** @type {Element} */
				let next = this;
				const nSibblings = sibblings.length;
				if (ev.key === "ArrowDown" || ev.key === "ArrowRight") {
					next = sibblings[(thisIdx + 1) % nSibblings];
				} else {
					next = thisIdx === 0 ? sibblings[nSibblings - 1] : sibblings[(thisIdx - 1) % nSibblings];
				}

				if (next !== this) {
					/** @type {HTMLButtonElement} */(next).click();
					/** @type {HTMLButtonElement} */(next).focus();
					ev.stopPropagation();
					ev.preventDefault();
				}
				break;
			}
		}
	},

	/**
	 * Click event listener for checkbox buttons.
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickCheckbox: function _ClickCheckbox(ev) {
		if (this.getAttribute("aria-checked") === "true") {
			if (this.getAttribute("aria-expanded") === "true") {
				this.setAttribute("aria-expanded", "false");
			}
			this.setAttribute("aria-checked", "false");
		} else {
			if (this.getAttribute("aria-expanded") === "false") {
				this.setAttribute("aria-expanded", "true");
			}
			this.setAttribute("aria-checked", "true");
		}
	},

	/**
	 * @private
	 * @param {string} id
	 * @param {string} [img]
	 * @param {Omit<HTMLOptions<"img">, "tag">} [options]
	 * @returns {HTMLImageElement}
	 */
	_ParseImage: function _ParseImage(id, img, options) {
		if (!img) {
			return;
		}

		options ??= {};
		return ElementCreate({
			...options,
			tag: "img",
			classList: ["button-image", ...(options.classList ?? [])],
			attributes: { id: `${id}-image`, decoding: "async", loading: "lazy", "aria-hidden": "true", src: img, ...(options.attributes ?? {}) },
		});
	},

	/**
	 * @private
	 * @param {string} id
	 * @param {ElementButton.StaticNode} [label]
	 * @param {"top" | "center" | "bottom"} [position]
	 * @param {Omit<HTMLOptions<"span">, "tag">} [options]
	 * @returns {HTMLSpanElement}
	 */
	_ParseLabel: function _ParseLabel(id, label, position, options) {
		label = (CommonIsArray(label) ? label : [label]).filter(i => i != null);
		if (label.length === 0) {
			return;
		}

		options ??= {};
		const labelPosition = this._LabelPositions[position] ?? this._LabelPositions.bottom;
		return ElementCreate({
			...options,
			tag: "span",
			attributes: { id: `${id}-label`, for: id, ...(options.attributes ?? {}) },
			classList: ["button-label", labelPosition, ...(options.classList ?? [])],
			children: [...label, ...(options.children ?? [])],
		});
	},

	/**
	 * Parse the passed icon list, returning its corresponding `<img>` grid and tooltip if non-empty
	 * @param {string} id - The ID of the parent element
	 * @param {readonly (InventoryIcon | ElementButton.CustomIcon)[]} [icons] - The (optional) list of icons
	 * @returns {null | { iconGrid: HTMLDivElement, tooltip: [string, HTMLElement] }} - `null` if the provided icon list is empty and otherwise an object containing the icon grid and a icon-specific tooltip
	 */
	_ParseIcons: function _ParseIcons(id, icons) {
		icons = icons?.filter(i => i != null);
		if (!icons || icons.length === 0) {
			return null;
		}

		const tooltip = document.getElementById(`${id}-icon-ul`) ?? ElementCreate({
			tag: "ul",
			attributes: { id: `${id}-icon-ul` },
			classList: ["button-icon-tooltip-ul"],
			children: [],
		});

		const iconGrid = /** @type {HTMLDivElement} */(document.getElementById(`${id}-icon-grid`)) ?? ElementCreate({
			tag: "div",
			classList: ["button-icon-grid"],
			attributes: { id: `${id}-icon-grid`, "aria-hidden": "true" },
		});
		const iconNames = Array.from(iconGrid.querySelectorAll(".button-icon")).map(el => el.getAttribute("data-name"));

		icons.forEach((icon) => {
			let custom = false;
			/** @type {string} */
			let name;
			/** @type {string} */
			let src;
			/** @type {(string | Node | HTMLOptions<any>)[]} */
			let tooltipChildren;
			if (typeof icon === "object") {
				custom = true;
				name = icon.name;
				src = icon.iconSrc;
				tooltipChildren = (CommonIsArray(icon.tooltipText) ? icon.tooltipText : [icon.tooltipText]).filter(i => i != null);
			} else if (icon.endsWith("Padlock")) {
				name = icon;
				src = `./Assets/Female3DCG/ItemMisc/Preview/${icon}.png`;
				tooltipChildren = [InterfaceTextGet("PreviewIconPadlock").replace(
					"AssetName",
					AssetGet("Female3DCG", "ItemMisc", icon).Description,
				)];
			} else {
				name = icon;
				src = `./Icons/Previews/${icon}.png`;
				tooltipChildren = [InterfaceTextGet(`PreviewIcon${icon}`)];
			}
			if (iconNames.includes(name)) {
				return;
			}

			ElementCreate({
				tag: "li",
				attributes: { id: `${id}-icon-li-${name}` },
				classList: ["button-icon-tooltip-li"],
				children: tooltipChildren,
				parent: tooltip,
				style: { "background-image": src.startsWith("data:image") ? `url("${src}")` : `url("./${src}")` },
			});

			ElementCreate({
				tag: "img",
				classList: ["button-icon"],
				attributes: { decoding: "async", loading: "lazy", src, "aria-owns": `${id}-icon-li-${name}` },
				dataAttributes: { name, custom: custom ? "" : undefined },
				parent: iconGrid,
			});
		});
		return { iconGrid, tooltip: [InterfaceTextGet("StatusAndEffects"), tooltip] };
	},

	/**
	 * @private
	 * @param {string} id
	 * @param {"left" | "right" | "top" | "bottom"} [position]
	 * @param {readonly (null | string | Node | HTMLOptions<any>)[]} [children]
	 * @param {Omit<HTMLOptions<"div">, "tag">} [options]
	 * @returns {null | HTMLDivElement}
	 */
	_ParseTooltip: function _ParseTooltip(id, position, children, options) {
		if (!children || children.every(i => i == null)) {
			return null;
		}

		options ??= {};
		const tooltipPosition = this._TooltipPositions[position] ?? this._TooltipPositions.left;
		return ElementCreate({
			...options,
			tag: "div",
			classList: ["button-tooltip", tooltipPosition, ...(options.classList ?? [])],
			attributes: {
				id: `${id}-tooltip`,
				role: "tooltip",
				...(options.attributes ?? {}),
			},
			children,
		});
	},

	/**
	 * Create a generic button.
	 * @param {null | string} id - The ID of the to-be created search button
	 * @param {(this: HTMLButtonElement, ev: MouseEvent | TouchEvent) => any} onClick - The click event listener to-be attached to the tooltip
	 * @param {null | ElementButton.Options} [options] - High level options for the to-be created button
	 * @param {null | Partial<Record<"button" | "tooltip" | "img" | "label", Omit<HTMLOptions<any>, "tag">>>} htmlOptions - Additional low-level {@link ElementCreate} options to-be applied to the either the button or tooltip
	 * @returns {HTMLButtonElement} - The created button
	 */
	Create: function Create(id, onClick, options=null, htmlOptions=null) {
		id ??= ElementGenerateID();
		let elem = /** @type {HTMLButtonElement | null} */(document.getElementById(id));
		if (elem) {
			console.error(`Element "${id}" already exists`);
			return elem;
		}

		htmlOptions ??= {};
		const buttonOptions = htmlOptions.button ?? {};
		const tooltipOptions = htmlOptions.tooltip ?? {};

		options ??= {};
		const labelPosition = options.labelPosition ?? (options.image == null ? "center" : "bottom");
		const image = this._ParseImage(id, options.image, htmlOptions.img);
		const label = this._ParseLabel(id, options.label, labelPosition, htmlOptions.label);
		const icons = this._ParseIcons(id, options.icons);

		// Only add the icon-based component of the tooltip if there is an actual tooltip
		/** @type {(null | string | Node | HTMLOptions<any>)[]} */
		const protoTooltip = [...(CommonIsArray(options.tooltip) ? options.tooltip : [options.tooltip])];
		if (!protoTooltip.every(i => i == null)) {
			protoTooltip.push(...(icons?.tooltip ?? []));
		}
		protoTooltip.push(...(tooltipOptions.children ?? []));
		const tooltip = this._ParseTooltip(id, options.tooltipPosition, protoTooltip, tooltipOptions);

		/** @type {null | "aria-labelledby" | "aria-describedby"} */
		let tooltipRoleAttribute = null;
		switch (options.tooltipRole ?? null) {
			case "label":
				tooltipRoleAttribute = "aria-labelledby";
				break;
			case "description":
				tooltipRoleAttribute = "aria-describedby";
				break;
			case null:
				tooltipRoleAttribute = (label ? "aria-describedby" : "aria-labelledby");
				break;
		}

		elem = ElementCreate({
			...buttonOptions,
			tag: "button",
			attributes: {
				id,
				name: id,
				[tooltipRoleAttribute]: tooltip ? `${id}-tooltip` : undefined,
				"screen-generated": CurrentScreen,
				role: options.role,
				type: "button",
				...(buttonOptions.attributes ?? {}),
			},
			classList: ["blank-button", "button", options.noStyling ? null : "button-styling", "HideOnPopup", ...(buttonOptions.classList ?? [])],
			eventListeners: {
				keydown: this._KeyDown,
				keyup: this._KeyUp,
				mousedown: this._MouseDown,
				bcClickDisabled: options.clickDisabled,
				...this._GetClickTouchListeners(),
				...(buttonOptions.eventListeners ?? {}),
			},
			children: [
				tooltip,
				image,
				icons?.iconGrid,
				label,
				...(buttonOptions.children ?? []),
			],
			dataAttributes: {
				"allowRequiredClicks": options.allowRequiredClick,
				...(buttonOptions.dataAttributes ?? {}),
			},
		});

		const role = buttonOptions.attributes?.role ?? options.role;
		switch (role) {
			case "radio":
			case "menuitemradio":
				elem.addEventListener("click", this._ClickRadio);
				if (!elem.getAttribute("aria-checked")) {
					elem.setAttribute("aria-checked", "false");
				}

				if (role === "radio") {
					elem.addEventListener("keydown", this._KeyDownRadio);
					if (elem.getAttribute("tabindex") == null) {
						elem.tabIndex = elem.getAttribute("aria-checked") === "true" ? 0 : -1;
					}
				}
				break;
			case "checkbox":
			case "menuitemcheckbox":
				elem.addEventListener("click", this._ClickCheckbox);
				if (!elem.getAttribute("aria-checked")) {
					elem.setAttribute("aria-checked", "false");
				}
				break;
			case "spinbutton": {
				if (!elem.hasAttribute("aria-valuemin")) {
					elem.setAttribute("aria-valuemin", "0");
				}
				if (!elem.hasAttribute("aria-valuemax")) {
					elem.setAttribute("aria-valuemax", "100");
				}
				if (!elem.hasAttribute("aria-valuenow")) {
					elem.setAttribute("aria-valuenow", elem.getAttribute("aria-valuemin"));
				}
				elem.addEventListener("click", this._ClickSpin);
				elem.addEventListener("keydown", this._KeyDownSpin);
			}
		}

		elem.addEventListener("click", onClick);

		if (options.disabled) {
			const menuItemRoles = ["menuitem", "menuitemradio", "menuitemcheckbox"];
			if (menuItemRoles.some(i => elem.getAttribute("role") === i)) {
				elem.setAttribute("aria-disabled", true);
			} else {
				elem.disabled = true;
			}
		}
		return elem;
	},

	/**
	 * Create a button for an asset or item, including image, label and icons.
	 * @param {string | null} idPrefix - The ID of the to-be created search button
	 * @param {Asset | Item} asset - The asset (or item) for which to create a button
	 * @param {null | Character} C - The character wearing the asset/item (if any)
	 * @param {(this: HTMLButtonElement, ev: MouseEvent | TouchEvent) => any} onClick - The click event listener to-be attached to the tooltip
	 * @param {null | ElementButton.Options} [options] - High level options for the to-be created button
	 * @param {null | Partial<Record<"button" | "tooltip" | "img" | "label", Omit<HTMLOptions<any>, "tag">>>} htmlOptions - Additional low-level {@link ElementCreate} options to-be applied to the either the button or tooltip
	 * @returns {HTMLButtonElement} - The created button
	 */
	CreateForAsset: function CreateForAsset(idPrefix, asset, C, onClick, options=null, htmlOptions=null) {
		const item = "Asset" in asset ? asset : { Asset: asset };
		asset = item.Asset;

		const id = idPrefix == null ? ElementGenerateID() : `${idPrefix}-${asset.Group.Name}-${asset.Name}`;
		const elem = /** @type {HTMLButtonElement | null} */(document.getElementById(id));
		if (elem) {
			console.error(`Element "${id}" already exists`);
			return elem;
		}

		/** @type {null | TextCache} */
		let craftCache = null;
		if (item.Craft) {
			craftCache = TextPrefetchFile("Screens/Room/Crafting/Text_Crafting.csv");
		}

		htmlOptions ??= {};
		htmlOptions.button ??= {};
		htmlOptions.button.attributes ??= {};
		htmlOptions.button.attributes.name ??= asset.Name;
		htmlOptions.button.dataAttributes ??= {};
		htmlOptions.button.dataAttributes.group ??= asset.Group.Name;
		htmlOptions.button.dataAttributes.craft ??= item.Craft ? "" : undefined;
		htmlOptions.button.dataAttributes.hidden ??= CharacterAppearanceItemIsHidden(asset.Name, asset.Group.Name) ? "" : undefined;
		htmlOptions.button.dataAttributes.vibrating ??= item.Property?.Effect?.includes("Vibrating") ? "" : undefined;
		htmlOptions.button.children = [
			...(htmlOptions.button.children ?? []),
			ElementButton._ParseImage(`${idPrefix}-hidden`, "./Icons/HiddenItem.png", { dataAttributes: { hidden: "" } }),
		];
		htmlOptions.tooltip ??= {};
		htmlOptions.tooltip.classList ??= [];
		htmlOptions.tooltip.classList = [
			...htmlOptions.tooltip.classList,
			"button-tooltip-justify",
		];

		options ??= {};
		options.label ??= item.Craft?.Name || asset.Description;
		options.image ??= `./Assets/Female3DCG/${asset.DynamicGroupName}/Preview/${asset.Name}.png`;
		options.icons = [
			...(options.icons ?? []),
			DialogGetFavoriteStateDetails(C ?? Player, asset)?.Icon,
			InventoryBlockedOrLimited(C ?? Player, item) ? "Blocked" : null,
			InventoryIsAllowedLimited(C ?? Player, item) ? "AllowedLimited" : null,
			...DialogGetLockIcon(item, "Property" in item),
			...DialogGetAssetIcons(asset),
			...DialogEffectIcons.GetIcons(item),
		];
		options.tooltipPosition ??= "bottom";
		options.tooltip ??= !item.Craft ? "" : /** @type {HTMLOptions<any>[]} */([
			...(CommonIsArray(options.tooltip) ? options.tooltip : [options.tooltip]),
			{
				tag: "span",
				children: [InterfaceTextGet("DialogMenuCrafting") + ":"],
			},
			{
				tag: "ul",
				classList: ["button-tooltip-craft"],
				children: [
					item.Craft.Property ? {
						tag: "li",
						children: [
							InterfaceTextGet("CraftingProperty").replace("CraftProperty", ""),
							{
								tag: "q",
								children: [{ tag: "dfn", children: [item.Craft.Property] }, " - "],
							},
						],
					} : undefined,
					(item.Craft.MemberName && item.Craft.MemberNumber) ? {
						tag: "li",
						children: [
							InterfaceTextGet("CraftingMember").replace("MemberName (MemberNumber)", ""),
							{ tag: "q", children: [`${item.Craft.MemberName} (${item.Craft.MemberNumber})`] },
						],
					} : undefined,
					{
						tag: "li",
						children: [
							InterfaceTextGet("CraftingPrivate").replace("CraftPrivate", ""),
							{ tag: "q", children: [CommonCapitalize(item.Craft.Private.toString())] },
						],
					},
					item.Craft.Description ? {
						tag: "li",
						children: [
							InterfaceTextGet("CraftingDescription").replace("CraftDescription", ""),
							{ tag: "q", children: CraftingDescription.DecodeToHTML(item.Craft.Description) },
						],
					} : undefined,
				],
			},
		]);

		const button = ElementButton.Create(id, onClick, options, htmlOptions);
		craftCache?.loadedPromise.then((textCache) => {
			const dfn = button.querySelector(".button-tooltip-craft dfn");
			if (dfn) {
				dfn.parentElement?.append(textCache.get(`Description${dfn.textContent}`));
			}
		});
		return button;
	},

	/**
	 * Create a button for an activity, including image, label and icons.
	 * @param {string | null} idPrefix - The ID of the to-be created search button
	 * @param {ItemActivity} activity - The activity for which to create a button
	 * @param {Character} C - The target character of the activity
	 * @param {(this: HTMLButtonElement, ev: MouseEvent | TouchEvent) => any} onClick - The click event listener to-be attached to the tooltip
	 * @param {null | ElementButton.Options} [options] - High level options for the to-be created button
	 * @param {null | Partial<Record<"button" | "tooltip" | "img" | "label", Omit<HTMLOptions<any>, "tag">>>} htmlOptions - Additional low-level {@link ElementCreate} options to-be applied to the either the button or tooltip
	 * @returns {HTMLButtonElement} - The created button
	 */
	CreateForActivity: function CreateForActivity(idPrefix, activity, C, onClick, options=null, htmlOptions=null) {
		const id = idPrefix == null ? ElementGenerateID() : `${idPrefix}-${activity.Activity.Name}`;
		const elem = /** @type {HTMLButtonElement | null} */(document.getElementById(id));
		if (elem) {
			console.error(`Element "${id}" already exists`);
			return elem;
		}

		htmlOptions ??= {};
		htmlOptions.button ??= {};
		htmlOptions.button.attributes ??= {};
		htmlOptions.button.attributes.name ??= activity.Activity.Name;
		htmlOptions.button.dataAttributes ??= {};
		htmlOptions.button.dataAttributes.group ??= activity.Group;
		htmlOptions.tooltip ??= {};
		htmlOptions.tooltip.classList ??= [];
		htmlOptions.tooltip.classList = [
			...htmlOptions.tooltip.classList,
			"button-tooltip-justify",
		];

		options ??= {};
		options.label ??= ActivityDictionaryText(ActivityBuildChatTag(C, AssetGroupGet(C.AssetFamily, activity.Group), activity.Activity, true));
		options.image ??= (activity.Item ? `./${AssetGetPreviewPath(activity.Item.Asset)}/${activity.Item.Asset.Name}.png` : `./Assets/Female3DCG/Activity/${activity.Activity.Name}.png`);
		options.icons = [
			...(options.icons ?? []),
			activity.Blocked === "blocked" ? "Blocked" : undefined,
			activity.Blocked === "limited" ? "AllowedLimited" : undefined,
			activity.Item ? "Handheld" : undefined,
		];
		options.tooltipPosition ??= "bottom";
		options.tooltip ??= options.icons.length ? [""] : undefined;
		return ElementButton.Create(id, onClick, options, htmlOptions);
	},

	/**
	 * Reload the icons of the passed {@link ElementButton.CreateForAsset} button based on the items & characters current state.
	 * @param {HTMLButtonElement} button - The button in question
	 * @param {Asset | Item} asset - The asset (or item) for linked to the button
	 * @param {null | Character} C - The character wearing the asset/item (if any)
	 * @returns {boolean} - Whether the icons were updated or not
	 */
	ReloadAssetIcons: function ReloadAssetIcons(button, asset, C) {
		const item = "Asset" in asset ? asset : { Asset: asset };
		asset = item.Asset;

		const icons = Array.from(button.querySelectorAll(".button-icon"));
		const iconNamesOld = icons.map(el => el.getAttribute("data-name"));
		/** @type {InventoryIcon[]} */
		const iconNamesNew = [
			DialogGetFavoriteStateDetails(C ?? Player, asset)?.Icon,
			InventoryBlockedOrLimited(C ?? Player, item) ? "Blocked" : null,
			InventoryIsAllowedLimited(C ?? Player, item) ? "AllowedLimited" : null,
			...DialogGetLockIcon(item, "Property" in item),
			...DialogGetAssetIcons(asset),
			...DialogEffectIcons.GetIcons(item),
		];

		const iconNamesAdded = iconNamesNew.filter(i => i != null && !iconNamesOld.includes(i));
		const iconNamesRemoved = iconNamesOld.filter(i => !/** @type {string[]} */(iconNamesNew).includes(i));
		if (iconNamesAdded.length === 0 && iconNamesRemoved.length === 0) {
			return false;
		}

		for (const icon of icons) {
			if (!icon.hasAttribute("data-custom")) {
				const tooltipComponentID = icon.getAttribute("aria-owns");
				if (tooltipComponentID) { document.getElementById(tooltipComponentID)?.remove(); }
				icon.remove();
			}
		}

		const { iconGrid, tooltip } = ElementButton._ParseIcons(button.id, iconNamesAdded) ?? { tooltip: [] };
		if (iconGrid && !button.contains(iconGrid)) {
			button.append(iconGrid);
		}
		if (tooltip[1] && !button.contains(tooltip[1])) {
			button.querySelector(".button-tooltip")?.append(...tooltip);
		}
		return true;
	},
};

/**
 * Namespace for constructing menu bars
 * @namespace
 */
var ElementMenu = {
	/**
	 * KeyDown event listener that implements menubar-style keyboard navigation
	 * @this {HTMLElement}
	 * @param {KeyboardEvent} ev
	 */
	_KeyDown: async function _KeyDown(ev) {
		if (ev.altKey || ev.metaKey || ev.ctrlKey) {
			return;
		}

		const parent = this.closest("[role='menu'], [role='menubar']");
		if (!parent) {
			return;
		}

		// Find the outer-most menu in case we're dealing with nested menus
		let grandParent = parent;
		/** @type {null | HTMLElement} */
		let grandParentCandidate = grandParent.closest("[role='menubar'], [role='menu']");
		while (grandParentCandidate && grandParentCandidate !== grandParent) {
			grandParent = grandParentCandidate;
			grandParentCandidate = grandParent.closest("[role='menubar'], [role='menu']");
		}

		let key = ev.key;
		if (parent.getAttribute("data-direction") === "rtl") {
			// Flip all the keys of the direction of the menu grid is right-to-left
			switch (key) {
				case "ArrowRight":
					key = "ArrowLeft";
					break;
				case "ArrowLeft":
					key = "ArrowRight";
					break;
				case "Home":
					key = "End";
					break;
				case "End":
					key = "Home";
					break;
			}
		}

		if (parent.getAttribute("aria-orientation") === "vertical") {
			switch (key) {
				case "ArrowRight":
					key = "ArrowDown";
					break;
				case "ArrowLeft":
					key = "ArrowUp";
					break;
				case "ArrowDown":
					key = "ArrowRight";
					break;
				case "ArrowUp":
					key = "ArrowLeft";
					break;
			}
		}

		let isTab = false;
		if (key === "Tab") {
			key = ev.shiftKey ? "ArrowLeft" : "ArrowRight";
			isTab = true;
		} else if (ev.shiftKey) {
			return;
		}

		// Selector for all non-hidden menu items
		const selector = "[role='menuitem'], [role='menuitemradio'], [role='menuitemcheckbox']";
		switch (key) {
			case "ArrowRight":
			case "ArrowLeft": {
				const elements = /** @type {HTMLElement[]} */(Array.from(grandParent.querySelectorAll(selector)).filter(e => ElementCheckVisibility(e)));
				const idx = elements.indexOf(this);
				if (idx === -1) {
					return;
				}

				const increment = key === "ArrowRight" ? 1 : -1;
				const elem = elements[idx + increment];
				if (!elem && isTab) {
					// We've reached the end/start of the menu:
					// abort and let the tab-based keydown event propogate towards whatever next focusable element lays outside of the grid
					return;
				}
				elem?.focus();
				ev.preventDefault();
				ev.stopPropagation();
				break;
			}
			case "Home":
			case "End": {
				const elements = /** @type {HTMLElement[]} */(Array.from(grandParent.querySelectorAll(selector)).filter(e => ElementCheckVisibility(e)));
				const idx = key === "Home" ? 0 : elements.length - 1;
				elements[idx]?.focus();
				ev.stopPropagation();
				break;
			}
			case "ArrowUp":
			case "ArrowDown": {
				if (this.getAttribute("aria-haspopup") !== "true" && this.getAttribute("aria-haspopup") !== "menu") {
					return;
				}

				// We're assuming (well, mandating really...) that click actions a sub menu
				this.click();
				const elements = /** @type {HTMLElement[]} */(Array.from(this.querySelectorAll(selector)).filter(e => ElementCheckVisibility(e)));
				const idx = key === "ArrowUp" ? elements.length - 1 : 0;
				elements[idx]?.focus();
				ev.stopPropagation();
				break;
			}
		}
	},

	/**
	 * Construct a menubar of button elements
	 * @example
	 * <div id={id} role="menubar">
	 *     <button role="menuitem" />
	 *     <input role="menuitem" type="text" />
	 *     <button role="menuitem" aria-haspopup="menu">
	 *         <div style={ display: "none" }>
	 *             <button role="menuitem" />
	 *             <button role="menuitem" />
	 *             ...
	 *         </div>
	 *     </button>
	 *     ...
	 * </div>
	 * @param {string | null} id - The menu's ID
	 * @param {readonly (string | Node | HTMLOptions<keyof HTMLElementTagNameMap>)[]} menuItems - The menu's content.
	 * Any `<button>` element without a role (regardless of nesting) will be assigned the `menuitem` role and thus be elligble for menu-style navigation.
	 * Buttons that open a sub-menu _must_ have the `aria-haspopup: "menu"` attribute set and must be able to do so via a click action.
	 * @param {Object} [options]
	 * @param {"ltr" | "rtl"} [options.direction] - The direction of the menu. Should match the value of the CSS `direction` property if provided
	 * @param {"menubar" | "menu"} [options.role] - The role of the menu/menubar
	 * @param {null | Partial<Record<"menu", Omit<HTMLOptions<any>, "tag">>>} htmlOptions - Additional {@link ElementCreate} options to-be applied to the respective (child) element
	 * @returns {HTMLDivElement} - The menu
	 */
	Create: function Create(id, menuItems, options=null, htmlOptions=null) {
		id ??= ElementGenerateID();
		let elem = /** @type {HTMLDivElement | null} */(document.getElementById(id));
		if (elem) {
			console.error(`Element "${id}" already exists`);
			return elem;
		}

		options ??= {};
		const direction = options.direction ?? "ltr";

		htmlOptions ??= {};
		const menuOptions = htmlOptions.menu ?? {};
		elem = ElementCreate({
			...menuOptions,
			tag: "div",
			attributes: {
				id,
				role: options.role ?? "menubar",
				"screen-generated": CurrentScreen,
				...(menuOptions.attributes ?? {}),
			},
			parent: menuOptions.parent ?? document.body,
			dataAttributes: { direction, ...(menuOptions.dataAttributes ?? {}) },
			classList: ["menubar", "HideOnPopup", ...(menuOptions.classList ?? [])],
			children: [...menuItems, ...(menuOptions.children ?? [])],
		});

		let first = true;
		elem.querySelectorAll("button, [role='menuitem'], [role='menuitemradio'], [role='menuitemcheckbox']").forEach((menuitem) => {
			let role = menuitem.getAttribute("role");
			if (!role) {
				role = "menuitem";
				menuitem.setAttribute("role", "menuitem");
			}

			if (role !== "menuitem" && role !== "menuitemradio" && role !== "menuitemcheckbox") {
				return;
			}

			// Can't directly use `Element.checkVisibility` here as the menubar is not guaranteed to have a parent at this point
			if (first && (menuitem instanceof HTMLElement && menuitem.style.display !== "none") && getComputedStyle(menuitem).display !== "none") {
				first = false;
				menuitem.setAttribute("tabindex", "0");
			} else {
				menuitem.setAttribute("tabindex", "-1");
			}
			menuitem.addEventListener("keydown", this._KeyDown);

			// Ensure that disabled buttons use `aria-disabled` in order to keep them focusable
			if (menuitem instanceof HTMLButtonElement && menuitem.disabled) {
				menuitem.disabled = false;
				menuitem.setAttribute("aria-disabled", "true");
			}
		});
		return elem;
	},

	/**
	 * Append a menuitem to the passed menubar
	 * @param {HTMLElement} menu - The menubar
	 * @param {readonly HTMLElement[]} menuitems - The to-be prepended menuitem
	 */
	AppendButton: function AppendButton(menu, ...menuitems) {
		if (!menu || !menuitems) {
			return;
		}

		let i = 0;
		const firstMenuItem = menu.querySelector("[role='menuitem'][tab-index='0'], [role='menuitemradio'][tab-index='0'], [role='menuitemcheckbox'][tab-index='0']");
		for (const elem of menuitems) {
			let role = elem.getAttribute("role");
			if (!role) {
				role = "menuitem";
				elem.setAttribute("role", "menuitem");
			}

			if (role !== "menuitem" && role !== "menuitemradio" && role !== "menuitemcheckbox") {
				continue;
			}

			if (i === 0 && !firstMenuItem) {
				elem.tabIndex = 0;
			} else {
				elem.tabIndex = -1;
			}
			elem.addEventListener("keydown", this._KeyDown);
			i++;
		}
		menu.append(...menuitems);
	},

	/**
	 * Prepend a menuitem to the passed menubar
	 * @param {HTMLElement} menu - The menubar
	 * @param {readonly HTMLElement[]} menuitems - The to-be prepended menuitem
	 */
	PrependItem: function PrependButton(menu, ...menuitems) {
		if (!menu || !menuitems) {
			return;
		}

		let i = 0;
		const firstMenuItem = menu.querySelector("[role='menuitem'][tab-index='0'], [role='menuitemradio'][tab-index='0'], [role='menuitemcheckbox'][tab-index='0']");
		for (const elem of menuitems) {
			let role = elem.getAttribute("role");
			if (!role) {
				role = "menuitem";
				elem.setAttribute("role", "menuitem");
			}

			if (role !== "menuitem" && role !== "menuitemradio" && role !== "menuitemcheckbox") {
				continue;
			}

			if (i === 0) {
				firstMenuItem?.setAttribute("tabindex", "-1");
				elem.tabIndex = 0;
			} else {
				elem.tabIndex = -1;
			}
			elem.addEventListener("keydown", this._KeyDown);
			i++;
		}
		menu.prepend(...menuitems);
	},
};

/**
 * Namespace for creating DOM checkboxes.
 */
var ElementCheckbox = {
	/**
	 * Construct an return a DOM checkbox element (`<input type="checkbox">`)
	 * @param {null | string} id - The ID of the element, or `null` if one must be assigned automatically
	 * @param {(this: HTMLInputElement, ev: Event) => any} onChange - The change event listener to-be fired upon checkbox clicks
	 * @param {null | ElementCheckbox.Options} options - High level options for the to-be created checkbox
	 * @param {null | Partial<Record<"checkbox", Omit<HTMLOptions<any>, "tag">>>} htmlOptions - Additional {@link ElementCreate} options to-be applied to the respective (child) element
	 */
	Create: function Create(id, onChange, options=null, htmlOptions=null) {
		id ??= ElementGenerateID();
		const checkbox = document.getElementById(id);
		if (checkbox) {
			console.error(`Element "${id}" already exists`);
			return checkbox;
		}

		options ??= {};
		const checkboxOptions = htmlOptions?.checkbox ?? {};
		return ElementCreate({
			...checkboxOptions,
			tag: "input",
			attributes: {
				id,
				type: "checkbox",
				disabled: options.disabled,
				checked: options.checked,
				value: options.value,
				...(checkboxOptions.attributes ?? {}),
			},
			classList: ["checkbox", ...(checkboxOptions.classList ?? [])],
			eventListeners: {
				change: onChange,
				...(checkboxOptions.eventListeners ?? {}),
			},
		});
	},
};

/**
 * Return whether an element is visible or not.
 *
 * Approximate polyfill of [`Element.checkVisibility()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/checkVisibility),
 * as its browser support is still somewhat limited (~88% at the time of writing).
 * @param {Element} el - The element in question
 * @param {CheckVisibilityOptions} [options] - Additional options to-be passed to `Element.checkVisibility()`
 * @returns {boolean} - Whether the passed element is visible or not
 */
function ElementCheckVisibility(el, options) {
	if (!el) {
		return false;
	}

	if (typeof el.checkVisibility === "function") {
		options ??= {};
		return el.checkVisibility({ ...options, checkVisibilityCSS: options.checkVisibilityCSS ?? true });
	} else {
		// @ts-expect-error: Element does not expose style but HTMLElement does
		return (!el.style || el.style.display !== "none") && getComputedStyle(el).display !== "none";
	}
}

/**
 * Get an element by its ID or DOM element reference, returning null if it does not exist.
 * @param {ElementHelp.ElementOrId} elementOrId
 * @returns { HTMLElement | null }
 */
function ElementWrap(elementOrId) {
	if (elementOrId instanceof HTMLElement) return elementOrId;
	if (typeof elementOrId === 'string') return document.getElementById(elementOrId);
	return null;
}

/**
 * Scales a given height value relative to the current canvas height.
 * @param {number} height
 * @returns {number}
 */
function ElementCanvasScaledHeight(height) {
	return height * (MainCanvas.canvas.clientHeight / MainCanvasHeight);
}

/**
 * Scales a given width value relative to the current canvas width.
 * @param {number} width
 * @returns {number}
 */
function ElementCanvasScaledWidth(width) {
	return width * (MainCanvas.canvas.clientWidth / MainCanvasWidth);
}

/**
 * Calculates the Y position on the canvas in pixels, accounting for anchor alignment.
 * @param {number} yPos
 * @param {ElementHelp.AnchorY} anchorPosition
 * @returns {number}
 */
function ElementCanvasScaledY(yPos, anchorPosition = 'top') {
	const scaleY = MainCanvas.canvas.clientHeight / MainCanvasHeight;
	return anchorPosition === 'top'
    ? MainCanvas.canvas.offsetTop + yPos * scaleY
    : MainCanvas.canvas.offsetTop + MainCanvas.canvas.clientHeight - yPos * scaleY;
}

/**
 * Calculates the X position on the canvas in pixels, accounting for anchor alignment.
 * @param {number} xPos
 * @param {ElementHelp.AnchorX} anchorPosition
 * @returns {number}
 */
function ElementCanvasScaledX(xPos, anchorPosition = 'left') {
	const scaleX = MainCanvas.canvas.clientWidth / MainCanvasWidth;
	return anchorPosition === 'left'
    ? MainCanvas.canvas.offsetLeft + xPos * scaleX
    : MainCanvas.canvas.offsetLeft + MainCanvas.canvas.clientWidth - xPos * scaleX;
}

/**
 * Positions an HTML element on the canvas relative to a specified anchor.
 * @param {ElementHelp.ElementOrId} elementOrId
 * @param {number} xPos
 * @param {number} yPos
 * @param {ElementHelp.AnchorXY} [anchorPosition]
 */
function ElementSetPosition(elementOrId, xPos = 0, yPos = 0, anchorPosition = 'top-left') {
	const element = ElementWrap(elementOrId);

	if (!element) {
		console.warn("A call to ElementSetPosition was made on non-existent element with ID '" + elementOrId + "'");
		return;
	}

	const yAnchor = anchorPosition === 'top-left' || anchorPosition === 'top-right' ? 'top' : 'bottom';
	const xAnchor = anchorPosition === 'top-left' || anchorPosition === 'bottom-left' ? 'left' : 'right';

	const y = ElementCanvasScaledY(yPos, yAnchor);
	const x = ElementCanvasScaledX(xPos, xAnchor);

	Object.assign(element.style, {
		position: 'fixed',
		[xAnchor]: x + 'px',
		[yAnchor]: y + 'px',
	});
}

/**
 * Sets the width and/or height of an element relative to the canvas scale.
 * @param {ElementHelp.ElementOrId} elementOrId
 * @param {number | null} width
 * @param {number | null} height
 */
function ElementSetSize(elementOrId, width = null, height = null) {
	const element = ElementWrap(elementOrId);

	if (!element) {
		console.warn("A call to ElementSetSize was made on non-existent element with ID '" + elementOrId + "'");
		return;
	}

	if (width !== null) {
		const Width = ElementCanvasScaledWidth(width);
		Object.assign(element.style, {
			width: Width + 'px',
		});
	}

	const fontSize = element.style.fontSize;
	if (height === null && fontSize) {
		height = parseFloat(fontSize) * 1.15;
	}

	if (height !== null) {
		const Height = ElementCanvasScaledHeight(height);
		Object.assign(element.style, {
			height: Height + 'px',
		});
	}
}

/**
 * Sets the font size of an element scaled relative to the smaller canvas dimension.
 * @param {ElementHelp.ElementOrId} elementOrId
 * @param {number | 'auto'} targetFontSize
 */
function ElementSetFontSize(elementOrId, targetFontSize = 'auto') {
	const element = ElementWrap(elementOrId);

	if (!element) {
		console.warn("A call to ElementSetFontSize was made on non-existent element with ID '" + elementOrId + "'");
		return;
	}

	const canvasWidth = MainCanvas.canvas.clientWidth;
	const canvasHeight = MainCanvas.canvas.clientHeight;

	const scaleFactor = Math.min(canvasWidth, canvasHeight) / 1000;

	const autoFontSize = MainCanvas.canvas.clientWidth <= MainCanvas.canvas.clientHeight * 2 ? MainCanvas.canvas.clientWidth / 50 : MainCanvas.canvas.clientHeight / 25;

	const fontSize = targetFontSize === 'auto' ? autoFontSize : targetFontSize * scaleFactor;

	Object.assign(element.style, {
		fontSize: fontSize + 'px',
		fontFamily: CommonGetFontName()
	});
}
