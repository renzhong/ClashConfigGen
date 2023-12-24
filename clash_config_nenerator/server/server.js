// server/server.js
const express = require('express');
const cors = require('cors');
const configRoutes = require('./routes/configRoutes');
const clashxRoutes = require('./routes/clashxRoutes');
const clashxTemplateRoutes = require('./routes/clashxTemplateRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', configRoutes);
app.use('/clashx', clashxRoutes);
app.use('/clashxt', clashxTemplateRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
