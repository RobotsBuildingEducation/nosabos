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
    appsOnlyTitle: "Apps only",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "Pay once for apps only",
    appsOnlyCta: "Pay once",
    annualTitle: "Annual",
    annualPrice: "$5/mo",
    annualDetail: "Subscribe annually, 50% off",
    annualCta: "Subscribe annually",
    monthlyTitle: "Monthly",
    monthlyPrice: "$10/mo",
    monthlyDetail: "Subscribe monthly",
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
    appsOnlyTitle: "Solo apps",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "Pago único solo por las apps",
    appsOnlyCta: "Pagar una vez",
    annualTitle: "Anual",
    annualPrice: "$5/mes",
    annualDetail: "Suscripción anual, 50% de descuento",
    annualCta: "Suscribirse anual",
    monthlyTitle: "Mensual",
    monthlyPrice: "$10/mes",
    monthlyDetail: "Suscripción mensual",
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
    appsOnlyTitle: "Somente apps",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "Pague uma vez somente pelos apps",
    appsOnlyCta: "Pagar uma vez",
    annualTitle: "Anual",
    annualPrice: "$5/mês",
    annualDetail: "Assine anualmente, 50% de desconto",
    annualCta: "Assinar anual",
    monthlyTitle: "Mensal",
    monthlyPrice: "$10/mês",
    monthlyDetail: "Assine mensalmente",
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
    appsOnlyTitle: "Solo app",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "Paga una volta solo per le app",
    appsOnlyCta: "Paga una volta",
    annualTitle: "Annuale",
    annualPrice: "$5/mese",
    annualDetail: "Abbonamento annuale, 50% di sconto",
    annualCta: "Abbonati annualmente",
    monthlyTitle: "Mensile",
    monthlyPrice: "$10/mese",
    monthlyDetail: "Abbonamento mensile",
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
    appsOnlyTitle: "Apps seulement",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "Payez une seule fois pour les apps",
    appsOnlyCta: "Payer une fois",
    annualTitle: "Annuel",
    annualPrice: "$5/mois",
    annualDetail: "Abonnement annuel, 50 % de remise",
    annualCta: "S'abonner annuel",
    monthlyTitle: "Mensuel",
    monthlyPrice: "$10/mois",
    monthlyDetail: "Abonnement mensuel",
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
    appsOnlyTitle: "Nur Apps",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "Einmalig nur für die Apps zahlen",
    appsOnlyCta: "Einmal zahlen",
    annualTitle: "Jährlich",
    annualPrice: "$5/Monat",
    annualDetail: "Jährlich abonnieren, 50 % Rabatt",
    annualCta: "Jährlich abonnieren",
    monthlyTitle: "Monatlich",
    monthlyPrice: "$10/Monat",
    monthlyDetail: "Monatlich abonnieren",
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
    appsOnlyTitle: "アプリのみ",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "アプリのみを一度払いで購入",
    appsOnlyCta: "一度払い",
    annualTitle: "年額",
    annualPrice: "$5/月",
    annualDetail: "年額サブスク、50%オフ",
    annualCta: "年額で登録",
    monthlyTitle: "月額",
    monthlyPrice: "$10/月",
    monthlyDetail: "月額サブスク",
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
    appsOnlyTitle: "केवल ऐप्स",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "केवल ऐप्स के लिए एक बार भुगतान करें",
    appsOnlyCta: "एक बार भुगतान",
    annualTitle: "वार्षिक",
    annualPrice: "$5/माह",
    annualDetail: "वार्षिक सदस्यता, 50% छूट",
    annualCta: "वार्षिक सदस्यता",
    monthlyTitle: "मासिक",
    monthlyPrice: "$10/माह",
    monthlyDetail: "मासिक सदस्यता",
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
    appsOnlyTitle: "التطبيقات فقط",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "ادفع مرة واحدة للتطبيقات فقط",
    appsOnlyCta: "ادفع مرة واحدة",
    annualTitle: "سنوي",
    annualPrice: "$5/شهر",
    annualDetail: "اشتراك سنوي، خصم 50%",
    annualCta: "اشترك سنويًا",
    monthlyTitle: "شهري",
    monthlyPrice: "$10/شهر",
    monthlyDetail: "اشتراك شهري",
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
    appsOnlyTitle: "仅应用",
    appsOnlyPrice: "$120",
    appsOnlyDetail: "一次性购买应用",
    appsOnlyCta: "一次性购买",
    annualTitle: "年度",
    annualPrice: "$5/月",
    annualDetail: "年度订阅，五折优惠",
    annualCta: "年度订阅",
    monthlyTitle: "月度",
    monthlyPrice: "$10/月",
    monthlyDetail: "按月订阅",
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

  const pricingOptions = [
    {
      title: copy.appsOnlyTitle,
      price: copy.appsOnlyPrice,
      detail: copy.appsOnlyDetail,
      accent: "teal.300",
      hoverAccent: "teal.400",
      activeAccent: "teal.500",
      shadow: "#0f766e",
      cta: copy.appsOnlyCta,
      href: "https://www.patreon.com/posts/146522893?forSale=true",
    },
    {
      title: copy.annualTitle,
      price: copy.annualPrice,
      detail: copy.annualDetail,
      accent: "purple.300",
      hoverAccent: "purple.400",
      activeAccent: "purple.500",
      shadow: "#6b46c1",
      cta: copy.annualCta,
      href: "https://www.patreon.com/NotesAndOtherStuff",
    },
    {
      title: copy.monthlyTitle,
      price: copy.monthlyPrice,
      detail: copy.monthlyDetail,
      accent: "orange.400",
      hoverAccent: "orange.500",
      activeAccent: "orange.600",
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
        </VStack>
      </Box>
    </Box>
  );
}
