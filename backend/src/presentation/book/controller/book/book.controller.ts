import { Hono } from "hono";
import type { AppEnv } from "../../../../types";
import { createBook } from "../create-book";
import { createCharacter } from "../create-character";
import { createCharacterRelation } from "../create-character-relation";
import { createEvent } from "../create-event";
import { createWord } from "../create-word";
import { deleteCharacter } from "../delete-character";
import { deleteCharacterRelation } from "../delete-character-relation";
import { deleteEvent } from "../delete-event";
import { deleteWord } from "../delete-word";
import { getBook } from "../get-book";
import { getCharacter } from "../get-character";
import { getEvent } from "../get-event";
import { getListBook } from "../get-list-book";
import { getListCharacter } from "../get-list-character";
import { getListCharacterRelation } from "../get-list-character-relation";
import { getListEvent } from "../get-list-event";
import { getListWord } from "../get-list-word";
import { getWork } from "../get-work";
import { updateBook } from "../update-book";
import { updateCharacter } from "../update-character";
import { updateCharacterRelation } from "../update-character-relation";
import { updateEvent } from "../update-event";
import { updateEventOrder } from "../update-event-order";
import { updateWord } from "../update-word";
import { updateWork } from "../update-work";

const book = new Hono<AppEnv>()
    .route("/", getListBook)
    .route("/", getBook)
    .route("/", getWork)
    .route("/", updateWork)
    .route("/", getListCharacter)
    .route("/", getCharacter)
    .route("/", getListCharacterRelation)
    .route("/", createCharacterRelation)
    .route("/", updateCharacterRelation)
    .route("/", deleteCharacterRelation)
    .route("/", getListWord)
    .route("/", getListEvent)
    .route("/", getEvent)
    .route("/", createEvent)
    .route("/", deleteEvent)
    .route("/", updateEvent)
    .route("/", updateEventOrder)
    .route("/", createWord)
    .route("/", updateWord)
    .route("/", deleteWord)
    .route("/", createCharacter)
    .route("/", updateCharacter)
    .route("/", deleteCharacter)
    .route("/", createBook)
    .route("/", updateBook);

export { book };
