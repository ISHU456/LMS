import Groq from "groq-sdk";
import User from "../models/User.js";
import Chat from "../models/Chat.js";
import AiCreditLog from "../models/AiCreditLog.js";
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import mammoth from "mammoth";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export const chatbotResponse = async (req, res) => {
  try {
    const { message, history, subject, sessionId } = req.body;
    const userId = req.user._id;

    const userObj = await User.findById(userId);
    if (!userObj) return res.status(404).json({ response: "User not found." });

    if (userObj.credits <= 0) {
      return res.status(403).json({ 
        response: "Neural Link Credit Limit Reached (10/10 Used). Please request admin authorization.",
        creditsExhausted: true 
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ 
        response: "Assistant offline (Groq API key not configured). Please refer to textbook." 
      });
    }

    // Convert history for Groq/OpenAI format
    const groqHistory = (history || []).slice(-6).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    const systemPrompt = `You are an intelligent academic assistant chatbot for a college Learning Management System (LMS). 
      Your role is to help students with subject-related queries in a clear, accurate, and structured manner.
      Current User: ${userObj.name}, Role: ${userObj.role}. Current Subject: ${subject || "General Academic"}.
      Exam Tips: Always include a section with "Topper's Tip" for scoring.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...groqHistory,
        { role: "user", content: message }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 2048,
    });

    const botResponseText = chatCompletion.choices[0]?.message?.content || "I couldn't process your request right now.";

    // Update Credits
    userObj.credits -= 1;
    await userObj.save();

    // Save to History (Multi-Session Logic)
    let chatSession = await Chat.findOne({ user: userId, sessionId: sessionId || 'default' });
    if (!chatSession) {
      chatSession = new Chat({
        user: userId,
        sessionId: sessionId || 'default',
        title: message.substring(0, 30) + "...",
        messages: []
      });
    }
    
    // Check if user message is already there (to avoid duplication if frontend doesn't sync)
    chatSession.messages.push({ role: 'user', content: message });
    chatSession.messages.push({ role: 'assistant', content: botResponseText });
    chatSession.lastActive = Date.now();
    await chatSession.save();

    // Log Usage
    await AiCreditLog.create({
      user: userId,
      action: 'ask',
      cost: 1,
      remainingCredits: userObj.credits,
      contentSummary: message.substring(0, 50)
    });

    res.json({ 
      response: botResponseText, 
      remainingCredits: userObj.credits 
    });
  } catch (error) {
    console.error("Groq API Error:", error);
    res.status(500).json({ 
      response: "Assistant encountered an error (Please try again later)." 
    });
  }
};

export const getUserChatHistory = async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user._id }).sort({ lastActive: -1 }).limit(10);
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch logs." });
  }
};

export const requestAiCredits = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.aiCreditsRequested = true;
    await user.save();
    res.json({ message: "Credit authorization request sent to Admin." });
  } catch (err) {
    res.status(500).json({ message: "Failed to send request." });
  }
};

export const getAiCreditRequests = async (req, res) => {
  try {
    const users = await User.find({ aiCreditsRequested: true }).select('name email credits role');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch requests." });
  }
};

export const grantAiCredits = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.credits = 10;
    user.aiCreditsRequested = false;
    await user.save();
    res.json({ message: "AI Credits granted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to grant credits." });
  }
};

export const grantAiCreditsByEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    user.credits = 10;
    user.aiCreditsRequested = false;
    await user.save();
    res.json({ message: "Credits granted success." });
  } catch (err) {
    res.status(500).json({ message: "Failed." });
  }
};

export const updateAiCredits = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body; // e.g., +5 or -2
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.credits = Math.max(0, user.credits + parseInt(amount));
    user.aiCreditsRequested = false; // Reset request flag on any manual adjustment
    await user.save();
    res.json({ message: "Credits synchronized.", currentCredits: user.credits });
  } catch (err) {
    res.status(500).json({ message: "Protocol failed." });
  }
};

export const deleteChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    await Chat.findOneAndDelete({ sessionId });
    res.json({ message: "Session track deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to terminate session." });
  }
};
export const generateQuiz = async (req, res) => {
  try {
    const { topic, count = 5 } = req.body;
    if (!topic) return res.status(400).json({ message: "Topic is required for neural generation." });

    const systemPrompt = `You are an expert academic examiner. 
      Generate a high-quality quiz with exactly ${count} multiple-choice questions for the topic: "${topic}".
      The questions should be challenging and follow academic standards.
      Output MUST be a valid JSON array of objects with this structure:
      [
        {
          "question": "The question text",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": 0
        }
      ]
      "correctAnswer" must be the index (0-3) of the correct option.
      ONLY RETURN THE JSON ARRAY. NO MARKDOWN, NO EXPLANATION.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Protocol Request: Generate ${count} nodes for "${topic}"` }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.1, // Even lower for maximum precision
      max_tokens: 3000,
    });

    const botResponseText = chatCompletion.choices[0]?.message?.content || "[]";
    console.log("[AssignmentController] Raw AI Protocol Node Response:", botResponseText);
    
    // Clean markdown if present
    const cleaned = botResponseText.replace(/```json\n|```json|```\n|```/g, "").trim();
    
    try {
      const quizQuestions = JSON.parse(cleaned);
      res.json(quizQuestions);
    } catch (parseError) {
      console.error("JSON Parse Error on AI output:", cleaned);
      res.status(500).json({ message: "Neural output format mismatch." });
    }
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    res.status(500).json({ message: "Neural Generation Engine Offline." });
  }
};

export const analyzeFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ response: "No file received for analysis." });

    const userId = req.user._id;
    const userObj = await User.findById(userId);
    if (userObj.credits < 2) return res.status(403).json({ response: "Insufficient Credits for File Analysis (Cost: 2 credits)." });

    let extractedText = "";
    const extension = file.originalname.split('.').pop().toLowerCase();

    if (extension === 'pdf') {
      const data = await pdf(file.buffer);
      extractedText = data.text;
    } else if (extension === 'docx') {
      const data = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = data.value;
    } else {
      extractedText = file.buffer.toString('utf8');
    }

    if (!extractedText.trim()) return res.status(400).json({ response: "Failed to extract text from the file." });

    const systemPrompt = `You are a specialized document analyzer. Analyze the provided text from the file "${file.originalname}" shared by ${userObj.name} (${userObj.role}). Summarize key points and explain difficult concepts.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Contextual Core Document Input:\n\n${extractedText.substring(0, 10000)}` }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
    });

    const botResponseText = chatCompletion.choices[0]?.message?.content || "Document scan complete, no derivation generated.";

    userObj.credits -= 2; // Higher cost for file analysis
    await userObj.save();

    // Log Usage
    await AiCreditLog.create({
      user: userId,
      action: 'analyze',
      cost: 2,
      remainingCredits: userObj.credits,
      contentSummary: `File: ${file.originalname}`
    });

    // Auto-save session
    const { sessionId } = req.body;
    let chatSession = await Chat.findOne({ user: userId, sessionId: sessionId || 'default' });
    if (!chatSession) {
      chatSession = new Chat({
        user: userId,
        sessionId: sessionId || 'default',
        title: `Analysis: ${file.originalname}`,
        messages: []
      });
    }
    
    chatSession.messages.push({ role: 'user', content: `[Uploaded File: ${file.originalname}]` });
    chatSession.messages.push({ role: 'assistant', content: botResponseText });
    chatSession.lastActive = Date.now();
    await chatSession.save();

    res.json({ 
      response: botResponseText, 
      remainingCredits: userObj.credits 
    });
  } catch (error) {
    console.error("File Analysis Error:", error);
    res.status(500).json({ response: "Neural Link fail during file processing." });
  }
};

export const getAiUsageSummary = async (req, res) => {
  try {
    const usage = await User.aggregate([
      { $lookup: {
          from: 'aicreditlogs',
          localField: '_id',
          foreignField: 'user',
          as: 'logs'
        }
      },
      { $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          credits: 1,
          totalUsage: { $size: "$logs" },
          lastUsage: { $max: "$logs.timestamp" },
          lastAction: { $arrayElemAt: ["$logs.action", -1] }
        }
      },
      { $sort: { totalUsage: -1, name: 1 } }
    ]);
    res.json(usage);
  } catch (err) {
    console.error('Audit Failure:', err);
    res.status(500).json({ message: "Failed to audit neural core." });
  }
};

export const getUserAiAudit = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('name role email credits');
    if (!user) return res.status(404).json({ message: "Subject not found." });

    const logs = await AiCreditLog.find({ user: userId }).sort({ timestamp: -1 });
    const chats = await Chat.find({ user: userId }).sort({ lastActive: -1 });

    res.json({ user, logs, chats });
  } catch (err) {
    res.status(500).json({ message: "Investigation failed." });
  }
};
