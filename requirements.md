# MTD Decklist Search

Implement this project in VUA JS, in the given already prepared project.

Style the UI nicely with CSS. Use a Modern UI Style, avoid a lot of elevation effects. 

## Start Page (Home.vue)

User can Past Moxfield URL or Deck ID from Moxfield.
Then route to Deck.vue with that ID.

## Deck (Deck.vue)

- Loads Deck List from Moxfield API. use the npm package "moxfield-api"
- Loads Card Details from Scryfall public API
- Boards to support:
  - Commanders & Mainboard (open/visible by default)
  - Sideboard & Consider (collapsible / closed by default)
- This view has two Tabs
- User can Filter the Cards in all Tabs to show them
  - All Cards from the deck
  - Only cards they checked as "Owned"
  - Only cards that are not checked as "Owned"
- A User can check a card as "Owned"
  - If a card is owned, it should be visually marked in the UI as so
  - The information which cards are Owned should be stored in the local storage of the browser
  - if possible the Owned Mark should not depend on the exact printing of the card, so it should be able to detect if it is the same card just in another printing. In MTG you can pretty much trust the card name for this

### Deck List Tab

Displays all Cards in a Grid, with their:
- Card Image (in English)
- Card Name
- Price if available from Scryfall (Display EUR, and USD alongside if available)

### Search Helper Tab

Here the goal is to give an Overview from which MTG Sets the Cards from this Deck come from.
A card can come from Multiple Sets. The possible Sets are available via the Scryfall API.

Display the Information like this:
- A List of all MTG Sets that contain at least one Card of this Deck
- Sorted by the number of matching cards in the deck (highest first)
- You can open a Set List in some way, there you see all Cards that are in that set

# Moxfield API Package

Usage Example from the official documentation

```javascript
import MoxfieldApi from 'moxfield-api';

const moxfield = new MoxfieldApi();

const decklist = await moxfield.decklist.findById('https://moxfield.com/decks/oEWXWHM5eEGMmopExLWRCA'); // OR oEWXWHM5eEGMmopExLWRCA
```