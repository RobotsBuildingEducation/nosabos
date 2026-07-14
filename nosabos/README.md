# Intro

The following provides configurations you must make to run your own version of https://piyali.app

If you're unfamiliar with setting up firebase projects, use the following step-by-step guide to learn:

https://www.patreon.com/posts/building-app-by-93082226?utm_medium=clipboard_copy&utm_source=copyLink&utm_campaign=postshare_creator&utm_content=join_link

Caveat: this project has firebase appcheck enabled for some basic database security, basically it only allows data to update through the correct URL and localhost. If you find that you can't create accounts and the app gets "stuck", check the console to see if youre being blocked by security rules

Contact me on Patreon if you have any problems setting this up.

### Check node version

`node -v`

Node version 20+ is required.

### Backend services

1. Firebase firestore
2. Firebase Functions
3. Firebae hosting

### To run

1. `npm install`
2. `npm run dev`

### To deploy app

1. `npm run build`
2. `firebase deploy`

### To deploy firebase functions

1. `cd functions`
2. `npm run deploy`

### Environment variables

##### /.env

> Your firebase project config

1. `VITE_FIREBASE_PUBLIC_API_KEY=your_public_project_key`
2. `VITE_FIREBASE_AUTH_DOMAIN=firebase_project_config`
3. `VITE_FIREBASE_PROJECT_ID=firebase_project_config`
4. `VITE_FIREBASE_STORAGE_BUCKET=firebase_project_config`
5. `VITE_FIREBASE_MESSAGING_SENDER_ID=firebase_project_config`
6. `VITE_FIREBASE_APP_ID=firebase_project_config`
7. `VITE_FIREBASE_MEASUREMENT_ID=firebase_project_config`

> Frontend paywall password 8. `VITE_PATREON_PASSCODE=your_patreon_subscriber_passcode`

> Firebase functions URLs (deploy to create) 9. `VITE_RESPONSES_URL=your_firebase_functions_base_url` 10. `VITE_REALTIME_URL=your_firebase_function_exchangeRealtimeSDP_url`

> Google captcha needed to make Firebase Appcheck work (https://cloud.google.com/security/products/recaptcha) 11. `VITE_RECAPTCHA_SITE_KEY=your_recaptcha_v3_site_key`

12. `VITE_GEMINI_LIVE_TOOL_GRADING=true`
13. `VITE_GEMINI_LIVE_PROVIDER=google-ai`

> if you don't want to set up a gemini developer account, change this value to "openai" to use your openAI api key instead 14. `VITE_TUTOR_REALTIME_PROVIDER=gemini` || `VITE_TUTOR_REALTIME_PROVIDER=gemini`

##### /functions/.env

1. `OPENAI_API_KEY=your_openai_key`
2. `DEPLOYED_URL=your_dns_website_url`

> added this because i changed my app from nosabos to piyali 3. `NEW_DEPLOYED_URL=https://piyali.app`

4. `REQUIRE_APPCHECK=true` after the web client is deployed with App Check initialized.

### Configure

#### /src/firebaseResources/firebaseResources.js

Paste your firebase configuration variable after creating your project

```
const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId
};
```

#### /vite.config.js

Change the `name`, `short_name`, and `src` urls to allow web app installs on devices

#### /.firebaserc

configure the `default` with your firebase project ID.

#### /.firestore.rules

Update your firestore database rules with the data in this file
