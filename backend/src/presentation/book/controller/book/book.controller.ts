import { Hono } from "hono";
import type { AppEnv } from "../../../../types";
import { createBook } from "../create-book";
import { createCharacter } from "../create-character";
import { createEvent } from "../create-event";
import { createWord } from "../create-word";
import { deleteEvent } from "../delete-event";
import { deleteWord } from "../delete-word";
import { getBook } from "../get-book";
import { getEvent } from "../get-event";
import { getListBook } from "../get-list-book";
import { getListCharacter } from "../get-list-character";
import { getListEvent } from "../get-list-event";
import { getListWord } from "../get-list-word";
import { getWork } from "../get-work";
import { updateBook } from "../update-book";
import { updateCharacter } from "../update-character";
import { updateEvent } from "../update-event";
import { updateEventOrder } from "../update-event-order";
import { updateWord } from "../update-word";

const book = new Hono<AppEnv>()
    .route("/", getListBook)
    .route("/", getBook)
    .route("/", getWork)
    .route("/", getListCharacter)
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
    .route("/", createBook)
    .route("/", updateBook);

export { book };
