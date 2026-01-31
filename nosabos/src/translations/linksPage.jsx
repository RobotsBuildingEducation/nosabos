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
          <span style={{ color: "cyan" }}>
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
          <span style={{ color: "gold" }}>
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
          similar to housing properties do.
        </p>

        <p style={{ marginBottom: 12 }}>
          So you may see some things work on my platform in ways you’ve never
          seen before. Some stuff is pretty smooth and frictionless for what’s
          actually happening and that’s partially because I’ve been relentless
          in creating this idea and making it a real experience for people.{" "}
          <span style={{ color: "hotpink" }}>
            I genuinely believe this is how the world ought to work, because it
            doesn’t make sense to me that billions of hours of work in online
            education goes unnoticed.
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

    // Link cards
    noSabosTitle: "No Sabos",
    noSabosDescription: "Your personal language tutor.",
    rbeTitle: "Robots Building Education",
    rbeDescription: "Your personal coding tutor.",
    patreonTitle: "Patreon",
    patreonDescription:
      "Access premium engineering, financial and startup content.",

    // RBE Modal
    rbeModalTitle: "Robots Building Education",
    rbeModalDescription:
      "You'll use your secret key to sign in to your account. If you entered through social media, you only have to do this once.",
    copySecretKey: "Copy Secret Key",
    goToApp: "Go to app",
    close: "Close",

    // RoadmapCash Modal
    roadmapCashTitle: "Roadmap.Cash (beta)",
    roadmapCashDescription: "Your free personal financial planner.",
    roadmapCashModalTitle: "Roadmap.Cash",
    roadmapCashModalDescription:
      "You'll use your secret key to switch in to your account in the menu. If you entered through social media, you only have to do this once.",
    copySecretKey: "Copy Secret Key",
    goToApp: "Go to app",
    close: "Close",

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
  },
  es: {
    roadmapCashTitle: "Roadmap.Cash",
    roadmapCashDescription: "Tu planificador financiero personal gratuito",
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
          <span style={{ color: "cyan" }}>
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
          <span style={{ color: "gold" }}>
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
          <span style={{ color: "hotpink" }}>
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

    // Link cards
    noSabosTitle: "No Sabos",
    noSabosDescription: "Tu tutor personal de idiomas.",
    rbeTitle: "Robots Building Education",
    rbeDescription: "Tu tutor personal de programacion.",
    patreonTitle: "Patreon",
    patreonDescription:
      "Accede a contenido premium de ingenieria, finanzas y startups.",

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
  },
};
