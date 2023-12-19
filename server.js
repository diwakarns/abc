const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 9758;

// Enable CORS
app.use(require('cors')());

// Connect to MongoDB
// const client = new MongoClient('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true });
const uri = process.env.MONGO_CONNECTION_STRING || 'mongodb+srv://diwakar:yWwUI5qpupmNow1N@cluster0.de77o86.mongodb.net';
const client = new MongoClient(uri,
 { useNewUrlParser: true, useUnifiedTopology: true });

let db;

client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
    db = client.db('scheme');
  })
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Keywords representing states
const stateKeywords = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
                  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
                  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
                  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
                  "Uttarakhand", "West Bengal"];

app.get('/api/scheme-data', async (req, res) => {
  try {
    // Get all user data documents
    const user_data_documents = await db.collection('user_data').find().toArray();

    // Store eligibilityCriteria and applicationProcess data from props for documents with matched keywords in body_text
    const scheme_data_list = [];

    for (const user_data of user_data_documents) {
      const user_city = user_data.city ? user_data.city.trim() : '';

      // Find schemes containing "props" in body_text
      const results = await db.collection('scheme').find({ 'body_text': { $regex: '.*props.*' } }).toArray();

      for (const result of results) {
        const body_text = result.body_text || [];

        for (const line of body_text) {
          for (const keyword of stateKeywords) {
            if (line.toLowerCase().includes(keyword.toLowerCase())) {

            // if (keyword.toLowerCase() in line.toLowerCase()) {
              // Matched a state keyword, check user's city
              if (user_city.toLowerCase() === keyword.toLowerCase()) {
                try {
                  const json_data = JSON.parse(line);
                  const props_data = json_data.props || {};
                  const page_props = props_data.pageProps || {};
                  const scheme_data = page_props.schemeData || {};
                  const en_data = scheme_data.en || {};
                  const eligibility_criteria = en_data.eligibilityCriteria;
                  const application_process = en_data.applicationProcess;

                  if (eligibility_criteria && application_process) {
                    scheme_data_list.push({ eligibilityCriteria, applicationProcess });
                  }
                } catch (error) {
                  console.log(`Invalid JSON format in line: ${line}`);
                  continue;
                }
              }
            }
          }
        }
      }
    }

    // Return eligibilityCriteria and applicationProcess data as JSON response
    res.json(scheme_data_list);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
