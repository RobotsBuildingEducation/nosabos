import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  Progress,
  Spinner,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  acceptTeamInvite,
  deleteTeam,
  getTeamMemberProgress,
  getUserTeamInvites,
  getUserTeams,
  leaveTeam,
  rejectTeamInvite,
  subscribeToTeamInvites,
  subscribeToTeamUpdates,
} from "../../utils/teams";

const formatCountLabel = (count, singular, plural) => {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural}`;
};

export default function TeamView({ userLanguage, refreshTrigger, t }) {
  const toast = useToast();
  const [myTeams, setMyTeams] = useState([]);
  const [teamInvites, setTeamInvites] = useState([]);
  const [teamMemberProgress, setTeamMemberProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [processingInvite, setProcessingInvite] = useState(null);
  const userNpub = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("local_npub") : ""),
    []
  );

  const loadData = async () => {
    if (!userNpub) return;
    setLoading(true);
    try {
      const [teams, invites] = await Promise.all([
        getUserTeams(userNpub),
        getUserTeamInvites(userNpub),
      ]);
      setMyTeams(teams);
      setTeamInvites(invites);

      const progressData = {};
      for (const team of teams) {
        const creatorNpub = team.isCreator ? userNpub : team.createdBy;
        try {
          const progress = await getTeamMemberProgress(creatorNpub, team.id);
          progressData[team.id] = progress;
        } catch (error) {
          console.error("Team progress error", error);
        }
      }
      setTeamMemberProgress(progressData);
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
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userNpub, refreshTrigger]);

  useEffect(() => {
    if (!userNpub) return undefined;
    const unsubscribe = subscribeToTeamInvites(userNpub, (invites) => {
      setTeamInvites(invites);
    });
    return () => unsubscribe?.();
  }, [userNpub]);

  useEffect(() => {
    if (!myTeams.length || !userNpub) return () => {};
    const unsubscribers = myTeams.map((team) => {
      const creatorNpub = team.isCreator ? userNpub : team.createdBy;
      return subscribeToTeamUpdates(creatorNpub, team.id, async (updatedTeam) => {
        if (!updatedTeam) return;
        setMyTeams((prev) =>
          prev.map((entry) =>
            entry.id === updatedTeam.id && entry.createdBy === creatorNpub
              ? { ...entry, ...updatedTeam }
              : entry
          )
        );
        try {
          const progress = await getTeamMemberProgress(creatorNpub, team.id);
          setTeamMemberProgress((prev) => ({ ...prev, [team.id]: progress }));
        } catch (error) {
          console.error("refresh progress error", error);
        }
      });
    });
    return () => {
      unsubscribers.forEach((fn) => fn && fn());
    };
  }, [myTeams, userNpub]);

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

  const pendingInvites = teamInvites.filter((invite) => invite.status === "pending");

  if (loading) {
    return (
      <VStack py={8} spacing={3} align="center">
        <Spinner />
        <Text fontSize="sm" color="gray.400">
          {t?.teams_view_loading || "Loading teams..."}
        </Text>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" spacing={6}>
      {pendingInvites.length > 0 && (
        <Box>
          <Text fontWeight="bold" mb={3}>
            {t?.teams_view_pending || "Pending invitations"}
          </Text>
          <VStack spacing={3} align="stretch">
            {pendingInvites.map((invite) => (
              <Box key={invite.id} p={4} borderWidth="1px" borderRadius="md" bg="yellow.50">
                <Text fontWeight="bold">{invite.teamName}</Text>
                <Text fontSize="sm" color="gray.600">
                  {t?.teams_view_invited_by || "Invited by"}: {invite.invitedByName || invite.invitedBy}
                </Text>
                <HStack spacing={2} mt={3}>
                  <Button
                    size="sm"
                    colorScheme="green"
                    onClick={() => handleAcceptInvite(invite.id)}
                    isLoading={processingInvite === invite.id}
                  >
                    {t?.teams_view_accept || "Accept"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="red"
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
        {!myTeams.length ? (
          <Alert status="info">
            <AlertIcon />
            {t?.teams_view_empty || "Create a team to start tracking progress together."}
          </Alert>
        ) : (
          <Accordion allowMultiple>
            {myTeams.map((team) => {
              const progress = teamMemberProgress[team.id] || [];
              const acceptedMembers = (team.members || []).filter(
                (member) => member.status === "accepted"
              );
              const pendingMembers = (team.members || []).filter(
                (member) => member.status === "pending"
              );
              const memberLabel = formatCountLabel(
                acceptedMembers.length + 1,
                t?.teams_view_member_one || "member",
                t?.teams_view_member_many || "members"
              );
              return (
                <AccordionItem key={`${team.id}-${team.createdBy}`}>
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <HStack spacing={2} align="center">
                          <Text fontWeight="bold">{team.teamName}</Text>
                          {team.isCreator ? (
                            <Badge colorScheme="purple">
                              {t?.teams_view_badge_creator || "Creator"}
                            </Badge>
                          ) : (
                            <Badge colorScheme="green">
                              {t?.teams_view_badge_member || "Member"}
                            </Badge>
                          )}
                          <Badge colorScheme="blue">{memberLabel}</Badge>
                        </HStack>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel>
                    <VStack align="stretch" spacing={4}>
                      {progress.length ? (
                        <Box>
                          <Text fontSize="sm" fontWeight="bold" mb={2}>
                            {t?.teams_view_progress || "Progress"}
                          </Text>
                          {progress.map((member) => (
                            <Box key={member.npub} mb={3}>
                              <HStack justify="space-between" mb={1}>
                                <HStack spacing={2}>
                                  <Text fontWeight="medium" fontSize="sm">
                                    {member.name}
                                  </Text>
                                  {member.isCreator && (
                                    <Badge colorScheme="purple" fontSize="xs">
                                      {t?.teams_view_badge_creator || "Creator"}
                                    </Badge>
                                  )}
                                </HStack>
                                <HStack spacing={2}>
                                  <Badge colorScheme="orange">
                                    {`${member.streak} ${t?.teams_view_streak || "day streak"}`}
                                  </Badge>
                                  <Badge colorScheme="green">
                                    {`${member.answeredStepsCount || 0} ${
                                      t?.teams_view_questions || "questions"
                                    }`}
                                  </Badge>
                                </HStack>
                              </HStack>
                              <Progress
                                value={member.progressPercent}
                                size="sm"
                                borderRadius="md"
                                colorScheme={member.isCreator ? "pink" : "teal"}
                              />
                              <Text fontSize="xs" color="gray.400" mt={1}>
                                {t?.teams_view_level || "Level"}: {member.level || "—"}
                              </Text>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Text fontSize="sm" color="gray.500">
                          {t?.teams_view_no_members || "No accepted members yet."}
                        </Text>
                      )}

                      {pendingMembers.length > 0 && (
                        <Box>
                          <Text fontSize="sm" fontWeight="bold" mb={1}>
                            {t?.teams_view_pending_members || "Invites waiting"}
                          </Text>
                          {pendingMembers.map((member) => (
                            <Text key={member.npub} fontSize="xs" color="gray.500">
                              {member.npub}
                            </Text>
                          ))}
                        </Box>
                      )}

                      <Divider />
                      {team.isCreator ? (
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => handleDeleteTeam(team)}
                        >
                          {t?.teams_view_delete || "Delete team"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          colorScheme="orange"
                          variant="outline"
                          onClick={() => handleLeaveTeam(team)}
                        >
                          {t?.teams_view_leave || "Leave team"}
                        </Button>
                      )}
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </Box>
    </VStack>
  );
}
