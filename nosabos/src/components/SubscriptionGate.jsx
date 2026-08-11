import React, { useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LockIcon } from "@chakra-ui/icons";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  normalizeSupportLanguage,
} from "../constants/languages";
import { APP_SQUIRCLE_SHAPE } from "../theme";
import { useThemeStore } from "../useThemeStore";
import RandomCharacter from "./RandomCharacter";
import { SUBSCRIPTION_RECOVERY_EXPIRED_COPY } from "./subscriptionRecoveryCopy";
import { SUBSCRIPTION_PATREON_FLOW_COPY } from "./subscriptionPatreonFlowCopy";
import { SUBSCRIPTION_LEGACY_MIGRATION_COPY } from "./subscriptionLegacyMigrationCopy";

// Kept temporarily so the legacy passcode form can be restored without
// rebuilding it, but Patreon OAuth is now the only visible unlock path.
const SHOW_PASSCODE_UI = false;

const SUBSCRIBE_COPY = {
  en: {
    title: "Thanks for trying out my app!",
    subtitle: "Enter the membership passcode to unlock the rest of the app",
    benefitsHeading: "Becoming a member grants you",
    benefitLanguageApps:
      "Full access to the language learning app and a coding education app",
    benefitSubscriberContent:
      "A growing collection of subscriber content oriented around business, engineering and investing education content.",
    benefitScholarships:
      "Support the mission to create scholarships with learning.",
    recommended: "Recommended",
    appsOnlyTitle: "Apps only",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "Pay once for apps only",
    appsOnlyCta: "Pay once",
    annualTitle: "Annual",
    annualPrice: "$4/mo",
    annualDetail: "50% off",
    annualBilling: "Billed $48/year",
    annualCta: "Subscribe annually",
    monthlyTitle: "Monthly",
    monthlyPrice: "$8/mo",
    monthlyCta: "Subscribe monthly",
    passcodeHeading: "Enter passcode",
    passcodePlaceholder: "Passcode",
    emptyPasscode: "Enter the passcode",
    invalidPasscode: "Invalid passcode. Please try again.",
    verifying: "Verifying",
    submit: "Submit",
    patreonPrompt: "Already subscribed on Patreon?",
    connectPatreon: "Connect with Patreon",
    checkingPatreon: "Checking Patreon",
    patreonNotSubscribed:
      "We couldn't find an active paid membership for this Patreon account.",
    patreonOauthError:
      "We couldn't connect your Patreon account. Please try again.",
    patreonUnavailable: "Patreon login is not available yet.",
  },
  es: {
    title: "¡Gracias por probar mi app!",
    subtitle:
      "Ingresa el código de membresía para desbloquear el resto de la app",
    benefitsHeading: "Al hacerte miembro obtienes",
    benefitLanguageApps:
      "Acceso completo a la app de aprendizaje de idiomas y a una app de educación en programación",
    benefitSubscriberContent:
      "Una colección creciente de contenido para miembros sobre educación en negocios, ingeniería e inversión.",
    benefitScholarships:
      "Apoya la misión de crear becas mediante el aprendizaje.",
    recommended: "Recomendado",
    appsOnlyTitle: "Solo apps",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "Pago único solo por las apps",
    appsOnlyCta: "Pagar una vez",
    annualTitle: "Anual",
    annualPrice: "$4/mes",
    annualDetail: "50% de descuento",
    annualBilling: "Facturado a $48/año",
    annualCta: "Suscribirse anual",
    monthlyTitle: "Mensual",
    monthlyPrice: "$8/mes",
    monthlyCta: "Suscribirse mensual",
    passcodeHeading: "Ingresa el código",
    passcodePlaceholder: "Código de acceso",
    emptyPasscode: "Ingresa el código de acceso",
    invalidPasscode: "Código inválido. Inténtalo de nuevo.",
    verifying: "Verificando",
    submit: "Enviar",
    patreonPrompt: "¿Ya te suscribiste en Patreon?",
    connectPatreon: "Conectar con Patreon",
    checkingPatreon: "Comprobando Patreon",
    patreonNotSubscribed:
      "No encontramos una membresía de pago activa para esta cuenta de Patreon.",
    patreonOauthError:
      "No pudimos conectar tu cuenta de Patreon. Inténtalo de nuevo.",
    patreonUnavailable: "El acceso con Patreon aún no está disponible.",
  },
  pt: {
    title: "Obrigado por testar meu app!",
    subtitle: "Digite o código de membro para desbloquear o restante do app",
    benefitsHeading: "Ao se tornar membro, você recebe",
    benefitLanguageApps:
      "Acesso completo ao app de aprendizagem de idiomas e a um app de educação em programação",
    benefitSubscriberContent:
      "Uma coleção crescente de conteúdos para membros sobre educação em negócios, engenharia e investimentos.",
    benefitScholarships:
      "Apoie a missão de criar bolsas de estudo por meio da aprendizagem.",
    recommended: "Recomendado",
    appsOnlyTitle: "Somente apps",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "Pague uma vez somente pelos apps",
    appsOnlyCta: "Pagar uma vez",
    annualTitle: "Anual",
    annualPrice: "$4/mês",
    annualDetail: "50% de desconto",
    annualBilling: "Cobrado $48/ano",
    annualCta: "Assinar anual",
    monthlyTitle: "Mensal",
    monthlyPrice: "$8/mês",
    monthlyCta: "Assinar mensal",
    passcodeHeading: "Digite o código",
    passcodePlaceholder: "Código de acesso",
    emptyPasscode: "Digite o código de acesso",
    invalidPasscode: "Código inválido. Tente novamente.",
    verifying: "Verificando",
    submit: "Enviar",
    patreonPrompt: "Já assinou pelo Patreon?",
    connectPatreon: "Conectar com o Patreon",
    checkingPatreon: "Verificando o Patreon",
    patreonNotSubscribed:
      "Não encontramos uma assinatura paga ativa para esta conta do Patreon.",
    patreonOauthError:
      "Não foi possível conectar sua conta do Patreon. Tente novamente.",
    patreonUnavailable: "O acesso com o Patreon ainda não está disponível.",
  },
  it: {
    title: "Grazie per aver provato la mia app!",
    subtitle: "Inserisci il codice membro per sbloccare il resto dell'app",
    benefitsHeading: "Diventando membro ottieni",
    benefitLanguageApps:
      "Accesso completo all'app per imparare le lingue e a un'app di educazione alla programmazione",
    benefitSubscriberContent:
      "Una raccolta in crescita di contenuti per membri su business, ingegneria e investimenti.",
    benefitScholarships:
      "Sostieni la missione di creare borse di studio attraverso l'apprendimento.",
    recommended: "Consigliato",
    appsOnlyTitle: "Solo app",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "Paga una volta solo per le app",
    appsOnlyCta: "Paga una volta",
    annualTitle: "Annuale",
    annualPrice: "$4/mese",
    annualDetail: "50% di sconto",
    annualBilling: "Addebito di $48/anno",
    annualCta: "Abbonati annualmente",
    monthlyTitle: "Mensile",
    monthlyPrice: "$8/mese",
    monthlyCta: "Abbonati mensilmente",
    passcodeHeading: "Inserisci il codice",
    passcodePlaceholder: "Codice di accesso",
    emptyPasscode: "Inserisci il codice di accesso",
    invalidPasscode: "Codice non valido. Riprova.",
    verifying: "Verifica in corso",
    submit: "Invia",
    patreonPrompt: "Hai già un abbonamento su Patreon?",
    connectPatreon: "Collega Patreon",
    checkingPatreon: "Verifica di Patreon",
    patreonNotSubscribed:
      "Non abbiamo trovato un abbonamento a pagamento attivo per questo account Patreon.",
    patreonOauthError:
      "Non è stato possibile collegare il tuo account Patreon. Riprova.",
    patreonUnavailable: "L'accesso con Patreon non è ancora disponibile.",
  },
  fr: {
    title: "Merci d'avoir essayé mon appli !",
    subtitle: "Entrez le code membre pour débloquer le reste de l'appli",
    benefitsHeading: "Devenir membre vous donne",
    benefitLanguageApps:
      "Un accès complet à l'appli d'apprentissage des langues et à une appli d'éducation au code",
    benefitSubscriberContent:
      "Une collection croissante de contenus membres sur le business, l'ingénierie et l'investissement.",
    benefitScholarships:
      "Soutenez la mission visant à créer des bourses grâce à l'apprentissage.",
    recommended: "Recommandé",
    appsOnlyTitle: "Apps seulement",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "Payez une seule fois pour les apps",
    appsOnlyCta: "Payer une fois",
    annualTitle: "Annuel",
    annualPrice: "$4/mois",
    annualDetail: "50 % de remise",
    annualBilling: "Facturé $48/an",
    annualCta: "S'abonner annuel",
    monthlyTitle: "Mensuel",
    monthlyPrice: "$8/mois",
    monthlyCta: "S'abonner mensuel",
    passcodeHeading: "Entrez le code",
    passcodePlaceholder: "Code d'accès",
    emptyPasscode: "Entrez le code d'accès",
    invalidPasscode: "Code invalide. Réessayez.",
    verifying: "Vérification",
    submit: "Envoyer",
    patreonPrompt: "Déjà abonné sur Patreon ?",
    connectPatreon: "Connecter Patreon",
    checkingPatreon: "Vérification de Patreon",
    patreonNotSubscribed:
      "Nous n'avons trouvé aucun abonnement payant actif pour ce compte Patreon.",
    patreonOauthError:
      "Impossible de connecter votre compte Patreon. Réessayez.",
    patreonUnavailable: "La connexion Patreon n'est pas encore disponible.",
  },
  de: {
    title: "Danke, dass du meine App ausprobierst!",
    subtitle: "Gib den Mitgliedscode ein, um den Rest der App freizuschalten",
    benefitsHeading: "Als Mitglied bekommst du",
    benefitLanguageApps:
      "Vollen Zugriff auf die Sprachlern-App und eine App zum Programmierenlernen",
    benefitSubscriberContent:
      "Eine wachsende Sammlung von Mitgliederinhalten zu Business, Engineering und Investieren.",
    benefitScholarships:
      "Unterstütze die Mission, durch Lernen Stipendien zu schaffen.",
    recommended: "Empfohlen",
    appsOnlyTitle: "Nur Apps",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "Einmalig nur für die Apps zahlen",
    appsOnlyCta: "Einmal zahlen",
    annualTitle: "Jährlich",
    annualPrice: "$4/Monat",
    annualDetail: "50 % Rabatt",
    annualBilling: "$48/Jahr abgerechnet",
    annualCta: "Jährlich abonnieren",
    monthlyTitle: "Monatlich",
    monthlyPrice: "$8/Monat",
    monthlyCta: "Monatlich abonnieren",
    passcodeHeading: "Code eingeben",
    passcodePlaceholder: "Mitgliedscode",
    emptyPasscode: "Gib den Code ein",
    invalidPasscode: "Ungültiger Code. Bitte versuche es erneut.",
    verifying: "Wird geprüft",
    submit: "Senden",
    patreonPrompt: "Bereits über Patreon abonniert?",
    connectPatreon: "Mit Patreon verbinden",
    checkingPatreon: "Patreon wird geprüft",
    patreonNotSubscribed:
      "Für dieses Patreon-Konto wurde keine aktive bezahlte Mitgliedschaft gefunden.",
    patreonOauthError:
      "Dein Patreon-Konto konnte nicht verbunden werden. Bitte versuche es erneut.",
    patreonUnavailable: "Die Patreon-Anmeldung ist noch nicht verfügbar.",
  },
  ja: {
    title: "アプリを試してくれてありがとうございます！",
    subtitle: "メンバー用パスコードを入力して、アプリの残りを解除しましょう",
    benefitsHeading: "メンバーになると利用できます",
    benefitLanguageApps:
      "語学学習アプリとプログラミング教育アプリへのフルアクセス",
    benefitSubscriberContent:
      "ビジネス、エンジニアリング、投資教育に関するメンバー向けコンテンツの追加コレクション。",
    benefitScholarships: "学びを通じて奨学金を生み出す使命を支援します。",
    recommended: "おすすめ",
    appsOnlyTitle: "アプリのみ",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "アプリのみを一度払いで購入",
    appsOnlyCta: "一度払い",
    annualTitle: "年額",
    annualPrice: "$4/月",
    annualDetail: "50%オフ",
    annualBilling: "年額$48で請求",
    annualCta: "年額で登録",
    monthlyTitle: "月額",
    monthlyPrice: "$8/月",
    monthlyCta: "月額で登録",
    passcodeHeading: "パスコードを入力",
    passcodePlaceholder: "パスコード",
    emptyPasscode: "パスコードを入力してください",
    invalidPasscode: "パスコードが無効です。もう一度お試しください。",
    verifying: "確認中",
    submit: "送信",
    patreonPrompt: "Patreonですでに登録済みですか？",
    connectPatreon: "Patreonと連携",
    checkingPatreon: "Patreonを確認中",
    patreonNotSubscribed:
      "このPatreonアカウントの有効な有料メンバーシップが見つかりませんでした。",
    patreonOauthError:
      "Patreonアカウントに接続できませんでした。もう一度お試しください。",
    patreonUnavailable: "Patreonログインはまだ利用できません。",
  },
  hi: {
    title: "मेरे ऐप को आज़माने के लिए धन्यवाद!",
    subtitle: "बाकी ऐप अनलॉक करने के लिए सदस्यता पासकोड दर्ज करें",
    benefitsHeading: "सदस्य बनने पर आपको मिलता है",
    benefitLanguageApps:
      "भाषा सीखने वाले ऐप और कोडिंग शिक्षा ऐप का पूरा एक्सेस",
    benefitSubscriberContent:
      "बिज़नेस, इंजीनियरिंग और निवेश शिक्षा सामग्री पर केंद्रित बढ़ता हुआ सदस्य कंटेंट.",
    benefitScholarships:
      "सीखने के माध्यम से छात्रवृत्तियाँ बनाने के मिशन का समर्थन करें.",
    recommended: "अनुशंसित",
    appsOnlyTitle: "केवल ऐप्स",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "केवल ऐप्स के लिए एक बार भुगतान करें",
    appsOnlyCta: "एक बार भुगतान",
    annualTitle: "वार्षिक",
    annualPrice: "$4/माह",
    annualDetail: "50% छूट",
    annualBilling: "$48/वर्ष बिल किया जाएगा",
    annualCta: "वार्षिक सदस्यता",
    monthlyTitle: "मासिक",
    monthlyPrice: "$8/माह",
    monthlyCta: "मासिक सदस्यता",
    passcodeHeading: "पासकोड दर्ज करें",
    passcodePlaceholder: "पासकोड",
    emptyPasscode: "पासकोड दर्ज करें",
    invalidPasscode: "पासकोड अमान्य है. कृपया फिर कोशिश करें.",
    verifying: "जांच हो रही है",
    submit: "जमा करें",
    patreonPrompt: "क्या आपने Patreon पर पहले ही सदस्यता ली है?",
    connectPatreon: "Patreon से कनेक्ट करें",
    checkingPatreon: "Patreon की जांच हो रही है",
    patreonNotSubscribed:
      "इस Patreon खाते के लिए कोई सक्रिय सशुल्क सदस्यता नहीं मिली।",
    patreonOauthError:
      "आपका Patreon खाता कनेक्ट नहीं हो सका। कृपया फिर कोशिश करें।",
    patreonUnavailable: "Patreon लॉगिन अभी उपलब्ध नहीं है.",
  },
  ar: {
    title: "شكرًا إنك جرّبت تطبيقي!",
    subtitle: "اكتب كود العضوية عشان تفتح باقي التطبيق",
    benefitsHeading: "لما تبقى عضو هتاخد",
    benefitLanguageApps: "وصول كامل لتطبيق تعلّم اللغة وتطبيق تعليم البرمجة",
    benefitSubscriberContent:
      "مجموعة متزايدة من محتوى الأعضاء عن تعليم الأعمال والهندسة والاستثمار.",
    benefitScholarships: "ادعم رسالة إنشاء منح دراسية من خلال التعلّم.",
    recommended: "موصى به",
    appsOnlyTitle: "التطبيقات فقط",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "ادفع مرة واحدة للتطبيقات فقط",
    appsOnlyCta: "ادفع مرة واحدة",
    annualTitle: "سنوي",
    annualPrice: "$4/شهر",
    annualDetail: "خصم 50%",
    annualBilling: "تُدفع $48 سنويًا",
    annualCta: "اشترك سنويًا",
    monthlyTitle: "شهري",
    monthlyPrice: "$8/شهر",
    monthlyCta: "اشترك شهريًا",
    passcodeHeading: "اكتب الكود",
    passcodePlaceholder: "كود العضوية",
    emptyPasscode: "اكتب كود الدخول",
    invalidPasscode: "الكود غير صحيح. جرّب تاني.",
    verifying: "جارٍ التحقق",
    submit: "إرسال",
    patreonPrompt: "مشترك بالفعل عبر Patreon؟",
    connectPatreon: "الاتصال بـ Patreon",
    checkingPatreon: "جارٍ التحقق من Patreon",
    patreonNotSubscribed:
      "لم نعثر على عضوية مدفوعة نشطة لحساب Patreon ده.",
    patreonOauthError:
      "ما قدرناش نوصل حساب Patreon بتاعك. جرّب تاني.",
    patreonUnavailable: "تسجيل الدخول عبر Patreon غير متاح بعد.",
  },
  zh: {
    title: "感谢你试用我的应用！",
    subtitle: "输入会员通行码即可解锁应用的其余内容",
    benefitsHeading: "成为会员即可获得",
    benefitLanguageApps: "完整访问语言学习应用和编程教育应用",
    benefitSubscriberContent: "持续更新的会员内容，面向商业、工程和投资教育。",
    benefitScholarships: "支持通过学习创造奖学金机会的使命。",
    recommended: "推荐",
    appsOnlyTitle: "仅应用",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "一次性购买应用",
    appsOnlyCta: "一次性购买",
    annualTitle: "年度",
    annualPrice: "$4/月",
    annualDetail: "立省 50%",
    annualBilling: "每年收费 $48",
    annualCta: "年度订阅",
    monthlyTitle: "月度",
    monthlyPrice: "$8/月",
    monthlyCta: "月度订阅",
    passcodeHeading: "输入通行码",
    passcodePlaceholder: "通行码",
    emptyPasscode: "请输入通行码",
    invalidPasscode: "通行码无效，请重试。",
    verifying: "正在验证",
    submit: "提交",
    patreonPrompt: "已经在 Patreon 订阅了吗？",
    connectPatreon: "连接 Patreon",
    checkingPatreon: "正在检查 Patreon",
    patreonNotSubscribed: "未找到此 Patreon 账户的有效付费会员资格。",
    patreonOauthError: "无法连接你的 Patreon 账户，请重试。",
    patreonUnavailable: "Patreon 登录尚不可用。",
  },
};

