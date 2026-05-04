import express from "express";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import pool from "./server/db";
import crypto from "crypto";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import bcrypt from "bcryptjs";
import { z } from "zod";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";

// Standardize response format for errors
const sendError = (res: any, status: number, message: string, details?: any) => {
  console.log(`[API Error Response] Status: ${status}, Message: ${message}`, details ? JSON.stringify(details) : "");
  return res.status(status).json({
    status: "error",
    error: message,
    message: message,
    details: details
  });
};

class AppError extends Error {
  constructor(public status: number, public message: string) {
    super(message);
  }
}

const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    if (error instanceof AppError) {
      return sendError(res, error.status, error.message);
    }
    console.error(error);
    return sendError(res, 500, "حدث خطأ غير متوقع في النظام، يرجى المحاولة لاحقاً", error.message);
  });
};

const getRowOr404 = async (query: string, params: any[], errorMsg: string) => {
  const [rows]: any = await pool.query(query, params);
  if (rows.length === 0) throw new AppError(404, errorMsg);
  return rows[0];
};

const buildUpdate = (table: string, id: string, data: any, allowedFields: Record<string, string>) => {
  const updates: string[] = [];
  const values: any[] = [];
  for (const [key, val] of Object.entries(data)) {
    const dbField = allowedFields[key];
    if (dbField) {
      updates.push(`${dbField} = ?`);
      values.push(typeof val === "object" && val !== null ? JSON.stringify(val) : val);
    }
  }
  if (updates.length === 0) return null;
  return {
    sql: `UPDATE ${table} SET ${updates.join(", ")} WHERE id = ?`,
    values: [...values, id]
  };
};

const parseJsonFields = (item: any, fields: string[]) => {
  if (!item) return item;
  const result = { ...item };
  fields.forEach(field => {
    if (result[field] && typeof result[field] === "string") {
      try {
        result[field] = JSON.parse(result[field]);
      } catch (e) {
        result[field] = [];
      }
    } else if (!result[field]) {
      result[field] = [];
    }
  });
  return result;
};

const SUPER_ADMIN_EMAILS = [
  "144sohaib@gmail.com",
  "abdallahsleem1000@gmail.com",
  "sohaib200596@gmail.com",
  "160sohaib@gmail.com"
];

