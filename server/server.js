const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose
  .connect('mongodb://localhost:27017/drummond', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  isAdmin: Boolean,
  phone: String,
});

const User = mongoose.model('User', userSchema);
const TrainingText = mongoose.model('TrainingText', { text: String });

// Middleware to parse JSON
app.use(express.json());

// User Registration
app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      isAdmin: false,
      phone: req.body.phone,
    });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// User Login
app.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) return res.status(404).json({ message: 'User not found' });
    const isValidPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!isValidPassword)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      'your_secret_key',
      { expiresIn: '1h' }
    );
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Protected route - requires token
app.get('/protected', verifyToken, (req, res) => {
  jwt.verify(req.token, 'your_secret_key', (err, authData) => {
    if (err) {
      res.status(401).json({ message: 'Unauthorized' });
    } else {
      res.status(200).json({ message: 'Protected route', authData });
    }
  });
});

// Verify token middleware
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined') {
    const bearerToken = bearerHeader.split(' ')[1];
    jwt.verify(bearerToken, 'your_secret_key', (err, authData) => {
      if (err) {
        res.status(403).json({ message: 'Forbidden' });
      } else {
        req.userId = authData.userId;
        next();
      }
    });
  } else {
    res.status(403).json({ message: 'Forbidden' });
  }
}

app.put('/users/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    // Check if user making the request is an admin
    const currentUser = await User.findById(req.userId);
    if (!currentUser.isAdmin) {
      return res
        .status(403)
        .json({ message: 'Unauthorized. Admin privileges required' });
    }

    // Update isAdmin field of the user
    await User.findByIdAndUpdate(userId, { isAdmin });

    res.status(200).json({ message: 'isAdmin field updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/training-text', async (req, res) => {
  try {
    // Retrieve training text from the database (assuming it's stored in a collection called 'training_text')
    const trainingText = await TrainingText.findOne();
    res.status(200).json(trainingText.text);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Modify training text (requires admin privilege)
app.put('/training-text', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;

    // Check if user is an admin
    const currentUser = await User.findById(req.userId);
    if (!currentUser.isAdmin) {
      return res
        .status(403)
        .json({ message: 'Unauthorized. Admin privileges required' });
    }

    // Update training text in the database (assuming it's stored in a collection called 'training_text')
    await TrainingText.findOneAndUpdate({}, { text }, { upsert: true });

    res.status(200).json({ message: 'Training text updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function createDefaultAdmin() {
  try {
    // Check if default admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('adminpassword', 10); // Change password as per your requirement
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        isAdmin: true,
        phone: '1234567890', // Change phone number as per your requirement
      });
      await adminUser.save();
      console.log('Default admin user created');
    }
  } catch (err) {
    console.error('Error creating default admin user:', err.message);
  }
}

async function createDefaultTrainingText() {
  try {
    // Check if training text already exists
    const existingTrainingText = await TrainingText.findOne();
    if (!existingTrainingText) {
      const trainingText = new TrainingText({
        text: 'Default training text goes here',
      });
      await trainingText.save();
      console.log('Default training text created');
    }
  } catch (err) {
    console.error('Error creating default training text:', err.message);
  }
}

// Create default admin user
createDefaultAdmin();
createDefaultTrainingText();

// Start server
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
