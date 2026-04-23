import { LINKS_PAGE_PT_STATIC } from "./linksPagePtStatic";
import { LINKS_PAGE_HI_STATIC } from "./linksPageHiStatic";

export const linksPageTranslations = {
  en: {
    // Welcome section
    welcome: "Welcome",
    customizeProfile: "Customize Profile",
    profile: "Profile",
    about: "About",
    aboutTitle: "About",
    aboutContent: (
      <div>
        <p style={{ marginBottom: 12 }}>Thanks for checking out my work!</p>

        <p style={{ marginBottom: 12 }}>
          My name is Sheilfer. I studied computer science and always intended to
          learn software engineering to build education technology. In general,
          I have a love for learning, teaching and education and believe that’s
          where my skills are best put to use.
        </p>

        <p style={{ marginBottom: 12 }}>
          <span style={{ color: "var(--links-accent-primary)" }}>
            I started this idea called Robots Building Education back in 2015
            because I felt that education technology was always behind on what
            the internet was capable of.
          </span>{" "}
          Online video games and internet forums really captured people’s
          attention because it was fun, engaging and even addictive.
        </p>

        <p style={{ marginBottom: 12 }}>
          And back then, as a college student, I felt somewhat frustrated that I
          would pour hours into my studies but it never really reflected until I
          essentially graduated college, which can take upwards 20 years! It
          felt like something was missing.
        </p>

        <p style={{ marginBottom: 12 }}>
          <span style={{ color: "var(--links-accent-warm)" }}>
            Robots Building Education is this idea that your learning has real
            impact at the moment of learning and progressing.{" "}
          </span>
          For now, I say it’s “creating scholarships with learning” because it’s
          a little easier to imagine what the technology is actually doing
          under-the-hood, but the long-term vision is to have education
          technology work in a way that can meaningfully support schools,
          teachers and students in a borderless way.
        </p>

        <p style={{ marginBottom: 12 }}>
          Think of it as a way that makes internet properties fund schools
          similar to how housing properties do.
        </p>

        <p style={{ marginBottom: 12 }}>
          So you may see some things work on my platform in ways you’ve never
          seen before. Some stuff is pretty smooth and frictionless for what’s
          actually happening and that’s partially because I’ve been relentless
          in creating this idea and making it a real experience for people.{" "}
          <span style={{ color: "var(--links-accent-pink)" }}>
            I genuinely believe this is how the world ought to work, because it
            doesn’t make sense to me that billions of hours of work in daily
            online education goes unnoticed and unrecorded publicly.
          </span>
        </p>

        <p style={{ marginBottom: 12 }}>
          So again, thank you for checking out my work! It sincerely means a lot
          to me.
        </p>
      </div>
    ),

    // Language toggle
    english: "ENGLISH",
    spanish: "SPANISH",

    // View toggle
    list: "LIST",
    carousel: "CAROUSEL",

    // Navigation
    previousLink: "Previous link",
    nextLink: "Next link",
    launchApp: "Launch app",
    subscribe: "Subscribe",
    buyApps: "Buy apps",

    // Link cards
    noSabosTitle: "No Sabos",
    noSabosDescription:
      "Your personal language tutor. Learn and explore new languages using intelligent tools to help you practice.",
    rbeTitle: "Robots Building Education",
    rbeDescription:
      "Your personal coding tutor. Learn the foundations of software engineering quickly so you can start to leverage AI coding tools to build your ideas.",
    patreonTitle: "Patreon",
    patreonDescription:
      "Pay once to own the apps or subscribe to unlock additional content on software engineering, business, finance and other updates.",

    // RBE Modal
    rbeModalTitle: "Robots Building Education",
    rbeModalDescription:
      "You'll use your secret key to sign in to your account. If you entered through social media, you only have to do this once.",
    copySecretKey: "Copy Secret Key",
    goToApp: "Go to app",
    close: "Close",

    // RoadmapCash Modal
    roadmapCashTitle: "Roadmap.Cash (free)",
    roadmapCashDescription:
      "A free personal financial planning tool. Just enter whatever data you want and we'll generate visual insights, plans and coaching to make progress in and achieve your financial goals.",
    roadmapCashModalTitle: "Roadmap.Cash",
    roadmapCashModalDescription:
      "You'll use your secret key to switch in to your account in the menu. If you entered through social media, you only have to do this once.",

    // Profile Modal
    customizeProfileTitle: "Customize Profile",
    username: "Username",
    enterUsername: "Enter your username",
    profilePictureUrl: "Profile Picture URL",
    profilePicturePlaceholder: "https://example.com/your-image.jpg",
    saveProfile: "Save Profile",
    secretKey: "Secret Key",
    secretKeyWarning:
      "Your secret key is your password to access decentralized apps. Keep it safe and never share it with anyone.",
    switchAccount: "Switch Account",
    pasteNsec: "Paste your nsec key here",
    switchAccountHelp:
      "Enter a different nsec to switch to another Nostr account",

    // Bitcoin Wallet
    bitcoinWallet: "Bitcoin Wallet",
    walletDescription1:
      "Your deposits help us create scholarships with learning.",
    walletDescription2:
      "When you answer questions in the apps, it sends it to recipients you choose.",
    loadingWallet: "Loading wallet...",
    secretKeyRequired: "Secret key required",
    nip07Warning:
      "You signed in with a browser extension, so we don't have access to your private key. To create a wallet, enter your nsec below.",
    enterNsec: "Enter your nsec1...",
    keyNotStored:
      "Your key is only used to create the wallet and is not stored.",
    createWallet: "Create Wallet",
    creatingWallet: "Creating wallet...",
    deposit: "Deposit",
    copyAddress: "Copy address",
    or: "or",
    lightningInstructions:
      "Use a compatible Lightning wallet to pay the invoice.",
    cashApp: "Cash App",
    generateNewQR: "Generate New QR",
    wallet: "Wallet",
    balance: "Balance",
    sats: "sats",

    // Toast messages
    noChanges: "No changes",
    enterUsernameOrPicture: "Please enter a username or profile picture URL",
    profileUpdated: "Profile updated",
    profileSaved: "Your profile has been saved to Nostr",
    error: "Error",
    failedUpdateProfile: "Failed to update profile",
    noSecretKey: "No secret key",
    usingExtension: "You're using a browser extension for signing",
    copied: "Copied!",
    secretKeyCopied: "Secret key copied to clipboard",
    failedCopy: "Failed to copy to clipboard",
    invalidKey: "Invalid key",
    enterValidNsec: "Please enter a valid nsec key",
    accountSwitched: "Account switched",
    loginSuccess: "Successfully logged in with new account",
    authFailed: "Invalid secret key or authentication failed",
    secretKeyRequiredToast: "Enter your nsec to create the wallet.",
    keyMustStartNsec: "Key must start with 'nsec'.",
    walletCreated: "Wallet created",
    walletReady: "Your Bitcoin wallet is now ready to use.",
    failedCreateWallet: "Failed to create wallet",
    failedDeposit: "Failed to initiate deposit",
    addressCopied: "Address copied",
    invoiceCopied: "Lightning invoice copied to clipboard.",
    language_en: "English",
    language_es: "Spanish",
    language_fr: "French",
    language_it: "Italian",
    language_hi: "Hindi",
    language_ja: "Japanese",
  },
  it: {
    roadmapCashTitle: "Roadmap.Cash (gratuito)",
    roadmapCashDescription:
      "Un piccolo strumento gratuito di pianificazione finanziaria personale. In fase di sviluppo iniziale.",
    roadmapCashModalTitle: "Roadmap.Cash",
    roadmapCashModalDescription:
      "Userai la tua chiave segreta per accedere al tuo account dal menu. Se hai effettuato l'accesso tramite i social media, dovrai farlo una sola volta.",

    // Welcome section
    welcome: "Benvenuto",
    customizeProfile: "Personalizza Profilo",
    profile: "Profilo",
    about: "Info",
    aboutTitle: "Info",
    aboutContent: (
      <div>
        <p style={{ marginBottom: 12 }}>Grazie per aver visitato il mio lavoro!</p>

        <p style={{ marginBottom: 12 }}>
          Mi chiamo Sheilfer. Ho studiato informatica e ho sempre avuto l'intenzione di
          imparare l'ingegneria del software per costruire tecnologia educativa.
          In generale, amo imparare, insegnare e l'istruzione, e credo che sia
          lì che le mie competenze trovano il miglior impiego.
        </p>

        <p style={{ marginBottom: 12 }}>
          <span style={{ color: "var(--links-accent-primary)" }}>
            Ho iniziato questa idea chiamata Robots Building Education nel 2015 perché
            sentivo che la tecnologia educativa era sempre indietro rispetto a ciò che
            Internet era capace di fare.
          </span>{" "}
          I videogiochi online e i forum di Internet catturavano davvero l'attenzione delle
          persone perché erano divertenti, coinvolgenti e persino addictivi.
        </p>

        <p style={{ marginBottom: 12 }}>
          E a quell'epoca, da studente universitario, mi sentivo frustrato di
          dedicare ore allo studio senza che ciò si riflettesse davvero finché
          non mi ero praticamente laureato, il che può richiedere fino a 20 anni!
          Sembrava che mancasse qualcosa.
        </p>

        <p style={{ marginBottom: 12 }}>
          <span style={{ color: "var(--links-accent-warm)" }}>
            Robots Building Education è l'idea che il tuo apprendimento abbia un
            impatto reale nel momento stesso in cui impari e progredisci.{" "}
          </span>
          Per ora dico che si tratta di "creare borse di studio con l'apprendimento" perché è
          un po' più facile immaginare cosa sta facendo la tecnologia sotto al cofano, ma la
          visione a lungo termine è che la tecnologia educativa funzioni in un modo che possa
          supportare in modo significativo scuole, insegnanti e studenti senza confini.
        </p>

        <p style={{ marginBottom: 12 }}>
          Pensalo come un modo in cui le proprietà di Internet finanziano le scuole
          in modo simile a come lo fanno le proprietà immobiliari.
        </p>

        <p style={{ marginBottom: 12 }}>
          Quindi potresti vedere alcune cose funzionare sulla mia piattaforma in modi che non
          hai mai visto prima. Alcune cose sono molto fluide e senza attrito per ciò che sta
          realmente accadendo, e questo è in parte perché sono stato instancabile nel creare
          questa idea e renderla un'esperienza reale per le persone.{" "}
          <span style={{ color: "var(--links-accent-pink)" }}>
            Credo sinceramente che il mondo dovrebbe funzionare così, perché non
            ha senso per me che miliardi di ore di lavoro nell'istruzione online
            quotidiana passino inosservate e non vengano registrate pubblicamente.
          </span>
        </p>

        <p style={{ marginBottom: 12 }}>
          Quindi ancora una volta, grazie per aver visitato il mio lavoro! Significa
          davvero molto per me.
        </p>
      </div>
    ),

    // Language toggle
    english: "INGLESE",
    spanish: "SPAGNOLO",
    italian: "ITALIANO",

    // View toggle
    list: "LISTA",
    carousel: "CAROSELLO",

    // Navigation
    previousLink: "Link precedente",
    nextLink: "Link successivo",
    launchApp: "Apri app",
    subscribe: "Abbonati",
    buyApps: "Acquista app",

    // Link cards
    noSabosTitle: "No Sabos",
    noSabosDescription:
      "Il tuo tutor personale di lingue. Impara ed esplora nuove lingue usando strumenti intelligenti per aiutarti a praticare.",
    rbeTitle: "Robots Building Education",
    rbeDescription:
      "Il tuo tutor personale di programmazione. Impara rapidamente i fondamenti dell'ingegneria del software per iniziare a sfruttare gli strumenti di programmazione AI e costruire le tue idee.",
    patreonTitle: "Patreon",
    patreonDescription:
      "Paga una volta per possedere le app o abbonati per sbloccare contenuti aggiuntivi su ingegneria del software, affari, finanza e altri aggiornamenti.",

    // RBE Modal
    rbeModalTitle: "Robots Building Education",
    rbeModalDescription:
      "Userai la tua chiave segreta per accedere al tuo account. Se hai effettuato l'accesso tramite i social media, dovrai farlo una sola volta.",
    copySecretKey: "Copia Chiave Segreta",
    goToApp: "Vai all'app",
    close: "Chiudi",

    // Profile Modal
    customizeProfileTitle: "Personalizza Profilo",
    username: "Nome utente",
    enterUsername: "Inserisci il tuo nome utente",
    profilePictureUrl: "URL Foto Profilo",
    profilePicturePlaceholder: "https://esempio.com/tua-immagine.jpg",
    saveProfile: "Salva Profilo",
    secretKey: "Chiave Segreta",
    secretKeyWarning:
      "La tua chiave segreta è la tua password per accedere alle app decentralizzate. Conservala al sicuro e non condividerla mai con nessuno.",
    switchAccount: "Cambia Account",
    pasteNsec: "Incolla la tua chiave nsec qui",
    switchAccountHelp:
      "Inserisci un nsec diverso per passare a un altro account Nostr",

    // Bitcoin Wallet
    bitcoinWallet: "Portafoglio Bitcoin",
    walletDescription1:
      "I tuoi depositi ci aiutano a creare borse di studio con l'apprendimento.",
    walletDescription2:
      "Quando rispondi alle domande nelle app, viene inviato ai destinatari che scegli.",
    loadingWallet: "Caricamento portafoglio...",
    secretKeyRequired: "Chiave segreta richiesta",
    nip07Warning:
      "Hai effettuato l'accesso con un'estensione del browser, quindi non abbiamo accesso alla tua chiave privata. Per creare un portafoglio, inserisci il tuo nsec qui sotto.",
    enterNsec: "Inserisci il tuo nsec1...",
    keyNotStored:
      "La tua chiave viene usata solo per creare il portafoglio e non viene salvata.",
    createWallet: "Crea Portafoglio",
    creatingWallet: "Creazione portafoglio...",
    deposit: "Deposita",
    copyAddress: "Copia indirizzo",
    or: "o",
    lightningInstructions:
      "Usa un portafoglio Lightning compatibile per pagare la fattura.",
    cashApp: "Cash App",
    generateNewQR: "Genera Nuovo QR",
    wallet: "Portafoglio",
    balance: "Saldo",
    sats: "sats",

    // Toast messages
    noChanges: "Nessuna modifica",
    enterUsernameOrPicture:
      "Inserisci un nome utente o l'URL della foto profilo",
    profileUpdated: "Profilo aggiornato",
    profileSaved: "Il tuo profilo è stato salvato su Nostr",
    error: "Errore",
    failedUpdateProfile: "Aggiornamento profilo non riuscito",
    noSecretKey: "Nessuna chiave segreta",
    usingExtension: "Stai usando un'estensione del browser per firmare",
    copied: "Copiato!",
    secretKeyCopied: "Chiave segreta copiata negli appunti",
    failedCopy: "Copia negli appunti non riuscita",
    invalidKey: "Chiave non valida",
    enterValidNsec: "Inserisci una chiave nsec valida",
    accountSwitched: "Account cambiato",
    loginSuccess: "Accesso effettuato con successo con il nuovo account",
    authFailed: "Chiave segreta non valida o autenticazione fallita",
    secretKeyRequiredToast: "Inserisci il tuo nsec per creare il portafoglio.",
    keyMustStartNsec: "La chiave deve iniziare con 'nsec'.",
    walletCreated: "Portafoglio creato",
    walletReady: "Il tuo portafoglio Bitcoin è ora pronto per l'uso.",
    failedCreateWallet: "Creazione portafoglio non riuscita",
    failedDeposit: "Avvio deposito non riuscito",
    addressCopied: "Indirizzo copiato",
    invoiceCopied: "Fattura Lightning copiata negli appunti.",
    language_en: "Inglese",
    language_es: "Spagnolo",
    language_fr: "Francese",
    language_it: "Italiano",
    language_hi: "Hindi",
    language_ja: "Giapponese",
  },
  es: {
    roadmapCashTitle: "Roadmap.Cash (gratis)",
    roadmapCashDescription:
      "Una herramienta pequeña y gratuita de planificación financiera personal. En fase temprana de desarrollo.",
    roadmapCashModalTitle: "Roadmap.Cash",
    roadmapCashModalDescription:
      "Usarás tu clave secreta para acceder a tu cuenta desde el menú. Si entraste a través de redes sociales, solo tendrás que hacerlo una vez.",

    // Welcome section
    welcome: "Bienvenido",
    customizeProfile: "Personalizar Perfil",
    profile: "Perfil",
    about: "Acerca de",
    aboutTitle: "Acerca de",
    aboutContent: (
      <div>
        <p style={{ marginBottom: 12 }}>¡Gracias por revisar mi trabajo!</p>

        <p style={{ marginBottom: 12 }}>
          Me llamo Sheilfer. Estudié informática y siempre tuve la intención de
          aprender ingeniería de software para construir tecnología educativa.
          En general, amo aprender, enseñar y la educación, y creo que ahí es
          donde mejor se aprovechan mis habilidades.
        </p>

        <p style={{ marginBottom: 12 }}>
          <span style={{ color: "var(--links-accent-primary)" }}>
            Empecé esta idea llamada Robots Building Education en 2015 porque
            sentía que la tecnología educativa siempre iba por detrás de lo que
            Internet era capaz de hacer.
          </span>{" "}
          Los videojuegos en línea y los foros de Internet realmente captaban la
          atención de la gente porque eran divertidos, envolventes e incluso
          adictivos.
        </p>

        <p style={{ marginBottom: 12 }}>
          Y en aquel entonces, como estudiante universitario, me frustraba
          dedicar horas a mis estudios y que eso realmente no se viera reflejado
          hasta prácticamente graduarme de la universidad, ¡lo cual puede tardar
          hasta 20 años! Sentía que faltaba algo.
        </p>

        <p style={{ marginBottom: 12 }}>
          <span style={{ color: "var(--links-accent-warm)" }}>
            Robots Building Education es la idea de que tu aprendizaje tenga un
            impacto real en el mismo momento de aprender y progresar.{" "}
          </span>
          Por ahora digo que es “crear becas con el aprendizaje” porque así es
          más fácil imaginar lo que la tecnología está haciendo por debajo del
          capó, pero la visión a largo plazo es que la tecnología educativa
          funcione de una manera que pueda apoyar de forma significativa a
          escuelas, docentes y estudiantes sin fronteras.
        </p>

        <p style={{ marginBottom: 12 }}>
          Piénsalo como una manera en la que las propiedades de Internet
          financian a las escuelas de forma similar a como lo hacen las
          propiedades inmobiliarias.
        </p>

        <p style={{ marginBottom: 12 }}>
          Así que quizá veas cosas en mi plataforma que funcionan de formas que
          nunca habías visto. Algunas partes son muy fluidas y sin fricción para
          lo que realmente está ocurriendo, y eso se debe en parte a que he sido
          incansable al crear esta idea y convertirla en una experiencia real
          para las personas.{" "}
          <span style={{ color: "var(--links-accent-pink)" }}>
            Sinceramente creo que así debería funcionar el mundo, porque no
            tiene sentido que miles de millones de horas de trabajo en educación
            en línea pasen desapercibidas.
          </span>
        </p>

        <p style={{ marginBottom: 12 }}>
          Así que, de nuevo, ¡gracias por revisar mi trabajo! De verdad
          significa mucho para mí.
        </p>
      </div>
    ),

    // Language toggle
    english: "INGLES",
    spanish: "ESPANOL",

    // View toggle
    list: "LISTA",
    carousel: "CARRUSEL",

    // Navigation
    previousLink: "Enlace anterior",
    nextLink: "Siguiente enlace",
    launchApp: "Abrir app",
    subscribe: "Suscribirse",
    buyApps: "Comprar apps",

    // Link cards
    noSabosTitle: "No Sabos",
    noSabosDescription:
      "Tu tutor personal de idiomas. Aprende y explora nuevos idiomas usando herramientas inteligentes que te ayudan a practicar.",
    rbeTitle: "Robots Building Education",
    rbeDescription:
      "Tu tutor personal de programación. Aprende rápidamente los fundamentos de la ingeniería de software para que puedas empezar a aprovechar las herramientas de programación con IA y construir tus ideas.",
    patreonTitle: "Patreon",
    patreonDescription:
      "Paga una vez para tener las apps o suscríbete para desbloquear contenido adicional sobre ingeniería de software, negocios, finanzas y otras novedades.",

    // RBE Modal
    rbeModalTitle: "Robots Building Education",
    rbeModalDescription:
      "Usaras tu clave secreta para iniciar sesion en tu cuenta. Si entraste por redes sociales, solo tienes que hacer esto una vez.",
    copySecretKey: "Copiar Clave Secreta",
    goToApp: "Ir a la app",
    close: "Cerrar",

    // Profile Modal
    customizeProfileTitle: "Personalizar Perfil",
    username: "Nombre de usuario",
    enterUsername: "Ingresa tu nombre de usuario",
    profilePictureUrl: "URL de Foto de Perfil",
    profilePicturePlaceholder: "https://ejemplo.com/tu-imagen.jpg",
    saveProfile: "Guardar Perfil",
    secretKey: "Clave Secreta",
    secretKeyWarning:
      "Tu clave secreta es tu contrasena para acceder a apps descentralizadas. Guardala de forma segura y nunca la compartas con nadie.",
    switchAccount: "Cambiar Cuenta",
    pasteNsec: "Pega tu clave nsec aqui",
    switchAccountHelp:
      "Ingresa un nsec diferente para cambiar a otra cuenta de Nostr",

    // Bitcoin Wallet
    bitcoinWallet: "Billetera Bitcoin",
    walletDescription1:
      "Tus depositos nos ayudan a crear becas de aprendizaje.",
    walletDescription2:
      "Cuando respondes preguntas en las apps, se envia a los destinatarios que elijas.",
    loadingWallet: "Cargando billetera...",
    secretKeyRequired: "Clave secreta requerida",
    nip07Warning:
      "Iniciaste sesion con una extension del navegador, por lo que no tenemos acceso a tu clave privada. Para crear una billetera, ingresa tu nsec abajo.",
    enterNsec: "Ingresa tu nsec1...",
    keyNotStored:
      "Tu clave solo se usa para crear la billetera y no se almacena.",
    createWallet: "Crear Billetera",
    creatingWallet: "Creando billetera...",
    deposit: "Depositar",
    copyAddress: "Copiar direccion",
    or: "o",
    lightningInstructions:
      "Usa una billetera Lightning compatible para pagar la factura.",
    cashApp: "Cash App",
    generateNewQR: "Generar Nuevo QR",
    wallet: "Billetera",
    balance: "Saldo",
    sats: "sats",

    // Toast messages
    noChanges: "Sin cambios",
    enterUsernameOrPicture:
      "Por favor ingresa un nombre de usuario o URL de foto de perfil",
    profileUpdated: "Perfil actualizado",
    profileSaved: "Tu perfil ha sido guardado en Nostr",
    error: "Error",
    failedUpdateProfile: "Error al actualizar el perfil",
    noSecretKey: "Sin clave secreta",
    usingExtension: "Estas usando una extension del navegador para firmar",
    copied: "Copiado!",
    secretKeyCopied: "Clave secreta copiada al portapapeles",
    failedCopy: "Error al copiar al portapapeles",
    invalidKey: "Clave invalida",
    enterValidNsec: "Por favor ingresa una clave nsec valida",
    accountSwitched: "Cuenta cambiada",
    loginSuccess: "Sesion iniciada exitosamente con la nueva cuenta",
    authFailed: "Clave secreta invalida o error de autenticacion",
    secretKeyRequiredToast: "Ingresa tu nsec para crear la billetera.",
    keyMustStartNsec: "La clave debe comenzar con 'nsec'.",
    walletCreated: "Billetera creada",
    walletReady: "Tu billetera Bitcoin esta lista para usar.",
    failedCreateWallet: "Error al crear la billetera",
    failedDeposit: "Error al iniciar el deposito",
    addressCopied: "Direccion copiada",
    invoiceCopied: "Factura Lightning copiada al portapapeles.",
    language_en: "Inglés",
    language_es: "Español",
    language_fr: "Francés",
    language_it: "Italiano",
    language_hi: "Hindi",
    language_ja: "Japonés",
  },
};

