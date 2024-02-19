"use strict";

const BackgroundsStringsPath = "Backgrounds/Backgrounds.csv";

// All tags
const BackgroundsTagNone = "Filter by tag";
const BackgroundsTagIndoor = "Indoor";
const BackgroundsTagOutdoor = "Outdoor";
const BackgroundsTagAquatic = "Aquatic";
const BackgroundsTagSpecial = "Special Events";
const BackgroundsTagSciFiFantasy = "SciFi & Fantasy";
const BackgroundsTagClub = "Club & College";
const BackgroundsTagHouse = "Regular house";
const BackgroundsTagDungeon = "Dungeon";
const BackgroundsTagAsylum = "Asylum";

/**
 * List of all tags to create online chat rooms
 * @constant
 * @type {BackgroundTag[]}
 */
const BackgroundsTagList = [
	BackgroundsTagNone,
	BackgroundsTagIndoor,
	BackgroundsTagOutdoor,
	BackgroundsTagAquatic,
	BackgroundsTagSpecial,
	BackgroundsTagSciFiFantasy,
	BackgroundsTagClub,
	BackgroundsTagHouse,
	BackgroundsTagDungeon
];

/**
 * List of all tags to setup your main hall or private room
 * @constant
 * @type {BackgroundTag[]}
 */
const BackgroundsPrivateRoomTagList = [
	BackgroundsTagClub,
	BackgroundsTagHouse,
	BackgroundsTagDungeon
];

// Be sure to go into [Screens\Character\Player\Dialog_Player.csv] and add a new line at around line 440, follow the format.
/**
 * List of all the common backgrounds.
 * @constant
 * @type {{ Name: string; Tag: BackgroundTag[]; }[]}
 */
