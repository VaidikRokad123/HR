import CounterModel from '../models/CounterModel.js';

/**
 * Generate next employee code using atomic counter
 * Format: EMP0001, EMP0002, etc.
 * Thread-safe using MongoDB's findOneAndUpdate with atomic increment
 */
export const generateEmpCode = async () => {
  try {
    // Use atomic findOneAndUpdate to prevent race conditions
    const counter = await CounterModel.findOneAndUpdate(
      { name: 'emp_code' },
      { $inc: { value: 1 } },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true 
      }
    );

    // Pad with zeros to make it 4 digits
    return `EMP${String(counter.value).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating employee code:', error);
    throw new Error('Failed to generate employee code');
  }
};

/**
 * Initialize counter if not exists
 * Should be called during application startup or seeding
 */
export const initializeCounter = async () => {
  try {
    const existingCounter = await CounterModel.findOne({ name: 'emp_code' });
    
    if (!existingCounter) {
      await CounterModel.create({ name: 'emp_code', value: 0 });
      console.log('✅ Employee code counter initialized');
    }
  } catch (error) {
    console.error('Error initializing counter:', error);
  }
};