linksPageTranslations.pt = {
  ...LINKS_PAGE_PT_STATIC,
  aboutContent: (
    <div>
      <p style={{ marginBottom: 12 }}>Obrigado por conferir o meu trabalho!</p>

      <p style={{ marginBottom: 12 }}>
        Meu nome é Sheilfer. Estudei ciência da computação e sempre quis
        aprender engenharia de software para construir tecnologia educacional.
        Em geral, amo aprender, ensinar e a educação, e acredito que é aí que
        minhas habilidades são mais úteis.
      </p>

      <p style={{ marginBottom: 12 }}>
        <span style={{ color: "var(--links-accent-primary)" }}>
          Comecei esta ideia chamada Robots Building Education em 2015 porque
          sentia que a tecnologia educacional estava sempre atrás do que a
          internet já era capaz de fazer.
        </span>{" "}
        Jogos on-line e fóruns realmente prendiam a atenção das pessoas porque
        eram divertidos, envolventes e até viciantes.
      </p>

      <p style={{ marginBottom: 12 }}>
        E naquela época, como estudante universitário, eu me sentia frustrado
        por dedicar horas aos estudos sem ver isso refletido de verdade até
        praticamente terminar a faculdade, algo que pode levar até 20 anos.
        Parecia que faltava alguma coisa.
      </p>

      <p style={{ marginBottom: 12 }}>
        <span style={{ color: "var(--links-accent-warm)" }}>
          Robots Building Education é a ideia de que a sua aprendizagem tem
          impacto real no momento em que você aprende e progride.{" "}
        </span>
        Por enquanto, digo que é &quot;criar bolsas de estudo com a
        aprendizagem&quot; porque é mais fácil imaginar o que a tecnologia está
        fazendo por trás dos bastidores, mas a visão de longo prazo é fazer a
        tecnologia educacional funcionar de um jeito que possa apoiar, de forma
        significativa, escolas, professores e estudantes sem fronteiras.
      </p>

      <p style={{ marginBottom: 12 }}>
        Pense nisso como uma forma de fazer propriedades da internet
        financiarem escolas de maneira parecida com os imóveis.
      </p>

      <p style={{ marginBottom: 12 }}>
        Então você pode ver algumas coisas funcionando na minha plataforma de
        um jeito que talvez nunca tenha visto antes. Algumas partes são bem
        fluidas e sem atrito para o que está realmente acontecendo, e isso
        acontece em parte porque fui incansável para transformar essa ideia em
        uma experiência real para as pessoas.{" "}
        <span style={{ color: "var(--links-accent-pink)" }}>
          Eu realmente acredito que é assim que o mundo deveria funcionar,
          porque não faz sentido para mim que bilhões de horas de trabalho na
          educação on-line do dia a dia passem despercebidas e sem registro
          público.
        </span>
      </p>

      <p style={{ marginBottom: 12 }}>
        Então, mais uma vez, obrigado por conferir o meu trabalho! Isso
        sinceramente significa muito para mim.
      </p>
    </div>
  ),
};

