import { Link } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import policy from "../../docs/privacy-policy-draft.md?raw";

export default function PrivacyPolicyContent({ linkColor }) {
  return (
    <ReactMarkdown components={{
      h1: () => null,
      a: ({ href, children }) => (
        <Link href={href} color={linkColor} isExternal={!href?.startsWith("mailto:")}>
          {children}
        </Link>
      ),
    }}>
      {policy}
    </ReactMarkdown>
  );
}
