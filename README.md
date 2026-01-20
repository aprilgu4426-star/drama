# Vanilla Flashcard App Template

This is a template of a simple flashcard web application written in HTML, CSS and JavaScript without requiring external libraries or a build process (“vanilla”). It displays a series of flippable cards with customisable content and styles without the need for advanced programming. You are expected to modify and expand upon this template to suit the needs of your project.

Although this template is designed for undergraduate students of a capstone project course in the Education University of Hong Kong, it can also be used by anyone for other projects.

[Try out the template](https://pedagogist.github.io/vanilla-flashcard-app-template/) to see how it works.

## Template Versions

This template comes in two versions to accommodate different project needs:

1. **Basic Version (Current)**: A simpler version without AI functionality, focusing on core flashcard features using predefined datasets.

2. **AI-Enhanced Version**: This version includes flashcard generation features powered by generative AI. It allows users to upload multiple images from their devices and generate user-tailored flashcards based on those images using an OpenAI API key. The generated flashcards can be imported and exported along with learning progress data, providing a comprehensive AI-assisted learning experience.

You are currently viewing the **basic version**. If your project idea involves interaction with AI or you are looking for advanced pre-implemented features, please switch to the [AI-enhanced version](https://github.com/pedagogist/vanilla-flashcard-generator-app-template) instead.

## Getting Started

> [!NOTE]
> This section is intended for our undergraduate students.
> 
> If you are not new to programming, feel free to use your favourite code editor, the `serve` command, or whatever tools you feel comfortable with.

1. Make sure you are logged in to GitHub. Click “Use this template” → “Create a new repository” at the top right of this page.
2. Pick a name for your project, then click “Create repository”. You may rename it anytime later by clicking the Settings tab on your project page.
3. Launch [Visual Studio Code](https://code.visualstudio.com).
4. Click “Clone Git repository” on the Welcome page.
5. Type in your GitHub username, followed by `/` and the project name you just chose, and press <kbd>Enter</kbd>.
6. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
7. Click the “Go Live” button from the status bar at the bottom to view the app.

## How It Works

- The app loads flashcard data from a CSV file, dynamically rendering cards with content on both sides.
- Users can flip the flashcards by clicking on them and navigate using “Back” and “Skip” buttons, displaying one card at a time.
- Learning progress is tracked with “Again”, “Good” and “Easy” buttons, which determine the scheduling of flashcards, similar to Anki, and store this data locally.
- A toggle button in the upper-left corner allows users to view a table of all flashcards, providing an overview of the entire dataset.

## Your Next Steps

1. Change the dataset by adding new CSV files within the `data` folder and remove `data/example.csv`.
2. Remove all the example resources inside the `res` folder and place your resources referenced in the dataset there.
3. Update the `fetch` function at the top of `index.js` to reference your new data file.
4. Alter HTML elements in the `flashcard` section in `index.html`. Each column in the dataset should correspond to an element with an ID.
5. Modify the `renderCard` function in `index.js` accordingly to make sure all columns are populated properly.
6. Adjust the appearance of the flashcards in `index.css` by adding styling rules for each element.

> [!TIP]
> Search for “STUDENTS” in the files to quickly locate sections where modifications are recommended.

If you encounter any technical problems or have questions, don’t hesitate to reach out for help! We’re always here for advice and support. <sub>[Only applicable for students at EdUHK.]</sub>

## Customising the Dataset

Flashcard data is provided in the [`data/example.csv`](/data/example.csv) file. Each line in this file represent a flashcard object. The columns within are intended as examples, and students should modify or expand these columns to suit their specific project needs. 

Experiment with adding or removing cards and columns, and then refresh your browser to see the changes implemented.

## Designing the Card

To alter the appearance of the flashcards, adjust the CSS stylesheet. Focus on the relevant sections to customise colours, fonts, layouts, etc. For instance, to modify the design of the front side of the card, search for `.card-front` in the CSS stylesheet.

## Modifying the Code

The main functionality is driven by [index.js](/index.js), which handles reading from `example.csv` and setting up flashcard interactions. Make adjustments to how cards are displayed by altering JavaScript functions such as `renderCard`.

## Q&A

### How do I add a quiz feature or other interactive elements to this template?

The basic idea is to put the question and available options on the front side and any feedback on the back side of the flashcard, flipping to the back whenever you want to check the user’s answer and give feedback.

Let’s take multiple-choice questions as an example. Similar steps can be adapted for other question types, such as fill-in-the-blank or matching. (See the paragraph at the bottom of the page for an overview.)

#### How to Implement

1. Prevent the card from flipping when clicking on itself (since we’ll control this with answer buttons instead):

   - In `index.html`, search for `card-inner`, click on the text `button` on that line, press <kbd>F2</kbd> (or <kbd>fn</kbd> + <kbd>F2</kbd>), type `div` and press <kbd>Enter</kbd>.

     This change converts the interactive card element into a container that does not accept user interactions.

   - In `index.css`, remove the entire `.card-face:hover { … }` ruleset to get rid of the visual effect when you move the mouse over the card.

     This change makes it clear to the user that the card itself is not directly interactive and can no longer be clicked.

   - In `index.js`, delete the following lines:
     ```js
     // Flip the card when the card itself is clicked
     document.getElementById("card-inner").addEventListener("click", event => {
     	event.currentTarget.dataset.side = event.currentTarget.dataset.side === "front" ? "back" : "front";
     });
     ```

     This change removes the actual behaviour where clicking causes the card to flip.

2. Ensure that your dataset includes the necessary columns for questions and answers. For this particular example, we will use the following columns:

   - `question`
   - `option1`
   - `option2`
   - `correctAnswer`
   - `correctExplanation`
   - `incorrectExplanation`

   However, keep in mind that these columns are just examples and there is no standard for the name and number of columns. Feel free to customise by adding and renaming columns as needed for your project.

3. In `index.html`, add these elements inside `.card-front` to show the question and options:
   ```html
   <h2 id="question"></h2>
   <button id="option-1" class="option"></button>
   <button id="option-2" class="option"></button>
   ```

4. In the same file, add these elements inside `.card-back` for displaying feedback after answering:
   ```html
   <h2 id="correctness"></h2>
   <p id="explanation"></p>
   ```

5. In `index.js`, update the `renderCard` function to populate the question and options on the front side:
   ```js
   function renderCard() {
   	// Reset flashcard to the front side
   	document.getElementById("card-inner").dataset.side = "front";

   	// Display the current question and answer options
   	const currentCard = cards[currentIndex];
   	document.getElementById("correctness").textContent = currentCard.question;
   	document.getElementById("option-1").textContent = currentCard.option1;
   	document.getElementById("option-2").textContent = currentCard.option2;

   	// Update the highlighted row and due dates in the card list table
   	updateEntries();
   }
   ```

6. In the same file, add this piece of code to handle the user’s selection and display feedback on the back side when an option is clicked:
   ```js
   function checkAnswer() {
   	// Flip the flashcard to the back side
   	document.getElementById("card-inner").dataset.side = "back";

   	// Compare the selected answer with the correct one and show appropriate feedback
   	const currentCard = cards[currentIndex];
   	const selection = this.textContent;
   	if (selection == currentCard.correctAnswer) {
   		document.getElementById("correctness").textContent = "Correct!";
   		document.getElementById("explanation").textContent = "You’ve got this! " + currentCard.correctExplanation;
   	} else {
   		document.getElementById("correctness").textContent = "Incorrect!";
   		document.getElementById("explanation").textContent = "Not quite! " + currentCard.incorrectExplanation;
   	}
   }

   // Trigger the function when the option buttons are clicked
   document.getElementById("option-1").addEventListener("click", checkAnswer);
   document.getElementById("option-2").addEventListener("click", checkAnswer);
   ```

7. In `index.css`, add styles for the new elements introduced in steps 3 and 4 to ensure proper layout and appearance. You may structure your new styles as follows:
   ```css
   #question {
   	/* Style for the question text on the front side */
   }

   .option {
   	/* Style for the option buttons on the front side */
   }

   .option:hover {
   	/* Style when you move the mouse over the option buttons */
   }

   #correctness {
   	/* Style for the result text on the back side */
   }

   #explanation {
   	/* Style for the explanation text on the back side */
   }
   ```

If you prefer not to check the answer immediately, or for other question types like fill-in-the-blank or matching, you can use different `<input>` elements like text boxes, checkboxes and radio buttons. In this case, you’ll only need a single “Submit” button rather than making each option clickable. In the `checkAnswer` function, you can retrieve the user’s input or selection using the `.value` property from any `<input>` elements and compare it with the correct answer.

This should give you a clear starting point for customising the template to include additional user interactions.
