require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
console.log("ENV:", process.env.MONGODB_URI);
const mongoose = require('mongoose');
const User = require('../models/User');
const Cycle = require('../models/Cycle');
const Goal = require('../models/Goal');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/atomquest';
//mongoose.connect(MONGO_URI);

async function seed() {
  console.log("Using URI:",MONGO_URI);
  await mongoose.connect(MONGO_URI,{
     useNewUrlParser: true,
    useUnifiedTopology: true
  });

  mongoose.set('bufferCommands', false);
  console.log('Connected to MongoDB');


  // Clear existing
  await User.deleteMany({});
  await Cycle.deleteMany({});
  await Goal.deleteMany({});

  // Create Admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@atomquest.com',
    password: 'Admin@123',
    role: 'admin',
    department: 'HR',
    employeeId: 'EMP001',
  });

  // Create Manager
  const manager = await User.create({
    name: 'Priya Sharma',
    email: 'manager@atomquest.com',
    password: 'Manager@123',
    role: 'manager',
    department: 'Engineering',
    employeeId: 'EMP002',
    managerId: admin._id,
  });

  // Create Employees
  const emp1 = await User.create({
    name: 'Arjun Mehta',
    email: 'employee@atomquest.com',
    password: 'Employee@123',
    role: 'employee',
    department: 'Engineering',
    employeeId: 'EMP003',
    managerId: manager._id,
  });

  const emp2 = await User.create({
    name: 'Sneha Reddy',
    email: 'sneha@atomquest.com',
    password: 'Employee@123',
    role: 'employee',
    department: 'Engineering',
    employeeId: 'EMP004',
    managerId: manager._id,
  });

  // Create active cycle
  const now = new Date();
  const cycle = await Cycle.create({
    name: 'FY 2025-26',
    year: 2025,
    isActive: true,
    goalSettingOpen: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    goalSettingClose: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    q1Open: new Date('2025-07-01'),
    q1Close: new Date('2025-07-31'),
    q2Open: new Date('2025-10-01'),
    q2Close: new Date('2025-10-31'),
    q3Open: new Date('2026-01-01'),
    q3Close: new Date('2026-01-31'),
    q4Open: new Date('2026-03-01'),
    q4Close: new Date('2026-04-30'),
    createdBy: admin._id,
  });

  // Create a demo goal sheet (approved) for emp1
  const demoSheet = await Goal.create({
    employeeId: emp1._id,
    cycleId: cycle._id,
    status: 'locked',
    submittedAt: new Date(),
    approvedAt: new Date(),
    approvedBy: manager._id,
    goals: [
      {
        title: 'Increase Sprint Velocity',
        description: 'Improve team delivery speed',
        thrustArea: 'Delivery Excellence',
        uomType: 'numeric_min',
        target: 50,
        weightage: 30,
        q1Actual: 42,
        q1Status: 'on_track',
        q1Score: 84,
      },
      {
        title: 'Reduce Bug Escape Rate',
        description: 'Improve code quality',
        thrustArea: 'Quality',
        uomType: 'numeric_max',
        target: 5,
        weightage: 25,
        q1Actual: 3,
        q1Status: 'on_track',
        q1Score: 100,
      },
      {
        title: 'Complete AWS Certification',
        description: 'Get AWS Solutions Architect cert',
        thrustArea: 'Learning & Development',
        uomType: 'timeline',
        target: '2025-09-30',
        weightage: 20,
        q1Status: 'not_started',
      },
      {
        title: 'Zero Production Incidents',
        description: 'No P0/P1 incidents caused by team',
        thrustArea: 'Reliability',
        uomType: 'zero',
        target: 0,
        weightage: 25,
        q1Actual: 0,
        q1Status: 'completed',
        q1Score: 100,
      },
    ],
  });

  // Create a submitted sheet for emp2
  await Goal.create({
    employeeId: emp2._id,
    cycleId: cycle._id,
    status: 'submitted',
    submittedAt: new Date(),
    goals: [
      {
        title: 'Customer Satisfaction Score',
        description: 'Improve CSAT ratings',
        thrustArea: 'Customer Success',
        uomType: 'percent_min',
        target: 90,
        weightage: 40,
      },
      {
        title: 'Feature Delivery on Time',
        description: '80% of features on schedule',
        thrustArea: 'Delivery Excellence',
        uomType: 'percent_min',
        target: 80,
        weightage: 35,
      },
      {
        title: 'Team Training Completion',
        description: 'Complete all mandatory training',
        thrustArea: 'Learning & Development',
        uomType: 'percent_min',
        target: 100,
        weightage: 25,
      },
    ],
  });

  console.log('\n✅ Seed complete!\n');
  console.log('Demo Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin   → admin@atomquest.com    / Admin@123');
  console.log('Manager → manager@atomquest.com  / Manager@123');
  console.log('Employee→ employee@atomquest.com / Employee@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
