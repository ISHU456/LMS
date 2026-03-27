import mongoose from 'mongoose';
import 'dotenv/config';
import Department from '../models/Department.js';
import User from '../models/User.js';

const MONGODB_URI = process.env.MONGODB_URI;

const seedCSE = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for CSE seeding...');

    // Find any existing teacher/admin to use as HOD or Faculty (Optional)
    const faculty = await User.findOne({ role: { $in: ['teacher', 'admin', 'hod'] } });
    const facultyId = faculty ? faculty._id : new mongoose.Types.ObjectId();

    const cseData = {
      name: 'Computer Science and Engineering',
      code: 'CSE',
      tagline: 'Empowering the Digital Architects of Tomorrow',
      description: 'The Department of Computer Science & Engineering (CSE) stands at the forefront of the technological revolution, dedicated to excellence in software, hardware, and the complex systems that bridge them.',
      overview: 'Since its inception in 1995, our department has evolved into a powerhouse of innovation. We offer a vibrant ecosystem where theoretical foundations meet real-world application, preparing students for the dynamic landscape of the tech industry. Our curriculum is tailored to modern demands in AI, Data Science, and Cybersecurity.',
      establishedYear: 1995,
      heroImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
      
      vision: 'To be a globally recognized center of excellence in computer science education and research, fostering innovation and leadership in the computing profession.',
      mission: 'To provide high-quality education in computer science, promote cutting-edge research in emerging fields, and cultivate a sense of professional ethics and responsibility among students.',
      
      highlights: [
        { title: 'Placement Rate', value: '98%', icon: 'Briefcase' },
        { title: 'Highest Package', value: '45 LPA', icon: 'Trophy' },
        { title: 'Research Labs', value: '12+', icon: 'Microscope' },
        { title: 'Avg Package', value: '12.5 LPA', icon: 'Star' }
      ],

      programs: [
        { 
          name: 'B.Tech in Computer Science', 
          level: 'UG', 
          duration: '4 Years', 
          eligibility: '10+2 with PCM (Minimum 65%)',
          description: 'A comprehensive undergraduate program focusing on algorithm design, data structures, software engineering, and core computing principles.'
        },
        { 
          name: 'M.Tech in Artificial Intelligence', 
          level: 'PG', 
          duration: '2 Years', 
          eligibility: 'B.E / B.Tech in relevant field',
          description: 'Advanced specialization in machine learning, deep neural networks, and computer vision for modern industry applications.'
        },
        { 
          name: 'PhD in Computer Science', 
          level: 'PhD', 
          duration: '3-5 Years', 
          eligibility: 'Post Graduation in relevant domain',
          description: 'Intensive research program for contributing original knowledge in specialized computing fields.'
        }
      ],

      infrastructure: [
        {
          name: 'NVIDIA AI Excellence Center',
          description: 'Equipped with the latest NVIDIA Tesla and A100 GPU clusters for deep learning research and high-performance computing.',
          image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          icon: 'Activity'
        },
        {
          name: 'Digital Innovation Hub',
          description: 'A collaborative space for startups and student-led innovation projects, featuring VR/AR equipment and 3D printing labs.',
          image: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          icon: 'Lightbulb'
        },
        {
          name: 'Cloud Computing Operations Lab',
          description: 'Hands-on experience with AWS, Azure, and Google Cloud infrastructure for large-scale distributed systems.',
          image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc48?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          icon: 'Layers'
        }
      ],

      placements: {
        stats: [
          { year: '2025', percentage: 98, highestPackage: '45 LPA' },
          { year: '2024', percentage: 96, highestPackage: '38 LPA' },
          { year: '2023', percentage: 94, highestPackage: '32 LPA' }
        ],
        topRecruiters: ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'NVIDIA']
      },

      achievements: [
        {
          title: 'Outstanding Performance in ICPC Regionals',
          date: new Date('2025-01-10'),
          description: 'Our student team secured 3rd rank in the regional finals of the International Collegiate Programming Contest.',
          image: 'https://images.unsplash.com/photo-1496065187459-6028b01a5751?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
          title: 'Research Grant for Green Computing',
          date: new Date('2024-11-05'),
          description: 'Awarded $250,000 for sustainability initiatives in data center management by the Department of Energy.'
        }
      ],

      testimonials: [
        {
          name: 'Anjali Sharma',
          role: 'Alumni, Batch of 2023 (SDE at Microsoft)',
          content: 'The exposure I received at the CSE department was instrumental in my career. The faculty go beyond textbooks to ensure we are industry-ready.',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali'
        },
        {
          name: 'Vikram Singh',
          role: 'Final Year Student (Incoming Amazon Intern)',
          content: 'The competitive coding culture and the hackathons organized here push you to your limits. Truly the best place for a tech enthusiast.',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram'
        }
      ],

      contactDetails: {
        email: 'hod.cse@university.edu',
        phone: '+91 123 456 7890',
        address: 'Engineering Block A, East Campus, University Town',
      }
    };

    // Use updateOne with upsert: true to update or create
    await Department.updateOne(
      { code: 'CSE' },
      { $set: cseData },
      { upsert: true }
    );

    console.log('CSE Department seeded successfully with authentic content.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedCSE();
