import { Game } from "./game";
import * as utils from "./utils";
import * as socket from "./socket";
import * as element from "./element";
import * as _screen from "./screen";
import * as character from "./character";

export {
	utils,
	socket,
	element,
	_screen as screen, // Re-aliasing to prevent overriding of the global `screen` symbol
	character,
	Game,
};
