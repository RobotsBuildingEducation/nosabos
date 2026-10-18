import { useLayoutEffect } from "react";
import { useDecentralizedIdentity } from "../../hooks/useDecentralizedIdentity.js";

export default function IdentityRuntime({ publish }) {
  const identity = useDecentralizedIdentity();
  useLayoutEffect(() => { publish(identity); });
  return null;
}
