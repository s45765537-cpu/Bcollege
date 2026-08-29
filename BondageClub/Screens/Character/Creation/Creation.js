"use strict";
var CreationBackground = "Dressing";
var CreationMessage = "";
const CreationIDs = Object.freeze({
	screen: "creation-screen",
	form: "creation-form",
	fields: "creation-fields",
	importRow: "creation-import-row",
	actions: "creation-actions",
	loginRow: "creation-login-row",
	inputCharacter: "InputCharacter",
	inputName: "InputName",
	inputPassword1: "InputPassword1",
	inputPassword2: "InputPassword2",
	inputEmail: "InputEmail",
	importCheckbox: "creation-import-checkbox",
	createButton: "creation-create-button",
	loginButton: "creation-login-button",
});

/**
 * Enter on a creation field: move focus to the next input, or submit on the last field.
 * @param {string | null} nextFieldId Next input id, or null to run {@link CreationSubmit}.
 * @returns {(this: HTMLInputElement, ev: KeyboardEvent) => void}
 */
function CreationKeyDownEnter(nextFieldId) {
	return function (ev) {
		if (!CommonKey.IsPressed(ev, "Enter")) return;
		ev.stopPropagation();
		if (nextFieldId === null) {
			CreationSubmit();
		} else {
			document.getElementById(nextFieldId)?.focus();
		}
	};
}

/**
 * Loads the character login screen. Imports data from the Bondage College if necessary
 * and creates the input fields. This function is called dynamically.
 * @type {ScreenLoadHandler}
 */
