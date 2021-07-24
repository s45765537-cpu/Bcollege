"use strict";
var CurrencyList = [["USD", "$", 1], ["EURO", "€", 1], ["RUB", "₽", 100], ["JPY", "¥", 100], ["CNY", "¥", 5]];//[Currency,Symbol,Value] (exchange rates are not exact) (feel free to add more)
var CurrencyCurrentIndex = 0;
var CurrencyCurrent = "USD";

/**
 * Returns the value of $1 in CurrentCurrency 
 * @param {string} CurrentCurrency Currency to convert to
 */
function CurrencyGetCurrencyValue(CurrentCurrency) {
	let ReturnValue = null;
	for (let i = 0; i < CurrencyList.length; i++) {
		if (CurrencyList[i][0] == CurrentCurrency) {
			ReturnValue = CurrencyList[i][2];
		}
	}
	if (ReturnValue != null) {
		return ReturnValue;
	}
	else { console.warn(`Invalid currency "${CurrentCurrency}"`)}
}

/**
 * Returns the symbol of CurrentCurrency (for example USD -> $)
 * @param {string} CurrentCurrency Currency to get the symbol of
 */
function CurrencyGetSymbol(CurrentCurrency) {
	let ReturnValue = null;
	for (let i = 0; i < CurrencyList.length; i++) {
		if (CurrencyList[i][0] == CurrentCurrency) {
			ReturnValue = CurrencyList[i][1];
		}
	}
	if (ReturnValue != null) {
		return ReturnValue;
	}
	else { console.warn(`Invalid currency "${CurrentCurrency}"`) }
}

/**
 * returns the symbol of CurrentCurrency and value of Amount in $ to CurrentCurrency as a string (for example CurrencyGetBoth("JPY", 1) -> ¥100")
 * @param {string} CurrentCurrency Currency to convert to
 * @param {number} Amount Amount in $
 */
function CurrencyGetBoth(CurrentCurrency, Amount){
	let ReturnValue = null;
	for (let i = 0; i < CurrencyList.length; i++) {
		if (CurrencyList[i][0] == CurrentCurrency) {
			ReturnValue = "";
			ReturnValue += CurrencyList[i][1];
			ReturnValue += (CurrencyList[i][2] * Amount);
		}
	}
	if (ReturnValue != null) {
		return ReturnValue;
	}
	else { console.warn(`Invalid currency "${CurrentCurrency}"`) }
}

/**
 * converts all prices of CurrentCharacter.Dialog
 * */
function CurrencyDialogChange() {
	let ValidNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];//this is for later, to check if something's a number (there probably is a more easy way, isnt there?)
	for (let i = 0; i < CurrentCharacter.Dialog.length; i++) {
		//checks for prices in the options
		if (CurrentCharacter.Dialog[i].Option !== undefined) {
			if (CurrentCharacter.Dialog[i].Option.includes("$")) {
				let MoneyPositon = null;//The Position of the price in the string
				let Money_Amount = null;
				for (let o = 0; o < CurrentCharacter.Dialog[i].Option.length; o++) {
					if (CurrentCharacter.Dialog[i].Option[o] == "$") {
						MoneyPositon = o;
					}
				}
				if (MoneyPositon != null) {
					let NumbersEnded = false;
					Money_Amount = "";
					for (let u = 1; u < 10 && !NumbersEnded; u++) {
						if (ValidNumbers.includes(CurrentCharacter.Dialog[i].Option[MoneyPositon + u])) {
							Money_Amount += CurrentCharacter.Dialog[i].Option[MoneyPositon + u];
						}
						else {
							NumbersEnded = true;
						}
					}
					//if a number is longer than 10 digits, something went wrong, so it doesn't change it
					//if a number has 0 digits, it's something like the $PONY in the HorseWalk.csv, and should not get changed
					if (Money_Amount - length > 0 && Money_Amount.length < 10) {
						CurrentCharacter.Dialog[i].Option = CurrentCharacter.Dialog[i].Option.replace("$" + Money_Amount, CurrencyGetBoth(CurrencyCurrent, parseInt(Money_Amount)));
					}
				}
			}
		}
	}
	//checks for prices in the results
	//this works exactly same as the option-checker
	for (let i = 0; i < CurrentCharacter.Dialog.length; i++) {
		if (CurrentCharacter.Dialog[i].Result !== undefined) {
			if (CurrentCharacter.Dialog[i].Result.includes("$")) {
				let MoneyPositon = null;
				let Money_Amount = null;
				for (let o = 0; o < CurrentCharacter.Dialog[i].Result.length; o++) {
					if (CurrentCharacter.Dialog[i].Result[o] == "$") {
						MoneyPositon = o;
					}
				}
				if (MoneyPositon != null) {
					let NumbersEnded = false;
					Money_Amount = "";
					for (let u = 1; u < 10 && !NumbersEnded; u++) {
						if (ValidNumbers.includes(CurrentCharacter.Dialog[i].Result[MoneyPositon + u])) {
							Money_Amount += CurrentCharacter.Dialog[i].Result[MoneyPositon + u];
						}
						else {
							NumbersEnded = true;
						}
					}
					if (Money_Amount - length > 0 && Money_Amount.length < 10) {
						CurrentCharacter.Dialog[i].Result = CurrentCharacter.Dialog[i].Result.replace(String("$" + Money_Amount), CurrencyGetBoth(CurrencyCurrent, parseInt(Money_Amount)));
					}
				}
			}
		}
	}
}