# Propertize — Documentazione Funzionale

> Applicazione di gestione immobiliare per manager e operatori. Permette di coordinare le pulizie degli appartamenti, gestire la contabilità, monitorare le scorte e seguire le segnalazioni di manutenzione.

---

## Indice

1. [Struttura generale](#struttura-generale)
2. [Autenticazione](#autenticazione)
3. [Area Manager](#area-manager)
   - [Dashboard](#1-dashboard-manager)
   - [Task](#2-task)
   - [Immobili](#3-immobili)
   - [Contabilità](#4-contabilità)
   - [Scorte & Magazzino](#5-scorte--magazzino)
   - [Segnalazioni](#6-segnalazioni)
4. [Area Operatore](#area-operatore)
   - [Dashboard](#1-dashboard-operatore)
   - [Dettaglio Task](#2-dettaglio-task-operatore)
5. [Flussi principali](#flussi-principali)
6. [Stack tecnico](#stack-tecnico)

---

## Struttura generale

L'app è divisa in due macro-aree accessibili in base al ruolo dell'utente:

| Ruolo | Accesso | URL base |
|-------|---------|----------|
| **Manager** | Gestione completa: task, immobili, contabilità, scorte, report | `/manager` |
| **Operatore** | Solo task assegnati e segnalazioni | `/operator` |

---

## Autenticazione

- Login tramite email e password (`/login`)
- Il backend valida le credenziali e restituisce un JWT
- Il token viene memorizzato nella sessione NextAuth e allegato automaticamente ad ogni richiesta API
- Le route backend sono protette: alcune richiedono solo autenticazione, altre richiedono il ruolo MANAGER

---

## Area Manager

### 1. Dashboard Manager

**URL:** `/manager`

Pannello di controllo con 4 indicatori chiave aggiornati ogni 30 secondi:

| Indicatore | Cosa mostra |
|-----------|-------------|
| **In attesa di approvazione** | N° task completati dalle operatrici che attendono review del manager |
| **Segnalazioni aperte** | N° report di manutenzione con status OPEN |
| **Scorte in esaurimento** | N° appartamenti con almeno una scorta a livello basso |
| **Task oggi** | N° task completati rispetto al totale pianificati per la giornata |

Cliccando su ogni card si viene reindirizzati alla sezione relativa con il filtro già applicato.

---

### 2. Task

#### Lista task — `/manager/tasks`

Visualizza tutti i task di pulizia creati. Disponibile in due modalità:

**Vista Lista**
- Tabella con colonne: Immobile, Operatrice assegnata, Data, Stato
- Clic sulla riga → dettaglio task
- Pulsante elimina (con conferma) su ogni riga
- Filtro per stato tramite URL query params

**Vista Calendario**
- Griglia settimanale: righe = appartamenti, colonne = giorni della settimana
- Navigazione settimana precedente / successiva / oggi
- Task visualizzati come chip colorati in base allo stato
- Clic sul chip → dettaglio task

**Creazione task** — pulsante "Crea Task" in alto a destra:
- Seleziona immobile
- Seleziona operatrice
- Imposta data programmata
- Note opzionali per l'operatrice
- La checklist viene copiata automaticamente dal template dell'immobile

---

#### Dettaglio task — `/manager/tasks/[id]`

Visualizza tutte le informazioni di un task:

- **Header**: nome immobile, indirizzo, stato, pulsanti azione
- **Checklist**: lista delle aree con foto scattate dall'operatrice, sub-task, note per area
- **Scorte soggiorno**: lista articoli verificati dall'operatrice (con quantità usate se collegate al magazzino)
- **Consumi registrati**: tabella con articolo, quantità prevista e quantità effettivamente usata

**Azioni disponibili in base allo stato:**

| Stato task | Azioni manager |
|-----------|----------------|
| COMPLETED | Approva / Rigetta (con note) |
| REJECTED | Riapri (con nota di riapertura per l'operatrice) |
| APPROVED | Solo visualizzazione |

---

### 3. Immobili

#### Lista immobili — `/manager/properties`

Tabella di tutti gli appartamenti registrati con: Nome, Codice, Indirizzo, Tipo, N° Task.

Pulsante "Crea Immobile": form con nome, codice univoco, indirizzo, tipologia e proprietario.

---

#### Dettaglio immobile — `/manager/properties/[id]`

- Info principali: codice, tipologia, n° aree checklist
- Link diretto alla contabilità dell'immobile
- **Editor Checklist**: consente di configurare il template di pulizia:
  - Aggiungere e modificare aree (es. "Cucina", "Bagno")
  - Per ogni area: descrizione, flag "foto obbligatoria", sub-task
  - Sezione "Scorte Soggiorno": lista di articoli da verificare (collegabili al catalogo magazzino con quantità prevista)

---

#### Contabilità immobile — `/manager/properties/[id]/accounting`

Riepilogo spese del singolo immobile:
- 3 card KPI: totale spese, totale IVA, n° movimenti
- Lista di ogni spesa con: descrizione, data, autore, importo, IVA, foto allegate
- Pulsante "Nuova spesa"

---

#### Nuova spesa — `/manager/properties/[id]/accounting/new`

Form per aggiungere una spesa:
- Descrizione (obbligatoria)
- Importo in € (obbligatorio)
- IVA in € (opzionale, non può superare l'importo)
- Data spesa (default: oggi)
- Allegati foto (max 10, caricati su UploadThing)

> La spesa viene creata automaticamente con stato **"da fatturare" = sì**, cioè è subito visibile nella tab "Da pagare" della contabilità generale.

---

### 4. Contabilità

**URL:** `/manager/accounting`

Vista generale di tutte le spese, organizzata in 3 tab:

---

#### Tab "Immobili"

- Accordion con ogni immobile
- KPI in testa: totale spese, fatturate, pagate, da pagare
- Espandendo un immobile: lista spese con toggle "Pagata"
- Pulsante "Nuova spesa" per aggiungere direttamente dal pannello generale

---

#### Tab "Proprietari"

- Accordion per ogni proprietario
- Per ogni proprietario: KPI aggregati su tutti i suoi immobili
- Espandendo: accordion annidato per ogni immobile → lista spese
- Toggle "Pagata" su ogni spesa

---

#### Tab "Da pagare"

Mostra esclusivamente le spese non ancora pagate, raggruppate per proprietario e immobile.

**Selezione e generazione PDF:**
- Checkbox su ogni spesa per selezionarla
- Barra azione (appare quando c'è almeno una selezione): mostra n° spese selezionate e totale
- Pulsante **"Deseleziona tutto"**
- Pulsante **"Genera Report PDF"**: genera e scarica automaticamente un PDF con:
  - Titolo: "Report Spese"
  - Data di generazione
  - Spese raggruppate per proprietario → immobile
  - Tabella per immobile con: descrizione, data, importo, IVA, subtotale
  - Totale complessivo in fondo
  - Colori blu per intestazioni e totali

---

### 5. Scorte & Magazzino

**URL:** `/manager/supplies`

Interfaccia a 5 tab per la gestione del magazzino:

---

#### Tab "Catalogo"

Gestione degli articoli del catalogo:
- Lista articoli con: nome, SKU, unità di misura, stato (attivo/disattivo)
- Aggiungere nuovo articolo
- Modificare articolo esistente
- Disattivare articoli non più in uso

---

#### Tab "Magazzino"

Visualizza il saldo di magazzino per ogni articolo:
- Quantità disponibile (`qty_on_hand`)
- Punto di riordino (`reorder_point`): soglia sotto la quale l'articolo viene segnalato come "in esaurimento"
- Rettifica manuale del saldo (crea una transazione di tipo ADJUSTMENT)
- Evidenziazione visiva degli articoli sotto soglia

---

#### Tab "Consumi"

Riepilogo storico dei consumi:
- Per ogni articolo: totale quantità consumata, n° transazioni
- Filtro per periodo

---

#### Tab "Ordini"

Gestione degli ordini di acquisto:
- Lista ordini con stato: BOZZA → ORDINATO → RICEVUTO / ANNULLATO
- Creazione nuovo ordine: seleziona articoli, quantità, costo unitario
- Dettaglio ordine con possibilità di ricevere le singole righe
- Alla ricezione: il saldo di magazzino viene incrementato automaticamente (transazione PURCHASE_IN)

---

#### Tab "Previsioni"

Forecast di esaurimento basato sui consumi storici:
- Per ogni articolo: consumo medio giornaliero, giorni stimati al termine delle scorte
- Segnalazione articoli con esaurimento imminente (sotto il punto di riordino)

---

### 6. Segnalazioni

#### Lista segnalazioni — `/manager/reports`

Tabella di tutti i report di manutenzione con: Titolo, Immobile, Categoria, Priorità, Stato, Data.

Filtrabile per stato e priorità.

---

#### Dettaglio segnalazione — `/manager/reports/[id]`

- Info: categoria, priorità, autore, data
- Descrizione completa
- Foto allegate
- **Aggiornamento stato**: pulsanti per ciclare tra APERTA → IN CORSO → RISOLTA

---

## Area Operatore

### 1. Dashboard Operatore

**URL:** `/operator`

- Saluto personalizzato con il nome dell'operatrice
- **Task attivi**: card per ogni task con stato TODO o IN_PROGRESS
  - Mostra: nome immobile, indirizzo, codice, data programmata, note del manager
  - Pulsante "Inizia" (TODO) o "Continua" (IN_PROGRESS)
- **Task completati**: card a bassa opacità per task già inviati al manager

---

### 2. Dettaglio Task Operatore

**URL:** `/operator/tasks/[id]`

Schermata principale di lavoro dell'operatrice.

**Informazioni in testa:**
- Nome immobile, indirizzo, codice
- Stato del task
- Note del manager
- Avviso rosso se il task è stato rigettato (con la motivazione)
- Avviso arancione se il task è stato riaperto (con le note di correzione)

---

**Se stato = TODO:**
- Pulsante grande **"Inizia pulizia"** → il task passa a IN_PROGRESS

---

**Se stato = IN_PROGRESS:**

**Sezione Checklist**
- Per ogni area di pulizia:
  - Toggle "completata" (icona cerchio → spunta verde)
  - Nome area
  - Icona fotocamera se la foto è obbligatoria
  - Upload foto (dal dispositivo)
  - Sub-task con checkbox individuale
  - Note sull'area
- Contatore progressivo: X/N aree completate

**Sezione Scorte Soggiorno**
- Lista articoli da verificare
- Checkbox per ogni articolo
- Se l'articolo è collegato al catalogo magazzino: input per la quantità effettivamente usata (`[-] qty [+]`)

**Sezione Livello Scorte**
- Dropdown per aggiornare il livello di scorta per categoria (Caffè, Carta igienica, Sapone, ecc.):
  - OK / In esaurimento / Esaurito

**Sezione Biancheria**
- Aggiornamento stato biancheria per tipo (Lenzuola, Asciugamani, Tovaglie):
  - Stato: Sporca / In lavaggio / Pronta
  - Quantità

**Sezione Segnalazione**
- Pulsante "Crea Segnalazione" → apre form con titolo, descrizione, categoria, priorità e foto

**Invio task:**
- Pulsante **"Invia task completato"**
- Il sistema valida:
  - Tutte le aree della checklist sono spuntate
  - Le foto obbligatorie sono state caricate
  - Tutti i sub-task sono completati
- Se valido: task passa a COMPLETED, in attesa di review del manager

---

**Se stato = COMPLETED:**
- Card gialla: "In attesa di approvazione dal manager"

**Se stato = APPROVED:**
- Card verde: "Task approvato"

**Se stato = REJECTED:**
- Card rossa con il motivo del rifiuto
- Pulsante per riaprire (disponibile solo per il manager)

---

## Flussi principali

### Ciclo di vita di un task

```
Manager crea task
        ↓
Task assegnato all'operatrice (TODO)
        ↓
Operatrice inizia pulizia (IN_PROGRESS)
        ↓
Operatrice compila checklist, carica foto, aggiorna scorte e biancheria
        ↓
Operatrice invia task completato (COMPLETED)
        ↓
Manager revisiona
        ↓
    APPROVA                     RIGETTA (con note)
      ↓                               ↓
   APPROVED              Operatrice corregge (IN_PROGRESS)
                                  ↓
                         Operatrice reinvia (COMPLETED)
                                  ↓
                              Manager riapprova
```

---

### Ciclo di vita di una spesa

```
Manager crea spesa (via immobile o contabilità generale)
        ↓
Spesa registrata con is_billed = true (immediatamente "da pagare")
        ↓
Spesa visibile nella tab "Da pagare"
        ↓
Manager seleziona spese → genera Report PDF
        ↓
Manager segna spesa come "Pagata" (toggle)
        ↓
Spesa scompare dalla tab "Da pagare"
```

---

### Flusso magazzino

```
Manager crea articoli nel Catalogo
        ↓
Manager imposta saldo iniziale e punto di riordino (Magazzino)
        ↓
Manager collega articoli alla checklist degli immobili (quantità prevista)
        ↓
Operatrice durante il task indica quantità usata per ogni articolo
        ↓
Task approvato → consumi registrati automaticamente (CONSUMPTION_OUT)
        ↓
Saldo magazzino decrementato
        ↓
Manager monitora scorte (Previsioni) → crea ordine di acquisto
        ↓
Merce ricevuta → saldo incrementato (PURCHASE_IN)
```

---

## Stack tecnico

| Layer | Tecnologie |
|-------|-----------|
| **Frontend** | Next.js (App Router), React 19, TanStack Query, NextAuth.js, Tailwind CSS, shadcn/ui |
| **Backend** | Hono, Prisma ORM, jose (JWT), bcryptjs |
| **Database** | PostgreSQL |
| **Upload file** | UploadThing |
| **PDF** | jsPDF + jspdf-autotable (generazione lato client) |
| **Validazione** | Zod (condiviso tra frontend e backend via package `@propertize/shared`) |
| **Autenticazione** | JWT Bearer token, NextAuth Credentials provider |
