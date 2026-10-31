import { z } from "zod";

export const UpdateUserDarkModeSchema = z.object({
  darkMode: z.boolean(),
});
