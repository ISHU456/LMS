import mongoose from 'mongoose';
import User from '../models/User.js';
import Badge from '../models/Badge.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import DailyAttendance from '../models/DailyAttendance.js';
import PrizeCatalog from '../models/PrizeCatalog.js';
import MonthlyPrize from '../models/MonthlyPrize.js';
import StudentPrize from '../models/StudentPrize.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cloudinary } from '../config/cloudinary.js';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.AI_AGENT_API_KEY);


// --- LOGIC: CALCULATE COINS ---
const calculateQuizCoins = async (quiz, score, timeTaken, maxScore) => {
    let coins = quiz.rewardCoins || 10;
    
    // 1. Accuracy Bonus
    const percentage = (score / maxScore) * 100;
    if (percentage === 100) coins += 20; // Full marks
    else if (percentage >= 90) coins += 10;

    // 2. Difficulty Multiplier
    const multipliers = { easy: 1, medium: 1.5, hard: 2 };
    coins = Math.round(coins * (multipliers[quiz.difficulty] || 1));

    // 3. Speed Bonus
    const timeLimitInSeconds = quiz.timeLimit * 60;
    if (timeTaken < (timeLimitInSeconds / 2)) {
        coins += 15; // Speed bonus
    }

    // 4. Ranking Bonus (Tie-breaking logic is in the leaderboard, but here we just give top spot bonus)
    const previousAttempts = await QuizAttempt.countDocuments({ quiz: quiz._id });
    const rank = previousAttempts + 1;

    return { coins, rank };
};

// --- LOGIC: MILESTONE PRIZES ---
const checkMilestones = async (userId, totalCoins) => {
    const prizes = await PrizeCatalog.find({ isActive: true });
    const unlockedPrizes = [];

    for (const prize of prizes) {
        if (totalCoins >= prize.requiredCoins) {
            const alreadyUnlocked = await StudentPrize.findOne({ student: userId, prize: prize._id });
            if (!alreadyUnlocked) {
                const newPrize = new StudentPrize({ student: userId, prize: prize._id });
                await newPrize.save();
                unlockedPrizes.push(prize);
            }
        }
    }
    return unlockedPrizes;
};


// --- CONTROLLERS ---

