# App per Consulenza Professionale

![Concept Design](Figma_JC.png)

*Questo mockup rappresenta il concetto originale che avevo in mente quando ho iniziato a creare questa webapp. Il design mostra i flussi utente principali, inclusi i profili utente, la pubblicazione/visualizzazione di lavori e l'esperienza del marketplace professionale. L'applicazione non ha raggiunto questo stato a causa dei vincoli di tempo, ma questo era l'obiettivo che stavo cercando di raggiungere.*

Una piattaforma per connettere acquirenti e venditori per consulenze professionali.

## Funzionalità

- Autenticazione utenti con email/password e OAuth di 42
- Profili utente con competenze e biografia
- Mercato per richieste di lavoro
- Sistema di messaggistica tra utenti
- Assegnazione e tracciamento del completamento dei lavori

## Stack Tecnologico

- **Frontend**: Angular 17, Ionic Framework, Capacitor
- **Backend**: Express.js, MongoDB
- **Autenticazione**: JWT

## Configurazione del Progetto

### Prerequisiti

- Node.js (v16 o superiore)
- MongoDB (v4.0 o superiore)
- Angular CLI
- Android Studio (per il deployment mobile)
- ADB (Android Debug Bridge)

### Installazione

1. Clona il repository
```bash
git clone <repository-url>
cd job-consultation-app
```

2. Installa le dipendenze
```bash
npm install
```

3. Configura l'ambiente
- Crea un file `.env` nella directory backend con le seguenti variabili:
```
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/job-consultation
JWT_SECRET=your_randomly_generated_secret_key  # Importante per la sicurezza! Genera con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
FORTYTWO_CLIENT_ID=your_42_client_id
FORTYTWO_CLIENT_SECRET=your_42_client_secret
FORTYTWO_CALLBACK_URL=http://localhost:4200/oauth-callback
```

> **NOTA DI SICUREZZA:** Non committare mai il tuo JWT_SECRET nel controllo versione. Genera sempre una chiave segreta unica per ogni deployment usando il comando sopra.

## Esecuzione dell'App su PC

1. Avvia il server MongoDB (vedi la sezione MongoDB per utenti WSL)

2. Avvia il server backend
```bash
cd job-consultation-app/backend
node server.js
```

3. Avvia il server di sviluppo frontend (in un terminale separato)
```bash
cd job-consultation-app
npm start
```

4. Accedi all'applicazione nel tuo browser
```
http://localhost:4200
```

## Esecuzione dell'App su Dispositivo Android

### Configurazione di Sviluppo (Live Reload)

1. Avvia il server backend
```bash
cd job-consultation-app/backend
node server.js
```

2. Configura il port forwarding ADB reverse (in un terminale separato)
```powershell
# Naviga in ADB (se non è nel PATH)
cd C:\Users\<YOUR_USERNAME>\AppData\Local\Android\Sdk\platform-tools

# Configura il port forwarding
adb reverse tcp:3000 tcp:3000
adb reverse tcp:4200 tcp:4200

# Verifica che il dispositivo sia connesso
adb devices
```

3. Assicurati che il tuo `src/environments/environment.ts` sia configurato per usare localhost con ADB reverse:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  // ...altre impostazioni
};
```

4. Compila l'app Angular e sincronizza con Capacitor
```bash
cd job-consultation-app
npm run build
npx cap sync android
```

5. Apri ed esegui in Android Studio
```bash
npx cap open android
```
Poi in Android Studio:
- Connetti il tuo dispositivo
- Abilita il debug USB sul tuo dispositivo
- Seleziona il tuo dispositivo nel menu a discesa dei dispositivi
- Clicca sul pulsante Esegui (triangolo verde)

### Build di Produzione per Android

1. Aggiorna environment.prod.ts con l'URL API appropriato

2. Compila l'app per la produzione
```bash
npm run build -- --configuration=production
npx cap sync android
```

3. Apri in Android Studio
```bash
npx cap open android
```

4. Genera un APK/AAB firmato in Android Studio:
   - Build > Generate Signed Bundle/APK

## Risoluzione dei Problemi Comuni

### Problemi di Connessione API
- Verifica che il backend sia in esecuzione: `curl http://localhost:3000/api/test`
- Assicurati che i comandi ADB reverse siano stati completati con successo
- Controlla che il tuo dispositivo abbia i permessi di internet abilitati
- Ispeziona il network_security_config.xml per assicurarti che i domini corretti siano consentiti

### Problemi di Build
- Esegui sempre `npm run build` seguito da `npx cap sync android` dopo aver apportato modifiche
- Pulisci la cache se necessario: `npm cache clean --force`

