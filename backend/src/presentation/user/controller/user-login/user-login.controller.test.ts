import { drizzle } from "drizzle-orm/d1";
import { env, SELF } from "cloudflare:test";
import { ulid } from "ulid";
import { describe, expect, it } from "vitest";
import { createEnvConfig } from "../../../../config";
import { Pepper, UserPassword, UserSalt } from "../../../../domain/user";
import { userLoginMaster, userMaster } from "../../../../infrastructure/db";
import * as schema from "../../../../infrastructure/db/schema";

describe("POST /api/v1/user-login", () => {

    it("パスワードが誤っている場合、401を返すこと", async () => {
        const db = drizzle(env.DB, { schema });
        const now = new Date().toISOString();

        const userId = ulid();
        const loginId = `u-${userId}`;
        const config = createEnvConfig(env);
        const pepper = new Pepper(config.pepper);

        await db.insert(userMaster).values({ id: userId, name: loginId, birthday: "19900101", createdAt: now, updatedAt: now });

        const salt = UserSalt.generate();
        const passwordHash = await UserPassword.hash("CorrectHorse1!", salt, pepper);

        await db.insert(userLoginMaster).values({
            id: ulid(),
            userId,
            loginId,
            passwordHash: passwordHash.value,
            salt: salt.value,
            createdAt: now,
            updatedAt: now,
        });

        const res = await SELF.fetch("http://localhost/api/v1/user-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: loginId, password: "WrongHorse1!" }),
        });

        expect(res.status).toBe(401);
    });

    it("存在しないユーザー名の場合、401を返すこと", async () => {
        const res = await SELF.fetch("http://localhost/api/v1/user-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: `u-${ulid()}`, password: "CorrectHorse1!" }),
        });

        expect(res.status).toBe(401);
    });
});