async function CreationLoad() {

	// Gets the info to import Bondage College data
	let DefaultName = "";
	const canImportBondageCollegeData = localStorage.getItem("BondageClubImportSource") === "BondageCollege";
	if (canImportBondageCollegeData) {
		ImportBondageCollegeData = true;
		DefaultName = localStorage.getItem("BondageCollegeExportName") ?? "";
	} else {
		ImportBondageCollegeData = false;
	}

	ElementDOMScreen.getTemplate(
		CreationIDs.screen,
		{
			parent: document.body,
			hgroupInHeader: true,
		},
	);

	const main = ElementWrap(`${CreationIDs.screen}-main`);
	if (!main) return;

	const form = ElementCreate({
		tag: "form",
		attributes: { id: CreationIDs.form },
		classList: ["creation-form"],
		eventListeners: {
			submit: (event) => {
				event.preventDefault();
				CreationSubmit();
			},
		},
		parent: main,
	});

	const fields = ElementCreate({
		tag: "div",
		attributes: { id: CreationIDs.fields },
		classList: ["creation-fields"],
		parent: form,
	});

	const characterName = CreationCreateLabeledInput("CharacterName", CreationIDs.inputCharacter, "text", DefaultName, "20", fields);
	characterName.setAttribute("autocomplete", "name");
	characterName.pattern = ServerCharacterNameRegex.source;
	characterName.dataset.allowedPattern = ServerCharacterNameRegex.source;
	characterName.setAttribute("enterkeyhint", "next");
	characterName.addEventListener("keydown", CreationKeyDownEnter(CreationIDs.inputName));

	const characterNameLabel = ElementWrap(`${CreationIDs.inputCharacter}-label`)?.querySelector(`.creation-label-row`);
	if (!characterNameLabel) return;
	const infoButton = ElementButton.Create(
		`character-name-info`,
		null,
		{
			image: "Icons/info_circle.svg",
			noStyling: true,
			tooltip: TextGet("CharacterNamePermanent"),
		},
		{
			button: {
				classList: ["creation-name-info"],
				attributes: { "aria-describedby": `character-name-info-tooltip` },
				parent: characterNameLabel,
			},
			tooltip: {
				classList: ["creation-name-info-tooltip"],
			},
		},
	);
	const infoTooltip = /** @type {HTMLDivElement} */(infoButton.querySelector(`.button-tooltip`));
	if (!infoTooltip) return;
	const positionTooltip = () => {
		const buttonRect = infoButton.getBoundingClientRect();
		const formRect = form.getBoundingClientRect();
		const tooltipRect = infoTooltip.getBoundingClientRect();
		const gap = Math.max(4, buttonRect.height * 0.1);
		const centeredLeft = formRect.left + (formRect.width - tooltipRect.width) / 2;
		const minLeft = formRect.left;
		const maxLeft = formRect.right - tooltipRect.width;
		infoTooltip.style.top = `${buttonRect.bottom + gap}px`;
		infoTooltip.style.left = `${Math.max(minLeft, Math.min(centeredLeft, maxLeft))}px`;
	};
	positionTooltip();
	const showTooltip = () => {
		infoTooltip.style.position = "fixed";
		positionTooltip();
		window.addEventListener("scroll", positionTooltip, { passive: true, capture: true });
		window.addEventListener("resize", positionTooltip);
	};
	const hideTooltip = () => {
		window.removeEventListener("scroll", positionTooltip, { capture: true });
		window.removeEventListener("resize", positionTooltip);
	};
	infoButton.addEventListener("mouseenter", showTooltip);
	infoButton.addEventListener("mouseleave", hideTooltip);
	infoButton.addEventListener("focus", showTooltip);
	infoButton.addEventListener("blur", hideTooltip);

	const accountName = CreationCreateLabeledInput("AccountName", CreationIDs.inputName, "text", "", "20", fields);
	accountName.setAttribute("autocomplete", "username");
	accountName.pattern = ServerAccountNameRegex.source;
	accountName.dataset.allowedPattern = ServerAccountNameRegex.source;
	accountName.setAttribute("enterkeyhint", "next");
	accountName.addEventListener("keydown", CreationKeyDownEnter(CreationIDs.inputPassword1));

	const password = CreationCreateLabeledInput("Password", CreationIDs.inputPassword1, "password", "", "20", fields);
	password.setAttribute("autocomplete", "new-password");
	password.pattern = ServerAccountPasswordRegex.source;
	password.dataset.allowedPattern = ServerAccountPasswordRegex.source;
	password.setAttribute("enterkeyhint", "next");
	password.addEventListener("keydown", CreationKeyDownEnter(CreationIDs.inputPassword2));

	const confirmPassword = CreationCreateLabeledInput("ConfirmPassword", CreationIDs.inputPassword2, "password", "", "20", fields);
	confirmPassword.setAttribute("autocomplete", "new-password");
	confirmPassword.pattern = ServerAccountPasswordRegex.source;
	confirmPassword.dataset.allowedPattern = ServerAccountPasswordRegex.source;
	confirmPassword.setAttribute("enterkeyhint", "next");
	confirmPassword.addEventListener("keydown", CreationKeyDownEnter(CreationIDs.inputEmail));

	const email = CreationCreateLabeledInput("Email", CreationIDs.inputEmail, "email", "", "100", fields);
	email.setAttribute("autocomplete", "email");
	email.dataset.allowedPattern = ServerAccountEmailRegex.source;
	email.setAttribute("enterkeyhint", "go");
	email.addEventListener("input", () => {
		email.setCustomValidity(CommonEmailIsValid(email.value) ? "" : TextGet("InvalidEmail"));
	});
	email.addEventListener("keydown", CreationKeyDownEnter(null));

	ElementCreate({
		tag: "div",
		attributes: { id: CreationIDs.importRow, hidden: !canImportBondageCollegeData },
		classList: ["creation-import-row"],
		children: [
			ElementCheckbox.CreateLabelled(
				CreationIDs.importCheckbox,
				TextGet("ImportBondageCollege"),
				function () {
					ImportBondageCollegeData = this.checked;
				},
				{ checked: ImportBondageCollegeData, orientation: "horizontal" },
				{ container: { classList: ["creation-import-checkbox"] } },
			)
		],
		parent: form,
	});

	ElementCreate({
		tag: "div",
		attributes: { id: CreationIDs.actions },
		classList: ["creation-actions"],
		children: [
			ElementButton.Create(
				CreationIDs.createButton,
				CreationSubmit,
				{ label: TextGet("CreateAccount"), name: "Create" },
			),
		],
		parent: form,
	});

	ElementCreate({
		tag: "div",
		attributes: { id: CreationIDs.loginRow },
		classList: ["creation-login-row"],
		children: [
			{
				tag: "span",
				classList: ["creation-label", "NoSelect"],
				children: [TextGet("AccountAlreadyExists")]
			},
			ElementButton.Create(
				CreationIDs.loginButton,
				CreationExit,
				{ label: TextGet("Login"), name: "Login" },
			)
		],
		parent: main,
	});
	const clearMessage = () => {
		CreationMessage = "";
		CreationUpdateMessage();
	};
	[characterName, accountName, password, confirmPassword, email].forEach(input => {
		input.addEventListener("input", () => {
			input.setCustomValidity("");
			CreationClearFieldError(input);
			clearMessage();
		});
		input.addEventListener("blur", () => {
			if (input.validity.valid) {
				CreationClearFieldError(input);
			}
		});
	});

}


