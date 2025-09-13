import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "../firebaseResources/firebaseResources";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Box, Button, Input, Text } from "@chakra-ui/react";
import translations from "../utils/translation";

export const PasscodePage = ({
  isOldAccount,
  userLanguage,
  setShowPasscodeModal,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [isValid, setIsValid] = useState(null);
  const navigate = useNavigate();

  const bannedUserList = [
    "npub1cfyf77uc459arthry2y6ndj8dr2t7fjn6rl5feakghv884f8s73qe9dayg",
    "npub1m5kwfzjcn7k7uwadmvqwvkryfcy7rttnjfe3cl4cpm205eehe5fs2sx53h",
    "npub1xld6g6tsdddtkpmspawl30prf2py9wdqqwk43sxyy92updqvr62qxt53qk",
  ];

  const correctPasscode = import.meta.env.VITE_PATREON_PASSCODE;

  const checkPasscode = async () => {
    if (
      input === correctPasscode &&
      bannedUserList.find((item) => item === localStorage.getItem("local_npub"))
    ) {
      showAlert(
        "error",
        "You have been banned and the passcode has been changed. Contact the application owner on Patreon if this is a mistake."
      );
    } else {
      if (input === correctPasscode) {
        // console.log("we did it");
        localStorage.setItem("passcode", input);
        localStorage.setItem("features_passcode", input);

        // Assuming you have the user's unique identifier stored in local storage
        const userId = localStorage.getItem("local_npub"); // Replace with actual user ID if needed
        const userDocRef = doc(database, "users", userId);
        const userSnapshot = await getDoc(userDocRef);

        if (userSnapshot.exists()) {
          // console.log("User document exists");
          const userData = userSnapshot.data();

          // console.log("User step:", userStep);

          // Navigate to the next step

          // Update Firestore document with previousStep + 1
          await updateDoc(userDocRef, {
            hasSubmittedPasscode: true,
          });
          setShowPasscodeModal(false);

          //   navigate(`/q/${isOldAccount ? userStep + 1 : userStep + 1}`);
          // console.log("Updated user step to:", userStep + 1);
        } else {
          console.log("User document not found");
        }
      } else {
        setIsValid(false);
      }
    }
  };

  useEffect(() => {
    console.log("INPUT", input);
    localStorage.setItem("passcode", input);
    if (localStorage.getItem("passcode") === correctPasscode) {
      checkPasscode(); // Auto-check if passcode is already stored
    }
  }, [input]);

  useEffect(() => {
    setIsLoading(true);
    const checkUser = async () => {
      const userId = localStorage.getItem("local_npub"); // Replace with actual user ID if needed
      const userDocRef = doc(database, "users", userId);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        // console.log("User document exists");
        const userData = userSnapshot.data();
        const hasSubscribed = userData?.hasSubmittedPasscode;

        if (hasSubscribed) {
          console.log("HAS SUBSCRIBED", import.meta.env.VITE_PATREON_PASSCODE);
          localStorage.setItem(
            "passcode",
            import.meta.env.VITE_PATREON_PASSCODE
          );
          localStorage.setItem(
            "features_passcode",
            import.meta.env.VITE_PATREON_PASSCODE
          );

          setIsLoading(false);
          setShowPasscodeModal(true);
        } else {
          setIsLoading(false);
        }
      }
    };

    checkUser();
  }, []);

  if (isLoading) {
    return <Box>Loading...</Box>;
  }
  return (
    <Box width="100%" display="flex" justifyContent={"center"}>
      <Box
        minHeight="90vh"
        display="flex"
        flexDirection={"column"}
        alignItems={"center"}
        justifyContent={"center"}
        width="100%"
        maxWidth="680px"
        padding={4}
        marginTop={12}
        paddingBottom={12}
      >
        {/* <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            marginLeft: 120,
          }}
        >
          <CloudCanvas />
        </div>{" "}
        <div style={{ marginTop: "-32px" }}>
          <RandomCharacter />
        </div> */}
        <br />
        <Text maxWidth="600px">
          <div style={{ textAlign: "left" }}>
            {/* {translations[userLanguage]["passcode.instructions"]} */}
            Thanks for trying out the app! It's currently under development and
            will improve daily.
            <br />
            <br />
            <b>
              Subscribe to the Patreon to get full access to the app. You'll:{" "}
            </b>
            <ul>
              <li style={{ marginBottom: 4, marginTop: 4 }}>
                Access to 10 different education apps
              </li>
              <li style={{ marginBottom: 4, marginTop: 4 }}>
                Get access to crash courses, stock market, entrepreneurship, and
                startup development content
              </li>
              <li style={{ marginBottom: 4, marginTop: 4 }}>
                Keep the coding education app free for everyone
              </li>
              <li>
                Access more advanced software engineering content and projects
              </li>
              <li style={{ marginBottom: 4, marginTop: 4 }}>
                Help our community create scholarships
              </li>
              <li style={{ marginBottom: 4, marginTop: 4 }}>
                {" "}
                Receive personal tutoring/entrepreneurial support (soon)
              </li>
            </ul>
            <br />
            <a
              style={{ textDecoration: "underline" }}
              href="https://patreon.com/notesandotherstuff"
            >
              Go To Patreon
            </a>
            <br />
            <br />
            <a
              style={{ textDecoration: "underline" }}
              href="https://www.patreon.com/posts/start-learning-86153437?utm_medium=clipboard_copy&utm_source=copyLink&utm_campaign=postshare_creator&utm_content=join_link"
            >
              Link To Subscriber Passcode
            </a>
            <br />
            <br />
            <Text fontSize={"smaller"}>
              {" "}
              {/* {translations[userLanguage]["passcode.label"]} */}
              Subscriber Passcode
            </Text>
            <Input
              color="black"
              //   type="password"
              backgroundColor="white"
              style={{
                boxShadow: "0.5px 0.5px 1px 0px rgba(0,0,0,0.75)",
              }}
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
            />
          </div>
        </Text>
      </Box>
    </Box>
  );
};
