"use strict";

/**
 * Handles the value of a HTML element. It sets the value of the element when the Value parameter is provided or it returns the value when the parameter is omitted
 * @param {string} ID - The id of the element for which we want to get/set the value.
 * @param {string} [Value] - The value to give to the element (if applicable)
 * @returns {string} - The value of the element (When no value parameter was passed to the function)
 */
function ElementValue(ID, Value) {
	const e = /** @type {HTMLInputElement} */(document.getElementById(ID));
	if (!e) {
		console.error("ElementValue called on a missing element: " + ID.toString());
		return "";
	}

	if (Value == null)
		return e.value.trim();

	e.value = Value;
	return "";
}

/**
 * Handles the content of a HTML element. It sets the content of the element when the Content parameter is provided or it returns the value when the parameter is omitted
 * @param {string} ID - The id of the element for which we want to get/set the value.
 * @param {string} [Content] - The content/inner HTML to give to the element (if applicable)
 * @returns {string} - The content of the element (When no Content parameter was passed to the function)
 */
function ElementContent(ID, Content) {
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
		if (v != null) {
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
		if (v != null) {
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
 * @param {string} ID - The id of the form to create
 * @returns {HTMLFormElement}
 */
function ElementCreateForm(ID) {
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
 * @param {string} ID - The id of the text area to create.
 * @param {HTMLElement} [form] - The form the element belongs to
 * @returns {HTMLTextAreaElement}
 */
function ElementCreateTextArea(ID, form) {
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
 * Creates a new text input element in the main document.Does not create a new element if there is already an existing one with the same ID
 * @param {string} ID - The id of the input tag to create.
 * @param {string} Type - Type of the input tag to create.
 * @param {string} Value - Value of the input tag to create.
 * @param {string | number} [MaxLength] - Maximum input tag of the input to create.
 * @param {Node} [form] - The form the element belongs to
 * @returns {HTMLInputElement} - The created HTML input element
 */
function ElementCreateInput(ID, Type, Value, MaxLength, form) {
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
			break;
	}

	return e;
}

/**
 * Creates a new range input element in the main document. Does not create a new element if there is already an
 * existing one with the same id
 * @param {string} id - The id of the input tag to create
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
		classList: vertical ? ["HideOnPopup", "Vertical"] : ["HideOnPopup"],
		eventListeners: {
			focus() { this.removeAttribute("readonly"); },
		},
	});
}

/**
 * Creates a dropdown element and adjusts it to the BC look and feel. In the HTML Code this will look like this:
 * <div> -- enclosing div used for css and postioning
 *     <select> -- the select statement with its options
 *         <option 1>
 *         <option n>
 *     </select>
 *     <div></div> -- the div representing the currently selected item
 *     <div> -- div for the various options
 *        <div>Option 1</div>
 *        <div>Option n</div>
 *     </div>
 * </div>
 * This construct is built automatically and ignores the original select statement. All the logic is handled by
 * event handlers that are connected to the various divs. See comments in the code.
 * What this function cannot handle at the moment:
 * - The size is always set to 1
 * - Multiple selects are impossible
 * @param {string} id - The name of the select item. The outer div will get this name, for positioning. The select
 * tag will get the name ID+"-select"
 * @param {readonly string[]} Options - The list of options for the current select statement
 * @param {null | ((this: HTMLSelectElement, event: Event) => any)} [ClickEventListener=null] - An event listener to be called, when the value of the drop down box changes
 * @returns {HTMLDivElement} - The created element
 */
function ElementCreateDropdown(id, Options, ClickEventListener) {
	if (document.getElementById(id) != null) {
		return /** @type {HTMLDivElement} */(document.getElementById(id));
	}

	document.addEventListener("click", ElementCloseAllSelect);
	return ElementCreate({
		tag: "div",
		classList: ["custom-select"],
		attributes: { id },
		parent: document.body,
		children: [
			{
				tag: "select",
				attributes: { id: `${id}-select`, name: `${id}-select` },
				eventListeners: { change: ClickEventListener ?? undefined },
				children: Options.map(option => {
					return {
						tag: "option",
						attributes: { value: option },
						children: [option],
					};
				}),
			},
			{
				tag: "div",
				classList: ["select-selected"],
				children: [Options[0]],
				eventListeners: {
					click(e) {
						//when the select box is clicked, close any other select boxes, and open/close the current select box:
						e.stopPropagation();
						ElementCloseAllSelect(this);
						this.nextElementSibling.classList.toggle("select-hide");
					},
				},
			},
			{
				tag: "div",
				classList: ["select-items", "select-hide"],
				children: Options.map(option => {
					return {
						tag: "div",
						children: [option],
						eventListeners: {
							click() {
								// when an item is clicked, update the original select box, and the selected item:
								const selectedItem = /** @type {HTMLDivElement} */(this.parentElement.previousSibling);
								const select = /** @type {HTMLSelectElement} */(selectedItem.previousSibling);
								for (let j = 0; j < select.length; j++) {
									if (select.options[j].innerHTML != this.innerHTML) {
										continue;
									}

									select.selectedIndex = j; // Fake the selection of an option
									selectedItem.innerHTML = this.innerHTML; // Update the drop down box
									var y = this.parentElement.getElementsByClassName("same-as-selected");
									for (let k = 0; k < y.length; k++) {
										y[k].classList.remove("same-as-selected");
									}
									this.classList.add("same-as-selected");
									break;
								}
								selectedItem.click(); // Evove a click events
								select.dispatchEvent(new Event("change")); // Evoke a onChange events
							},
						},
					};
				}),
			},
		],
	});
}

/**
 * Closes all select boxes in the current document, except the current select box
 * @param {object} elmnt - The select box to exclude from the closing
 * @returns {void} - Nothing
 */
function ElementCloseAllSelect(elmnt) {
	/*a function that will close all select boxes in the document,
	except the current select box:*/
	var arrNo = [];
	var y = document.getElementsByClassName("select-selected");
	for (let i = 0; i < y.length; i++) {
		if (elmnt == y[i]) arrNo.push(i);
	}
	var x = document.getElementsByClassName("select-items");
	for (let i = 0; i < x.length; i++) {
		if (arrNo.indexOf(i)) x[i].classList.add("select-hide");
	}
}

/**
 * Creates a new div element in the main document. Does not create a new element if there is already an existing one with the same ID
 * @param {string} ID - The id of the div tag to create.
 * @returns {HTMLDivElement} - The created (or pre-existing) div element
 */
function ElementCreateDiv(ID) {
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
 * @param {string} ID - The id of the tag to remove from the document.
 * @returns {void} - Nothing
 */
function ElementRemove(ID) {
	if (document.getElementById(ID) != null)
		document.getElementById(ID).parentNode.removeChild(document.getElementById(ID));
}

/**
 * Draws an existing HTML element at a specific position within the document. The element is "centered" on the given coordinates by dividing its height and width by two.
 * @param {string} ElementID - The id of the input tag to (re-)position.
 * @param {number} X - Center point of the element on the X axis.
 * @param {number} Y - Center point of the element on the Y axis.
 * @param {number} W - Width of the element.
 * @param {number} [H] - Height of the element.
 * @returns {void} - Nothing
 */
function ElementPosition(ElementID, X, Y, W, H) {
	var E = document.getElementById(ElementID);

	if (!E) {
		console.warn("A call to ElementPosition was made on non-existent element with ID '" + ElementID + "'");
		return;
	}

	// For a vertical slider, swap the width and the height (the transformation is handled by CSS)
	if (E.tagName.toLowerCase() === "input" && E.getAttribute("type") === "range" && E.classList.contains("Vertical")) {
		var tmp = W;
		W = H;
		H = tmp;
	}

	// Different positions based on the width/height ratio
	const HRatio = MainCanvas.canvas.clientHeight / 1000;
	const WRatio = MainCanvas.canvas.clientWidth / 2000;
	const Font = MainCanvas.canvas.clientWidth <= MainCanvas.canvas.clientHeight * 2 ? MainCanvas.canvas.clientWidth / 50 : MainCanvas.canvas.clientHeight / 25;
	const Height = H ? H * HRatio : 4 + Font * 1.15;
	const Width = W * WRatio;
	const Top = MainCanvas.canvas.offsetTop + Y * HRatio - Height / 2;
	const Left = MainCanvas.canvas.offsetLeft + (X - W / 2) * WRatio;

	// Sets the element style
	Object.assign(E.style, {
		fontSize: Font + "px",
		fontFamily: CommonGetFontName(),
		position: "fixed",
		left: Left + "px",
		top: Top + "px",
		width: Width + "px",
		height: Height + "px",
	});
}

/**
 * Draws an existing HTML element at a specific position within the document. The element will not be centered on its given coordinates unlike the ElementPosition function.
 * Not same as ElementPositionFix. Calculates Font size itself.
 * @param {string} ElementID - The id of the input tag to (re-)position.
 * @param {number} X - Starting point of the element on the X axis.
 * @param {number} Y - Starting point of the element on the Y axis.
 * @param {number} W - Width of the element.
 * @param {number} [H] - Height of the element.
 * @returns {void} - Nothing
 */
function ElementPositionFixed(ElementID, X, Y, W, H) {
	var E = document.getElementById(ElementID);
	// Verify the element exists
	if (!E) {
		console.warn("A call to ElementPositionFix was made on non-existent element with ID '" + ElementID + "'");
		return;
	}

	// Different positions based on the width/height ratio
	const HRatio = MainCanvas.canvas.clientHeight / 1000;
	const WRatio = MainCanvas.canvas.clientWidth / 2000;
	const Font = MainCanvas.canvas.clientWidth <= MainCanvas.canvas.clientHeight * 2 ? MainCanvas.canvas.clientWidth / 50 : MainCanvas.canvas.clientHeight / 25;
	const Top = MainCanvas.canvas.offsetTop + Y * HRatio;
	const Height = H ? H * HRatio : Font * 1.15;
	const Left = MainCanvas.canvas.offsetLeft + X * WRatio;
	const Width = W * WRatio;

	// Sets the element style
	Object.assign(E.style, {
		fontSize: Font + "px",
		fontFamily: CommonGetFontName(),
		position: "fixed",
		left: Left + "px",
		top: Top + "px",
		width: Width + "px",
		height: Height + "px",
	});

}

/**
 * Draws an existing HTML element at a specific position within the document. The element will not be centered on its given coordinates unlike the ElementPosition function.
 * @param {string} ElementID - The id of the input tag to (re-)position.
 * @param {number} Font - The size of the font to use.
 * @param {number} X - Starting point of the element on the X axis.
 * @param {number} Y - Starting point of the element on the Y axis.
 * @param {number} W - Width of the element.
 * @param {number} H - Height of the element.
 * @returns {void} - Nothing
 */
function ElementPositionFix(ElementID, Font, X, Y, W, H) {
	var E = document.getElementById(ElementID);
	// Verify the element exists
	if (!E) {
		console.warn("A call to ElementPositionFix was made on non-existent element with ID '" + ElementID + "'");
		return;
	}

	// Different positions based on the width/height ratio
	const HRatio = MainCanvas.canvas.clientHeight / 1000;
	const WRatio = MainCanvas.canvas.clientWidth / 2000;
	Font *= Math.max(HRatio, WRatio);
	const Top = MainCanvas.canvas.offsetTop + Y * HRatio;
	const Height = H * HRatio;
	const Left = MainCanvas.canvas.offsetLeft + X * WRatio;
	const Width = W * WRatio;

	// Sets the element style
	Object.assign(E.style, {
		fontSize: Font + "px",
		fontFamily: CommonGetFontName(),
		position: "fixed",
		left: Left + "px",
		top: Top + "px",
		width: Width + "px",
		height: Height + "px",
	});

}

/**
 * Sets a custom data-attribute to a specified value on a specified element
 * @param {string} ID - The id of the element to create/set the data attribute of.
 * @param {string} Name - Name of the data attribute. ("data-" will be automatically appended to it.)
 * @param {string} Value - Value to give to the attribute.
 * @returns {void} - Nothing
 */
function ElementSetDataAttribute(ID, Name, Value) {
	var element = document.getElementById(ID);
	if (element != null) {
		element.setAttribute(("data-" + Name).toLowerCase(), Value.toString().toLowerCase());
	}
}

/**
 * Sets an attribute to a specified value on a specified element
 * @param {string} ID - The id of the element to create/set the data attribute of.
 * @param {string} Name - Name of the attribute.
 * @param {string} Value - Value to give to the attribute.
 * @returns {void} - Nothing
 */
function ElementSetAttribute(ID, Name, Value) {
	var element = document.getElementById(ID);
	if (element != null) {
		element.setAttribute(Name, Value);
	}
}

/**
 * Removes an attribute from a specified element.
 * @param {string} ID - The id of the element from which to remove the attribute.
 * @param {string} Name - Name of the attribute to remove.
 * @returns {void} - Nothing
 */
function ElementRemoveAttribute(ID, Name) {
	var element = document.getElementById(ID);
	if (element != null) {
		element.removeAttribute(Name);
	}
}

/**
 * Scrolls to the end of a specified element
 * @param {string} ID - The id of the element to scroll down to the bottom of.
 * @returns {void} - Nothing
 */
function ElementScrollToEnd(ID) {
	var element = document.getElementById(ID);
	if (element != null) element.scrollTop = element.scrollHeight;
}

/**
 * Returns the given element's scroll position as a percentage, with the top of the element being close to 0 depending on scroll bar size, and the bottom being around 1.
 * To clarify, this is the position of the bottom edge of the scroll bar.
 * @param {string} ID - The id of the element to find the scroll percentage of.
 * @returns {(number|null)} - A float representing the scroll percentage.
 */
function ElementGetScrollPercentage(ID) {
	var element = document.getElementById(ID);
	if (element != null) {
		if (element.scrollTop === 0) return 0;
		return (element.scrollTop + element.clientHeight) / element.scrollHeight;
	}

	return null;
}

/**
 * Checks if a given HTML element is scrolled to the very bottom.
 * @param {string} ID - The id of the element to check for scroll height.
 * @returns {boolean} - Returns TRUE if the specified element is scrolled to the very bottom
 */
function ElementIsScrolledToEnd(ID) {
	var element = document.getElementById(ID);
	return element != null && element.scrollHeight - element.scrollTop - element.clientHeight <= 1;
}

/**
 * Sets the scroll position of an element to a specified percentage of its scrollable content.
 * Ideally scroll percentage should be gotten with {@link ElementGetScrollPercentage}
 *
 * @param {string} ID
 * @param {number} scrollPercentage
 * @param {ScrollBehavior} scrollBehavior
 * @returns {void}
 */
function ElementSetScrollPercentage(ID, scrollPercentage, scrollBehavior = 'auto') {
	const element = document.getElementById(ID);
	if (!element) {
		console.error(`Element with ID "${ID}" not found.`);
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
 * @param {string} ID - The id of the element to give focus to.
 * @returns {void} - Nothing
 */
function ElementFocus(ID) {
	if ((document.getElementById(ID) != null) && !CommonIsMobile)
		document.getElementById(ID).focus();
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
				{
					tag: "input",
					classList: ["dropdown-checkbox"],
					attributes: { id: `${idPrefix}-checkbox-${idSuffix}`, type: "checkbox", checked },
					eventListeners: { click: listener },
				},
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
	 * @param {string} id - The ID of the element
	 * @param {readonly string[]} checkboxList - The checkbox labels
	 * @param {(this: HTMLInputElement, event: Event) => void} eventListener - The event listener to-be attached to all checkboxes
	 * @param {Object} [options]
	 * @param {HTMLElement} [options.parent] - The parent element of the dropdown menu; defaults to {@link document.body}
	 * @param {boolean} [options.checked] - Whether all checkboxes should be initially checked
	 * @returns {HTMLDivElement} - The created dropdown menu
	 */
	FromList(id, checkboxList, eventListener, options=null) {
		return /** @type {null | HTMLDivElement} */(document.getElementById(id)) ?? ElementCreate({
			tag: "div",
			attributes: { id, ["screen-generated"]: CurrentScreen },
			parent: options?.parent ?? document.body,
			classList: ["HideOnPopup", "dropdown"],
			style: { display: "none" },
			children: checkboxList.map((o) => this._CreateCheckboxPair(id, o, o, eventListener, options?.checked)),
		});
	},

	/**
	 * Construct a dropdown menu with labeled checkboxes, each group of checkboxes having a header associated with them
	 * @param {string} id - The ID of the element
	 * @param {Record<string, readonly string[]>} checkboxRecord - The checkbox labels
	 * @param {(this: HTMLInputElement, event: Event) => void} eventListener - The event listener to-be attached to all checkboxes
	 * @param {Object} [options]
	 * @param {HTMLElement} [options.parent] - The parent element of the dropdown menu; defaults to {@link document.body}
	 * @param {boolean} [options.checked] - Whether all checkboxes should be initially checked
	 * @returns {HTMLDivElement} - The created dropdown menu
	 */
	FromRecord(id, checkboxRecord, eventListener, options=null) {
		return /** @type {null | HTMLDivElement} */(document.getElementById(id)) ?? ElementCreate({
			tag: "div",
			attributes: { id, ["screen-generated"]: CurrentScreen },
			parent: options?.parent ?? document.body,
			classList: ["HideOnPopup", "dropdown"],
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
 * @param {string} id - The ID of the to-be created search input; `${id}-datalist` will be assigned the search input's datalist
 * @param {() => Iterable<string>} dataCallback - A callback returning all values that will be converted into a datalist `<option>`
 * @param {Object} [options]
 * @param {null | string} [options.value] - Value of the search input
 * @param {null | Node} [options.parent] - The parent element of the search input; defaults to {@link document.body}
 * @param {null | number} [options.maxLength] - Maximum input length of the search input
 * @returns {HTMLInputElement} - The newly created search input
 */
function ElementCreateSearchInput(id, dataCallback, options=null) {
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
		if (ev.shiftKey || ev.ctrlKey || ev.metaKey || ev.altKey) {
			return;
		}
		switch (ev.key) {
			case "Enter":
			case " ":
				ev.preventDefault();

				if (this.disabled || this.ariaDisabled === "true") {
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
				if (this.disabled || this.ariaDisabled === "true") {
					ev.stopImmediatePropagation();
					return;
				}
				this.removeAttribute("data-active");
				break;
		}
	},

	/**
	 * @private
	 * @type {(this: HTMLButtonElement, ev: MouseEvent | TouchEvent) => void}
	 */
	_Click: function _Click(ev) {
		if (this.ariaDisabled === "true") {
			ev.stopImmediatePropagation();
		}
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
		const isRadio = this.role === "radio";
		const parent = this.parentElement?.closest(isRadio ? "[role='radiogroup']" : "[role='menu'], [role='menubar']");
		if (!parent) {
			return;
		}

		// Ensure that `radio` buttons to switch the tabindex of the active radio to 0, while `menuitemradio` buttons do not
		if (this.ariaChecked === "true") {
			if (parent.ariaRequired === "true") {
				ev.stopImmediatePropagation();
			} else {
				this.ariaChecked = "false";
				if (isRadio) {
					/** @type {(e: Element) => boolean} */
					const filter = (e) => e.role === "radiogroup" || !ElementCheckVisibility(e);
					const first = ElementButton._QueryDFS(parent, `[role='${this.role}']`, filter).next();
					if (first.value) {
						this.tabIndex = -1;
						first.value.setAttribute("tabindex", "0");
					}
				}
				if (this.ariaExpanded === "true") {
					this.ariaExpanded = "false";
				}
			}
		} else {
			/** @type {(e: Element) => boolean} */
			const filter = isRadio
				? (e) => e.role === "radiogroup"
				: (e) => e.role === "menu" || e.role === "menuitem";
			let prev = ElementButton._QueryDFS(parent, `[role='${this.role}'][aria-checked='true']`, filter).next();
			if (!prev.value && isRadio) {
				prev = ElementButton._QueryDFS(parent, `[role='${this.role}'][tabindex='0']`, filter).next();
			}

			if (prev.value) {
				prev.value.ariaChecked = "false";
				if (prev.value.ariaExpanded === "true") {
					prev.value.ariaExpanded = "false";
				}
				if (isRadio) {
					prev.value.setAttribute("tabindex", "-1");
				}
			}

			if (this.ariaExpanded === "false") {
				this.ariaExpanded = "true";
			}
			if (isRadio) {
				this.tabIndex = 0;
			}
			this.ariaChecked = "true";
		}
	},

	/**
	 * Click event listener for checkbox buttons.
	 * @private
	 * @type {(this: HTMLButtonElement, ev: Event) => void}
	 */
	_ClickCheckbox: function _ClickCheckbox(ev) {
		if (this.ariaChecked === "true") {
			if (this.ariaExpanded === "true") {
				this.ariaExpanded = "false";
			}
			this.ariaChecked = "false";
		} else {
			if (this.ariaExpanded === "false") {
				this.ariaExpanded = "true";
			}
			this.ariaChecked = "true";
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
			attributes: { id: `${id}-image`, decoding: "async", loading: "lazy", src: img, ...(options.attributes ?? {}) },
		});
	},

	/**
	 * @private
	 * @param {string} id
	 * @param {string} [label]
	 * @param {"top" | "center" | "bottom"} [position]
	 * @param {Omit<HTMLOptions<"label">, "tag">} [options]
	 * @returns {HTMLLabelElement}
	 */
	_ParseLabel: function _ParseLabel(id, label, position, options) {
		if (!label) {
			return;
		}

		options ??= {};
		const labelPosition = this._LabelPositions[position] ?? this._LabelPositions.bottom;
		return ElementCreate({
			...options,
			tag: "label",
			attributes: { id: `${id}-label`, for: id, ...(options.attributes ?? {}) },
			classList: ["button-label", labelPosition, ...(options.classList ?? [])],
			children: [label, ...(options.children ?? [])],
		});
	},

	/**
	 * Parse the passed icon list, returning its corresponding `<img>` grid and tooltip if non-empty
	 * @param {string} id - The ID of the parent element
	 * @param {readonly InventoryIcon[]} [icons] - The (optional) list of icons
	 * @returns {null | { iconGrid: HTMLDivElement, tooltip: HTMLUListElement }} - `null` if the provided icon list is empty and otherwise an object containing the icon grid and a icon-specific tooltip
	 */
	_ParseIcons: function _ParseIcons(id, icons) {
		if (!icons || icons.length === 0) {
			return null;
		}

		const tooltip = ElementCreate({
			tag: "ul",
			attributes: { id: `${id}-icon-ul` },
			classList: ["button-icon-tooltip-ul"],
			children: [],
		});
		const iconGrid = ElementCreate({
			tag: "div",
			classList: ["button-icon-grid"],
			children: icons.map((icon) => {
				let src, tooltipText;
				if (icon.endsWith("Padlock")) {
					src = `Assets/Female3DCG/ItemMisc/Preview/${icon}.png`;
					tooltipText = InterfaceTextGet("PreviewIconPadlock").replace(
						"AssetName",
						AssetGet("Female3DCG", "ItemMisc", icon).Description,
					);
				} else {
					src = `Icons/Previews/${icon}.png`;
					tooltipText = InterfaceTextGet(`PreviewIcon${icon}`);
				}

				ElementCreate({
					tag: "li",
					attributes: { id: `${id}-icon-li-${icon}` },
					classList: ["button-icon-tooltip-li"],
					children: [tooltipText],
					parent: tooltip,
				});

				return {
					tag: "img",
					classList: ["button-icon"],
					attributes: { decoding: "async", loading: "lazy", src, "aria-labelledby": `${id}-icon-li-${icon}` },
				};
			}),
		});
		return { iconGrid, tooltip };
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
	 * Create a button with a tooltip
	 *
	 * @example
	 * <button id={id}>
	 *     <div id={`${id}-tooltip`} />
	 * </button>
	 * @param {null | string} id - The ID of the to-be created search button
	 * @param {(this: HTMLButtonElement, ev: MouseEvent | TouchEvent) => any} onClick - The click event listener to-be attached to the tooltip
	 * @param {Object} [options]
	 * @param {null | string | Node | readonly (null | string | Node)[]} [options.tooltip] - Optional tooltip content. If not supplied then one should manually prepend it to the tooltip later
	 * @param {"left" | "right" | "top" | "bottom"} [options.tooltipPosition] - The position of the tooltip w.r.t. the button
	 * @param {string} [options.label]
	 * @param {"top" | "center" | "bottom"} [options.labelPosition]
	 * @param {string} [options.image]
	 * @param {readonly InventoryIcon[]} [options.icons]
	 * @param {"radio" | "checkbox" | "menuitemradio" | "menuitemcheckbox"} [options.role] - The role of the button. All accepted values are currently special-cased in order to set role-specific event listeners and/or attributes.
	 * @param {boolean} [options.noStyling] - Whether to limit the default styling of the button's border and background
	 * @param {boolean} [options.disabled] - Whether the button should be disabled or not
	 * @param {null | Partial<Record<"button" | "tooltip" | "img" | "label", Omit<HTMLOptions<any>, "tag">>>} htmlOptions - Additional {@link ElementCreate} options to-be applied to the either the button or tooltip
	 * @returns {HTMLButtonElement} - The created button
	 */
	Create: function Create(id, onClick, options=null, htmlOptions=null) {
		let elem = /** @type {HTMLButtonElement | null} */(document.getElementById(id));
		if (elem) {
			console.error(`Element "${id}" already exists`);
			return elem;
		}

		htmlOptions ??= {};
		const buttonOptions = htmlOptions.button ?? {};
		const tooltipOptions = htmlOptions.tooltip ?? {};

		id ??= `button-${Date.now()}`;
		options ??= {};
		const image = this._ParseImage(id, options.image, htmlOptions.img);
		const label = this._ParseLabel(id, options.label, options.labelPosition, htmlOptions.label);
		const icons = this._ParseIcons(id, options.icons);

		// Only add the icon-based component of the tooltip if there is an actual tooltip
		/** @type {(null | string | Node | HTMLOptions<any>)[]} */
		const protoTooltip = [...(CommonIsArray(options.tooltip) ? options.tooltip : [options.tooltip])];
		if (!protoTooltip.every(i => i == null)) {
			protoTooltip.push(icons?.tooltip);
		}
		protoTooltip.push(...(tooltipOptions.children ?? []));
		const tooltip = this._ParseTooltip(id, options.tooltipPosition, protoTooltip, tooltipOptions);

		elem = ElementCreate({
			...buttonOptions,
			tag: "button",
			attributes: {
				id,
				name: id,
				"aria-describedby": `${id}-tooltip`,
				"screen-generated": CurrentScreen,
				role: options.role,
				...(buttonOptions.attributes ?? {}),
			},
			classList: ["blank-button", "button", options.noStyling ? null : "button-styling", "HideOnPopup", ...(buttonOptions.classList ?? [])],
			eventListeners: {
				click: this._Click,
				keydown: this._KeyDown,
				keyup: this._KeyUp,
				...(buttonOptions.eventListeners ?? {}),
			},
			children: [
				tooltip,
				image,
				icons?.iconGrid,
				label,
				...(buttonOptions.children ?? []),
			],
		});

		switch (buttonOptions.attributes?.role ?? options.role) {
			case "radio":
			case "menuitemradio":
				elem.addEventListener("click", this._ClickRadio);
				elem.ariaChecked ??= "false";
				break;
			case "checkbox":
			case "menuitemcheckbox":
				elem.addEventListener("click", this._ClickCheckbox);
				elem.ariaChecked ||= "false";
				break;
		}

		elem.addEventListener("click", onClick);

		if (options.disabled) {
			const menuItemRoles = ["menuitem", "menuitemradio", "menuitemcheckbox"];
			if (menuItemRoles.some(i => elem.role === i)) {
				elem.setAttribute("aria-disabled", true);
			} else {
				elem.disabled = true;
			}
		}
		return elem;
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
				if (this.ariaHasPopup !== "true" && this.ariaHasPopup !== "menu") {
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
	 * @param {string} id - The menu's ID
	 * @param {readonly (string | Node | HTMLOptions<keyof HTMLElementTagNameMap>)[]} menuItems - The menu's content.
	 * Any `<button>` element without a role (regardless of nesting) will be assigned the `menuitem` role and thus be elligble for menu-style navigation.
	 * Buttons that open a sub-menu _must_ have the `aria-haspopup: "menu"` attribute set and must be able to do so via a click action.
	 * @param {Object} [options]
	 * @param {"ltr" | "rtl"} [options.direction] - The direction of the menu. Should match the value of the CSS `direction` property if provided
	 * @param {null | Partial<Record<"menu", Omit<HTMLOptions<any>, "tag">>>} htmlOptions - Additional {@link ElementCreate} options to-be applied to the respective (child) element
	 * @returns {HTMLDivElement} - The menu
	 */
	Create: function Create(id, menuItems, options=null, htmlOptions=null) {
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
				role: "menubar",
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
			menuitem.role ||= "menuitem";
			if (menuitem.role !== "menuitem" && menuitem.role !== "menuitemradio" && menuitem.role !== "menuitemcheckbox") {
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
				menuitem.ariaDisabled = "true";
			}
		});
		return elem;
	},

	/**
	 * Append a menuitem to the passed menubar
	 * @param {HTMLDivElement} div - The menubar
	 * @param {HTMLElement} menuitem - The to-be prepended menuitem
	 */
	AppendButton: function AppendButton(div, menuitem) {
		if (!div || !menuitem) {
			return;
		}

		menuitem.tabIndex = -1;
		menuitem.role = "menuitem";
		menuitem.addEventListener("keydown", this._KeyDown);
		div.append(menuitem);
	},

	/**
	 * Prepend a menuitem to the passed menubar
	 * @param {HTMLDivElement} div - The menubar
	 * @param {HTMLElement} menuitem - The to-be prepended menuitem
	 */
	PrependItem: function PrependButton(div, menuitem) {
		if (!div || !menuitem) {
			return;
		}

		// Only the first visible menuitem must be directly focusable via tab
		if (ElementCheckVisibility(menuitem)) {
			const menuitemOld = div.querySelector("[role='menuitem'][tab-index='0']");
			if (menuitemOld) {
				menuitemOld.setAttribute("tabindex", "-1");
			}
			menuitem.tabIndex = 0;
		} else {
			menuitem.tabIndex = -1;
		}

		menuitem.role = "menuitem";
		menuitem.addEventListener("keydown", this._KeyDown);
		div.prepend(menuitem);
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