/**
 * Runs the character creation screen. Draws all needed input fields and buttons.
 * If the import of Bondage College data is possible, an appropriate check box is drawn.
 * The function is called dynamically.
 * @returns {void} - Nothing
 */
function CreationRun() {

	// Draw the character and update the status message
	DrawCharacter(Player, 150, 0, 0.9);
	if (CreationMessage === "") CreationMessage = TextGet("EnterAccountCharacterInfo");
	CreationUpdateMessage();
}

/**
 * Handles the server response to a creation request. Creates the character, if possible,
 * initializes the basic data and sends the newborn to the maid in the main hall.
 * @param {ServerAccountCreateResponse} data - The recieved data from the server
 * @returns {void} - Nothing
 */
function CreationResponse(data) {
	if (typeof data === "string") {
		CreationMessage = data;
	} else if (CommonIsObject(data)) {
		if (data.ServerAnswer == "AccountCreated") {

			CreationMessage = "";

			const appearance = ServerAppearanceBundle(Player.Appearance);

			// Initialise player from the received data
			const createData = /** @type {ServerAccountData} */ ({
				ID: data.OnlineID,
				MemberNumber: data.MemberNumber,
				AccountName: ElementValue("InputName"),
				Name: ElementValue("InputCharacter"),
				Creation: CurrentTime,
				Appearance: appearance,
				Money: 100,
				Log: Player.Log,
			});

			LoginSetupPlayer(createData);

			// Force an appearance sync here since we've provided the new one manually
			ServerPlayerAppearanceSync();

			ImportBondageCollege(Player);

			// Lifted from LoginResponse
			AfkTimerSetEnabled(Player.OnlineSettings.EnableAfkTimer);
			ActivitySetArousal(Player, 0);
			ActivityTimerProgress(Player, 0);
			NotificationLoad();

			// New accounts aren't updating from old version
			CommonVersionUpdated = false;

			// Flush the controls and enters the main hall
			CommonSetScreen("Room", "MainHall");

		} else {
			// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
			CreationMessage = TextGet("Error") + " " + data.ServerAnswer;
		}
	} else {
		CreationMessage = TextGet("InvalidServerAnswer");
	}
}

/**
 * Handles click events in the creation dialog.
 * Imports data from Bondage College and creates a character.
 * @returns {void} - Nothing
 */
function CreationClick() { }

// when the user exit this screen
/**
 * Does the cleanup, if the user exits the screen
 * @type {ScreenExitHandler}
 */
function CreationExit() {
	CommonSetScreen("Character", "Login");
}

/**
 * Clears all DOM elements created for the creation screen.
 * @type {ScreenUnloadHandler}
 */
function CreationUnload() {
	ElementRemove(CreationIDs.screen);
}

function CreationResize() {
	ElementSetPosition(CreationIDs.screen, 800, 0);
	ElementSetSize(CreationIDs.screen, 1000, 1000);
	ElementSetFontSize(CreationIDs.screen, "auto");
}


