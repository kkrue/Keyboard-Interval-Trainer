import { ChordCreator } from './chord.js';

// Functions dealing with key signatures will be migrated here eventually.
export class KeySignature {
	constructor(noteTools) {
		this.chord = new ChordCreator(this.noteTools);
		this.noteTools = noteTools;
	}
}