### Problemi di Connessione ADB
- Prova a scollegare e ricollegare il tuo dispositivo
- Riavvia ADB: `adb kill-server` seguito da `adb start-server`
- Assicurati che il debug USB sia abilitato sul dispositivo

### Problemi con OAuth di 42
- Assicurati che i tuoi URL di redirect siano impostati correttamente nelle impostazioni API di 42
- Controlla che le variabili di ambiente corrispondano alle impostazioni della tua applicazione API di 42

## MongoDB su WSL (Nota per Sviluppatori)

Quando si esegue MongoDB su Windows Subsystem for Linux (WSL), sarà necessario gestire MongoDB manualmente:

```bash
# Avvio manuale di MongoDB (dopo il riavvio del sistema)
mkdir -p ~/data/db  # Necessario solo la prima volta
mongod --dbpath ~/data/db --fork --logpath ~/mongodb.log

# Arresto corretto di MongoDB
mongosh admin --eval "db.shutdownServer()"

# Controllo dello stato di MongoDB
ps aux | grep mongod

# Connessione alla shell di MongoDB
mongosh
```

Questi comandi sono necessari perché WSL non utilizza systemd per default, quindi i comandi standard di gestione dei servizi non funzioneranno.

## Struttura del Progetto

- `/src`: Applicazione Angular
  - `/app`: Codice principale dell'applicazione
    - `/components`: Componenti UI riutilizzabili
    - `/pages`: Pagine dell'applicazione
    - `/services`: Logica di business e chiamate API
    - `/guards`: Guard delle rotte
    - `/models`: Modelli/interfacce di dati
  - `/assets`: Asset statici
  - `/environments`: Configurazioni dell'ambiente

- `/backend`: Backend Express.js
  - `/middleware`: Middleware personalizzati
  - `/models`: Modelli MongoDB
  - `/routes`: Rotte API
  - `server.js`: File principale del server

## Endpoint API

### Autenticazione
- `POST /api/auth/register`: Registra un nuovo utente
- `POST /api/auth/login`: Login con email/password
- `POST /api/auth/42`: Login con OAuth di 42
- `GET /api/auth/user`: Ottieni i dati dell'utente autenticato

### Utenti
- `GET /api/users/profile`: Ottieni il profilo dell'utente corrente
- `POST /api/users/profile`: Crea o aggiorna il profilo utente
- `GET /api/users/profile/:userId`: Ottieni il profilo per ID utente
- `GET /api/users/sellers`: Ottieni tutti i profili dei venditori

### Lavori
- `POST /api/jobs`: Crea una nuova richiesta di lavoro
- `GET /api/jobs`: Ottieni tutti i lavori rilevanti per l'utente
- `GET /api/jobs/:id`: Ottieni un lavoro per ID
- `PUT /api/jobs/:id/assign`: Assegna un lavoro a un venditore
- `PUT /api/jobs/:id/complete`: Segna un lavoro come completato

### Messaggi
- `POST /api/messages`: Invia un messaggio
- `GET /api/messages`: Ottieni tutti i messaggi per un utente (conversazioni)
- `GET /api/messages/:userId`: Ottieni i messaggi tra l'utente corrente e un altro utente
- `PUT /api/messages/read/:userId`: Segna i messaggi da un utente come letti
- `GET /api/messages/unread/count`: Ottieni il conteggio dei messaggi non letti

---

# Job Consultation App

![Concept Design](Figma_JC.png)

*This mockup represents the original concept I had in mind when starting to create this webapp. The design showcases the core user flows including user profiles, job posting/viewing, and the professional marketplace experience. The application did not reach this state because of the time constraint, but that's what I was trying to reach.*

A platform for connecting buyers with sellers for professional job consultations.

## Features

- User authentication with email/password and 42 OAuth
- User profiles with expertise and bio
- Market for job requests
- Messaging system between users
- Job assignment and completion tracking

## Tech Stack

- **Frontend**: Angular 17, Ionic Framework, Capacitor
- **Backend**: Express.js, MongoDB
- **Authentication**: JWT

