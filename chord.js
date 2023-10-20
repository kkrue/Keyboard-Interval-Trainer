export class ChordCreator {
	constructor(noteTools) {
		this.chordTypes = {
			maj: {
				intervals: [0, 4, 7],
				keyType: "sharp"
			},
			min: {
				intervals: [0, 3, 7],
				keyType: "flat"
			},
			aug: {
				intervals: [0, 4, 8],
				keyType: "sharp"
			},
			dim: {
				intervals: [0, 3, 6],
				keyType: "flat"
			},
			sus2: {
				intervals: [0, 2, 7],
				keyType: "sharp"
			},
			sus4: {
				intervals: [0, 5, 7],
				keyType: "sharp"
			},
			maj7: {
				intervals: [0, 4, 7, 11],
				keyType: "sharp"
			},
			min7: {
				intervals: [0, 3, 7, 10],
				keyType: "flat"
			},
			dom7: {
				intervals: [0, 4, 7, 10],
				keyType: "flat"
			},
			dim7: {
				intervals: [0, 3, 6, 9],
				keyType: "flat"
			},
			maj6: {
				intervals: [0, 4, 7, 9],
				keyType: "sharp"
			},
			min6: {
				intervals: [0, 3, 7, 9],
				keyType: "flat"
			}
		};

		this.keyboardKeys = this.#generateKeyboardKeys(9);
		this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

		this.noteTools = noteTools;
		this.currentChord = "";
	}

	getKeyType(chordType) {
		const chordData = this.chordTypes[chordType];

		if (chordData.keyType == "flat") {
			return "flat";
		}

		return "sharp";
	}

	// Chords cannot be a mix of sharp and flat keys.  If one is picked, all others must be of the same type.
	keyTypeSelected() {
		let returnValue = "";
		const _this = this;

		$('input[id^="chordType"]').each(function() {
			if ($(this).is(':checked')) {
				let value = $(this).val();
				let keyType = _this.getKeyType(value);

				returnValue = keyType;
				return false;
			}
		});

		return returnValue;
	}

	getRandomChord(rootNote, inversions) {
		const selectedChords = [];
		const allCheckedChordTypes = $('input[id^="chordType"]:checked');

		if (allCheckedChordTypes.length == 0) {
			$('input[id="chordTypeMaj"]').prop('checked', true);
			selectedChords.push("maj");
		}
		else {
			allCheckedChordTypes.each((index, element) => {
				selectedChords.push($(element).val());
			});
		}

		const randomIndex = Math.floor(Math.random() * selectedChords.length);
		const selectedChordName = selectedChords[randomIndex];

		let chord = this.create(rootNote, selectedChords[randomIndex]);
		this.currentChord = rootNote.note + selectedChordName;
		chord = this.invert(chord, inversions);

		return chord;
	}

	clearChordLabel() {
		this.currentChord = "";
	}

	getChordLabel() {
		return this.currentChord;
	}

	create(rootNoteObj, chordType) {
		const chordNotes = this.#getChordNotes(rootNoteObj.midiNote, chordType);
		this.noteTools.numNotes = chordNotes.length;

		return chordNotes;
	}

	invert(chordNotes, inversionNumber) {
		this.inversionLabel = "";

		if (inversionNumber == 0) {
			return chordNotes;
		}

		for (let i = 0; i < inversionNumber; i++) {
			let shiftedNote = chordNotes.shift();
			chordNotes.push(this.#adjustOctave(shiftedNote, 1));
		}

		const rootNote = this.noteTools.createNoteObject(chordNotes[0]);
		this.currentChord = this.currentChord + " / " + rootNote.note;

		return chordNotes;
	}

	#generateKeyboardKeys(octaveRange) {
		const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

		const keyboardKeys = notes.flatMap((note, index) => {
			return Array.from({ length: octaveRange + 1 }, (_, octave) => {
				const key = `${note}${octave}`;
				const absoluteNumber = octave * notes.length + index;
				return [key, absoluteNumber];
			});
		});

		return keyboardKeys;
	}

	#getChordNotes(rootNote, chordType) {
		const chordIntervals = this.#getChordIntervals(chordType);
		const chordNotes = this.#buildChordNotes(rootNote, chordIntervals, chordType);

		return chordNotes;
	}

	#adjustOctave(note, amount) {
		const noteLetter = note.slice(0, -1);
		const octave = parseInt(note.slice(-1));

		const adjustedOctave = octave + amount;
	  	return noteLetter + adjustedOctave;
	}

	#getChordIntervals(chordType) {
		const chordData = this.chordTypes[chordType];
		return chordData ? chordData.intervals : [];
	}

	#buildChordNotes(rootNote, chordIntervals, chordType) {
		const octave = parseInt(rootNote.slice(-1));
		const noteLetter = rootNote.slice(0, -1);
		const rootIndex = this.noteNames.indexOf(noteLetter);
		if (rootIndex === -1 || chordIntervals.length === 0) {
			return [];
		}

		const chordData = this.chordTypes[chordType];

		let chordNotes = chordIntervals.map(interval => this.noteNames[(rootIndex + interval) % 12]);
		chordNotes = this.#applyOctave(chordNotes, octave);
		let oArrChordNotes = chordNotes.map(this.noteTools.createNoteObject);

		if (chordData.keyType == "flat") {
			oArrChordNotes = oArrChordNotes.map(oNote => this.noteTools.getFlatVersionOfSharp(oNote));
		}

		return oArrChordNotes;
	}

	#applyOctave(notes, octave) {
		let lastNoteNum = -1;
		let adjustedOctave = octave;
		const notesWithOctave = [];

		for (let note of notes) {
			let noteNum = this.noteNames.indexOf(note);

			if (noteNum < lastNoteNum && adjustedOctave < octave + 1) {
				adjustedOctave++;
			}

			lastNoteNum = noteNum;
			notesWithOctave.push(note + adjustedOctave);
		}

		return notesWithOctave;
	}

	getChordName(notes, inversion) {
		const rootNote = notes[0]; // Assuming the first note in the array is the root note
		const bassNote = notes[inversion];

		return `${rootNote}/${bassNote}`;
	}
}
