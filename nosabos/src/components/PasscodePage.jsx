// components/PasscodePage.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "../firebaseResources/firebaseResources";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Box, Button, Input, Text } from "@chakra-ui/react";
import { translations } from "../utils/translation"; // named export

export const PasscodePage = ({
  isOldAccount,
  userLanguage,
  setShowPasscodeModal,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [isValid, setIsValid] = useState(null);
  const navigate = useNavigate();

  // Allow embedding in contexts where the modal toggler is optional
  const hidePasscodeModal = useCallback(() => {
    if (typeof setShowPasscodeModal === "function") {
      setShowPasscodeModal(false);
    }
  }, [setShowPasscodeModal]);

  const t = translations[userLanguage] || translations.en;
  const pc = t;

  const bannedUserList = [
    "npub1cfyf77uc459arthry2y6ndj8dr2t7fjn6rl5feakghv884f8s73qe9dayg",
    "npub1m5kwfzjcn7k7uwadmvqwvkryfcy7rttnjfe3cl4cpm205eehe5fs2sx53h",
    "npub1xld6g6tsdddtkpmspawl30prf2py9wdqqwk43sxyy92updqvr62qxt53qk",
  ];

  const correctPasscode = import.meta.env.VITE_PATREON_PASSCODE;

  const checkPasscode = async () => {
    const npub = localStorage.getItem("local_npub");
    const isBanned = bannedUserList.includes(npub);

    if (input === correctPasscode && isBanned) {
      // use your alert/toast system here; keeping your showAlert signature
      if (typeof window.showAlert === "function") {
        window.showAlert("error", `${pc.bannedTitle}: ${pc.bannedBody}`);
      } else {
        console.error(pc.bannedTitle, pc.bannedBody);
      }
      setIsValid(false);
      return;
    }

    if (input === correctPasscode) {
      localStorage.setItem("passcode", input);
      localStorage.setItem("features_passcode", input);

      const userId = npub; // if different, plug your real ID here
      const userDocRef = doc(database, "users", userId);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        await updateDoc(userDocRef, { hasSubmittedPasscode: true });
        hidePasscodeModal();
      } else {
        console.log("User document not found");
      }
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  };

  useEffect(() => {
    localStorage.setItem("passcode", input);
    if (localStorage.getItem("passcode") === correctPasscode) {
      checkPasscode(); // Auto-check if passcode is already stored
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  useEffect(() => {
    setIsLoading(true);
    const checkUser = async () => {
      const userId = localStorage.getItem("local_npub");
      const userDocRef = doc(database, "users", userId);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const hasSubscribed = userData?.hasSubmittedPasscode;

        if (hasSubscribed) {
          localStorage.setItem(
            "passcode",
            import.meta.env.VITE_PATREON_PASSCODE
          );
          localStorage.setItem(
            "features_passcode",
            import.meta.env.VITE_PATREON_PASSCODE
          );
          hidePasscodeModal();
        }
      }
      setIsLoading(false);
    };

    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return <Box>{t.generic_loading || "Loading..."}</Box>;
  }

  return (
    <Box width="100%" display="flex" justifyContent={"center"}>
      <Box
        // minHeight="90vh"
        display="flex"
        flexDirection={"column"}
        alignItems={"center"}
        justifyContent={"center"}
        width="100%"
        maxWidth="680px"
        padding={4}
        paddingBottom={12}
      >
        <br />
        <Text maxWidth="600px">
          <div style={{ textAlign: "left" }}>
            <p>{pc.intro}</p>

            <br />
            <b>{pc.benefitsTitle}</b>
            <ul>
              {pc.benefits.map((line, i) => (
                <li key={i} style={{ marginBottom: 4, marginTop: 4 }}>
                  {line}
                </li>
              ))}
            </ul>

            <br />
            <a
              style={{ textDecoration: "underline" }}
              href="https://patreon.com/notesandotherstuff"
              target="_blank"
              rel="noreferrer"
            >
              {pc.goToPatreon}
            </a>

            <br />
            <br />
            <a
              style={{ textDecoration: "underline" }}
              href="https://www.patreon.com/posts/start-learning-86153437?utm_medium=clipboard_copy&utm_source=copyLink&utm_campaign=postshare_creator&utm_content=join_link"
              target="_blank"
              rel="noreferrer"
            >
              {pc.passcodeLink}
            </a>

            <br />
            <br />
            <Text fontSize={"smaller"}>{pc.label}</Text>
            <Input
              color="black"
              backgroundColor="white"
              style={{ boxShadow: "0.5px 0.5px 1px 0px rgba(0,0,0,0.75)" }}
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") checkPasscode();
              }}
            />
            {isValid === false && (
              <Text color="red.300" mt={2} fontSize="sm">
                {pc.invalid}
              </Text>
            )}

            <Button mt={4} onClick={checkPasscode} colorScheme="teal">
              OK
            </Button>
          </div>
        </Text>
      </Box>
    </Box>
  );
};
