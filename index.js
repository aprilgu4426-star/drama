import { csvParse, autoType } from "https://cdn.jsdelivr.net/npm/d3-dsv/+esm";

const response = await fetch("./data/example.csv");
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

// Sorts the flashcards by their due date to prioritise learning.
const progressData = loadProgress();
const cards = dataset
	.sort((a, b) => {
		// Put cards without a dueDate at the last
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
		const cellId = document.createElement("td");
		cellId.textContent = card.id;
		const cellWord = document.createElement("td");
		cellWord.textContent = card.word;
		const cellDue = document.createElement("td");
		cellDue.textContent = progressData[card.id]?.dueDate ?? "Unseen"; // If the card has not been learnt before, mark it as "Unseen"

		row.appendChild(cellId);
		row.appendChild(cellWord);
		row.appendChild(cellDue);
		document.getElementById("entries-body").appendChild(row);
	}
}

/** Updates highlighted row and due dates each time we render or change data. */
function updateEntries() {
	// Update row highlight and due dates
	for (const [index, card] of cards.entries()) {
		const row = document.getElementById("entries-body").children[index];
		row.classList.toggle("row-highlight", index === currentIndex);

		const cellDue = row.children[row.childElementCount - 1];
		const dueDateString = progressData[card.id]?.dueDate;
		if (dueDateString) {
			cellDue.textContent = dueDateString;
			// If the due date is earlier than today, mark it as overdue
			const dueDate = new Date(dueDateString);
			const today = new Date();
			cellDue.classList.toggle("overdue-date", dueDate.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0));
		} else {
			cellDue.textContent = "Unseen";
			cellDue.classList.remove("overdue-date");
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

const transitionHalfDuration = parseFloat(getComputedStyle(document.getElementById("card-inner")).transitionDuration) * 1000 / 2;

/** Renders the current card on both front and back. */
function renderCard() {
	// STUDENTS: Start of recommended modifications
	// If there are more columns in the dataset (e.g., synonyms, example sentences),
	// display them here (e.g., document.getElementById("card-synonym").textContent = currentCard.synonym).

	// Reset flashcard to the front side
	document.getElementById("card-inner").dataset.side = "front";

	// Update the front side with the current card's word
	const currentCard = cards[currentIndex];
	document.getElementById("card-front-word").textContent = currentCard.word;

	// Wait for the back side to become invisible before updating the content on the back side
	setTimeout(() => {
		document.getElementById("card-back-pos").textContent = posMapping[currentCard.pos] ?? currentCard.pos;
		document.getElementById("card-back-definition").textContent = currentCard.definition;
		document.getElementById("card-back-image").src = currentCard.image;
		document.getElementById("card-back-audio").src = currentCard.audio;
		document.getElementById("card-back-video").src = currentCard.video;
	}, transitionHalfDuration);
	// STUDENTS: End of recommended modifications

	updateEntries();
}

// Toggle the entries list when the hamburger button in the heading is clicked
document.getElementById("toggle-entries").addEventListener("click", () => {
	document.getElementById("entries").hidden = !document.getElementById("entries").hidden;
});

// Flip the card when the card itself is clicked
document.getElementById("card-inner").addEventListener("click", event => {
	// Only flip the card when clicking on the underlying card faces, not any elements inside.
	// This line is unnecessary for other buttons.
	if (!event.target?.classList?.contains("card-face")) return;

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

document.getElementById("btn-back").addEventListener("click", () => {
	previousCard();
	renderCard();
});
document.getElementById("btn-skip").addEventListener("click", () => {
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

document.getElementById("btn-again").addEventListener("click", () => {
	updateDueDate("again");
	nextCard();
	renderCard();
});
document.getElementById("btn-good").addEventListener("click", () => {
	updateDueDate("good");
	nextCard();
	renderCard();
});
document.getElementById("btn-easy").addEventListener("click", () => {
	updateDueDate("easy");
	nextCard();
	renderCard();
});

// Initial render
initEntries();
renderCard();
