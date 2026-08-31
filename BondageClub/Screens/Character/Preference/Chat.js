"use strict";

/** @type {ChatColorThemeType[]} */
var PreferenceChatColorThemeList = ["Light", "Dark", "Light2", "Dark2"];
/** @type {ChatEnterLeaveType[]} */
var PreferenceChatEnterLeaveList = ["Normal", "Smaller", "Hidden"];
/** @type {ChatMemberNumbersType[]} */
var PreferenceChatMemberNumbersList = ["Always", "Never", "OnMouseover"];
/** @type {ChatFontSizeType[]} */
var PreferenceChatFontSizeList = ["Small", "Medium", "Large"];

/** @type {PreferenceCheckboxOption[]} */
const PreferenceSubscreenChatCheckboxes = [
	{ label: "ColorNames", check: () => Player.ChatSettings.ColorNames, click: () => Player.ChatSettings.ColorNames = !Player.ChatSettings.ColorNames },
	{ label: "ColorActions", check: () => Player.ChatSettings.ColorActions, click: () => Player.ChatSettings.ColorActions = !Player.ChatSettings.ColorActions },
	{ label: "ColorEmotes", check: () => Player.ChatSettings.ColorEmotes, click: () => Player.ChatSettings.ColorEmotes = !Player.ChatSettings.ColorEmotes },
	{ label: "ColorActivities", check: () => Player.ChatSettings.ColorActivities, click: () => Player.ChatSettings.ColorActivities = !Player.ChatSettings.ColorActivities },
	{ label: "ShowActivities", check: () => Player.ChatSettings.ShowActivities, click: () => Player.ChatSettings.ShowActivities = !Player.ChatSettings.ShowActivities },
	{ label: "ShowAutomaticMessages", check: () => Player.ChatSettings.ShowAutomaticMessages, click: () => Player.ChatSettings.ShowAutomaticMessages = !Player.ChatSettings.ShowAutomaticMessages },
	{ label: "ShowBeepChat", check: () => Player.ChatSettings.ShowBeepChat, click: () => Player.ChatSettings.ShowBeepChat = !Player.ChatSettings.ShowBeepChat },
	{ label: "ShowFriendRequestMessages", check: () => Player.ChatSettings.ShowFriendRequestMessages, click: () => Player.ChatSettings.ShowFriendRequestMessages = !Player.ChatSettings.ShowFriendRequestMessages },
	{ label: "ShowChatRoomHelp", check: () => Player.ChatSettings.ShowChatHelp, click: () => Player.ChatSettings.ShowChatHelp = !Player.ChatSettings.ShowChatHelp },
	{ label: "ShrinkNonDialogue", check: () => Player.ChatSettings.ShrinkNonDialogue, click: () => Player.ChatSettings.ShrinkNonDialogue = !Player.ChatSettings.ShrinkNonDialogue },
	{ label: "MuStylePoses", check: () => Player.ChatSettings.MuStylePoses, click: () => Player.ChatSettings.MuStylePoses = !Player.ChatSettings.MuStylePoses },
	{ label: "DisplayTimestamps", check: () => Player.ChatSettings.DisplayTimestamps, click: () => Player.ChatSettings.DisplayTimestamps = !Player.ChatSettings.DisplayTimestamps },
	{ label: "PreserveWhitespace", check: () => Player.ChatSettings.WhiteSpace == "Preserve", click: () => Player.ChatSettings.WhiteSpace = Player.ChatSettings.WhiteSpace == "Preserve" ? "" : "Preserve" },
	{
		label: "PreserveChat",
		check: () => Player.ChatSettings.PreserveChat,
		click: () => {
			Player.ChatSettings.PreserveChat = !Player.ChatSettings.PreserveChat;
			const roomSeps = /** @type {HTMLDivElement[]} */(Array.from(document.querySelectorAll("#TextAreaChatLog .chat-room-sep")));
			if (Player.ChatSettings.PreserveChat) {
				roomSeps.forEach(e => e.toggleAttribute("hidden", false));
			}
		}
	},
	{ label: "OOCAutoClose", check: () => Player.ChatSettings.OOCAutoClose, click: () => Player.ChatSettings.OOCAutoClose = !Player.ChatSettings.OOCAutoClose },
	{ label: "DisableReplies", check: () => Player.ChatSettings.DisableReplies, click: () => Player.ChatSettings.DisableReplies = !Player.ChatSettings.DisableReplies },
];

