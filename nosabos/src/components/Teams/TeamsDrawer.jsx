import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
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

export default function TeamsDrawer({
  isOpen,
  onClose,
  userLanguage,
  t: overrideTranslations,
  pendingInviteCount,
  allowPosts,
  onAllowPostsChange,
}) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const t = useMemo(
    () => overrideTranslations || translations[userLanguage] || translations.en,
    [overrideTranslations, userLanguage],
  );
  const swipeDismiss = useBottomDrawerSwipeDismiss({
    isOpen,
    onClose,
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedTab(0);
    }
  }, [isOpen]);

  const handleTeamCreated = () => {
    setSelectedTab(2);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleTabChange = (index) => {
    setSelectedTab(index);
    if (index === 2) {
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="bottom">
      <DrawerOverlay
        bg="blackAlpha.600"
        opacity={swipeDismiss.overlayOpacity}
        transition="opacity 0.18s ease"
      />
      <DrawerContent
        {...swipeDismiss.drawerContentProps}
        display="flex"
        flexDirection="column"
        bg="gray.900"
        color="white"
        borderTopRadius="24px"
        h="80vh"
        sx={{
          "@supports (height: 100dvh)": {
            height: "80dvh",
          },
        }}
      >
        <BottomDrawerDragHandle isDragging={swipeDismiss.isDragging} />
        <DrawerCloseButton color="white" top={4} right={4} />
        <DrawerHeader borderBottomWidth="1px" borderColor="whiteAlpha.200" pr={12}>
          <Box maxW="720px" mx="auto" w="100%">
            {t?.teams_drawer_title || "Teams & Community"}
          </Box>
        </DrawerHeader>
        <DrawerBody overflowY="auto" flex="1" bg="gray.900" pb={4}>
          <Box maxW="720px" mx="auto" w="100%">
            <Tabs
              index={selectedTab}
              onChange={handleTabChange}
              variant="enclosed"
              isFitted
              colorScheme="purple"
            >
              <TabList mb={4} borderColor="whiteAlpha.200">
                <Tab
                  color="gray.300"
                  _selected={{
                    color: "white",
                    borderColor: "purple.400",
                    bg: "whiteAlpha.200",
                  }}
                >
                  {t?.teams_tab_feed || "Global feed"}
                </Tab>
                <Tab
                  color="gray.300"
                  _selected={{
                    color: "white",
                    borderColor: "purple.400",
                    bg: "whiteAlpha.200",
                  }}
                >
                  {t?.teams_tab_create || "Create team"}
                </Tab>
                <Tab
                  color="gray.300"
                  _selected={{
                    color: "white",
                    borderColor: "purple.400",
                    bg: "whiteAlpha.200",
                  }}
                >
                  {t?.teams_tab_view || "View teams"}
                  {pendingInviteCount > 0 ? ` (${pendingInviteCount})` : ""}
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel px={0}>
                  <TeamFeed
                    t={t}
                    allowPosts={allowPosts}
                    onAllowPostsChange={onAllowPostsChange}
                  />
                </TabPanel>
                <TabPanel>
                  <TeamCreation
                    userLanguage={userLanguage}
                    onTeamCreated={handleTeamCreated}
                    t={t}
                  />
                </TabPanel>
                <TabPanel px={0}>
                  <TeamView
                    userLanguage={userLanguage}
                    refreshTrigger={refreshTrigger}
                    t={t}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px" borderColor="whiteAlpha.200">
          <Box maxW="720px" mx="auto" w="100%" display="flex" justifyContent="flex-end">
            <Button variant={"ghost"} onClick={onClose}>
              {t?.teams_drawer_close || "Close"}
            </Button>
          </Box>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
