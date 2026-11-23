import { Hono } from "hono";
import type { AppEnv } from "../../../../types";
import { createBook } from "../create-book";
import { createCharacter } from "../create-character";
import { createCharacterRelation } from "../create-character-relation";
import { createEvent } from "../create-event";
import { createWord } from "../create-word";
import { createWork } from "../create-work";
import { deleteBook } from "../delete-book";
import { deleteCharacter } from "../delete-character";
import { deleteCharacterRelation } from "../delete-character-relation";
import { deleteEvent } from "../delete-event";
import { deleteWord } from "../delete-word";
import { deleteWork } from "../delete-work";
import { getBook } from "../get-book";
import { getCharacter } from "../get-character";
import { getEvent } from "../get-event";
import { getListBook } from "../get-list-book";
import { getListDeletedBook } from "../get-list-deleted-book";
import { getListCharacter } from "../get-list-character";
import { getListCharacterRelation } from "../get-list-character-relation";
import { getListEvent } from "../get-list-event";
import { getListWord } from "../get-list-word";
import { getWork } from "../get-work";
import { restoreBook } from "../restore-book";
import { restoreCharacter } from "../restore-character";
import { restoreCharacterRelation } from "../restore-character-relation";
import { restoreEvent } from "../restore-event";
import { restoreWord } from "../restore-word";
import { restoreWork } from "../restore-work";
import { updateBook } from "../update-book";
import { updateCharacter } from "../update-character";
import { updateCharacterRelation } from "../update-character-relation";
import { updateEvent } from "../update-event";
import { updateEventOrder } from "../update-event-order";
import { updateWord } from "../update-word";
import { updateWork } from "../update-work";

const book = new Hono<AppEnv>()
    .route("/", getListBook)
    .route("/", getListDeletedBook)
    .route("/", getBook)
    .route("/", getWork)
    .route("/", createWork)
    .route("/", updateWork)
    .route("/", deleteWork)
    .route("/", restoreWork)
    .route("/", getListCharacter)
    .route("/", getCharacter)
    .route("/", getListCharacterRelation)
    .route("/", createCharacterRelation)
    .route("/", updateCharacterRelation)
    .route("/", deleteCharacterRelation)
    .route("/", restoreCharacterRelation)
    .route("/", getListWord)
    .route("/", getListEvent)
    .route("/", getEvent)
    .route("/", createEvent)
    .route("/", deleteEvent)
    .route("/", updateEvent)
    .route("/", updateEventOrder)
    .route("/", restoreEvent)
    .route("/", createWord)
    .route("/", updateWord)
    .route("/", deleteWord)
    .route("/", restoreWord)
    .route("/", createCharacter)
    .route("/", updateCharacter)
    .route("/", deleteCharacter)
    .route("/", restoreCharacter)
    .route("/", createBook)
    .route("/", updateBook)
    .route("/", deleteBook)
    .route("/", restoreBook);

export { book };