const BackgroundsList = [
	{ Name: "AbandonedBuilding", Tag: [BackgroundsTagIndoor] },
	{ Name: "AbandonedSideRoom", Tag: [BackgroundsTagIndoor] },
	{ Name: "AlchemistOffice", Tag: [BackgroundsTagIndoor, BackgroundsTagSciFiFantasy] },
	{ Name: "AncientRuins", Tag: [BackgroundsTagOutdoor] },
	{ Name: "AsylumBedroom", Tag: [BackgroundsTagAsylum] },
	{ Name: "AsylumEntrance", Tag: [BackgroundsTagAsylum] },
	{ Name: "AsylumGGTSRoom", Tag: [BackgroundsTagAsylum] },
	{ Name: "AsylumMeeting", Tag: [BackgroundsTagAsylum] },
	{ Name: "AsylumTherapy", Tag: [BackgroundsTagAsylum] },
	{ Name: "BackAlley", Tag: [BackgroundsTagOutdoor] },
	{ Name: "BalconyNight", Tag: [BackgroundsTagOutdoor, BackgroundsTagHouse] },
	{ Name: "BarRestaurant", Tag: [BackgroundsTagIndoor] },
	{ Name: "BDSMRoomBlue", Tag: [BackgroundsTagIndoor, BackgroundsTagDungeon] },
	{ Name: "BDSMRoomPurple", Tag: [BackgroundsTagIndoor, BackgroundsTagDungeon] },
	{ Name: "BDSMRoomRed", Tag: [BackgroundsTagIndoor, BackgroundsTagDungeon] },
	{ Name: "Beach", Tag: [BackgroundsTagOutdoor, BackgroundsTagAquatic] },
	{ Name: "BeachCafe", Tag: [BackgroundsTagOutdoor] },
	{ Name: "BeachHotel", Tag: [BackgroundsTagOutdoor] },
	{ Name: "BeachSunset", Tag: [BackgroundsTagOutdoor] },
	{ Name: "Bedroom", Tag: [BackgroundsTagIndoor, BackgroundsTagHouse] },
	{ Name: "BondageBedChamber", Tag: [BackgroundsTagIndoor, BackgroundsTagDungeon] },
	{ Name: "Boudoir", Tag: [BackgroundsTagIndoor, BackgroundsTagHouse] },
	{ Name: "BoutiqueBack", Tag: [BackgroundsTagIndoor] },
	{ Name: "BoutiqueMain", Tag: [BackgroundsTagIndoor] },
	{ Name: "CaptainCabin", Tag: [BackgroundsTagIndoor, BackgroundsTagAquatic] },
	{ Name: "Castle", Tag: [BackgroundsTagOutdoor, BackgroundsTagSciFiFantasy] },
	{ Name: "Cellar", Tag: [BackgroundsTagIndoor, BackgroundsTagHouse] },
	{ Name: "CeremonialVenue", Tag: [BackgroundsTagOutdoor, BackgroundsTagSpecial] },
	{ Name: "ChillRoom", Tag: [BackgroundsTagIndoor, BackgroundsTagHouse] },
	{ Name: "CollegeClass", Tag: [BackgroundsTagClub, BackgroundsTagIndoor] },
	{ Name: "CollegeTennis", Tag: [BackgroundsTagClub, BackgroundsTagOutdoor] },
	{ Name: "CollegeTheater", Tag: [BackgroundsTagClub, BackgroundsTagIndoor] },
	{ Name: "Confessions", Tag: [BackgroundsTagIndoor, BackgroundsTagSciFiFantasy, BackgroundsTagDungeon] },
	{ Name: "CosyChalet", Tag: [BackgroundsTagIndoor, BackgroundsTagHouse] },
	{ Name: "CozyLivingRoom", Tag: [BackgroundsTagIndoor, BackgroundsTagHouse] },
	{ Name: "CreepyBasement", Tag: [BackgroundsTagIndoor] },
	{ Name: "DeepForest", Tag: [BackgroundsTagOutdoor] },
	{ Name: "Desert", Tag: [BackgroundsTagOutdoor] },
	{ Name: "DesolateVillage", Tag: [BackgroundsTagOutdoor] },
	{ Name: "DiningRoom", Tag: [BackgroundsTagIndoor] },
	{ Name: "Dungeon", Tag: [BackgroundsTagIndoor, BackgroundsTagDungeon] },
	{ Name: "DungeonRuin", Tag: [BackgroundsTagIndoor, BackgroundsTagDungeon] },
	{ Name: "DystopianCity", Tag: [BackgroundsTagOutdoor, BackgroundsTagSciFiFantasy] },
	{ Name: "EgyptianExhibit", Tag: [BackgroundsTagIndoor] },
	{ Name: "EgyptianTomb", Tag: [BackgroundsTagIndoor] },
	{ Name: "EmptyWarehouse", Tag: [BackgroundsTagIndoor] },
	{ Name: "ForestCave", Tag: [BackgroundsTagOutdoor] },
	{ Name: "ForestPath", Tag: [BackgroundsTagOutdoor] },
	{ Name: "Gardens", Tag: [BackgroundsTagOutdoor] },
	{ Name: "Gymnasium", Tag: [BackgroundsTagIndoor] },
	{ Name: "HeavenEntrance", Tag: [BackgroundsTagOutdoor, BackgroundsTagSciFiFantasy] },
	{ Name: "HellEntrance", Tag: [BackgroundsTagOutdoor, BackgroundsTagSciFiFantasy] },
	{ Name: "HorseStable", Tag: [BackgroundsTagIndoor] },
	{ Name: "HotelBedroom", Tag: [BackgroundsTagIndoor] },
	{ Name: "HotelBedroom2", Tag: [BackgroundsTagIndoor] },
	{ Name: "HouseBasement1", Tag: [BackgroundsTagIndoor, BackgroundsTagHouse] },
	{ Name: "HouseBasement2", Tag: [BackgroundsTagIndoor, BackgroundsTagHouse] },
	{ Name: "HouseBasement3", Tag: [BackgroundsTagIndoor, BackgroundsTagHouse] },
	{ Name: "HouseInterior1", Tag: [BackgroundsTagIndoor, BackgroundsTagHouse] },
	{ Name: "HouseInterior2", Tag: [BackgroundsTagIndoor, BackgroundsTagHouse] },
	{ Name: "HouseInterior3", Tag: [BackgroundsTagIndoor, BackgroundsTagHouse] },
	{ Name: "HypnoSpiral2", Tag: [] },
	{ Name: "HypnoticSpiral", Tag: [] },
	{ Name: "IndoorPool", Tag: [BackgroundsTagIndoor, BackgroundsTagAquatic, BackgroundsTagHouse] },
	{ Name: "Industrial", Tag: [BackgroundsTagIndoor] },
	{ Name: "Infiltration", Tag: [BackgroundsTagClub, BackgroundsTagIndoor, BackgroundsTagSciFiFantasy] },
	{ Name: "Introduction", Tag: [BackgroundsTagIndoor, BackgroundsTagClub] },
	{ Name: "JungleTemple", Tag: [BackgroundsTagOutdoor] },
	{ Name: "Kennels", Tag: [BackgroundsTagIndoor] },
	{ Name: "KidnapLeague", Tag: [BackgroundsTagIndoor, BackgroundsTagClub] },
	{ Name: "Kitchen", Tag: [BackgroundsTagIndoor, BackgroundsTagHouse] },
	{ Name: "LatexRoom", Tag: [BackgroundsTagIndoor, BackgroundsTagDungeon, BackgroundsTagAsylum] },
	{ Name: "LeatherChamber", Tag: [BackgroundsTagIndoor, BackgroundsTagDungeon] },
	{ Name: "LingerieShop", Tag: [BackgroundsTagIndoor] },
	{ Name: "LockerRoom", Tag: [BackgroundsTagIndoor] },
	{ Name: "LostVages", Tag: [BackgroundsTagIndoor] },
	{ Name: "MaidCafe", Tag: [BackgroundsTagIndoor, BackgroundsTagClub] },
	{ Name: "MaidQuarters", Tag: [BackgroundsTagIndoor, BackgroundsTagClub] },
	{ Name: "MainHall", Tag: [BackgroundsTagIndoor, BackgroundsTagClub] },
	{ Name: "Management", Tag: [BackgroundsTagIndoor, BackgroundsTagClub] },
	{ Name: "MedinaMarket", Tag: [BackgroundsTagOutdoor] },
	{ Name: "MiddletownSchool", Tag: [BackgroundsTagOutdoor] },
	{ Name: "MovieStudio", Tag: [BackgroundsTagClub, BackgroundsTagIndoor] },
	{ Name: "NightClub", Tag: [BackgroundsTagIndoor] },
	{ Name: "Nursery", Tag: [BackgroundsTagIndoor] },
	{ Name: "Office1", Tag: [BackgroundsTagIndoor] },
	{ Name: "Office2", Tag: [BackgroundsTagIndoor] },
	{ Name: "OldFarm", Tag: [BackgroundsTagOutdoor] },
	{ Name: "Onsen", Tag: [BackgroundsTagOutdoor, BackgroundsTagAquatic] },
	{ Name: "OutdoorPool", Tag: [BackgroundsTagOutdoor, BackgroundsTagAquatic] },
	{ Name: "OutdoorPool2", Tag: [BackgroundsTagOutdoor, BackgroundsTagAquatic] },
	{ Name: "OutsideCells", Tag: [BackgroundsTagAsylum] },
	{ Name: "PaddedCell", Tag: [BackgroundsTagAsylum] },
	{ Name: "PaddedCell2", Tag: [BackgroundsTagAsylum] },
	{ Name: "ParkDay", Tag: [BackgroundsTagOutdoor] },
	{ Name: "ParkNight", Tag: [BackgroundsTagOutdoor] },
	{ Name: "ParkWinter", Tag: [BackgroundsTagOutdoor, BackgroundsTagSpecial] },
	{ Name: "PartyBasement", Tag: [BackgroundsTagIndoor, BackgroundsTagHouse] },
	{ Name: "PirateIsland", Tag: [BackgroundsTagOutdoor, BackgroundsTagAquatic] },
	{ Name: "PirateIslandNight", Tag: [BackgroundsTagOutdoor, BackgroundsTagAquatic] },
	{ Name: "PoolBottom", Tag: [BackgroundsTagAquatic] },
	{ Name: "PrisonHall", Tag: [BackgroundsTagIndoor] },
	{ Name: "Private", Tag: [BackgroundsTagIndoor, BackgroundsTagHouse] },
	{ Name: "PublicBath", Tag: [BackgroundsTagIndoor, BackgroundsTagAquatic] },
	{ Name: "RainyForestPathDay", Tag: [BackgroundsTagOutdoor] },
	{ Name: "RainyForstPathNight", Tag: [BackgroundsTagOutdoor] },
	{ Name: "RainyStreetDay", Tag: [BackgroundsTagOutdoor] },
	{ Name: "RainyStreetNight", Tag: [BackgroundsTagOutdoor] },
	{ Name: "Ranch", Tag: [BackgroundsTagOutdoor] },
	{ Name: "ResearchPrep", Tag: [BackgroundsTagIndoor, BackgroundsTagSciFiFantasy, BackgroundsTagDungeon] },
	{ Name: "ResearchProgress", Tag: [BackgroundsTagIndoor, BackgroundsTagSciFiFantasy, BackgroundsTagDungeon] },
	{ Name: "Restaurant1", Tag: [BackgroundsTagIndoor] },
	{ Name: "Restaurant2", Tag: [BackgroundsTagIndoor] },
	{ Name: "RooftopParty", Tag: [BackgroundsTagOutdoor, BackgroundsTagHouse] },
	{ Name: "RustySaloon", Tag: [BackgroundsTagIndoor] },
	{ Name: "SchoolHallway", Tag: [BackgroundsTagIndoor] },
	{ Name: "SchoolHospital", Tag: [BackgroundsTagIndoor] },
	{ Name: "SchoolRuins", Tag: [BackgroundsTagOutdoor] },
	{ Name: "SciFiCell", Tag: [BackgroundsTagIndoor, BackgroundsTagSciFiFantasy, BackgroundsTagDungeon] },
	{ Name: "SciFiOutdoors", Tag: [BackgroundsTagOutdoor, BackgroundsTagSciFiFantasy] },
	{ Name: "SciFiRed", Tag: [BackgroundsTagIndoor, BackgroundsTagSciFiFantasy] },
	{ Name: "SecretChamber", Tag: [BackgroundsTagIndoor, BackgroundsTagSciFiFantasy] },
	{ Name: "SheikhPrivate", Tag: [BackgroundsTagIndoor] },
	{ Name: "SheikhTent", Tag: [BackgroundsTagIndoor] },
	{ Name: "Shibari", Tag: [BackgroundsTagIndoor, BackgroundsTagClub] },
	{ Name: "ShipDeck", Tag: [BackgroundsTagOutdoor, BackgroundsTagAquatic] },
	{ Name: "Shipwreck", Tag: [BackgroundsTagOutdoor, BackgroundsTagAquatic] },
	{ Name: "SlipperyClassroom", Tag: [BackgroundsTagIndoor] },
	{ Name: "SlumApartment", Tag: [BackgroundsTagIndoor] },
	{ Name: "SlumCellar", Tag: [BackgroundsTagIndoor] },
	{ Name: "SlumRuins", Tag: [BackgroundsTagOutdoor] },
	{ Name: "SnowyChaletDay", Tag: [BackgroundsTagOutdoor] },
	{ Name: "SnowyChaletNight", Tag: [BackgroundsTagOutdoor] },
	{ Name: "SnowyDeepForest", Tag: [BackgroundsTagOutdoor] },
	{ Name: "SnowyForestPathDay", Tag: [BackgroundsTagOutdoor] },
	{ Name: "SnowyForestPathNight", Tag: [BackgroundsTagOutdoor] },
	{ Name: "SnowyLakeNight", Tag: [BackgroundsTagOutdoor] },
	{ Name: "SnowyStreet", Tag: [BackgroundsTagOutdoor, BackgroundsTagSpecial] },
	{ Name: "SnowyStreetDay1", Tag: [BackgroundsTagOutdoor] },
	{ Name: "SnowyStreetDay2", Tag: [BackgroundsTagOutdoor] },
	{ Name: "SnowyStreetNight2", Tag: [BackgroundsTagOutdoor] },
	{ Name: "SnowyTown1", Tag: [BackgroundsTagOutdoor] },
	{ Name: "SnowyTown2", Tag: [BackgroundsTagOutdoor] },
	{ Name: "SpaceCaptainBedroom", Tag: [BackgroundsTagIndoor, BackgroundsTagSciFiFantasy] },
	{ Name: "SpookyForest", Tag: [BackgroundsTagOutdoor] },
	{ Name: "StreetNight", Tag: [BackgroundsTagOutdoor] },
	{ Name: "SunTemple", Tag: [BackgroundsTagOutdoor] },
	{ Name: "SynthWave", Tag: [BackgroundsTagOutdoor, BackgroundsTagSciFiFantasy] },
	{ Name: "ThroneRoom", Tag: [BackgroundsTagIndoor] },
	{ Name: "TiledBathroom", Tag: [BackgroundsTagIndoor, BackgroundsTagHouse] },
	{ Name: "UnderwaterOne", Tag: [BackgroundsTagOutdoor, BackgroundsTagSciFiFantasy, BackgroundsTagAquatic] },
	{ Name: "VaultCorridor", Tag: [BackgroundsTagIndoor, BackgroundsTagSciFiFantasy] },
	{ Name: "Wagons", Tag: [BackgroundsTagOutdoor] },
	{ Name: "WeddingArch", Tag: [BackgroundsTagOutdoor, BackgroundsTagSpecial] },
	{ Name: "WeddingBeach", Tag: [BackgroundsTagOutdoor, BackgroundsTagSpecial, BackgroundsTagAquatic] },
	{ Name: "WeddingRoom", Tag: [BackgroundsTagIndoor, BackgroundsTagSpecial] },
	{ Name: "WesternStreet", Tag: [BackgroundsTagOutdoor] },
	{ Name: "WitchWood", Tag: [BackgroundsTagOutdoor, BackgroundsTagSciFiFantasy] },
	{ Name: "WoodenCabin", Tag: [BackgroundsTagIndoor] },
	{ Name: "WrestlingRing", Tag: [BackgroundsTagIndoor] },
	{ Name: "XmasDay", Tag: [BackgroundsTagIndoor, BackgroundsTagSpecial] },
	{ Name: "XmasEve", Tag: [BackgroundsTagIndoor, BackgroundsTagSpecial] },
	{ Name: "Yacht1", Tag: [BackgroundsTagIndoor, BackgroundsTagAquatic] },
	{ Name: "Yacht2", Tag: [BackgroundsTagIndoor, BackgroundsTagAquatic] },
	{ Name: "Yacht3", Tag: [BackgroundsTagIndoor, BackgroundsTagAquatic] },
];

function BackgroundsTextGet(msg) {
	return TextAllScreenCache.get(BackgroundsStringsPath).get(msg);
}

/**
 * Builds the selectable background arrays based on the tags supplied
 * @param {readonly BackgroundTag[]} BackgroundTagList - An array of string of all the tags to load
 * @returns {string[]} - The list of all background names
 */
function BackgroundsGenerateList(BackgroundTagList) {
	/** @type {string[]} */
	var List = [];
	BackgroundSelectionAll = [];
	for (let B = 0; B < BackgroundsList.length; B++)
		for (let T = 0; T < BackgroundsList[B].Tag.length; T++)
			if (BackgroundTagList.indexOf(BackgroundsList[B].Tag[T]) >= 0) {
				List.push(BackgroundsList[B].Name);
				var Desc = BackgroundsTextGet(BackgroundsList[B].Name);
				BackgroundSelectionAll.push({ Name: BackgroundsList[B].Name, Description: Desc, Low: Desc.toLowerCase() });
				break;
			}
	return List;
}