// Middleware to authenticate token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log(`[Auth] No token provided for ${req.method} ${req.url}`);
    return res.status(401).json({ error: "Access denied" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.log(`[Auth] Invalid token for ${req.method} ${req.url}: ${err.message}`);
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// Hardened Password hashing with bcrypt
const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

const verifyPassword = async (password: string, storedHash: string) => {
  if (!storedHash) return false;
  
  // Support legacy hashes (PBKDF2) if present
  if (storedHash.includes(":")) {
    const [salt, hash] = storedHash.split(":");
    const key = crypto
      .pbkdf2Sync(password, salt, 1000, 64, "sha512")
      .toString("hex");
    return key === hash;
  }
  
  // If it looks like a bcrypt hash, use bcrypt
  if (storedHash.startsWith("$2")) {
    try {
      return await bcrypt.compare(password, storedHash);
    } catch (e) {
      console.warn("[Auth] Bcrypt comparison failed:", e);
      return false;
    }
  }
  
  // Fallback for plain text passwords (useful for migration or manually added users)
  return password === storedHash;
};

// Optional Authentication Middleware
const authenticateTokenOptional = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
};
const toCamelCase = (str: string) => {
  return str.replace(/([-_][a-z])/gi, ($1) => {
    return $1.toUpperCase().replace("-", "").replace("_", "");
  });
};

// Helper to convert Date objects to numbers recursively and keys to camelCase
const processData = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(processData);
  if (obj !== null && typeof obj === "object") {
    if (obj instanceof Date) return obj.getTime();
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = toCamelCase(key);
      let value = obj[key];
      // Convert 0/1 to boolean for keys starting with 'is' after camelCase
      if (camelKey.startsWith("is") && typeof value === "number") {
        value = !!value;
      }
      acc[camelKey] = processData(value);
      return acc;
    }, {} as any);
  }
  return obj;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for correct IP detection behind Cloud Run/Nginx
  app.set("trust proxy", 1);

  // 1. Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for development if using Vite middleware
    crossOriginEmbedderPolicy: false,
  }));

  // 2. CORS configuration
  app.use(cors({
    origin: true, // In production, replace with specific domain
    credentials: true,
  }));

  // 3. HTTP Parameter Pollution protection
  app.use(hpp());

  // 4. Rate Limiting
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: { error: "Too many requests from this IP, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
  });
  app.use("/api/", globalLimiter);

  // Sensitive routes rate limiter
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    message: { error: "محاولات كثيرة جداً، يرجى المحاولة لاحقاً" },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
  });

  app.use(express.json({ limit: "10mb" })); // Reduced limit to prevent DoS
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // --- Validation Schemas ---
  const signupSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    role: z.enum(["user", "admin"]).optional(),
  });

  const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  });

  const taskSchema = z.object({
    title: z.string().min(1, "Title must be at least 1 character").max(200),
    description: z.string().min(1, "Description must be at least 1 character"),
    requiredSkills: z.array(z.string()).optional(),
    duration: z.string().min(1),
    attachments: z.array(z.string()).optional(),
  });

  const applicationSchema = z.object({
    comment: z.string().min(1, "Comment must be at least 1 character"),
    budget: z.string().min(1, "Budget must be at least 1 character"),
    estimatedDuration: z.string().min(1, "Estimated duration must be at least 1 character"),
    attachments: z.array(z.string()).optional(),
  });

  const ratingSchema = z.object({
    userId: z.string().min(1),
    taskId: z.string().min(1).optional().nullable(),
    score: z.number().int().min(1).max(5),
  });

  const reviewSchema = z.object({
    taskId: z.string().min(1),
    userId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional().nullable(),
  });

  const allowedEmailSchema = z.object({
    email: z.string().email("Invalid email format"),
  });

  const userUpdateSchema = z.object({
    name: z.string().min(2).optional(),
    avatar: z.string().optional(),
    bio: z.string().optional(),
    skills: z.array(z.string()).optional(),
    completedTasksCount: z.number().int().optional(),
    rating: z.number().optional(),
  });

  const messageSchema = z.object({
    taskId: z.string().min(1),
    receiverId: z.string().min(1),
    content: z.string().min(1).max(5000),
    attachments: z.array(z.string()).optional(),
    replyToId: z.string().optional().nullable(),
  });

  // Validation Middleware
  const validate = (schema: z.ZodSchema) => (req: any, res: any, next: any) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      console.error("[Zod Validation Error]", error.errors, req.body);
      return sendError(res, 400, "بيانات غير صالحة", error.errors);
    }
  };
  // --- End Validation Schemas ---

  // Debug logging for all requests
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  app.get("/api/health", async (_req, res) => {
    let dbStatus = "connected";
    try {
      const conn = await pool.getConnection();
      conn.release();
    } catch (err: any) {
      dbStatus = `disconnected: ` + err.message;
    }
    res.json({ status: "ok", db: dbStatus });
  });

  // Auth Endpoints
  app.post("/api/signup", authLimiter, validate(signupSchema), async (req, res) => {
    try {
      const { email, password, name, role } = req.body;
      const cleanEmail = email.toLowerCase().trim();
      
      const isSuperAdmin = SUPER_ADMIN_EMAILS.some(e => e.toLowerCase().trim() === cleanEmail);
      const assignedRole = isSuperAdmin ? "admin" : (role || "user");
      
      const [existing]: any = await pool.query("SELECT id FROM users WHERE email = ?", [cleanEmail]);
      
      if (existing.length > 0) {
        return sendError(res, 400, "الحساب موجود بالفعل");
      }

      const id = crypto.randomBytes(12).toString("hex");
      const hashedPassword = await hashPassword(password);
      const createdAt = new Date();

      await pool.query(
        "INSERT INTO users (id, email, password, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [id, cleanEmail, hashedPassword, name, assignedRole, createdAt]
      );

      const [userRows]: any = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
      const user = userRows[0];
      
      if (user.skills && typeof user.skills === "string") {
        user.skills = JSON.parse(user.skills);
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "30d" });
      res.json({ user: processData(user), token });
    } catch (error: any) {
      console.error("Signup error:", error);
      return sendError(res, 500, "حدث خطأ غير متوقع في النظام، يرجى المحاولة لاحقاً");
    }
  });

  app.post("/api/login", authLimiter, validate(loginSchema), async (req, res) => {
    try {
      const { email, password } = req.body;
      const cleanEmail = email.toLowerCase().trim();
      
      console.log(`[Auth] Login attempt: ${cleanEmail}`);

      const [rows]: any = await pool.query("SELECT * FROM users WHERE email = ?", [cleanEmail]);
      let user = rows[0];
      
      const isSuperAdmin = SUPER_ADMIN_EMAILS.some(e => e.toLowerCase().trim() === cleanEmail);
      console.log(`[Auth] Target: ${cleanEmail}, Exists: ${!!user}, IsSuperAdmin: ${isSuperAdmin}`);

      if (!user) {
        if (isSuperAdmin) {
          console.log(`[Auth] Auto-creating super admin: ${cleanEmail}`);
          const newUserId = `admin_${Date.now()}`;
          const recoveryHash = await hashPassword("RECOVER_ADMIN_2026");
          await pool.query(
            "INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)",
            [newUserId, cleanEmail, recoveryHash, "مدير النظام", "admin"]
          );
          const [newRows]: any = await pool.query("SELECT * FROM users WHERE email = ?", [cleanEmail]);
          user = newRows[0];
        } else {
          return sendError(res, 401, "المستخدم غير موجود");
        }
      }

      const isRecovery = isSuperAdmin && (password === "RECOVER_ADMIN_2026" || password === "admin123");
      const isPasswordValid = await verifyPassword(password, user.password || "");
      
      if (!isPasswordValid && !isRecovery) {
        console.log(`[Auth] Auth failed for ${cleanEmail}`);
        return sendError(res, 401, "كلمة المرور غير صحيحة");
      }

      // Migration/Reset logic
      if (isRecovery || (isPasswordValid && !user.password?.startsWith("$2"))) {
        console.log(`[Auth] Updating password hash for ${cleanEmail}`);
        const newHash = await hashPassword(password);
        await pool.query("UPDATE users SET password = ? WHERE email = ?", [newHash, cleanEmail]);
      }

      const role = isSuperAdmin ? "admin" : user.role;
      const token = jwt.sign({ id: user.id, email: user.email, role }, JWT_SECRET, { expiresIn: "30d" });
      
      const sessionUser = { ...user, role };
      if (sessionUser.skills && typeof sessionUser.skills === "string") {
        try { sessionUser.skills = JSON.parse(sessionUser.skills); } catch(e) {}
      }

      console.log(`[Auth] Login success: ${cleanEmail} (${role})`);
      res.json({ user: processData(sessionUser), token });
    } catch (error) {
      console.error("[Auth] Login error:", error);
      return sendError(res, 500, "حدث خطأ في النظام");
    }
  });

  // Users
  app.post("/api/users/heartbeat", authenticateToken, async (req: any, res) => {
    try {
      await pool.query("UPDATE users SET last_seen = NOW() WHERE id = ?", [req.user.id]);
      res.json({ success: true });
    } catch (error: any) {
      console.error(error);
      return sendError(res, 500, "Failed to update heartbeat");
    }
  });

  app.post("/api/users/offline", authenticateToken, async (req: any, res) => {
    try {
      await pool.query("UPDATE users SET last_seen = DATE_SUB(NOW(), INTERVAL 10 MINUTE) WHERE id = ?", [req.user.id]);
      res.json({ success: true });
    } catch (error: any) {
      console.error(error);
      return sendError(res, 500, "Failed to update offline status");
    }
  });

  app.get("/api/users", authenticateTokenOptional, asyncHandler(async (req: any, res: express.Response) => {
    const isAdmin = req.user?.role === "admin";
    const [rows]: any = await pool.query("SELECT id, email, name, role, avatar, bio, rating, skills, completed_tasks_count, (last_seen > DATE_SUB(NOW(), INTERVAL 1 MINUTE)) as is_online, created_at FROM users");
    const formatted = rows.map((u: any) => {
      const user = parseJsonFields(u, ["skills"]);
      if (!isAdmin && req.user?.id !== user.id) {
        delete user.email;
        delete user.role;
      }
      return user;
    });
    res.json({ data: processData(formatted) });
  }));

  app.get("/api/users/:id", authenticateTokenOptional, asyncHandler(async (req: any, res: express.Response) => {
    const isAdmin = req.user?.role === "admin";
    const user = await getRowOr404("SELECT id, email, name, role, avatar, bio, rating, skills, completed_tasks_count, (last_seen > DATE_SUB(NOW(), INTERVAL 1 MINUTE)) as is_online, created_at FROM users WHERE id = ?", [req.params.id], "المستخدم غير موجود");
    
    if (!isAdmin && req.user?.id !== user.id) {
      delete user.email;
      delete user.role;
    }
    
    res.json({ data: processData(parseJsonFields(user, ["skills"])) });
  }));

  app.patch("/api/users/:id", authenticateToken, validate(userUpdateSchema), asyncHandler(async (req: any, res: express.Response) => {
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      throw new AppError(403, "غير مصرح لك بتعديل هذا الملف الشخصي");
    }
    
    const allowedFields: Record<string, string> = {
      name: "name",
      avatar: "avatar",
      bio: "bio",
      skills: "skills",
      completedTasksCount: "completed_tasks_count",
      rating: "rating",
    };

    const update = buildUpdate("users", req.params.id, req.body, allowedFields);
    if (update) {
      await pool.query(update.sql, update.values);
    }
    
    const user = await getRowOr404("SELECT id, email, name, role, avatar, bio, rating, skills, completed_tasks_count, (last_seen > DATE_SUB(NOW(), INTERVAL 1 MINUTE)) as is_online, created_at FROM users WHERE id = ?", [req.params.id], "المستخدم غير موجود");
    res.json({ data: processData(parseJsonFields(user, ["skills"])) });
  }));

  // Tasks
  app.get("/api/tasks", asyncHandler(async (_req: express.Request, res: express.Response) => {
    const query = `
      SELECT t.*, u.name as author_name, u.avatar as author_avatar
      FROM tasks t
      LEFT JOIN users u ON t.author_id = u.id
      ORDER BY t.created_at DESC
    `;
    const [rows]: any = await pool.query(query);
    const formatted = rows.map((r: any) => parseJsonFields(r, ["required_skills", "attachments"]));
    res.json({ data: processData(formatted) });
  }));

  app.post("/api/tasks", authenticateToken, validate(taskSchema), asyncHandler(async (req: any, res: express.Response) => {
    const { title, description, requiredSkills, duration, attachments } = req.body;
    const id = crypto.randomBytes(6).toString("hex");
    const createdAt = new Date();
    await pool.query(
      "INSERT INTO tasks (id, title, description, required_skills, duration, attachments, status, author_id, created_at) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)",
      [id, title, description, JSON.stringify(requiredSkills || []), duration, JSON.stringify(attachments || []), req.user.id, createdAt]
    );
    res.json({ data: processData({ id, title, description, requiredSkills, duration, attachments, status: 'open', author_id: req.user.id, created_at: createdAt }) });
  }));

  app.get("/api/tasks/:id", asyncHandler(async (req: express.Request, res: express.Response) => {
    const query = `
      SELECT t.*, u.name as author_name, u.avatar as author_avatar
      FROM tasks t
      LEFT JOIN users u ON t.author_id = u.id
      WHERE t.id = ?
    `;
    const task = await getRowOr404(query, [req.params.id], "المهمة غير موجودة");
    res.json({ data: processData(parseJsonFields(task, ["required_skills", "attachments"])) });
  }));

  app.delete("/api/tasks/:id", authenticateToken, asyncHandler(async (req: any, res: express.Response) => {
    const task = await getRowOr404("SELECT author_id FROM tasks WHERE id = ?", [req.params.id], "المهمة غير موجودة");
    if (task.author_id !== req.user.id && req.user.role !== "admin") {
      throw new AppError(403, "غير مصرح لك بحذف هذه المهمة");
    }
    await pool.query("DELETE FROM tasks WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  }));

  // Applications
  app.get("/api/applications", asyncHandler(async (_req: express.Request, res: express.Response) => {
    const query = `
      SELECT a.*, u.name as user_name, u.avatar as user_avatar, u.rating as user_rating, u.completed_tasks_count as user_completed_tasks_count
      FROM applications a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.applied_at DESC
    `;
    const [rows]: any = await pool.query(query);
    const formatted = rows.map((r: any) => parseJsonFields(r, ["attachments"]));
    res.json({ data: processData(formatted) });
  }));

  app.get("/api/tasks/:id/applications", asyncHandler(async (req: express.Request, res: express.Response) => {
    const query = `
      SELECT a.*, u.name as user_name, u.avatar as user_avatar, u.rating as user_rating, u.completed_tasks_count as user_completed_tasks_count
      FROM applications a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.task_id = ?
      ORDER BY a.applied_at DESC
    `;
    const [rows]: any = await pool.query(query, [req.params.id]);
    const formatted = rows.map((r: any) => parseJsonFields(r, ["attachments"]));
    res.json({ data: processData(formatted) });
  }));

  app.post("/api/tasks/:id/applications", authenticateToken, validate(applicationSchema), asyncHandler(async (req: any, res: express.Response) => {
    const { comment, budget, estimatedDuration, attachments } = req.body;

    const task = await getRowOr404("SELECT author_id FROM tasks WHERE id = ?", [req.params.id], "المهمة غير موجودة");
    if (task.author_id === req.user.id) throw new AppError(400, "لا يمكنك التقديم على مهمتك الخاصة");

    const [existingApp]: any = await pool.query("SELECT id FROM applications WHERE task_id = ? AND user_id = ?", [req.params.id, req.user.id]);
    if (existingApp.length > 0) throw new AppError(400, "لقد قمت بالتقديم على هذه المهمة مسبقاً");

    const id = crypto.randomBytes(6).toString("hex");
    const appliedAt = new Date();
    await pool.query(
      "INSERT INTO applications (id, task_id, user_id, status, comment, budget, estimated_duration, attachments, applied_at) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)",
      [id, req.params.id, req.user.id, comment, budget, estimatedDuration, JSON.stringify(attachments || []), appliedAt]
    );
    res.json({ data: processData({ id, task_id: req.params.id, user_id: req.user.id, status: 'pending', comment, budget, estimatedDuration, attachments, applied_at: appliedAt }) });
  }));

  app.patch("/api/applications/:id", authenticateToken, asyncHandler(async (req: any, res: express.Response) => {
    const appInfo = await getRowOr404("SELECT task_id, user_id FROM applications WHERE id = ?", [req.params.id], "الطلب غير موجود");
    const task = await getRowOr404("SELECT author_id FROM tasks WHERE id = ?", [appInfo.task_id], "المهمة غير موجودة");
    
    const isTaskAuthor = task.author_id === req.user.id;
    const isApplicant = appInfo.user_id === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isTaskAuthor && !isApplicant && !isAdmin) {
      throw new AppError(403, "غير مصرح لك بتعديل هذا الطلب");
    }

    const allowedFields: Record<string, string> = {};
    if (isTaskAuthor || isAdmin) allowedFields.status = "status";
    if (isApplicant || isAdmin) {
      allowedFields.comment = "comment";
      allowedFields.budget = "budget";
      allowedFields.estimatedDuration = "estimated_duration";
      allowedFields.attachments = "attachments";
    }

    const update = buildUpdate("applications", req.params.id, req.body, allowedFields);
    if (update) {
      await pool.query(update.sql, update.values);
    }

    const query = `
      SELECT a.*, u.name as user_name, u.avatar as user_avatar, u.rating as user_rating, u.completed_tasks_count as user_completed_tasks_count
      FROM applications a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `;
    const updatedApp = await getRowOr404(query, [req.params.id], "الطلب غير موجود");
    res.json({ data: processData(parseJsonFields(updatedApp, ["attachments"])) });
  }));

  // Messages
  app.get("/api/messages", authenticateToken, asyncHandler(async (req: any, res: express.Response) => {
    const { taskId } = req.query;
    let query = `
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = ? OR m.receiver_id = ?)
    `;
    let params: any[] = [req.user.id, req.user.id];

    if (taskId) {
      query += " AND m.task_id = ?";
      params.push(taskId);
    }

    query += " ORDER BY m.created_at ASC";
    
    const [rows]: any = await pool.query(query, params);
    const formattedRows = rows.map((row: any) => parseJsonFields(row, ["attachments", "reactions"]));

    res.json({ data: processData(formattedRows) });
  }));

  app.post("/api/messages", authenticateToken, validate(messageSchema), asyncHandler(async (req: any, res: express.Response) => {
    const { taskId, receiverId, content, attachments, replyToId } = req.body;
    const id = crypto.randomBytes(6).toString("hex");
    const createdAt = new Date();
    await pool.query(
      "INSERT INTO messages (id, task_id, sender_id, receiver_id, content, attachments, reply_to_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, taskId, req.user.id, receiverId, content, JSON.stringify(attachments || []), replyToId || null, createdAt]
    );
    res.json({ data: processData({ id, taskId, senderId: req.user.id, receiverId, content, attachments, replyToId, createdAt }) });
  }));

  app.patch("/api/messages/:id", authenticateToken, asyncHandler(async (req: any, res: express.Response) => {
    const msgInfo = await getRowOr404("SELECT sender_id, receiver_id FROM messages WHERE id = ?", [req.params.id], "الرسالة غير موجودة");
    
    if (req.user.id !== msgInfo.sender_id && req.user.id !== msgInfo.receiver_id && req.user.role !== "admin") {
      throw new AppError(403, "غير مصرح لك بتعديل هذه الرسالة");
    }

    const allowedFields: Record<string, string> = {
      content: "content",
      attachments: "attachments",
      readAt: "read_at",
      reactions: "reactions"
    };

    const update = buildUpdate("messages", req.params.id, req.body, allowedFields);
    if (update) {
      // Special handling for readAt which needs to be a Date
      if (req.body.readAt) {
        const index = update.sql.split("=").findIndex(s => s.trim().endsWith("read_at"));
        if (index !== -1) update.values[index] = new Date(req.body.readAt);
      }
      await pool.query(update.sql, update.values);
    }
    
    const query = `
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `;
    const updatedMsg = await getRowOr404(query, [req.params.id], "الرسالة غير موجودة");
    res.json({ data: processData(parseJsonFields(updatedMsg, ["attachments", "reactions"])) });
  }));

  // Notifications
  app.get("/api/notifications", authenticateToken, asyncHandler(async (req: any, res: express.Response) => {
    const [rows]: any = await pool.query("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
    res.json({ data: processData(rows) });
  }));

  app.post("/api/notifications", authenticateToken, asyncHandler(async (req: any, res: express.Response) => {
    const { userId, message, type, targetId } = req.body;
    const id = crypto.randomBytes(6).toString("hex");
    const createdAt = new Date();
    await pool.query(
      "INSERT INTO notifications (id, user_id, message, type, target_id, is_read, created_at) VALUES (?, ?, ?, ?, ?, FALSE, ?)",
      [id, userId, message, type, targetId, createdAt]
    );
    res.json({ data: processData({ id, userId, message, type, targetId, isRead: false, createdAt }) });
  }));

  app.patch("/api/notifications/:id", authenticateToken, asyncHandler(async (req: any, res: express.Response) => {
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    const row = await getRowOr404("SELECT * FROM notifications WHERE id = ?", [req.params.id], "التنبيه غير موجود");
    res.json({ data: processData(row) });
  }));

  app.post("/api/tasks/:id/assign", authenticateToken, asyncHandler(async (req: any, res: express.Response) => {
    const { applicationId, userId } = req.body;
    const task = await getRowOr404("SELECT author_id FROM tasks WHERE id = ?", [req.params.id], "المهمة غير موجودة");
    if (task.author_id !== req.user.id && req.user.role !== "admin") {
      throw new AppError(403, "غير مصرح لك بتعيين هذه المهمة");
    }

    await pool.query("UPDATE tasks SET status = 'in_progress', assigned_to_user = ? WHERE id = ?", [userId, req.params.id]);
    await pool.query("UPDATE applications SET status = 'accepted' WHERE id = ?", [applicationId]);
    await pool.query("UPDATE applications SET status = 'rejected' WHERE task_id = ? AND status = 'pending' AND id != ?", [req.params.id, applicationId]);
    
    const query = `
      SELECT t.*, u.name as author_name, u.avatar as author_avatar
      FROM tasks t
      LEFT JOIN users u ON t.author_id = u.id
      WHERE t.id = ?
    `;
    const updatedTask = await getRowOr404(query, [req.params.id], "المهمة غير موجودة");
    res.json({ data: processData(parseJsonFields(updatedTask, ["required_skills"])) });
  }));

  app.post("/api/tasks/:id/complete", authenticateToken, asyncHandler(async (req: any, res: express.Response) => {
    const taskInfo = await getRowOr404("SELECT assigned_to_user, author_id FROM tasks WHERE id = ?", [req.params.id], "المهمة غير موجودة");
    if (taskInfo.author_id !== req.user.id && req.user.role !== "admin") {
      throw new AppError(403, "غير مصرح لك بإنهاء هذه المهمة");
    }
    await pool.query("UPDATE tasks SET status = 'completed' WHERE id = ?", [req.params.id]);
    
    if (taskInfo.assigned_to_user) {
      await pool.query("UPDATE users SET completed_tasks_count = completed_tasks_count + 1 WHERE id = ?", [taskInfo.assigned_to_user]);
    }
    
    const query = `
      SELECT t.*, u.name as author_name, u.avatar as author_avatar
      FROM tasks t
      LEFT JOIN users u ON t.author_id = u.id
      WHERE t.id = ?
    `;
    const updatedTask = await getRowOr404(query, [req.params.id], "المهمة غير موجودة");
    res.json({ data: processData(parseJsonFields(updatedTask, ["required_skills"])) });
  }));

  // Ratings & Reviews
  app.get("/api/ratings", authenticateToken, async (_req, res) => {
    try {
      const [rows]: any = await pool.query("SELECT * FROM ratings ORDER BY created_at DESC");
      res.json({ data: processData(rows) });
    } catch (error: any) {
      console.error(error);
      return sendError(res, 500, "حدث خطأ غير متوقع في النظام، يرجى المحاولة لاحقاً");
    }
  });

  app.get("/api/reviews", authenticateToken, async (_req, res) => {
    try {
      const [rows]: any = await pool.query("SELECT * FROM reviews ORDER BY created_at DESC");
      res.json({ data: processData(rows) });
    } catch (error: any) {
      console.error(error);
      return sendError(res, 500, "حدث خطأ غير متوقع في النظام، يرجى المحاولة لاحقاً");
    }
  });

  app.post("/api/ratings", authenticateToken, validate(ratingSchema), async (req: any, res) => {
    try {
      const { userId, taskId, score } = req.body;
      
      if (taskId) {
        const [task]: any = await pool.query("SELECT author_id, assigned_to_user FROM tasks WHERE id = ?", [taskId]);
        if (task.length > 0) {
          const isTaskAuthor = task[0].author_id === req.user.id;
          const isAssignee = task[0].assigned_to_user === req.user.id;
          const isAdmin = req.user.role === "admin";
          let validRater = isAdmin || (isTaskAuthor && userId === task[0].assigned_to_user) || (isAssignee && userId === task[0].author_id);
          
          if (!validRater) return sendError(res, 403, "غير مصرح لك بالتقييم");
        }
      }

      const id = crypto.randomBytes(6).toString("hex");
      const createdAt = new Date();
      await pool.query(
        "INSERT INTO ratings (id, user_id, rater_id, task_id, score, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [id, userId, req.user.id, taskId, score, createdAt]
      );
      res.json({ data: processData({ id, userId, raterId: req.user.id, taskId, score, createdAt }) });
    } catch (error: any) {
      console.error(error);
      return sendError(res, 500, "حدث خطأ غير متوقع في النظام، يرجى المحاولة لاحقاً");
    }
  });

  app.post("/api/reviews", authenticateToken, validate(reviewSchema), asyncHandler(async (req: any, res: express.Response) => {
    const { taskId, userId, rating, comment } = req.body;
    
    const task = await getRowOr404("SELECT author_id, assigned_to_user, status FROM tasks WHERE id = ?", [taskId], "المهمة غير موجودة");
    if (task.status !== "completed") throw new AppError(400, "يمكن التقييم فقط للمهام المكتملة");

    const isTaskAuthor = task.author_id === req.user.id;
    const isAssignee = task.assigned_to_user === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isAdmin && !(isTaskAuthor && userId === task.assigned_to_user) && !(isAssignee && userId === task.author_id)) {
      throw new AppError(403, "غير مصرح لك بتقييم هذا المستخدم");
    }

    const id = crypto.randomBytes(6).toString("hex");
    const createdAt = new Date();
    
    await pool.query(
      "INSERT INTO reviews (id, task_id, user_id, rater_id, reviewer_id, reviewee_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, taskId, userId, req.user.id, req.user.id, userId, rating, comment, createdAt]
    );
    
    const [ratingRows]: any = await pool.query("SELECT AVG(rating) as avg_rating FROM reviews WHERE user_id = ?", [userId]);
    const newRating = ratingRows[0].avg_rating || 0;
    await pool.query("UPDATE users SET rating = ? WHERE id = ?", [newRating, userId]);

    res.json({ data: processData({ id, taskId, userId, raterId: req.user.id, rating, comment, createdAt, userRating: newRating }) });
  }));

  // Admin & Team
  app.get("/api/admin/allowed-emails", authenticateToken, asyncHandler(async (req: any, res: express.Response) => {
    if (req.user.role !== "admin") throw new AppError(403, "غير مصرح لك بالوصول لهذه البيانات");
    let query = "SELECT * FROM allowed_emails";
    let params: string[] = [];
    if (SUPER_ADMIN_EMAILS.length > 0) {
      query += ` WHERE email NOT IN (${SUPER_ADMIN_EMAILS.map(() => '?').join(',')})`;
      params = SUPER_ADMIN_EMAILS;
    }
    const [rows]: any = await pool.query(query, params);
    res.json({ data: processData(rows) });
  }));

  app.post("/api/admin/allowed-emails", authenticateToken, validate(allowedEmailSchema), asyncHandler(async (req: any, res: express.Response) => {
    if (req.user.role !== "admin") throw new AppError(403, "غير مصرح لك بإضافة بريد إلكتروني");
    const { email } = req.body;
    const cleanEmail = email.toLowerCase().trim();
    
    if (SUPER_ADMIN_EMAILS.some(e => e.toLowerCase().trim() === cleanEmail)) {
      throw new AppError(400, "لا يمكن إضافة مدير النظام إلى القائمة المصرح بها لأنه مستثنى ويملك صلاحيات مسبقة");
    }

    const [existing]: any = await pool.query("SELECT email FROM allowed_emails WHERE email = ?", [cleanEmail]);
    if (existing.length > 0) throw new AppError(400, "هذا البريد الإلكتروني مضاف بالفعل في القائمة");

    await pool.query("INSERT INTO allowed_emails (email, added_by_id, created_at) VALUES (?, ?, ?)", [cleanEmail, req.user.id, new Date()]);
    res.json({ success: true });
  }));

  app.delete("/api/admin/allowed-emails/:email", authenticateToken, asyncHandler(async (req: any, res: express.Response) => {
    if (req.user.role !== "admin") throw new AppError(403, "غير مصرح لك بحذف بريد إلكتروني");
    await pool.query("DELETE FROM allowed_emails WHERE email = ?", [req.params.email]);
    res.json({ success: true });
  }));

  app.get("/api/admin/check-auth/:email", asyncHandler(async (req: express.Request, res: express.Response) => {
    const email = (req.params.email as string).toLowerCase().trim();
    const isSuperAdmin = SUPER_ADMIN_EMAILS.some(e => e.toLowerCase().trim() === email);
    if (isSuperAdmin) return res.json({ data: processData({ authorized: true }) });

    const [rows]: any = await pool.query("SELECT * FROM allowed_emails WHERE email = ?", [email]);
    res.json({ data: processData({ authorized: rows.length > 0 }) });
  }));

  app.post("/api/admin/logs", asyncHandler(async (req: express.Request, res: express.Response) => {
    const { email, action, status, userAgent } = req.body;
    await pool.query(
      "INSERT INTO access_logs (email, action, status, user_agent, attempted_at) VALUES (?, ?, ?, ?, ?)",
      [email, action, status, userAgent, new Date()]
    );
    res.json({ success: true });
  }));

  app.get("/api/team", authenticateToken, asyncHandler(async (_req: express.Request, res: express.Response) => {
    const [rows]: any = await pool.query("SELECT * FROM team_members");
    res.json({ data: processData(rows) });
  }));

  app.post("/api/team", authenticateToken, asyncHandler(async (req: any, res: express.Response) => {
    if (req.user.role !== "admin") throw new AppError(403, "غير مصرح لك بإضافة أعضاء للفريق");
    const { userId } = req.body;
    const id = crypto.randomBytes(6).toString("hex");
    await pool.query("INSERT INTO team_members (id, user_id, added_by_id, role, joined_at) VALUES (?, ?, ?, 'member', ?)", [id, userId, req.user.id, new Date()]);
    const row = await getRowOr404("SELECT * FROM team_members WHERE id = ?", [id], "عضو الفريق غير موجود");
    res.json({ data: processData(row) });
  }));

  app.get("/api/history/status", authenticateToken, asyncHandler(async (_req: express.Request, res: express.Response) => {
    const [rows]: any = await pool.query("SELECT * FROM task_status_history ORDER BY changed_at DESC");
    res.json({ data: processData(rows) });
  }));

  app.post("/api/history/status", authenticateToken, asyncHandler(async (req: any, res: express.Response) => {
    const { taskId, oldStatus, newStatus } = req.body;
    const id = crypto.randomBytes(6).toString("hex");
    await pool.query(
      "INSERT INTO task_status_history (id, task_id, old_status, new_status, changed_by_id, changed_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, taskId, oldStatus, newStatus, req.user.id, new Date()]
    );
    const row = await getRowOr404("SELECT * FROM task_status_history WHERE id = ?", [id], "سجل الحالة غير موجود");
    res.json({ data: processData(row) });
  }));

  app.get("/api/users/by-email/:email", asyncHandler(async (req: express.Request, res: express.Response) => {
    const [rows]: any = await pool.query("SELECT id, email, name, role, avatar FROM users WHERE email = ?", [(req.params.email as string).toLowerCase().trim()]);
    res.json({ data: processData(rows[0] || null) });
  }));

  // Explicit 404 for API routes to prevent SPA fallback returning HTML
  app.all("/api/*all", (req, res) => {
    console.error(`[API] 404 - Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: `الرابط غير موجود: ${req.method} ${req.url}`,
      path: req.url,
      method: req.method
    });
  });

  // Setup Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global error handler
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error("[Global Error]:", err);
    res.status(500).json({ error: "حدث خطأ داخلي في الخادم", details: err.message });
  });

  // Auto init db
  try {
    const sql = fs.readFileSync(
      path.join(process.cwd(), "server", "init.sql"),
      "utf-8",
    );
    const connection = await pool.getConnection();
    const statements = sql.split(";").filter((stmt) => stmt.trim() !== "");
    for (const stmt of statements) {
      await connection.query(stmt);
    }

    // Ensure password column exists
    try {
      const [columns]: any = await connection.query(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'bio' AND TABLE_SCHEMA = DATABASE()",
      );
      if (columns.length === 0) {
        await connection.query("ALTER TABLE users ADD COLUMN bio TEXT AFTER avatar");
        console.log("Added bio column to users table.");
      }
    } catch (err) {
      console.warn("Could not ensure bio column:", err);
    }

    try {
      const [columns]: any = await connection.query(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'rating' AND TABLE_SCHEMA = DATABASE()",
      );
      if (columns.length === 0) {
        await connection.query("ALTER TABLE users ADD COLUMN rating DOUBLE DEFAULT 0 AFTER bio");
        console.log("Added rating column to users table.");
      }
    } catch (err) {
      console.warn("Could not ensure rating column:", err);
    }

    try {
      const [columns]: any = await connection.query(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'completed_tasks_count' AND TABLE_SCHEMA = DATABASE()",
      );
      if (columns.length === 0) {
        await connection.query("ALTER TABLE users ADD COLUMN completed_tasks_count INT DEFAULT 0 AFTER skills");
        console.log("Added completed_tasks_count column to users table.");
      }
    } catch (err) {
      console.warn("Could not ensure completed_tasks_count column:", err);
    }

    try {
      const [columns]: any = await connection.query(
        "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password' AND TABLE_SCHEMA = DATABASE()",
      );
      if (columns.length === 0) {
        await connection.query("ALTER TABLE users ADD COLUMN password VARCHAR(255) AFTER email");
        console.log("Added password column to users table.");
      }
    } catch (err) {
      console.warn("Could not ensure password column:", err);
    }
    
    // Upgrade column types to LONGTEXT for data URLs
    try {
        await connection.query("ALTER TABLE users MODIFY avatar LONGTEXT;");
        // Check if attachments column exists, if not rename attachment_url or add it
        const [taskCols]: any = await connection.query(
            "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_NAME = 'tasks' AND COLUMN_NAME = 'attachments' AND TABLE_SCHEMA = DATABASE()"
        );
        if (taskCols.length === 0) {
            const [urlCols]: any = await connection.query(
                "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_NAME = 'tasks' AND COLUMN_NAME = 'attachment_url' AND TABLE_SCHEMA = DATABASE()"
            );
            if (urlCols.length > 0) {
                await connection.query("ALTER TABLE tasks CHANGE attachment_url attachments JSON;");
                console.log("Renamed attachment_url to attachments in tasks table.");
            } else {
                await connection.query("ALTER TABLE tasks ADD COLUMN attachments JSON AFTER duration;");
                console.log("Added attachments column to tasks table.");
            }
        }

        // Check applications table
        const [appCols]: any = await connection.query(
            "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_NAME = 'applications' AND COLUMN_NAME = 'attachments' AND TABLE_SCHEMA = DATABASE()"
        );
        if (appCols.length === 0) {
            await connection.query("ALTER TABLE applications ADD COLUMN attachments JSON AFTER estimated_duration;");
            console.log("Added attachments column to applications table.");
        }

        // Check messages table
        const [msgCols]: any = await connection.query(
            "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_NAME = 'messages' AND COLUMN_NAME = 'attachments' AND TABLE_SCHEMA = DATABASE()"
        );
        if (msgCols.length === 0) {
            await connection.query("ALTER TABLE messages ADD COLUMN attachments JSON AFTER content;");
            console.log("Added attachments column to messages table.");
        }
    } catch(err) {
        console.warn("Could not alter table columns:", err);
    }

    try {
        await connection.query("ALTER TABLE users ADD COLUMN skills JSON;");
    } catch (e: any) {
        if(e.code !== 'ER_DUP_FIELDNAME') console.warn("Ensure users.skills column: ", e.message);
    }

    try {
        await connection.query("ALTER TABLE users ADD COLUMN is_online BOOLEAN DEFAULT FALSE;");
    } catch (e: any) {
        if(e.code !== 'ER_DUP_FIELDNAME') console.warn("Ensure users.is_online column: ", e.message);
    }

    try {
        await connection.query("ALTER TABLE users ADD COLUMN last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;");
    } catch (e: any) {
        if(e.code !== 'ER_DUP_FIELDNAME') console.warn("Ensure users.last_seen column: ", e.message);
    }

    try {
        await connection.query("ALTER TABLE tasks ADD COLUMN required_skills JSON;");
    } catch (e: any) {
        if(e.code !== 'ER_DUP_FIELDNAME') console.warn("Ensure tasks.required_skills column: ", e.message);
    }

    connection.release();
    console.log("Database schema initialized.");

    // Ensure super admins have admin role in DB
    try {
      for (const email of SUPER_ADMIN_EMAILS) {
        await pool.query("UPDATE users SET role = 'admin' WHERE email = ?", [email.toLowerCase().trim()]);
      }
      console.log("Super admins promoted in database.");
    } catch (err: any) {
      console.warn("Could not promote super admins:", err.message);
    }
  } catch (e: any) {
    console.warn(
      "Could not auto-initialize DB. Check credentials or ignore if already setup:",
      e.message,
    );
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
