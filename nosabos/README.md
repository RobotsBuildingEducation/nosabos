# Intro

The following provides configurations you must make to run your own version of https://nosabos.app

If you're unfamiliar with setting up firebase projects, use the following step-by-step guide to learn:

https://www.patreon.com/posts/building-app-by-93082226?utm_medium=clipboard_copy&utm_source=copyLink&utm_campaign=postshare_creator&utm_content=join_link

Contact me on Patreon if you have any problems setting this up.

### Forking
The forkable version is a branch of the main repo called `nosabos-fork`
1. Fork the code to your repo and clone it in your editor with `git clone`
2. Then, change branches with `git checkout nosabos-fork`

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

1. `VITE_FIREBASE_PUBLIC_API_KEY=your_public_project_key`
2. `VITE_PATREON_PASSCODE=your_patreon_subscriber_passcode`
3. `VITE_RESPONSES_URL=your_firebase_function_exchangeRealtimeSDP_url`
4. `VITE_REALTIME_URL=your_firebase_function_proxyResponses_url`

##### /functions/.env

1. `OPENAI_API_KEY=your_openai_key`
2. `DEPLOYED_URL=your_dns_website_url`

### Configure

#### /src/firebaseResources/firebaseResources.js

Paste your firebase configuration variable after creating your project

```
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_PUBLIC_API_KEY,
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "",
};
```

#### /vite.config.js

Change the `name`, `short_name`, and `src` urls to allow web app installs on devices

#### /.firebaserc

configure the `default` with your firebase project ID.
