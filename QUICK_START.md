# 🚀 Quick Start - Propertize Housekeeping App

## ⚠️ IMPORTANTE: Prima di iniziare

Il file `.env` è stato creato ma **DEVI modificarlo**!

### Opzione A: Supabase (Più Facile - Consigliato)

1. Vai su https://supabase.com
2. Crea account gratis
3. "New Project" → Nome: `propertize-test`, Password: qualsiasi
4. Aspetta 2 minuti che si crei
5. Vai su **Settings → Database → Connection String → URI**
6. Copia la stringa che inizia con `postgresql://postgres...`
7. Apri `.env` e sostituisci `DATABASE_URL` con quella stringa

### Opzione B: PostgreSQL Locale

1. Installa PostgreSQL da https://www.postgresql.org/download/
2. Crea database: `createdb propertize_db`
3. Nel file `.env` usa: `DATABASE_URL="postgresql://postgres:TUA_PASSWORD@localhost:5432/propertize_db"`

---

## 📋 Comandi da eseguire (in ordine)

### 1. Installa dipendenze
```bash
npm install
```

### 2. Verifica .env
Apri `.env` e assicurati che `DATABASE_URL` sia configurato correttamente!

### 3. Crea schema database
```bash
npm run db:push
```
Deve mostrare: ✔ Your database is now in sync with your schema

### 4. Popola database con dati di test
```bash
npm run db:seed
```
Creerà utenti di test:
- Manager: manager@test.com / password123
- Operatrice: operator1@test.com / password123

### 5. Avvia server
```bash
npm run dev
```

### 6. Apri browser
http://localhost:3000

Login con: manager@test.com / password123

---

## 🎯 Funzionalità Implementate

✅ Toast notifications (feedback visivo)
✅ Skeleton loaders (caricamento elegante)
✅ Dashboard Manager con KPI real-time
✅ Sistema review task (approva/rigetta)
✅ Gestione immobili, task, segnalazioni
✅ Workflow completo operatrice

---

## 📚 Guide Utili

- Setup database: `SETUP_LOCAL.md`
- Documentazione completa: `README.md`
- Troubleshooting: vedi sotto

---

## 🐛 Problemi Comuni

**Errore: "Invalid DATABASE_URL"**
→ Controlla che hai modificato `.env` con la tua stringa database

**Errore: "Cannot find module"**
→ Esegui: `npm install`

**Errore database connessione**
→ Verifica che Supabase/PostgreSQL sia attivo

---

## 🎉 Dopo il setup

Testa i workflow:
1. Login Manager → Crea immobile → Crea task
2. Login Operatrice → Esegui pulizia → Completa
3. Login Manager → Review task → Approva
4. Verifica toast notifications e skeleton loaders

Buon test! 🚀
