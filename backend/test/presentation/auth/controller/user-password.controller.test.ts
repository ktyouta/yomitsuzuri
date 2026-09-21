import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { env, SELF } from "cloudflare:test";
import { ulid } from "ulid";
import { describe, expect, it } from "vitest";
import { createEnvConfig } from "../../../../src/config";
import { AccessToken, Pepper, UserPassword, UserSalt } from "../../../../src/domain/auth";
import { UserId } from "../../../../src/domain/user";
import { userLoginMaster, userMaster } from "../../../../src/infrastructure/db";
import * as schema from "../../../../src/infrastructure/db/schema";

describe("PATCH /api/v1/user-password", () => {

    it("認証済みユーザー本人のみが更新され、他ユーザーには影響しないこと（IDOR対策）", async () => {
        const db = drizzle(env.DB, { schema });
        const now = new Date().toISOString();

        const authenticatedUserId = ulid();
        const otherUserId = ulid();
        const config = createEnvConfig(env);
        const pepper = new Pepper(config.pepper);

        await db.insert(userMaster).values([
            { id: authenticatedUserId, name: `test-user-${authenticatedUserId}`, birthday: "19900101", createdAt: now, updatedAt: now },
            { id: otherUserId, name: `test-user-${otherUserId}`, birthday: "19900101", createdAt: now, updatedAt: now },
        ]);

        const authenticatedUserSalt = UserSalt.generate();
        const authenticatedUserPasswordHash = await UserPassword.hash("CorrectHorse1!", authenticatedUserSalt, pepper);
        const otherUserSalt = UserSalt.generate();
        const otherUserPasswordHash = await UserPassword.hash("OtherPassw0rd!", otherUserSalt, pepper);

        await db.insert(userLoginMaster).values([
            {
                id: ulid(),
                userId: authenticatedUserId,
                loginId: `login-${authenticatedUserId}`,
                passwordHash: authenticatedUserPasswordHash.value,
                salt: authenticatedUserSalt.value,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: ulid(),
                userId: otherUserId,
                loginId: `login-${otherUserId}`,
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
});
