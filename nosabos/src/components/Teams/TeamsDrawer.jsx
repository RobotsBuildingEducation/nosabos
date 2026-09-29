import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import BottomDrawerDragHandle from "../BottomDrawerDragHandle";
import TeamFeed from "./TeamFeed";
import TeamCreation from "./TeamCreation";
import TeamView from "./TeamView";
import useBottomDrawerSwipeDismiss from "../../hooks/useBottomDrawerSwipeDismiss";
import { translations } from "../../utils/translation.jsx";
import { useThemeStore } from "../../useThemeStore";
import { nativeDrawerMotionProps } from "../../utils/modalMotion";

const APP_SURFACE = "var(--app-surface)";
const APP_BORDER = "var(--app-border)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_SHADOW = "var(--app-shadow-soft)";

const TEAM_TAB_STYLE = {
  px: 0,
  pt: 0,
  pb: 2,
  position: "relative",
  fontWeight: "semibold",
  color: "var(--app-text-muted)",
  borderRadius: 0,
  bg: "transparent",
  border: "none",
  boxShadow: "none",
  outline: "none",
  _active: { bg: "transparent" },
  _hover: { color: "var(--app-text-primary)", borderColor: "transparent" },
  _focus: { boxShadow: "none", outline: "none", borderColor: "transparent" },
  _focusVisible: {
    boxShadow: "none",
    outline: "none",
    borderColor: "transparent",
  },
  _after: {
    content: '""',
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "3px",
    borderRadius: "full",
    bgGradient: "linear(to-r, cyan.300, teal.400)",
    opacity: 0,
    transform: "scaleX(0.7)",
    transformOrigin: "center",
    transition: "all 0.2s ease",
  },
  _selected: {
    color: "var(--app-text-primary)",
    _after: { opacity: 1, transform: "scaleX(1)" },
  },
};

