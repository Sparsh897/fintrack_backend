import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import type { Session, SessionData } from "express-session";
import { storage } from "./storage";
import { insertTransactionSchema, insertInvestmentSchema, insertGoalSchema, insertGoalTransactionSchema, insertSplitBillSchema, insertSplitBillParticipantSchema, insertUserSchema, investments } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Extend session data
declare module "express-session" {
  interface SessionData {
    userId?: string;
    phoneNumber?: string;
  }
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      session: Session & Partial<SessionData>;
    }
  }
}

// Helper function to generate OTP (6 digits)
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  
  // Send OTP to phone number
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const schema = z.object({
        phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
      });
      
      const { phoneNumber } = schema.parse(req.body);
      
      // Generate OTP
      const otp = generateOTP();
      
      // Save OTP session
      await storage.createOtpSession(phoneNumber, otp);
      
      // In development, return OTP in response
      // In production, send via SMS using Twilio
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AUTH] OTP for ${phoneNumber}: ${otp}`);
        res.json({ success: true, message: "OTP sent successfully", dev_otp: otp });
      } else {
        // TODO: Integrate Twilio to send SMS
        res.json({ success: true, message: "OTP sent successfully" });
      }
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });
  
  // Verify OTP and create/login user
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const schema = z.object({
        phoneNumber: z.string().min(10),
        otp: z.string().length(6),
        name: z.string().min(1).optional(), // Required for new users during signup
      });
      
      const { phoneNumber, otp, name } = schema.parse(req.body);
      
      // Get OTP session first WITHOUT marking as verified
      const otpSession = await storage.getOtpSession(phoneNumber);
      if (!otpSession || otpSession.otp !== otp) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }
      
      // Check if already verified (prevent reuse)
      if (otpSession.verified) {
        return res.status(400).json({ error: "OTP already used" });
      }
      
      // Check if user exists
      let user = await storage.getUserByPhoneNumber(phoneNumber);
      
      if (!user) {
        // New user - require name
        if (!name) {
          // Don't mark OTP as verified yet, allow retry with name
          return res.status(400).json({ error: "Name is required for new users" });
        }
        
        // Create new user
        user = await storage.createUser({
          phoneNumber,
          name,
        });
      }
      
      // Only mark OTP as verified after successful user handling
      await storage.verifyOtp(phoneNumber, otp);
      
      // Set session
      req.session.userId = user.id;
      req.session.phoneNumber = user.phoneNumber;
      
      res.json({
        success: true,
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          name: user.name,
        },
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });
  
  // Check if user is authenticated
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "User not found" });
    }
    
    res.json({
      id: user.id,
      phoneNumber: user.phoneNumber,
      name: user.name,
    });
  });
  
  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });
  
  // Transaction routes
  app.get("/api/transactions", async (req, res) => {
    const transactions = await storage.getTransactions();
    res.json(transactions);
  });

  app.get("/api/transactions/:id", async (req, res) => {
    const transaction = await storage.getTransaction(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(transaction);
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const validated = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction({
        ...validated,
        description: validated.description ?? null
      });
      res.json(transaction);
    } catch (error: any) {
      const validationError = fromZodError(error);
      res.status(400).json({ error: validationError.message });
    }
  });

  app.patch("/api/transactions/:id", async (req, res) => {
    try {
      const validated = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(req.params.id, validated);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error: any) {
      const validationError = fromZodError(error);
      res.status(400).json({ error: validationError.message });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    const deleted = await storage.deleteTransaction(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json({ success: true });
  });

  // Investment routes
  app.get("/api/investments", async (req, res) => {
    const investments = await storage.getInvestments();
    res.json(investments);
  });

  app.get("/api/investments/:id", async (req, res) => {
    const investment = await storage.getInvestment(req.params.id);
    if (!investment) {
      return res.status(404).json({ error: "Investment not found" });
    }
    res.json(investment);
  });

  app.post("/api/investments", async (req, res) => {
    try {
      const validated = insertInvestmentSchema.parse(req.body);
      const investment = await storage.createInvestment({
        ...validated,
        carat: validated.carat ?? null
      });
      res.json(investment);
    } catch (error: any) {
      const validationError = fromZodError(error);
      res.status(400).json({ error: validationError.message });
    }
  });

  app.patch("/api/investments/:id", async (req, res) => {
    try {
      // Load existing investment to validate the merged result
      const existing = await storage.getInvestment(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Investment not found" });
      }

      // Parse and validate the partial update
      const updateInvestmentSchema = createInsertSchema(investments)
        .omit({ id: true, createdAt: true })
        .extend({ date: z.coerce.date().optional() })
        .partial();
      
      const validated = updateInvestmentSchema.parse(req.body);
      
      // Merge with existing to check final state
      const merged = { ...existing, ...validated };
      
      // Validate that gold investments have carat in the final state
      if (merged.type === "gold" && (!merged.carat || merged.carat === null)) {
        return res.status(400).json({ 
          error: "Gold investment must include carat (22K or 24K)" 
        });
      }
      
      const investment = await storage.updateInvestment(req.params.id, validated);
      res.json(investment);
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Error updating investment:", error);
      res.status(400).json({ error: error.message || "Failed to update investment" });
    }
  });

  app.delete("/api/investments/:id", async (req, res) => {
    const deleted = await storage.deleteInvestment(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Investment not found" });
    }
    res.json({ success: true });
  });

  // Goal routes
  app.get("/api/goals", async (req, res) => {
    const goals = await storage.getGoals();
    res.json(goals);
  });

  app.get("/api/goals/:id", async (req, res) => {
    const goal = await storage.getGoal(req.params.id);
    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }
    res.json(goal);
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const validated = insertGoalSchema.parse(req.body);
      const goal = await storage.createGoal({
        ...validated,
        currentAmount: validated.currentAmount ?? "0",
        icon: validated.icon ?? "bike",
        targetDate: validated.targetDate ?? null
      });
      res.json(goal);
    } catch (error: any) {
      const validationError = fromZodError(error);
      res.status(400).json({ error: validationError.message });
    }
  });

  app.patch("/api/goals/:id", async (req, res) => {
    try {
      const validated = insertGoalSchema.partial().parse(req.body);
      const goal = await storage.updateGoal(req.params.id, validated);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json(goal);
    } catch (error: any) {
      const validationError = fromZodError(error);
      res.status(400).json({ error: validationError.message });
    }
  });

  app.delete("/api/goals/:id", async (req, res) => {
    const deleted = await storage.deleteGoal(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Goal not found" });
    }
    res.json({ success: true });
  });

  // Goal transaction routes
  app.get("/api/goals/:goalId/transactions", async (req, res) => {
    const transactions = await storage.getGoalTransactions(req.params.goalId);
    res.json(transactions);
  });

  app.post("/api/goals/:goalId/transactions", async (req, res) => {
    try {
      const validated = insertGoalTransactionSchema.parse({
        ...req.body,
        goalId: req.params.goalId
      });
      
      // Get current goal
      const goal = await storage.getGoal(req.params.goalId);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }

      // Create transaction
      const transaction = await storage.createGoalTransaction({
        ...validated,
        date: new Date(),
        description: validated.description ?? null
      });

      // Update goal currentAmount based on transaction type
      const currentAmount = parseFloat(goal.currentAmount);
      const transactionAmount = parseFloat(validated.amount);
      let newAmount = currentAmount;

      if (validated.type === "add_funds") {
        newAmount = currentAmount + transactionAmount;
      } else if (validated.type === "withdraw" || validated.type === "payment") {
        newAmount = currentAmount - transactionAmount;
      }

      // Update goal with new amount
      await storage.updateGoal(req.params.goalId, {
        currentAmount: newAmount.toString()
      });

      res.json(transaction);
    } catch (error: any) {
      const validationError = fromZodError(error);
      res.status(400).json({ error: validationError.message });
    }
  });

  // Split bill routes
  app.get("/api/split-bills", async (req, res) => {
    const bills = await storage.getSplitBills();
    res.json(bills);
  });

  app.get("/api/split-bills/:id", async (req, res) => {
    const bill = await storage.getSplitBill(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: "Split bill not found" });
    }
    res.json(bill);
  });

  app.post("/api/split-bills", async (req, res) => {
    try {
      const validated = insertSplitBillSchema.parse(req.body);
      const bill = await storage.createSplitBill({
        ...validated,
        settled: validated.settled ?? false
      });
      res.json(bill);
    } catch (error: any) {
      const validationError = fromZodError(error);
      res.status(400).json({ error: validationError.message });
    }
  });

  app.patch("/api/split-bills/:id", async (req, res) => {
    try {
      const validated = insertSplitBillSchema.partial().parse(req.body);
      const bill = await storage.updateSplitBill(req.params.id, validated);
      if (!bill) {
        return res.status(404).json({ error: "Split bill not found" });
      }
      res.json(bill);
    } catch (error: any) {
      const validationError = fromZodError(error);
      res.status(400).json({ error: validationError.message });
    }
  });

  // Split bill participant routes
  app.get("/api/split-bills/:billId/participants", async (req, res) => {
    const participants = await storage.getBillParticipants(req.params.billId);
    res.json(participants);
  });

  app.post("/api/split-bills/:billId/participants", async (req, res) => {
    try {
      const validated = insertSplitBillParticipantSchema.parse({
        ...req.body,
        billId: req.params.billId
      });
      const participant = await storage.createBillParticipant({
        ...validated,
        settled: validated.settled ?? false
      });
      res.json(participant);
    } catch (error: any) {
      const validationError = fromZodError(error);
      res.status(400).json({ error: validationError.message });
    }
  });

  app.patch("/api/split-bills/participants/:id", async (req, res) => {
    try {
      const validated = insertSplitBillParticipantSchema.partial().parse(req.body);
      const participant = await storage.updateBillParticipant(req.params.id, validated);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }
      res.json(participant);
    } catch (error: any) {
      const validationError = fromZodError(error);
      res.status(400).json({ error: validationError.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
