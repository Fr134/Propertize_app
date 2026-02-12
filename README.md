# Propertize Housekeeping App

Applicazione web per la gestione delle operazioni di pulizia e housekeeping di immobili in affitto breve.

## Funzionalita principali

- **Gestione Task di Pulizia** - Creazione, assegnazione e monitoraggio delle pulizie
- **Checklist Dinamiche** - Template checklist per immobile con upload foto obbligatorio
- **Gestione Scorte** - Monitoraggio livelli scorte per immobile (caffe, sapone, carta igienica, ecc.)
- **Gestione Biancheria** - Tracking stato biancheria (sporca, in lavaggio, pronta)
- **Segnalazioni Manutenzione** - Sistema di reportistica per danni e manutenzioni
- **Dashboard Operativa** - KPI e overview per il manager

## Ruoli Utente

| Ruolo | Responsabilita |
|-------|---------------|
| **Manager** | Crea task, assegna operatrici, revisiona pulizie, gestisce segnalazioni |
| **Operatrice** | Esegue checklist, carica foto, aggiorna scorte/biancheria, crea segnalazioni |

## Stack Tecnologico

| Layer | Tecnologia |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Linguaggio | TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Form & Validazione | React Hook Form + Zod |
| State Management | Zustand |
| Data Fetching | @tanstack/react-query |
| Autenticazione | NextAuth.js v5 (Auth.js) |
| Database | PostgreSQL (Railway) |
| ORM | Prisma |
| File Storage | Uploadthing |
| Hosting | Railway |

## Prerequisiti

- Node.js 18+
- npm
- Account Railway (per deploy + PostgreSQL)
- Account Uploadthing (per upload foto)

## Setup Locale

1. Clona il repository:
   ```bash
   git clone <repo-url>
   cd propertize-housekeeping-app
   ```

2. Installa le dipendenze:
   ```bash
   npm install
   ```

3. Copia il file delle variabili d'ambiente:
   ```bash
   cp .env.example .env
   ```

4. Configura le variabili d'ambiente in `.env` (vedi sezione sotto)

5. Esegui le migrations del database:
   ```bash
   npx prisma migrate dev
   ```

6. Genera il client Prisma:
   ```bash
   npx prisma generate
   ```

7. (Opzionale) Seed del database con dati di test:
   ```bash
   npx prisma db seed
   ```

8. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```

## Variabili d'Ambiente

```env
# Database (Railway PostgreSQL o locale)
DATABASE_URL=postgresql://postgres:password@localhost:5432/propertize

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Uploadthing
UPLOADTHING_TOKEN=your-uploadthing-token
```

## Deploy su Railway

1. Crea un nuovo progetto su Railway
2. Aggiungi un servizio PostgreSQL
3. Collega il repository GitHub
4. Configura le variabili d'ambiente nel pannello Railway
5. Railway eseguira automaticamente build e deploy

## Struttura Progetto

```
propertize-housekeeping-app/
├── prisma/              # Schema e migrations Prisma
├── public/              # Asset statici
├── src/
│   ├── app/             # Next.js App Router (pages + API routes)
│   │   └── api/         # API Routes
│   ├── components/      # Componenti React
│   │   ├── ui/          # shadcn/ui components
│   │   ├── layout/      # Layout e navigazione
│   │   ├── manager/     # Viste manager
│   │   ├── operator/    # Viste operatrice
│   │   └── shared/      # Componenti condivisi
│   ├── lib/             # Utility e configurazioni
│   ├── hooks/           # Custom React hooks
│   ├── stores/          # Zustand stores
│   └── types/           # TypeScript types
├── .env.example         # Template variabili d'ambiente
└── README.md
```

## Roadmap

- [x] Phase 0: Repository Setup
- [x] Phase 1: Setup e Foundation (Next.js, Tailwind, shadcn/ui, dipendenze)
- [ ] Phase 2: Database schema (Prisma) + Auth (NextAuth v5)
- [ ] Phase 3: Base Layout + routing role-based
- [ ] Phase 4: Gestione Immobili
- [ ] Phase 5: Core Task Management
- [ ] Phase 6: Scorte e Biancheria
- [ ] Phase 7: Segnalazioni
- [ ] Phase 8: Review e Dashboard
- [ ] Phase 9: Polish e Testing
