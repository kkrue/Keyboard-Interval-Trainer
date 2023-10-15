export class Game {
	constructor(noteTools, noteGenerator, chordCreator) {
		this.noteTools = noteTools;
		this.noteGenerator = noteGenerator;
		this.chordCreator = chordCreator;

		this.lastInterval = [];
		this.numTests;
		this.testNum = 0;
		this.mode = 'accept_input';
		this.currentInterval = [];
		this.totalCorrect = 0;
		this.totalWrong = 0;
		this.intervalsMode = false;
		this.startTime;

		this.judgeInput = this.judgeInput.bind(this);
		this.showNext = this.showNext.bind(this);
		this.showResults = this.#showResults.bind(this);
		this.gameInProgress = false;
	}

	isGameInProgress() {
		return this.gameInProgress;
	}

	startTimer() {
		$("#messageDisplay").css("visibility", "hidden");

		this.noteTools.turnNotesOff("userNote");
		this.noteTools.turnNotesOff("musicNote");

		this.testNum = 0;

		this.stats = {
			totalResponseTime: 0,
			avgResponseTime: 0
		}

		this.countdownTimer = window.setTimeout(() => {
			this.gameInProgress = true;
			this.showNext();
		}, 2000);
	}

	showNext() {
		const _this = this;
		const controlData = this.noteTools.getControlData();
		this.numTests = controlData.numNoteTests;
		let chord;

		this.#clear();
		this.testNum++;

		if (this.numTests != 0 && this.testNum != 0 && this.testNum > this.numTests) {
			this.#gameOver();

			return;
		}

		const startRange = parseInt(controlData.startRange);
		const endRange = parseInt(controlData.endRange);

		if (controlData.noteGroups == "individual") {
			this.currentInterval = [];
			this.currentInterval[0] = this.noteGenerator.getRandomNote(startRange, endRange);
		}
		else if (controlData.noteGroups == "chords") {
			let rootNote = this.noteGenerator.getRandomNote(startRange, endRange);
			chord = this.chordCreator.getRandomChord(rootNote, parseInt(controlData.chordInversions));
			chord = this.noteTools.createMidiNotesFromObjects(chord);

			this.currentInterval = chord;
		}
		else {
			this.currentInterval = this.noteGenerator.getRandomNoteInterval(
				parseInt(controlData.notesInInterval),
				startRange,
				endRange,
				parseInt(controlData.minInterval),
				parseInt(controlData.maxInterval)
			);
		}

		debugger
		this.noteTools.showNotes(this.currentInterval, "musicNote");
		this.#displayNoteText(this.currentInterval);

		this.startTime = performance.now();
	}

	#displayNoteText() {
		let noteDisplay = "";

		if (this.currentInterval != undefined && this.chordCreator.getChordLabel() !== "") {
			noteDisplay = this.chordCreator.getChordLabel();
		}
		else {
			for (let item of this.currentInterval.reverse()) {
				if (item instanceof Object) {
					item = item.midiNote;
				}
				noteDisplay += item + "<br>";
			}
		}

		$("#noteDisplay").html(noteDisplay);
	}

	#showResults(isCorrect) {
		if (isCorrect) {
			$("#scoreCorrectNumber").text(++this.totalCorrect);
		}
		else {
			$("#scoreWrongNumber").text(++this.totalWrong);
		}

		$("#scoreTotalNumber").text(this.totalCorrect + this.totalWrong);
	}

	#clear() {
		this.noteTools.clearLedgerLines();
		this.noteTools.turnNotesOff("userNote");
		this.noteTools.turnNotesOff("musicNote");
	}

	reset() {
		this.startTimer();
		this.totalCorrect = 0;
		this.totalWrong = 0;

		$("#scoreCorrectNumber").text("0");
		$("#scoreWrongNumber").text("0");
		$("#scoreTotalNumber").text("0");
		$("#speed").text("0");
		$("#avgSpeed").text("0");
		$("#finalScore").text("0");
		$("#noteDisplay").html("&nbsp;");

		if (!$("#chkShowNotes").is(":checked")) {
			$("#noteDisplay").hide();
		}

		this.noteTools.clearLedgerLines();

		if (this.countdownTimer != null) {
			clearTimeout(this.countdownTimer);
		}
	}

	judgeInput(playedNotes) {
		const controlData = this.noteTools.getControlData();
		const adjustedInterval = this.noteTools.adjustIntervalForKeySignature(controlData.keySignature, this.currentInterval);
		const isEqual = this.noteTools.areNotesEqual(adjustedInterval, playedNotes);

		if (isEqual) {
			this.noteTools.showNotes(playedNotes, "userNote", "green", controlData.keySignature);
			this.#showResults(true);
			this.#showStats();

			window.setTimeout(() => {
				this.showNext();
			}, 500); // The pause between notes
		}
		else {
			$("#speed").text("");
			this.noteTools.showNotes(playedNotes, "userNote", "red", controlData.keySignature);
			this.#showResults(false);
		}
	}

	#showStats() {
		const endTime = performance.now();
		const seconds = ((endTime - this.startTime) / 1000);

		if (seconds < 10) {
			this.stats.totalResponseTime += seconds;
			$("#speed").text(seconds.toFixed(2));

			if (this.totalCorrect > 0) {
				this.stats.avgResponseTime = this.stats.totalResponseTime / this.totalCorrect;
				$("#avgSpeed").text(this.stats.avgResponseTime.toFixed(2));
			}
		}
		else {
			$("#speed").text("");
		}
	}

	#gameOver() {
		this.gameInProgress = false;

		const gameOverMessage = $("#gameOverMessage");
		const musicContainer = $("#musicContainer");

		musicContainer.css("opacity", "0.2");
		gameOverMessage.show();
		gameOverMessage.css("font-size", "20px");

		setTimeout(() => {
			gameOverMessage.css("transform", "scale(2.5)");
			this.#scoreTheResults(this.stats.avgResponseTime, this.totalWrong, this.totalCorrect);
		}, 10);

		window.setTimeout(() => {
			gameOverMessage.css("transform", "none");
			gameOverMessage.hide();
			musicContainer.css("opacity", "1");
			$("#messageDisplay").css("visibility", "visible");
		}, 2500);
	}

	#scoreTheResults(averageTime, numWrongNotes, numCorrectNotes) {
		const maxTimeLimit = 5;
		const correctRatio = numCorrectNotes > 0 ? 1 - (numWrongNotes / (numCorrectNotes + numWrongNotes)) : 0;

		const baseScore = maxTimeLimit - averageTime;
		let finalScore = (baseScore * 100) * correctRatio;

		finalScore = finalScore < 0 ? 0 : finalScore;

		$("#finalScore").text(parseInt(finalScore));
	  }
}
