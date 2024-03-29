import { ChordCreator } from './chord.js';
import { Game } from './game.js';
import { Keyboard } from './keyboard.js';
import { NoteTools } from './note_tools.js';
import { NoteGenerator } from './note_generator.js';

export class Setup {
	constructor() {
		this.noteTools = new NoteTools();
		this.noteGenerator = new NoteGenerator(this.noteTools);
		this.chord = new ChordCreator(this.noteTools, this.noteGenerator);
		this.keyboard = new Keyboard(this.noteTools);
		this.game = new Game(this.noteTools, this.noteGenerator, this.chord);

		this.onEnabled = this.onEnabled.bind(this);

		let savedFormData = localStorage.getItem('formData');

		if (savedFormData != null) {
			this.formData = JSON.parse(savedFormData);
		}
	}

	// Keyboard input begins here.
	onEnabled() {
		if (WebMidi.inputs.length >= 1) {
			WebMidi.inputs.forEach((device, index) => {

			});
		}

		const mySynth = WebMidi.inputs[0];

		mySynth.channels[1].addListener("noteon", e => {
			if (!this.game.isGameInProgress()) {
				if (e.note.identifier == "C4") {
					const scoreCorrect = document.getElementById("scoreCorrect");
					scoreCorrect.click();
				}

				return;
			}

			// Input is buffered so that it will accumulate notes.  Two notes within a short timepan
			// are combined and considered as multiple keys held together.
			this.keyboard.bufferInput(e.note.identifier, this.game.judgeInput);
		});
	}

	load() {
		let clef;

		$("#messageDisplay").css("visibility", "visible");

		if (this.formData == null || this.formData.bassClef == null) {
			clef = "treble"
		}
		else if (this.formData.bassClef.val == "bass") {
			clef = "bass"
		}
		else {
			clef = "treble"
		}
		this.noteTools.reset();
		this.noteTools.loadNotePositionsOnStaff(clef);

		this.fillRangeSelects(clef);
		this.loadFormData();
		this.restoreScreenState();
		this.setUpEvents();
		this.setFormData();
	}

	fillRangeSelects(clef) {
		const notes = this.noteTools.getAllMidiNotes(clef, true);

		$('#startRange').empty();
		$('#endRange').empty();

		for (let notePositionPair of notes) {
			$('#startRange').append( $('<option></option>').val(notePositionPair[0]).html(notePositionPair[1]) );
			$('#endRange').append( $('<option></option>').val(notePositionPair[0]).html(notePositionPair[1]) );

			const end = document.querySelector("#endRange");
			end.selectedIndex = end.options.length - 1;
		}

		$('#startRange').val('2');
		$('#endRange').val('9');
	}

	saveFormData() {
		const formData = {};
		$('#frmControls :input, #frmControls fieldset, #frmControls select').each(function() {
			let control = {};

			const fieldId = this.id;
			if ($(this).is(':checkbox')) {
				formData[fieldId] = $(this).prop('checked');
				control.val = $(this).prop('checked');
			}
			else if ($(this).is(':radio')) {
				if ($(this).prop('checked')) {
					control.val = $(this).val();
				}
			}
			else {
				control.val = $(this).val();
			}

			control.type = $(this).prop('type');
			control.name = $(this).prop('name');
			control.disabled = $(this).prop('disabled');

			formData[fieldId] = control;
		});

		this.formData = formData;
		localStorage.setItem('formData', JSON.stringify(formData));
	}

	loadFormData() {
		const formData = this.formData;

		if (formData != null) {
			$('#frmControls :input, #frmControls fieldset, #frmControls select').each(function() {
				const fieldId = this.id;
				if (fieldId != "") {
					let control = formData[fieldId];

					if (control != null) {
						$(this).prop('disabled', control.disabled);

						if (formData[fieldId] != null && !$(this).is("fieldset")) {
							if ($(this).is(':checkbox')) {
								$(this).prop('checked', control.val);
							}
							else if ($(this).is(':radio')) {
								if ($(this).val() === control.val) {
									$(this).prop('checked', true);
								}
							}
							else {
								$(this).val(control.val);
							}
						}
					}
				}
			});

			if ($("#chords").is(":checked")) {
				$('#chordsGroup').show();
				$('#intervalsGroup').hide();
			}
			else if ($("#intervalNotes").is(":checked")) {
				$('#chordsGroup').hide();
				$('#intervalsGroup').show();
			}
			else {
				$('#chordsGroup').hide();
				$('#intervalsGroup').hide();
			}
		}
	}

