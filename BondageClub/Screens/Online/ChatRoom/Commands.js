"use strict";

/** @type {ICommand[]} */
var Commands = [];
/** @readonly */
let CommandsKey = "/";
/** @type {TextCache} */
let CommandText = null;

/**
 * Loads the commands for the Player
 * @returns {void} - Nothing
 */
function CommandsLoad() {
	CommandCombine(CommonCommands);
	CommandsTranslate();
}

/**
 * Translates the help for commands
 * @returns {void} - Nothing
 */
function CommandsTranslate() {
	if (!CommandText) {
		CommandText = new TextCache("Screens/Online/ChatRoom/Text_Commands.csv");
	}
	else CommandText.buildCache();
}

/**
 * Gets all available commands
 * @returns [ICommand[]]
 */
function GetCommands() {
	return Commands;
}

/**
 * Fill the user input with the command
 * @param {string} command
 * @returns {void} - Nothing
 */
function CommandSet(command) {
	ElementValue("InputChat", CommandsKey + command + " ");
	ElementFocus("InputChat");
}

/**
 * Add a list of commands
 * @param {ICommand | ICommand[]} add - Commands to add
 * @returns {void} - Nothing
 */
function CommandCombine(add) {
	if (!add) return;
	const arr = Array.isArray(add) ? add : [add];
	Commands = Commands.filter(C => !arr.some(A => A.Tag == C.Tag)).concat(arr);
	Commands.sort((A, B) => String.prototype.localeCompare.call(A.Tag, B.Tag));
}

/**
 * Parse the input chat message
 * @param {string} msg - Input string, cannot be empty
 * @returns {string | boolean} a (de-escaped) string if msg looks like an normal message,
 * true if a command successfully executed, false otherwise.
 */
function CommandParse(msg) {

	// We want to escape message with "\", so we need to escape it first.
	if (msg.startsWith("\\")) {
		return msg.replaceAt(0, "\u200b");
	} else if (msg.startsWith(CommandsKey + CommandsKey)) {
		// Escaped command, strip first char and return that
		return msg.substring(1);
	} else if (!msg.startsWith(CommandsKey)) {
		// Not a command. Skip.
		return msg;
	}

	return CommandExecute(msg);
}

/**
 * Prints out the help for commands with tags that include `low`
 * @param {string} low - lower case search keyword for tags
 * @param {number} [timeout] - total time to display the help message in ms
 * @returns {void} - Nothing
 */
function CommandHelp(low, timeout) {
	ChatRoomSendLocal(TextGet("CommandHelp").replace('KeyWord', low), timeout);
	CommandPrintHelpFor(GetCommands().filter(C => !low || C.Tag.includes(low)), timeout, !low);
}

/**
 * Prints out the help for commands
 * @param {Optional<ICommand, 'Action'>[]} CommandList - list of commands
 * @param {number} [Timeout] - total time to display the help message in ms
 * @param {boolean} [DoShowEscapeHint] - if message about message escaping should be shown
 */
function CommandPrintHelpFor(CommandList, Timeout, DoShowEscapeHint) {
	let HelpList = DoShowEscapeHint ? `${TextGet("CommandHelpEscape")}<br><br>` : ``;
	CommandList
		.filter(C => !C.Prerequisite || C.Prerequisite.call(C))
		.forEach(C => {
			const Help = CommandText.cache[C.Tag] || C.Description || TextGet("CommandHelpMissing");
			HelpList += `<strong style="cursor: pointer;" onclick='window.CommandSet("${C.Tag}")'>${CommandsKey}${C.Tag}</strong> ${Help}<br>`;
		});
	if (HelpList) {
		ChatRoomSendLocal(HelpList, Timeout);
	} else {
		ChatRoomSendLocal(TextGet("CommandNoSuchCommand"), Timeout);
	}
}

/**
 * Finds command and executes it from the message
 * @param {string} msg - User input
 * @returns {boolean} - true if a command was executed, false otherwise
 */
function CommandExecute(msg) {
	const low = msg.toLowerCase();
	const [key, ...parsed] = low.replace(/\s{2,}/g, ' ').split(' ');
	const flt = GetCommands().filter(cmd => key.indexOf(CommandsKey + cmd.Tag) == 0);
	let C = flt[0];

	if (flt.length > 1) C = null;
	if (C && C.Reference) C = GetCommands().find(D => D.Tag == C.Reference);
	if (C == null) {
		ChatRoomSendLocal(`${msg} ${TextGet("CommandNoSuchCommand")}`, 10_000);
		return false;
	}
	if (C.Prerequisite && C.Prerequisite.call(C) == false) {
		ChatRoomSendLocal(`${msg} ${TextGet("CommandPrerequisiteFailed")}`, 10_000);
		return false;
	}
	C.Action.call(C, low.substring(C.Tag.length + 2), msg, parsed);
	if (C.Clear == null || C.Clear) {
		ElementValue("InputChat", "");
		ElementFocus("InputChat");

		// Dispatch an event so the input field gets resized correctly
		document.getElementById("InputChat").dispatchEvent(new Event("input"));
	}
	return true;
}

/**
 * Tries to complete the message to a command or print help about it
 * @param {string} msg - InputChat content
 */
function CommandAutoComplete(msg) {
	const low = msg.toLowerCase();
	if (!low || !low.startsWith(CommandsKey)) return;
	if (low.substring(CommandsKey.length).startsWith(CommandsKey)) return;

	const [key, ...forward] = low.replace(/\s{2,}/g, ' ').split(' ');
	const tag = key.substring(CommandsKey.length);

	// If we have a forward it means the command tag was already typed, only try to call the command's AutoComplete.
	// This is needed if a command's tag is a prefix of a different command.
	if (forward.length > 0) {
		const cmds = GetCommands().filter(C => C.Tag == tag);
		if (cmds.length == 1 && cmds[0].AutoComplete) {
			cmds[0].AutoComplete.call(cmds[0], forward, low, msg);
		}
		return;
	}

	const CS = GetCommands().filter(C => C.Tag.startsWith(tag));
	if (CS.length == 0) return;

	if (CS.length == 1) {
		if (tag != CS[0].Tag) {
			ElementValue("InputChat", CommandsKey + CS[0].Tag + " ");
			ElementFocus("InputChat");
		} else if (CS[0].AutoComplete) {
			CS[0].AutoComplete.call(CS[0], forward, low, msg);
		}
		return;
	}

	let complete = low;
	for (let I = low.length - CommandsKey.length; ; ++I) {
		const TSI = CS.map(C => C.Tag[I]);
		if (TSI.some(TI => TI == null)) break;
		if (new Set(TSI).size != 1) break;
		complete += TSI[0];
	}

	if (low.length != complete.length) {
		ElementValue("InputChat", complete);
		ElementFocus("InputChat");
	} else {
		CommandPrintHelpFor(CS, 5000);
	}
}

