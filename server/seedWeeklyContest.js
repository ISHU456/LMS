import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CodingChallenge from './models/CodingChallenge.js';
import User from './models/User.js';

dotenv.config();

const seedWeekly = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('No admin found');
      process.exit(1);
    }

    const challenges = [
      {
        title: "Weekly Q1: Sum of Arrays",
        description: "Given two arrays, return an array of their element-wise sum.",
        problemStatement: "Write a function `solve(arr1, arr2)` that takes two equal-length arrays of integers and returns a new array where each element is the sum of the corresponding elements from `arr1` and `arr2`.",
        difficulty: "Easy",
        category: "Arrays",
        points: 50,
        isWeeklyTest: true,
        allowedLanguages: ['javascript', 'python', 'java', 'cpp'],
        testCases: [
          { input: "[1,2,3]\n[4,5,6]", expectedOutput: "[5,7,9]", isPublic: true },
          { input: "[0,0]\n[0,0]", expectedOutput: "[0,0]", isPublic: false }
        ],
        starterCode: {
          javascript: "// Start coding here\nfunction solve(arr1, arr2) {\n  \n}",
          python: "# Start coding here\ndef solve(arr1, arr2):\n    pass"
        }
      },
      {
        title: "Weekly Q2: First Non-Repeating Character",
        description: "Find the first non-repeating character in a string.",
        problemStatement: "Given a string `s`, find the first non-repeating character in it and return its index. If it does not exist, return `-1`.",
        difficulty: "Medium",
        category: "Strings",
        points: 100,
        isWeeklyTest: true,
        allowedLanguages: ['javascript', 'python', 'java', 'cpp'],
        testCases: [
          { input: "leetcode", expectedOutput: "0", isPublic: true },
          { input: "loveleetcode", expectedOutput: "2", isPublic: false }
        ],
        starterCode: {
          javascript: "// Start coding here\nfunction solve(s) {\n  \n}",
          python: "# Start coding here\ndef solve(s):\n    pass"
        }
      },
      {
        title: "Weekly Q3: Balanced Parentheses",
        description: "Check if a string of brackets is balanced.",
        problemStatement: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
        difficulty: "Medium",
        category: "Stacks",
        points: 100,
        isWeeklyTest: true,
        allowedLanguages: ['javascript', 'python', 'java', 'cpp'],
        testCases: [
          { input: "()", expectedOutput: "true", isPublic: true },
          { input: "()[]{}", expectedOutput: "true", isPublic: false },
          { input: "(]", expectedOutput: "false", isPublic: true }
        ],
        starterCode: {
          javascript: "// Start coding here\nfunction solve(s) {\n  \n}",
          python: "# Start coding here\ndef solve(s):\n    pass"
        }
      },
      {
        title: "Weekly Q4: Trapping Rain Water",
        description: "Calculate the amount of water trapped between elevations.",
        problemStatement: "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.",
        difficulty: "Hard",
        category: "Two Pointers",
        points: 200,
        isWeeklyTest: true,
        allowedLanguages: ['javascript', 'python', 'java', 'cpp'],
        testCases: [
          { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expectedOutput: "6", isPublic: true },
          { input: "[4,2,0,3,2,5]", expectedOutput: "9", isPublic: false }
        ],
        starterCode: {
          javascript: "// Start coding here\nfunction solve(height) {\n  \n}",
          python: "# Start coding here\ndef solve(height):\n    pass"
        }
      }
    ];

    await CodingChallenge.insertMany(challenges);
    console.log("Weekly Coding Contest Successfully Seeded!");
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedWeekly();
