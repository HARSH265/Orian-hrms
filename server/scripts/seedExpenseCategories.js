const mongoose = require('mongoose');
const ExpenseCategory = require('../model/expenseCategory.model');
const dotenv = require('dotenv');

dotenv.config();

const defaultCategories = [
  { name: 'Travel', description: 'Transportation, flights, hotels', sortOrder: 1 },
  { name: 'Meal', description: 'Food and dining expenses', sortOrder: 2 },
  { name: 'Supplies', description: 'Office supplies and equipment', sortOrder: 3 },
  { name: 'Training', description: 'Courses, certifications, conferences', sortOrder: 4 },
  { name: 'Other', description: 'Miscellaneous expenses', sortOrder: 5 },
];

async function seedExpenseCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/orion_hrms');
    for (const cat of defaultCategories) {
      await ExpenseCategory.findOneAndUpdate(
        { name: cat.name },
        { $setOnInsert: cat },
        { upsert: true, new: true }
      );
    }
    console.log('Default expense categories seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed expense categories:', err);
    process.exit(1);
  }
}

seedExpenseCategories();