var CommandsChangelog = {
	/**
	 * Iterate through the passed changelog element and remove all (redundant) elements outside the `[startID, stopID)` interval.
	 * @param {Element} root - The changelog-containing element
	 * @param {string} startID - The ID of the element representing the interval's start
	 * @param {string | null} stopID - The ID of the element representing the interval's end.
	 * If not provided, use the first element matching the tag name of the `startID` element instead.
	 */
	_FilterContent: function _FilterContent(root, startID, stopID=null) {
		let segmentState = /** @type {"start" | "mid" | "end"} */("start");
		/** @type {string} */
		let startTagName = null;

		/**
		 * Function for handling iteration before the `[startID, stopID)` interval.
		 *
		 * The desired interval can be specified as `[startID, stopID)` or `[stopID, startID)`.
		 * @type {(e: Element) => null | Element}
		 */
		const handleStartState = (e) => {
			const next = e.nextElementSibling;
			if (e.id === startID) {
				startTagName = e.tagName;
				segmentState = "mid";
			} else if (stopID && e.id === stopID) {
				startTagName = e.tagName;
				segmentState = "mid";
				stopID = startID;
			} else {
				e.remove();
			}
			return next;
		};

		/**
		 * Function for handling iteration within the `[startID, stopID]` interval.
		 *
		 * If no `stopID` is present use the tag name of the `startID` element instead for identifying the end of the interval.
		 * @type {(e: Element) => null | Element}
		 */
		const handleMidState = (e) => {
			let next = e.nextElementSibling;
			if (stopID) {
				if (stopID === e.id) {
					segmentState = "end";
					e.remove();
				}
			} else if (e.tagName === startTagName) {
				segmentState = "end";
				e.remove();
			}
			return next;
		};

		let elem = root.children[0];
		while (elem) {
			switch (segmentState) {
				case "start":
					// Find the start of the version interval
					elem = handleStartState(elem);
					break;
				case "mid":
					// Find the end of the version interval
					elem = handleMidState(elem);
					break;
				case "end": {
					// We're past the version interval at this point; remove all remaining elements
					const next = elem.nextElementSibling;
					elem.remove();
					elem = next;
					break;
				}
			}
		}
	},

	/**
	 * Construct a button for all `h1` buttons for deleting the changelog in question.
	 * @param {string} id
	 * @param {HTMLHeadingElement} header
	 * @param {number} level
	 * @returns {HTMLButtonElement}
	 */
	_GetH1Button: function _GetH1Button(id, header, level) {
		return ElementButton.Create(
			`${id}-delete-${header.id}`,
			function () { this.closest(".chat-room-changelog")?.remove(); },
			{
				tooltip: "", // See _SetTranslationText()
				tooltipPosition: "bottom",
				tooltipRole: "label",
				noStyling: true,
				label: "🗑",
				labelPosition: "center",
			},
			{ button: {
				classList: ["chat-room-changelog-button", "chat-room-changelog-button-delete"],
				attributes: { "aria-label": `Clear ${header.textContent} changelog` },
				dataAttributes: { level },
			} },
		);
	},

	/**
	 * Construct a button for all `hn` buttons (with `n > 1`) for collapsing their respective section sibblings.
	 * @param {string} id
	 * @param {HTMLHeadingElement} header
	 * @param {number} level
	 * @returns {HTMLButtonElement}
	 */
	_GetHNButton: function _GetHNButton(id, header, level) {
		return ElementButton.Create(
			`${id}-collapse-${header.id}`,
			function (event) {
				if (event.shiftKey) {
					const isExpanded = this.getAttribute("aria-expanded") === "true";
					const parent = this.closest(".chat-room-changelog-section");
					const children = parent?.querySelectorAll(`.chat-room-changelog-button-collapse[aria-expanded="${!isExpanded}"`);
					children?.forEach(e => e.dispatchEvent(new Event("click")));
					if (children?.length && !isExpanded) {
						// Revert the collapsed state of the `h{n}` if not all `h{<n}` blocks are collapsed
						this.dispatchEvent(new Event("click"));
						return;
					}
				}

				const label = this.querySelector(".button-label");
				if (label) {
					label.textContent = this.getAttribute("aria-expanded") === "true" ? "▼" : "▶";
				}
			},
			{
				tooltip: "", // See _SetTranslationText()
				tooltipPosition: "bottom",
				tooltipRole: "label",
				noStyling: true,
				role: "checkbox",
				label: "▼",
				labelPosition: "center",
			},
			{ button: {
				classList: ["chat-room-changelog-button", "chat-room-changelog-button-collapse"],
				attributes: { "aria-label": `Collapse ${header.textContent} section`, "aria-checked": "true", "aria-expanded": "true" },
				dataAttributes: { level },
			} },
		);
	},

	/**
	 * Ensure that all elements at the passed header level get a companion button, and ensure they and their respective contents are nested together in a `<section>`.
	 * @param {Element} root
	 * @param {string} id
	 * @param {string} href
	 * @param {number} headerLevel
	 * @param {null | string} headerPrefix
	 */
	_ParseHeader: function _ParseHeader(root, id, href, headerLevel, headerPrefix=null) {
		const headerTag = /** @type {"h1" | "h2" | "h3" | "h4" | "h5"} */(`h${headerLevel - 1}`);
		const selector = /** @type {"h2" | "h3" | "h4" | "h5" | "h6"} */(`h${headerLevel}`);
		root.querySelectorAll(selector).forEach(header => {
			// Collect all sibblings
			const sibblings = [];
			let sibbling = header.nextElementSibling;
			while (sibbling && sibbling.tagName !== `H${headerLevel}`) {
				sibblings.push(sibbling);
				sibbling = sibbling.nextElementSibling;
			}

			/** @type {(string | Node | HTMLOptions<keyof HTMLElementTagNameMap>)[]} */
			const extraChildren = [];
			if (headerTag === "h1") {
				extraChildren.push(
					{ tag: "span", children: ["•"], attributes: { "aria-hidden": "true" }},
					CommandsChangelog._GetH1Button(id, header, headerLevel - 1),
				);
			}

			const headerID = `${id}-h${headerLevel - 1}-${header.id}`;
			header.parentElement?.replaceChild(
				ElementCreate({
					tag: "section",
					classList: ["chat-room-changelog-section"],
					attributes: { "aria-labelledby": headerID },
					children: [
						{
							tag: "div",
							classList: ["chat-room-changelog-header-div"],
							children: [
								CommandsChangelog._GetHNButton(id, header, headerLevel - 1),
								{ tag: "span", children: ["•"], attributes: { "aria-hidden": "true" }},
								{
									tag: headerTag,
									attributes: { id: headerID },
									children: [{
										tag: "a",
										attributes: { target: "_blank", href: `${href}#${header.id}` },
										children: [[headerPrefix, header.textContent].filter(Boolean).join(" ")],
									}],
								},
								...extraChildren,
							],
						},
						...sibblings,
					],
				}),
				header,
			);
		});
	},

	/**
	 * Ensure that all `<img>` elements can be clicked, opening their image in a new tab.
	 * @param {Element} root
	 */
	_ParseImg: function _ParseImg(root) {
		root.querySelectorAll("img").forEach(img => {
			const a = ElementCreate({
				tag: "a",
				attributes: { href: img.src, target: "_blank", class: "chat-room-changelog-image" },
			});
			img.parentElement.replaceChild(a, img);
			a.append(img);
		});
	},

	/**
	 * Ensure that all `<a>` elements open their links in a new tab.
	 * @param {Element} root
	 */
	_ParseA: function _ParseA(root) {
		root.querySelectorAll("a").forEach(a => a.target = "_blank");
	},

	/**
	 * Set all translation-sensitive text in the changelog.
	 * @param {Element} changelog
	 */
	_SetTranslationText: async function _SetTranslationText(changelog) {
		const cache = await TextCache.buildAsync("Screens/Online/ChatRoom/Text_ChatRoom.csv");

		const clear = cache.get("CommandChangeLogClear");
		changelog.querySelectorAll(".chat-room-changelog-button-delete > .button-tooltip")?.forEach(e => e.textContent = clear);

		const collapse = cache.get("CommandChangeLogCollapse");
		const collapseShift = cache.get("CommandChangeLogCollapseShift").split("{shift}")[1] ?? "";
		changelog.querySelectorAll(".chat-room-changelog-button-collapse > .button-tooltip")?.forEach(e => {
			e.append(
				collapse,
				ElementCreate({ tag: "br" }),
				ElementCreate({ tag: "kbd", children: ["shift"] }),
				collapseShift,
			);
		});

		changelog.removeAttribute("aria-busy");
	},

	/**
	 * Construct a changelog from the passed stringified HTML (constructed via _e.g._ the [marked](https://www.npmjs.com/package/marked) package).
	 *
	 * The stringified HTML is expected to have the following structure:
	 * * A single `<h1>` element _may_ be present in order to represent a general changelog title
	 * * Version-specific sections of the changelog _must_ be represented by `<h2>` elements and _may_ contain an arbitrary number of sub-headers
	 * * Headers and their sections _must not_ be grouped together inside an element; an overal flat structure is expected
	 * @param {string} innerHTML - The inner html representing containing a superset of the changelog's final content
	 * @param {Object} [options]
	 * @param {null | string} [options.id] - The (root) ID of the to-be created changelog; defaults to `chat-room-changelog`
	 * @param {null | string} [options.href] - The URL leading to the (external) changelog; defaults to `./changelog.html`
	 * @param {null | string} [options.startID] - The header ID of the first to-be included segment within the changelog; defaults to the latest BC version (`r[0-9]{3}`)
	 * @param {null | string} [options.stopID] - The header ID of the final to-be included segment within the changelog; defaults to `options.startID` if unspecified
	 * @returns {HTMLDivElement} - The newly created changelog
	 */
	Parse: function Parse(innerHTML, options=null) {
		options ??= {};
		const id = options.id ?? "chat-room-changelog";
		const href = options.href ?? "./changelog.html";
		const startID = options.startID ?? `r${GameVersionFormat.exec(GameVersion)?.[1]}`;
		const stopID = options.stopID;

		let changelog = /** @type {null | HTMLDivElement} */(document.getElementById(id));
		if (changelog) {
			console.error(`Element "${id}" already exists`);
			return changelog;
		}

		// Ensure that any and all images are loaded lazily _before_ setting the innerHTML, lest they are all loaded right away
		changelog = ElementCreate({
			tag: "div",
			classList: ["chat-room-changelog"],
			attributes: { id, "aria-busy": "true" },
			dataAttributes: { start: startID, stop: stopID },
			innerHTML: innerHTML.replace("<img", "<img loading='lazy'"),
		});

		// The original <h1> will eventually be removed, but keep hold of its text content for later
		const h1Content = changelog.querySelector("h1")?.textContent;
		if (h1Content) {
			changelog.setAttribute("aria-label", h1Content);
		}

		// Perform any filtering and clean up of the changelog's elements
		CommandsChangelog._FilterContent(changelog, startID, stopID);
		CommandsChangelog._ParseA(changelog);
		CommandsChangelog._ParseImg(changelog);
		[2, 3, 4, 5, 6].forEach(n => CommandsChangelog._ParseHeader(changelog, id, href, n, n === 2 ? h1Content : null));
		CommandsChangelog._SetTranslationText(changelog);
		return changelog;
	},

	/**
	 * Construct a changelog from the passed stringified HTML and publish it to the chat room chatlog.
	 *
	 * @param {string} innerHTML - The inner html representing containing a superset of the changelog's final content
	 * @param {Object} [options]
	 * @param {null | string} [options.id] - The (root) ID of the to-be created changelog; defaults to `chat-room-changelog`
	 * @param {null | string} [options.href] - The URL leading to the (external) changelog; defaults to `./changelog.html`
	 * @param {null | string} [options.startID] - The header ID of the first to-be included segment within the changelog; defaults to the latest BC version (`r[0-9]{3}`)
	 * @param {null | string} [options.stopID] - The header ID of the final to-be included segment within the changelog; defaults to `options.startID` if unspecified
	 * @returns {HTMLDivElement} - The newly created changelog
	 */
	Publish(innerHTML, options=null) {
		const changelog = CommandsChangelog.Parse(innerHTML, options);
		changelog.setAttribute("data-sender", Player.MemberNumber);
		changelog.setAttribute("data-time", ChatRoomCurrentTime());
		changelog.classList.add("ChatMessage");

		// Ensure that all requested changelogs except the most recent one are collapsed
		const buttons = changelog.querySelectorAll(".chat-room-changelog-button-collapse[data-level='1']");
		buttons.forEach((button, i) => {
			if (i !== 0) {
				button.dispatchEvent(new Event("click"));
			}
		});
		ChatRoomAppendChat(changelog);
		return changelog;
	},
};

