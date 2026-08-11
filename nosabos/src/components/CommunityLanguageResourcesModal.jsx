import {
  Box,
  Button,
  HStack,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiExternalLink } from "react-icons/fi";
import { LuHeartHandshake } from "react-icons/lu";
import {
  DEFAULT_SUPPORT_LANGUAGE,
  getLanguageDirection,
  getLanguageLabel,
  normalizeSupportLanguage,
} from "../constants/languages";
import { COMMUNITY_LANGUAGE_RESOURCES } from "../data/communityLanguageResources";
import useEscapeToClose from "../hooks/useEscapeToClose";
import { translations } from "../utils/translation";
import {
  nativeModalMotionProps,
  nativeOverlayMotionProps,
} from "../utils/modalMotion";
import { useThemeStore } from "../useThemeStore";

const COPY = {
  en: {
    title: "Learn {language} with community experts",
    intro: "Piyali no longer offers {language} practice.",
    reason:
      "We believe the best way to learn this language—and support its future—is directly through local creators, teachers, and community-led organizations.",
    resources: "Community learning resources",
    dictionaries: "Dictionaries",
    creatorsTeachers: "Creators & Teachers",
    courses: "Courses",
    empty: "No resources added yet.",
    close: "Choose another language",
  },
  es: {
    title: "Aprende {language} con expertos de la comunidad",
    intro: "Piyali ya no ofrece práctica de {language}.",
    reason:
      "Creemos que la mejor manera de aprender esta lengua y apoyar su futuro es directamente con creadores, docentes y organizaciones lideradas por la comunidad local.",
    resources: "Recursos de aprendizaje comunitarios",
    dictionaries: "Diccionarios",
    creatorsTeachers: "Creadores y docentes",
    courses: "Cursos",
    empty: "Aún no se han agregado recursos.",
    close: "Elegir otro idioma",
  },
  pt: {
    title: "Aprenda {language} com especialistas da comunidade",
    intro: "O Piyali não oferece mais prática de {language}.",
    reason:
      "Acreditamos que a melhor forma de aprender essa língua e apoiar seu futuro é diretamente com criadores, professores e organizações lideradas pela comunidade local.",
    resources: "Recursos de aprendizagem da comunidade",
    dictionaries: "Dicionários",
    creatorsTeachers: "Criadores e professores",
    courses: "Cursos",
    empty: "Nenhum recurso adicionado ainda.",
    close: "Escolher outro idioma",
  },
  it: {
    title: "Impara {language} con esperti della comunità",
    intro: "Piyali non offre più esercizi di {language}.",
    reason:
      "Crediamo che il modo migliore per imparare questa lingua e sostenerne il futuro sia rivolgersi direttamente a creator, insegnanti e organizzazioni guidate dalla comunità locale.",
    resources: "Risorse didattiche della comunità",
    dictionaries: "Dizionari",
    creatorsTeachers: "Creator e insegnanti",
    courses: "Corsi",
    empty: "Nessuna risorsa aggiunta per ora.",
    close: "Scegli un'altra lingua",
  },
  fr: {
    title: "Apprends {language} avec des experts de la communauté",
    intro: "Piyali ne propose plus d'exercices en {language}.",
    reason:
      "Nous pensons que la meilleure façon d'apprendre cette langue et de soutenir son avenir est de passer directement par des créateurs, des enseignants et des organisations de la communauté locale.",
    resources: "Ressources d'apprentissage communautaires",
    dictionaries: "Dictionnaires",
    creatorsTeachers: "Créateurs et enseignants",
    courses: "Cours",
    empty: "Aucune ressource ajoutée pour le moment.",
    close: "Choisir une autre langue",
  },
  de: {
    title: "Lerne {language} mit Fachleuten aus der Community",
    intro: "Piyali bietet keine Übungen für {language} mehr an.",
    reason:
      "Wir glauben, dass man diese Sprache am besten direkt bei lokalen Kreativen, Lehrkräften und gemeinschaftlich geführten Organisationen lernt und so ihre Zukunft unterstützt.",
    resources: "Lernangebote aus der Community",
    dictionaries: "Wörterbücher",
    creatorsTeachers: "Kreative und Lehrkräfte",
    courses: "Kurse",
    empty: "Noch keine Angebote hinzugefügt.",
    close: "Andere Sprache wählen",
  },
  ja: {
    title: "コミュニティの専門家と{language}を学ぶ",
    intro: "Piyaliでは{language}の練習提供を終了しました。",
    reason:
      "この言語を学び、その未来を支える最善の方法は、地域のクリエイター、教師、コミュニティ主導の団体から直接学ぶことだと考えています。",
    resources: "コミュニティの学習リソース",
    dictionaries: "辞書",
    creatorsTeachers: "クリエイターと教師",
    courses: "コース",
    empty: "リソースはまだ追加されていません。",
    close: "別の言語を選ぶ",
  },
  hi: {
    title: "समुदाय के विशेषज्ञों के साथ {language} सीखें",
    intro: "Piyali अब {language} अभ्यास उपलब्ध नहीं कराता।",
    reason:
      "हमारा मानना है कि इस भाषा को सीखने और इसके भविष्य को सहयोग देने का सबसे अच्छा तरीका स्थानीय रचनाकारों, शिक्षकों और समुदाय-संचालित संगठनों से सीधे जुड़ना है।",
    resources: "समुदाय के शिक्षण संसाधन",
    dictionaries: "शब्दकोश",
    creatorsTeachers: "रचनाकार और शिक्षक",
    courses: "पाठ्यक्रम",
    empty: "अभी कोई संसाधन नहीं जोड़ा गया है।",
    close: "कोई दूसरी भाषा चुनें",
  },
  ar: {
    title: "اتعلّم {language} مع خبراء من المجتمع",
    intro: "Piyali مبقاش بيقدّم تدريب على {language}.",
    reason:
      "إحنا شايفين إن أحسن طريقة لتعلّم اللغة ودعم مستقبلها هي التواصل مباشرةً مع صناع محتوى ومدرسين ومؤسسات بيقودها المجتمع المحلي.",
    resources: "مصادر تعلّم من المجتمع",
    dictionaries: "قواميس",
    creatorsTeachers: "صناع محتوى ومدرسين",
    courses: "كورسات",
    empty: "لسه مفيش مصادر مضافة.",
    close: "اختار لغة تانية",
  },
  zh: {
    title: "向社区专家学习{language}",
    intro: "Piyali 已不再提供{language}练习。",
    reason:
      "我们相信，学习这门语言并支持其未来的最佳方式，是直接向本地创作者、教师和社区主导的组织学习。",
    resources: "社区学习资源",
    dictionaries: "词典",
    creatorsTeachers: "创作者与教师",
    courses: "课程",
    empty: "尚未添加资源。",
    close: "选择其他语言",
  },
};

