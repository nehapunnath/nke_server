require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const routes = require('./Routes/Route');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', routes);



app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
