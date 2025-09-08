const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config');
const authMiddleware = require('./middleware/auth'); // Import from new file

const app = express();
app.use(cors({
	origin: 'http://localhost:3000',
	credentials: true
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/data', require('./routes/dataRoutes'));
app.use('/api/ml', authMiddleware, require('./routes/mlRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));