import { csvParse, autoType } from "https://cdn.jsdelivr.net/npm/d3-dsv/+esm";

const response = await fetch("./data/dataset.csv");
const dataset = csvParse(await response.text(), autoType);

/** Loads flashcard progress from local storage if available. */
function loadProgress() {
	const stored = localStorage.getItem("flashcardProgress");
	return stored ? JSON.parse(stored) : {};
}

/** Saves the current progress back to local storage. */
function saveProgress(progress) {
	localStorage.setItem("flashcardProgress", JSON.stringify(progress));
}

const progressData = loadProgress();

// Normalize CSV rows into a consistent shape that the rest of the app expects.
let cards = dataset.map((row, idx) => ({
	id: (row.id ?? row.ID ?? row.Word ?? row.word ?? String(idx + 1)).toString(),
	word: row.Word ?? row.word ?? "",
	image: row.Image ?? row.image ?? "",
	sentence: row.Sentence ?? row.sentence ?? "",
	collocation: row.Collocation ?? row.collocation ?? "",
	meaning: row.Meaning ?? row.meaning ?? "",
	completeSentence: row["Complete Sentence"] ?? row["Complete sentence"] ?? row.completeSentence ?? "",
	audio: row.Audio ?? row.audio ?? ""
}));

cards.sort((a, b) => {
	const dateA = progressData[a.id]?.dueDate ? new Date(progressData[a.id].dueDate) : Infinity;
	const dateB = progressData[b.id]?.dueDate ? new Date(progressData[b.id].dueDate) : Infinity;
	return dateA - dateB;
});

let currentIndex = 0;

/** Creates a table row for each card, allowing quick navigation. */
function initEntries() {
	// Build table rows
	for (const [index, card] of cards.entries()) {
		const row = document.createElement("tr");
		row.addEventListener("click", () => {
			currentIndex = index;
			renderCard();
		});
		const cellWord = document.createElement("td");
		cellWord.textContent = card.word;
		const cellColl = document.createElement("td");
		cellColl.textContent = card.collocation;
		const cellMean = document.createElement("td");
		cellMean.textContent = card.meaning;

		row.appendChild(cellWord);
		row.appendChild(cellColl);
		row.appendChild(cellMean);
		document.getElementById("entries-body").appendChild(row);
	}
}

/** Updates highlighted row and due dates each time we render or change data. */
function updateEntries() {
	// Update row highlight and due dates
	for (const [index, card] of cards.entries()) {
		const row = document.getElementById("entries-body").children[index];
		// Do not apply the row highlight for the "agree" entry — keep highlighting only on the card back.
		const isCurrent = index === currentIndex && String(card.word).toLowerCase() !== "agree";
		row.classList.toggle("row-highlight", isCurrent);

		// refresh collocation and meaning in case data changed or sorting updated
		if (row) {
			row.children[0].textContent = card.word;
			row.children[1].textContent = card.collocation;
			row.children[2].textContent = card.meaning;
		}
	}
}

/**
 * Mapping between abbreviated and full forms of parts of speech.
 * You can use the same technique to transform your data.
 */
const posMapping = {
	n: "noun",
	v: "verb",
	adj: "adjective",
	adv: "adverb",
	// Add more mappings as needed
};

// Compute transition half duration safely; fallback to 150ms if not available.
let transitionHalfDuration = 150;
try {
	const el = document.getElementById("card-inner");
	if (el) {
		const val = getComputedStyle(el).transitionDuration;
		const px = parseFloat(val) || 0;
		transitionHalfDuration = (px * 1000) / 2;
	}
} catch (e) {
	// ignore and use fallback
}

