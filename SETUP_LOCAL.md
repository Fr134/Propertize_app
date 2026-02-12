# Setup Database Locale

## PostgreSQL Locale (Windows)

1. **Scarica PostgreSQL:**
   - https://www.postgresql.org/download/windows/
   - Installa con installer di default (porta 5432)
   - Ricorda la password di postgres durante installazione

2. **Crea Database:**
   ```bash
   # Apri cmd o PowerShell
   psql -U postgres
   # Inserisci password postgres

   # Crea database
   CREATE DATABASE propertize_db;

   # Esci
   \q
   ```

3. **Stringa connessione:**
   ```
   DATABASE_URL="postgresql://postgres:TUA_PASSWORD@localhost:5432/propertize_db"
   ```

## Supabase Cloud (Più Facile - Consigliato)

1. **Crea progetto gratuito:**
   - Vai su https://supabase.com
   - "New Project" → Nome: "propertize-test"
   - Copia la stringa DATABASE_URL da Settings → Database

2. **Stringa connessione:**
   ```
   DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
   ```

   Supabase fornisce già la stringa completa pronta all'uso!

## Railway Cloud Database (Alternativa)

1. **Crea database:**
   - https://railway.app
   - New Project → PostgreSQL
   - Copia DATABASE_URL dalle variabili

---

**Consiglio:** Usa **Supabase** per iniziare velocemente senza installare nulla!