	setUpEvents() {
		const _this = this;

		//Enable WebMidi.js and trigger the onEnabled() function when ready
		WebMidi
			.enable()
			.then(this.onEnabled)
			.catch(err => {
				console.error(err);
				console.log("No Keyboard detected.  Are you connecting with http:// instead of https:// ?");

				Swal.fire({
					icon: 'error',
					title: 'No Keyboard detected',
					text: 'Are you using http:// instead of https:// ?',
					footer: ''
				  });
			});

		$("#scoreCorrect, #scoreWrong, #scoreTotal").click(() => {
			_this.setFormData();
			_this.game.reset();

			if (_this.isGameReady()) {
				_this.game.startTimer();
			}
		});

		$("#notesInInterval").change(() => {
			_this.setFormData();
		});

		$("#minInterval").change(() => {
			_this.setFormData();
		});

		$("#maxInterval").change(() => {
			_this.setFormData();
		});

		$("#maxInterval").change(() => {
			_this.setFormData();
		});

		$("#trebleClef").click(() => {
			$("#clef").text("G"); // treble symbol
			_this.setFormData();
			_this.fillRangeSelects("treble");
			_this.game.reset();
		});

		$("#bassClef").click(() => {
			$("#clef").text("?"); // bass symbol
			_this.setFormData();
			_this.fillRangeSelects("bass");
			_this.game.reset();
		});

		$("#keySignature").change(event => {
			_this.setFormData();
			_this.game.reset();
			const value = event.delegateTarget[event.delegateTarget.selectedIndex].value;
			_this.noteTools.showKeySignature(value);

			let keyType = _this.noteTools.getKeySignatureType($("#keySignature").val());
			$("[id^=chordType]").each(function() {
				let keyTypeOfCheckedChord = _this.chord.getChordKeyType($(this).val());

				if (keyType != keyTypeOfCheckedChord) {
					$(this).prop('checked', false); // New key type, so reset all chords
				}
			});
		});

		$("#chkShowNotes").change(event => {
			if ($("#chkShowNotes").is(":checked")) {
				$("#noteDisplay").show();
			}
			else {
				$("#noteDisplay").hide();
			}
		});

		$('input[type=radio][name=noteGroups]').click( (event) => {
			const selection = event.target.value;

			if (selection === "chords") {
				$('#chordsGroup').show();
				$('#intervalsGroup').hide();
				$('#chordsGroup').prop('disabled', false);
				$('#intervalsGroup').prop('disabled', true);
				$("#keySignature").val("0#");
				$('#keySignature').trigger('change');
			}
			else if (selection === "interval") {
				this.chord.clearChordLabel();

				$('#chordsGroup').hide();
				$('#intervalsGroup').show();
				$('#intervalsGroup').prop('disabled', false);
				$('#chordsGroup').prop('disabled', true);
				$('#keySignature').prop('disabled', false);
			}
			else {
				this.chord.clearChordLabel();

				$('#chordsGroup').hide();
				$('#intervalsGroup').hide();
				$('#chordsGroup').prop('disabled', true);
				$('#intervalsGroup').prop('disabled', true);
				$('#keySignature').prop('disabled', false);
			}

			_this.setFormData();
		});

		$("#chkRestrictDiatonic").on("click", () => {
			if ($("#chkRestrictDiatonic").is(":checked")) {
				$("#chkAllowAccidentals").prop('checked', true);
			}
		});

		$("#startRange, #endRange").on("change", () => {
			_this.setFormData();
		});

		$("#numNoteTests").on("change", () => {
			_this.setFormData();
			_this.game.reset();
		});

		$('[id^="chordLetter"]').change(function () {
			// Check if at least one checkbox is checked
			if ($('[id^="chordLetter"]:checked').length == 0) {
				alert('At least one checkbox must be checked!');
				$(this).prop('checked', true);
			}
		});

		const chordCheckboxes = $('input[id^="chordType"]');

		chordCheckboxes.on('change', function() {
			const selectedChord = $(this);
			const selectedChordType = _this.chord.getChordKeyType(selectedChord.val());
			const selectedKeyType = _this.noteTools.getKeySignatureType();

			if (selectedChordType != selectedKeyType && selectedChord.is(':checked')) {
				selectedChord.prop('checked', false);
			}
		});

		$('#frmControls :input').on('change', function() {
			_this.saveFormData();
		});
	}

	isGameReady() {
		if ($("#chords").is(":checked") && $("[id^=chordType]:checked").length == 0) {
			$("#messageDisplay").html("You must choose a chord type.");
			$("#messageDisplay").css("visibility", "visible");
			return false;
		}

		return true;
	}

	changeGroupState(fieldsetID, onOff) {
		var fieldset = $('#' + fieldsetID);
		if (onOff === 'on') {
			if (!fieldset.hasClass('uncollapsed')) {
				fieldset.removeClass('uncollapsed').addClass('collapsed');
			}
		} else if (onOff === 'off') {
			if (fieldset.hasClass('uncollapsed')) {
				fieldset.removeClass('uncollapsed').addClass('collapsed');
			}
		} else {
			console.error("Invalid parameter provided for 'onOff'. Please use 'on' or 'off'.");
		}
	}

	restoreScreenState() {
		if ($('#chkShowNotes').prop('checked')) {
			$("#noteDisplay").show();
		}
		else {
			$("#noteDisplay").hide();
		}

		if ($("#trebleClef").is(":checked")) {
			$("#clef").text("G");
		}
		else {
			$("#clef").text("?");
		}

		if ($("#keySignature").val() == null) {
			$("#keySignature").val("0#");
		}

		this.noteTools.showKeySignature($("#keySignature").val());
	}

	setFormData() {
		const data = this.convertFormToJSON(document.frmControls);

		if ($("#keySignature").is(':disabled')) {
			data.keySignature = "0#";
		}

		this.noteTools.setControlData(data);

		return data;
	}

	convertFormToJSON(form) {
		return $(form)
			.serializeArray()
			.reduce(function (json, { name, value }) {
				json[name] = value;
				return json;
			}, {}
		);
	}
}
