import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Button,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { IoSparkles, IoCloudDownloadOutline, IoAlertCircleOutline } from "react-icons/io5";
import { appUpdateCoordinator } from "../pwa/appUpdateCoordinator";
import useLanguage from "../hooks/useLanguage";
import {
  nativeModalMotionProps,
  nativeOverlayMotionProps,
} from "../utils/modalMotion.js";

const UPDATE_COPY = {
  en: {
    title: "Update available",
    body: "A new version of Piyali is ready. Update now to use the latest improvements.",
    updateApp: "Update app",
    later: "Later",
    updating: "Updating Piyali…",
    failure: "We couldn't finish the update. Try again when your connection is ready.",
    tryAgain: "Try again",
    updateReady: "Update ready",
    busyNotice: "Please finish or save your current activity before updating.",
  },
  es: {
    title: "Actualización disponible",
    body: "Una nueva versión de Piyali está lista. Actualiza ahora para usar las últimas mejoras.",
    updateApp: "Actualizar app",
    later: "Más tarde",
    updating: "Actualizando Piyali…",
    failure: "No pudimos completar la actualización. Inténtalo de nuevo cuando tu conexión esté lista.",
    tryAgain: "Intentar de nuevo",
    updateReady: "Actualización lista",
    busyNotice: "Por favor termina o guarda tu actividad actual antes de actualizar.",
  },
  pt: {
    title: "Atualização disponível",
    body: "Uma nova versão do Piyali está pronta. Atualize agora para aproveitar as melhorias mais recentes.",
    updateApp: "Atualizar app",
    later: "Mais tarde",
    updating: "Atualizando o Piyali…",
    failure: "Não conseguimos concluir a atualização. Tente novamente quando sua conexão estiver pronta.",
    tryAgain: "Tentar novamente",
    updateReady: "Atualização pronta",
    busyNotice: "Conclua ou salve sua atividade atual antes de atualizar.",
  },
  it: {
    title: "Aggiornamento disponibile",
    body: "Una nuova versione di Piyali è pronta. Aggiorna ora per utilizzare gli ultimi miglioramenti.",
    updateApp: "Aggiorna app",
    later: "Più tardi",
    updating: "Aggiornamento di Piyali in corso…",
    failure: "Impossibile completare l'aggiornamento. Riprova quando la connessione è pronta.",
    tryAgain: "Riprova",
    updateReady: "Aggiornamento pronto",
    busyNotice: "Completa o salva l'attività corrente prima di aggiornare.",
  },
  fr: {
    title: "Mise à jour disponible",
    body: "Une nouvelle version de Piyali est prête. Mettez à jour maintenant pour profiter des dernières améliorations.",
    updateApp: "Mettre à jour",
    later: "Plus tard",
    updating: "Mise à jour de Piyali…",
    failure: "Impossible de terminer la mise à jour. Réessayez lorsque votre connexion sera prête.",
    tryAgain: "Réessayer",
    updateReady: "Mise à jour prête",
    busyNotice: "Veuillez terminer ou enregistrer votre activité en cours avant de mettre à jour.",
  },
  de: {
    title: "Update verfügbar",
    body: "Eine neue Version von Piyali ist bereit. Jetzt aktualisieren, um die neuesten Verbesserungen zu nutzen.",
    updateApp: "App aktualisieren",
    later: "Später",
    updating: "Piyali wird aktualisiert…",
    failure: "Wir konnten das Update nicht abschließen. Versuchen Sie es erneut, wenn Ihre Verbindung bereit ist.",
    tryAgain: "Erneut versuchen",
    updateReady: "Update bereit",
    busyNotice: "Bitte schließen oder speichern Sie Ihre aktuelle Aktivität, bevor Sie aktualisieren.",
  },
  ja: {
    title: "アップデートが利用可能です",
    body: "Piyaliの新しいバージョンが準備できました。今すぐ更新して最新の改善をご利用ください。",
    updateApp: "アプリを更新",
    later: "後で",
    updating: "Piyaliを更新中…",
    failure: "アップデートを完了できませんでした。通信環境を確認してもう一度お試しください。",
    tryAgain: "再試行",
    updateReady: "更新準備完了",
    busyNotice: "更新する前に、現在のアクティビティを完了または保存してください。",
  },
  hi: {
    title: "अपडेट उपलब्ध है",
    body: "Piyali का एक नया संस्करण तैयार है। नवीनतम सुधारों का उपयोग करने के लिए अभी अपडेट करें।",
    updateApp: "ऐप अपडेट करें",
    later: "बाद में",
    updating: "Piyali अपडेट हो रहा है…",
    failure: "हम अपडेट पूरा नहीं कर सके। अपना कनेक्शन तैयार होने पर पुन: प्रयास करें।",
    tryAgain: "पुनः प्रयास करें",
    updateReady: "अपडेट तैयार है",
    busyNotice: "कृपया अपडेट करने से पहले अपनी वर्तमान गतिविधि पूरी करें या सहेजें।",
  },
  ar: {
    title: "تحديث متاح",
    body: "إصدار جديد من Piyali جاهز. قم بالتحديث الآن لاستخدام أحدث التحسينات.",
    updateApp: "تحديث التطبيق",
    later: "لاحقاً",
    updating: "جارٍ تحديث Piyali…",
    failure: "تعذر إكمال التحديث. يُرجى المحاولة مرة أخرى عند توفر الاتصال.",
    tryAgain: "أعد المحاولة",
    updateReady: "التحديث جاهز",
    busyNotice: "يُرجى إنهاء أو حفظ نشاطك الحالي قبل التحديث.",
  },
  zh: {
    title: "有可用更新",
    body: "Piyali 的新版本已就绪。立即更新以体验最新改进。",
    updateApp: "更新应用",
    later: "稍后",
    updating: "正在更新 Piyali…",
    failure: "我们无法完成更新。请在网络连接就绪后重试。",
    tryAgain: "重试",
    updateReady: "更新就绪",
    busyNotice: "请在更新前完成或保存您当前的活动。",
  },
};

