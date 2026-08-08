import React, { useEffect, useMemo, useState } from "react";
import {
  Center,
  Heading,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { normalizeSupportLanguage } from "../constants/languages";
import {
  completePatreonDrawerReturn,
  hasPendingPatreonDrawerReturn,
} from "../utils/patreonDrawerReturn";

const RETURN_COPY = {
  en: {
    connected: "Patreon connected",
    action: "Patreon verified",
    incomplete: "Patreon connection incomplete",
    connectedBody:
      "Your membership was linked successfully. Return to the Piyali app where you started.",
    incompleteBody:
      "Return to Piyali and try connecting again. Your account was not changed.",
    actionBody:
      "Return to the Piyali app where you started to finish the next step securely.",
    returnHint: "Close this private tab and return to your original Piyali app.",
  },
  es: {
    connected: "Patreon conectado",
    action: "Patreon verificado",
    incomplete: "La conexión con Patreon no se completó",
    connectedBody:
      "Tu membresía se vinculó correctamente. Regresa a la app de Piyali donde comenzaste.",
    incompleteBody:
      "Regresa a Piyali e intenta conectarte de nuevo. Tu cuenta no cambió.",
    actionBody:
      "Regresa a la app de Piyali donde comenzaste para completar el siguiente paso de forma segura.",
    returnHint: "Cierra esta pestaña privada y regresa a tu app original de Piyali.",
  },
  pt: {
    connected: "Patreon conectado",
    action: "Patreon verificado",
    incomplete: "A conexão com o Patreon não foi concluída",
    connectedBody:
      "Sua assinatura foi vinculada. Volte ao app Piyali onde começou.",
    incompleteBody:
      "Volte ao Piyali e tente conectar novamente. Sua conta não foi alterada.",
    actionBody:
      "Volte ao app Piyali onde começou para concluir a próxima etapa com segurança.",
    returnHint: "Feche esta aba privada e volte ao app Piyali original.",
  },
  it: {
    connected: "Patreon collegato",
    action: "Patreon verificato",
    incomplete: "Connessione a Patreon non completata",
    connectedBody:
      "Il tuo abbonamento è stato collegato. Torna all’app Piyali da cui hai iniziato.",
    incompleteBody:
      "Torna a Piyali e prova a collegarti di nuovo. Il tuo account non è stato modificato.",
    actionBody:
      "Torna all’app Piyali da cui hai iniziato per completare in sicurezza il passaggio successivo.",
    returnHint: "Chiudi questa scheda privata e torna all’app Piyali originale.",
  },
  fr: {
    connected: "Patreon connecté",
    action: "Patreon vérifié",
    incomplete: "La connexion à Patreon n’a pas abouti",
    connectedBody:
      "Votre abonnement a bien été associé. Revenez à l’app Piyali de départ.",
    incompleteBody:
      "Revenez dans Piyali et réessayez. Votre compte n’a pas été modifié.",
    actionBody:
      "Revenez à l’app Piyali de départ pour terminer l’étape suivante en toute sécurité.",
    returnHint: "Fermez cet onglet privé et revenez à votre app Piyali d’origine.",
  },
  de: {
    connected: "Patreon verbunden",
    action: "Patreon bestätigt",
    incomplete: "Patreon-Verbindung nicht abgeschlossen",
    connectedBody:
      "Deine Mitgliedschaft wurde verknüpft. Kehre zur ursprünglichen Piyali-App zurück.",
    incompleteBody:
      "Kehre zu Piyali zurück und versuche es erneut. Dein Konto wurde nicht geändert.",
    actionBody:
      "Kehre zur ursprünglichen Piyali-App zurück, um den nächsten Schritt sicher abzuschließen.",
    returnHint:
      "Schließe diesen privaten Tab und kehre zu deiner ursprünglichen Piyali-App zurück.",
  },
  ja: {
    connected: "Patreonに接続しました",
    action: "Patreonを確認しました",
    incomplete: "Patreonへの接続が完了しませんでした",
    connectedBody:
      "メンバーシップを連携しました。操作を開始したPiyaliアプリに戻ってください。",
    incompleteBody:
      "Piyaliに戻ってもう一度お試しください。アカウントは変更されていません。",
    actionBody:
      "安全に次の手順を完了するには、操作を開始したPiyaliアプリに戻ってください。",
    returnHint: "このプライベートタブを閉じて、元のPiyaliアプリに戻ってください。",
  },
  hi: {
    connected: "Patreon कनेक्ट हो गया",
    action: "Patreon सत्यापित हो गया",
    incomplete: "Patreon कनेक्शन पूरा नहीं हुआ",
    connectedBody:
      "आपकी सदस्यता लिंक हो गई है। उसी Piyali ऐप पर लौटें जहाँ आपने शुरुआत की थी।",
    incompleteBody:
      "Piyali पर लौटें और फिर से कनेक्ट करें। आपका खाता नहीं बदला गया है।",
    actionBody:
      "अगला चरण सुरक्षित रूप से पूरा करने के लिए उसी Piyali ऐप पर लौटें जहाँ आपने शुरुआत की थी।",
    returnHint: "इस निजी टैब को बंद करके अपने मूल Piyali ऐप पर लौटें।",
  },
  ar: {
    connected: "تم ربط Patreon",
    action: "تم التحقق من Patreon",
    incomplete: "لم يكتمل ربط Patreon",
    connectedBody:
      "تم ربط عضويتك بنجاح. ارجع إلى تطبيق Piyali الذي بدأت منه.",
    incompleteBody:
      "ارجع إلى Piyali وحاول الربط مرة أخرى. لم يتم تغيير حسابك.",
    actionBody:
      "ارجع إلى تطبيق Piyali الذي بدأت منه لإكمال الخطوة التالية بأمان.",
    returnHint: "أغلق علامة التبويب الخاصة هذه وارجع إلى تطبيق Piyali الأصلي.",
  },
  zh: {
    connected: "Patreon 已连接",
    action: "Patreon 已验证",
    incomplete: "Patreon 连接未完成",
    connectedBody:
      "你的会员资格已成功关联。请返回开始操作的 Piyali 应用。",
    incompleteBody: "请返回 Piyali 后重试。你的账户未被更改。",
    actionBody: "请返回开始操作的 Piyali 应用，安全地完成下一步。",
    returnHint: "请关闭这个无痕标签页，然后返回原来的 Piyali 应用。",
  },
};

export default function PatreonOAuthDrawerReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const result = useMemo(
    () => params.get("patreon") || "oauth_error",
    [params],
  );
  const [isReturning, setIsReturning] = useState(true);
  const language = useMemo(() => {
    if (typeof window === "undefined") return "en";
    let storedLanguage = "";
    try {
      storedLanguage = window.localStorage.getItem("appLanguage") || "";
    } catch {
      // Restricted browser contexts may block storage access.
    }
    return normalizeSupportLanguage(
      storedLanguage || window.navigator.language,
      "en",
    );
  }, []);
  const copy = RETURN_COPY[language] || RETURN_COPY.en;

  useEffect(() => {
    if (!hasPendingPatreonDrawerReturn()) {
      setIsReturning(false);
      return;
    }

    const target = completePatreonDrawerReturn({ result });
    navigate(target, { replace: true });
  }, [navigate, result]);

  if (!isReturning) {
    const connected = result === "connected";
    const actionRequired = [
      "checkout_required",
      "not_subscribed",
      "link_conflict",
      "replace_required",
      "replace_rate_limited",
    ].includes(result);
    return (
      <Center
        minH="100dvh"
        bg="var(--app-page-bg)"
        px={6}
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        <VStack
          spacing={5}
          maxW="520px"
          textAlign="center"
          bg="var(--app-surface-elevated)"
          color="var(--app-text-primary)"
          border="1px solid"
          borderColor="purple.200"
          borderRadius="32px"
          px={{ base: 6, md: 10 }}
          py={{ base: 8, md: 10 }}
        >
          <Heading size="lg">
            {connected
              ? copy.connected
              : actionRequired
                ? copy.action
                : copy.incomplete}
          </Heading>
          <Text fontSize="lg">
            {connected
              ? copy.connectedBody
              : actionRequired
                ? copy.actionBody
                : copy.incompleteBody}
          </Text>
          <Text
            w="full"
            borderRadius="20px"
            bg="purple.100"
            color="purple.900"
            px={5}
            py={4}
            fontSize="md"
            fontWeight="700"
          >
            {copy.returnHint}
          </Text>
          {!connected && !actionRequired ? (
            <Text fontSize="xs" color="var(--app-text-muted)">
              {result}
            </Text>
          ) : null}
        </VStack>
      </Center>
    );
  }

  return (
    <Center minH="100dvh" bg="var(--app-page-bg)" color="purple.300">
      <Spinner size="xl" thickness="4px" aria-label="Returning to Piyali" />
    </Center>
  );
}
