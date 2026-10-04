import { Hono } from "hono";
import type { AppEnv } from "../../../../types";
import { createUser } from "../create-user";
import { updateUser } from "../update-user";
import { updateUserDarkMode } from "../update-user-dark-mode";
import { deleteUser } from "../delete-user";

const user = new Hono<AppEnv>()
    .route("/", createUser)
    .route("/", updateUser)
    .route("/", updateUserDarkMode)
    .route("/", deleteUser);

export { user };
