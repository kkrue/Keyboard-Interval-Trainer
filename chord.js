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

	getKeyType(chordType = this.currentChord) {
		const chordData = this.chordTypes[chordType];

		if (chordData.keyType == "flat") {
			return "flat";
		}

		return "sharp";
	}

	// Chords cannot be a mix of sharp and flat keys.  If one is picked, all others must be of the same type.
	// This function controls the interface.
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
		const controlData = this.noteTools.getControlData();

		if (allCheckedChordTypes.length == 0) {
			$('input[id="chordTypeMaj"]').prop('checked', true); // Change to use controlData
			selectedChords.push("maj");
		}
		else {
			allCheckedChordTypes.each((index, element) => {
				selectedChords.push($(element).val());
			});
		}

		if (controlData.rootSharpsFlats == "true") {
			rootNote = this.#getRandomSharpOrFlat(rootNote);
		}

		rootNote = this.noteTools.getFlatVersionOfSharp(rootNote);
		const randomIndex = Math.floor(Math.random() * selectedChords.length);
		const selectedChordName = selectedChords[randomIndex];

		let chord = this.create(rootNote, selectedChords[randomIndex]);
		this.#createChordLabel(rootNote, selectedChordName);
		chord = this.invert(chord, inversions);

		return chord;
	}

	#createChordLabel(rootNote, selectedChordName) {
		let accidental = "";

		if (rootNote.accidental == "f") {
			accidental = `<span class="chordLabelAccidental">b</span>`;
		}
		else if (rootNote.accidental == "#") {
			accidental = `<span class="chordLabelAccidental">B</span>`;
		}
		this.currentChord = rootNote.note + accidental + " " + selectedChordName;
	}

	#getRandomSharpOrFlat(rootNote) {
		let isSharp = Boolean(Math.floor(Math.random() * 2));
		rootNote = isSharp ? this.noteTools.sharpNote(rootNote) : rootNote;

		return rootNote;
	}

	clearChordLabel() {
		this.currentChord = "";
	}

	getChordLabel() {
		return this.currentChord;
	}

	create(oRootNote, chordType) {
		const chordNotes = this.#getChordNotes(oRootNote, chordType);
		this.noteTools.numNotes = chordNotes.length;

		return chordNotes;
	}

	invert(chordNoteObjs, inversionNumber) {
		this.inversionLabel = "";

		if (inversionNumber == 0) {
			return chordNoteObjs;
		}

		for (let i = 0; i < inversionNumber; i++) {
			let shiftedNote = chordNoteObjs.shift();
			this.#adjustOctave(shiftedNote, 1)
			chordNoteObjs.push(shiftedNote);
		}

		const rootNote = this.noteTools.createNoteObject(chordNoteObjs[0]);
		this.currentChord = this.currentChord + " / " + rootNote.note;

		return chordNoteObjs;
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

	#getChordNotes(oRootNote, chordType) {
		const chordIntervals = this.#getChordIntervals(chordType);
		const chordNotes = this.#buildChordNotes(oRootNote, chordIntervals);

		return chordNotes;
	}

	#adjustOctave(oNote, amount) {
		const adjustedOctave = oNote.octave + amount;
		oNote.octave = adjustedOctave;
	}

	#getChordIntervals(chordType) {
		const chordData = this.chordTypes[chordType];
		return chordData ? chordData.intervals : [];
	}

	#buildChordNotes(oRootNote, chordIntervals) {
		const rootIndex = this.noteNames.indexOf(oRootNote.midiNoteNoOctave);

		if (rootIndex === -1 || chordIntervals.length === 0) {
			return [];
		}

		let chordNotes = chordIntervals.map(interval => this.noteNames[(rootIndex + interval) % 12]);
		chordNotes = this.#applyOctave(chordNotes, parseInt(oRootNote.octave));
		let oArrChordNotes = chordNotes.map(this.noteTools.createNoteObject);

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

	// getChordName(notes, inversion) {
	// 	const rootNote = notes[0]; // Assuming the first note in the array is the root note
	// 	const bassNote = notes[inversion];

	// 	return `${rootNote}/${bassNote}`;
	// }
}
