import CodingContest from '../models/CodingContest.js';
import CodingProblem from '../models/CodingProblem.js';
import CodingSubmission from '../models/CodingSubmission.js';
import CodingLeaderboard from '../models/CodingLeaderboard.js';
import CodingReward from '../models/CodingReward.js';
import CodingBadge from '../models/CodingBadge.js';
import User from '../models/User.js';
import vm from 'vm';

/** 
 * ADMIN CONTROLLERS
 */
export const createContest = async (req, res) => {
  try {
    const contest = new CodingContest({
      ...req.body,
      createdBy: req.user._id
    });
    await contest.save();
    res.status(201).json(contest);
  } catch (error) {
    res.status(400).json({ message: 'Error creating contest', error: error.message });
  }
};

export const createProblem = async (req, res) => {
  try {
    const problem = new CodingProblem({
      ...req.body,
      createdBy: req.user._id
    });
    await problem.save();
    res.status(201).json(problem);
  } catch (error) {
    res.status(400).json({ message: 'Error creating problem', error: error.message });
  }
};

/**
 * STUDENT CONTROLLERS
 */
export const getActiveContests = async (req, res) => {
  try {
    const contests = await CodingContest.find({ 
      endTime: { $gte: new Date() } 
    }).populate('problems', 'title difficulty points');
    res.json(contests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contests', error: error.message });
  }
};

export const getContestDetail = async (req, res) => {
  try {
    const contest = await CodingContest.findById(req.params.id)
      .populate('problems');
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    res.json(contest);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contest detail', error: error.message });
  }
};

/**
 * CODE EVALUATION LOGIC (Basic Sandbox)
 */
const evaluateJavaScript = (code, testCases) => {
  let passedCount = 0;
  const results = [];
  
  for (const tc of testCases) {
    const sandbox = { input: tc.input, result: null, console: { log: () => {} } };
    const script = new vm.Script(`
      const solution = ${code};
      result = solution(input);
    `);
    
    try {
      const context = vm.createContext(sandbox);
      script.runInContext(context, { timeout: 1000 }); // 1s timeout
      
      const actualOutput = String(sandbox.result).trim();
      const expectedOutput = String(tc.output).trim();
      
      if (actualOutput === expectedOutput) {
        passedCount++;
        results.push({ input: tc.input, expected: tc.output, actual: actualOutput, status: 'Passed' });
      } else {
        results.push({ input: tc.input, expected: tc.output, actual: actualOutput, status: 'Failed' });
      }
    } catch (err) {
      results.push({ input: tc.input, expected: tc.output, status: 'Error', error: err.message });
    }
  }
  
  return { passedCount, total: testCases.length, results };
};

export const submitSolution = async (req, res) => {
  const { contestId, problemId, code, language } = req.body;
  const userId = req.user._id;

  try {
    const contest = await CodingContest.findById(contestId);
    if (!contest || contest.status === 'ended' || new Date() > contest.endTime) {
      return res.status(400).json({ message: 'Contest is not active' });
    }

    const problem = await CodingProblem.findById(problemId);
    if (!problem) return res.status(404).json({ message: 'Problem not found' });

    // Evaluate
    const evaluation = evaluateJavaScript(code, problem.testCases);
    const score = Math.round((evaluation.passedCount / evaluation.total) * problem.points);

    const submission = new CodingSubmission({
      userId,
      contestId,
      problemId,
      code,
      language,
      score,
      testCasesPassed: evaluation.passedCount,
      totalTestCases: evaluation.total,
      status: evaluation.passedCount === evaluation.total ? 'Accepted' : 'Partially Accepted'
    });

    await submission.save();

    // Update Leaderboard Entry
    await updateLeaderboard(userId, contestId, score, problemId);

    res.json({ 
      submissionId: submission._id, 
      status: submission.status, 
      score,
      evaluation: evaluation.results.filter(r => !r.isHidden) // Only show non-hidden cases in UI
    });

  } catch (error) {
    res.status(500).json({ message: 'Submission failed', error: error.message });
  }
};

const updateLeaderboard = async (userId, contestId, score, problemId) => {
  let entry = await CodingLeaderboard.findOne({ userId, contestId });
  if (!entry) {
    entry = new CodingLeaderboard({ userId, contestId });
  }
  
  // Since students can submit multiple times, we usually take the best score or cumulative
  // For this logic, let's assume we add score only if it exceeds their previous for this problem
  const existingBest = await CodingSubmission.find({ userId, contestId, problemId })
    .sort({ score: -1 })
    .limit(1);

  // Re-calculate total score based on unique best submissions
  const allBestSubmissions = await CodingSubmission.aggregate([
    { $match: { userId: entry.userId, contestId: entry.contestId } },
    { $sort: { score: -1 } },
    { $group: { _id: "$problemId", bestScore: { $first: "$score" } } }
  ]);

  entry.totalScore = allBestSubmissions.reduce((sum, s) => sum + s.bestScore, 0);
  
  if (score > 0 && !entry.problemsSolved.includes(problemId)) {
     entry.problemsSolved.push(problemId);
  }
  
  entry.submissionsCount += 1;
  entry.penaltyTime += 5; // Simulating a penalty logic
  await entry.save();
};

export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await CodingLeaderboard.find({ contestId: req.params.contestId })
      .sort({ totalScore: -1, penaltyTime: 1 })
      .populate('userId', 'name role department profilePic');
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
  }
};

/**
 * AUTOMATION: END CONTEST & AWARD PRIZES
 */
export const finalizeContest = async (req, res) => {
  const { contestId } = req.params;
  try {
    const contest = await CodingContest.findById(contestId);
    if (!contest) return res.status(404).json({ message: 'Contest not found' });
    
    contest.status = 'ended';
    await contest.save();

    const leaderboard = await CodingLeaderboard.find({ contestId })
      .sort({ totalScore: -1, penaltyTime: 1 });

    // Award Rewards based on User's instructions
    for (let i = 0; i < leaderboard.length; i++) {
        const entry = leaderboard[i];
        const rank = i + 1;
        let coins = 0;
        let badgeType = '';

        if (rank === 1) { coins = 100; badgeType = 'Weekly Winner'; }
        else if (rank === 2) { coins = 70; badgeType = 'Top 3 Performer'; }
        else if (rank === 3) { coins = 50; badgeType = 'Top 3 Performer'; }
        else if (rank <= 10) { coins = 25; badgeType = 'Top 10 Coder'; }
        else if (rank <= 50) { coins = 10; }
        else { coins = 5; }

        if (coins > 0) {
            await new CodingReward({ userId: entry.userId, contestId, coinsEarned: coins, reason: `Rank #${rank} in ${contest.title}` }).save();
            await User.findByIdAndUpdate(entry.userId, { $inc: { credits: coins } });
        }

        if (badgeType) {
            await new CodingBadge({ userId: entry.userId, contestId, badgeType, title: badgeType }).save();
        }
    }

    res.json({ message: 'Contest finalized and rewards distributed.' });
  } catch (error) {
    res.status(500).json({ message: 'Finalization failed', error: error.message });
  }
};
