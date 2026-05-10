import { z } from "zod";

export const WaitlistSignupSchema = z.object({
  email: z.string().email(),
  locale: z.enum(["en", "ar"]).default("en"),
  source: z.string().max(64).default("unknown"),
  referralCode: z.string().max(32).optional(),
});

export type WaitlistSignup = z.infer<typeof WaitlistSignupSchema>;
