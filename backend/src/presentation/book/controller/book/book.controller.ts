import { Hono } from "hono";
import type { AppEnv } from "../../../../types";
import { createBook } from "../create-book";
import { getBook } from "../get-book";
import { getListBook } from "../get-list-book";
import { updateBook } from "../update-book";

const book = new Hono<AppEnv>()
    .route("/", getListBook)
    .route("/", getBook)
    .route("/", createBook)
    .route("/", updateBook);

export { book };
