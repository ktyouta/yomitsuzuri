import { Hono } from "hono";
import type { AppEnv } from "../../../../types";
import { createUser } from "../create-user";
import { updateUser } from "../update-user";
import { updateUserDarkMode } from "../update-user-dark-mode";
import { deleteUser } from "../delete-user";
import { userLogin } from "../user-login";
import { refresh } from "../refresh";
import { verify } from "../verify";
import { userLogout } from "../user-logout";
import { updatePassword } from "../update-password";

const user = new Hono<AppEnv>()
    .route("/", createUser)
    .route("/", updateUser)
    .route("/", updateUserDarkMode)
    .route("/", deleteUser)
    .route("/", userLogin)
    .route("/", refresh)
    .route("/", verify)
    .route("/", userLogout)
    .route("/", updatePassword);

export { user };
