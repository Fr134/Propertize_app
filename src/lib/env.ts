import { z } from "zod";

/**
 * Schema di validazione per le variabili d'ambiente.
 * Garantisce che tutte le variabili richieste siano presenti e valide.
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL deve essere un URL valido"),

  // NextAuth
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL deve essere un URL valido"),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET deve essere almeno 32 caratteri per sicurezza"),

  // Uploadthing
  UPLOADTHING_TOKEN: z.string().min(1, "UPLOADTHING_TOKEN è richiesto"),

  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/**
 * Variabili d'ambiente validate e type-safe.
 * Solleva un errore se la validazione fallisce al boot dell'app.
 */
export const env = envSchema.parse(process.env);

// Type export per uso in altri file
export type Env = z.infer<typeof envSchema>;
