"use strict";


var KinkyDungeonFilters = [
	"Consumables",
	"Equipped",
	"Weapons",
	"Outfits",
	"Restraints",
	"Misc"
];

var KinkyDungeonCurrentFilter = KinkyDungeonFilters[0];
var KinkyDungeonCurrentPageInventory = 0;


function KinkyDungeonHandleInventory() {
	
	if (KinkyDungeonCurrentPageInventory > 0 && MouseIn(canvasOffsetX + 100, canvasOffsetY + 483*KinkyDungeonBookScale, 250, 60)) {
		KinkyDungeonCurrentPageInventory -= 1;
		return true;
	}
	if (KinkyDungeonCurrentPageInventory < KinkyDungeonInventory.length-1 && MouseIn(canvasOffsetX + 640*KinkyDungeonBookScale - 325, canvasOffsetY + 483*KinkyDungeonBookScale, 250, 60)) {
		KinkyDungeonCurrentPageInventory += 1;
		return true;
	}
	
	for (let I = 0; I < KinkyDungeonFilters.length; I++) 
		if (MouseIn(canvasOffsetX + 640*KinkyDungeonBookScale + 40, canvasOffsetY + 115 + I*65, 225, 60)) {
			KinkyDungeonCurrentFilter = KinkyDungeonFilters[I];
			KinkyDungeonCurrentPageInventory = 0;
			return true;
		}
	
	return false;
}


function KinkyDungeonFilterInventory(Filter) {
	let ret = [];
	for (let I = 0; I < KinkyDungeonInventory.length; I++) {
		let item = KinkyDungeonInventory[I];
		
		if (item.restraint && Filter == "Equipped") ret.push({name: item.restraint.name, item: item});
		else if (item.looserestraint && Filter == "Restraints") ret.push({name: item.looserestraint.name, item: item});
		else if (item.consumable && Filter == "Consumables") ret.push({name: item.consumable.name, item: item});
		else if (item.weapon && Filter == "Weapons") ret.push({name: item.weapon.name, item: item});
		else if (item.outfit && Filter == "Outfits") ret.push({name: item.outfit.name, item: item});
		else if (Filter == "Misc") ret.push({name: item.name, item: item});
	}
	
	return ret;
}

function KinkyDungeonDrawInventorySelected(List) {
	let item = List[KinkyDungeonCurrentPageInventory];
	let name = "Item";
	let prefix = "KinkyDungeonInventoryItem";
	if (item.restraint || item.looserestraint) prefix = "Restraint";
	
	DrawText(TextGet(prefix + name), canvasOffsetX + 640*KinkyDungeonBookScale/3.35, canvasOffsetY + 483*KinkyDungeonBookScale/5, "black", "silver");
	var textSplit = KinkyDungeonWordWrap(TextGet(prefix + name + "Desc")), 15).split('\n');
	
	var i = 0;
	for (let N = 0; N < textSplit.length; N++) {
		DrawText(textSplit[N],
			canvasOffsetX + 640*KinkyDungeonBookScale*(1-1/3.35), canvasOffsetY + 483*KinkyDungeonBookScale/5 + i * 40, "black", "silver"); i++;}

	i = 0;
}

function KinkyDungeonDrawInventory() {
	DrawImageZoomCanvas(KinkyDungeonRootDirectory + "MagicBook.png", MainCanvas, 0, 0, 640, 483, canvasOffsetX, canvasOffsetY, 640*KinkyDungeonBookScale, 483*KinkyDungeonBookScale, false);

	if (KinkyDungeonCurrentPageInventory > 0) {
		DrawButton(canvasOffsetX + 100, canvasOffsetY + 483*KinkyDungeonBookScale, 250, 60, TextGet("KinkyDungeonBookLastPage"), "White", "", "");
	}
	if (KinkyDungeonCurrentPageInventory < KinkyDungeonInventory.length-1) {
		DrawButton(canvasOffsetX + 640*KinkyDungeonBookScale - 325, canvasOffsetY + 483*KinkyDungeonBookScale, 250, 60, TextGet("KinkyDungeonBookNextPage"), "White", "", "");
	}
	
	KinkyDungeonDrawInventorySelected(KinkyDungeonFilterInventory(KinkyDungeonCurrentFilter));
	
	for (let I = 0; I < KinkyDungeonFilters.length; I++) 
		DrawButton(canvasOffsetX + 640*KinkyDungeonBookScale + 40, canvasOffsetY + 115 + I*65, 225, 60, TextGet("KinkyDungeonCategoryFilter" + KinkyDungeonFilters[I]), (KinkyDungeonCurrentFilter == KinkyDungeonFilters[I]) ? "White" : "Grey", "", "");
}