import CodingChallenge from '../models/CodingChallenge.js';
import axios from 'axios';

const langMap = {
  'javascript': 'js',
  'python': 'py',
  'java': 'java',
  'cpp': 'cpp',
  'c': 'c',
  'csharp': 'cs',
  'go': 'go'
};

export const getChallenges = async (req, res) => {
  try {
    const challenges = await CodingChallenge.find({ isActive: true });
    // Seed challenges if missing (kept for robustness)
    if (challenges.length === 0) {
      const seed = [
        {
          title: "Two Sum",
          description: "Find two numbers that add up to a target.",
          problemStatement: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
          difficulty: "Easy",
          category: "Arrays",
          points: 50,
          constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
          examples: [{ input: "[2,7,11,15], 9", output: "[0,1]", explanation: "nums[0]+nums[1]=9" }],
          starterCode: { 
            javascript: "function twoSum(nums, target) {\n  // Write your code here\n}",
            python: "class Solution:\n    def twoSum(self, nums, target):\n        pass"
          },
          testCases: [
            { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]", isPublic: true }
          ]
        }
      ];
      await CodingChallenge.insertMany(seed);
      return res.json(await CodingChallenge.find({ isActive: true }));
    }
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getChallengeById = async (req, res) => {
  try {
    const challenge = await CodingChallenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: "Challenge not found" });
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const runCode = async (req, res) => {
    try {
        const { code, language, stdin } = req.body;
        const codexLang = langMap[language] || language;

        // CodeX API expects form-urlencoded
        const params = new URLSearchParams();
        params.append('code', code);
        params.append('language', codexLang);
        if (stdin) params.append('input', stdin);

        const response = await axios.post('https://api.codex.jaagrav.in', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        res.json({
            success: !response.data.error,
            message: response.data.error ? "Execution Failed" : "Success",
            output: response.data.output,
            error: response.data.error,
            runtime: `${response.data.time}ms`,
            memory: "N/A"
        });
    } catch (error) {
        console.error("CodeX Error:", error);
        res.status(500).json({ message: "Compiler service unavailable" });
    }
};

export const submitSolution = async (req, res) => {
  try {
    const { challengeId, code, language } = req.body;
    const challenge = await CodingChallenge.findById(challengeId);
    if (!challenge) return res.status(404).json({ message: "Challenge not found" });

    const codexLang = langMap[language] || language;
    let passedCount = 0;
    const results = [];

    // Run against test cases
    for (const testCase of challenge.testCases) {
        const params = new URLSearchParams();
        params.append('code', code);
        params.append('language', codexLang);
        params.append('input', testCase.input);

        const response = await axios.post('https://api.codex.jaagrav.in', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const actualOutput = response.data.output?.trim();
        const expectedOutput = testCase.expectedOutput?.trim();
        const passed = actualOutput === expectedOutput;

        if (passed) passedCount++;
        
        results.push({
            input: testCase.input,
            passed,
            expected: testCase.isPublic ? expectedOutput : "HIDDEN",
            actual: testCase.isPublic ? actualOutput : "HIDDEN"
        });

        // Small delay to avoid overloading community API
        await new Promise(r => setTimeout(r, 100));
    }

    const success = passedCount === challenge.testCases.length;
    
    // Logic to award coins/XP would go here
    const coinsEarned = success ? challenge.points : 0;

    res.json({
      success,
      message: success ? "All test cases passed!" : `${passedCount}/${challenge.testCases.length} test cases passed.`,
      results,
      coinsEarned,
      runtime: "Verified across all suites"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin/Teacher Controllers
export const createChallenge = async (req, res) => {
    try {
        const challenge = await CodingChallenge.create(req.body);
        res.status(201).json(challenge);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateChallenge = async (req, res) => {
    try {
        const challenge = await CodingChallenge.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!challenge) return res.status(404).json({ message: "Challenge not found" });
        res.json(challenge);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteChallenge = async (req, res) => {
    try {
        const challenge = await CodingChallenge.findByIdAndDelete(req.params.id);
        if (!challenge) return res.status(404).json({ message: "Challenge not found" });
        res.json({ message: "Challenge deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
