import { Hono } from "hono";
import type { AppEnv } from "../../../types";
import { getListBook } from "./get-list-book.controller";

const book = new Hono<AppEnv>()
    .route("/", getListBook);

export { book };
