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
import { useThemeStore } from "../useThemeStore";
import RandomCharacter from "./RandomCharacter";

const SUBSCRIBE_COPY = {
  en: {
    title: "Thanks for trying out my app!",
    subtitle: "Enter the membership passcode to unlock the rest of the app",
    benefitsHeading: "Becoming a member grants you",
    benefitLanguageApps:
      "Full access to the language learning app and a coding education app",
    benefitSubscriberContent:
      "A growing collection of subscriber content oriented around business, engineering and investing education content.",
    promoHeading: "Extra promo discount",
    promoBody: "60% off your first month or first year.",
    copyDiscountCode: "Copy discount code",
    copiedDiscountCode: "Copied {code}",
    discountCodeFallback: "Discount code:",
    appsOnlyTitle: "Apps only",
    appsOnlyPrice: "$60",
    appsOnlyDetail: "Pay once for apps only",
    appsOnlyCta: "Pay once",
    annualTitle: "Annual",
    annualPrice: "$5.50/mo",
    annualDetail: "Subscribe annually, 50% off",
    annualPromo: "First year promo $2.20/mo",
    annualCta: "Subscribe annually",
    monthlyTitle: "Monthly",
    monthlyPrice: "$10.99/mo",
    monthlyDetail: "Subscribe monthly",
    monthlyPromo: "First month promo $4.40",
    monthlyCta: "Subscribe monthly",
    passcodeHeading: "Enter passcode",
    passcodePlaceholder: "Passcode",
    emptyPasscode: "Enter the passcode",
    invalidPasscode: "Invalid passcode. Please try again.",
    verifying: "Verifying",
    submit: "Submit",
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
    promoHeading: "Descuento promocional extra",
    promoBody: "60% de descuento en tu primer mes o primer año.",
    copyDiscountCode: "Copiar código de descuento",
    copiedDiscountCode: "{code} copiado",
    discountCodeFallback: "Código de descuento:",
    appsOnlyTitle: "Solo apps",
    appsOnlyPrice: "$60",
    appsOnlyDetail: "Pago único solo por las apps",
    appsOnlyCta: "Pagar una vez",
    annualTitle: "Anual",
    annualPrice: "$5.50/mes",
    annualDetail: "Suscripción anual, 50% de descuento",
    annualPromo: "Promo primer año $2.20/mes",
    annualCta: "Suscribirse anual",
    monthlyTitle: "Mensual",
    monthlyPrice: "$10.99/mes",
    monthlyDetail: "Suscripción mensual",
    monthlyPromo: "Promo primer mes $4.40",
    monthlyCta: "Suscribirse mensual",
    passcodeHeading: "Ingresa el código",
    passcodePlaceholder: "Código de acceso",
    emptyPasscode: "Ingresa el código de acceso",
    invalidPasscode: "Código inválido. Inténtalo de nuevo.",
    verifying: "Verificando",
    submit: "Enviar",
  },
  pt: {
    title: "Obrigado por testar meu app!",
    subtitle: "Digite o código de membro para desbloquear o restante do app",
    benefitsHeading: "Ao se tornar membro, você recebe",
    benefitLanguageApps:
      "Acesso completo ao app de aprendizagem de idiomas e a um app de educação em programação",
    benefitSubscriberContent:
      "Uma coleção crescente de conteúdos para membros sobre educação em negócios, engenharia e investimentos.",
    promoHeading: "Desconto promocional extra",
    promoBody: "60% de desconto no seu primeiro mês ou primeiro ano.",
    copyDiscountCode: "Copiar código de desconto",
    copiedDiscountCode: "{code} copiado",
    discountCodeFallback: "Código de desconto:",
    appsOnlyTitle: "Somente apps",
    appsOnlyPrice: "$60",
    appsOnlyDetail: "Pague uma vez somente pelos apps",
    appsOnlyCta: "Pagar uma vez",
    annualTitle: "Anual",
    annualPrice: "$5.50/mês",
    annualDetail: "Assine anualmente, 50% de desconto",
    annualPromo: "Promo do primeiro ano $2.20/mês",
    annualCta: "Assinar anual",
    monthlyTitle: "Mensal",
    monthlyPrice: "$10.99/mês",
    monthlyDetail: "Assine mensalmente",
    monthlyPromo: "Promo do primeiro mês $4.40",
    monthlyCta: "Assinar mensal",
    passcodeHeading: "Digite o código",
    passcodePlaceholder: "Código de acesso",
    emptyPasscode: "Digite o código de acesso",
    invalidPasscode: "Código inválido. Tente novamente.",
    verifying: "Verificando",
    submit: "Enviar",
  },
  it: {
    title: "Grazie per aver provato la mia app!",
    subtitle: "Inserisci il codice membro per sbloccare il resto dell'app",
    benefitsHeading: "Diventando membro ottieni",
    benefitLanguageApps:
      "Accesso completo all'app per imparare le lingue e a un'app di educazione alla programmazione",
    benefitSubscriberContent:
      "Una raccolta in crescita di contenuti per membri su business, ingegneria e investimenti.",
    promoHeading: "Sconto promo extra",
    promoBody: "60% di sconto sul primo mese o sul primo anno.",
    copyDiscountCode: "Copia codice sconto",
    copiedDiscountCode: "{code} copiato",
    discountCodeFallback: "Codice sconto:",
    appsOnlyTitle: "Solo app",
    appsOnlyPrice: "$60",
    appsOnlyDetail: "Paga una volta solo per le app",
    appsOnlyCta: "Paga una volta",
    annualTitle: "Annuale",
    annualPrice: "$5.50/mese",
    annualDetail: "Abbonamento annuale, 50% di sconto",
    annualPromo: "Promo primo anno $2.20/mese",
    annualCta: "Abbonati annualmente",
    monthlyTitle: "Mensile",
    monthlyPrice: "$10.99/mese",
    monthlyDetail: "Abbonamento mensile",
    monthlyPromo: "Promo primo mese $4.40",
    monthlyCta: "Abbonati mensilmente",
    passcodeHeading: "Inserisci il codice",
    passcodePlaceholder: "Codice di accesso",
    emptyPasscode: "Inserisci il codice di accesso",
    invalidPasscode: "Codice non valido. Riprova.",
    verifying: "Verifica in corso",
    submit: "Invia",
  },
  fr: {
    title: "Merci d'avoir essayé mon appli !",
    subtitle: "Entrez le code membre pour débloquer le reste de l'appli",
    benefitsHeading: "Devenir membre vous donne",
    benefitLanguageApps:
      "Un accès complet à l'appli d'apprentissage des langues et à une appli d'éducation au code",
    benefitSubscriberContent:
      "Une collection croissante de contenus membres sur le business, l'ingénierie et l'investissement.",
    promoHeading: "Remise promo supplémentaire",
    promoBody: "60 % de remise sur votre premier mois ou votre première année.",
    copyDiscountCode: "Copier le code promo",
    copiedDiscountCode: "{code} copié",
    discountCodeFallback: "Code promo :",
    appsOnlyTitle: "Apps seulement",
    appsOnlyPrice: "$60",
    appsOnlyDetail: "Payez une seule fois pour les apps",
    appsOnlyCta: "Payer une fois",
    annualTitle: "Annuel",
    annualPrice: "$5.50/mois",
    annualDetail: "Abonnement annuel, 50 % de remise",
    annualPromo: "Promo première année $2.20/mois",
    annualCta: "S'abonner annuel",
    monthlyTitle: "Mensuel",
    monthlyPrice: "$10.99/mois",
    monthlyDetail: "Abonnement mensuel",
    monthlyPromo: "Promo premier mois $4.40",
    monthlyCta: "S'abonner mensuel",
    passcodeHeading: "Entrez le code",
    passcodePlaceholder: "Code d'accès",
    emptyPasscode: "Entrez le code d'accès",
    invalidPasscode: "Code invalide. Réessayez.",
    verifying: "Vérification",
    submit: "Envoyer",
  },
  de: {
    title: "Danke, dass du meine App ausprobierst!",
    subtitle: "Gib den Mitgliedscode ein, um den Rest der App freizuschalten",
    benefitsHeading: "Als Mitglied bekommst du",
    benefitLanguageApps:
      "Vollen Zugriff auf die Sprachlern-App und eine App zum Programmierenlernen",
    benefitSubscriberContent:
      "Eine wachsende Sammlung von Mitgliederinhalten zu Business, Engineering und Investieren.",
    promoHeading: "Zusätzlicher Promo-Rabatt",
    promoBody: "60 % Rabatt auf deinen ersten Monat oder dein erstes Jahr.",
    copyDiscountCode: "Rabattcode kopieren",
    copiedDiscountCode: "{code} kopiert",
    discountCodeFallback: "Rabattcode:",
    appsOnlyTitle: "Nur Apps",
    appsOnlyPrice: "$60",
    appsOnlyDetail: "Einmalig nur für die Apps zahlen",
    appsOnlyCta: "Einmal zahlen",
    annualTitle: "Jährlich",
    annualPrice: "$5.50/Monat",
    annualDetail: "Jährlich abonnieren, 50 % Rabatt",
    annualPromo: "Promo im ersten Jahr $2.20/Monat",
    annualCta: "Jährlich abonnieren",
    monthlyTitle: "Monatlich",
    monthlyPrice: "$10.99/Monat",
    monthlyDetail: "Monatlich abonnieren",
    monthlyPromo: "Promo im ersten Monat $4.40",
    monthlyCta: "Monatlich abonnieren",
    passcodeHeading: "Code eingeben",
    passcodePlaceholder: "Mitgliedscode",
    emptyPasscode: "Gib den Code ein",
    invalidPasscode: "Ungültiger Code. Bitte versuche es erneut.",
    verifying: "Wird geprüft",
    submit: "Senden",
  },
  ja: {
    title: "アプリを試してくれてありがとうございます！",
    subtitle: "メンバー用パスコードを入力して、アプリの残りを解除しましょう",
    benefitsHeading: "メンバーになると利用できます",
    benefitLanguageApps:
      "語学学習アプリとプログラミング教育アプリへのフルアクセス",
    benefitSubscriberContent:
      "ビジネス、エンジニアリング、投資教育に関するメンバー向けコンテンツの追加コレクション。",
    promoHeading: "追加プロモ割引",
    promoBody: "初月または初年度が60%オフ。",
    copyDiscountCode: "割引コードをコピー",
    copiedDiscountCode: "{code}をコピーしました",
    discountCodeFallback: "割引コード:",
    appsOnlyTitle: "アプリのみ",
    appsOnlyPrice: "$60",
    appsOnlyDetail: "アプリのみを一度払いで購入",
    appsOnlyCta: "一度払い",
    annualTitle: "年額",
    annualPrice: "$5.50/月",
    annualDetail: "年額サブスク、50%オフ",
    annualPromo: "初年度プロモ $2.20/月",
    annualCta: "年額で登録",
    monthlyTitle: "月額",
    monthlyPrice: "$10.99/月",
    monthlyDetail: "月額サブスク",
    monthlyPromo: "初月プロモ $4.40",
    monthlyCta: "月額で登録",
    passcodeHeading: "パスコードを入力",
    passcodePlaceholder: "パスコード",
    emptyPasscode: "パスコードを入力してください",
    invalidPasscode: "パスコードが無効です。もう一度お試しください。",
    verifying: "確認中",
    submit: "送信",
  },
  hi: {
    title: "मेरे ऐप को आज़माने के लिए धन्यवाद!",
    subtitle: "बाकी ऐप अनलॉक करने के लिए सदस्यता पासकोड दर्ज करें",
    benefitsHeading: "सदस्य बनने पर आपको मिलता है",
    benefitLanguageApps:
      "भाषा सीखने वाले ऐप और कोडिंग शिक्षा ऐप का पूरा एक्सेस",
    benefitSubscriberContent:
      "बिज़नेस, इंजीनियरिंग और निवेश शिक्षा सामग्री पर केंद्रित बढ़ता हुआ सदस्य कंटेंट.",
    promoHeading: "अतिरिक्त प्रोमो छूट",
    promoBody: "पहले महीने या पहले वर्ष पर 60% छूट.",
    copyDiscountCode: "डिस्काउंट कोड कॉपी करें",
    copiedDiscountCode: "{code} कॉपी हुआ",
    discountCodeFallback: "डिस्काउंट कोड:",
    appsOnlyTitle: "केवल ऐप्स",
    appsOnlyPrice: "$60",
    appsOnlyDetail: "केवल ऐप्स के लिए एक बार भुगतान करें",
    appsOnlyCta: "एक बार भुगतान",
    annualTitle: "वार्षिक",
    annualPrice: "$5.50/माह",
    annualDetail: "वार्षिक सदस्यता, 50% छूट",
    annualPromo: "पहले वर्ष का प्रोमो $2.20/माह",
    annualCta: "वार्षिक सदस्यता",
    monthlyTitle: "मासिक",
    monthlyPrice: "$10.99/माह",
    monthlyDetail: "मासिक सदस्यता",
    monthlyPromo: "पहले महीने का प्रोमो $4.40",
    monthlyCta: "मासिक सदस्यता",
    passcodeHeading: "पासकोड दर्ज करें",
    passcodePlaceholder: "पासकोड",
    emptyPasscode: "पासकोड दर्ज करें",
    invalidPasscode: "पासकोड अमान्य है. कृपया फिर कोशिश करें.",
    verifying: "जांच हो रही है",
    submit: "जमा करें",
  },
  ar: {
    title: "شكرًا إنك جرّبت تطبيقي!",
    subtitle: "اكتب كود العضوية عشان تفتح باقي التطبيق",
    benefitsHeading: "لما تبقى عضو هتاخد",
    benefitLanguageApps: "وصول كامل لتطبيق تعلّم اللغة وتطبيق تعليم البرمجة",
    benefitSubscriberContent:
      "مجموعة متزايدة من محتوى الأعضاء عن تعليم الأعمال والهندسة والاستثمار.",
    promoHeading: "خصم إضافي",
    promoBody: "خصم 60% على أول شهر أو أول سنة.",
    copyDiscountCode: "انسخ كود الخصم",
    copiedDiscountCode: "تم نسخ {code}",
    discountCodeFallback: "كود الخصم:",
    appsOnlyTitle: "التطبيقات فقط",
    appsOnlyPrice: "$60",
    appsOnlyDetail: "ادفع مرة واحدة للتطبيقات فقط",
    appsOnlyCta: "ادفع مرة واحدة",
    annualTitle: "سنوي",
    annualPrice: "$5.50/شهر",
    annualDetail: "اشتراك سنوي، خصم 50%",
    annualPromo: "عرض أول سنة $2.20/شهر",
    annualCta: "اشترك سنويًا",
    monthlyTitle: "شهري",
    monthlyPrice: "$10.99/شهر",
    monthlyDetail: "اشتراك شهري",
    monthlyPromo: "عرض أول شهر $4.40",
    monthlyCta: "اشترك شهريًا",
    passcodeHeading: "اكتب الكود",
    passcodePlaceholder: "كود العضوية",
    emptyPasscode: "اكتب كود الدخول",
    invalidPasscode: "الكود غير صحيح. جرّب تاني.",
    verifying: "جارٍ التحقق",
    submit: "إرسال",
  },
  zh: {
    title: "感谢你试用我的应用！",
    subtitle: "输入会员通行码即可解锁应用的其余内容",
    benefitsHeading: "成为会员即可获得",
    benefitLanguageApps: "完整访问语言学习应用和编程教育应用",
    benefitSubscriberContent: "持续更新的会员内容，面向商业、工程和投资教育。",
    promoHeading: "额外优惠折扣",
    promoBody: "首月或首年 60% 折扣。",
    copyDiscountCode: "复制折扣码",
    copiedDiscountCode: "已复制 {code}",
    discountCodeFallback: "折扣码：",
    appsOnlyTitle: "仅应用",
    appsOnlyPrice: "$60",
    appsOnlyDetail: "一次性购买应用",
    appsOnlyCta: "一次性购买",
    annualTitle: "年度",
    annualPrice: "$5.50/月",
    annualDetail: "年度订阅，五折优惠",
    annualPromo: "首年优惠 $2.20/月",
    annualCta: "年度订阅",
    monthlyTitle: "月度",
    monthlyPrice: "$10.99/月",
    monthlyDetail: "按月订阅",
    monthlyPromo: "首月优惠 $4.40",
    monthlyCta: "月度订阅",
    passcodeHeading: "输入通行码",
    passcodePlaceholder: "通行码",
    emptyPasscode: "请输入通行码",
    invalidPasscode: "通行码无效，请重试。",
    verifying: "正在验证",
    submit: "提交",
  },
};

