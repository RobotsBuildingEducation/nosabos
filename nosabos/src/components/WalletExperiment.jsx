// src/components/WalletExperiment.jsx
// NIP-60/NIP-61 Cashu Wallet Experiment
import React, { useState, useCallback } from "react";
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
  useToast,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Card,
  CardBody,
  CardHeader,
  Tooltip,
  Code,
} from "@chakra-ui/react";
import {
  CopyIcon,
  ViewIcon,
  ViewOffIcon,
  CheckIcon,
  WarningIcon,
} from "@chakra-ui/icons";
import { QRCodeSVG } from "qrcode.react";
import { useCashuWallet } from "../hooks/useCashuWallet";

// View states
const VIEW_LOGIN = "login";
const VIEW_WALLET = "wallet";

function WalletExperiment() {
  const toast = useToast();

  // Get all wallet functionality from the hook
  const {
    isConnected,
    isLoading,
    error,
    npub,
    nsec,
    balance,
    invoice,
    walletEventId,
    hasWallet,
    connect,
    createUser,
    createWallet,
    loadWallet,
    deposit,
    send,
    logout,
    clearError,
  } = useCashuWallet();

  // Local UI state
  const [view, setView] = useState(isConnected ? VIEW_WALLET : VIEW_LOGIN);
  const [showNsec, setShowNsec] = useState(false);
  const [loginNsec, setLoginNsec] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [sendNpub, setSendNpub] = useState("");
  const [sendAmount, setSendAmount] = useState("1");
  const [sendComment, setSendComment] = useState("");
  const [copied, setCopied] = useState(false);

  // Update view when connection state changes
  React.useEffect(() => {
    if (isConnected && view === VIEW_LOGIN) {
      setView(VIEW_WALLET);
    } else if (!isConnected && view === VIEW_WALLET) {
      setView(VIEW_LOGIN);
    }
  }, [isConnected, view]);

  // Copy to clipboard helper
  const copyToClipboard = useCallback(async (text, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: label,
        status: "success",
        duration: 1500,
      });
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      toast({
        title: "Failed to copy",
        status: "error",
        duration: 2000,
      });
    }
  }, [toast]);

  // Handle login with nsec
  const handleLogin = useCallback(async () => {
    if (!loginNsec.trim()) {
      toast({
        title: "Please enter your nsec",
        status: "warning",
        duration: 2000,
      });
      return;
    }

    if (!loginNsec.startsWith("nsec")) {
      toast({
        title: "Invalid key",
        description: "Key must start with 'nsec'",
        status: "error",
        duration: 3000,
      });
      return;
    }

    // Derive npub from nsec (we'll let the hook handle this)
    const success = await connect(
      "", // npub will be derived
      loginNsec.trim()
    );

    if (success) {
      toast({
        title: "Logged in successfully",
        status: "success",
        duration: 2000,
      });
      setLoginNsec("");

      // Try to load existing wallet
      const hasWallet = await loadWallet();
      if (!hasWallet) {
        toast({
          title: "No wallet found",
          description: "Create a new wallet to get started",
          status: "info",
          duration: 3000,
        });
      }
    }
  }, [loginNsec, connect, loadWallet, toast]);

  // Handle create new user
  const handleCreateUser = useCallback(async () => {
    if (!newUsername.trim()) {
      toast({
        title: "Please enter a username",
        status: "warning",
        duration: 2000,
      });
      return;
    }

    const result = await createUser(newUsername.trim());

    if (result) {
      toast({
        title: "Account created!",
        description: "Save your nsec key - you'll need it to log back in",
        status: "success",
        duration: 5000,
      });
      setNewUsername("");
    }
  }, [newUsername, createUser, toast]);

  // Handle create wallet
  const handleCreateWallet = useCallback(async () => {
    const success = await createWallet();

    if (success) {
      toast({
        title: "Wallet created!",
        description: "Your NIP-60 wallet is ready",
        status: "success",
        duration: 3000,
      });
    }
  }, [createWallet, toast]);

  // Handle deposit
  const handleDeposit = useCallback(async () => {
    const invoiceStr = await deposit(10);

    if (invoiceStr) {
      toast({
        title: "Invoice created",
        description: "Scan the QR code to deposit 10 sats",
        status: "info",
        duration: 5000,
      });
    }
  }, [deposit, toast]);

  // Handle send
  const handleSend = useCallback(async () => {
    if (!sendNpub.trim()) {
      toast({
        title: "Please enter recipient npub",
        status: "warning",
        duration: 2000,
      });
      return;
    }

    if (!sendNpub.startsWith("npub")) {
      toast({
        title: "Invalid recipient",
        description: "Must be a valid npub",
        status: "error",
        duration: 3000,
      });
      return;
    }

    const amount = parseInt(sendAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Amount must be a positive number",
        status: "error",
        duration: 3000,
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "Insufficient balance",
        description: `You only have ${balance} sats`,
        status: "error",
        duration: 3000,
      });
      return;
    }

    const success = await send(sendNpub.trim(), amount, sendComment);

    if (success) {
      toast({
        title: "Sats sent!",
        description: `Sent ${amount} sats via NIP-61 nutzap`,
        status: "success",
        duration: 3000,
      });
      setSendNpub("");
      setSendAmount("1");
      setSendComment("");
    }
  }, [sendNpub, sendAmount, sendComment, balance, send, toast]);

  // Handle logout
  const handleLogout = useCallback(() => {
    logout();
    setView(VIEW_LOGIN);
    toast({
      title: "Logged out",
      status: "info",
      duration: 2000,
    });
  }, [logout, toast]);

  // Render login view
  const renderLoginView = () => (
    <VStack spacing={6} w="100%" maxW="400px" mx="auto">
      <Heading size="lg" textAlign="center" color="white">
        🥜 Nutsack Wallet
      </Heading>
      <Text color="gray.400" textAlign="center">
        NIP-60 & NIP-61 Cashu Wallet Experiment
      </Text>

      <Divider borderColor="gray.700" />

      {/* Login with nsec */}
      <Card w="100%" bg="gray.800" borderColor="gray.700" borderWidth="1px">
        <CardHeader pb={2}>
          <Heading size="sm" color="white">Login with nsec</Heading>
        </CardHeader>
        <CardBody pt={2}>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel color="gray.300" fontSize="sm">Your nsec key</FormLabel>
              <InputGroup>
                <Input
                  type={showNsec ? "text" : "password"}
                  placeholder="nsec1..."
                  value={loginNsec}
                  onChange={(e) => setLoginNsec(e.target.value)}
                  bg="gray.900"
                  borderColor="gray.600"
                  color="white"
                  _placeholder={{ color: "gray.500" }}
                />
                <InputRightElement>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    icon={showNsec ? <ViewOffIcon /> : <ViewIcon />}
                    onClick={() => setShowNsec(!showNsec)}
                    aria-label={showNsec ? "Hide" : "Show"}
                    color="gray.400"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
            <Button
              w="100%"
              colorScheme="teal"
              onClick={handleLogin}
              isLoading={isLoading}
            >
              Login
            </Button>
          </VStack>
        </CardBody>
      </Card>

      <Text color="gray.500">or</Text>

      {/* Create new account */}
      <Card w="100%" bg="gray.800" borderColor="gray.700" borderWidth="1px">
        <CardHeader pb={2}>
          <Heading size="sm" color="white">Create new account</Heading>
        </CardHeader>
        <CardBody pt={2}>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel color="gray.300" fontSize="sm">Username</FormLabel>
              <Input
                placeholder="Enter a username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                bg="gray.900"
                borderColor="gray.600"
                color="white"
                _placeholder={{ color: "gray.500" }}
              />
            </FormControl>
            <Button
              w="100%"
              colorScheme="purple"
              onClick={handleCreateUser}
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </VStack>
        </CardBody>
      </Card>

      {error && (
        <Alert status="error" borderRadius="md" bg="red.900">
          <AlertIcon />
          <Box>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      )}

      <Text fontSize="xs" color="gray.600" textAlign="center" mt={4}>
        Vibed with{" "}
        <a
          href="https://shakespeare.diy"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#81E6D9" }}
        >
          Shakespeare
        </a>
      </Text>
    </VStack>
  );

  // Render wallet view
  const renderWalletView = () => (
    <VStack spacing={6} w="100%" maxW="500px" mx="auto">
      {/* Header */}
      <Flex w="100%" justify="space-between" align="center">
        <Heading size="lg" color="white">🥜 Nutsack</Heading>
        <Button
          size="sm"
          variant="outline"
          colorScheme="red"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Flex>

      {/* Identity Card */}
      <Card w="100%" bg="gray.800" borderColor="gray.700" borderWidth="1px">
        <CardBody>
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between">
              <Text color="gray.400" fontSize="sm">Your npub</Text>
              <Tooltip label="Copy npub">
                <IconButton
                  size="xs"
                  variant="ghost"
                  icon={copied ? <CheckIcon /> : <CopyIcon />}
                  onClick={() => copyToClipboard(npub, "npub copied")}
                  color="gray.400"
                  aria-label="Copy npub"
                />
              </Tooltip>
            </HStack>
            <Code
              p={2}
              borderRadius="md"
              bg="gray.900"
              color="teal.300"
              fontSize="xs"
              wordBreak="break-all"
            >
              {npub}
            </Code>

            <HStack justify="space-between" mt={2}>
              <Text color="gray.400" fontSize="sm">Your nsec (keep secret!)</Text>
              <HStack>
                <IconButton
                  size="xs"
                  variant="ghost"
                  icon={showNsec ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={() => setShowNsec(!showNsec)}
                  color="gray.400"
                  aria-label={showNsec ? "Hide" : "Show"}
                />
                <Tooltip label="Copy nsec">
                  <IconButton
                    size="xs"
                    variant="ghost"
                    icon={<CopyIcon />}
                    onClick={() => copyToClipboard(nsec, "nsec copied - keep it safe!")}
                    color="gray.400"
                    aria-label="Copy nsec"
                  />
                </Tooltip>
              </HStack>
            </HStack>
            <Code
              p={2}
              borderRadius="md"
              bg="gray.900"
              color="orange.300"
              fontSize="xs"
              wordBreak="break-all"
            >
              {showNsec ? nsec : "••••••••••••••••••••••••••••••••"}
            </Code>
          </VStack>
        </CardBody>
      </Card>

      {/* Wallet Status */}
      {!hasWallet ? (
        <Card w="100%" bg="gray.800" borderColor="yellow.600" borderWidth="1px">
          <CardBody>
            <VStack spacing={4}>
              <HStack>
                <WarningIcon color="yellow.400" />
                <Text color="yellow.400">No wallet found</Text>
              </HStack>
              <Text color="gray.400" fontSize="sm" textAlign="center">
                Create a NIP-60 wallet to start using Cashu ecash
              </Text>
              <Button
                w="100%"
                colorScheme="yellow"
                onClick={handleCreateWallet}
                isLoading={isLoading}
              >
                Create Wallet
              </Button>
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Balance Card */}
          <Card w="100%" bg="linear-gradient(135deg, #2D3748 0%, #1A202C 100%)" borderColor="teal.500" borderWidth="2px">
            <CardBody>
              <VStack spacing={2}>
                <Text color="gray.400" fontSize="sm">Balance</Text>
                <HStack spacing={2} align="baseline">
                  <Text fontSize="4xl" fontWeight="bold" color="white">
                    {balance}
                  </Text>
                  <Text fontSize="lg" color="teal.300">sats</Text>
                </HStack>
                <Badge colorScheme="teal" variant="subtle">
                  NIP-60 Cashu Wallet
                </Badge>
              </VStack>
            </CardBody>
          </Card>

          {/* Deposit Section */}
          <Card w="100%" bg="gray.800" borderColor="gray.700" borderWidth="1px">
            <CardHeader pb={2}>
              <Heading size="sm" color="white">⚡ Deposit</Heading>
            </CardHeader>
            <CardBody pt={2}>
              <VStack spacing={4}>
                {invoice ? (
                  <>
                    <Box
                      p={4}
                      bg="white"
                      borderRadius="lg"
                    >
                      <QRCodeSVG
                        value={invoice}
                        size={200}
                        level="M"
                      />
                    </Box>
                    <Text color="gray.400" fontSize="xs" textAlign="center">
                      Scan with a Lightning wallet to deposit 10 sats
                    </Text>
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="teal"
                      leftIcon={<CopyIcon />}
                      onClick={() => copyToClipboard(invoice, "Invoice copied")}
                    >
                      Copy Invoice
                    </Button>
                    <Spinner size="sm" color="teal.400" />
                    <Text color="gray.500" fontSize="xs">
                      Waiting for payment...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text color="gray.400" fontSize="sm" textAlign="center">
                      Generate a Lightning invoice to add sats to your wallet
                    </Text>
                    <Button
                      w="100%"
                      colorScheme="teal"
                      onClick={handleDeposit}
                      isLoading={isLoading}
                    >
                      Deposit 10 sats
                    </Button>
                  </>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Send Section */}
          <Card w="100%" bg="gray.800" borderColor="gray.700" borderWidth="1px">
            <CardHeader pb={2}>
              <Heading size="sm" color="white">📤 Send (NIP-61 Nutzap)</Heading>
            </CardHeader>
            <CardBody pt={2}>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel color="gray.300" fontSize="sm">Recipient npub</FormLabel>
                  <Input
                    placeholder="npub1..."
                    value={sendNpub}
                    onChange={(e) => setSendNpub(e.target.value)}
                    bg="gray.900"
                    borderColor="gray.600"
                    color="white"
                    _placeholder={{ color: "gray.500" }}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.300" fontSize="sm">Amount (sats)</FormLabel>
                  <Input
                    type="number"
                    placeholder="1"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    bg="gray.900"
                    borderColor="gray.600"
                    color="white"
                    _placeholder={{ color: "gray.500" }}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.300" fontSize="sm">Comment (optional)</FormLabel>
                  <Input
                    placeholder="Thanks!"
                    value={sendComment}
                    onChange={(e) => setSendComment(e.target.value)}
                    bg="gray.900"
                    borderColor="gray.600"
                    color="white"
                    _placeholder={{ color: "gray.500" }}
                  />
                </FormControl>
                <Button
                  w="100%"
                  colorScheme="purple"
                  onClick={handleSend}
                  isLoading={isLoading}
                  isDisabled={balance === 0}
                >
                  Send Nutzap
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </>
      )}

      {error && (
        <Alert status="error" borderRadius="md" bg="red.900">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
          <Button size="sm" variant="ghost" onClick={clearError}>
            Dismiss
          </Button>
        </Alert>
      )}

      <Text fontSize="xs" color="gray.600" textAlign="center" mt={4}>
        Vibed with{" "}
        <a
          href="https://shakespeare.diy"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#81E6D9" }}
        >
          Shakespeare
        </a>
      </Text>
    </VStack>
  );

  return (
    <Box
      minH="100vh"
      bg="gray.950"
      py={8}
      px={4}
    >
      <Container maxW="container.sm">
        {view === VIEW_LOGIN ? renderLoginView() : renderWalletView()}
      </Container>
    </Box>
  );
}

export default WalletExperiment;