linksPageTranslations.hi = {
  ...LINKS_PAGE_HI_STATIC,
  aboutContent: (
    <div>
      <p style={{ marginBottom: 12 }}>मेरे काम को देखने के लिए धन्यवाद!</p>

      <p style={{ marginBottom: 12 }}>
        मेरा नाम Sheilfer है। मैंने कंप्यूटर साइंस पढ़ी और हमेशा सॉफ़्टवेयर
        इंजीनियरिंग सीखकर शिक्षा तकनीक बनाना चाहा। सामान्य तौर पर मुझे सीखना,
        सिखाना और शिक्षा बेहद प्रिय है, और मुझे लगता है कि मेरी क्षमताएं वहीं
        सबसे अच्छे से काम आती हैं।
      </p>

      <p style={{ marginBottom: 12 }}>
        <span style={{ color: "var(--links-accent-primary)" }}>
          मैंने 2015 में Robots Building Education का विचार इसलिए शुरू किया
          क्योंकि मुझे लगा कि शिक्षा तकनीक हमेशा इंटरनेट की असली क्षमता से पीछे
          रह जाती है।
        </span>{" "}
        ऑनलाइन गेम और इंटरनेट फ़ोरम लोगों का ध्यान खींचते थे क्योंकि वे मज़ेदार,
        आकर्षक और कभी-कभी लत लगाने वाले भी होते थे।
      </p>

      <p style={{ marginBottom: 12 }}>
        उस समय, एक कॉलेज छात्र के रूप में, मैं निराश होता था कि मैं पढ़ाई में
        घंटों लगाता हूँ लेकिन उसका असर तभी दिखता है जब लगभग डिग्री पूरी होने को
        आती है, और इसमें 20 साल तक लग सकते हैं। मुझे लगता था कि कुछ कमी है।
      </p>

      <p style={{ marginBottom: 12 }}>
        <span style={{ color: "var(--links-accent-warm)" }}>
          Robots Building Education इस विचार पर आधारित है कि सीखने और आगे बढ़ने
          के उसी क्षण आपकी शिक्षा का वास्तविक प्रभाव होना चाहिए।{" "}
        </span>
        अभी मैं इसे “सीखने के माध्यम से छात्रवृत्तियां बनाना” कहता हूँ क्योंकि
        इससे यह समझना आसान हो जाता है कि तकनीक पर्दे के पीछे क्या कर रही है,
        लेकिन दीर्घकालिक दृष्टि यह है कि शिक्षा तकनीक ऐसे काम करे कि वह स्कूलों,
        शिक्षकों और छात्रों का सीमाओं से परे अर्थपूर्ण समर्थन कर सके।
      </p>

      <p style={{ marginBottom: 12 }}>
        इसे ऐसे समझें जैसे इंटरनेट की संपत्तियां स्कूलों को उसी तरह सहयोग दें
        जैसे भौतिक संपत्तियां करती हैं।
      </p>

      <p style={{ marginBottom: 12 }}>
        इसलिए आप मेरी प्लेटफ़ॉर्म पर कुछ चीज़ें ऐसे काम करती देख सकते हैं जैसी
        आपने पहले कभी न देखी हों। कई चीज़ें वास्तविकता की तुलना में बहुत सहज और
        सरल लगती हैं, और इसका एक कारण यह है कि मैं इस विचार को वास्तविक अनुभव
        बनाने के लिए लगातार लगा रहा हूँ।{" "}
        <span style={{ color: "var(--links-accent-pink)" }}>
          मुझे सच में विश्वास है कि दुनिया को ऐसे ही काम करना चाहिए, क्योंकि
          रोज़मर्रा की ऑनलाइन शिक्षा में लगने वाले अरबों घंटों का सार्वजनिक रूप
          से अनदेखा रह जाना मुझे समझ में नहीं आता।
        </span>
      </p>

      <p style={{ marginBottom: 12 }}>
        फिर से, मेरे काम को देखने के लिए धन्यवाद। यह मेरे लिए सचमुच बहुत मायने
        रखता है।
      </p>
    </div>
  ),
};