export default function SubscriptionGate({
  appLanguage = "en",
  t = {},
  onSubmit,
  isSubmitting = false,
  error = "",
}) {
  const lang = normalizeSupportLanguage(appLanguage, DEFAULT_SUPPORT_LANGUAGE);
  const copy = SUBSCRIBE_COPY[lang] || SUBSCRIBE_COPY.en;
  const isRtl = lang === "ar";
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const [value, setValue] = useState("");
  const [localError, setLocalError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const discountCode = "4DC4D";
  const invalidMessage =
    error ||
    localError ||
    t.invalid ||
    t.passcode?.invalid ||
    copy.invalidPasscode;

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

  const handleCopyDiscountCode = async () => {
    try {
      await navigator.clipboard?.writeText(discountCode);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      setLocalError(`${copy.discountCodeFallback} ${discountCode}`);
    }
  };

  const pricingOptions = [
    {
      title: copy.appsOnlyTitle,
      price: copy.appsOnlyPrice,
      detail: copy.appsOnlyDetail,
      accent: "teal.300",
      shadow: "#0f766e",
      cta: copy.appsOnlyCta,
      href: "https://www.patreon.com/posts/146522893?forSale=true",
    },
    {
      title: copy.annualTitle,
      price: copy.annualPrice,
      detail: copy.annualDetail,
      promo: copy.annualPromo,
      accent: "purple.300",
      shadow: "#6b46c1",
      cta: copy.annualCta,
      href: "https://www.patreon.com/NotesAndOtherStuff",
    },
    {
      title: copy.monthlyTitle,
      price: copy.monthlyPrice,
      detail: copy.monthlyDetail,
      promo: copy.monthlyPromo,
      accent: "orange.300",
      shadow: "#b7791f",
      cta: copy.monthlyCta,
      href: "https://www.patreon.com/NotesAndOtherStuff",
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
  const promoTextColor = isLightTheme ? "#0f766e" : "teal.200";
  const inputBg = isLightTheme ? "rgba(247, 240, 229, 0.98)" : "gray.800";

  return (
    <Box
      minH="100vh"
      bg={pageBg}
      color={shellText}
      dir={isRtl ? "rtl" : "ltr"}
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
      py={{ base: 8, md: 12 }}
    >
      <Box
        as="form"
        onSubmit={handleSubmit}
        bg={shellBg}
        borderWidth="1px"
        borderColor={shellBorder}
        borderRadius="24px"
        p={{ base: 6, md: 8 }}
        maxW="760px"
        w="100%"
        my={{ base: 4, md: 8 }}
        boxShadow={shellShadow}
      >
        <VStack align="stretch" spacing={6}>
          <HStack
            align="center"
            spacing={5}
            flexDirection={{ base: "column", sm: "row" }}
            textAlign={{ base: "center", sm: isRtl ? "right" : "left" }}
          >
            <Box
              bg={softPanelBg}
              border="1px solid"
              borderColor={shellBorder}
              borderRadius="20px"
              px={4}
              py={1}
              minW="110px"
              display="flex"
              justifyContent="center"
            >
              <RandomCharacter notSoRandomCharacter="31" width="92px" />
            </Box>
            <Box>
              <Heading size="lg" mb={2}>
                {copy.title}
              </Heading>
              <Text color={mutedText} fontSize="md">
                {copy.subtitle}
              </Text>
            </Box>
          </HStack>

          <Box
            bg={softPanelBg}
            border="1px solid"
            borderColor={shellBorder}
            borderRadius="16px"
            p={5}
          >
            <Text fontWeight="bold" mb={3}>
              {copy.benefitsHeading}
            </Text>
            <Box
              as="ul"
              color={mutedText}
              pl={isRtl ? 0 : 5}
              pr={isRtl ? 5 : 0}
            >
              <Text as="li" mb={2}>
                {copy.benefitLanguageApps}
              </Text>
              <Text as="li">{copy.benefitSubscriberContent}</Text>
            </Box>
          </Box>

          <Box bg="transparent" color={shellText} borderRadius="18px" p={4}>
            <HStack
              justify="space-between"
              align={{ base: "stretch", sm: "center" }}
              flexDirection={{ base: "column", sm: "row" }}
              spacing={3}
            >
              <Box>
                <Text fontWeight="black">{copy.promoHeading}</Text>
                <Text fontSize="sm" color={mutedText}>
                  {copy.promoBody}
                </Text>
              </Box>
              <Button
                type="button"
                bgGradient="linear(to-r, teal.500, cyan.500)"
                color="white"
                borderRadius="full"
                px={6}
                boxShadow="0px 4px 0px #0f766e"
                _hover={{
                  bgGradient: "linear(to-r, teal.400, cyan.400)",
                  transform: "translateY(-1px)",
                }}
                _active={{
                  transform: "translateY(2px)",
                  boxShadow: "0px 2px 0px #0f766e",
                }}
                onClick={handleCopyDiscountCode}
                flexShrink={0}
              >
                {copiedCode
                  ? copy.copiedDiscountCode.replace("{code}", discountCode)
                  : copy.copyDiscountCode}
              </Button>
            </HStack>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
            {pricingOptions.map((option) => (
              <Box
                key={option.title}
                bg="transparent"
                border="1px solid"
                borderColor={option.accent}
                borderRadius="16px"
                p={4}
                display="flex"
                flexDirection="column"
                minH="230px"
              >
                <Text color={option.accent} fontWeight="black" fontSize="sm">
                  {option.title}
                </Text>
                <Text fontSize="2xl" fontWeight="black" mt={1}>
                  {option.price}
                </Text>
                <Text color={secondaryText} fontSize="sm" mt={1}>
                  {option.detail}
                </Text>
                {option.promo && (
                  <Text
                    color={promoTextColor}
                    fontSize="sm"
                    fontWeight="bold"
                    mt={2}
                  >
                    {option.promo}
                  </Text>
                )}
                <Box mt="auto" pt={4}>
                  <Button
                    as="a"
                    href={option.href}
                    target="_blank"
                    rel="noreferrer"
                    w="100%"
                    size="sm"
                    bg={option.accent}
                    color="white"
                    boxShadow={`0px 4px 0px ${option.shadow}`}
                    _hover={{
                      bg: option.accent,
                      transform: "translateY(-1px)",
                    }}
                    _active={{
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
                <Alert status="error" bg="red.900" borderColor="red.700">
                  <AlertIcon />
                  <Text fontSize="sm">{invalidMessage}</Text>
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
        </VStack>
      </Box>
    </Box>
  );
}
