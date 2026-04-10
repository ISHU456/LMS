import User from '../models/User.js';
import Badge from '../models/Badge.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';

// --- LOGIC: CALCULATE COINS ---
const calculateQuizCoins = async (quiz, score, timeTaken, maxScore) => {
    let coins = quiz.coinsReward?.base || 10;
    
    // 1. Accuracy Bonus
    const percentage = (score / maxScore) * 100;
    if (percentage === 100) coins += quiz.coinsReward?.fullMarksBonus || 20;
    else if (percentage >= 90) coins += 10;

    // 2. Speed Bonus
    if (quiz.idealTime && timeTaken <= quiz.idealTime) {
        coins = Math.round(coins * (quiz.coinsReward?.speedBonusMultiplier || 1.5));
    }

    // 3. Ranking Bonus (Logic: Fetch last attempts to determine rank)
    // For simplicity, we compare with current session attempts or global
    const previousAttempts = await QuizAttempt.countDocuments({ quiz: quiz._id });
    const rank = previousAttempts + 1;

    if (rank === 1) coins += 100;
    else if (rank === 2) coins += 75;
    else if (rank === 3) coins += 50;
    else if (rank <= 10) coins += 25;

    return { coins, rank };
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

        const { coins, rank } = await calculateQuizCoins(quiz, score, timeTaken, quiz.totalPoints);

        const attempt = new QuizAttempt({
            user: userId,
            quiz: quizId,
            score,
            maxScore: quiz.totalPoints,
            timeTaken,
            coinsEarned: coins,
            answers,
            rank,
            tabSwitches
        });

        await attempt.save();

        // Update User Profile
        const user = await User.findById(userId);
        user.coins += coins;
        
        // Streak Logic: If lastStreakedAt was yesterday, increment. If today, stay. Else reset.
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

        // CHECK FOR BADGE UNLOCKS
        const badges = await Badge.find({ 'criteria.type': 'QuizCount' });
        const userQuizCount = await QuizAttempt.countDocuments({ user: userId });
        
        const newBadges = [];
        for (const badge of badges) {
            const alreadyEarned = user.earnedBadges.some(b => b.badge.toString() === badge._id.toString());
            if (!alreadyEarned && userQuizCount >= badge.criteria.threshold) {
                user.earnedBadges.push({ badge: badge._id });
                newBadges.push(badge);
            }
        }
        if (newBadges.length > 0) await user.save();

        res.json({
            message: "Quiz processed successfully.",
            coinsEarned: coins,
            rank,
            newBadges,
            totalCoins: user.coins,
            streak: user.streak
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getLeaderboard = async (req, res) => {
    try {
        const { type, filter } = req.query; // type: daily, weekly, monthly, global | filter: CSE, IT, etc.
        
        let matchStage = {};
        const now = new Date();
        if (type === 'daily') matchStage.createdAt = { $gte: new Date(now.setHours(0,0,0,0)) };
        else if (type === 'weekly') matchStage.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
        
        const leaderboard = await User.find(matchStage)
            .select('name profilePic coins department streak')
            .sort({ coins: -1 })
            .limit(20);

        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        const quizzes = await Quiz.find({ isActive: true }).select('title description category timeLimit totalPoints');
        res.json(quizzes);
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
