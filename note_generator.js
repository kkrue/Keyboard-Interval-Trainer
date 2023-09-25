export class NoteGenerator {
	constructor(noteTools) {
		this.noteTools = noteTools;
		this.lastNote = "";
		this.lastInterval = [];
	}

	getRandomNote(startNoteNum, endNoteNum) {
		const noteNumbers = this.noteTools.getNotesByNumber();
		let noteNum, noteName;
		let maxTries = 10;

		const controlData = this.noteTools.getControlData();

		while (true && maxTries-- > 0) {
			noteNum = parseInt(this.#getRandomNumber(startNoteNum, endNoteNum));
			noteName = noteNumbers.get(noteNum);

			if (this.lastNote != noteName) {
				break;
			}
		}

		this.lastNote = noteName;

		const oNote = this.noteTools.createNoteObject(noteName);
		this.noteTools.getNoteForKeySignature(controlData.keySignature, oNote);

		return oNote;
	}

	/**
	 * Get a randomly determined interval of notes.
	 *
	 * @param {number} numNotesInInterval - The number of notes the interval will have
	 * @param {number} startRange - The minimum of the range
	 * @param {number} endRange - The maximum of the range
	 * @param {number} minSpread - The minimum distance in half steps (semitones) between notes (e.g., 2 is the distance between C and D).
	 * @param {number} maxSpread - The maxnimum distance in half steps (semitones) between notes.
	 *
	 * @returns {array} - An array of numNotesInInterval length containing note names.
	 */
	getRandomNoteInterval(numNotesInInterval, startRange, endRange, minSpread, maxSpread) {
		const noteNumbers = this.noteTools.getNotesByNumber();
		const noteIntervals = this.#getNoteIntervals(numNotesInInterval, minSpread, maxSpread);
		const range = maxSpread * numNotesInInterval;
		let interval = [];
		let maxTries = 10;

		while (true && maxTries-- > 0) {
			// Get the maximum spot where an interval may start.  The size of all the notes minus the size of the
			// interval minus 4 in case there are half steps that bump up the range. -1 as the array is 0 based.
			const maxStart = noteNumbers.size - range - numNotesInInterval - 1;
			const startNoteNum = parseInt(this.#getRandomNumber(startRange, Math.min(maxStart, endRange)));

			interval = this.#getNotes(noteIntervals, noteNumbers, startNoteNum);
			let areEqual = this.noteTools.areNotesEqual(interval, this.lastInterval);

			if (!areEqual) {
				break;
			}
		}

		this.lastInterval = interval;

		return interval;
	}

	#getRandomNumber(min, max) {
		let result;

		if (min == max || min > max) {
			result = min;
		}
		else {
			result = Math.floor(Math.random() * (max - min + 1) + min);
		}

		return result;
	}

	#getNotes(noteIntervals, noteNumbers, startNoteNum) {
		const notes = [];
		const noteNames = [];

		for (let i = 0; i < noteIntervals.length; i++) {
			if (i == 0) {
				// The first note has a random start.
				notes[0] = startNoteNum;
			}
			else {
				notes[i] = notes[i - 1] + noteIntervals[i];
			}

			noteNames[i] = noteNumbers.get(notes[i]);
		}

		return noteNames;
	}

	// Get the intervals between the notes
	#getNoteIntervals(numNotesInInterval, minSpread, maxSpread) {
		const noteIntervals = [];
		noteIntervals[0] = 0;

		for (let i = 1; i < numNotesInInterval; i++) {
			let rand = this.#getRandomNumber(minSpread, maxSpread);
			noteIntervals[i] = rand;
		}

		return noteIntervals;
	}
}