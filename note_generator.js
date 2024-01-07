export class NoteGenerator {
	constructor(noteTools) {
		this.noteTools = noteTools;
		this.lastNote = "";
		this.lastInterval = [];

		this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

		this.diatonicNotesMap = new Map([
			['0#', ['C', 'D', 'E', 'F', 'G', 'A', 'B']],
			['1#', ['G', 'A', 'B', 'C', 'D', 'E', 'F#']],
			['2#', ['D', 'E', 'F#', 'G', 'A', 'B', 'C#']],
			['3#', ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#']],
			['4#', ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#']],
			['5#', ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#']],
			['6#', ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#']],
			['7#', ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#']],
			['1f', ['F', 'G', 'A', 'A#', 'C', 'D', 'E']],
			['2f', ['A#', 'C', 'D', 'D#', 'F', 'G', 'A']],
			['3f', ['D#', 'F', 'G', 'G#', 'A#', 'C', 'D']],
			['4f', ['G#', 'A#', 'C', 'C#', 'D#', 'F', 'G']]
		]);
	}

	getNoteNames() {
		return this.noteNames;
	}

	getKeyboardNotes(includeSharps) {
		let keyboardNotes = this.#generateKeyboardNotes(includeSharps);

		if (includeSharps) {
			return keyboardNotes;
		}
		else {
			return keyboardNotes.filter(note => {return !note.includes("#")});
		}
	}

	// This should replace methods of generating notes in note_tools.
	#generateKeyboardNotes(includeSharps = false) {
		const octaveRange = 8;
		let notes;

		if (includeSharps) {
			notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
		}
		else {
			notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
		}

		const keyboardNotes = [];

		for (let octave = 1; octave <= octaveRange; octave++) {
			for (const note of notes) {
				keyboardNotes.push(`${note}${octave}`);
			}
		}

		return keyboardNotes;
	}

	getRandomNote(startNoteNum, endNoteNum) {
		let midiNote = "";
		let keyType = this.noteTools.getKeySignatureType();
		const controlData = this.noteTools.getControlData();

		let startNote = this.noteTools.getNotesByNumber(startNoteNum);
		let endNote = this.noteTools.getNotesByNumber(endNoteNum);

		startNote = this.noteTools.getNoteForKeySignature(controlData.keySignature, this.noteTools.createNoteObject(startNote));
		endNote = this.noteTools.getNoteForKeySignature(controlData.keySignature, this.noteTools.createNoteObject(endNote));

		for (let i = 0; i < 10; i++) {
			midiNote = this.#getRandomNote(startNote, endNote);

			if (midiNote != this.lastNote) {
				break;
			}
		}

		this.lastNote = midiNote;
		let oNote = this.noteTools.createNoteObject(midiNote);

		if (keyType == "flat") {
			oNote = this.noteTools.getFlatVersionOfSharp(this.noteTools.createNoteObject(oNote));
		}

		return oNote;
	}

	#getRandomNote(oStartNote, oEndNote) {
		let filteredNotes;

		const startNote = oStartNote.midiNote;
		const endNote = oEndNote.midiNote;

		const controlData = this.noteTools.getControlData();
		const keyboardNotes = this.#generateKeyboardNotes(controlData.chkAllowAccidentals == "on");

		const startNoteNumber = keyboardNotes.indexOf(startNote);
		const endNoteNumber = keyboardNotes.indexOf(endNote);
		const notesInRange = keyboardNotes.slice(startNoteNumber, endNoteNumber + 1);

		const allowedNotes = this.getAllowedNotes();

		if (allowedNotes.length == 0) {
			filteredNotes = notesInRange;
		}
		else {
			filteredNotes = notesInRange.filter(note => {
				let noteNoOctave = note.slice(0, -1);

				if (allowedNotes.includes(noteNoOctave)) {
					return note;
				}
			});
		}

		if (filteredNotes.length === 0) {
			console.error('No valid notes in the specified range and allowed notes.');
			return null;
		}

		const randomIndex = this.noteTools.getRandomNumber(0, filteredNotes.length - 1);
		const randomNote = filteredNotes[randomIndex];

		return randomNote;
	}

	getAllowedNotes() {
		let allowedNotes = [];
		const controlData = this.noteTools.getControlData();

		if (controlData.noteGroups == "chords") {
			allowedNotes = $("[name ^= 'chordLetter']:checked").map(function() {
				return this.value;
			}).get();
		}
		else if (controlData.chkRestrictDiatonic != null) {
			allowedNotes = this.diatonicNotesMap.get(controlData.keySignature);
		}

		return allowedNotes;
	}

	// Get a randomly determined interval of notes.
	getRandomNoteInterval(numNotesInInterval, startRange, endRange, minSpread, maxSpread) {
		const noteIntervals = this.#getNoteIntervals(numNotesInInterval, minSpread, maxSpread);
		let interval = [];
		let concatenatedNotes;

		for (let i = 0; i < 10; i++) {
			const maxEnd = endRange - maxSpread - 1;
			const startNoteNum = this.noteTools.getRandomNumber(startRange, maxEnd);

			interval = this.#getNotes(noteIntervals, startNoteNum);

			concatenatedNotes = interval.map(obj => obj.noteWithOctave).join(',');
			if (this.lastInterval.length == 0 || concatenatedNotes != this.lastInterval) {
				break;
			}
		}

		this.lastInterval = concatenatedNotes;

		return interval;
	}

	#getNotes(noteIntervals, startNoteNum) {
		const notes = [];
		const oNotes = [];

		const controlData = this.noteTools.getControlData();
		const restrictDiatonic = controlData.chkRestrictDiatonic == "on";

		for (let i = 0; i < noteIntervals.length; i++) {
			if (i == 0) {
				notes[0] = startNoteNum;
			}
			else {
				notes[i] = notes[i - 1] + noteIntervals[i];
			}

			let oNote;
			let noteName = this.noteTools.getNotesByNumber(notes[i], true);

			if (restrictDiatonic) {
				oNote = this.#changeToDiatonic(noteName, controlData.keySignature);
			}
			else {
				oNote = this.noteTools.createNoteObject(noteName);
			}

			if (this.noteTools.getKeySignatureType() == "flat") {
				oNote = this.noteTools.getFlatVersionOfSharp(oNote);
			}

			oNotes[i] = oNote;
		}

		return oNotes;
	}

	// Passing in a non-diatonic note changes it to the diatonic form.  In the key of C, F# is F.
	// This is only useful for fixing randomly generated notes.
	#changeToDiatonic(note, keySig) {
		let oNote = this.noteTools.createNoteObject(note);
		const diatonicNotes = this.diatonicNotesMap.get(keySig);

		if (!diatonicNotes.includes(oNote.note)) {
			if (oNote.accidental == "") {
				let letter = oNote.letter;

				if (oNote.letter == "B") {
					if (keySig.indexOf("s") != -1) {
						letter = "C";
					}
					else {
						letter = "A"; // Create A#, which is later converted to Bb.
					}
				}
				else if (oNote.letter == "E") {
					if (keySig.indexOf("#") != -1) {
						letter = "F";
					}
					else {
						letter = "D";
					}
				}

				oNote = this.noteTools.createNoteObject(letter + "#" + oNote.octave);
			}
			else {
				oNote = this.noteTools.createNoteObject(oNote.letter + oNote.octave);
			}
		}

		return oNote;
	}

	// Get the intervals between the notes
	#getNoteIntervals(numNotesInInterval, minSpread, maxSpread) {
		const noteIntervals = [];
		noteIntervals[0] = 0;

		for (let i = 1; i < numNotesInInterval; i++) {
			let rand = this.noteTools.getRandomNumber(minSpread, maxSpread);
			noteIntervals[i] = rand;
		}

		return noteIntervals;
	}
}