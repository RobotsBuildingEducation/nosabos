import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  List,
  ListItem,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import {
  checkUserExists,
  createTeam,
  getUserData,
  inviteUserToTeam,
} from "../../utils/teams";
import useNOSTR from "../../hooks/useNOSTR";
import useSoundSettings from "../../hooks/useSoundSettings";

export default function TeamCreation({ userLanguage, onTeamCreated, t }) {
  const toast = useToast();
  const playSound = useSoundSettings((s) => s.playSound);
  const [teamName, setTeamName] = useState("");
  const [memberNpub, setMemberNpub] = useState("");
  const [membersToInvite, setMembersToInvite] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const { sendDirectMessage } = useNOSTR(
    typeof window !== "undefined" ? localStorage.getItem("local_npub") : "",
    typeof window !== "undefined" ? localStorage.getItem("local_nsec") : ""
  );

  const handleAddMember = () => {
    playSound("select");
    if (!memberNpub.trim()) {
      toast({
        title: t?.teams_create_error || "Error",
        description:
          t?.teams_create_invalid || "Please enter a valid npub to invite",
        status: "error",
      });
      return;
    }
    if (!memberNpub.startsWith("npub")) {
      toast({
        title: t?.teams_create_error || "Error",
        description:
          t?.teams_create_invalid_format ||
          "Invalid npub format. npubs begin with 'npub'",
        status: "error",
      });
      return;
    }
    if (membersToInvite.includes(memberNpub.trim())) {
      toast({
        title: t?.teams_create_error || "Error",
        description:
          t?.teams_create_duplicate || "This npub is already on the list",
        status: "warning",
      });
      return;
    }
    setMembersToInvite((prev) => [...prev, memberNpub.trim()]);
    setMemberNpub("");
  };

  const handleRemoveMember = (npub) => {
    playSound("select");
    setMembersToInvite((prev) => prev.filter((entry) => entry !== npub));
  };

  const handleCreateTeam = async () => {
    playSound("submitAction");
    if (!teamName.trim()) {
      toast({
        title: t?.teams_create_error || "Error",
        description:
          t?.teams_create_missing_name || "Please choose a team name",
        status: "error",
      });
      return;
    }
    if (!membersToInvite.length) {
      toast({
        title: t?.teams_create_error || "Error",
        description:
          t?.teams_create_missing_member ||
          "Add at least one teammate before creating",
        status: "error",
      });
      return;
    }

    setIsCreating(true);
    try {
      const creatorNpub = localStorage.getItem("local_npub");
      const creatorData = await getUserData(creatorNpub);
      const creatorName =
        creatorData?.profile?.displayName ||
        creatorData?.name ||
        t?.teams_create_unknown_user ||
        "New Learner";

      const teamId = await createTeam(creatorNpub, teamName.trim(), creatorName);

      const inviteResults = await Promise.all(
        membersToInvite.map(async (inviteeNpub) => {
          try {
            const userExists = await checkUserExists(inviteeNpub);
            await inviteUserToTeam(
              creatorNpub,
              teamId,
              teamName.trim(),
              inviteeNpub,
              creatorName
            );
            if (!userExists) {
              const dmTemplate =
                t?.teams_create_dm_template ||
                `Hi! You've been invited to join "{team}" on Robots Building Education. Create an account to track progress with your team.`;
              await sendDirectMessage(
                inviteeNpub,
                dmTemplate.replace("{team}", teamName.trim())
              );
            }
            return { npub: inviteeNpub, success: true };
          } catch (error) {
            console.error("invite error", error);
            return { npub: inviteeNpub, success: false };
          }
        })
      );

      const successCount = inviteResults.filter((r) => r.success).length;
      const failCount = inviteResults.length - successCount;

      toast({
        title: t?.teams_create_success || "Team created",
        description: `${successCount} ${
          t?.teams_create_invites || "invites sent"
        }${failCount ? `, ${failCount} ${t?.teams_create_failed || "failed"}` : ""}`,
        status: failCount ? "warning" : "success",
      });

      setTeamName("");
      setMembersToInvite([]);
      if (typeof onTeamCreated === "function") {
        onTeamCreated(teamId);
      }
    } catch (error) {
      console.error("team create error", error);
      toast({
        title: t?.teams_create_error || "Error",
        description: error.message || "Unable to create team",
        status: "error",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Box>
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        {t?.teams_create_heading || "Create a new team"}
      </Text>
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel>{t?.teams_create_name_label || "Team name"}</FormLabel>
          <Input
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            placeholder={t?.teams_create_name_placeholder || "e.g., Weekend Study"}
          />
        </FormControl>
        <FormControl>
          <FormLabel>{t?.teams_create_member_label || "Invite teammates"}</FormLabel>
          <HStack>
            <Input
              value={memberNpub}
              onChange={(event) => setMemberNpub(event.target.value)}
              placeholder={t?.teams_create_member_placeholder || "npub1..."}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddMember();
                }
              }}
            />
            <Button onClick={handleAddMember}>
              {t?.teams_create_add_button || "Add"}
            </Button>
          </HStack>
        </FormControl>
        {membersToInvite.length > 0 && (
          <Box>
            <Text fontSize="sm" fontWeight="bold" mb={2}>
              {t?.teams_create_members_heading || "Pending invites"} (
              {membersToInvite.length})
            </Text>
            <List spacing={2}>
              {membersToInvite.map((npub) => (
                <ListItem
                  key={npub}
                  borderWidth="1px"
                  borderRadius="md"
                  p={2}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Text fontSize="xs" mr={3} noOfLines={1}>
                    {npub}
                  </Text>
                  <IconButton
                    size="xs"
                    aria-label={t?.teams_create_remove || "Remove"}
                    icon={<CloseIcon boxSize={2} />}
                    onClick={() => handleRemoveMember(npub)}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        <Button
          colorScheme="teal"
          onClick={handleCreateTeam}
          isLoading={isCreating}
          loadingText={t?.teams_create_creating || "Creating"}
          isDisabled={!teamName.trim() || !membersToInvite.length}
        >
          {t?.teams_create_submit || "Create team"}
        </Button>
      </VStack>
    </Box>
  );
}
