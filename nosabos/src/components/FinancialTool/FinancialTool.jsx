import React, { useState } from "react";
import {
  Box,
  VStack,
  Textarea,
  Button,
  Text,
  HStack,
  Badge,
} from "@chakra-ui/react";
import FinancialChart3D from "./FinancialChart3D";

/**
 * FinancialTool - A smart financial planning component
 * Users enter their expenses and goals in natural language,
 * then generate a beautiful 3D visualization
 */
export default function FinancialTool() {
  const [inputText, setInputText] = useState("");
  const [financialData, setFinancialData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const parseFinancialInput = (text) => {
    // Parse the input text to extract financial information
    // This is a simple parser - can be enhanced with AI later
    const lines = text.toLowerCase().split("\n").filter((l) => l.trim());

    const expenses = [];
    let goal = null;
    let income = null;

    lines.forEach((line) => {
      // Look for expense patterns like "rent: $1500" or "groceries $400"
      const expenseMatch = line.match(
        /([a-z\s]+)[:.]?\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i
      );

      if (expenseMatch) {
        const category = expenseMatch[1].trim();
        const amount = parseFloat(expenseMatch[2].replace(/,/g, ""));

        // Check if it's a goal or income
        if (
          category.includes("goal") ||
          category.includes("save") ||
          category.includes("target")
        ) {
          goal = amount;
        } else if (
          category.includes("income") ||
          category.includes("salary") ||
          category.includes("earn")
        ) {
          income = amount;
        } else {
          expenses.push({ category, amount });
        }
      }
    });

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = income ? income - totalExpenses : 0;
    const goalProgress = goal && income ? (remaining / goal) * 100 : 0;

    return {
      expenses,
      income,
      goal,
      totalExpenses,
      remaining,
      goalProgress: Math.min(100, Math.max(0, goalProgress)),
    };
  };

  const handleGenerate = () => {
    if (!inputText.trim()) return;

    setIsGenerating(true);

    // Simulate a brief processing delay for UX
    setTimeout(() => {
      const data = parseFinancialInput(inputText);
      setFinancialData(data);
      setIsGenerating(false);
    }, 500);
  };

  const placeholderText = `Enter your expenses and goals, for example:

Income: $5000
Rent: $1500
Groceries: $400
Utilities: $150
Transportation: $200
Entertainment: $100
Savings goal: $1000`;

  return (
    <Box w="100%" maxW="600px" mx="auto" p={4}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Text fontSize="xl" fontWeight="bold" mb={2} color="gray.100">
            Financial Planner
          </Text>
          <Text fontSize="sm" color="gray.400" mb={4}>
            Enter your income, expenses, and savings goals below
          </Text>
        </Box>

        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={placeholderText}
          minH="200px"
          bg="gray.800"
          border="1px solid"
          borderColor="gray.700"
          borderRadius="lg"
          color="gray.100"
          _placeholder={{ color: "gray.500" }}
          _focus={{
            borderColor: "teal.500",
            boxShadow: "0 0 0 1px var(--chakra-colors-teal-500)",
          }}
          resize="vertical"
          fontSize="sm"
        />

        <Button
          onClick={handleGenerate}
          isLoading={isGenerating}
          loadingText="Generating..."
          colorScheme="teal"
          size="lg"
          w="100%"
          isDisabled={!inputText.trim()}
        >
          Generate
        </Button>

        {financialData && (
          <VStack spacing={4} align="stretch">
            {/* Summary badges */}
            <HStack wrap="wrap" spacing={2}>
              {financialData.income && (
                <Badge colorScheme="green" px={3} py={1} borderRadius="full">
                  Income: ${financialData.income.toLocaleString()}
                </Badge>
              )}
              <Badge colorScheme="red" px={3} py={1} borderRadius="full">
                Expenses: ${financialData.totalExpenses.toLocaleString()}
              </Badge>
              {financialData.remaining > 0 && (
                <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
                  Remaining: ${financialData.remaining.toLocaleString()}
                </Badge>
              )}
              {financialData.goal && (
                <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
                  Goal: ${financialData.goal.toLocaleString()}
                </Badge>
              )}
            </HStack>

            {/* 3D Chart Visualization */}
            <Box
              bg="gray.900"
              borderRadius="xl"
              border="1px solid"
              borderColor="gray.700"
              overflow="hidden"
            >
              <FinancialChart3D data={financialData} />
            </Box>

            {/* Goal progress indicator */}
            {financialData.goal && (
              <Box
                bg="gray.800"
                p={4}
                borderRadius="lg"
                border="1px solid"
                borderColor="gray.700"
              >
                <Text fontSize="sm" color="gray.400" mb={2}>
                  Progress toward savings goal
                </Text>
                <Box
                  h="8px"
                  bg="gray.700"
                  borderRadius="full"
                  overflow="hidden"
                >
                  <Box
                    h="100%"
                    w={`${financialData.goalProgress}%`}
                    bg={
                      financialData.goalProgress >= 100
                        ? "green.400"
                        : financialData.goalProgress >= 50
                        ? "yellow.400"
                        : "red.400"
                    }
                    borderRadius="full"
                    transition="width 0.5s ease"
                  />
                </Box>
                <Text fontSize="xs" color="gray.500" mt={1} textAlign="right">
                  {financialData.goalProgress.toFixed(0)}%
                </Text>
              </Box>
            )}
          </VStack>
        )}
      </VStack>
    </Box>
  );
}
