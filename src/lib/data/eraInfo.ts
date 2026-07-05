/**
 * Era display labels — avoiding ambiguity with modern names.
 * Used in PersonPanel, TimelineView, PeopleDirectoryView, and node tooltips.
 */
export const ERA_LABELS: Record<string, string> = {
  "pre-flood": "Pre-Flood Era",
  "post-flood": "Post-Flood Era",
  "patriarchs": "Patriarchal Age",
  "judges": "Period of the Judges",
  "united-kingdom": "Kingdom of Israel (United)",
  "divided-kingdom": "Kingdom of Judah",
  "exile-return": "Babylonian Exile & Return",
  "post-exile": "Post-Exile · Judea",
  "new-testament": "New Testament · Roman Judea",
};

/**
 * One-line descriptions for each era, shown under the era heading in list/grid views.
 */
export const ERA_DESCRIPTIONS: Record<string, string> = {
  "pre-flood":       "The earliest generations of humanity, from Adam's creation through the world God declared 'very good' — and the corruption that followed.",
  "post-flood":      "The world rebuilt after the flood. Noah's descendants spread across the earth and the nations are formed.",
  "patriarchs":      "God's covenant people take shape. Abraham is called out of Ur, and through Isaac and Jacob the twelve tribes of Israel are born.",
  "judges":          "Israel settles in Canaan under a cycle of faithfulness and failure. Ruth and Boaz keep the Messianic line alive.",
  "united-kingdom":  "Israel united under one king. David establishes Jerusalem; Solomon builds the Temple. The covenant of an eternal dynasty is given to David.",
  "divided-kingdom": "After Solomon, the kingdom splits. The line of Judah carries the Messianic promise through generations of kings in Jerusalem.",
  "exile-return":    "Babylon conquers Jerusalem and takes the people into exile — a turning point named in Matthew 1:11. Zerubbabel leads the return.",
  "post-exile":      "The returned exiles rebuild Jerusalem under Persian rule. The silent years before the New Testament begin.",
  "new-testament":   "The fulfillment of every promise. Jesus is born in Bethlehem, descendant of David, son of Abraham, son of Adam.",
};

/**
 * Approximate dates for messianic-line figures — traditional/scholarly consensus.
 * Single source of truth used by both TimelineView and TimelineBar.
 * All dates are approximate (traditional reckoning) and clearly labelled as such in the UI.
 */
export const APPROX_DATES: Record<string, string> = {
  adam:          "~4000 BC",
  seth:          "~3870 BC",
  enosh:         "~3765 BC",
  kenan:         "~3675 BC",
  mahalalel:     "~3605 BC",
  jared:         "~3540 BC",
  enoch:         "~3378 BC",
  methuselah:    "~3313 BC",
  lamech:        "~3126 BC",
  noah:          "~2948 BC",
  shem:          "~2448 BC",
  arphaxad:      "~2347 BC",
  shelah:        "~2312 BC",
  eber:          "~2282 BC",
  peleg:         "~2248 BC",
  reu:           "~2218 BC",
  serug:         "~2186 BC",
  nahor:         "~2156 BC",
  terah:         "~2126 BC",
  abraham:       "~2000 BC",
  isaac:         "~1900 BC",
  jacob:         "~1836 BC",
  judah:         "~1818 BC",
  perez:         "~1793 BC",
  hezron:        "~1763 BC",
  ram:           "~1742 BC",
  amminadab:     "~1722 BC",
  nahshon:       "~1300 BC",
  salmon:        "~1260 BC",
  boaz:          "~1150 BC",
  obed:          "~1120 BC",
  jesse:         "~1085 BC",
  david:         "~1040 BC",
  solomon:       "~970 BC",
  rehoboam:      "~953 BC",
  abijah:        "~931 BC",
  asa:           "~913 BC",
  jehoshaphat:   "~873 BC",
  jehoram:       "~848 BC",
  uzziah:        "~790 BC",
  jotham:        "~750 BC",
  ahaz:          "~735 BC",
  hezekiah:      "~716 BC",
  manasseh:      "~687 BC",
  amon:          "~643 BC",
  josiah:        "~641 BC",
  jeconiah:      "~615 BC",
  shealtiel:     "~598 BC",
  zerubbabel:    "~566 BC",
  jesus:         "~4 BC",
};

/**
 * Geographic locations sourced directly from scripture for specific people.
 * Only included where scripture names a location associated with the person.
 */
export interface LocationInfo {
  place: string;
  scriptureRef: string;
}

export const PERSON_LOCATIONS: Record<string, LocationInfo> = {
  adam:        { place: "Garden of Eden",               scriptureRef: "Genesis 2:8"     },
  eve:         { place: "Garden of Eden",               scriptureRef: "Genesis 2:8"     },
  noah:        { place: "Mountains of Ararat",          scriptureRef: "Genesis 8:4"     },
  abraham:     { place: "Ur of the Chaldeans → Canaan", scriptureRef: "Genesis 11:28; 12:5" },
  sarah:       { place: "Ur of the Chaldeans → Canaan", scriptureRef: "Genesis 11:29; 12:5" },
  isaac:       { place: "Canaan · Beersheba",           scriptureRef: "Genesis 26:23"   },
  rebekah:     { place: "Aram-Naharaim → Canaan",       scriptureRef: "Genesis 24:10"   },
  jacob:       { place: "Canaan → Aram → Egypt",        scriptureRef: "Genesis 28:5; 46:6" },
  leah:        { place: "Aram (Haran) → Canaan",        scriptureRef: "Genesis 29:16"   },
  rachel:      { place: "Aram (Haran) → Canaan",        scriptureRef: "Genesis 29:6"    },
  judah:       { place: "Canaan",                       scriptureRef: "Genesis 38:1"    },
  "joseph-son-of-jacob": { place: "Canaan → Egypt", scriptureRef: "Genesis 37:28; 39:1" },
  ruth:        { place: "Moab → Bethlehem, Judah",      scriptureRef: "Ruth 1:1–4"      },
  boaz:        { place: "Bethlehem, Judah",             scriptureRef: "Ruth 2:1"        },
  obed:        { place: "Bethlehem, Judah",             scriptureRef: "Ruth 4:13–17"    },
  jesse:       { place: "Bethlehem, Judah",             scriptureRef: "1 Samuel 16:1"   },
  david:       { place: "Bethlehem → Hebron → Jerusalem", scriptureRef: "1 Samuel 17:12; 2 Samuel 2:4; 5:6" },
  bathsheba:   { place: "Jerusalem",                    scriptureRef: "2 Samuel 11:2"   },
  solomon:     { place: "Jerusalem",                    scriptureRef: "1 Kings 2:11"    },
  rehoboam:    { place: "Jerusalem, Judah",             scriptureRef: "1 Kings 14:21"   },
  jeconiah:    { place: "Jerusalem → Babylon",          scriptureRef: "2 Kings 24:15"   },
  shealtiel:   { place: "Babylon",                      scriptureRef: "1 Chronicles 3:17" },
  zerubbabel:  { place: "Babylon → Jerusalem",          scriptureRef: "Ezra 2:2"        },
  jesus:       { place: "Bethlehem → Nazareth → Jerusalem", scriptureRef: "Matthew 2:1; 2:23; Luke 23:33" },
};
