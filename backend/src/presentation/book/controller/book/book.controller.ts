import { Hono } from "hono";
import type { AppEnv } from "../../../../types";
import { createBook } from "../create-book";
import { createCharacter } from "../create-character";
import { createWord } from "../create-word";
import { deleteWord } from "../delete-word";
import { getBook } from "../get-book";
import { getListBook } from "../get-list-book";
import { getListCharacter } from "../get-list-character";
import { getListWord } from "../get-list-word";
import { getWork } from "../get-work";
import { updateBook } from "../update-book";
import { updateCharacter } from "../update-character";
import { updateWord } from "../update-word";

const book = new Hono<AppEnv>()
    .route("/", getListBook)
    .route("/", getBook)
    .route("/", getWork)
    .route("/", getListCharacter)
    .route("/", getListWord)
    .route("/", createWord)
    .route("/", updateWord)
    .route("/", deleteWord)
    .route("/", createCharacter)
    .route("/", updateCharacter)
    .route("/", createBook)
    .route("/", updateBook);

export { book };