/**
 * Update the current creation message in the DOM.
 * @returns {void} - Nothing
 */
function CreationUpdateMessage() {
	const status = ElementWrap(`${CreationIDs.screen}-status`);
	if (!status) return;
	const nextMessage = CreationMessage || TextGet("EnterAccountCharacterInfo");
	if (status.textContent !== nextMessage) {
		status.textContent = nextMessage;
	}
}

/**
 * Creates a labeled input for the creation screen.
 * @param {string} labelKey - The text key for the label
 * @param {string} inputId - The input element ID
 * @param {string} type - The input type
 * @param {string} value - The default value
 * @param {number | string} maxLength - The max input length
 * @param {HTMLElement} parent - The parent element
 * @returns {HTMLInputElement} - The input element
 */
function CreationCreateLabeledInput(labelKey, inputId, type, value, maxLength, parent) {
	const errorId = `${inputId}-error`;
	const labelText = `${TextGet(labelKey)} ${TextGet(`${labelKey}Desc`)}`;
	/** @type {(string | Node | HTMLOptions<any>)[]} */
	const labelRowChildren = [
		{
			tag: "span",
			classList: ["creation-label", "NoSelect"],
			children: [labelText],
		},
	];

	const label = ElementCreate({
		tag: "label",
		attributes: { for: inputId, id: `${inputId}-label` },
		classList: ["creation-field", "flex", "vertical"],
		children: [
			{
				tag: "div",
				classList: ["creation-label-row"],
				children: labelRowChildren,
			},
			{
				tag: "span",
				attributes: { id: errorId, hidden: true },
				classList: ["creation-error"],
			},
		],
		parent,
	});
	const wrapper = ElementCreate({
		tag: "div",
		classList: ["creation-input-wrapper", type === "password" ? "creation-input-wrapper-password" : undefined],
		parent: label,
	});
	const input = ElementCreateInput(inputId, type, value, maxLength, wrapper);
	if (type === "password") {
		ElementButton.Create(`${inputId}-password-toggle`, function () {
			const isVisible = input.type === "text";
			input.type = isVisible ? "password" : "text";
			this.setAttribute("aria-pressed", (!isVisible).toString());
			ElementButton.SetImage(this, isVisible ? "Icons/Rectangle/Icons3.png" : "Icons/Rectangle/Icons0.png");
		},
		{
			image: 'Icons/Rectangle/Icons3.png',
			noStyling: true,
		},
		{
			button: {
				classList: ["creation-password-toggle"],
				parent: wrapper,
			},
		});
	}
	input.dataset.errorId = errorId;
	return input;
}

/**
 * Returns a list of invalid characters based on an allowed-char regex.
 * @param {string} value - The input value to check
 * @param {RegExp} allowedCharRegex - Regex that matches allowed characters
 * @returns {string} - A comma-separated list of invalid characters
 */
function CreationDescribeInvalidCharacters(value, allowedCharRegex) {
	const invalid = [];
	for (const char of value) {
		if (!allowedCharRegex.test(char)) invalid.push(char === " " ? "<space>" : char);
	}
	if (invalid.length === 0) return "";
	const unique = Array.from(new Set(invalid));
	return TextSubstitute("InvalidCharacters", { $invalidCharacters: unique.join(" ") }).join("");
}

/**
 * Returns a user-facing max-length text.
 * @param {HTMLInputElement} input - The input element
 * @returns {string} - The max length text
 */
function CreationMaxLengthMessage(input) {
	const maxLength = input.maxLength;
	return maxLength > 0 ? TextSubstitute("MaxLength", { $maxLength: maxLength }).join("") : TextGet("MaxLengthUndefined");
}

/**
 * Returns the allowed-pattern regex for a field.
 * @param {HTMLInputElement} input - The input element
 * @returns {RegExp | null} - The allowed regex or null
 */
function CreationGetAllowedPattern(input) {
	const pattern = input.dataset.allowedPattern || input.pattern;
	if (!pattern) return null;
	try {
		return new RegExp(pattern);
	} catch {
		return null;
	}
}