linksPageTranslations.fr = {
  ...linksPageTranslations.en,
  welcome: "Bienvenue",
  customizeProfile: "Personnaliser le profil",
  profile: "Profil",
  about: "A propos",
  aboutTitle: "A propos",
  aboutContent: (
    <div>
      <p style={{ marginBottom: 12 }}>Merci de decouvrir mon travail !</p>

      <p style={{ marginBottom: 12 }}>
        Je m'appelle Sheilfer. J'ai etudie l'informatique et j'ai toujours
        voulu apprendre l'ingenierie logicielle pour construire des technologies
        educatives. J'aime apprendre, enseigner et l'education, et je crois que
        c'est la que mes competences sont les plus utiles.
      </p>

      <p style={{ marginBottom: 12 }}>
        <span style={{ color: "var(--links-accent-primary)" }}>
          J'ai lance l'idee Robots Building Education en 2015 parce que je
          trouvais que la technologie educative etait toujours en retard sur ce
          qu'Internet permettait deja.
        </span>{" "}
        Les jeux en ligne et les forums captaient l'attention parce qu'ils
        etaient amusants, engageants et parfois meme addictifs.
      </p>

      <p style={{ marginBottom: 12 }}>
        A l'epoque, en tant qu'etudiant, j'etais frustre de consacrer des
        heures a mes etudes sans que cela se voie vraiment avant la fin du
        parcours universitaire, ce qui peut prendre jusqu'a 20 ans. Il manquait
        quelque chose.
      </p>

      <p style={{ marginBottom: 12 }}>
        <span style={{ color: "var(--links-accent-warm)" }}>
          Robots Building Education est l'idee que ton apprentissage peut avoir
          un impact reel au moment meme ou tu apprends et progresses.{" "}
        </span>
        Pour l'instant, je parle de "creer des bourses avec l'apprentissage"
        parce que c'est plus facile a imaginer, mais la vision a long terme est
        de faire fonctionner la technologie educative d'une maniere qui soutient
        reellement les ecoles, les enseignants et les eleves sans frontieres.
      </p>

      <p style={{ marginBottom: 12 }}>
        Pense-le comme une facon pour les proprietes Internet de financer les
        ecoles, un peu comme le font les proprietes immobilieres.
      </p>

      <p style={{ marginBottom: 12 }}>
        Tu verras donc peut-etre des choses fonctionner sur ma plateforme d'une
        maniere inhabituelle. Certaines experiences semblent tres fluides par
        rapport a ce qui se passe reellement, en partie parce que je travaille
        sans relache a rendre cette idee concrete pour les gens.{" "}
        <span style={{ color: "var(--links-accent-pink)" }}>
          Je crois sincerement que le monde devrait fonctionner ainsi, car cela
          n'a pas de sens que des milliards d'heures de travail dans l'education
          en ligne quotidienne passent inapercues.
        </span>
      </p>

      <p style={{ marginBottom: 12 }}>
        Encore merci de prendre le temps de decouvrir mon travail. Cela compte
        vraiment beaucoup pour moi.
      </p>
    </div>
  ),
  english: "ANGLAIS",
  spanish: "ESPAGNOL",
  french: "FRANCAIS",
  italian: "ITALIEN",
  list: "LISTE",
  carousel: "CARROUSEL",
  previousLink: "Lien precedent",
  nextLink: "Lien suivant",
  launchApp: "Ouvrir l'app",
  subscribe: "S'abonner",
  buyApps: "Acheter les apps",
  noSabosTitle: "No Sabos",
  noSabosDescription:
    "Ton tuteur personnel de langues. Apprends et explore de nouvelles langues avec des outils intelligents pour t'aider a pratiquer.",
  rbeDescription:
    "Ton tuteur personnel de programmation. Apprends rapidement les bases de l'ingenierie logicielle pour utiliser les outils de code avec IA et construire tes idees.",
  patreonDescription:
    "Paie une fois pour posseder les apps ou abonne-toi pour debloquer du contenu sur l'ingenierie logicielle, les affaires, la finance et d'autres mises a jour.",
  rbeModalDescription:
    "Tu utiliseras ta cle secrete pour te connecter a ton compte. Si tu es arrive par les reseaux sociaux, tu ne devras le faire qu'une seule fois.",
  copySecretKey: "Copier la cle secrete",
  goToApp: "Aller a l'app",
  close: "Fermer",
  roadmapCashTitle: "Roadmap.Cash (gratuit)",
  roadmapCashDescription:
    "Un outil gratuit de planification financiere personnelle. Entre les donnees que tu veux et nous genererons des analyses, plans et conseils pour progresser vers tes objectifs financiers.",
  roadmapCashModalDescription:
    "Tu utiliseras ta cle secrete pour changer de compte depuis le menu. Si tu es arrive par les reseaux sociaux, tu ne devras le faire qu'une seule fois.",
  customizeProfileTitle: "Personnaliser le profil",
  username: "Nom d'utilisateur",
  enterUsername: "Entre ton nom d'utilisateur",
  profilePictureUrl: "URL de la photo de profil",
  profilePicturePlaceholder: "https://exemple.com/ton-image.jpg",
  saveProfile: "Enregistrer le profil",
  secretKey: "Cle secrete",
  secretKeyWarning:
    "Ta cle secrete est ton mot de passe pour acceder aux apps decentralisees. Garde-la en securite et ne la partage jamais.",
  switchAccount: "Changer de compte",
  pasteNsec: "Colle ta cle nsec ici",
  switchAccountHelp: "Entre un autre nsec pour changer de compte Nostr",
  bitcoinWallet: "Portefeuille Bitcoin",
  walletDescription1:
    "Tes depots nous aident a creer des bourses grace a l'apprentissage.",
  walletDescription2:
    "Quand tu reponds aux questions dans les apps, cela l'envoie aux destinataires que tu choisis.",
  loadingWallet: "Chargement du portefeuille...",
  secretKeyRequired: "Cle secrete requise",
  nip07Warning:
    "Tu t'es connecte avec une extension de navigateur, donc nous n'avons pas acces a ta cle privee. Pour creer un portefeuille, entre ton nsec ci-dessous.",
  enterNsec: "Entre ton nsec1...",
  keyNotStored:
    "Ta cle sert seulement a creer le portefeuille et n'est pas stockee.",
  createWallet: "Creer un portefeuille",
  creatingWallet: "Creation du portefeuille...",
  deposit: "Deposer",
  copyAddress: "Copier l'adresse",
  or: "ou",
  lightningInstructions:
    "Utilise un portefeuille Lightning compatible pour payer la facture.",
  generateNewQR: "Generer un nouveau QR",
  wallet: "Portefeuille",
  balance: "Solde",
  noChanges: "Aucun changement",
  enterUsernameOrPicture:
    "Entre un nom d'utilisateur ou une URL de photo de profil",
  profileUpdated: "Profil mis a jour",
  profileSaved: "Ton profil a ete enregistre sur Nostr",
  error: "Erreur",
  failedUpdateProfile: "Echec de la mise a jour du profil",
  noSecretKey: "Aucune cle secrete",
  usingExtension: "Tu utilises une extension de navigateur pour signer",
  copied: "Copie !",
  secretKeyCopied: "Cle secrete copiee dans le presse-papiers",
  failedCopy: "Echec de la copie",
  invalidKey: "Cle invalide",
  enterValidNsec: "Entre une cle nsec valide",
  accountSwitched: "Compte change",
  loginSuccess: "Connexion reussie avec le nouveau compte",
  authFailed: "Cle secrete invalide ou authentification echouee",
  secretKeyRequiredToast: "Entre ton nsec pour creer le portefeuille.",
  keyMustStartNsec: "La cle doit commencer par 'nsec'.",
  walletCreated: "Portefeuille cree",
  walletReady: "Ton portefeuille Bitcoin est pret.",
  failedCreateWallet: "Echec de creation du portefeuille",
  failedDeposit: "Echec du lancement du depot",
  addressCopied: "Adresse copiee",
  invoiceCopied: "Facture Lightning copiee dans le presse-papiers.",
  language_en: "Anglais",
  language_es: "Espagnol",
  language_fr: "Français",
  language_it: "Italien",
  language_hi: "Hindi",
  language_ja: "Japonais",
};

