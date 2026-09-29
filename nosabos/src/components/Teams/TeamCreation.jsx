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
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import {
  addMembersToTeam,
  createTeam,
  getUserData,
} from "../../utils/teams";
import { useThemeStore } from "../../useThemeStore";

const APP_SURFACE = "var(--app-surface)";
const APP_SURFACE_MUTED = "var(--app-surface-muted)";
const APP_BORDER = "var(--app-border)";
const APP_TEXT_PRIMARY = "var(--app-text-primary)";
const APP_TEXT_SECONDARY = "var(--app-text-secondary)";
const APP_SHADOW = "var(--app-shadow-soft)";

export default function TeamCreation({ team = null, onTeamCreated, onMembersAdded, t }) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isAddingMembers = Boolean(team?.id);
  const themeMode = useThemeStore((s) => s.themeMode);
  const isLightTheme = themeMode === "light";
  const [teamName, setTeamName] = useState("");
  const [memberNpub, setMemberNpub] = useState("");
  const [membersToInvite, setMembersToInvite] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleAddMember = () => {
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
    setMembersToInvite((prev) => prev.filter((entry) => entry !== npub));
  };

  const handleSubmit = async () => {
    if (!isAddingMembers && !teamName.trim()) {
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
          (isAddingMembers ? "Invite at least one teammate" : "Add at least one teammate before creating"),
        status: "error",
      });
      return;
    }

    setIsCreating(true);
    const submittedTeamName = teamName.trim();
    const submittedMembers = [...membersToInvite];
    try {
      const creatorNpub = localStorage.getItem("local_npub");
      const creatorData = await getUserData(creatorNpub);
      const creatorName =
        creatorData?.displayName ||
        creatorData?.profile?.displayName ||
        creatorData?.name ||
        t?.teams_create_unknown_user ||
        "New Learner";

      const teamId = isAddingMembers
        ? team.id
        : await createTeam(creatorNpub, submittedTeamName, creatorName, submittedMembers);
      if (isAddingMembers) {
        await addMembersToTeam(creatorNpub, team, membersToInvite, creatorName);
      }

      toast({
        title: isAddingMembers
          ? (membersToInvite.length === 1 ? "Member added" : "Members added")
          : t?.teams_create_success || "Team created",
        description: isAddingMembers
          ? "The team roster has been updated"
          : t?.teams_create_invites || "Teammates can see this team in either app",
        status: "success",
      });

      setTeamName("");
      setMemberNpub("");
      setMembersToInvite([]);
      onClose();
      if (isAddingMembers) {
        onMembersAdded?.(membersToInvite);
      } else if (typeof onTeamCreated === "function") {
        onTeamCreated({
          id: teamId,
          teamName: submittedTeamName,
          creatorName,
          createdBy: creatorNpub,
          isCreator: true,
          members: submittedMembers.map((npub) => ({ npub, status: "accepted", name: "" })),
          nostr: { id: teamId },
        });
      }
    } catch (error) {
      console.error(isAddingMembers ? "add team members error" : "team create error", error);
      toast({
        title: t?.teams_create_error || "Error",
        description: error.message || (isAddingMembers ? "Unable to add member" : "Unable to create team"),
        status: "error",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Box>
      {isAddingMembers ? (
        <Button size="xs" variant="outline" onClick={onOpen}>
          {t?.teams_add_member_open || "Add new member"}
        </Button>
      ) : <HStack mb={4} w="100%" justify="flex-end">
        <Button onClick={onOpen} colorScheme="teal">
          {t?.teams_create_open || "Create team"}
        </Button>
        <Button
          variant="outline"
          boxShadow={
            isLightTheme
              ? "0 4px 0 rgba(91, 75, 58, 0.28)"
              : "0 4px 0 rgba(255, 255, 255, 0.2)"
          }
          _active={{ transform: "translateY(4px)", boxShadow: "none" }}
          onClick={async () => {
            try {
              const userId = localStorage.getItem("local_npub");
              if (!userId) throw new Error("User ID unavailable");
              await navigator.clipboard.writeText(userId);
              toast({
                title: t?.teams_copy_id_success || "Your ID was copied",
                status: "success",
                duration: 2000,
                isClosable: true,
              });
            } catch {
              toast({
                title: t?.teams_copy_id_error || "Unable to copy your ID",
                status: "error",
                duration: 2500,
                isClosable: true,
              });
            }
          }}
        >
          {t?.teams_copy_id || "Copy Your ID"}
        </Button>
      </HStack>}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent
          bg={isLightTheme ? APP_SURFACE : "gray.900"}
          color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
          border="1px solid"
          borderColor={isLightTheme ? APP_BORDER : "gray.700"}
          boxShadow="2xl"
          sx={{
            "& > .chakra-modal__header": {
              paddingBottom: "4px !important",
            },
            "& > .chakra-modal__body": {
              paddingTop: "0px !important",
            },
          }}
        >
          <ModalHeader>
            {isAddingMembers
              ? t?.teams_add_member_heading || "Add new member"
              : t?.teams_create_heading || "Create a new team"}
          </ModalHeader>
          <ModalCloseButton color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"} />
          <ModalBody pb={6}>
      <VStack spacing={4} align="stretch">
        {!isAddingMembers && <FormControl>
          <FormLabel color={isLightTheme ? APP_TEXT_PRIMARY : undefined}>
            {t?.teams_create_name_label || "Team name"}
          </FormLabel>
          <Input
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            placeholder={t?.teams_create_name_placeholder || "e.g., Weekend Study"}
            bg={isLightTheme ? APP_SURFACE_MUTED : "gray.800"}
            color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
            borderColor={isLightTheme ? APP_BORDER : "gray.600"}
            _placeholder={{ color: isLightTheme ? "gray.500" : "gray.400" }}
            _hover={{ borderColor: isLightTheme ? APP_BORDER : "gray.500" }}
          />
        </FormControl>}
        <FormControl>
          <FormLabel color={isLightTheme ? APP_TEXT_PRIMARY : undefined}>
            {t?.teams_create_member_label || "Invite teammates"}
          </FormLabel>
          <HStack>
            <Input
              value={memberNpub}
              onChange={(event) => setMemberNpub(event.target.value)}
              placeholder={t?.teams_create_member_placeholder || "Enter their ID"}
              bg={isLightTheme ? APP_SURFACE_MUTED : "gray.800"}
              color={isLightTheme ? APP_TEXT_PRIMARY : "gray.100"}
              borderColor={isLightTheme ? APP_BORDER : "gray.600"}
              _placeholder={{ color: isLightTheme ? "gray.500" : "gray.400" }}
              _hover={{ borderColor: isLightTheme ? APP_BORDER : "gray.500" }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddMember();
                }
              }}
            />
            <Button variant="outline" onClick={handleAddMember}>
              {t?.teams_create_invite_button || "Invite"}
            </Button>
          </HStack>
        </FormControl>
        {membersToInvite.length > 0 && (
          <Box>
            <Text fontSize="sm" fontWeight="bold" mb={2}>
              {t?.teams_create_members_heading || "Members to Invite"} (
              {membersToInvite.length})
            </Text>
            <List spacing={2}>
              {membersToInvite.map((npub) => (
                <ListItem
                  key={npub}
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor={isLightTheme ? APP_BORDER : "gray.700"}
                  bg={isLightTheme ? APP_SURFACE : "gray.800"}
                  boxShadow={isLightTheme ? APP_SHADOW : undefined}
                  p={2}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Text
                    fontSize="xs"
                    mr={3}
                    noOfLines={1}
                    color={isLightTheme ? APP_TEXT_SECONDARY : "gray.300"}
                  >
                    {npub}
                  </Text>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    border="none"
                    bg="transparent"
                    boxShadow="none"
                    _hover={{ bg: "transparent" }}
                    _active={{ bg: "transparent" }}
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
          onClick={handleSubmit}
          isLoading={isCreating}
          loadingText={isAddingMembers ? "Adding" : t?.teams_create_creating || "Creating"}
          isDisabled={(!isAddingMembers && !teamName.trim()) || !membersToInvite.length}
        >
          {isAddingMembers
            ? t?.teams_add_member_submit || "Add member"
            : t?.teams_create_submit || "Create team"}
        </Button>
      </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
