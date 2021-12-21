"use strict";

let KinkyDungeonGoddessRep = {
};

function KinkyDungeonInitReputation() {
	KinkyDungeonGoddessRep = {};
	for (let shrine in KinkyDungeonShrineBaseCosts) {
		KinkyDungeonGoddessRep[shrine] = 0;
	}
}

function KinkyDungeonHandleReputation() {

}

function KinkyDungeonChangeRep(Rep, Amount) {
	if (KinkyDungeonGoddessRep[Rep] != undefined) {
		let last = KinkyDungeonGoddessRep[Rep];
		let target = -50;
		let interval = 0.05;
		if (Amount >= 0) target = 50;
		for (let i = 0; i < Math.abs(Amount); i++) {
			KinkyDungeonGoddessRep[Rep] += (target - KinkyDungeonGoddessRep[Rep]) * interval;
		}
		KinkyDungeonGoddessRep[Rep] = Math.min(50, Math.max(-50, KinkyDungeonGoddessRep[Rep]));
		if (KinkyDungeonGoddessRep[Rep] != last) return true;
		return false;
	}
	return false;
}

function KinkyDungeonDrawReputation() {
	let i = 0;
	let maxY = 500;
	let XX = 0;
	let spacing = 60;
	let yPad = 50;
	MainCanvas.textAlign = "left";
	for (let rep in KinkyDungeonGoddessRep) {
		let value = KinkyDungeonGoddessRep[rep];

		if (rep) {
			if (spacing * i > maxY) {
				if (XX == 0) i = 0;
				XX = 600;
			}
			DrawText(TextGet("KinkyDungeonShrine" + rep), canvasOffsetX + XX, yPad + canvasOffsetY + spacing * i, "white", "black");
			DrawProgressBar(canvasOffsetX + 250 + XX, yPad + canvasOffsetY + spacing * i - spacing/4, 200, spacing/2, 50 + value, )

			i++;
		}

	}
	MainCanvas.textAlign = "center";
}