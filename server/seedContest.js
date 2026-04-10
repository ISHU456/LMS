import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CodingContest from './models/CodingContest.js';
import CodingProblem from './models/CodingProblem.js';
import User from './models/User.js';

dotenv.config();

const seedDemoContest = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // 1. Find an admin user to be the creator
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('No admin user found. Please create an admin user first.');
            process.exit(1);
        }

        // 2. Clear existing demo data (optional, but good for idempotency)
        await CodingContest.deleteMany({ title: 'Standard Algorithm Challenge 2024' });
        
        // 3. Define 4 Problems (Easy, Medium, Medium, Hard)
        const problemsData = [
            {
                title: "Two Sum",
                description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
                difficulty: "Easy",
                points: 10,
                constraints: "2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9",
                sampleInput: "[2,7,11,15], 9",
                sampleOutput: "[0,1]",
                testCases: [
                    { input: "[2,7,11,15]\n9", output: "[0,1]", isHidden: false },
                    { input: "[3,2,4]\n6", output: "[1,2]", isHidden: false },
                    { input: "[3,3]\n6", output: "[0,1]", isHidden: false },
                    // 7 Hidden
                    { input: "[1,5]\n6", output: "[0,1]", isHidden: true },
                    { input: "[0,4,3,0]\n0", output: "[0,3]", isHidden: true },
                    { input: "[-1,-2,-3,-4,-5]\n-8", output: "[2,4]", isHidden: true },
                    { input: "[10,20,30,40]\n70", output: "[2,3]", isHidden: true },
                    { input: "[1,2,3]\n4", output: "[0,2]", isHidden: true },
                    { input: "[5,5]\n10", output: "[0,1]", isHidden: true },
                    { input: "[100,200]\n300", output: "[0,1]", isHidden: true }
                ],
                createdBy: admin._id
            },
            {
                title: "Longest Substring Without Repeating Characters",
                description: "Given a string s, find the length of the longest substring without repeating characters.",
                difficulty: "Medium",
                points: 30,
                constraints: "0 <= s.length <= 5 * 10^4",
                sampleInput: "\"abcabcbb\"",
                sampleOutput: "3",
                testCases: [
                    { input: "abcabcbb", output: "3", isHidden: false },
                    { input: "bbbbb", output: "1", isHidden: false },
                    { input: "pwwkew", output: "3", isHidden: false },
                    // 7 Hidden
                    { input: "EMPTY_STRING", output: "0", isHidden: true },
                    { input: " ", output: "1", isHidden: true },
                    { input: "au", output: "2", isHidden: true },
                    { input: "dvdf", output: "3", isHidden: true },
                    { input: "abacaba", output: "3", isHidden: true },
                    { input: "tmmzuxt", output: "5", isHidden: true },
                    { input: "abcdefg", output: "7", isHidden: true }
                ],
                createdBy: admin._id
            },
            {
                title: "Add Two Numbers",
                description: "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.",
                difficulty: "Medium",
                points: 30,
                constraints: "The number of nodes in each linked list is in the range [1, 100]. 0 <= Node.val <= 9",
                sampleInput: "[2,4,3], [5,6,4]",
                sampleOutput: "[7,0,8]",
                testCases: [
                    { input: "[2,4,3]\n[5,6,4]", output: "[7,0,8]", isHidden: false },
                    { input: "[0]\n[0]", output: "[0]", isHidden: false },
                    { input: "[9,9,9,9,9,9,9]\n[9,9,9,9]", output: "[8,9,9,9,0,0,0,1]", isHidden: false },
                    // 7 Hidden
                    { input: "[1]\n[9,9]", output: "[0,0,1]", isHidden: true },
                    { input: "[5]\n[5]", output: "[0,1]", isHidden: true },
                    { input: "[1,8]\n[0]", output: "[1,8]", isHidden: true },
                    { input: "[2,4,9]\n[5,6,4,9]", output: "[7,0,4,0,1]", isHidden: true },
                    { input: "[9]\n[1]", output: "[0,1]", isHidden: true },
                    { input: "[2]\n[8]", output: "[0,1]", isHidden: true },
                    { input: "[1,2,3]\n[4,5,6]", output: "[5,7,9]", isHidden: true }
                ],
                createdBy: admin._id
            },
            {
                title: "Median of Two Sorted Arrays",
                description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
                difficulty: "Hard",
                points: 50,
                constraints: "nums1.length == m, nums2.length == n, 0 <= m, n <= 1000",
                sampleInput: "[1,3], [2]",
                sampleOutput: "2.00000",
                testCases: [
                    { input: "[1,3]\n[2]", output: "2.0", isHidden: false },
                    { input: "[1,2]\n[3,4]", output: "2.5", isHidden: false },
                    { input: "[0,0]\n[0,0]", output: "0.0", isHidden: false },
                    // 7 Hidden
                    { input: "[]\n[1]", output: "1.0", isHidden: true },
                    { input: "[2]\n[]", output: "2.0", isHidden: true },
                    { input: "[1,2,3,4,5]\n[6,7,8,9,10]", output: "5.5", isHidden: true },
                    { input: "[1,1,1]\n[1,1,1]", output: "1.0", isHidden: true },
                    { input: "[1,2]\n[-1,3]", output: "1.5", isHidden: true },
                    { input: "[1,5,8]\n[2,3,4,9,10]", output: "4.5", isHidden: true },
                    { input: "[10,20]\n[5,15,25]", output: "15.0", isHidden: true }
                ],
                createdBy: admin._id
            }
        ];

        const createdProblems = await CodingProblem.insertMany(problemsData);
        console.log(`Seeded ${createdProblems.length} problems.`);

        // 4. Create Contest
        const startTime = new Date();
        const endTime = new Date();
        endTime.setHours(endTime.getHours() + 48); // 48 hour contest

        const contest = new CodingContest({
            title: "Standard Algorithm Challenge 2024",
            description: "Master the basics of algorithms with this foundational challenge. Features classic problems to test your logic and speed.",
            startTime,
            endTime,
            problems: createdProblems.map(p => p._id),
            status: 'live',
            createdBy: admin._id,
            prizes: [
                { title: "Gold Trophy + 500 Coins", image: "", description: "Rank 1 Winner", eligibility: "Rank 1" },
                { title: "Silver Badge + 250 Coins", image: "", description: "Rank 2 & 3", eligibility: "Rank 2-3" },
                { title: "Bronze Badge + 100 Coins", image: "", description: "Top 10 finishers", eligibility: "Top 10" }
            ]
        });

        await contest.save();
        console.log('Demo Contest "Standard Algorithm Challenge 2024" seeded successfully.');

        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedDemoContest();
