import { type User, type InsertUser, type OtpSession, type Transaction, type Investment, type Goal, type GoalTransaction, type SplitBill, type SplitBillParticipant } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // OTP session methods
  createOtpSession(phoneNumber: string, otp: string): Promise<OtpSession>;
  getOtpSession(phoneNumber: string): Promise<OtpSession | undefined>;
  verifyOtp(phoneNumber: string, otp: string): Promise<boolean>;
  cleanupExpiredOtpSessions(): Promise<void>;
  
  // Transaction methods
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<Omit<Transaction, 'id' | 'createdAt'>>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;
  
  // Investment methods
  getInvestments(): Promise<Investment[]>;
  getInvestment(id: string): Promise<Investment | undefined>;
  createInvestment(investment: Omit<Investment, 'id' | 'createdAt'>): Promise<Investment>;
  updateInvestment(id: string, investment: Partial<Omit<Investment, 'id' | 'createdAt'>>): Promise<Investment | undefined>;
  deleteInvestment(id: string): Promise<boolean>;
  
  // Goal methods
  getGoals(): Promise<Goal[]>;
  getGoal(id: string): Promise<Goal | undefined>;
  createGoal(goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal>;
  updateGoal(id: string, goal: Partial<Omit<Goal, 'id' | 'createdAt'>>): Promise<Goal | undefined>;
  deleteGoal(id: string): Promise<boolean>;
  
  // Goal transaction methods
  getGoalTransactions(goalId: string): Promise<GoalTransaction[]>;
  createGoalTransaction(transaction: Omit<GoalTransaction, 'id'>): Promise<GoalTransaction>;
  
  // Split bill methods
  getSplitBills(): Promise<SplitBill[]>;
  getSplitBill(id: string): Promise<SplitBill | undefined>;
  createSplitBill(bill: Omit<SplitBill, 'id' | 'createdAt'>): Promise<SplitBill>;
  updateSplitBill(id: string, bill: Partial<Omit<SplitBill, 'id' | 'createdAt'>>): Promise<SplitBill | undefined>;
  
  // Split bill participant methods
  getBillParticipants(billId: string): Promise<SplitBillParticipant[]>;
  createBillParticipant(participant: Omit<SplitBillParticipant, 'id'>): Promise<SplitBillParticipant>;
  updateBillParticipant(id: string, participant: Partial<Omit<SplitBillParticipant, 'id'>>): Promise<SplitBillParticipant | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private otpSessions: Map<string, OtpSession>;
  private transactions: Map<string, Transaction>;
  private investments: Map<string, Investment>;
  private goals: Map<string, Goal>;
  private goalTransactions: Map<string, GoalTransaction>;
  private splitBills: Map<string, SplitBill>;
  private billParticipants: Map<string, SplitBillParticipant>;

  constructor() {
    this.users = new Map();
    this.otpSessions = new Map();
    this.transactions = new Map();
    this.investments = new Map();
    this.goals = new Map();
    this.goalTransactions = new Map();
    this.splitBills = new Map();
    this.billParticipants = new Map();
    
    this.seedExampleData();
  }

  private seedExampleData() {
    // Example transactions (income and expenses)
    const exampleTransactions: Transaction[] = [
      {
        id: randomUUID(),
        type: 'income',
        amount: '50000',
        category: 'Salary',
        description: 'Monthly salary - October',
        date: new Date('2024-10-01'),
        createdAt: new Date('2024-10-01')
      },
      {
        id: randomUUID(),
        type: 'income',
        amount: '15000',
        category: 'Freelance',
        description: 'Web development project',
        date: new Date('2024-10-15'),
        createdAt: new Date('2024-10-15')
      },
      {
        id: randomUUID(),
        type: 'income',
        amount: '20000',
        category: 'Bonus',
        description: 'Quarterly performance bonus',
        date: new Date('2024-10-20'),
        createdAt: new Date('2024-10-20')
      },
      {
        id: randomUUID(),
        type: 'expense',
        amount: '15000',
        category: 'Rent',
        description: 'Monthly rent payment',
        date: new Date('2024-10-05'),
        createdAt: new Date('2024-10-05')
      },
      {
        id: randomUUID(),
        type: 'expense',
        amount: '3500',
        category: 'Food',
        description: 'Groceries and dining',
        date: new Date('2024-10-10'),
        createdAt: new Date('2024-10-10')
      },
      {
        id: randomUUID(),
        type: 'expense',
        amount: '2500',
        category: 'Transport',
        description: 'Fuel and cab expenses',
        date: new Date('2024-10-12'),
        createdAt: new Date('2024-10-12')
      },
      {
        id: randomUUID(),
        type: 'expense',
        amount: '8500',
        category: 'Shopping',
        description: 'Clothing and electronics',
        date: new Date('2024-10-18'),
        createdAt: new Date('2024-10-18')
      },
      {
        id: randomUUID(),
        type: 'expense',
        amount: '1200',
        category: 'Entertainment',
        description: 'Movie tickets and streaming',
        date: new Date('2024-10-22'),
        createdAt: new Date('2024-10-22')
      },
      {
        id: randomUUID(),
        type: 'expense',
        amount: '4500',
        category: 'Utilities',
        description: 'Electricity, water, internet',
        date: new Date('2024-10-25'),
        createdAt: new Date('2024-10-25')
      },
    ];

    exampleTransactions.forEach(t => this.transactions.set(t.id, t));

    // Example investments (gold and silver)
    const exampleInvestments: Investment[] = [
      {
        id: randomUUID(),
        type: 'gold',
        carat: '22K',
        quantity: '10',
        pricePerUnit: '5800',
        totalAmount: '58000',
        date: new Date('2024-09-15'),
        createdAt: new Date('2024-09-15')
      },
      {
        id: randomUUID(),
        type: 'gold',
        carat: '24K',
        quantity: '5',
        pricePerUnit: '6300',
        totalAmount: '31500',
        date: new Date('2024-10-05'),
        createdAt: new Date('2024-10-05')
      },
      {
        id: randomUUID(),
        type: 'silver',
        carat: null,
        quantity: '50',
        pricePerUnit: '85',
        totalAmount: '4250',
        date: new Date('2024-09-20'),
        createdAt: new Date('2024-09-20')
      },
      {
        id: randomUUID(),
        type: 'silver',
        carat: null,
        quantity: '30',
        pricePerUnit: '87',
        totalAmount: '2610',
        date: new Date('2024-10-10'),
        createdAt: new Date('2024-10-10')
      },
    ];

    exampleInvestments.forEach(i => this.investments.set(i.id, i));

    // Example goals
    const goal1Id = randomUUID();
    const goal2Id = randomUUID();
    
    const exampleGoals: Goal[] = [
      {
        id: goal1Id,
        name: 'New Bike',
        targetAmount: '100000',
        currentAmount: '45000',
        icon: 'bike',
        targetDate: new Date('2025-06-01'),
        createdAt: new Date('2024-08-01')
      },
      {
        id: goal2Id,
        name: 'Vacation Fund',
        targetAmount: '75000',
        currentAmount: '28000',
        icon: 'plane',
        targetDate: new Date('2025-03-01'),
        createdAt: new Date('2024-09-01')
      },
    ];

    exampleGoals.forEach(g => this.goals.set(g.id, g));

    // Example goal transactions
    const exampleGoalTransactions: GoalTransaction[] = [
      {
        id: randomUUID(),
        goalId: goal1Id,
        type: 'add_funds',
        amount: '20000',
        description: 'Initial savings',
        date: new Date('2024-08-01')
      },
      {
        id: randomUUID(),
        goalId: goal1Id,
        type: 'add_funds',
        amount: '15000',
        description: 'Monthly contribution',
        date: new Date('2024-09-01')
      },
      {
        id: randomUUID(),
        goalId: goal1Id,
        type: 'add_funds',
        amount: '10000',
        description: 'Bonus allocation',
        date: new Date('2024-10-01')
      },
    ];

    exampleGoalTransactions.forEach(gt => this.goalTransactions.set(gt.id, gt));

    // Example split bill
    const billId = randomUUID();
    const exampleBill: SplitBill = {
      id: billId,
      description: 'Weekend trip to Goa',
      totalAmount: '12000',
      createdBy: 'You',
      createdAt: new Date('2024-10-28'),
      settled: false
    };

    this.splitBills.set(billId, exampleBill);

    // Example bill participants
    const exampleParticipants: SplitBillParticipant[] = [
      {
        id: randomUUID(),
        billId: billId,
        name: 'Rahul',
        phoneNumber: '+91 98765 43210',
        share: '3000',
        settled: true
      },
      {
        id: randomUUID(),
        billId: billId,
        name: 'Priya',
        phoneNumber: '+91 98765 43211',
        share: '3000',
        settled: false
      },
      {
        id: randomUUID(),
        billId: billId,
        name: 'Amit',
        phoneNumber: '+91 98765 43212',
        share: '3000',
        settled: false
      },
      {
        id: randomUUID(),
        billId: billId,
        name: 'You',
        phoneNumber: '+91 98765 43213',
        share: '3000',
        settled: true
      },
    ];

    exampleParticipants.forEach(p => this.billParticipants.set(p.id, p));
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phoneNumber === phoneNumber,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // OTP session methods
  async createOtpSession(phoneNumber: string, otp: string): Promise<OtpSession> {
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    const session: OtpSession = {
      id,
      phoneNumber,
      otp,
      expiresAt,
      verified: false,
      createdAt: new Date()
    };
    this.otpSessions.set(phoneNumber, session);
    return session;
  }

  async getOtpSession(phoneNumber: string): Promise<OtpSession | undefined> {
    const session = this.otpSessions.get(phoneNumber);
    if (!session) return undefined;
    
    // Check if expired
    if (new Date() > session.expiresAt) {
      this.otpSessions.delete(phoneNumber);
      return undefined;
    }
    
    return session;
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
    const session = await this.getOtpSession(phoneNumber);
    if (!session || session.verified) return false;
    
    if (session.otp === otp) {
      session.verified = true;
      this.otpSessions.set(phoneNumber, session);
      return true;
    }
    
    return false;
  }

  async cleanupExpiredOtpSessions(): Promise<void> {
    const now = new Date();
    const entries = Array.from(this.otpSessions.entries());
    for (const [phoneNumber, session] of entries) {
      if (now > session.expiresAt) {
        this.otpSessions.delete(phoneNumber);
      }
    }
  }

  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const id = randomUUID();
    const newTransaction: Transaction = {
      ...transaction,
      id,
      createdAt: new Date()
    };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  async updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updated: Transaction = { ...transaction, ...updates };
    this.transactions.set(id, updated);
    return updated;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // Investment methods
  async getInvestments(): Promise<Investment[]> {
    return Array.from(this.investments.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getInvestment(id: string): Promise<Investment | undefined> {
    return this.investments.get(id);
  }

  async createInvestment(investment: Omit<Investment, 'id' | 'createdAt'>): Promise<Investment> {
    const id = randomUUID();
    const newInvestment: Investment = {
      ...investment,
      id,
      createdAt: new Date()
    };
    this.investments.set(id, newInvestment);
    return newInvestment;
  }

  async updateInvestment(id: string, updates: Partial<Omit<Investment, 'id' | 'createdAt'>>): Promise<Investment | undefined> {
    const investment = this.investments.get(id);
    if (!investment) return undefined;
    
    const updated: Investment = { ...investment, ...updates };
    this.investments.set(id, updated);
    return updated;
  }

  async deleteInvestment(id: string): Promise<boolean> {
    return this.investments.delete(id);
  }

  // Goal methods
  async getGoals(): Promise<Goal[]> {
    return Array.from(this.goals.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> {
    const id = randomUUID();
    const newGoal: Goal = {
      ...goal,
      id,
      createdAt: new Date()
    };
    this.goals.set(id, newGoal);
    return newGoal;
  }

  async updateGoal(id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt'>>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    
    const updated: Goal = { ...goal, ...updates };
    this.goals.set(id, updated);
    return updated;
  }

  async deleteGoal(id: string): Promise<boolean> {
    return this.goals.delete(id);
  }

  // Goal transaction methods
  async getGoalTransactions(goalId: string): Promise<GoalTransaction[]> {
    return Array.from(this.goalTransactions.values())
      .filter(gt => gt.goalId === goalId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createGoalTransaction(transaction: Omit<GoalTransaction, 'id'>): Promise<GoalTransaction> {
    const id = randomUUID();
    const newTransaction: GoalTransaction = {
      ...transaction,
      id,
      date: transaction.date || new Date()
    };
    this.goalTransactions.set(id, newTransaction);
    
    // Update goal's current amount
    const goal = this.goals.get(transaction.goalId);
    if (goal) {
      const amount = parseFloat(transaction.amount);
      let newAmount = parseFloat(goal.currentAmount);
      
      if (transaction.type === 'add_funds') {
        newAmount += amount;
      } else if (transaction.type === 'withdraw' || transaction.type === 'payment') {
        newAmount -= amount;
      }
      
      goal.currentAmount = Math.max(0, newAmount).toString();
      this.goals.set(goal.id, goal);
    }
    
    return newTransaction;
  }

  // Split bill methods
  async getSplitBills(): Promise<SplitBill[]> {
    return Array.from(this.splitBills.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getSplitBill(id: string): Promise<SplitBill | undefined> {
    return this.splitBills.get(id);
  }

  async createSplitBill(bill: Omit<SplitBill, 'id' | 'createdAt'>): Promise<SplitBill> {
    const id = randomUUID();
    const newBill: SplitBill = {
      ...bill,
      id,
      createdAt: new Date()
    };
    this.splitBills.set(id, newBill);
    return newBill;
  }

  async updateSplitBill(id: string, updates: Partial<Omit<SplitBill, 'id' | 'createdAt'>>): Promise<SplitBill | undefined> {
    const bill = this.splitBills.get(id);
    if (!bill) return undefined;
    
    const updated: SplitBill = { ...bill, ...updates };
    this.splitBills.set(id, updated);
    return updated;
  }

  // Split bill participant methods
  async getBillParticipants(billId: string): Promise<SplitBillParticipant[]> {
    return Array.from(this.billParticipants.values())
      .filter(p => p.billId === billId);
  }

  async createBillParticipant(participant: Omit<SplitBillParticipant, 'id'>): Promise<SplitBillParticipant> {
    const id = randomUUID();
    const newParticipant: SplitBillParticipant = {
      ...participant,
      id
    };
    this.billParticipants.set(id, newParticipant);
    return newParticipant;
  }

  async updateBillParticipant(id: string, updates: Partial<Omit<SplitBillParticipant, 'id'>>): Promise<SplitBillParticipant | undefined> {
    const participant = this.billParticipants.get(id);
    if (!participant) return undefined;
    
    const updated: SplitBillParticipant = { ...participant, ...updates };
    this.billParticipants.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
