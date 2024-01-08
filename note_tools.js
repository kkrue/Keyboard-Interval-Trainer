import { KeySignature } from './key_sig.js';
import { ChordCreator } from './chord.js';

export class NoteTools {
	constructor() {
		this.NOTE_CHAR = "w";
		this.SHARP = "B";
		this.FLAT = "b";
		this.NATURAL = "\u266E";

		this.LOWEST_BASS_NOTE = "C2";
		this.LOWEST_TREBLE_NOTE = "A3";

		this.STAFF_LINE_SPACING_PX = 17;
		this.NOTE_LEFT_OFFSET = 180;

		this.notePosition = new Map();
		this.startOfFirstUpperLedger = 14;
		this.numNotes = 4;
		this.noteGroupId = 0;
		this.displayedNotes = [];

		this.keySig = new KeySignature(this);
		this.chord = new ChordCreator(this, null);
	}

	#generateKeySigMap(clef) {
		this.keySigMap = new Map();

		if (clef == "treble") {
			this.keySigMap.set("0#", {"positions": [], "notes": []});
			this.keySigMap.set("1#", {"positions": [9], "notes": ["F"]});
			this.keySigMap.set("2#", {"positions": [9,6], "notes": ["F","C"]});
			this.keySigMap.set("3#", {"positions": [9,6,10], "notes": ["F","C","G"]});
			this.keySigMap.set("4#", {"positions": [9,6,10,7], "notes": ["F","C","G","D"]});
			this.keySigMap.set("5#", {"positions": [9,6,10,7,4,], "notes": ["F","C","G","D","A"]});
			this.keySigMap.set("6#", {"positions": [9,6,10,7,4,8], "notes": ["F","C","G","D","A","E"]});
			this.keySigMap.set("7#", {"positions": [9,6,10,7,4,8,5], "notes": ["F","C","G","D","A","E","B"]});
			this.keySigMap.set("1f", {"positions": [5], "notes": ["B"]});
			this.keySigMap.set("2f", {"positions": [5,8], "notes": ["B","E"]});
			this.keySigMap.set("3f", {"positions": [5,8,4], "notes": ["B","E","A"]});
			this.keySigMap.set("4f", {"positions": [5,8,4,7], "notes": ["B","E","A","D"]});
			this.keySigMap.set("5f", {"positions": [5,8,4,7,3], "notes": ["B","E","A","D","G"]});
			this.keySigMap.set("6f", {"positions": [5,8,4,7,3,6], "notes": ["B","E","A","D","G","C"]});
			this.keySigMap.set("7f", {"positions": [5,8,4,7,3,6,2], "notes": ["B","E","A","D","G","C","F"]});
		}
		else {
			this.keySigMap.set("0#", {"positions": [], "notes": []});
			this.keySigMap.set("1#", {"positions": [7], "notes": ["F"]});
			this.keySigMap.set("2#", {"positions": [7,4], "notes": ["F","C"]});
			this.keySigMap.set("3#", {"positions": [7,4,8], "notes": ["F","C","G"]});
			this.keySigMap.set("4#", {"positions": [7,4,8,5], "notes": ["F","C","G","D"]});
			this.keySigMap.set("5#", {"positions": [7,4,8,5,2], "notes": ["F","C","G","D","A"]});
			this.keySigMap.set("6#", {"positions": [7,4,8,5,2,6], "notes": ["F","C","G","D","A","E"]});
			this.keySigMap.set("7#", {"positions": [7,4,8,5,2,6,3], "notes": ["F","C","G","D","A","E","B"]});
			this.keySigMap.set("1f", {"positions": [3], "notes": ["B"]});
			this.keySigMap.set("2f", {"positions": [3,6], "notes": ["B","E"]});
			this.keySigMap.set("3f", {"positions": [3,6,2], "notes": ["B","E","A"]});
			this.keySigMap.set("4f", {"positions": [3,6,2,5], "notes": ["B","E","A","D"]});
			this.keySigMap.set("5f", {"positions": [3,6,2,5,1], "notes": ["B","E","A","D","G"]});
			this.keySigMap.set("6f", {"positions": [3,6,2,5,1,4], "notes": ["B","E","A","D","G","C"]});
			this.keySigMap.set("7f", {"positions": [3,6,2,5,1,4,0], "notes": ["B","E","A","D","G","C","F"]});
		}
	}

	getKeySigMap() {
		return this.keySigMap;
	}

	#getAdjacentNote(startMidiNote, direction) {
		const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteObj = this.createNoteObject(startMidiNote);

        const parsedNote = /^([A-G])(#|b)?(\d+)$/.exec(startMidiNote);
        if (!parsedNote) {
            throw new Error('Invalid note format');
        }

        const noteIndex = noteOrder.indexOf(noteObj.note);
        if (noteIndex === -1) {
            throw new Error('Invalid note');
        }

        let adjacentNoteIndex;
        if (direction === 'next') {
            adjacentNoteIndex = (noteIndex + 1) % noteOrder.length;
        }
		else if (direction === 'previous') {
            adjacentNoteIndex = (noteIndex - 1 + noteOrder.length) % noteOrder.length;
        }
		else {
            throw new Error('Invalid direction');
        }

        let nextOctave = noteObj.octave;

        if (adjacentNoteIndex === 0 && direction === 'next') {
            nextOctave++;
        }
		else if (adjacentNoteIndex === noteOrder.length - 1 && direction === 'previous') {
            nextOctave--;
        }

        const adjacentNote = noteOrder[adjacentNoteIndex];

        return adjacentNote + nextOctave;
    }

    #generateNoteToNumberMap(clef) {
		const startRange = 0;
		const endRange = 33; //F#6

		let currentNote = this.LOWEST_TREBLE_NOTE;
		if (clef == "bass") {
			currentNote = this.LOWEST_BASS_NOTE;
		}

		let position = 0;
		let lastNote = "";
		this.notePosition = new Map();

		for (let i = startRange; i <= endRange; i++) {
			// The position only advances when the note advances, so a C and C# have the same position.
			if (lastNote != "" && lastNote != currentNote.charAt(0)) {
				position++;
			}

			this.notePosition.set(currentNote, position);

			lastNote = currentNote.charAt(0);
			currentNote = this.#getAdjacentNote(currentNote, "next");
		}
	}

	loadNotePositionsOnStaff(clef) {
		this.#generateNoteToNumberMap(clef);
		this.#generateKeySigMap(clef);

		this.sharped = new Map();
		this.sharped.set("C", "C#");
		this.sharped.set("D", "D#");
		this.sharped.set("E", "F");
		this.sharped.set("F", "F#");
		this.sharped.set("G", "G#");
		this.sharped.set("A", "A#");
		this.sharped.set("B", "C");

		// Midi always shows flats as the areNotesEqualivalent sharp, so we go with that.
		this.flatted = new Map();
		this.flatted.set("C", "B");
		this.flatted.set("D", "C#");
		this.flatted.set("E", "D#");
		this.flatted.set("F", "E");
		this.flatted.set("G", "F#");
		this.flatted.set("A", "G#");
		this.flatted.set("B", "A#");
	}

	setControlData(jsonData) {
		this.controlData = jsonData;
	}

	getControlData() {
		return this.controlData;
	}

	getNotesByNumber(noteNumber, allowSharps) {
		const notes = Array.from(this.notePosition.entries())
		.filter(([id, value]) => value === noteNumber)
		.map(([id]) => id);

		const index = allowSharps ? this.getRandomNumber(0, 1) : 0;

		if (notes.length == 1) {
			return notes[0];
		}
		else {
			return notes[index];
		}
	}

	getAllMidiNotes(clef, noSharps) {
		this.#generateNoteToNumberMap(clef);
		let result = Array.from(this.notePosition.entries()).map(([key, value]) => [value, key]);

		if (noSharps) {
			result = result.filter(([value, key]) => key.indexOf("#") === -1);
		}

		return result;
	}

	getRandomNumber(min, max) {
		let result;

		if (min == max || min > max) {
			result = min;
		}
		else {
			result = Math.floor(Math.random() * (max - min + 1) + min);
		}

		return result;
	}

	reset() {
		this.#createNotes("musicNote");
		this.#createNotes("userNote");
	}

	// Create a note object from a MIDI note.
	createNoteObject(note) {
		/* Properties:
			displayedNote (Where the note is shown.  An E# is an F, but sits on the E line.)
			accidental
			displayedAccidental
			letter
			note (no octave, but with accidental)
			octave
			accidental
			noteWithOctave
			rawNoteWithOctave (no sharps or flats)
			midiNote (the original note)
		*/

		if (typeof note === 'object') {
			return note;
		}

		const noteObj = {
			displayedNote: "", // Where the note is shown.  An E# is an F, but sits on the E line.
			accidental: "",
			displayedAccidental: ""
		};

		Object.defineProperty(noteObj, 'letter', {
			get: () => {
				return noteObj.note.charAt(0);
			}
		});

		noteObj.note = note.charAt(0);
		noteObj.octave = parseInt(note.substr(-1));

		if (note.charAt(1) === "#") {
			noteObj.note = note.charAt(0) + note.charAt(1);
			noteObj.accidental = "#";
		}

		noteObj.noteWithOctave = noteObj.note + noteObj.octave;
		noteObj.rawNoteWithOctave = noteObj.letter + noteObj.octave;
		noteObj.midiNote = note;
		noteObj.midiNoteNoOctave = note.replace(/\d/g, '');

		noteObj.setOctave = (octave) => {
			noteObj.octave = octave;
			noteObj.noteWithOctave = noteObj.note + noteObj.octave;
			noteObj.rawNoteWithOctave = noteObj.letter + noteObj.octave;
		}

		return noteObj;
	}

	sharpNote(note) {
		const letter = note.substr(0, 1);
		const octave = note.substr(1, 2);

		note = letter + "#" + octave;

		return note;
	}

	areNotesEqual(notes1, notes2) {
		notes1 = notes1.map(oNote => {
			return oNote.noteWithOctave;
		});

		return JSON.stringify(notes1.sort()) === JSON.stringify(notes2.sort());
	}

	// Adjust notes to the diatonic notes for the key signature.  All notes are given in the sharp form for MIDI comparison.
	adjustIntervalForKeySignature(keySig, interval) {
		const adjustedInterval = [];

		for (let note of interval) {
			let oNote = this.createNoteObject(note);
			adjustedInterval.push(this.getNoteForKeySignature(keySig, oNote));
		}

		return adjustedInterval;
	}

	// Get the diatonic note for the key signature. Example: For Dmaj, pass in an F, get F#.  Pass in E, get E.
	// Return the sharp form, so a Db is a C#.
	// This probably needs fixed after code changes to incorporate sharps and flats.
	getNoteForKeySignature(keySig, oNote) {
		const sharpOrFlat = keySig.charAt(1);

		if (oNote.accidental == sharpOrFlat) {
			return oNote;
		}

		const mapPiece = this.keySigMap.get(keySig);
		const keySigNotes = mapPiece.notes;
		let adjustedNote = oNote;

		for (let noteInList of keySigNotes) {
			if (oNote.letter === noteInList) {
				adjustedNote = this.#adjustNoteForKeySignature(sharpOrFlat, oNote);
				break;
			}
		}

		return adjustedNote;
	}

	// Instead of displaying a sharp, get the flat version. The incoming note is expected to be a sharp.
	getFlatVersionOfSharp(origNote) {
		const note = origNote.note;
		let newNoteLetter = "";

		if (origNote.accidental != "#") {
			return origNote;
		}

		if (note == "C#") {
			newNoteLetter = "D";
		}
		else if (note == "D#") {
			newNoteLetter = "E";
		}
		else if (note == "F#") {
			newNoteLetter = "G";
		}
		else if (note == "G#") {
			newNoteLetter = "A";
		}
		else if (note == "A#") {
			newNoteLetter = "B";
		}

		// Create copy note function
		const oNote = this.createNoteObject(newNoteLetter + origNote.octave);
		oNote.accidental = "f";
		oNote.displayedAccidental = "f";
		oNote.displayedNote = oNote.noteWithOctave;
		oNote.hOffset = origNote.hOffset;
		oNote.midiNote = origNote.midiNote;
		oNote.midiNoteNoOctave = origNote.midiNoteNoOctave;

		return oNote;
	}

	getKeySignatureType() {
		let keyType = this.chord.keyTypeSelected();

		if (keyType == "") {
			if ($("#keySignature").val().includes("f")) {
				keyType = "flat";
			}
			else if ($("#keySignature").val().includes("#")) {
				keyType = "sharp";
			}
		}

		return keyType;
	}

	#adjustNoteForKeySignature(sharpOrFlat, oNote) {
		let adjustedNote = oNote.letter;
		let octave = oNote.octave;

		if (sharpOrFlat === "#") {
			if (oNote.letter === "B") {
				octave++;
			}

			adjustedNote = this.sharped.get(oNote.letter) + octave;
		}
		else if (sharpOrFlat === "f") {
			if (oNote.letter === "C") {
				octave--;
			}

			adjustedNote = this.flatted.get(oNote.letter) + octave;
		}

		const newNote = this.createNoteObject(adjustedNote);

		newNote.midiNote = oNote.midiNote;
		newNote.midiNoteNoOctave = oNote.midiNoteNoOctave;

		return newNote;
	}

	// This takes user input and translates it to where it should appear on the staff.  For example, if a user should
	// play Fb, the incoming MIDI note should be an E. This returns an F because it should be on the F line.
	getLineForPlayedNote(keySig, noteObj) {
		const rawnote = noteObj.letter;
		const noteWithoutOctave = noteObj.note;
		const octave = noteObj.octave;

		const keySigAccidental = keySig.substr(-1);
		const mapPiece = this.keySigMap.get(keySig);
		const keySigNotes = mapPiece.notes;

		noteObj.displayedNote = noteObj.rawNoteWithOctave;

		if (keySigNotes.includes(rawnote)) {
			if (keySigAccidental == "#") {
				// If E is in the key, then it is E#, which is an F.  The user will play F, but the note should appear on the E line.
				if (noteWithoutOctave == "F") {
					noteObj.displayedNote = "E" + octave;
				}
				else if (noteWithoutOctave == "C") {
					noteObj.displayedNote = "B" + (octave - 1);
				}
				else if (noteWithoutOctave.charAt(1) == "#") {
					noteObj.displayedNote = rawnote + octave;
				}
			}
			else if (keySigAccidental == "f") {
				if (noteWithoutOctave == "E") {
					noteObj.displayedNote = "F" + octave;
				}
				else if (noteWithoutOctave == "B") {
					noteObj.displayedNote = "C" + (octave + 1);
				}
				else if (noteWithoutOctave == "A#") {
					noteObj.displayedNote = "B" + octave;
				}
				else if (noteWithoutOctave == "C#") {
					noteObj.displayedNote = "D" + octave;
				}
				else if (noteWithoutOctave == "D#") {
					noteObj.displayedNote = "E" + octave;
				}
				else if (noteWithoutOctave == "F#") {
					noteObj.displayedNote = "G" + octave;
				}
				else if (noteWithoutOctave == "G#") {
					noteObj.displayedNote = "A" + octave;
				}
			}
		}

		return noteObj;
	}

	#displayedAccidentalForKey(keySignature, noteObj) {
		const keySigTable = this.keySigMap.get(keySignature);
		const keySigAccidental = keySignature.charAt(1);

		noteObj.displayedAccidental = noteObj.accidental;

		if (keySigTable.notes.includes(noteObj.letter)) {
			if (noteObj.accidental == "#" && keySigAccidental == "#") {
				noteObj.displayedAccidental = "";
			}
			else if (noteObj.accidental == "f" && keySigAccidental == "f") {
				noteObj.displayedAccidental = "";
			}
			else if (noteObj.accidental == "") {
				noteObj.displayedAccidental = "n";
			}
		}

		return noteObj;
	}

	showNotes(notes, noteType, noteColor) {
		const _this = this;
		const keySig = this.controlData.keySignature;
		this.displayedNotes = [];

		// This does nothing if the notes are already objects.
		let oNotes = notes.map(note => _this.createNoteObject(note));

		this.#setDisplayedNotes(oNotes, noteType, keySig);
		oNotes = this.#hOffsetStackedNotes(oNotes);

		oNotes.forEach((note, i) => {
			this.#showNote(
				note,
				i,
				noteType,
				noteColor,
				keySig
			);
		});

		this.#createLedgerLines(noteType, oNotes);
	}

	#setDisplayedNotes(oNotes, noteType, keySig) {
		oNotes.forEach((oNote, i) => {
			if (noteType == "musicNote") {
				oNote.displayedNote = oNote.rawNoteWithOctave;
			}
			else {
				oNote = this.getLineForPlayedNote(keySig, oNote);
			}
		});
	}

	#showNote(oNote, noteNum, noteType, noteColor, keySig) {
		let noteChar = document.getElementById(noteType + "_noteChar" + noteNum);
		if (noteChar == null) {
			return;
		}

		oNote = this.#displayedAccidentalForKey(keySig, oNote);

		noteChar = this.#displayNoteOnScreen(oNote, noteChar, noteColor);
		this.displayedNotes.push(noteChar);
	}

	#hOffsetStackedNotes(oNoteArr) {
		let lastPosition = -1000;
		let lastNoteWasStacked = false;

		let updatedArr = oNoteArr.map(oNote => {
			if (this.getKeySignatureType() == "flat" && oNote.accidental == "#") {
				oNote = this.getFlatVersionOfSharp(oNote);
			}

			let notePos = parseInt(this.notePosition.get(oNote.displayedNote));
			let distance = Math.abs(notePos - lastPosition);

			if (distance == 1 && !lastNoteWasStacked) {
				lastNoteWasStacked = true;
				oNote.hOffset = 22;
			}
			else {
				lastNoteWasStacked = false;
				oNote.hOffset = 0;
			}

			lastPosition = notePos;

			return oNote;
		});

		return updatedArr;
	}

	#getAccidentalChar(oNote) {
		let accidental = "";

		if (oNote.displayedAccidental == "#") {
			accidental = this.SHARP;
		}
		else if (oNote.displayedAccidental == "f") {
			accidental = this.FLAT;
		}
		else if (oNote.displayedAccidental == "n") {
			accidental = this.NATURAL;
		}
		else {
			accidental = "&nbsp;";
		}

		return accidental;
	}

	#displayNoteOnScreen(oNote, noteChar, noteColor) {
		let pos = this.notePosition.get(oNote.displayedNote);
		let accidental = this.#getAccidentalChar(oNote);

		if (pos == null) {
			return;
		}
		pos = pos * (this.STAFF_LINE_SPACING_PX / 2);

		let offset = -45;

		if (parseInt(oNote.hOffset) > 0) { // This happens when notes are too close vertically.
			noteChar.style.left = oNote.hOffset + "px";
			accidental = `<span style="position: relative; left: -18px">${accidental}</span>`;
		}

		let fontSize = accidental == this.NATURAL ? "55%" : "normal"; // Naturals have to be shrunken as they are too big in the font.

		noteChar.dataset.noteName = oNote.noteWithOctave;
		noteChar.innerHTML = `<span style='position: relative; padding-right: 2px; font-size: ${fontSize}'>${accidental}</span>${this.NOTE_CHAR}`;
		noteChar.style.color = noteColor;
		noteChar.style.top = `${(pos * -1) + offset}px`;
		noteChar.style.display = 'block';
	}

	getDisplayedNotes() {
		return this.displayedNotes;
	}

	showKeySignature(keySignature) {
		const lines = (this.keySigMap.get(keySignature)).positions;
		let character;

		const id = "keySignatureChars_";
		const keySignatureChars = document.querySelectorAll(`[id^=${id}]`);

		for (let keySignatureChar of keySignatureChars) {
			keySignatureChar.remove();
		}

		if (keySignature.indexOf("#") > -1) {
			character = this.SHARP;
		}
		else {
			character = this.FLAT;
		}

		let column = 1;
		for (let lineNum of lines) {
			this.#placeKeySigCharOnLine(character, lineNum, column++);
		}
	}

	// Place a character on a staff line.  The first line is 1 and starts at the bottom.  10 is the last one and sits on top.
	#placeKeySigCharOnLine(character, lineNum, column) {
		const lineZero = -1;
		const pos = lineZero - (this.STAFF_LINE_SPACING_PX / 2) * (lineNum - 1);
		const id = "keySignatureChars_" + lineNum + "_" + column;

		const noteContainer = document.createElement("div");
		noteContainer.id = id;
		noteContainer.style.position = "absolute";
		noteContainer.style.top = `${(pos)}px`;
		noteContainer.style.left = `${45 + (column * 15)}px`;
		noteContainer.style.display = 'block';
		noteContainer.style.zIndex = 99;
		noteContainer.style.fontFamily = "MusiSync";
		noteContainer.style.fontSize = "64pt";
		noteContainer.innerHTML = character;

		let musicContainer = document.getElementById("musicContainer");
		musicContainer.appendChild(noteContainer);
	}

	turnNotesOff(noteType) {
		const idString = noteType + "_noteChar";
		const notes = document.querySelectorAll(`[id^='${idString}']`);

		this.#resetNotePosition(noteType);

		if (notes != null) {
			for (let note of notes) {
				note.style.left = "0px";
				note.style.display = 'none';
				note
			}
		}
	}

	// Create all the notes on startup
	#createNotes(noteType) {
		let noteContainer = document.getElementById(noteType);

		if (noteContainer != null) {
			return;
		}

		noteContainer = document.createElement("div");
		noteContainer.setAttribute("id", noteType);
		noteContainer.style.position = "absolute";

		this.#resetNotePosition(noteType, noteContainer);

		for (let i = 0; i < this.numNotes; i++) {
			let noteDiv = document.createElement("div");
			noteDiv.className = "musicNote";
			noteDiv.setAttribute("id", `${noteType}_noteChar${i}`);

			let musicContainer = document.getElementById("musicContainer");

			if (i == 0) {
				musicContainer.appendChild(noteContainer);
			}
			noteContainer.appendChild(noteDiv);
		}
	}

	#resetNotePosition(noteType, noteContainer) {
		if (noteContainer == null) {
			noteContainer = document.getElementById(noteType);
		}

		if (noteType.indexOf("user") > -1) {
			noteContainer.style.left = this.NOTE_LEFT_OFFSET + 80 + "px";
			noteContainer.style.color = "red";
		}
		else {
			noteContainer.style.color = "black";
			noteContainer.style.left = this.NOTE_LEFT_OFFSET + "px";
		}
	}

	clearLedgerLines() {
		const ledgers = document.querySelectorAll(".ledger");
		ledgers.forEach(ledger => {
			ledger.style.visibility = "hidden";
		});
	}

	#createLedgerLines(noteType, oNotesArr) {
		let oFinalNumberOfLedgers = { "numLedgers" : 0};
		let ledgerContainer;

		// This creates the ledgers for a chord and loops over the number of notes in that chord.
		for (let i = 0; i < this.numNotes; i++) {
			let noteContainer = document.getElementById(noteType);

			if (noteContainer == null) {
				return;
			}

			// No ledgers for invisible notes
			if (noteContainer.style.display == "none") {
				break;
			}

			let noteChar = document.getElementById(noteType + "_noteChar" + i);
			if (noteChar == null) {
				return;
			}

			if (noteChar.style.display == "none") {
				continue;
			}

			let oNumLedgersNeeded = this.getNumberOfLedgers(noteChar.dataset.noteName);

			// If the first note needs 0 ledgers, second needs 1 and the third needs 2, oFinalNumberOfLedgers holds 2
			if (oNumLedgersNeeded.numLedgers > oFinalNumberOfLedgers.numLedgers) {
				oFinalNumberOfLedgers = oNumLedgersNeeded;
				ledgerContainer = noteContainer;
			}
		}

		this.#showLedgers(oFinalNumberOfLedgers, ledgerContainer, noteType, oNotesArr);
	}

	#showLedgers(oLedgerInfo, ledgerContainer, noteType, oNotesArr) {
		let ledgerGroup = document.getElementById("ledgers_" + noteType);

		if (ledgerGroup != null) {
			ledgerGroup = document.getElementById("ledgers_" + noteType);
			ledgerGroup.remove();
		}

		if (oLedgerInfo.numLedgers > 0) {
			let left = ledgerContainer.offsetLeft;

			ledgerGroup = (document.getElementById("ledgers")).cloneNode(true);
			ledgerGroup.id = "ledgers_" + noteType;
			ledgerGroup.style.left = left + 18 + "px";

			if (oLedgerInfo.position == "top") {
				ledgerGroup.style.top = "-85px";
			}

			let musicContainer = document.getElementById("musicContainer");
			musicContainer.appendChild(ledgerGroup);

			if (oLedgerInfo.position == "top") {
				this.#makeTopLedgerLinesVisible(oLedgerInfo.numLedgers, ledgerGroup);
			}
			else {
				this.#makeBottomLedgerLinesVisible(oLedgerInfo.numLedgers, ledgerGroup);
			}
		}
	}

	#makeTopLedgerLinesVisible(numLedgers, ledgerGroup) {
		if (ledgerGroup == null) {
			return;
		}

		let ledgerCount = ledgerGroup.children.length;

		for (let ledgerLine of ledgerGroup.children) {
			if (ledgerCount-- <= numLedgers) {
				ledgerLine.style.borderColor = 'black';
				ledgerLine.style.visibility = 'visible';
			}
		}
	}

	#makeBottomLedgerLinesVisible(numLedgers, ledgerGroup) {
		if (ledgerGroup == null) {
			return;
		}

		let ledgerCount = 1;

		for (let ledgerLine of ledgerGroup.children) {
			ledgerLine.style.visibility = 'visible';
			if (ledgerCount++ >= numLedgers) {
				break;
			}
		}
	}

	getNumberOfLedgers(note) {
		const numLedgersTotal = 3;
		let numLedgers = 0;
		let pos = this.notePosition.get(note);
		let retVal = { "numLedgers" : 0, "position" : ""};

		if (pos <= 2) {
			numLedgers = Math.ceil((numLedgersTotal - pos) / 2);
			retVal.position = "bottom";
		}

		if (pos >= this.startOfFirstUpperLedger) {
			numLedgers = Math.round((pos - (this.startOfFirstUpperLedger - 1)) / 2);
			retVal.position = "top";
		}

		retVal.numLedgers = numLedgers;

		return retVal;
	}
}
