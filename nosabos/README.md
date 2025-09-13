### Check node version

`node -v`

Node version 20+ is required.

### To run

1. `npm install`
2. `npm run dev`

### To deploy

1. `npm run build`
2. `firebase deploy`

### Environment variables

##### /.env

1. `VITE_FIREBASE_PUBLIC_API_KEY=your_public_project_key`
2. `VITE_PATREON_PASSCODE=your_patreon_subscriber_passcode`
3. `VITE_RESPONSES_URL=your_firebase_function_exchangeRealtimeSDP_url`
4. `VITE_REALTIME_URL=your_firebase_function_proxyResponses_url`

##### /functions/.env

1. `OPENAI_API_KEY=your_openai_key`
2. `DEPLOYED_URL=your_dns_website_url`

### Backend services

1. Firebase firestore
2. Firebase Functions
3. Firebae hosting
