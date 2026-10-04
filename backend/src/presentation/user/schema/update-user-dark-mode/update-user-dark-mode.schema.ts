import { z } from "zod";

export const UpdateUserDarkModeSchema = z.object({
  darkMode: z.boolean(),
});

export type UpdateUserDarkModeSchemaType = z.infer<typeof UpdateUserDarkModeSchema>;