const RESOURCE_GROUPS = [
  { key: "dictionaries", labelKey: "dictionaries" },
  { key: "creatorsTeachers", labelKey: "creatorsTeachers" },
  { key: "courses", labelKey: "courses" },
];

const withLanguage = (value, language) =>
  String(value || "").replace("{language}", language);

export default function CommunityLanguageResourcesModal({
  isOpen,
  onClose,
  languageCode,
  appLanguage = "en",
}) {
  const themeMode = useThemeStore((state) => state.themeMode);
  const isLightTheme = themeMode === "light";
  const resolvedAppLanguage = normalizeSupportLanguage(
    appLanguage,
    DEFAULT_SUPPORT_LANGUAGE,
  );
  const copy = COPY[resolvedAppLanguage] || COPY.en;
  const language = getLanguageLabel(
    languageCode,
    translations[resolvedAppLanguage] || translations.en,
  );
  const resources = COMMUNITY_LANGUAGE_RESOURCES[languageCode] || {};
  const isRtl = getLanguageDirection(resolvedAppLanguage) === "rtl";

  useEscapeToClose(isOpen, onClose);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      size="lg"
      motionPreset="none"
      closeOnEsc={false}
      returnFocusOnClose={false}
    >
      <ModalOverlay
        motionProps={nativeOverlayMotionProps}
        bg="var(--app-overlay)"
      />
      <ModalContent
        motionProps={nativeModalMotionProps}
        bg={isLightTheme ? "var(--app-surface-elevated)" : "gray.900"}
        color={isLightTheme ? "var(--app-text-primary)" : "gray.100"}
        border="1px solid"
        borderColor={isLightTheme ? "var(--app-border)" : "gray.700"}
        borderRadius="2xl"
        mx={4}
        maxH="calc(100dvh - 32px)"
        overflow="hidden"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <ModalHeader pl={isRtl ? 16 : undefined} pr={isRtl ? undefined : 16}>
          <HStack spacing={3} align="center">
            <Box
              as={LuHeartHandshake}
              color={isLightTheme ? "teal.600" : "teal.300"}
              boxSize={6}
              flexShrink={0}
            />
            <Text>{withLanguage(copy.title, language)}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton
          left={isRtl ? 3 : undefined}
          right={isRtl ? undefined : 3}
        />
        <ModalBody pb={5} overflowY="auto">
          <VStack align="stretch" spacing={5}>
            <Box>
              <Text fontWeight="semibold" mb={2}>
                {withLanguage(copy.intro, language)}
              </Text>
              <Text
                color={
                  isLightTheme
                    ? "var(--app-text-secondary)"
                    : "gray.300"
                }
                lineHeight="tall"
              >
                {copy.reason}
              </Text>
            </Box>

            <Box
              border="1px solid"
              borderColor={isLightTheme ? "var(--app-border)" : "gray.700"}
              bg={isLightTheme ? "var(--app-surface-muted)" : "gray.800"}
              borderRadius="xl"
              p={4}
            >
              <Text fontSize="sm" fontWeight="bold" mb={3}>
                {copy.resources}
              </Text>
              <VStack align="stretch" spacing={4}>
                {RESOURCE_GROUPS.map((group) => {
                  const groupResources = resources[group.key] || [];
                  return (
                    <Box key={group.key}>
                      <Text fontSize="sm" fontWeight="semibold" mb={2}>
                        {copy[group.labelKey]}
                      </Text>
                      {groupResources.length > 0 ? (
                        <VStack align="stretch" spacing={2}>
                          {groupResources.map((resource) => (
                            <Link
                              key={resource.url}
                              href={resource.url}
                              isExternal
                              display="block"
                              borderRadius="lg"
                              px={3}
                              py={2.5}
                              bg={
                                isLightTheme ? "white" : "whiteAlpha.100"
                              }
                              _hover={{
                                textDecoration: "none",
                                bg: isLightTheme
                                  ? "teal.50"
                                  : "whiteAlpha.200",
                              }}
                            >
                              <HStack justify="space-between" align="start">
                                <Box>
                                  <Text fontWeight="semibold">
                                    {resource.name}
                                  </Text>
                                  {resource.description && (
                                    <Text
                                      mt={1}
                                      fontSize="sm"
                                      color={
                                        isLightTheme
                                          ? "var(--app-text-secondary)"
                                          : "gray.400"
                                      }
                                    >
                                      {resource.description}
                                    </Text>
                                  )}
                                </Box>
                                <Box
                                  as={FiExternalLink}
                                  mt={1}
                                  flexShrink={0}
                                />
                              </HStack>
                            </Link>
                          ))}
                        </VStack>
                      ) : (
                        <Box
                          border="1px dashed"
                          borderColor={
                            isLightTheme ? "var(--app-border)" : "gray.600"
                          }
                          borderRadius="lg"
                          px={3}
                          py={2.5}
                        >
                          <Text
                            fontSize="sm"
                            color={
                              isLightTheme
                                ? "var(--app-text-muted)"
                                : "gray.400"
                            }
                          >
                            {copy.empty}
                          </Text>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter
          borderTop="1px solid"
          borderColor={isLightTheme ? "var(--app-border)" : "gray.800"}
        >
          <Button colorScheme="teal" onClick={onClose}>
            {copy.close}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