export default function TeamsDrawer({
  isOpen,
  fetchGlobalTeamFeed,
  onClose,
  userLanguage,
  currentUser,
  targetLang,
  t: overrideTranslations,
  pendingInviteCount,
  initialTeams = null,
  initialTeamMemberProgress = null,
  initialTeamInvites = null,
  hasUnseenInvites = false,
  onInvitesViewed,
}) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [justCreatedTeam, setJustCreatedTeam] = useState(null);
  const [hasTeams, setHasTeams] = useState(
    () => Array.isArray(initialTeams) && initialTeams.length > 0,
  );
  const t = useMemo(
    () => overrideTranslations || translations[userLanguage] || translations.en,
    [overrideTranslations, userLanguage],
  );
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const swipeDismiss = useBottomDrawerSwipeDismiss({
    isOpen,
    onClose,
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedTab(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (Array.isArray(initialTeams)) {
      setHasTeams(initialTeams.length > 0);
    }
  }, [initialTeams]);

  useEffect(() => {
    const teamsTabIndex = hasTeams ? 0 : 1;
    if (
      isOpen &&
      selectedTab === teamsTabIndex &&
      pendingInviteCount > 0 &&
      hasUnseenInvites
    ) {
      onInvitesViewed?.();
    }
  }, [
    hasTeams,
    hasUnseenInvites,
    isOpen,
    onInvitesViewed,
    pendingInviteCount,
    selectedTab,
  ]);

  const handleTeamCreated = (team) => {
    setJustCreatedTeam(team);
    setHasTeams(true);
    setSelectedTab(0);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleTabChange = (index) => {
    setSelectedTab(index);
    if (index === (hasTeams ? 0 : 1)) {
      onInvitesViewed?.();
    }
    if (index === (hasTeams ? 0 : 1)) {
      setRefreshTrigger((prev) => prev + 1);
    }
  };


  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="bottom">
      {/* <DrawerOverlay
        {...swipeDismiss.overlayProps}
        motionProps={nativeOverlayMotionProps}
        bg={isLightTheme ? "rgba(76, 60, 40, 0.18)" : "blackAlpha.600"}
        backdropFilter="blur(4px)"
      /> */}
      <DrawerContent
        {...swipeDismiss.drawerContentProps}
        motionProps={nativeDrawerMotionProps}
        display="flex"
        flexDirection="column"
        bg={isLightTheme ? APP_SURFACE : "gray.900"}
        color={isLightTheme ? APP_TEXT_PRIMARY : "white"}
        borderTopRadius="24px"
        h="80vh"
        boxShadow={isLightTheme ? APP_SHADOW : undefined}
        borderTop={isLightTheme ? `1px solid ${APP_BORDER}` : undefined}
        sx={{
          "@supports (height: 100dvh)": {
            height: "80dvh",
          },
        }}
      >
        <BottomDrawerDragHandle isDragging={swipeDismiss.isDragging} />
        <DrawerCloseButton
          color={isLightTheme ? APP_TEXT_SECONDARY : "white"}
          _hover={{ color: isLightTheme ? APP_TEXT_PRIMARY : "white" }}
          top={4}
          right={4}
        />
        <DrawerHeader pb={0} pr={12}>
          <Box maxW="720px" mx="auto" w="100%">
            {t?.teams_drawer_title || "Teams"}
          </Box>
        </DrawerHeader>
        <DrawerBody
          overflowY="auto"
          flex="1"
          pt={0}
          pb={6}
        >
          <Box maxW="720px" mx="auto" w="100%">
            <Tabs
              index={selectedTab}
              onChange={handleTabChange}
              variant="unstyled"
            >
              <TabList
                gap={{ base: 4, md: 6 }}
                justifyContent="center"
                border="none"
                mb={2}
              >
                {hasTeams && <Tab {...TEAM_TAB_STYLE} fontSize={{ base: "sm", md: "md" }}>
                  {t?.teams_tab_view || "Teams"}
                  {pendingInviteCount > 0 ? ` (${pendingInviteCount})` : ""}
                  {hasUnseenInvites && (
                    <Box
                      as="span"
                      aria-hidden="true"
                      display="inline-block"
                      verticalAlign="middle"
                      ml={2}
                      w="8px"
                      h="8px"
                      borderRadius="full"
                      bg="red.500"
                    />
                  )}
                </Tab>}
                <Tab {...TEAM_TAB_STYLE} fontSize={{ base: "sm", md: "md" }}>
                  {t?.teams_tab_feed || "Global feed"}
                </Tab>
                {!hasTeams && <Tab {...TEAM_TAB_STYLE} fontSize={{ base: "sm", md: "md" }}>
                  {t?.teams_tab_view || "Teams"}
                  {pendingInviteCount > 0 ? ` (${pendingInviteCount})` : ""}
                  {hasUnseenInvites && (
                    <Box
                      as="span"
                      aria-hidden="true"
                      display="inline-block"
                      verticalAlign="middle"
                      ml={2}
                      w="8px"
                      h="8px"
                      borderRadius="full"
                      bg="red.500"
                    />
                  )}
                </Tab>}
              </TabList>
              <TabPanels>
                {hasTeams && <TabPanel px={0}>
                  <TeamCreation
                    userLanguage={userLanguage}
                    onTeamCreated={handleTeamCreated}
                    t={t}
                  />
                  <TeamView
                    userLanguage={userLanguage}
                    refreshTrigger={refreshTrigger}
                    isOpen={isOpen}
                    initialTeams={initialTeams}
                    initialTeamMemberProgress={initialTeamMemberProgress}
                    initialTeamInvites={initialTeamInvites}
                    justCreatedTeam={justCreatedTeam}
                    currentUser={currentUser}
                    targetLang={targetLang}
                    t={t}
                  />
                </TabPanel>}
                <TabPanel px={0}>
                  <TeamFeed
                    t={t}
                    fetchGlobalTeamFeed={fetchGlobalTeamFeed}
                  />
                </TabPanel>
                {!hasTeams && <TabPanel>
                  <TeamCreation
                    userLanguage={userLanguage}
                    onTeamCreated={handleTeamCreated}
                    t={t}
                  />
                  <TeamView
                    userLanguage={userLanguage}
                    refreshTrigger={refreshTrigger}
                    isOpen={isOpen}
                    initialTeams={initialTeams}
                    initialTeamMemberProgress={initialTeamMemberProgress}
                    initialTeamInvites={initialTeamInvites}
                    justCreatedTeam={justCreatedTeam}
                    currentUser={currentUser}
                    targetLang={targetLang}
                    t={t}
                  />
                </TabPanel>}
              </TabPanels>
            </Tabs>
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
