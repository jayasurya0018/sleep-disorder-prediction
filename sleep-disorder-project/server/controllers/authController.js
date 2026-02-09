const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { email, password, age, gender } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('Duplicate email:', email);
            return res.status(400).send('Email already exists');
        }
        const hashedPw = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPw, age, gender });
        await user.save();
        
        // Generate token for immediate login
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        const { password: pw, ...userProfile } = user.toObject();
        
        res.status(201).json({ token, user: userProfile, message: 'User registered successfully' });
    } catch (err) {
        console.error('Register error:', err.message, err.stack);
        res.status(500).send('Server error');
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).send('Invalid credentials');
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        // Exclude password from returned user profile
        const { password: pw, ...userProfile } = user.toObject();
        res.json({ token, user: userProfile });
    } catch (err) {
        console.error('Login error:', err.message, err.stack);
        res.status(500).send('Server error');
    }
};
exports.getProfile = async (req, res) => {
    try {
        console.log('Profile request - User ID:', req.userId);
        if (!req.userId) {
            console.log('No user ID in req.user');
            return res.status(401).send('Invalid user data');
        }
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            console.log('User not found for ID:', req.userId);
            return res.status(404).send('User not found');
        }
        console.log('User found:', user);
        res.json(user);
    } catch (err) {
        console.error('Profile error:', err.message, err.stack);
        res.status(500).send('Server error');
    }
};
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        console.log('updateProfile called. User ID:', userId);
        console.log('Request body:', JSON.stringify(req.body));
        if (!userId) {
            console.error('No user ID in JWT payload');
            return res.status(401).json({ error: 'No user ID in JWT payload' });
        }
        const { name, email, photo, age, gender } = req.body;
        if (!name || !email || !photo || !age || !gender) {
            console.error('Missing required fields:', { name, email, photo, age, gender });
            return res.status(400).json({ error: 'Missing required fields', fields: { name, email, photo, age, gender } });
        }
        const user = await User.findById(userId);
        if (!user) {
            console.error('User not found for update:', userId);
            return res.status(404).json({ error: 'User not found' });
        }
        // Only check and update email if it is changed
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                console.error('Duplicate email detected:', email);
                return res.status(400).json({ error: 'Email already exists' });
            }
            user.email = email;
        }
        user.name = name || user.name;
        user.photo = photo || user.photo;
        user.age = age || user.age;
        user.gender = gender || user.gender;
        await user.save();
        console.log('Profile updated successfully:', { name: user.name, email: user.email, photo: user.photo, age: user.age, gender: user.gender });
        res.json({ name: user.name, email: user.email, photo: user.photo, age: user.age, gender: user.gender });
    } catch (err) {
        console.error('Update profile error:', err.message, err.stack, err);
        res.status(500).json({ error: 'Failed to update profile', details: err.message, stack: err.stack });
    }
};