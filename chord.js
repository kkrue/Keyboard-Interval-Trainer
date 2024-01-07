export class ChordCreator {
	constructor(noteTools, noteGenerator) {
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

		this.noteTools = noteTools;
		this.noteGenerator = noteGenerator;

		this.currentChord = "";
	}

	getChordKeyType(chordType = this.currentChord) {
		const chordData = this.chordTypes[chordType];

		if (chordData.keyType == "flat") {
			return "flat";
		}

		return "sharp";
	}

	keyTypeSelected() {
		let returnValue = "";
		const _this = this;

		$('input[id^="chordType"]').each(function() {
			if ($(this).is(':checked')) {
				let value = $(this).val();
				let keyType = _this.getChordKeyType(value);

				returnValue = keyType;
				return false;
			}
		});

		return returnValue;
	}

	getRandomChord(startRange, endRange) {
		const selectedChords = [];
		const allCheckedChordTypes = $('input[id^="chordType"]:checked');
		const controlData = this.noteTools.getControlData();

		let rootNote = this.noteGenerator.getRandomNote(startRange, endRange);
		const inversions = parseInt(controlData.chordInversions)

		if (allCheckedChordTypes.length == 0) {
			$('input[id="chordTypeMaj"]').prop('checked', true); // Change to use controlData
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
		this.currentChord = rootNote.letter + accidental + " " + selectedChordName;
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

	#getChordNotes(oRootNote, chordType) {
		const chordIntervals = this.#getChordIntervals(chordType);
		const chordNotes = this.#buildChordNotes(oRootNote, chordIntervals);

		return chordNotes;
	}

	#adjustOctave(oNote, amount) {
		oNote.setOctave(oNote.octave + amount);
	}

	#getChordIntervals(chordType) {
		const chordData = this.chordTypes[chordType];
		return chordData ? chordData.intervals : [];
	}

	#buildChordNotes(oRootNote, chordIntervals) {
		const rootIndex = this.noteGenerator.getKeyboardNotes(true).indexOf(oRootNote.midiNote);

		if (rootIndex === -1 || chordIntervals.length === 0) {
			return [];
		}

		let chordNotes = chordIntervals.map(interval => this.noteGenerator.getNoteNames()[(rootIndex + interval) % 12]);
		chordNotes = this.#applyOctave(chordNotes, parseInt(oRootNote.octave));
		let oArrChordNotes = chordNotes.map(this.noteTools.createNoteObject);

		return oArrChordNotes;
	}

	#applyOctave(notes, octave) {
		let lastNoteNum = -1;
		let adjustedOctave = octave;
		const notesWithOctave = [];

		for (let note of notes) {
			let noteNum = this.noteGenerator.getNoteNames().indexOf(note);

			if (noteNum < lastNoteNum && adjustedOctave < octave + 1) {
				adjustedOctave++;
			}

			lastNoteNum = noteNum;
			notesWithOctave.push(note + adjustedOctave);
		}

		return notesWithOctave;
	}
}
