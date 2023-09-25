export class ChordCreator {
	constructor(noteTools) {
		this.chordTypes = {
			maj: [0, 4, 7],
			min: [0, 3, 7],
			aug: [0, 4, 8],
			dim: [0, 3, 6],
			sus2: [0, 2, 7],
			sus4: [0, 5, 7],
			maj7: [0, 4, 7, 11],
			min7: [0, 3, 7, 10],
			dom7: [0, 4, 7, 10],
			dim7: [0, 3, 6, 9],
			maj6: [0, 4, 7, 9],
			min6: [0, 3, 7, 9]
		};

		this.keyboardKeys = this.#generateKeyboardKeys(9);
		this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

		this.noteTools = noteTools;
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
		console.table(chord)

		return chord;
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
		const chordNotes = this.#buildChordNotes(rootNote, chordIntervals);

		return chordNotes;
	}

	#adjustOctave(note, amount) {
		const noteLetter = note.slice(0, -1);
		const octave = parseInt(note.slice(-1));

		const adjustedOctave = octave + amount;
	  	return noteLetter + adjustedOctave;
	}

	#getChordIntervals(chordType) {
		return this.chordTypes[chordType] || [];
	}

	#buildChordNotes(rootNote, chordIntervals) {
		const octave = parseInt(rootNote.slice(-1));
		const noteLetter = rootNote.slice(0, -1);
		const rootIndex = this.noteNames.indexOf(noteLetter);
		if (rootIndex === -1 || chordIntervals.length === 0) {
			return [];
		}

		let chordNotes = chordIntervals.map(interval => this.noteNames[(rootIndex + interval) % 12]);
		chordNotes = this.#applyOctave(chordNotes, octave);

		return chordNotes;
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
