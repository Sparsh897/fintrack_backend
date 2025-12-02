import type { Express } from "express";
import { createServer, type Server } from "http";
import { Transaction } from "./models/Transaction";
import { Investment } from "./models/Investment";
import { Goal } from "./models/Goal";
import { GoalTransaction } from "./models/GoalTransaction";
import { authenticateToken } from "./middleware/auth";
import authRoutes from "./routes/auth";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Authentication routes (no middleware needed)
  app.use("/api/auth", authRoutes);

  // TRANSACTIONS ROUTES (Protected)
  
  // Get all transactions
  app.get("/api/transactions", authenticateToken, async (req, res) => {
    try {
      const transactions = await Transaction.find().sort({ date: -1 });
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Create transaction
  app.post("/api/transactions", authenticateToken, async (req, res) => {
    try {
      const transaction = new Transaction(req.body);
      await transaction.save();
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ error: "Failed to create transaction" });
    }
  });

  // Update transaction
  app.put("/api/transactions/:id", authenticateToken, async (req, res) => {
    try {
      const transaction = await Transaction.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ error: "Failed to update transaction" });
    }
  });

  // Delete transaction
  app.delete("/api/transactions/:id", authenticateToken, async (req, res) => {
    try {
      const transaction = await Transaction.findByIdAndDelete(req.params.id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  // INVESTMENTS ROUTES (Protected)

  // Get all investments
  app.get("/api/investments", authenticateToken, async (req, res) => {
    try {
      const investments = await Investment.find().sort({ date: -1 });
      res.json(investments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch investments" });
    }
  });

  // Create investment
  app.post("/api/investments", authenticateToken, async (req, res) => {
    try {
      const investment = new Investment(req.body);
      await investment.save();
      res.status(201).json(investment);
    } catch (error) {
      res.status(400).json({ error: "Failed to create investment" });
    }
  });

  // Update investment
  app.put("/api/investments/:id", authenticateToken, async (req, res) => {
    try {
      const investment = await Investment.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!investment) {
        return res.status(404).json({ error: "Investment not found" });
      }
      res.json(investment);
    } catch (error) {
      res.status(400).json({ error: "Failed to update investment" });
    }
  });

  // Delete investment
  app.delete("/api/investments/:id", authenticateToken, async (req, res) => {
    try {
      const investment = await Investment.findByIdAndDelete(req.params.id);
      if (!investment) {
        return res.status(404).json({ error: "Investment not found" });
      }
      res.json({ message: "Investment deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete investment" });
    }
  });

  // GOALS ROUTES (Protected)

  // Get all goals
  app.get("/api/goals", authenticateToken, async (req, res) => {
    try {
      const goals = await Goal.find().sort({ createdAt: -1 });
      res.json(goals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goals" });
    }
  });

  // Get single goal
  app.get("/api/goals/:id", authenticateToken, async (req, res) => {
    try {
      const goal = await Goal.findById(req.params.id);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goal" });
    }
  });

  // Create goal
  app.post("/api/goals", authenticateToken, async (req, res) => {
    try {
      const goal = new Goal(req.body);
      await goal.save();
      res.status(201).json(goal);
    } catch (error) {
      res.status(400).json({ error: "Failed to create goal" });
    }
  });

  // Update goal
  app.put("/api/goals/:id", authenticateToken, async (req, res) => {
    try {
      const goal = await Goal.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(400).json({ error: "Failed to update goal" });
    }
  });

  // Delete goal
  app.delete("/api/goals/:id", authenticateToken, async (req, res) => {
    try {
      // Also delete all goal transactions
      await GoalTransaction.deleteMany({ goalId: req.params.id });
      
      const goal = await Goal.findByIdAndDelete(req.params.id);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }
      res.json({ message: "Goal deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // GOAL TRANSACTIONS ROUTES (Protected)

  // Get goal transactions
  app.get("/api/goals/:goalId/transactions", authenticateToken, async (req, res) => {
    try {
      const transactions = await GoalTransaction.find({ goalId: req.params.goalId })
        .sort({ date: -1 });
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch goal transactions" });
    }
  });

  // Create goal transaction
  app.post("/api/goals/:goalId/transactions", authenticateToken, async (req, res) => {
    try {
      const { type, amount, description } = req.body;
      const goalId = req.params.goalId;

      // Find the goal
      const goal = await Goal.findById(goalId);
      if (!goal) {
        return res.status(404).json({ error: "Goal not found" });
      }

      // Create the transaction
      const transaction = new GoalTransaction({
        goalId,
        type,
        amount,
        description
      });
      await transaction.save();

      // Update goal's current amount
      if (type === 'deposit') {
        goal.currentAmount += amount;
      } else if (type === 'withdraw' || type === 'payment') {
        if (goal.currentAmount < amount) {
          return res.status(400).json({ error: "Insufficient funds in goal" });
        }
        goal.currentAmount -= amount;
      }

      await goal.save();

      res.status(201).json({
        transaction,
        updatedGoal: goal
      });
    } catch (error) {
      res.status(400).json({ error: "Failed to create goal transaction" });
    }
  });

  return httpServer;
}