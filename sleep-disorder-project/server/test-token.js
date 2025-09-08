const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjQ4NmQ2M2Y1ZDQ0ZTk2NTQ5OTFlZiIsImlhdCI6MTc1NjY4MzcwM30.rkMRIlrdECieUp5sYI6syvfYAiTPNS5MX3XLXoyKb2c';
try {
    const decoded = jwt.verify(token, 'secretkey');
    console.log('Decoded:', decoded);
} catch (err) {
    console.error('Token error:', err.message);
}