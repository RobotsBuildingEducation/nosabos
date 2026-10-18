import { Box, Link } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import policy from "../../docs/privacy-policy-draft.md?raw";

export default function PrivacyPolicyContent({ colors }) {
  return (
    <Box
      lang="en"
      dir="ltr"
      textAlign="left"
      color={colors.text}
      fontSize="md"
      lineHeight="1.8"
      overflowWrap="anywhere"
      sx={{
        "& h2": { fontSize: "lg", fontWeight: 700, mt: 7, mb: 3 },
        "& p": { mb: 4 },
        "& ul": { ps: 5, mb: 4 },
        "& li": { mb: 2 },
        "& strong": { fontWeight: 700 },
        "& a": { color: colors.link, textDecoration: "underline" },
      }}
    >
      <ReactMarkdown
        components={{
          h1: () => null,
          a: ({ href, children }) => (
            <Link href={href} isExternal={!href?.startsWith("mailto:")}>
              {children}
            </Link>
          ),
        }}
      >
        {policy}
      </ReactMarkdown>
    </Box>
  );
}