## Project Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.0 or higher)
- Angular CLI
- Android Studio (for mobile deployment)
- ADB (Android Debug Bridge)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd job-consultation-app
```

2. Install dependencies
```bash
npm install
```

3. Configure environment
- Create a `.env` file in the backend directory with the following variables:
```
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/job-consultation
JWT_SECRET=your_randomly_generated_secret_key  # Important for security! Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
FORTYTWO_CLIENT_ID=your_42_client_id
FORTYTWO_CLIENT_SECRET=your_42_client_secret
FORTYTWO_CALLBACK_URL=http://localhost:4200/oauth-callback
```

> **SECURITY NOTE:** Never commit your actual JWT_SECRET to version control. Always generate a unique secret for each deployment using the command above.

## Running the App on PC

1. Start the MongoDB server (see MongoDB section below for WSL users)

2. Start the backend server
```bash
cd job-consultation-app/backend
node server.js
```

3. Start the frontend development server (in a separate terminal)
```bash
cd job-consultation-app
npm start
```

4. Access the application in your browser
```
http://localhost:4200
```

## Running the App on Android Device

### Development Setup (Live Reload)

1. Start the backend server
```bash
cd job-consultation-app/backend
node server.js
```

2. Set up ADB reverse port forwarding (in a separate terminal)
```powershell
# Navigate to ADB (if not in PATH)
cd C:\Users\<YOUR_USERNAME>\AppData\Local\Android\Sdk\platform-tools

# Set up port forwarding
adb reverse tcp:3000 tcp:3000
adb reverse tcp:4200 tcp:4200

# Verify the device is connected
adb devices
```

3. Make sure your `src/environments/environment.ts` is set to use localhost with ADB reverse:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  // ...other settings
};
```

4. Build the Angular app and sync with Capacitor
```bash
cd job-consultation-app
npm run build
npx cap sync android
```

5. Open and run in Android Studio
```bash
npx cap open android
```
Then in Android Studio:
- Connect your device
- Enable USB debugging on your device
- Select your device in the device dropdown
- Click the Run button (green triangle)

### Production Build for Android

1. Update environment.prod.ts with appropriate API URL

2. Build the app for production
```bash
npm run build -- --configuration=production
npx cap sync android
```

3. Open in Android Studio
```bash
npx cap open android
```

4. Generate a signed APK/AAB in Android Studio:
   - Build > Generate Signed Bundle/APK

## Troubleshooting Common Issues

### API Connection Issues
- Verify backend is running correctly: `curl http://localhost:3000/api/test`
- Ensure ADB reverse commands completed successfully
- Check your device has internet permissions enabled
- Inspect the network_security_config.xml to ensure proper domains are allowed

### Build Issues
- Always run `npm run build` followed by `npx cap sync android` after making changes
- Clear cache if necessary: `npm cache clean --force`

### ADB Connection Issues
- Try unplugging and reconnecting your device
- Restart ADB: `adb kill-server` followed by `adb start-server`
- Ensure USB debugging is enabled on the device

### 42 OAuth Issues
- Make sure your redirect URLs are correctly set in the 42 API settings
- Check that environment variables match your 42 API application settings

## MongoDB on WSL (Developer Note)

When running MongoDB on Windows Subsystem for Linux (WSL), you'll need to manage MongoDB manually:

```bash
# Starting MongoDB manually (after system restart)
mkdir -p ~/data/db  # Only needed first time
mongod --dbpath ~/data/db --fork --logpath ~/mongodb.log

# Stopping MongoDB properly
mongosh admin --eval "db.shutdownServer()"

# Checking MongoDB status
ps aux | grep mongod

# Connecting to MongoDB shell
mongosh
```

These commands are necessary because WSL doesn't use systemd by default, so standard service management commands won't work.

## Project Structure

- `/src`: Angular application
  - `/app`: Core application code
    - `/components`: Reusable UI components
    - `/pages`: Application pages
    - `/services`: Business logic and API calls
    - `/guards`: Route guards
    - `/models`: Data models/interfaces
  - `/assets`: Static assets
  - `/environments`: Environment configurations

- `/backend`: Express.js backend
  - `/middleware`: Custom middleware
  - `/models`: MongoDB models
  - `/routes`: API routes
  - `server.js`: Main server file

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login with email/password
- `POST /api/auth/42`: Login with 42 OAuth
- `GET /api/auth/user`: Get authenticated user data

### Users
- `GET /api/users/profile`: Get current user's profile
- `POST /api/users/profile`: Create or update user profile
- `GET /api/users/profile/:userId`: Get profile by user ID
- `GET /api/users/sellers`: Get all sellers' profiles

### Jobs
- `POST /api/jobs`: Create a new job request
- `GET /api/jobs`: Get all jobs relevant to the user
- `GET /api/jobs/:id`: Get job by ID
- `PUT /api/jobs/:id/assign`: Assign a job to a seller
- `PUT /api/jobs/:id/complete`: Mark a job as completed

### Messages
- `POST /api/messages`: Send a message
- `GET /api/messages`: Get all messages for a user (conversations)
- `GET /api/messages/:userId`: Get messages between current user and another user
- `PUT /api/messages/read/:userId`: Mark messages from a user as read
- `GET /api/messages/unread/count`: Get count of unread messages