/** @type {Record<string, PreferenceDropdownOption>} */
const PreferenceSubscreenChatDropdowns = {
	ColorTheme: {
		list: [...PreferenceChatColorThemeList],
		current: () => Player.ChatSettings.ColorTheme,
		onChange: (value) => {
			Player.ChatSettings.ColorTheme = /** @type {ChatColorThemeType} */ (value);
		},
	},
	EnterLeaveStyle: {
		list: [...PreferenceChatEnterLeaveList],
		current: () => Player.ChatSettings.EnterLeave,
		onChange: (value) => {
			Player.ChatSettings.EnterLeave = /** @type {ChatEnterLeaveType} */ (value);
		},
	},
	DisplayMemberNumbers: {
		list: [...PreferenceChatMemberNumbersList],
		current: () => Player.ChatSettings.MemberNumbers,
		onChange: (value) => {
			Player.ChatSettings.MemberNumbers = /** @type {ChatMemberNumbersType} */ (value);
		},
	},
	FontSize: {
		list: [...PreferenceChatFontSizeList],
		current: () => Player.ChatSettings.FontSize,
		onChange: (value) => {
			Player.ChatSettings.FontSize = /** @type {ChatFontSizeType} */ (value);
			ChatRoomRefreshFontSize();
		},
	}
};

const PreferenceSubscreenChatIDs = Object.freeze({
	grid: 'preference-chat-grid',
});

function PreferenceSubscreenChatLoad() {
	const checkboxHtmlOptions = { container: { classList: ["preference-settings-checkbox"] } };

	const dropdownElements = Object.entries(PreferenceSubscreenChatDropdowns).map(([key, dropdown]) => {
		const currentValue = dropdown.current();
		const options = dropdown.list.map((/** @type {string} */ e) => /** @type {Omit<HTMLOptions<"option">, "tag">} */ ({attributes: { value: e, label: TextGet(e), selected: e === currentValue }}));
		return ElementDropdown.CreateLabelled(`${key}-dropdown`, options, TextGet(key),
			function (ev) {
				ev.preventDefault();
				const value = this.value;
				if (!value) return;
				if (!dropdown.list.includes(value)) return;
				dropdown.onChange(value);
			}, null, {
				container: {
					classList: ["preference-settings-dropdown"],
				}
			}
		);
	});

	const checkboxElements = PreferenceSubscreenChatCheckboxes.map((checkbox) => {
		const checked = checkbox.check();
		const label = TextGet(checkbox.label);

		return ElementCheckbox.CreateLabelled(`${checkbox.label}-checkbox`, label, checkbox.click, {
			checked
		}, checkboxHtmlOptions);
	});

	const grid = ElementCreate({
		tag: "div",
		classList: ["preference-settings-grid", "preference-settings-aligned-grid", "scroll-box"],
		attributes: { id: PreferenceSubscreenChatIDs.grid },
		children: [
			...dropdownElements,
			...checkboxElements
		]
	});

	ElementWrap(PreferenceIDs.subscreen)?.append(grid);
}

/**
 * Sets the chat preferences for the player. Redirected to from the main Run function if the player is in the chat
 * settings subscreen.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenChatRun() {
	DrawCharacter(Player, 50, 50, 0.9);
}

/**
 * Handles the click events for the chat settings of a player.  Redirected from the main Click function.
 * @returns {void} - Nothing
 */
function PreferenceSubscreenChatClick() {
}

/**
 * Exits the preference screen
 */
function PreferenceSubscreenChatExit() {
	return true;
}

/** @type {ScreenResizeHandler} */
function PreferenceSubscreenChatResize(onLoad) {
	const { x, y } = PreferenceSubscreenMainGrid;
	ElementSetPosition(PreferenceSubscreenChatIDs.grid, x, y + 10);
	ElementSetSize(PreferenceSubscreenChatIDs.grid, 1400, 800);
}
