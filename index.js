const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
const path = require('path');

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/generate', async (req, res) => {
  const { prompt } = req.body;

  const wrappedPrompt = `
You are a professional web developer. Based on the user's request, generate a complete modern website with beautiful looks and style. strictly Use real images from https://source.unsplash.com or https://picsum.photos. Avoid broken image links or placeholder names. Return HTML, CSS, and JavaScript as separate blocks. Use this format strictly:


<!-- HTML_START -->
...HTML content...
<!-- CSS_START -->
...CSS content...
<!-- JS_START -->
...JavaScript content...

User's request: ${prompt}
  `;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(wrappedPrompt);
    const response = await result.response;
    const fullContent = response.text();

    const htmlMatch = fullContent.match(/<!-- HTML_START -->([\s\S]*?)<!-- CSS_START -->/);
    const cssMatch = fullContent.match(/<!-- CSS_START -->([\s\S]*?)<!-- JS_START -->/);
    const jsMatch = fullContent.match(/<!-- JS_START -->([\s\S]*)/);

    const html = htmlMatch ? htmlMatch[1].trim() : '';
    const css = cssMatch ? cssMatch[1].trim() : '';
    const js = jsMatch ? jsMatch[1].trim() : '';

    res.send({ html, css, js });
  } catch (err) {
    console.error('Gemini Error:', err);
    res.status(500).send({ error: 'Failed to generate website using Gemini' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