/**
 * @type {ICommand[]}
 */
const CommonCommands = [
	{
		Tag: 'dice',
		Action: args => {
			let DiceNumber = 0;
			let DiceSize = 0;

			// The player can roll X dice of Y faces, using XdY.  If no size is specified, a 6 sided dice is assumed
			if (/(^\d+)[dD](\d+$)/.test(args)) {
				const Roll = /(^\d+)[dD](\d+$)/.exec(args);
				DiceNumber = (!Roll) ? 1 : parseInt(Roll[1]);
				DiceSize = (!Roll) ? 6 : parseInt(Roll[2]);
				if ((DiceNumber < 1) || (DiceNumber > 100)) DiceNumber = 1;
			}
			else if (/(^\d+$)/.test(args)) {
				const Roll = /(^\d+)/.exec(args);
				DiceNumber = 1;
				DiceSize = (!Roll) ? 6 : parseInt(Roll[1]);
			}

			// If there's at least one dice to roll
			if (DiceNumber > 0) {
				if ((DiceSize < 2) || (DiceSize > 100)) DiceSize = 6;
				let CurrentRoll = 0;
				const Result = [];
				let Total = 0;
				while (CurrentRoll < DiceNumber) {
					let Roll = Math.floor(Math.random() * DiceSize) + 1;
					Result.push(Roll);
					Total += Roll;
					CurrentRoll++;
				}
				if (DiceNumber > 1) {
					Result.sort((a, b) => a - b);
				}

				const Dictionary = new DictionaryBuilder()
					.sourceCharacter(Player)
					.text("DiceType", DiceNumber.toString() + "D" + DiceSize.toString())
					.if(DiceNumber > 1)
					.text("DiceResult", Result.toString() + " = " + Total.toString())
					.endif()
					.if(DiceNumber=== 1)
					.text("DiceResult", Total.toString())
					.endif()
					.build();
				ServerSend("ChatRoomChat", { Content: "ActionDice", Type: "Action", Dictionary: Dictionary });
			}
		}
	},
	{
		Tag: 'coin',
		Action: () => {
			const Heads = Math.random() >= 0.5;

			const Dictionary = new DictionaryBuilder()
				.sourceCharacter(Player)
				.textLookup("CoinResult", Heads ? "Heads" : "Tails")
				.build();
			ServerSend("ChatRoomChat", { Content: "ActionCoin", Type: "Action", Dictionary: Dictionary });
		}
	},
	{
		Tag: 'safeword',
		Action: () => ChatRoomSafewordChatCommand(),
	},
	{
		Tag: 'friendlistadd',
		Action: args => ChatRoomListManipulation(Player.FriendList, true, args),
	},
	{
		Tag: 'friendlistremove',
		Action: args => ChatRoomListManipulation(Player.FriendList, false, args),
	},
	{
		Tag: 'ghostadd',
		Action: args => ChatRoomListManipulation(Player.GhostList, true, args),
	},
	{
		Tag: 'ghostremove',
		Action: args => ChatRoomListManipulation(Player.GhostList, false, args),
	},
	{
		Tag: 'whitelistadd',
		Action: args => ChatRoomListManipulation(Player.WhiteList, true, args),
	},
	{
		Tag: 'whitelistremove',
		Action: args => ChatRoomListManipulation(Player.WhiteList, false, args),
	},
	{
		Tag: 'blacklistadd',
		Action: args => ChatRoomListManipulation(Player.BlackList, true, args),
	},
	{
		Tag: 'blacklistremove',
		Action: args => ChatRoomListManipulation(Player.BlackList, false, args),
	},
	{
		Tag: 'showblacklist',
		Action: () => ChatRoomSendLocal(TextGet('CommandBlacklist') + JSON.stringify(Player.BlackList)),
	},
	{
		Tag: 'showwhitelist',
		Action: () => {
			let msg = TextGet('CommandWhitelist') + '\n';
			msg += Player.WhiteList.sort((i, j) => i - j).map(num => `• ${Player.FriendNames.get(num) ?? "?"} (${num})`).join('\n');
			ChatRoomSendLocal(msg);
		}
	},
	{
		Tag: 'showghostlist',
		Action: () => ChatRoomSendLocal(TextGet('CommandGhostlist') + JSON.stringify(Player.GhostList)),
	},
	{
		Tag: 'showfriendlist',
		Action: () => {
			let msg = TextGet('CommandFriendlist') + '\n';
			msg += Player.FriendList.sort((i, j) => i - j).map(num => `• ${Player.FriendNames.get(num) ?? "?"} (${num})`).join('\n');
			ChatRoomSendLocal(msg);
		},
	},
	{
		Tag: 'openfriendlist',
		Action: () => {
			ElementToggleGeneratedElements(CurrentScreen, false);
			FriendListReturn = { Screen: CurrentScreen , Module: CurrentModule, IsInChatRoom: true };
			CommonSetScreen("Character", "FriendList");
		},
	},
	{
		Tag: 'ban',
		Prerequisite: () => ChatRoomPlayerIsAdmin(),
		Action: args => ChatRoomAdminChatAction("Ban", args),
	},
	{
		Tag: 'unban',
		Prerequisite: () => ChatRoomPlayerIsAdmin(),
		Action: args => ChatRoomAdminChatAction("Unban", args),
	},
	{
		Tag: 'kick',
		Prerequisite: () => ChatRoomPlayerIsAdmin(),
		Action: args => ChatRoomAdminChatAction("Kick", args),
	},
	{
		Tag: 'promote',
		Prerequisite: () => ChatRoomPlayerIsAdmin(),
		Action: args => ChatRoomAdminChatAction("Promote", args),
	},
	{
		Tag: 'demote',
		Prerequisite: () => ChatRoomPlayerIsAdmin(),
		Action: args => ChatRoomAdminChatAction("Demote", args),
	},
	{
		Tag: 'roomwhitelist',
		Prerequisite: () => ChatRoomPlayerIsAdmin(),
		Action: args => ChatRoomAdminChatAction("Whitelist", args),
	},
	{
		Tag: 'roomunwhitelist',
		Prerequisite: () => ChatRoomPlayerIsAdmin(),
		Action: args => ChatRoomAdminChatAction("Unwhitelist", args),
	},
	{
		Tag: 'focus',
		Prerequisite: () => ServerPlayerIsInChatRoom(),
		Action: (args) => {
			const parts = args.split(' ');

			const subcommand = parts.length > 0 ? parts[0].toLowerCase() : 'help';
			if (/^(add|remove)$/.test(subcommand)) {
				if (parts.length === 1) {
					ChatRoomSendLocal(TextGet("CommandFocusNoTargets"), 30_000);
					return;
				}
				// TODO: use ChatRoomGetCharacter
				/** @type {Character[]} */
				const matchingCharacters = [];
				parts.slice(1).forEach(targeter => { // For each targeter the user provided
					const memberNumber = parseInt(targeter);
					const targeterSanitized = ChatRoomHTMLEntities(targeter);

					let targeterResult = ChatRoomCharacter.find(C => // Attempt to first find an exact match
						!C.IsPlayer() &&
						(
							C.MemberNumber === memberNumber ||
							C.Name.toLowerCase() === targeter.toLowerCase() ||
							C.Nickname?.toLowerCase() === targeter.toLowerCase()
						)
					);
					if (!targeterResult) { // If no exact match, attempt a partial match
						const partialMatches = ChatRoomCharacter.filter(C =>
							!C.IsPlayer() &&
							(
								C.Name.toLowerCase().includes(targeter.toLowerCase()) ||
								C.Nickname?.toLowerCase().includes(targeter.toLowerCase())
							)
						);

						if (partialMatches.length === 1) { // If only one partial match, use it
							targeterResult = partialMatches[0];
						} else if (partialMatches.length > 1) { // If multiple partial matches, inform the user
							ChatRoomSendLocal(TextGet("CommandFocusTargeterAmbiguous").replace("Targeter", targeterSanitized), 5_000);
							return;
						}
					}

					if (targeterResult) {
						if (matchingCharacters.includes(targeterResult)) { // If the targeter is already in the list, don't add it again
							ChatRoomSendLocal(TextGet("CommandFocusTargeterDuplicate").replace("Targeter", targeterSanitized), 5_000);
						} else {
							matchingCharacters.push(targeterResult);
						}
					} else {
						ChatRoomSendLocal(TextGet("CommandFocusTargeterNoMatch").replace("Targeter", targeterSanitized), 5_000);
					}
				});

				if (matchingCharacters.length === 0) {
					ChatRoomSendLocal(TextGet("CommandFocusNoTargets"), 10_000);
					return;
				}

				/** @type {Character[]} */
				let changed;
				if (subcommand === 'add') {
					changed = ChatRoomDrawFocusListAdd(matchingCharacters);
				} else if (subcommand === 'remove') {
					changed = ChatRoomDrawFocusListRemove(matchingCharacters);
				} else { // Shouldn't happen, but sanity check
					return;
				}
				ChatRoomSendLocal(
					TextGet(`CommandFocusSuccess${subcommand.charAt(0).toUpperCase()}${subcommand.slice(1)}`)
						.replace("Changed", changed.map(C => `${CharacterNickname(C)} (${C.MemberNumber})`).join(", ")),
					10_000
				);
			} else if (/^(list|clear)$/.test(subcommand) && parts.length === 1) {
				if (subcommand === 'list') {
					ChatRoomSendLocal(TextGet("CommandFocusList") + "<br>" + ChatRoomDrawFocusList.map(C => `${CharacterNickname(C)} (${C.MemberNumber})`).join("<br>"), 30_000);
				} else if (subcommand === 'clear') {
					ChatRoomDrawFocusListClear();
					ChatRoomSendLocal(TextGet("CommandFocusSuccessClear"), 10_000);
				}
			} else { // If the subcommand is not recognized (also handles the "help" subcommand implicitly)
				ChatRoomSendLocal(
					`<code>${TextGet("CommandFocusHelpSyntax")}</code>` +
					"<br><br>" +
					TextGet("CommandFocusHelpSummary").replaceAll("FocusEnabledWarningIcon", TextGet("FocusEnabledWarningIcon")) +
					"<br><br>" +
					TextGet("CommandFocusHelpNotesHeader") +
					"<br><ul>" +
					TextGet("CommandFocusHelpNotes") +
					"</ul><br>" +
					TextGet("CommandFocusHelpSubcommandsHeader") +
					"<br><ul>" +
					`<li><code>add [targeter(s)]</code>: ${TextGet("CommandFocusHelpAdd")}</li>` +
					`<li><code>remove [targeter(s)]</code>: ${TextGet("CommandFocusHelpRemove")}</li>` +
					`<li><code>list</code>: ${TextGet("CommandFocusHelpList")}</li>` +
					`<li><code>clear</code>: ${TextGet("CommandFocusHelpClear")}</li>` +
					`<li><code>help</code>: ${TextGet("CommandFocusHelpHelp")}</li>` +
					"</ul><br>" +
					TextGet("CommandFocusHelpTargeters"),
					120_000
				);
			}
		}
	},
	{
		Tag: 'focusadd',
		Prerequisite: () => ServerPlayerIsInChatRoom(),
		Action: (args) => CommandExecute("/focus add " + args),
	},
	{
		Tag: 'focusremove',
		Prerequisite: () => ServerPlayerIsInChatRoom(),
		Action: (args) => CommandExecute("/focus remove " + args),
	},
	{
		Tag: 'focuslist',
		Prerequisite: () => ServerPlayerIsInChatRoom(),
		Action: () => CommandExecute("/focus list"),
	},
	{
		Tag: 'focusclear',
		Prerequisite: () => ServerPlayerIsInChatRoom(),
		Action: () => CommandExecute("/focus clear"),
	},
	{
		Tag: 'focushelp',
		Prerequisite: () => ServerPlayerIsInChatRoom(),
		Action: () => CommandExecute("/focus help"),
	},
	{
		Tag: 'me',
		Action: (_, msg) => {
			ChatRoomSendEmote(msg);
		}
	},
	{
		Tag: 'attempt',
		Action: (_, msg, parsed) => {
			if (parsed[0]?.match(/(\d{0,2}|100)%/))
				ChatRoomSendAttemptEmote(msg);
		}
	},
	{
		Tag: 'action',
		Action: (_, msg) => ChatRoomSendEmote(msg),
	},
	{
		Tag: 'pandora',
		Action: args => PandoraPenitentiaryDoActivity(args),
	},
	{
		Tag: 'help',
		Action: args => CommandHelp(args),
	},
	{
		Tag: 'afk',
		Action: () => {
			const expression = WardrobeGetExpression(Player).Emoticon != "Afk" ? "Afk" : null;
			CharacterSetFacialExpression(Player, "Emoticon", expression);
			Player.ActiveExpression.Emoticon = expression;
		}
	},
	{
		Tag: 'expr',
		Action: args => {
			if (args.trim() == "") {
				ChatRoomFocusCharacter(Player, { selfMode: "SavedExpressions" });
			} else if (/^[0-5]$/.test(args)) {
				let ExprNum = parseInt(args);
				if (ExprNum == 0) {
					CharacterResetFacialExpression(Player);
				} else {
					DialogFacialExpressionsLoad(ExprNum - 1);
				}
			}
		}
	},
	{
		Tag: 'blush',
		Action: args => {
			if (args.trim() == "") {
				ChatRoomFocusCharacter(Player, { selfMode: "Expression" });
				DialogFindFacialExpressionMenuGroup("Blush");
				return;
			}
			/** @type {(null | ExpressionNameMap["Blush"])[]} */
			let BlushLevels = [null, "Low", "Medium", "High", "VeryHigh", "Extreme"];
			/** @type {null | ExpressionNameMap["Blush"]} */
			let NewExpression = null;
			let AcceptCmd = false;
			if (/^[0-5]$/.test(args)) {
				AcceptCmd = true;
				let BlushNum = parseInt(args);
				NewExpression = BlushLevels[BlushNum];
			} else if (/^(b(?:lue)?)$/.test(args)) {
				AcceptCmd = true;
				NewExpression = "ShortBreath";
			} else if (/^(\+|-)$/.test(args)) {
				AcceptCmd = true;
				const Blush = InventoryGet(Player, "Blush");
				let CurrentBlush = null;
				if (Blush && Blush.Property && Blush.Property.Expression) {
					CurrentBlush = Blush.Property.Expression;
				}
				let Level = 0;
				for (let i = 0; i < BlushLevels.length; i++) {
					if (CurrentBlush == BlushLevels[i]) {
						Level = i;
						break;
					}
				}
				if (args == "+") {
					Level++;
				} else {
					Level--;
				}
				Level = Math.max(0, Level);
				Level = Math.min(BlushLevels.length - 1, Level);
				NewExpression = BlushLevels[Level];
			}
			if (AcceptCmd) {
				CharacterSetFacialExpression(Player, "Blush", NewExpression);
				Player.ActiveExpression.Blush = NewExpression;
			}
		}
	},
	{
		Tag: 'eyes',
		Action: args => {
			if (args.trim() == "") {
				ChatRoomFocusCharacter(Player, { selfMode: "Expression" });
				DialogFindFacialExpressionMenuGroup("Eyes");
				return;
			}
			let AcceptCmd = false;
			/** @type {ExpressionNameMap["Eyes"] | "Open"} */
			let NewExpression;
			let TargetLeft = false;
			let TargetRight = false;
			let Cmds;
			if (/^(r(?:ight)?|l(?:eft)?|b(?:oth)?)$/.test(args)) {
				AcceptCmd = true;
				if (args[0] == "r" || args[0] == "b") TargetRight = true;
				if (args[0] == "l" || args[0] == "b") TargetLeft = true;
				let LeftClosed = InventoryGet(Player, "Eyes").Property.Expression == "Closed";
				let RightClosed = InventoryGet(Player, "Eyes2").Property.Expression == "Closed";
				let Close = (TargetLeft && !LeftClosed);
				Close = Close || (TargetRight && !RightClosed);
				NewExpression = Close ? "Closed" : "Open";
			} else if ((Cmds = /^(c(?:lose)?|o(?:pen)?) *(r(?:ight)?|l(?:eft)?|b(?:oth)?)?$/.exec(args)) != null) {
				AcceptCmd = true;
				let ActionCmd = Cmds[1];
				let TargetCmd = Cmds[2];
				NewExpression = (ActionCmd[0] == "c") ? "Closed" : "Open";
				if (!TargetCmd || TargetCmd[0] == "r" || TargetCmd[0] == "b") {
					TargetRight = true;
				}
				if (!TargetCmd || TargetCmd[0] == "l" || TargetCmd[0] == "b") {
					TargetLeft = true;
				}
			} else if (/^(default|dazed|shy|sad|horny|lewd|verylewd|heart|<3|heartpink|lewdheart|lewdheartpink|dizzy|@@|daydream|><|shylyhappy|\^\^|angry|èé|surprised|éè|scared)$/.test(args)) {
				AcceptCmd = true;
				if (args == "default") NewExpression = null;
				else if (args == "dazed") NewExpression = "Dazed";
				else if (args == "shy") NewExpression = "Shy";
				else if (args == "sad") NewExpression = "Sad";
				else if (args == "horny") NewExpression = "Horny";
				else if (args == "lewd") NewExpression = "Lewd";
				else if (args == "verylewd") NewExpression = "VeryLewd";
				else if (args == "heart" || args == "<3") NewExpression = "Heart";
				else if (args == "heartpink") NewExpression = "HeartPink";
				else if (args == "lewdheart") NewExpression = "LewdHeart";
				else if (args == "lewdheartpink") NewExpression = "LewdHeartPink";
				else if (args == "dizzy" || args == "@@") NewExpression = "Dizzy";
				else if (args == "daydream" || args == "><") NewExpression = "Daydream";
				else if (args == "shylyhappy" || args == "^^") NewExpression = "ShylyHappy";
				else if (args == "angry" || args == "èé") NewExpression = "Angry";
				else if (args == "surprised" || args == "éè") NewExpression = "Surprised";
				else if (args == "scared") NewExpression = "Scared";
			}
			if (!AcceptCmd) {
				return;
			}
			if (NewExpression == "Open" || NewExpression == "Closed") {
				if (TargetLeft && TargetRight) {
					CharacterSetFacialExpression(Player, "Eyes", NewExpression);
				} else if (TargetLeft) {
					CharacterSetFacialExpression(Player, "Eyes1", NewExpression);
				} else if (TargetRight) {
					CharacterSetFacialExpression(Player, "Eyes2", NewExpression);
				}
			} else {
				// Apply new expression only to eyes that are opened
				let LeftClosed = InventoryGetItemProperty(InventoryGet(Player, "Eyes"), "Expression") === "Closed";
				let RightClosed = InventoryGetItemProperty(InventoryGet(Player, "Eyes2"), "Expression") === "Closed";
				if (!LeftClosed) {
					CharacterSetFacialExpression(Player, "Eyes1", NewExpression);
					Player.ActiveExpression.Eyes = NewExpression;
				}
				if (!RightClosed) {
					CharacterSetFacialExpression(Player, "Eyes2", NewExpression);
					Player.ActiveExpression.Eyes = NewExpression;
				}
			}
		}
	},
	{
		Tag: 'bot',
		Action: (_, msg) => {
			const matches = ChatRoomCharacter.filter(c => !c.IsPlayer() && c.MemberNumber >= 0);
			for (const match of matches) {
				ServerSend("ChatRoomChat", { Content: "ChatRoomBot " + msg.substring(4), Type: "Hidden", Target: match.MemberNumber });
			}
		}
	},
	{
		Tag: "craft",
		Action: () => {
			CraftingShowScreen(true);
		},
	},
	{
		Tag: "forbiddenwords",
		Action: () => {

			// No forbidden words if not owned
			if (CurrentScreen != "ChatRoom") return;
			if (!Player.IsOwned()) return;

			// Gets the forbidden words list from the log
			let ForbiddenList = [];
			for (let L of Log)
				if ((L.Group == "OwnerRule") && L.Name.startsWith("ForbiddenWords"))
					ForbiddenList = L.Name.substring("ForbiddenWords".length, 10000).split("|");
			if (ForbiddenList.length <= 1) return true;
			ForbiddenList.splice(0, 1);

			// Shows the list in the chat window
			ChatRoomSendLocal(ChatRoomHTMLEntities(ForbiddenList.join(", ")));

		},
	},
	{
		Tag: "wheel",
		Action: () => {
			if (!InventoryAvailable(Player, "WheelFortune", "ItemDevices")) return;
			WheelFortuneReturnScreen = CommonGetScreen();
			WheelFortuneBackground = ChatRoomData.Background;
			WheelFortuneCharacter = Player;
			CommonSetScreen("MiniGame", "WheelFortune");
		},
	},
	{
		Tag: "release",
		Action: args => {
			let MemberNumber = parseInt(args);
			if ((typeof MemberNumber == "number") && !isNaN(MemberNumber) && (MemberNumber >= 0))
				ServerSend("AccountOwnership", { MemberNumber: MemberNumber, Action: "Release" });
		},
	},
	{
		Tag: "customimage",
		Action: args => { ChatAdminRoomCustomizationCommand("Image", args); },
	},
	{
		Tag: "customfilter",
		Action: args => { ChatAdminRoomCustomizationCommand("Filter", args); },
	},
	{
		Tag: "custommusic",
		Action: args => { ChatAdminRoomCustomizationCommand("Music", args); },
	},
	{
		Tag: "appcopy",
		Action: () => { CharacterAppearanceCopyToClipboard(Player); },
	},
	{
		Tag: "apppaste",
		Action: async (_, msg) => {
			let CompApp = msg.substring("/apppaste".length).trim();
			if (!CompApp.length) {
				try {
					CompApp = await navigator.clipboard.readText();
				} catch (err) {
					console.error('Failed to read clipboard contents:', err);
				}
			}
			CharacterAppearancePaste(Player, CompApp, true);
		},
	},
	{
		Tag: "mapcopy",
		Action: () => { ChatRoomMapViewCopy(); },
	},
	{
		Tag: "mappaste",
		Action: async (_, msg) => {
			let MapData = msg.substring("/mappaste".length).trim();
			if (!MapData.length) {
				try {
					MapData = await navigator.clipboard.readText();
				} catch (err) {
					console.error('Failed to read clipboard contents:', err);
				}
			}
			ChatRoomMapViewPaste(MapData);
		},
	},
	{
		Tag: "whisper",
		Action: (args, command) => {
			const [, ...parts] = command.split(" ");
			const target = parts?.shift();
			const message = parts?.join(" ");

			// Logic for handling empty command or missing target
			if (!target) {
				if (ChatRoomTargetMemberNumber >= 0) {
					ChatRoomSetTarget(-1);
					ChatRoomSendLocal(`${TextGet("CommandWhisperStopSuccess")}`, 30000);
				} else {
					ChatRoomSendLocal(`${TextGet("CommandNoWhisperTargetSelected")}`, 30000);
				}

				return;
			}
			// TODO: use ChatRoomGetCharacter
			// Getting all members that fit our request
			const matchingMembers = ChatRoomCharacter.filter((C) => {
				const memberNumber = parseInt(target);

				return (
					!C.IsPlayer() &&
					(
						C.MemberNumber == memberNumber ||
						C.Nickname?.toLowerCase() == target.toLowerCase() ||
						C.Name.toLowerCase() == target.toLowerCase()
					)
				);
			});

			// Handling scenarios based on the matching members
			// If there's no matches
			if (!matchingMembers.length) {
				ChatRoomSendLocal(`${TextGet("CommandNoWhisperTarget")} ${target}.`, 30_000);
			// If there's multiple matches
			} else if (matchingMembers.length > 1) {
				const mappedMembers = matchingMembers
					.map((C) => `&emsp;• <strong style="cursor: pointer;" onclick='window.CommandSet("whisper ${C.MemberNumber}")'>${CharacterNickname(C)} (${C.MemberNumber})</strong>`)
					.join("<br>") + "<br>";
				const Targets = `<br>${mappedMembers}`;

				ChatRoomSendLocal(`${TextGet("CommandMultipleWhisperTargets").replace("$Targets", Targets)}`, 30_000);
			// If we have ONE match, but no message
			} else if (matchingMembers.length == 1 && !message) {
				ChatRoomSendLocal(`${TextGet("CommandWhisperTargetSuccess")} ${CharacterNickname(matchingMembers[0])} (${matchingMembers[0].MemberNumber})`, 30_000);
				ChatRoomSetTarget(matchingMembers[0].MemberNumber);
			// If there's ONE match and there's message we want to send
			} else {
				const targetMember = matchingMembers[0];

				// Set whisper target and send message
				const status = ChatRoomSendWhisper(targetMember.MemberNumber, message);
				if (status === "target-gone") {
					ChatRoomSendLocal(`<span style="color: red">${TextGet("WhisperTargetGone")}</span>`);
					return;
				} else if (status === "target-out-of-range") {
					ChatRoomSendLocal(`<span style="color: red">${TextGet("WhisperTargetOutOfRange")}</span>`);
					return;
				}
			}
		},
	},
	{
		Tag: "shop",
		Action: () => {
			/** @type {null | ScreenSpecifier} */
			const screen = CurrentModule && CurrentScreen ? CommonGetScreen() : null;
			/** @type {null | string} */
			let background = null;
			if (ServerPlayerIsInChatRoom()) {
				background = ChatRoomData?.Background;
				ChatRoomStatusUpdate("Shop");
			}
			Shop2.Init(background, screen);
		},
	},
	{
		Tag: "changelog",
		Action: (args, msg, [start, stop]) => {
			const startArray = GameVersionFormat.exec(start?.toUpperCase());
			const stopArray = GameVersionFormat.exec(stop?.toUpperCase());
			const defaultVersion = GameVersionFormat.exec(GameVersion)?.[1];
			if (defaultVersion == null) {
				console.error(`Invalid BC GameVersion: "${GameVersion}"`);
				return;
			} else if ((!startArray && start) || (!stopArray && stop)) {
				const Content = start ? `Invalid [start] version: "${start}"` : `Invalid [stop] version: "${stop}"`;
				ChatRoomMessageDisplay({ Type: "LocalMessage", Content, Timeout: 5000 }, "", Player, {});
				return;
			}

			const startID = `r${startArray?.[1] ?? defaultVersion}`;
			let stopID = stopArray?.[1] != null ? `r${stopArray[1]}` : null;
			if (stopID === startID) {
				stopID = null;
			}

			let changelog = document.getElementById("chat-room-changelog");
			if (changelog) {
				// Move a previously opened changelog to the end of the chat again
				if (changelog.getAttribute("data-start") === startID && changelog.getAttribute("data-stop") === stopID) {
					changelog.remove();
					ChatRoomAppendChat(changelog);
					return;
				} else {
					changelog.remove();
				}
			}

			CommonGet("./changelog.html", (xhr) => {
				if (xhr.status === 200) {
					CommandsChangelog.Publish(xhr.responseText, { id: "chat-room-changelog", startID, stopID });
				}
			});
		},
	},
	{
		Tag: 'pony',
		Action: args => StableDoActivity(args),
	},
	{
		Tag: 'beep',
		Action: (args) => {
			const parts = args.split(" ");
			const target = parseInt(parts.shift(), 10);
			const msg = parts.join(" ");

			if (!CommonIsNonNegativeInteger(target)) {
				ChatRoomSendLocal(`<span style="color: red">${TextGet("CommandBeepInvalidTarget").replace('$target', target)}</span>`, 5000);
				return;
			} else if (!Player.FriendNames.get(target)) {
				ChatRoomSendLocal(`<span style="color: red">${TextGet("CommandBeepNotFriend").replace('$target', target.toString())}</span>`, 5000);
				return;
			} else if (!msg) {
				ChatRoomSendLocal(`<span style="color: red">${TextGet("CommandBeepEmptyMessage")}</span>`, 5000);
				return;
			}

			ServerSendBeepMessage(target, msg);

			const beepId = FriendListBeepLog.length - 1;

			// "Reply to beep" arrow
			const replyLink = ElementButton.Create(
				`beep-reply-${beepId}`,
				() => {
					ElementValue("InputChat", `/beep ${target} ${ElementValue("InputChat").replace(/^\/(beep|w) \S+ ?/u, '')}`);
					document.getElementById('InputChat').focus();
				},
				{ noStyling: true },
				{ button: { classList: ["ReplyButton"], children: ['\u21a9\ufe0f'] } },
			);

			const link = document.createElement("a");
			link.id = `#beep-${beepId}`;
			link.onclick = (e) => {
				e.preventDefault();
				FriendListShowBeep(beepId);
			};
			const targetName = Player.FriendNames.get(target) ?? InterfaceTextGet(`ServerBeepUnknownName`).replace('$target', target.toString());
			link.textContent = CommonStringSubstitute(TextGet("CommandBeepLink"),[
				["{NAME}", targetName],
				["{NUMBER}", target.toString()],
				["{MESSAGE}", msg.length > 150 ? `${msg.substring(0, 150)}…` : msg],
			]);
			link.classList.add("beep-link");
			const div = document.createElement("div");
			div.classList.add("ChatMessage", "ChatMessageLocalMessage", "ChatMessageNonDialogue", "ChatMessageBeep");
			div.dataset.time = ChatRoomCurrentTime();
			div.dataset.sender = Player.MemberNumber.toString();
			div.dataset.target = target.toString();
			div.append(replyLink, link);

			document.querySelector(`
				#TextAreaChatLog .ChatMessageBeep[data-sender="${target}"] > .ReplyButton:not([tabindex='-1']),
				#TextAreaChatLog .ChatMessageBeep[data-target="${target}"] > .ReplyButton:not([tabindex='-1'])
			`)?.setAttribute("tabindex", "-1");

			ChatRoomAppendChat(div);
		}
	},
	{
		Tag: 'maptp',
		Action: (args) => {
			if (!ChatRoomPlayerIsAdmin()) return ChatRoomSendLocal("You don't have admin permissions to use this command.");
			if (!ChatRoomMapViewIsActive()) return ChatRoomSendLocal("Only accessible in map mode.");
			const parsed = args.split(" ");
			const isCoordinateX = (value) => value && !isNaN(Number(value)) && Number(value) >= 0 && Number(value) < ChatRoomMapViewWidth;
			const isCoordinateY = (value) => value && !isNaN(Number(value)) && Number(value) >= 0 && Number(value) < ChatRoomMapViewHeight;

			const isIdentifier = (value) => value && !(isCoordinateX(value) || isCoordinateY(value));

			if (isCoordinateX(parsed[0]) && isCoordinateY(parsed[1])) {
				// maptp <x> <y>
				const position = {X: Number(parsed[0]), Y: Number(parsed[1])};
				if (ChatRoomMapViewIsOutOfBounds(position)) return ChatRoomSendLocal(`Teleport: Cannot teleport to ${position.X}, ${position.Y} because out of bounds.`);
				ChatRoomSendLocal(`Teleporting to ${position.X}, ${position.Y}`);
				return ChatRoomMapViewTeleport(Player, position);
			}

			if (isIdentifier(parsed[0]) && isCoordinateX(parsed[1]) && isCoordinateY(parsed[2])) {
				// maptp <player> <x> <y>
				const identifier = parsed[0].replace('@', '');
				const character = ChatRoomGetCharacter(identifier);
				if (!character) return ChatRoomSendLocal(`Teleport: Cannot teleport ${identifier} to ${parsed[1]}, ${parsed[2]} because no such player.`);
				const position = {X: Number(parsed[1]), Y: Number(parsed[2])};
				if (ChatRoomMapViewIsOutOfBounds(position)) return ChatRoomSendLocal(`Teleport: Cannot teleport ${identifier} to ${position.X}, ${position.Y} because out of bounds.`);
				ChatRoomSendLocal(`Teleporting ${character.Nickname ?? character.Name} to ${position.X}, ${position.Y}`);
				return ChatRoomMapViewTeleport(character, position);
			}

			if (isIdentifier(parsed[0]) && isIdentifier(parsed[1])) {
				// maptp <from player> <to player>
				const fromPlayer = ChatRoomGetCharacter(parsed[0].replace('@', ''));
				const toPlayer = ChatRoomGetCharacter(parsed[1].replace('@', ''));
				if (!fromPlayer) return ChatRoomSendLocal(`Teleport: Cannot teleport ${parsed[0]} to ${parsed[1]} because no such player.`);
				if (!toPlayer) return ChatRoomSendLocal(`Teleport: Cannot teleport ${parsed[0]} to ${parsed[1]} because no such player.`);
				ChatRoomSendLocal(`Teleporting ${fromPlayer.Nickname ?? fromPlayer.Name} to ${toPlayer.Nickname ?? toPlayer.Name}`);
				return ChatRoomMapViewTeleport(fromPlayer, toPlayer.Position);
			}

			if (isIdentifier(parsed[0])) {
				// maptp <player>
				const character = ChatRoomGetCharacter(parsed[0].replace('@', ''));
				if (!character) return ChatRoomSendLocal(`Teleport: Cannot teleport ${parsed[0]} because no such player.`);
				ChatRoomSendLocal(`Teleporting to ${character.Nickname ?? character.Name}`);
				return ChatRoomMapViewTeleport(Player, character.Position);
			}

			return ChatRoomSendLocal("Invalid arguments:\n- /maptp x y\n- /maptp player x y\n- /maptp from-player to-player\n- /maptp player\nNote: use @ as a prefix for MemberNumbers because of ambiguousness.");
		}
	},
	{
		Tag: 'mapcords',
		Action: (args, msg, parsed) => {
			if (!ChatRoomMapViewIsActive()) return ChatRoomSendLocal("Only accessible in map mode.");

			ChatRoomSendLocal(`Coordinates X, Y: ${Player.X}, ${Player.Y}`);
		}
	}
];