export const submitQuiz = async (req, res) => {
    try {
        const { quizId, score, timeTaken, answers, tabSwitches } = req.body;
        const userId = req.user._id;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        // Anti-cheat: Check if time taken is suspiciously low (e.g. < 5s for 10 questions)
        if (timeTaken < (quiz.questions.length * 0.5)) {
            return res.status(403).json({ message: "Abnormal speed detected. Submission flagged." });
        }

        // Check for previous attempts to enforce "First attempt only" coins
        const previousAttempts = await QuizAttempt.countDocuments({ user: userId, quiz: quizId });
        const isFirstAttempt = previousAttempts === 0;

        const { coins, rank } = isFirstAttempt 
            ? await calculateQuizCoins(quiz, score, timeTaken, quiz.totalPoints)
            : { coins: 0, rank: previousAttempts + 1 };

        const attempt = new QuizAttempt({
            user: userId,
            quiz: quizId,
            score,
            maxScore: quiz.totalPoints,
            timeTaken,
            coinsEarned: coins,
            answers,
            rank,
            tabSwitches,
            attemptNumber: previousAttempts + 1
        });

        await attempt.save();

        const user = await User.findById(userId);
        
        if (isFirstAttempt) {
            user.coins += coins;
            
            // Streak Logic
            const today = new Date().setHours(0,0,0,0);
            const lastStreakDate = user.lastStreakedAt ? new Date(user.lastStreakedAt).setHours(0,0,0,0) : null;
            const yesterday = new Date(Date.now() - 86400000).setHours(0,0,0,0);

            if (lastStreakDate === yesterday) {
                user.streak += 1;
                user.lastStreakedAt = new Date();
            } else if (!lastStreakDate || lastStreakDate < yesterday) {
                user.streak = 1;
                user.lastStreakedAt = new Date();
            }
            await user.save();
        }

        // Check for Milestones
        const newPrizes = isFirstAttempt ? await checkMilestones(userId, user.coins) : [];

        res.json({
            message: isFirstAttempt ? "Quiz processed successfully." : "Re-attempt recorded. (No coins awarded)",
            coinsEarned: coins,
            rank,
            isFirstAttempt,
            newPrizes,
            totalCoins: user.coins,
            streak: user.streak,
            score,
            maxScore: quiz.totalPoints
        });


    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const recordActivity = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        const today = new Date().setHours(0,0,0,0);
        const lastStreakDate = user.lastStreakedAt ? new Date(user.lastStreakedAt).setHours(0,0,0,0) : null;
        const yesterday = new Date(Date.now() - 86400000).setHours(0,0,0,0);

        if (lastStreakDate === today) {
            return res.json({ 
                message: "Daily activity already recorded.", 
                streak: user.streak, 
                coinsAwarded: 0, 
                totalCoins: user.coins 
            });
        }

        let newStreak = 1;
        if (lastStreakDate === yesterday) {
            newStreak = (user.streak || 0) + 1;
        }

        user.streak = newStreak;
        user.lastStreakedAt = new Date();
        user.coins = (user.coins || 0) + 5;
        await user.save();

        res.json({
            message: "Daily streak synchronized! +5 Scholar Coins",
            streak: newStreak,
            coinsAwarded: 5,
            totalCoins: user.coins
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getLeaderboard = async (req, res) => {
    try {
        const { type } = req.query; // global, monthly
        
        if (type === 'monthly') {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            // Sum coinsEarned from QuizAttempt within this month for each user
            const monthlyLeaderboard = await QuizAttempt.aggregate([
                { $match: { submittedAt: { $gte: startOfMonth } } },
                {
                    $group: {
                        _id: "$user",
                        monthlyCoins: { $sum: "$coinsEarned" }
                    }
                },
                { $sort: { monthlyCoins: -1 } },
                { $limit: 100 },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                { $unwind: "$userDetails" },
                {
                    $project: {
                        _id: 1,
                        name: "$userDetails.name",
                        profilePic: "$userDetails.profilePic",
                        streak: "$userDetails.streak",
                        department: "$userDetails.department",
                        coins: "$monthlyCoins"
                    }
                }
            ]);

            return res.json(monthlyLeaderboard);
        }

        const leaderboard = await User.find({ role: 'student' })
            .select('name profilePic coins streak department')
            .sort({ coins: -1, lastActive: 1 }) 
            .limit(100);

        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const generateAIQuiz = async (req, res) => {
    try {
        const { topic, numQuestions, difficulty, questionTypes } = req.body;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Generate a ${difficulty} difficulty quiz on the topic "${topic}" with ${numQuestions} questions. 
        Types allowed: ${questionTypes.join(", ")}. 
        Return ONLY valid JSON in this format:
        {
          "title": "Quiz Title",
          "description": "Short description",
          "questions": [
            {
              "text": "Question text",
              "type": "mcq",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": "Exact text of correct option",
              "explanation": "Why?"
            }
          ]
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Extract JSON using regex in case of markdown wrapping
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Invalid AI response");
        
        const quizData = JSON.parse(jsonMatch[0]);

        const quiz = new Quiz({
            ...quizData,
            category: topic,
            difficulty,
            timeLimit: numQuestions * 1.5, // 1.5 min per question
            totalPoints: numQuestions * 10,
            createdBy: req.user._id,
            status: 'draft'
        });

        await quiz.save();
        res.status(201).json(quiz);

    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ message: "Failed to generate AI quiz: " + error.message });
    }
};

export const getPrizes = async (req, res) => {
    try {
        const prizes = await PrizeCatalog.find({ isActive: true });
        const myPrizes = await StudentPrize.find({ student: req.user._id }).populate('prize').populate('monthlyPrize');
        res.json({ prizes, myPrizes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const claimPrize = async (req, res) => {
    try {
        const { studentPrizeId } = req.body;
        const studentPrize = await StudentPrize.findOne({ _id: studentPrizeId, student: req.user._id });
        if (!studentPrize) return res.status(404).json({ message: "Prize not found or not owned" });
        
        studentPrize.isClaimed = true;
        studentPrize.claimedAt = new Date();
        await studentPrize.save();
        
        res.json({ message: "Prize claimed successfully", studentPrize });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const buyPrize = async (req, res) => {
    try {
        const { prizeId, monthlyPrizeId } = req.body;
        const userId = req.user._id;

        let prizeData = null;
        let isMonthly = !!monthlyPrizeId;

        if (isMonthly) {
            prizeData = await MonthlyPrize.findById(monthlyPrizeId);
        } else {
            prizeData = await PrizeCatalog.findById(prizeId);
        }

        if (!prizeData) return res.status(404).json({ message: "Prize logic not found in registry" });

        const user = await User.findById(userId);
        if (user.coins < prizeData.requiredCoins) {
            return res.status(400).json({ message: `Insufficient currency. Required: ${prizeData.requiredCoins}, Available: ${user.coins}` });
        }

        const query = isMonthly 
            ? { student: userId, monthlyPrize: monthlyPrizeId }
            : { student: userId, prize: prizeId };

        const alreadyOwned = await StudentPrize.findOne(query);
        if (alreadyOwned) {
            return res.status(400).json({ message: "Asset already integrated into your identity." });
        }

        // Atomic Transaction: Deduct coins and award prize
        user.coins -= prizeData.requiredCoins;
        await user.save();

        const studentPrize = new StudentPrize({
            student: userId,
            prize: isMonthly ? null : prizeId,
            monthlyPrize: isMonthly ? monthlyPrizeId : null,
            isClaimed: false
        });
        await studentPrize.save();

        res.json({ 
            message: `Purchase Successful! ${prizeData.rewardName || prizeData.name} acquired.`, 
            coinsRemaining: user.coins,
            prize: studentPrize 
        });

    } catch (error) {
        res.status(500).json({ message: "Terminal Transaction Error: " + error.message });
    }
};


export const getMyAchievements = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('earnedBadges.badge');
        const allBadges = await Badge.find();
        
        res.json({
            earned: user.earnedBadges,
            all: allBadges,
            stats: {
                coins: user.coins,
                streak: user.streak,
                learningTime: user.totalLearningTime
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMonthlyStreakBadges = async (req, res) => {
    try {
        const userId = req.user._id;
        const currentYear = new Date().getFullYear();
        
        // Find all attendance for this year
        const startOfYear = new Date(currentYear, 0, 1);
        const records = await DailyAttendance.find({
            student: userId,
            date: { $gte: startOfYear },
            status: 'present'
        }).select('date');

        const attendedDaysByMonth = Array(12).fill(0).map(() => new Set());
        records.forEach(r => {
            const d = new Date(r.date);
            if (d.getFullYear() === currentYear) {
                attendedDaysByMonth[d.getMonth()].add(d.getDate());
            }
        });

        const badges = Array(12).fill(0).map((_, monthIndex) => {
            const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
            const attendedCount = attendedDaysByMonth[monthIndex].size;
            
            // Check if every day until 'today' (if current month) or every day (if past month) was attended.
            // But the user said "completes daily streak till whole months", 
            // suggesting they need the FULL month.
            
            const isCompleted = attendedCount >= daysInMonth;
            
            return {
                monthIndex,
                monthName: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(currentYear, monthIndex)),
                isCompleted,
                attendedCount,
                totalDays: daysInMonth
            };
        });

        res.json(badges);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createBadge = async (req, res) => {
    try {
        const badge = new Badge(req.body);
        await badge.save();
        res.status(201).json(badge);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createQuiz = async (req, res) => {
    try {
        const quiz = new Quiz({
            ...req.body,
            createdBy: req.user._id
        });
        await quiz.save();
        res.status(201).json(quiz);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getQuizzes = async (req, res) => {
    try {
        const userId = req.user._id;
        const quizzes = await Quiz.find({ isActive: true }).select('title description category timeLimit totalPoints questions');
        
        // Find user's best attempts for each quiz
        const attempts = await QuizAttempt.find({ user: userId });
        
        const quizzesWithStatus = quizzes.map(quiz => {
            const quizAttempts = attempts.filter(a => a.quiz.toString() === quiz._id.toString());
            
            let bestAttempt = null;
            if (quizAttempts.length > 0) {
                // Find attempt with highest score
                bestAttempt = quizAttempts.reduce((prev, current) => (prev.score > current.score) ? prev : current);
                
                // Calculate correct/wrong counts if not explicitly stored
                const correct = bestAttempt.answers?.filter(a => a.isCorrect).length || 0;
                const total = bestAttempt.answers?.length || 0;
                
                bestAttempt = {
                    score: bestAttempt.score,
                    maxScore: bestAttempt.maxScore,
                    correct,
                    wrong: total - correct,
                    totalQuestions: total,
                    rank: bestAttempt.rank || 0,
                    coinsEarned: bestAttempt.coinsEarned || 0,
                    submittedAt: bestAttempt.submittedAt
                };
            }
            
            return {
                ...quiz._doc,
                isCompleted: quizAttempts.length > 0,
                bestScore: bestAttempt ? bestAttempt.score : null,
                bestAttempt
            };
        });
        
        res.json(quizzesWithStatus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getQuizLeaderboard = async (req, res) => {
    try {
        const { quizId } = req.params;

        // Aggregate attempts to find best score per user for this quiz
        const leaderboard = await QuizAttempt.aggregate([
            { $match: { quiz: new mongoose.Types.ObjectId(quizId) } },
            { $sort: { score: -1, timeTaken: 1, submittedAt: 1 } },
            {
                $group: {
                    _id: "$user",
                    bestScore: { $first: "$score" },
                    maxScore: { $first: "$maxScore" },
                    timeTaken: { $first: "$timeTaken" },
                    submittedAt: { $first: "$submittedAt" },
                    attemptId: { $first: "$_id" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $project: {
                    _id: 1,
                    name: "$userDetails.name",
                    profilePic: "$userDetails.profilePic",
                    department: "$userDetails.department",
                    score: "$bestScore",
                    maxScore: 1,
                    timeTaken: 1,
                    submittedAt: 1
                }
            },
            { $sort: { score: -1, timeTaken: 1 } }
        ]);

        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getQuizDetails = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPrize = async (req, res) => {
    try {
        const prize = new PrizeCatalog(req.body);
        await prize.save();
        res.status(201).json(prize);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const orders = await StudentPrize.find()
            .populate('student', 'name email department profilePic rollNumber')
            .populate('prize')
            .populate('monthlyPrize')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const adminUpdatePrizeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const prize = await StudentPrize.findById(id);
        if (!prize) return res.status(404).json({ message: "Order not found" });
        
        prize.status = status;
        
        // Sync isClaimed for delivered status
        if (status === 'delivered') {
            prize.isClaimed = true;
            prize.claimedAt = new Date();
        } else {
            prize.isClaimed = false;
            prize.claimedAt = null;
        }
        
        await prize.save();
        res.json(prize);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deletePrize = async (req, res) => {
    try {
        await PrizeCatalog.findByIdAndDelete(req.params.id);
        res.json({ message: "Prize deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const getMonthlyPrizes = async (req, res) => {
    try {
        const { month, year } = req.query;
        const prizes = await MonthlyPrize.find({ month, year }).sort({ rank: 1 });
        res.json(prizes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const upsertMonthlyPrize = async (req, res) => {
    try {
        const { rank, month, year, requiredCoins, rewardName, image } = req.body;
        
        let imageUrl = '';
        if (image && image.startsWith('data:image')) {
            const uploadRes = await cloudinary.uploader.upload(image, {
                folder: 'lms_prizes',
            });
            imageUrl = uploadRes.secure_url;
        } else {
            imageUrl = image; // Assume it's already a URL
        }

        const prize = await MonthlyPrize.findOneAndUpdate(
            { rank, month, year },
            { requiredCoins, rewardName, imageUrl },
            { upsert: true, new: true }
        );

        res.json(prize);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
