/**
 * Type check whether all `window`-defined backgrounds, screen functions and (dynamic) extended item function have an appropriate signature.
 */
// eslint-disable-next-line no-unused-vars
const foo = {
	/** @type {{ [key in `${RoomName}Background`]?: string }} */
	Background: globalThis,

	/** @type {{ [key in `${RoomName}Run`]: ScreenRunHandler }} */
	Run: globalThis,
	/** @type {{ [key in `${RoomName}MouseDown`]?: MouseEventListener }} */
	MouseDown: globalThis,
	/** @type {{ [key in `${RoomName}MouseUp`]?: MouseEventListener }} */
	MouseUp: globalThis,
	/** @type {{ [key in `${RoomName}MouseMove`]?: MouseEventListener }} */
	MouseMove: globalThis,
	/** @type {{ [key in `${RoomName}MouseWheel`]?: MouseWheelEventListener }} */
	MouseWheel: globalThis,
	/** @type {{ [key in `${RoomName}Click`]: MouseEventListener }} */
	Click: globalThis,
	/** @type {{ [key in `${RoomName}Load`]?: ScreenLoadHandler }} */
	Load: globalThis,
	/** @type {{ [key in `${RoomName}Unload`]?: ScreenUnloadHandler }} */
	Unload: globalThis,
	/** @type {{ [key in `${RoomName}Draw`]?: ScreenDrawHandler }} */
	Draw: globalThis,
	/** @type {{ [key in `${RoomName}Resize`]?: ScreenResizeHandler }} */
	Resize: globalThis,
	/** @type {{ [key in `${RoomName}KeyDown`]?: KeyboardEventListener }} */
	KeyDown: globalThis,
	/** @type {{ [key in `${RoomName}KeyUp`]?: KeyboardEventListener }} */
	KeyUp: globalThis,
	/** @type {{ [key in `${RoomName}Paste`]?: ClipboardEventListener }} */
	Paste: globalThis,
	/** @type {{ [key in `${RoomName}Exit`]?: ScreenExitHandler }} */
	Exit: globalThis,

	/** @type {{ [key in `Inventory${AssetGroupName}${string}Init`]?: ExtendedItemCallbacks.Init }} */
	ExtendedItemInit: globalThis,
	/** @type {{ [key in `Inventory${AssetGroupName}${string}Load`]?: ExtendedItemCallbacks.Load }} */
	ExtendedItemLoad: globalThis,
	/** @type {{ [key in `Inventory${AssetGroupName}${string}Draw`]?: ExtendedItemCallbacks.Draw }} */
	ExtendedItemDraw: globalThis,
	/** @type {{ [key in `Inventor${AssetGroupName}${string}Click`]?: ExtendedItemCallbacks.Click }} */
	ExtendedItemClick: globalThis,
	/** @type {{ [key in `Inventory${AssetGroupName}${string}Exit`]?: ExtendedItemCallbacks.Exit }} */
	ExtendedItemExit: globalThis,
	/** @type {{ [key in `Inventory${AssetGroupName}${string}Validate`]?: ExtendedItemCallbacks.Validate }} */
	ExtendedItemValidate: globalThis,
	/** @type {{ [key in `Inventory${AssetGroupName}${string}PublishAction`]?: ExtendedItemCallbacks.PublishAction }} */
	ExtendedItemPublishAction: globalThis,
	/** @type {{ [key in `Inventory${AssetGroupName}${string}SetOption`]?: ExtendedItemCallbacks.SetOption }} */
	ExtendedItemSetOption: globalThis,
	/** @type {{ [key in `Assets${AssetGroupName}${string}BeforeDraw`]?: ExtendedItemCallbacks.BeforeDraw }} */
	ExtendedItemBeforeDraw: globalThis,
	/** @type {{ [key in `Assets${AssetGroupName}${string}AfterDraw`]?: ExtendedItemCallbacks.AfterDraw }} */
	ExtendedItemAfterDraw: globalThis,
	/** @type {{ [key in `Assets${AssetGroupName}${string}ScriptDraw`]?: ExtendedItemCallbacks.ScriptDraw }} */
	ExtendedItemScriptDraw: globalThis,
	/** @type {{ [key in `Inventory${AssetGroupName}${string}NpcDialog`]?: (C: Character, Option: ExtendedItemOption, PreviousOption: ExtendedItemOption) => void }} */
	ExtendedItemNpcDialog: globalThis,
};
