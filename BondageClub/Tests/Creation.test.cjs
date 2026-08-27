const { Game, screen, utils, element, socket } = require("./Utils");

/** @type {Record<string, Partial<AccountCreationData> & { status: AccountCreationStatus }>} */
const testParameters = {
	"valid": {
		InputCharacter: "Test123",
		InputName: "Test456",
		InputPassword1: "Hunter2",
		status: "ok",
	},
	"invalid email": {
		InputCharacter: "Test123",
		InputName: "Test456",
		InputPassword1: "Hunter2",
		InputEmail: "Blegh",
		status: "invalid_field",
	},
	"invalid character": {
		InputCharacter: "T̴̺͊̑e̵̥͛͋s̴̢̛̊t̴̟̚1̵͖̅͋2̴͈̯̊3̴̖̘͂",
		InputName: "Test456",
		InputPassword1: "Hunter2",
		status: "invalid_field",
	},
	"invalid name": {
		InputCharacter: "Test123",
		InputName: "T̷̲̺̈́e̷̦̜̎͋s̷̬̾͘t̵̏͜4̷̪̅5̷͇͗6̷͔͎̀",
		InputPassword1: "Hunter2",
		status: "invalid_field",
	},
	"missing password": {
		InputCharacter: "Test123",
		InputName: "Test456",
		status: "invalid_field",
	},
	"already exists": {
		InputCharacter: "Test123",
		InputName: "Test456",
		InputPassword1: "Hunter2",
		status: "already_exists",
	},
};

/** @satisfies {Record<keyof AccountCreationData, "text" | "password" | "email">} */
const expectedInputTypes = {
	InputCharacter: "text",
	InputName: "text",
	InputPassword1: "password",
	InputPassword2: "password",
	InputEmail: "email",
}

/** @type {(name: keyof AccountCreationData) => HTMLInputElement} */
function queryInput(name) {
	return element.querySelector(`input[name="${name}"][type="${expectedInputTypes[name]}"]`)
}

/** @type {(name: string) => HTMLButtonElement} */
function queryButton(name) {
	return element.querySelector(`button[name="${name}"]`);
}

/** @type {(data: Partial<AccountCreationData>) => AccountCreationData} */
function getCreationData(data) {
	return {
		InputCharacter: data.InputCharacter ?? "",
		InputName: data.InputName ?? data.InputCharacter ?? "",
		InputPassword1: data.InputPassword1 ?? "",
		InputPassword2: data.InputPassword2 ?? data.InputPassword1 ?? "",
		InputEmail: data.InputEmail ?? "",
	};
}

/** @type {Record<AccountCreationStatus, (creationData: Required<AccountCreationData>) => Promise<void>>} */
const statusResponsesCallbacks = {
	async ok(creationData) {
		socket.mockResponse("CreationResponse", {
			ServerAnswer: "AccountCreated",
			OnlineID: "foo",
			MemberNumber: 99,
		});
		await screen.awaitScreenChange();
		expect(Game.CurrentScreen).toBe("MainHall");
		expect(Game.Player).toMatchObject({
			Name: creationData.InputCharacter,
			AccountName: creationData.InputName,
			MemberNumber: 99,
			OnlineID: "foo",
		});
	},
	async invalid_field(creationData) {
		expect(Game.CurrentScreen).toBe("Creation");
		utils.keys(expectedInputTypes).some(k => !queryInput(k).validity.valid);
	},
	async already_exists(creationData) {
		const response = "Account already exists";
		socket.mockResponse("CreationResponse", response);
		expect(Game.CurrentScreen).toBe("Creation");
		expect(Game.CreationMessage).toBe(response);
	}
}

beforeAll(async () => {
	return Game.loadAll();
});

beforeEach(async () => {
	Game.ScreenFunctions?.Exit?.();
	Game.ScreenFunctions?.Unload?.();
	await Game.GameStart(true);
	return screen.set("Character", "Login");
});

describe("Create a new Character", () => {
	const param = Object.entries(testParameters).map(([k, v]) => { return { _name: k, ...v }; });
	it.each(param)(`new character: $_name`, async (rawCreationData) => {
		const creationData = getCreationData(rawCreationData);
		expect(Game.CurrentScreen).toBe("Login");
		queryButton("register").click();
		await screen.awaitScreenChange();

		expect(Game.CurrentScreen).toBe("Disclaimer");
		queryButton("accept").click();
		await screen.awaitScreenChange();

		expect(Game.CurrentScreen).toBe("Appearance");
		const acceptButtonCoords = /** @type {const} */([1883, 25]);
		screen.canvasClick(...acceptButtonCoords);
		await screen.awaitScreenChange();

		expect(Game.CurrentScreen).toBe("Creation");
		utils.entries(creationData).forEach(([name, value]) => queryInput(name).value = value);
		queryButton("Create").click();

		await statusResponsesCallbacks[rawCreationData.status](creationData);
	});
});