export default function AppUpdateModal() {
  const [updateState, setUpdateState] = useState(() => appUpdateCoordinator.getState());
  const toast = useToast();
  const updateBtnRef = useRef(null);
  const lang = useLanguage((s) => s.language) || "en";
  const copy = UPDATE_COPY[lang] || UPDATE_COPY.en;

  useEffect(() => {
    return appUpdateCoordinator.subscribe((nextState) => {
      setUpdateState(nextState);
    });
  }, []);

  const { isModalOpen, uiState, errorMessage } = updateState;
  const isApplying = uiState === "applying";
  const isError = uiState === "error";

  const handleUpdate = async () => {
    if (isApplying) return;
    const ok = await appUpdateCoordinator.applyUpdate();
    if (!ok && appUpdateCoordinator.getState().errorMessage) {
      toast({
        title: copy.title,
        description: appUpdateCoordinator.getState().errorMessage,
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleLater = () => {
    if (isApplying) return;
    appUpdateCoordinator.dismissUpdate();
  };

  const handleRetry = () => {
    appUpdateCoordinator.retryUpdate();
  };

  return (
    <Modal
      isOpen={Boolean(isModalOpen)}
      onClose={handleLater}
      closeOnOverlayClick={!isApplying}
      closeOnEsc={!isApplying}
      initialFocusRef={updateBtnRef}
      isCentered
      motionPreset="slideInBottom"
    >
        <ModalOverlay
          bg="rgba(0, 0, 0, 0.65)"
          backdropFilter="blur(4px)"
          {...nativeOverlayMotionProps}
        />
        <ModalContent
          bg="var(--app-surface-elevated, #1c1c1e)"
          color="var(--app-text-primary, #ffffff)"
          borderRadius="2xl"
          border="1px solid"
          borderColor="var(--app-border, rgba(255, 255, 255, 0.12))"
          boxShadow="0 20px 40px rgba(0, 0, 0, 0.5)"
          maxW={{ base: "90%", sm: "420px" }}
          mx="auto"
          role={isError ? "alertdialog" : "dialog"}
          aria-labelledby="pwa-update-title"
          aria-describedby="pwa-update-description"
          {...nativeModalMotionProps}
        >
          <ModalBody
            id="pwa-update-description"
            pt={{ base: "28px", md: "32px" }}
            pb={1}
            px={{ base: "28px", md: "36px" }}
          >
            <VStack align="stretch" spacing={2.5}>
              <HStack spacing={3} id="pwa-update-title">
                <Icon
                  as={isError ? IoAlertCircleOutline : IoCloudDownloadOutline}
                  boxSize={6}
                  color={isError ? "red.400" : "teal.400"}
                />
                <Text fontSize="lg" fontWeight="bold">
                  {copy.title}
                </Text>
              </HStack>

              <Text
                fontSize="sm"
                color="var(--app-text-secondary, rgba(255, 255, 255, 0.8))"
                lineHeight="tall"
              >
                {isError ? (errorMessage || copy.failure) : copy.body}
              </Text>
            </VStack>
          </ModalBody>

          <ModalFooter
            pt={3}
            pb={{ base: "24px", md: "28px" }}
            px={{ base: "28px", md: "36px" }}
          >
            <HStack spacing={3} w="100%" justify="flex-end">
              {isError ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={handleLater}
                    color="var(--app-text-secondary, rgba(255, 255, 255, 0.8))"
                    _hover={{ bg: "var(--app-surface-muted, #2c2c2e)" }}
                    size="md"
                    borderRadius="lg"
                  >
                    {copy.later}
                  </Button>
                  <Button
                    colorScheme="teal"
                    onClick={handleRetry}
                    size="md"
                    borderRadius="lg"
                  >
                    {copy.tryAgain}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={handleLater}
                    isDisabled={isApplying}
                    color="var(--app-text-secondary, rgba(255, 255, 255, 0.8))"
                    _hover={{ bg: "var(--app-surface-muted, #2c2c2e)" }}
                    size="md"
                    borderRadius="lg"
                  >
                    {copy.later}
                  </Button>
                  <Button
                    ref={updateBtnRef}
                    colorScheme="teal"
                    onClick={handleUpdate}
                    isLoading={isApplying}
                    loadingText={copy.updating}
                    size="md"
                    borderRadius="lg"
                    spinner={<Spinner size="sm" color="white" />}
                  >
                    {copy.updateApp}
                  </Button>
                </>
              )}
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
  );
}