/**
 * Sets an error bubble message for a field.
 * @param {HTMLInputElement} input - The input element
 * @param {string} message - The error message
 * @returns {void} - Nothing
 */
function CreationSetFieldError(input, message) {
	const errorId = input.dataset.errorId;
	if (!errorId) return;
	const errorElem = ElementWrap(errorId);
	if (!errorElem) return;
	const htmlized = CommonStringPartitionReplace(message, { "\\n": ElementCreate({ tag: "br" }) });
	errorElem.replaceChildren(...htmlized);
	errorElem.toggleAttribute("hidden", false);
}

/**
 * Clears an error bubble message for a field.
 * @param {HTMLInputElement} input - The input element
 * @returns {void} - Nothing
 */
function CreationClearFieldError(input) {
	const errorId = input.dataset.errorId;
	if (!errorId) return;
	const errorElem = ElementWrap(errorId);
	if (!errorElem) return;
	errorElem.replaceChildren();
	errorElem.toggleAttribute("hidden", true);
}

/**
 * Validates the user input fields and returns error descriptions.
 * @returns {{ errors: string[], firstInvalid: HTMLInputElement | null }} - Errors and first invalid input
 */
function CreationValidateInputs() {
	const characterInput = /** @type {HTMLInputElement} */ (ElementWrap(CreationIDs.inputCharacter));
	const nameInput = /** @type {HTMLInputElement} */ (ElementWrap(CreationIDs.inputName));
	const pass1Input = /** @type {HTMLInputElement} */ (ElementWrap(CreationIDs.inputPassword1));
	const pass2Input = /** @type {HTMLInputElement} */ (ElementWrap(CreationIDs.inputPassword2));
	const emailInput = /** @type {HTMLInputElement} */ (ElementWrap(CreationIDs.inputEmail));
	if (!characterInput || !nameInput || !pass1Input || !pass2Input || !emailInput) {
		return { errors: [TextGet("InvalidData")], firstInvalid: null };
	}

	/** @type {string[]} */
	const errors = [];
	/** @type {HTMLInputElement | null} */
	let firstInvalid = null;
	/**
	 * Sets an error message for a field.
	 * @param {HTMLInputElement} input - The input element
	 * @param {string} message - The error message
	 * @returns {void} - Nothing
	 */
	const setError = (input, message) => {
		input.setCustomValidity(message);
		CreationSetFieldError(input, message);
		errors.push(message);
		if (!firstInvalid) firstInvalid = input;
	};

	[characterInput, nameInput, pass1Input, pass2Input, emailInput].forEach(input => {
		input.setCustomValidity("");
		CreationClearFieldError(input);
	});

	if (!characterInput.value) {
		setError(characterInput, TextSubstitute("Required", { $inputName: TextGet("CharacterName") }).join(""));
	} else if (characterInput.maxLength > 0 && characterInput.value.length > characterInput.maxLength) {
		setError(characterInput, TextSubstitute("TooLong", { $inputName: TextGet("CharacterName"), $maxLength: CreationMaxLengthMessage(characterInput) }).join(""));
	} else if (characterInput.validity.patternMismatch) {
		const allowedPattern = CreationGetAllowedPattern(characterInput);
		const invalidChars = allowedPattern ? CreationDescribeInvalidCharacters(characterInput.value, allowedPattern) : "";
		setError(characterInput, TextSubstitute("InvalidFormat", {
			$inputName: TextGet("CharacterName"),
			$maxLength: CreationMaxLengthMessage(characterInput),
			$invalidCharacters: invalidChars
		}).join(""));
	}

	if (!nameInput.value) {
		setError(nameInput, TextSubstitute("Required", { $inputName: TextGet("AccountName") }).join(""));
	} else if (nameInput.maxLength > 0 && nameInput.value.length > nameInput.maxLength) {
		setError(nameInput, TextSubstitute("TooLong", { $inputName: TextGet("AccountName"), $maxLength: CreationMaxLengthMessage(nameInput) }).join(""));
	} else if (nameInput.validity.patternMismatch) {
		const allowedPattern = CreationGetAllowedPattern(nameInput);
		const invalidChars = allowedPattern ? CreationDescribeInvalidCharacters(nameInput.value, allowedPattern) : "";
		setError(nameInput, TextSubstitute("InvalidFormat", {
			$inputName: TextGet("AccountName"),
			$maxLength: CreationMaxLengthMessage(nameInput),
			$invalidCharacters: invalidChars
		}).join(""));
	}

	if (!pass1Input.value) {
		setError(pass1Input, TextSubstitute("Required", { $inputName: TextGet("Password") }).join(""));
	} else if (pass1Input.maxLength > 0 && pass1Input.value.length > pass1Input.maxLength) {
		setError(pass1Input, TextSubstitute("TooLong", { $inputName: TextGet("Password"), $maxLength: CreationMaxLengthMessage(pass1Input) }).join(""));
	} else if (pass1Input.validity.patternMismatch) {
		const allowedPattern = CreationGetAllowedPattern(pass1Input);
		const invalidChars = allowedPattern ? CreationDescribeInvalidCharacters(pass1Input.value, allowedPattern) : "";
		setError(pass1Input, TextSubstitute("InvalidFormat", {
			$inputName: TextGet("Password"),
			$maxLength: CreationMaxLengthMessage(pass1Input),
			$invalidCharacters: invalidChars
		}).join(""));
	}

	if (!pass2Input.value) {
		setError(pass2Input, TextSubstitute("Required", { $inputName: TextGet("ConfirmPassword") }).join(""));
	} else if (pass2Input.maxLength > 0 && pass2Input.value.length > pass2Input.maxLength) {
		setError(pass2Input, TextSubstitute("TooLong", { $inputName: TextGet("ConfirmPassword"), $maxLength: CreationMaxLengthMessage(pass2Input) }).join(""));
	} else if (pass2Input.validity.patternMismatch) {
		const allowedPattern = CreationGetAllowedPattern(pass2Input);
		const invalidChars = allowedPattern ? CreationDescribeInvalidCharacters(pass2Input.value, allowedPattern) : "";
		setError(pass2Input, TextSubstitute("InvalidFormat", {
			$inputName: TextGet("ConfirmPassword"),
			$maxLength: CreationMaxLengthMessage(pass2Input),
			$invalidCharacters: invalidChars
		}).join(""));
	} else if (pass1Input.value !== pass2Input.value) {
		setError(pass2Input, TextGet("BothPasswordDoNotMatch"));
	}

	if (emailInput.value) {
		if (!ServerAccountEmailRegex.test(emailInput.value)) {
			const allowedPattern = CreationGetAllowedPattern(emailInput);
			const invalidChars = allowedPattern ? CreationDescribeInvalidCharacters(emailInput.value, allowedPattern) : "";
			setError(emailInput, TextSubstitute("ContainsInvalidCharacters", { $inputName: TextGet("Email"), $invalidCharacters: invalidChars }).join(""));
		} else if (!CommonEmailIsValid(emailInput.value)) {
			setError(emailInput, TextSubstitute("InvalidEmail", { $inputName: TextGet("Email") }).join(""));
		}
	}

	return { errors, firstInvalid };
}

/**
 * Attempts to create a new account after validation.
 * @returns {void} - Nothing
 */
function CreationSubmit() {
	if (CreationMessage === TextGet("CreatingCharacter")) return;

	const CharacterName = ElementValue(CreationIDs.inputCharacter);
	const Name = ElementValue(CreationIDs.inputName);
	const Password1 = ElementValue(CreationIDs.inputPassword1);
	const Email = ElementValue(CreationIDs.inputEmail);

	const validation = CreationValidateInputs();
	if (validation.errors.length) {
		validation.firstInvalid?.focus();
		return;
	}

	CreationMessage = TextGet("CreatingCharacter");
	ServerSend("AccountCreate", { Name: CharacterName, AccountName: Name, Password: Password1, Email: Email });
}