/** Renders the current card on both front and back. */
function renderCard() {
	const elInner = document.getElementById("card-inner");
	if (elInner) elInner.dataset.side = "front";
	const currentCard = cards[currentIndex];

	// Front
	const imgEl = document.getElementById("card-front-image");
	if (imgEl) imgEl.src = encodeURI(`./res/image/${currentCard.image}`);
	const wordEl = document.getElementById("card-front-word");
	if (wordEl) wordEl.textContent = currentCard.word;
	const sentEl = document.getElementById("card-front-sentence");
	if (sentEl) sentEl.textContent = currentCard.sentence;

	// Back (after half transition to avoid flicker)
	setTimeout(() => {
		const collEl = document.getElementById("card-back-collocation");
		if (collEl) collEl.textContent = currentCard.collocation;
		const meanEl = document.getElementById("card-back-meaning");
		if (meanEl) meanEl.textContent = currentCard.meaning;

		const audio = document.getElementById("card-back-audio");
		if (audio) {
			audio.src = encodeURI(`./res/audio/${currentCard.audio}`);
			// expose load error for debugging
			audio.onerror = () => console.warn("Audio failed to load:", audio.src);
		}

		const playBtn = document.getElementById("play-audio-btn");
		if (playBtn && audio) {
			playBtn.onclick = (e) => { e.stopPropagation(); audio.play(); };
		}

		const fullText = currentCard.completeSentence ?? "";
		const target = (currentCard.collocation ?? "").trim();
		function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
		let highlightedText = fullText;
		if (target) {
			// Special-case: ensure "agreed on" in completed sentence is highlighted
			if (target.toLowerCase() === "agree on") {
				highlightedText = fullText.replace(/\b(agreed)\s+(on)\b/gi, '<span class="marker">$1</span> <span class="marker">$2</span>');
			}
			// build a flexible regex that allows simple verb inflections on the first word (s/ed/ing)
			const parts = target.split(/\s+/).filter(Boolean);
			if (parts.length) {
				const firstRaw = parts[0].toLowerCase();
				const firstEsc = escapeRegex(parts[0]);
				const irregularVariants = {
					"run": "(?:run|ran|runs|running)",
					"be": "(?:be|am|is|are|was|were|been|being)",
					"have": "(?:have|has|had|having)",
					"do": "(?:do|does|did|doing)"
				};
				let firstVar;
				if (irregularVariants[firstRaw]) {
					firstVar = irregularVariants[firstRaw];
				} else {
					firstVar = `${firstEsc}(?:s|ed|ing)?`;
				}
				const rest = parts.slice(1).map(escapeRegex).join("\\s+");
				// Allow a small number of optional intervening words between verb and preposition
				// to handle cases like "congratulate you on" or "provide students with".
				let pattern;
				if (rest) {
					pattern = `${firstVar}(?:\\s+\\S+){0,2}?\\s+${rest}`;
				} else {
					pattern = firstVar;
				}
				if (rest) {
					// Capture verb, optional intervening words, and preposition separately
					const patternWithGroups = `\\b(${firstVar})\\b(?:\\s+((?:\\S+\\s+){0,2}?\\S+))?\\s+\\b(${rest})\\b`;
					const rxWithGroups = new RegExp(patternWithGroups, 'gi');
					highlightedText = fullText.replace(rxWithGroups, (match, g1, mid, g3) => {
						const verbSpan = `<span class="marker">${g1}</span>`;
						const prepSpan = `<span class="marker">${g3}</span>`;
						if (mid) return `${verbSpan} ${mid} ${prepSpan}`;
						return `${verbSpan} ${prepSpan}`;
					});
				} else {
					// Single-word collocation (highlight the verb form only)
					const rxSingle = new RegExp(`\\b${firstVar}\\b`, 'gi');
					highlightedText = fullText.replace(rxSingle, (m) => `<span class="marker">${m}</span>`);
				}
			}
		}
		const completeEl = document.getElementById("card-back-complete");
		if (completeEl) completeEl.innerHTML = highlightedText;
	}, transitionHalfDuration);

	updateEntries();
}

// Toggle the entries list when the hamburger button in the heading is clicked
document.getElementById("toggle-entries").addEventListener("click", () => {
	document.getElementById("entries").hidden = !document.getElementById("entries").hidden;
});

// Flip the card when the card itself is clicked
document.getElementById("card-inner").addEventListener("click", event => {
	// Prevent flipping when interacting with audio controls
	if (event.target.closest && event.target.closest(".audio-controls")) return;

	// Toggle side regardless of which inner element was clicked (handles clicks on children)
	event.currentTarget.dataset.side = event.currentTarget.dataset.side === "front" ? "back" : "front";
});

/** Navigates to the previous card. */
function previousCard() {
	currentIndex = (currentIndex - 1 + cards.length) % cards.length;
}

/** Navigates to the next card. */
function nextCard() {
	currentIndex = (currentIndex + 1) % cards.length;
}

// New simplified controls: left = review (flip), right = mastered (mark and advance)
const reviewBtn = document.getElementById("btn-review");
if (reviewBtn) reviewBtn.addEventListener("click", (e) => {
	e.stopPropagation();
 	// Go to the previous card and show its front side for review
 	previousCard();
 	const el = document.getElementById("card-inner");
 	if (el) el.dataset.side = "front";
 	renderCard();
});

const masteredBtn = document.getElementById("btn-mastered");
if (masteredBtn) masteredBtn.addEventListener("click", (e) => {
	e.stopPropagation();
	// keep previous behavior: schedule as 'easy' then go to next
	updateDueDate("easy");
	nextCard();
	renderCard();
});

/**
 * Mapping between the user's selection (Again, Good, Easy) and the number of days until the due date.
 */
const dayOffset = { again: 1, good: 3, easy: 7 };

/**
 * Records learning progress by updating the card's due date based on the user's selection (Again, Good, Easy).
 */
function updateDueDate(type) {
	const card = cards[currentIndex];
	const today = new Date();
	const dueDate = new Date(today.setDate(today.getDate() + dayOffset[type]) - today.getTimezoneOffset() * 60 * 1000);
	(progressData[card.id] ??= {}).dueDate = dueDate.toISOString().split("T")[0]; // Print the date in YYYY-MM-DD format
	saveProgress(progressData);
	updateEntries();
}

// old per-button handlers removed; replaced by circular buttons

// Initial render
initEntries();
renderCard();