export default function SubscriptionGate({
  appLanguage = "en",
  t = {},
  onSubmit,
  isSubmitting = false,
  error = "",
  onPatreonConnect,
  isPatreonChecking = false,
  isPatreonAvailable = true,
  patreonResult = "",
  patreonStatusError = "",
  onPatreonRefresh,
  onPatreonCheckout,
  isPatreonAwaiting = false,
  isLegacyPasscodeMigration = false,
  embedded = false,
}) {
  const lang = normalizeSupportLanguage(appLanguage, DEFAULT_SUPPORT_LANGUAGE);
  const copy = SUBSCRIBE_COPY[lang] || SUBSCRIBE_COPY.en;
  const flowCopy =
    SUBSCRIPTION_PATREON_FLOW_COPY[lang] ||
    SUBSCRIPTION_PATREON_FLOW_COPY.en;
  const migrationCopy =
    SUBSCRIPTION_LEGACY_MIGRATION_COPY[lang] ||
    SUBSCRIPTION_LEGACY_MIGRATION_COPY.en;
  const clarifyUsd = (text) =>
    lang === "en" ? text : text.replace(/(\$\d+(?:\.\d+)?)/g, "$1 USD");
  const isRtl = lang === "ar";
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const [value, setValue] = useState("");
  const [localError, setLocalError] = useState("");

  const invalidMessage =
    error ||
    localError ||
    t.invalid ||
    t.passcode?.invalid ||
    copy.invalidPasscode;
  const patreonFeedback =
    patreonStatusError === "replacement_expired" ||
    patreonStatusError === "replacement_state_changed"
      ? SUBSCRIPTION_RECOVERY_EXPIRED_COPY[lang] ||
        SUBSCRIPTION_RECOVERY_EXPIRED_COPY.en
      : patreonStatusError === "membership_not_active"
        ? copy.patreonNotSubscribed
        : patreonStatusError === "unavailable" ||
              patreonResult === "unavailable"
            ? copy.patreonUnavailable
            : patreonResult === "not_subscribed"
              ? copy.patreonNotSubscribed
              : [
                    "oauth_error",
                    "oauth_cancelled",
                    "state_error",
                    "link_conflict",
                  ].includes(patreonResult)
                ? copy.patreonOauthError
                : "";

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLocalError("");
    const normalized = (value || "").trim();
    if (!normalized) {
      setLocalError(copy.emptyPasscode);
      return;
    }
    await onSubmit?.(normalized, setLocalError);
  };

  const pricingOptions = [
    {
      id: "annual",
      title: flowCopy.membershipTitle,
      price: clarifyUsd(flowCopy.membershipPrice),
      recommended: flowCopy.annualRecommended,
      detail: clarifyUsd(flowCopy.annualValue),
      accent: "purple.300",
      hoverAccent: "purple.400",
      activeAccent: "purple.500",
      shadow: "#6b46c1",
      cta: flowCopy.membershipCta,
      usesPatreonFlow: true,
    },
  ];

  const pageBg = isLightTheme
    ? "radial-gradient(circle at 18% 18%, rgba(45, 212, 191, 0.12), transparent 28%), radial-gradient(circle at 84% 10%, rgba(251, 146, 60, 0.14), transparent 24%), #f8f1e7"
    : "radial-gradient(circle at 20% 15%, rgba(45, 212, 191, 0.18), transparent 28%), radial-gradient(circle at 82% 18%, rgba(168, 85, 247, 0.18), transparent 26%), #020617";
  const shellBg = isLightTheme ? "rgba(255, 250, 241, 0.97)" : "gray.900";
  const shellText = isLightTheme ? "#2f241b" : "gray.50";
  const shellBorder = isLightTheme
    ? "rgba(185, 156, 118, 0.32)"
    : "whiteAlpha.200";
  const shellShadow = isLightTheme
    ? "0 24px 80px rgba(97, 74, 47, 0.16)"
    : "0 24px 80px rgba(0,0,0,0.42)";
  const softPanelBg = isLightTheme
    ? "rgba(242, 234, 220, 0.82)"
    : "whiteAlpha.100";
  const mutedText = isLightTheme ? "#6f5b46" : "gray.200";
  const secondaryText = isLightTheme ? "#7c6955" : "gray.300";
  const inputBg = isLightTheme ? "rgba(247, 240, 229, 0.98)" : "gray.800";

  const renderPatreonAction = () =>
    patreonResult === "connected" ? (
      <Alert status="success" borderRadius="20px" alignItems="flex-start">
        <AlertIcon mt={1} />
        <Box flex="1">
          <Text fontWeight="bold">Patreon Connected!</Text>
          <Text fontSize="sm" mt={1}>
            Your Patreon subscription has been verified and unlocked. You can now access the full app.
          </Text>
        </Box>
      </Alert>
    ) : isPatreonAwaiting ? (
      <Alert status="info" borderRadius="20px" alignItems="flex-start">
        <AlertIcon mt={1} />
        <Box flex="1">
          <Text fontWeight="bold">{flowCopy.finishTitle}</Text>
          <Text fontSize="sm" mt={1}>{flowCopy.finishBody}</Text>
          <Stack mt={4} spacing={3}>
            <Button type="button" colorScheme="purple" onClick={onPatreonCheckout}>
              {flowCopy.openCheckout}
            </Button>
            <Button type="button" variant="outline" onClick={onPatreonRefresh} isLoading={isPatreonChecking} loadingText={copy.checkingPatreon}>
              {flowCopy.checkAgain}
            </Button>
          </Stack>
        </Box>
      </Alert>
    ) : (
      <Button
        type="button"
        w="100%"
        h="auto"
        py={isLegacyPasscodeMigration ? 5 : 3.5}
        bg={isLegacyPasscodeMigration ? "purple.400" : "#ff424d"}
        color="white"
        boxShadow={
          isLegacyPasscodeMigration
            ? "0px 4px 0px #6b46c1"
            : "0px 4px 0px #b92e37"
        }
        onClick={onPatreonConnect}
        isLoading={isPatreonChecking}
        loadingText={copy.checkingPatreon}
        isDisabled={!isPatreonAvailable}
        _hover={{
          bg: isLegacyPasscodeMigration ? "purple.500" : "#e93642",
          color: "white",
          transform: "translateY(-1px)",
        }}
        _active={{
          bg: isLegacyPasscodeMigration ? "purple.600" : "#cf2f39",
          color: "white",
          transform: "translateY(2px)",
          boxShadow: isLegacyPasscodeMigration
            ? "0px 2px 0px #553c9a"
            : "0px 2px 0px #9f2730",
        }}
      >
        {isLegacyPasscodeMigration
          ? migrationCopy.connectAction
          : copy.connectPatreon}
      </Button>
    );

  if (isLegacyPasscodeMigration) {
    return (
      <Box
        minH="100vh"
        bg={pageBg}
        color={shellText}
        dir={isRtl ? "rtl" : "ltr"}
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={{ base: 2, md: 4 }}
        py={{ base: 3, md: 8 }}
      >
        <Box
          bg={shellBg}
          borderWidth="1px"
          borderColor={shellBorder}
          borderRadius={{ base: "30px", md: "36px" }}
          style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
          p={{ base: 4, md: 7 }}
          maxW="620px"
          w="100%"
          boxShadow={shellShadow}
        >
          <VStack align="stretch" spacing={{ base: 5, md: 6 }}>
            <Box textAlign="center">
              <Box
                bg={softPanelBg}
                border="1px solid"
                borderColor={shellBorder}
                borderRadius="28px"
                style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
                px={4}
                py={1}
                w="fit-content"
                mx="auto"
                mb={4}
              >
                <RandomCharacter notSoRandomCharacter="31" width="92px" />
              </Box>
              <Text
                color="purple.400"
                fontSize="xs"
                fontWeight="black"
                letterSpacing="wide"
                textTransform="uppercase"
                mb={2}
              >
                {migrationCopy.eyebrow}
              </Text>
              <Heading size={{ base: "md", md: "lg" }}>
                {migrationCopy.title}
              </Heading>
            </Box>

            <Box
              bg={softPanelBg}
              border="1px solid"
              borderColor={shellBorder}
              borderRadius="28px"
              style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
              p={{ base: 5, md: 6 }}
            >
              <Text color={mutedText} fontSize={{ base: "sm", md: "md" }} lineHeight="tall">
                {migrationCopy.body}
              </Text>
              <Text color={shellText} fontSize="sm" fontWeight="bold" mt={4}>
                {migrationCopy.reassurance}
              </Text>
            </Box>

            {renderPatreonAction()}
            {patreonFeedback && (
              <Text
                role="alert"
                color={isLightTheme ? "#9f2d36" : "red.200"}
                fontSize="xs"
                textAlign="center"
              >
                {patreonFeedback}
              </Text>
            )}
          </VStack>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      minH={embedded ? "auto" : "100vh"}
      bg={embedded ? "transparent" : pageBg}
      color={shellText}
      dir={isRtl ? "rtl" : "ltr"}
      display={embedded ? "block" : "flex"}
      alignItems="center"
      justifyContent="center"
      px={embedded ? 0 : { base: 1, md: 4 }}
      py={embedded ? 0 : { base: 2, md: 8 }}
    >
      <Box
        as={embedded ? "div" : "form"}
        onSubmit={embedded ? undefined : handleSubmit}
        bg={embedded ? "transparent" : shellBg}
        borderWidth={embedded ? 0 : "1px"}
        borderColor={shellBorder}
        borderRadius={{ base: "30px", md: "36px" }}
        style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
        p={embedded ? 0 : { base: 3, md: 6 }}
        maxW="760px"
        w="100%"
        my={embedded ? 0 : { base: 0, md: 4 }}
        boxShadow={embedded ? "none" : shellShadow}
      >
        <VStack align="stretch" spacing={{ base: 4, md: 6 }}>
          {isPatreonAwaiting ? (
            <>
              {renderPatreonAction()}
              {patreonFeedback && (
                <Text
                  role="alert"
                  color={isLightTheme ? "#9f2d36" : "red.200"}
                  fontSize="xs"
                  textAlign="center"
                >
                  {patreonFeedback}
                </Text>
              )}
            </>
          ) : (
            <>
          <HStack
            align="center"
            spacing={{ base: 3, sm: 5 }}
            flexDirection={{ base: "column", sm: "row" }}
            textAlign={{ base: "center", sm: isRtl ? "right" : "left" }}
            display={embedded ? "none" : "flex"}
          >
            <Box
              bg={softPanelBg}
              border="1px solid"
              borderColor={shellBorder}
              borderRadius="28px"
              style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
              px={4}
              py={1}
              minW="110px"
              display="flex"
              justifyContent="center"
            >
              <RandomCharacter notSoRandomCharacter="31" width="92px" />
            </Box>
            <Box>
              <Heading size={{ base: "md", md: "lg" }} mb={2}>
                {copy.title}
              </Heading>
              <Text color={mutedText} fontSize={{ base: "12px", md: "xs" }}>
                {copy.subtitle}
              </Text>
            </Box>
          </HStack>

          <Box
            bg={softPanelBg}
            border="1px solid"
            borderColor={shellBorder}
            borderRadius="28px"
            style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
            p={{ base: 4, md: 5 }}
          >
            <Text fontWeight="bold" fontSize="sm" mb={3}>
              {copy.benefitsHeading}
            </Text>
            <Box
              as="ul"
              color={mutedText}
              fontSize={{ base: "xs", md: "sm" }}
              lineHeight="tall"
              pl={isRtl ? 0 : 5}
              pr={isRtl ? 5 : 0}
            >
              <Text as="li" mb={2}>
                {copy.benefitLanguageApps}
              </Text>
              <Text as="li" mb={2}>
                {copy.benefitSubscriberContent}
              </Text>
              <Text as="li">{copy.benefitScholarships}</Text>
            </Box>
          </Box>

          <SimpleGrid columns={1} spacing={3} maxW="520px" w="100%" mx="auto">
            {pricingOptions.map((option) => (
              <Box
                key={option.title}
                bg="transparent"
                border="1px solid"
                borderColor={option.accent}
                borderRadius="28px"
                style={{ cornerShape: APP_SQUIRCLE_SHAPE }}
                p={4}
                position="relative"
                display="flex"
                flexDirection="column"
                minH="230px"
              >
                {option.recommended && (
                  <Text
                    position="absolute"
                    top="-12px"
                    left="50%"
                    transform="translateX(-50%)"
                    bg={option.activeAccent}
                    color="white"
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="xs"
                    fontWeight="black"
                    lineHeight="short"
                    whiteSpace="nowrap"
                  >
                    {option.recommended}
                  </Text>
                )}
                <Text color={option.accent} fontWeight="black" fontSize="sm">
                  {option.title}
                </Text>
                <Text fontSize="2xl" fontWeight="black" mt={1}>
                  {option.price}
                </Text>
                {option.detail && (
                  <Text color={secondaryText} fontSize="sm" mt={1}>
                    {option.detail}
                  </Text>
                )}
                {option.billing && (
                  <Text color={secondaryText} fontSize="sm" mt={1}>
                    {option.billing}
                  </Text>
                )}
                <Box mt="auto" pt={4}>
                  <Button
                    as={option.href ? "a" : undefined}
                    href={option.href}
                    target={option.href ? "_blank" : undefined}
                    rel={option.href ? "noreferrer" : undefined}
                    type="button"
                    onClick={
                      option.usesPatreonFlow
                        ? () =>
                            isPatreonAwaiting
                              ? onPatreonCheckout?.()
                              : onPatreonConnect?.(option.id)
                        : undefined
                    }
                    w="100%"
                    size="md"
                    h="auto"
                    py={5}
                    isLoading={
                      option.usesPatreonFlow &&
                      !isPatreonAwaiting &&
                      isPatreonChecking
                    }
                    loadingText={copy.checkingPatreon}
                    isDisabled={
                      option.usesPatreonFlow && !isPatreonAvailable
                    }
                    bg={option.accent}
                    color="white"
                    boxShadow={`0px 4px 0px ${option.shadow}`}
                    _hover={{
                      bg: option.hoverAccent,
                      color: "white",
                      transform: "translateY(-1px)",
                    }}
                    _active={{
                      bg: option.activeAccent,
                      color: "white",
                      transform: "translateY(2px)",
                      boxShadow: `0px 2px 0px ${option.shadow}`,
                    }}
                  >
                    {option.cta}
                  </Button>
                </Box>
              </Box>
            ))}
          </SimpleGrid>

          {SHOW_PASSCODE_UI && (
            <Box>
              <Heading size="sm" mb={3}>
                {copy.passcodeHeading}
              </Heading>
              <Stack spacing={3}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <LockIcon color="gray.400" />
                  </InputLeftElement>

                  <Input
                    bg={inputBg}
                    borderColor={shellBorder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={copy.passcodePlaceholder}
                    autoComplete="off"
                    fontSize="16px"
                    color={shellText}
                  />
                </InputGroup>
                {(error || localError) && (
                  <Alert
                    status="error"
                    bg="red.900"
                    borderColor="red.700"
                    color="white"
                  >
                    <AlertIcon color="white" />
                    <Text fontSize="sm" color="white">
                      {invalidMessage}
                    </Text>
                  </Alert>
                )}
                <Button
                  colorScheme="teal"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  loadingText={copy.verifying}
                >
                  {copy.submit}
                </Button>
              </Stack>
            </Box>
          )}

          {patreonFeedback && (
            <Box pt={4} borderTop="1px solid" borderColor={shellBorder}>
              <Text
                role="alert"
                color={isLightTheme ? "#9f2d36" : "red.200"}
                fontSize="xs"
                textAlign="center"
              >
                {patreonFeedback}
              </Text>
            </Box>
          )}
            </>
          )}
        </VStack>
      </Box>
    </Box>
  );
}
