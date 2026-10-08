import { Hono } from "hono";
import type { AppEnv } from "../../../../types";
import { createBook } from "../create-book";
import { getListBook } from "../get-list-book";

const book = new Hono<AppEnv>()
    .route("/", getListBook)
    .route("/", createBook);

export { book };
