import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { env, SELF } from "cloudflare:test";
import { ulid } from "ulid";
import { describe, expect, it } from "vitest";
import { createEnvConfig } from "../../../../config";
import { AccessToken, Pepper, UserPassword, UserSalt } from "../../../../domain/user";
import { UserId } from "../../../../domain/shared";
import { userLoginMaster, userMaster } from "../../../../infrastructure/db";
import * as schema from "../../../../infrastructure/db/schema";

describe("PATCH /api/v1/user-password", () => {

    it("認証済みユーザー本人のみが更新され、他ユーザーには影響しないこと（IDOR対策）", async () => {
        const db = drizzle(env.DB, { schema });
        const now = new Date().toISOString();

        const authenticatedUserId = ulid();
        const otherUserId = ulid();
        const config = createEnvConfig(env);
        const pepper = new Pepper(config.pepper);

        await db.insert(userMaster).values([
            { id: authenticatedUserId, name: `u-${authenticatedUserId}`, birthday: "19900101", createdAt: now, updatedAt: now },
            { id: otherUserId, name: `u-${otherUserId}`, birthday: "19900101", createdAt: now, updatedAt: now },
        ]);

        const authenticatedUserSalt = UserSalt.create();
        const authenticatedUserPasswordHash = await UserPassword.hash("CorrectHorse1!", authenticatedUserSalt, pepper);
        const otherUserSalt = UserSalt.create();
        const otherUserPasswordHash = await UserPassword.hash("OtherPassw0rd!", otherUserSalt, pepper);

        await db.insert(userLoginMaster).values([
            {
                id: ulid(),
                userId: authenticatedUserId,
                loginId: authenticatedUserId,
                passwordHash: authenticatedUserPasswordHash.value,
                salt: authenticatedUserSalt.value,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: ulid(),
                userId: otherUserId,
                loginId: otherUserId,
                passwordHash: otherUserPasswordHash.value,
                salt: otherUserSalt.value,
                createdAt: now,
                updatedAt: now,
            },
        ]);

        const accessToken = await AccessToken.create(UserId.of(authenticatedUserId), config);

        const res = await SELF.fetch("http://localhost/api/v1/user-password", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken.token}`,
            },
            body: JSON.stringify({
                nowPassword: "CorrectHorse1!",
                newPassword: "NewPassw0rd1!",
                confirmPassword: "NewPassw0rd1!",
            }),
        });

        expect(res.status).toBe(200);

        const [authenticatedUserLoginRow] = await db.select().from(userLoginMaster).where(eq(userLoginMaster.userId, authenticatedUserId));
        const [otherUserLoginRow] = await db.select().from(userLoginMaster).where(eq(userLoginMaster.userId, otherUserId));

        expect(authenticatedUserLoginRow.passwordHash).not.toBe(authenticatedUserPasswordHash.value);
        expect(otherUserLoginRow.passwordHash).toBe(otherUserPasswordHash.value);
    });

    it("現在のパスワードが誤っている場合、401を返しパスワードは更新されないこと", async () => {
        const db = drizzle(env.DB, { schema });
        const now = new Date().toISOString();

        const userId = ulid();
        const config = createEnvConfig(env);
        const pepper = new Pepper(config.pepper);

        await db.insert(userMaster).values({ id: userId, name: `u-${userId}`, birthday: "19900101", createdAt: now, updatedAt: now });

        const salt = UserSalt.create();
        const passwordHash = await UserPassword.hash("CorrectHorse1!", salt, pepper);

        await db.insert(userLoginMaster).values({
            id: ulid(),
            userId,
            loginId: `u-${userId}`,
            passwordHash: passwordHash.value,
            salt: salt.value,
            createdAt: now,
            updatedAt: now,
        });

        const accessToken = await AccessToken.create(UserId.of(userId), config);

        const res = await SELF.fetch("http://localhost/api/v1/user-password", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken.token}`,
            },
            body: JSON.stringify({
                nowPassword: "WrongHorse1!",
                newPassword: "NewPassw0rd1!",
                confirmPassword: "NewPassw0rd1!",
            }),
        });

        expect(res.status).toBe(401);

        const [loginRow] = await db.select().from(userLoginMaster).where(eq(userLoginMaster.userId, userId));

        expect(loginRow.passwordHash).toBe(passwordHash.value);
    });
});
