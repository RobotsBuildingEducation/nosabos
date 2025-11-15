import { useEffect, useMemo, useState } from "react";
import {
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
import TeamFeed from "./TeamFeed";
import TeamCreation from "./TeamCreation";
import TeamView from "./TeamView";
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
  const t = useMemo(() => overrideTranslations || translations[userLanguage] || translations.en, [overrideTranslations, userLanguage]);

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
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="lg">
      <DrawerOverlay />
      <DrawerContent display="flex" flexDirection="column">
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">
          {t?.teams_drawer_title || "Teams & Community"}
        </DrawerHeader>
        <DrawerBody overflowY="auto" flex="1">
          <Tabs index={selectedTab} onChange={handleTabChange} variant="enclosed" isFitted>
            <TabList mb={4}>
              <Tab>{t?.teams_tab_feed || "Global feed"}</Tab>
              <Tab>{t?.teams_tab_create || "Create team"}</Tab>
              <Tab>
                {t?.teams_tab_view || "View teams"}
                {pendingInviteCount > 0 ? ` (${pendingInviteCount})` : ""}
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <TeamFeed
                  userLanguage={userLanguage}
                  t={t}
                  allowPosts={allowPosts}
                  onAllowPostsChange={onAllowPostsChange}
                />
              </TabPanel>
              <TabPanel>
                <TeamCreation userLanguage={userLanguage} onTeamCreated={handleTeamCreated} t={t} />
              </TabPanel>
              <TabPanel px={0}>
                <TeamView userLanguage={userLanguage} refreshTrigger={refreshTrigger} t={t} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px">
          <Button onClick={onClose}>{t?.teams_drawer_close || "Close"}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