linksPageTranslations.ja = {
  ...linksPageTranslations.en,
  welcome: "ようこそ",
  customizeProfile: "プロフィールをカスタマイズ",
  profile: "プロフィール",
  about: "概要",
  aboutTitle: "概要",
  aboutContent: (
    <div>
      <p style={{ marginBottom: 12 }}>私の活動を見てくれてありがとうございます！</p>

      <p style={{ marginBottom: 12 }}>
        私はSheilferです。コンピューターサイエンスを学び、教育技術を作るために
        ソフトウェアエンジニアリングを身につけたいと考えてきました。学ぶこと、
        教えること、教育が好きで、そこに自分の力を一番活かせると信じています。
      </p>

      <p style={{ marginBottom: 12 }}>
        <span style={{ color: "var(--links-accent-primary)" }}>
          Robots Building Educationというアイデアは、教育技術がインターネットの可能性に
          追いついていないと感じた2015年に始めました。
        </span>{" "}
        オンラインゲームや掲示板は、楽しく、夢中になれて、人の注意を強く引きつけていました。
      </p>

      <p style={{ marginBottom: 12 }}>
        Robots Building Educationは、学習と進歩の瞬間に本当の影響が生まれるようにする
        という考えです。今は「学習で奨学金を作る」と表現していますが、長期的には
        学校、先生、学生を国境なく支えられる教育技術を目指しています。
      </p>

      <p style={{ marginBottom: 12 }}>
        改めて、私の活動を見てくれてありがとうございます。心から感謝しています。
      </p>
    </div>
  ),
  english: "英語",
  spanish: "スペイン語",
  list: "リスト",
  carousel: "カルーセル",
  previousLink: "前のリンク",
  nextLink: "次のリンク",
  launchApp: "アプリを開く",
  subscribe: "購読",
  buyApps: "アプリを購入",
  noSabosTitle: "No Sabos",
  noSabosDescription:
    "あなた専用の言語チューター。インテリジェントなツールで新しい言語を学び、練習できます。",
  rbeTitle: "Robots Building Education",
  rbeDescription:
    "あなた専用のコーディングチューター。ソフトウェアエンジニアリングの基礎を素早く学び、AIコーディングツールでアイデアを形にできます。",
  patreonTitle: "Patreon",
  patreonDescription:
    "一度支払ってアプリを所有するか、購読してソフトウェア工学、ビジネス、金融などの追加コンテンツを解放できます。",
  rbeModalTitle: "Robots Building Education",
  rbeModalDescription:
    "アカウントにサインインするにはシークレットキーを使います。SNS経由で入った場合も、一度だけで大丈夫です。",
  copySecretKey: "シークレットキーをコピー",
  goToApp: "アプリへ",
  close: "閉じる",
  roadmapCashTitle: "Roadmap.Cash（無料）",
  roadmapCashDescription:
    "個人向けの無料ファイナンシャルプランニングツールです。データを入力すると、目標達成に向けた可視化、計画、コーチングを生成します。",
  roadmapCashModalTitle: "Roadmap.Cash",
  roadmapCashModalDescription:
    "メニューからアカウントを切り替えるにはシークレットキーを使います。SNS経由で入った場合も一度だけで大丈夫です。",
  customizeProfileTitle: "プロフィールをカスタマイズ",
  username: "ユーザー名",
  enterUsername: "ユーザー名を入力",
  profilePictureUrl: "プロフィール画像URL",
  profilePicturePlaceholder: "https://example.com/your-image.jpg",
  saveProfile: "プロフィールを保存",
  secretKey: "シークレットキー",
  secretKeyWarning:
    "シークレットキーは分散型アプリにアクセスするためのパスワードです。安全に保管し、誰にも共有しないでください。",
  switchAccount: "アカウントを切り替え",
  pasteNsec: "nsecキーをここに貼り付け",
  switchAccountHelp: "別のNostrアカウントに切り替えるには別のnsecを入力します",
  bitcoinWallet: "Bitcoinウォレット",
  walletDescription1:
    "あなたの入金は学習による奨学金づくりを支援します。",
  walletDescription2:
    "アプリで問題に答えると、選んだ受取先へ送られます。",
  loadingWallet: "ウォレットを読み込み中...",
  secretKeyRequired: "シークレットキーが必要です",
  nip07Warning:
    "ブラウザ拡張機能でサインインしているため、秘密鍵にアクセスできません。ウォレットを作成するには下にnsecを入力してください。",
  enterNsec: "nsec1...を入力",
  keyNotStored: "キーはウォレット作成にのみ使われ、保存されません。",
  createWallet: "ウォレットを作成",
  creatingWallet: "ウォレットを作成中...",
  deposit: "入金",
  copyAddress: "アドレスをコピー",
  or: "または",
  lightningInstructions:
    "対応するLightningウォレットで請求書を支払ってください。",
  cashApp: "Cash App",
  generateNewQR: "新しいQRを生成",
  wallet: "ウォレット",
  balance: "残高",
  sats: "sats",
  noChanges: "変更はありません",
  enterUsernameOrPicture: "ユーザー名またはプロフィール画像URLを入力してください",
  profileUpdated: "プロフィールを更新しました",
  profileSaved: "プロフィールをNostrに保存しました",
  error: "エラー",
  failedUpdateProfile: "プロフィールの更新に失敗しました",
  noSecretKey: "シークレットキーがありません",
  usingExtension: "ブラウザ拡張機能で署名しています",
  copied: "コピーしました！",
  secretKeyCopied: "シークレットキーをクリップボードにコピーしました",
  failedCopy: "コピーに失敗しました",
  invalidKey: "無効なキー",
  enterValidNsec: "有効なnsecキーを入力してください",
  accountSwitched: "アカウントを切り替えました",
  loginSuccess: "新しいアカウントでログインしました",
  authFailed: "シークレットキーが無効、または認証に失敗しました",
  secretKeyRequiredToast: "ウォレットを作成するにはnsecを入力してください。",
  keyMustStartNsec: "キーは「nsec」で始まる必要があります。",
  walletCreated: "ウォレットを作成しました",
  walletReady: "Bitcoinウォレットの準備ができました。",
  failedCreateWallet: "ウォレットを作成できませんでした",
  failedDeposit: "入金を開始できませんでした",
  addressCopied: "アドレスをコピーしました",
  invoiceCopied: "Lightning請求書をクリップボードにコピーしました。",
  language_en: "英語",
  language_es: "スペイン語",
  language_fr: "フランス語",
  language_it: "イタリア語",
  language_hi: "ヒンディー語",
  language_ja: "日本語",
};
