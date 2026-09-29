import { useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Skeleton,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { ImExit } from "react-icons/im";
import {
  acceptTeamInvite,
  deleteTeam,
  getTeamMemberProgress,
  getUserTeamInvites,
  getUserTeams,
  leaveTeam,
  rejectTeamInvite,
  renameTeam,
  subscribeToTeamInvites,
  subscribeToTeamUpdates,
} from "../../utils/teams";
import {
  progressSnapshot,
  publishLearningProgress,
  teamProgressRow,
} from "../../utils/learningTeams";
import TeamCompanionAvatar from "./TeamCompanionAvatar";
import TeamCreation from "./TeamCreation";
import { WaveBar } from "../WaveBar";
import { useThemeStore } from "../../useThemeStore";

const APP_SURFACE = "var(--app-surface)";
const APP_BORDER = "var(--app-border)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_SHADOW = "var(--app-shadow-soft)";

export default function TeamView({
  refreshTrigger,
  isOpen,
  initialTeams = null,
  initialTeamMemberProgress = null,
  initialTeamInvites = null,
  justCreatedTeam = null,
  currentUser,
  targetLang,
  t,
}) {
  const toast = useToast();
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const [myTeams, setMyTeams] = useState(() => {
    const base = Array.isArray(initialTeams) ? initialTeams : [];
    if (justCreatedTeam) {
      return base.some(
        (team) =>
          team.id === justCreatedTeam.id &&
          team.createdBy === justCreatedTeam.createdBy,
      )
        ? base
        : [justCreatedTeam, ...base];
    }
    return base;
  });
  const [teamInvites, setTeamInvites] = useState(() => initialTeamInvites || []);
  const [teamMemberProgress, setTeamMemberProgress] = useState(() => {
    const base = initialTeamMemberProgress ? { ...initialTeamMemberProgress } : {};
    if (justCreatedTeam) {
      const creatorNpub =
        justCreatedTeam.createdBy ||
        (typeof window !== "undefined" ? localStorage.getItem("local_npub") : "");
      const snapshot = currentUser ? progressSnapshot(currentUser, targetLang) : null;
      if (snapshot && creatorNpub) {
        base[justCreatedTeam.id] = [teamProgressRow(creatorNpub, snapshot, true)];
      }
    }
    return base;
  });
  const [teamProgressLoading, setTeamProgressLoading] = useState(() =>
    justCreatedTeam ? { [justCreatedTeam.id]: true } : {},
  );
  const [loading, setLoading] = useState(!Array.isArray(initialTeams) && !justCreatedTeam);
  const [processingInvite, setProcessingInvite] = useState(null);
  const [sharingError, setSharingError] = useState("");
  const [editingTeam, setEditingTeam] = useState(null);
  const [editedTeamName, setEditedTeamName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const hasConsumedInitialTeams = useRef(false);
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const userNpub = useMemo(
    () =>
      typeof window !== "undefined" ? localStorage.getItem("local_npub") : "",
    [],
  );
  const teamSubscriptionKey = JSON.stringify(myTeams.map((team) => ({
    id: team.id,
    createdBy: team.createdBy,
    isCreator: team.isCreator,
  })));
  const hasNostrTeams = myTeams.some((team) => Boolean(team.nostr));
  const shareSnapshot = currentUser ? progressSnapshot(currentUser, targetLang) : null;
  const shareKey = shareSnapshot ? JSON.stringify({ ...shareSnapshot, updatedAt: 0 }) : "";

  useEffect(() => {
    if (!isOpen || !userNpub || !hasNostrTeams || !shareKey) return undefined;
    const timer = window.setTimeout(() => {
      const userData = currentUserRef.current;
      if (!userData) return;
      const snapshot = progressSnapshot(userData, targetLang);
      setTeamMemberProgress((previous) => Object.fromEntries(
        Object.entries(previous).map(([teamId, rows]) => [teamId, rows.map((row) =>
          row.npub === userNpub
            ? teamProgressRow(userNpub, snapshot, row.isCreator)
            : row
        )]),
      ));
      publishLearningProgress(userNpub, userData, targetLang)
        .then(() => setSharingError(""))
        .catch((error) => {
          console.error("Could not share team progress", error);
          setSharingError(error?.message || "The relay did not accept your update");
        });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [hasNostrTeams, isOpen, shareKey, targetLang, userNpub]);

  const loadData = async () => {
    if (!userNpub) return;
    const canUsePreloadedTeams =
      Array.isArray(initialTeams) && !hasConsumedInitialTeams.current;
    hasConsumedInitialTeams.current = true;
    if (!canUsePreloadedTeams && !justCreatedTeam) setLoading(true);

    try {
      if (canUsePreloadedTeams) {
        setMyTeams(initialTeams);
        if (Array.isArray(initialTeamInvites)) setTeamInvites(initialTeamInvites);
        if (initialTeamMemberProgress) setTeamMemberProgress(initialTeamMemberProgress);
      }

      const [teams, invites] = await Promise.all([
        getUserTeams(userNpub),
        getUserTeamInvites(userNpub),
      ]);
      const mergedTeams =
        justCreatedTeam &&
        !teams.some(
          (team) =>
            team.id === justCreatedTeam.id &&
            team.createdBy === justCreatedTeam.createdBy,
        )
          ? [justCreatedTeam, ...teams]
          : teams;
      setMyTeams(mergedTeams);
      setTeamInvites(invites);
      setLoading(false);

      // The signed-in user's data is already in memory. Show their row while
      // relay/member progress for the rest of the team is still loading.
      const creatorRows = {};
      const creatorSnapshot = currentUserRef.current
        ? progressSnapshot(currentUserRef.current, targetLang)
        : null;
      if (creatorSnapshot) {
        mergedTeams.forEach((team) => {
          if (team.isCreator) {
            creatorRows[team.id] = [teamProgressRow(userNpub, creatorSnapshot, true)];
          }
        });
        setTeamMemberProgress((previous) => ({ ...previous, ...creatorRows }));
      }

      setTeamProgressLoading(Object.fromEntries(mergedTeams.map((team) => [team.id, true])));
      const progressData = {};
      const results = await Promise.allSettled(mergedTeams.map((team) => {
        const creatorNpub = team.isCreator ? userNpub : team.createdBy;
        return getTeamMemberProgress(creatorNpub, team.id, userNpub, currentUserRef.current, targetLang);
      }));
      results.forEach((result, index) => {
        progressData[mergedTeams[index].id] = result.status === "fulfilled"
          ? result.value
          : creatorRows[mergedTeams[index].id] || null;
        if (result.status === "rejected") console.error("Team progress error", result.reason);
      });
      setTeamMemberProgress((previous) => ({ ...previous, ...progressData }));
      setTeamProgressLoading((previous) => Object.fromEntries(
        Object.keys(previous).map((teamId) => [teamId, false]),
      ));
    } catch (error) {
      console.error("load teams error", error);
      toast({
        title: t?.teams_view_error || "Error",
        description: error.message || "Unable to load teams",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!justCreatedTeam) return;
    setLoading(false);
    setMyTeams((previous) => previous.some((team) =>
      team.id === justCreatedTeam.id && team.createdBy === justCreatedTeam.createdBy
    ) ? previous : [justCreatedTeam, ...previous]);
    setTeamProgressLoading((previous) => ({ ...previous, [justCreatedTeam.id]: true }));
    const snapshot = currentUserRef.current
      ? progressSnapshot(currentUserRef.current, targetLang)
      : null;
    if (snapshot) {
      setTeamMemberProgress((previous) => ({
        ...previous,
        [justCreatedTeam.id]: [teamProgressRow(userNpub, snapshot, true)],
      }));
    }
  }, [justCreatedTeam, targetLang, userNpub]);

  useEffect(() => {
    if (
      !Array.isArray(initialTeams) ||
      hasConsumedInitialTeams.current
    ) {
      return;
    }
    setMyTeams(initialTeams);
    setLoading(false);
  }, [initialTeams]);

  useEffect(() => {
    if (initialTeamMemberProgress) {
      setTeamMemberProgress((previous) => {
        const next = { ...previous };
        for (const [teamId, rows] of Object.entries(initialTeamMemberProgress)) {
          if (next[teamId] == null) next[teamId] = rows;
        }
        return next;
      });
    }
  }, [initialTeamMemberProgress]);

  useEffect(() => {
    if (initialTeamInvites) setTeamInvites(initialTeamInvites);
  }, [initialTeamInvites]);

  useEffect(() => {
    if (!isOpen) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userNpub, refreshTrigger]);

  useEffect(() => {
    if (!userNpub) return undefined;
    const unsubscribe = subscribeToTeamInvites(userNpub, (invites) => {
      setTeamInvites(invites);
    });
    return () => unsubscribe?.();
  }, [userNpub]);

  useEffect(() => {
    const teamRefs = JSON.parse(teamSubscriptionKey);
    if (!isOpen || !teamRefs.length || !userNpub) return () => {};
    const unsubscribers = teamRefs.map((team) => {
      const creatorNpub = team.isCreator ? userNpub : team.createdBy;
      return subscribeToTeamUpdates(
        creatorNpub,
        team.id,
        async (updatedTeam) => {
          if (!updatedTeam) return;
          setMyTeams((prev) =>
            prev.map((entry) =>
              entry.id === updatedTeam.id && entry.createdBy === creatorNpub
                ? { ...entry, ...updatedTeam }
                : entry,
            ),
          );
          try {
            const progress = await getTeamMemberProgress(creatorNpub, team.id, userNpub, currentUserRef.current, targetLang);
            setTeamMemberProgress((prev) => ({ ...prev, [team.id]: progress }));
          } catch (error) {
            console.error("refresh progress error", error);
          }
        },
      );
    });
    return () => {
      unsubscribers.forEach((fn) => fn && fn());
    };
  }, [isOpen, teamSubscriptionKey, targetLang, userNpub]);

  const handleAcceptInvite = async (inviteId) => {
    setProcessingInvite(inviteId);
    try {
      await acceptTeamInvite(userNpub, inviteId);
      toast({
        title: t?.teams_view_invite_accepted || "Invite accepted",
        status: "success",
      });
      await loadData();
    } catch (error) {
      console.error("accept invite error", error);
      toast({
        title: t?.teams_view_error || "Error",
        description: error.message || "Unable to accept invite",
        status: "error",
      });
    } finally {
      setProcessingInvite(null);
    }
  };

  const handleRejectInvite = async (inviteId) => {
    setProcessingInvite(inviteId);
    try {
      await rejectTeamInvite(userNpub, inviteId);
      toast({
        title: t?.teams_view_invite_rejected || "Invite declined",
        status: "info",
      });
    } catch (error) {
      console.error("reject invite error", error);
      toast({
        title: t?.teams_view_error || "Error",
        description: error.message || "Unable to decline invite",
        status: "error",
      });
    } finally {
      setProcessingInvite(null);
    }
  };

  const handleDeleteTeam = async (team) => {
    const confirmMessage =
      t?.teams_view_delete_confirm?.replace("{team}", team.teamName) ||
      `Delete ${team.teamName}?`;
    if (!window.confirm(confirmMessage)) return;
    try {
      await deleteTeam(userNpub, team.id);
      toast({
        title: t?.teams_view_deleted || "Team deleted",
        status: "success",
      });
      setMyTeams((prev) => prev.filter((entry) => entry.id !== team.id));
      setTeamMemberProgress((prev) => {
        const updated = { ...prev };
        delete updated[team.id];
        return updated;
      });
    } catch (error) {
      console.error("delete team error", error);
      toast({
        title: t?.teams_view_error || "Error",
        description: error.message || "Unable to delete team",
        status: "error",
      });
    }
  };

  const handleLeaveTeam = async (team) => {
    const confirmMessage =
      t?.teams_view_leave_confirm?.replace("{team}", team.teamName) ||
      `Leave ${team.teamName}?`;
    if (!window.confirm(confirmMessage)) return;
    try {
      await leaveTeam(userNpub, team.createdBy, team.id);
      toast({
        title: t?.teams_view_left || "Left team",
        status: "success",
      });
      await loadData();
    } catch (error) {
      console.error("leave team error", error);
      toast({
        title: t?.teams_view_error || "Error",
        description: error.message || "Unable to leave team",
        status: "error",
      });
    }
  };

  const openTeamEditor = (team) => {
    setEditingTeam(team);
    setEditedTeamName(team.teamName || "");
  };

  const closeTeamEditor = () => {
    if (!isSavingName) setEditingTeam(null);
  };

  const handleRenameTeam = async () => {
    if (!editingTeam || isSavingName) return;
    setIsSavingName(true);
    try {
      const result = await renameTeam(userNpub, editingTeam, editedTeamName);
      setMyTeams((teams) => teams.map((team) =>
        team.id === editingTeam.id && team.createdBy === editingTeam.createdBy
          ? { ...team, teamName: result.name }
          : team
      ));
      setEditingTeam(null);
      toast({
        title: t?.teams_edit_success || "Team renamed",
        description: result.mirrorSynced
          ? undefined
          : "The team name changed, but some local copies may still show the old name",
        status: result.mirrorSynced ? "success" : "warning",
      });
    } catch (error) {
      console.error("rename team error", error);
      toast({
        title: t?.teams_view_error || "Error",
        description: error.message || "Unable to rename team",
        status: "error",
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const pendingInvites = teamInvites.filter(
    (invite) => invite.status === "pending",
  );

  if (loading) {
    return (
      <HStack py={8} spacing={2} justify="center" role="status" aria-live="polite">
        <Text fontSize="sm" color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}>
          {(t?.teams_view_loading || "Loading teams...").replace(/[.…]+$/, "")}
        </Text>
        <HStack
          as="span"
          spacing={1}
          align="center"
          sx={{
            "@keyframes teams-loading-dot": {
              "0%, 60%, 100%": { opacity: 0.3, transform: "translateY(0)" },
              "30%": { opacity: 1, transform: "translateY(-3px)" },
            },
          }}
        >
          {[0, 1, 2].map((dot) => (
            <Box
              key={dot}
              as="span"
              w="4px"
              h="4px"
              borderRadius="full"
              bg={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
              animation="teams-loading-dot 1s ease-in-out infinite"
              style={{ animationDelay: `${dot * 0.16}s` }}
            />
          ))}
        </HStack>
      </HStack>
    );
  }

  const hasSingleTeam = myTeams.length === 1;
  const TeamList = hasSingleTeam ? Box : Accordion;
  const TeamListItem = hasSingleTeam ? Box : AccordionItem;
  const TeamPanel = hasSingleTeam ? Box : AccordionPanel;

  return (
    <VStack align="stretch" spacing={6}>
      {sharingError && (
        <Text fontSize="sm" color="orange.400">
          Your Score and companion have not synced to Nostr: {sharingError}
        </Text>
      )}
      {pendingInvites.length > 0 && (
        <Box>
          <Text fontWeight="bold" mb={3}>
            {t?.teams_view_pending || "Pending invitations"}
          </Text>
          <VStack spacing={3} align="stretch">
            {pendingInvites.map((invite) => (
              <Box
                key={invite.id}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                borderColor={isLightTheme ? "cyan.200" : "cyan.800"}
                bg={isLightTheme ? APP_SURFACE : undefined}
                boxShadow={isLightTheme ? APP_SHADOW : undefined}
              >
                <Text fontWeight="bold">{invite.teamName}</Text>
                <Text
                  fontSize="sm"
                  color={isLightTheme ? APP_TEXT_SECONDARY : "whiteAlpha.800"}
                >
                  {t?.teams_view_invited_by || "Invited by"}:{" "}
                  {invite.invitedByName || invite.invitedBy}
                </Text>
                <HStack spacing={2} mt={3} justify="flex-end">
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="cyan"
                    onClick={() => handleAcceptInvite(invite.id)}
                    isLoading={processingInvite === invite.id}
                  >
                    {t?.teams_view_accept || "Accept"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    color={isLightTheme ? "red.600" : "red.300"}
                    borderColor={isLightTheme ? "red.500" : "red.300"}
                    _hover={{
                      color: isLightTheme ? "red.700" : "red.200",
                      borderColor: isLightTheme ? "red.600" : "red.200",
                      bg: isLightTheme ? "red.50" : "whiteAlpha.100",
                    }}
                    _active={{
                      bg: isLightTheme ? "red.100" : "whiteAlpha.200",
                    }}
                    onClick={() => handleRejectInvite(invite.id)}
                    isLoading={processingInvite === invite.id}
                  >
                    {t?.teams_view_decline || "Decline"}
                  </Button>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>
      )}

      <Box>
        <Text fontWeight="bold" mb={3}>
          {`${t?.teams_view_my_teams || "My teams"} (${myTeams.length})`}
        </Text>
        {!myTeams.length ? null : (
          <TeamList {...(!hasSingleTeam ? { allowMultiple: true } : {})}>
            {myTeams.map((team) => {
              const progressStatus = teamMemberProgress[team.id];
              const progress = (progressStatus || []).slice().sort((a, b) =>
                Number(Boolean(b.isCreator)) - Number(Boolean(a.isCreator))
              );
              const acceptedMemberCount = (team.members || []).filter(
                (member) => member.status === "accepted",
              ).length + 1;
              const pendingMembers = (team.members || []).filter(
                (member) => member.status === "pending",
              );
              return (
                <TeamListItem
                  key={`${team.id}-${team.createdBy}`}
                  border="1px solid"
                  borderColor={isLightTheme ? APP_BORDER : "whiteAlpha.200"}
                  borderRadius="lg"
                  mb={3}
                  bg={isLightTheme ? APP_SURFACE : "transparent"}
                  boxShadow={isLightTheme ? APP_SHADOW : undefined}
                >
                  {hasSingleTeam ? (
                    <HStack px={4} py={3} spacing={2}>
                      {team.isCreator && (
                        <IconButton
                          size="xs"
                          variant="ghost"
                          aria-label={t?.teams_edit_button || "Edit team"}
                          icon={<FiEdit2 />}
                          color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
                          onClick={() => openTeamEditor(team)}
                        />
                      )}
                      <Text fontWeight="bold" noOfLines={1} minW={0}>{team.teamName}</Text>
                    </HStack>
                  ) : (
                    <h2>
                    <HStack px={2} spacing={1} w="full">
                      {team.isCreator && (
                        <IconButton
                          size="xs"
                          variant="ghost"
                          aria-label={t?.teams_edit_button || "Edit team"}
                          icon={<FiEdit2 />}
                          color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
                          onClick={() => openTeamEditor(team)}
                        />
                      )}
                      <AccordionButton
                        flex="1"
                        w="full"
                        minW={0}
                        _hover={{ bg: isLightTheme ? "var(--app-surface-muted)" : "whiteAlpha.100" }}
                        _focus={{ boxShadow: "none", outline: "none" }}
                        _focusVisible={{ boxShadow: "none", outline: "none" }}
                      >
                        <AccordionIcon mr={2} />
                        <Text fontWeight="bold" noOfLines={1}>{team.teamName}</Text>
                      </AccordionButton>
                    </HStack>
                    </h2>
                  )}
                  <TeamPanel p={hasSingleTeam ? 4 : undefined}>
                    <VStack align="stretch" spacing={4}>
                      {team.syncError && (
                        <Text fontSize="sm" color="orange.400">
                          Nostr team could not sync: {team.syncError}
                        </Text>
                      )}
                      {team.isCreator && (
                        <HStack justify="flex-end">
                          <TeamCreation
                            team={team}
                            onMembersAdded={() => void loadData()}
                            t={t}
                          />
                        </HStack>
                      )}
                      {progress.length || teamProgressLoading[team.id] ? (
                        <Box>
                          {progress.map((member) => (
                            <Box
                              key={member.npub}
                              mb={4}
                              p={{ base: 3, sm: 4 }}
                              borderWidth="1px"
                              borderColor={isLightTheme ? APP_BORDER : "whiteAlpha.200"}
                              borderRadius="xl"
                              bg={isLightTheme ? "var(--app-surface-elevated)" : "whiteAlpha.50"}
                            >
                              <HStack justify="space-between" mb={3}>
                                <Text fontWeight="semibold">
                                  {member.name || t?.teams_view_name_not_set || "Name Not Set Yet"}
                                </Text>
                                {member.targetLang && (
                                  <Text
                                    fontSize="xs"
                                    fontWeight="medium"
                                    color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
                                  >
                                    {member.targetLang.toUpperCase()}
                                  </Text>
                                )}
                              </HStack>
                              <SimpleGrid columns={{ base: 3 }} spacing={2} mb={4}>
                                {[
                                  {
                                    label: t?.teams_view_score || "Score",
                                    value: Math.round(Number(member.score) || 0),
                                  },
                                  {
                                    label: t?.teams_view_proficiency || "Proficiency",
                                    value: member.level || "—",
                                  },
                                  {
                                    label: t?.teams_view_total_xp || "Total XP",
                                    value: member.totalXp ?? 0,
                                  },
                                ].map((metric) => (
                                  <Box
                                    key={metric.label}
                                    minW={0}
                                    p={{ base: 2, sm: 3 }}
                                    borderRadius="lg"
                                    bg={isLightTheme ? APP_SURFACE : "whiteAlpha.100"}
                                  >
                                    <Text
                                      fontSize="xs"
                                      color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
                                      noOfLines={1}
                                    >
                                      {metric.label}
                                    </Text>
                                    <Text fontSize={{ base: "md", sm: "lg" }} fontWeight="bold" noOfLines={1}>
                                      {metric.value}
                                    </Text>
                                  </Box>
                                ))}
                              </SimpleGrid>

                              <HStack justify="space-between" mb={2}>
                                <Text fontSize="sm" fontWeight="semibold">
                                  {t?.teams_view_daily_xp || "Daily XP"}: {Math.round(
                                    Math.max(
                                      0,
                                      Math.min(100, Number(member.progressPercent) || 0),
                                    ),
                                  )}%
                                </Text>
                              </HStack>
                              <WaveBar
                                value={Math.max(0, Math.min(100, Number(member.progressPercent) || 0))}
                                height={14}
                                start="#fbbf24"
                                end="#f59e0b"
                                bg={isLightTheme ? "rgba(255, 255, 255, 0.58)" : "rgba(255,255,255,0.22)"}
                                border={isLightTheme ? "rgba(91, 75, 58, 0.10)" : "rgba(255,255,255,0.14)"}
                              />

                              <HStack
                                mt={4}
                                p={3}
                                spacing={3}
                                align="center"
                                borderRadius="xl"
                                bg={isLightTheme ? APP_SURFACE : "whiteAlpha.50"}
                                borderWidth="1px"
                                borderColor={isLightTheme ? APP_BORDER : "whiteAlpha.100"}
                              >
                                <TeamCompanionAvatar companion={member.companion} size={64} />
                                <Box minW={0} flex="1">
                                  <Text fontWeight="semibold" noOfLines={1}>
                                    {member.companion.name ||
                                      (member.companion.type === "ghost"
                                        ? "Ghost"
                                        : member.companion.type)}
                                  </Text>
                                  <Text
                                    fontSize="xs"
                                    color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
                                    mb={2}
                                  >
                                    {`${member.companion.type.charAt(0).toUpperCase()}${member.companion.type.slice(1)} · ${t?.teams_view_companion_level || "Level"} ${member.companion.level}`}
                                  </Text>
                                  <HStack spacing={2}>
                                    <Text
                                      fontSize="xs"
                                      color={isLightTheme ? APP_TEXT_SECONDARY : "gray.400"}
                                      whiteSpace="nowrap"
                                    >
                                      {t?.teams_view_companion_health || "Health"}
                                    </Text>
                                    <Box flex="1">
                                      <WaveBar
                                        value={member.companion.health}
                                        height={14}
                                        start="#60a5fa"
                                        end="#38bdf8"
                                        bg={isLightTheme ? "rgba(255, 255, 255, 0.58)" : "rgba(255,255,255,0.22)"}
                                        border={isLightTheme ? "rgba(91, 75, 58, 0.10)" : "rgba(255,255,255,0.14)"}
                                      />
                                    </Box>
                                    <Text fontSize="xs" fontWeight="medium" whiteSpace="nowrap">
                                      {member.companion.health}%
                                    </Text>
                                  </HStack>
                                </Box>
                              </HStack>
                            </Box>
                          ))}
                          {teamProgressLoading[team.id] && Array.from({
                            length: Math.max(0, acceptedMemberCount - progress.length),
                          }, (_, index) => (
                            <Box
                              key={`team-progress-skeleton-${team.id}-${index}`}
                              mb={4}
                              p={{ base: 3, sm: 4 }}
                              borderWidth="1px"
                              borderColor={isLightTheme ? APP_BORDER : "whiteAlpha.200"}
                              borderRadius="xl"
                              bg={isLightTheme ? "var(--app-surface-elevated)" : "whiteAlpha.50"}
                              aria-hidden="true"
                            >
                              <Skeleton height="20px" width="42%" mb={4} />
                              <SimpleGrid columns={{ base: 3 }} spacing={2} mb={4}>
                                {[0, 1, 2].map((metric) => (
                                  <Skeleton key={metric} height="58px" borderRadius="lg" />
                                ))}
                              </SimpleGrid>
                              <Skeleton height="14px" mb={4} />
                              <HStack p={3} borderRadius="xl" spacing={3}>
                                <Skeleton boxSize="64px" borderRadius="full" />
                                <VStack align="stretch" flex="1" spacing={2}>
                                  <Skeleton height="16px" width="48%" />
                                  <Skeleton height="12px" />
                                  <Skeleton height="12px" />
                                </VStack>
                              </HStack>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Text fontSize="sm" color={isLightTheme ? APP_TEXT_SECONDARY : "gray.500"}>
                          {progressStatus === undefined
                            ? (t?.teams_view_loading || "Loading teams...")
                            : progressStatus === null
                              ? (t?.teams_view_error || "Unable to load team members")
                              : (t?.teams_view_no_members || "No accepted members yet.")}
                        </Text>
                      )}

                      {pendingMembers.length > 0 && (
                        <Box>
                          <Text fontSize="sm" fontWeight="bold" mb={1}>
                            {t?.teams_view_pending_members || "Invites waiting"}
                          </Text>
                          {pendingMembers.map((member) => (
                            <Text
                              key={member.npub}
                              fontSize="xs"
                              color={isLightTheme ? APP_TEXT_SECONDARY : "gray.500"}
                            >
                              {member.npub}
                            </Text>
                          ))}
                        </Box>
                      )}

                      {/* <Divider /> */}
                      {team.isCreator ? (
                        <HStack justify="flex-end">
                          <IconButton
                            size="sm"
                            variant="outline"
                            color={isLightTheme ? "red.600" : "red.300"}
                            borderColor={isLightTheme ? "red.500" : "red.300"}
                            _hover={{
                              color: isLightTheme ? "red.700" : "red.200",
                              borderColor: isLightTheme ? "red.600" : "red.200",
                              bg: isLightTheme ? "red.50" : "whiteAlpha.100",
                            }}
                            aria-label={t?.teams_view_delete || "Delete team"}
                            icon={<FiTrash2 />}
                            onClick={() => handleDeleteTeam(team)}
                          />
                        </HStack>
                      ) : (
                        <HStack justify="flex-end">
                          <IconButton
                            size="sm"
                            variant="outline"
                            color={isLightTheme ? "red.600" : "red.300"}
                            borderColor={isLightTheme ? "red.500" : "red.300"}
                            _hover={{
                              color: isLightTheme ? "red.700" : "red.200",
                              borderColor: isLightTheme ? "red.600" : "red.200",
                              bg: isLightTheme ? "red.50" : "whiteAlpha.100",
                            }}
                            aria-label={t?.teams_view_leave || "Leave team"}
                            icon={<ImExit />}
                            onClick={() => handleLeaveTeam(team)}
                          />
                        </HStack>
                      )}
                    </VStack>
                  </TeamPanel>
                </TeamListItem>
              );
            })}
          </TeamList>
        )}
      </Box>
      <Modal isOpen={Boolean(editingTeam)} onClose={closeTeamEditor} isCentered>
        <ModalOverlay />
        <ModalContent
          bg={isLightTheme ? APP_SURFACE : "gray.900"}
          color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
          border="1px solid"
          borderColor={isLightTheme ? APP_BORDER : "gray.700"}
          boxShadow="2xl"
        >
          <ModalHeader pb={1}>{t?.teams_edit_heading || "Edit team name"}</ModalHeader>
          <ModalCloseButton isDisabled={isSavingName} color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"} />
          <ModalBody flex="0 1 auto" pt={1} pb={2}>
            <FormControl isRequired>
              <FormLabel>{t?.teams_create_name_label || "Team name"}</FormLabel>
              <Input
                autoFocus
                value={editedTeamName}
                onChange={(event) => setEditedTeamName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleRenameTeam();
                  }
                }}
                maxLength={80}
                bg={isLightTheme ? "var(--app-surface-muted)" : "gray.800"}
                color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
                borderColor={isLightTheme ? APP_BORDER : "gray.600"}
                _placeholder={{ color: isLightTheme ? "gray.500" : "gray.400" }}
                _hover={{ borderColor: isLightTheme ? APP_BORDER : "gray.500" }}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter gap={2} pt={2}>
            <Button variant="ghost" onClick={closeTeamEditor} isDisabled={isSavingName}>
              {t?.cancel || "Cancel"}
            </Button>
            <Button
              colorScheme="teal"
              onClick={handleRenameTeam}
              isLoading={isSavingName}
              isDisabled={!editedTeamName.trim() || editedTeamName.trim() === editingTeam?.teamName}
            >
              {t?.teams_edit_save || "Save"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
