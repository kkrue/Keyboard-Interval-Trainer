export class Keyboard {
	constructor(noteTools) {
		this.notes = [];
		this.noteTools = noteTools;
	}

	bufferInput(note, callback) {
		this.notes.push(note);

		// Start the timer on the first note.
		if (this.notes.length == 1) {
			this.#noteCollector(callback);
		}
	}

	// The noteCollector groups notes so that if a chord is played, it's treated as a set.
	#noteCollector(callback) {
		const _this = this;

		setTimeout( () => {
			let notes = [...this.notes];
			_this.notes = [];

			_this.noteTools.turnNotesOff("userNote");
			callback(notes);
		}, 100);
	}
}
