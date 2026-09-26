export default {
  async fetch(request, env, ctx) {
    // 1. Handle CORS (Cross-Origin Resource Sharing)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Only POST requests allowed', { status: 405 });
    }

    try {
      // 2. Get the uploaded file from the website
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file) {
        return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
      }

      // 3. Convert file to Base64 format for Gemini API
      const arrayBuffer = await file.arrayBuffer();
      // Fast base64 conversion using ArrayBuffer
      let binary = '';
      const bytes = new Uint8Array(arrayBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binary);
      
      const mimeType = file.type || 'application/pdf';

      // 4. Send to Google Gemini API
      const apiKey = env.GEMINI_API_KEY; // SECRET KEY
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

      const promptText = "You are a friendly medical AI assistant. Read this uploaded pathology/blood test report and explain it to the patient in very simple, easy-to-understand Hindi (using standard Hindi script). Speak warmly like a family member. Highlight what the test is, if anything is abnormal, what it means, and give general dietary/lifestyle advice if applicable. DO NOT cause panic. End by reminding them to consult their doctor for proper medical advice. Format your response cleanly using HTML tags like <strong> and <br> for readability on a webpage.";

      const payload = {
        contents: [{
          parts: [
            { text: promptText },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            }
          ]
        }]
      };

      const aiResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const aiData = await aiResponse.json();
      
      if (aiData.error) {
        throw new Error(aiData.error.message);
      }

      const explanation = aiData.candidates[0].content.parts[0].text;

      // 5. Return the Hindi explanation to the website
      return new Response(JSON.stringify({ result: explanation }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
