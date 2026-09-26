export default {
  async fetch(request, env, ctx) {
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
      const formData = await request.formData();
      // Get all uploaded files (handles both single PDF or multiple images)
      const files = formData.getAll('file');

      if (!files || files.length === 0) {
        return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400, headers: {'Access-Control-Allow-Origin': '*'} });
      }

      // Prepare parts array for Gemini API. We always start with the text prompt.
      const promptText = "You are a friendly medical AI assistant. Read this uploaded pathology/blood test report (which may be a single PDF or multiple pages of images) and explain it to the patient in very simple, easy-to-understand Hindi (using standard Hindi script). Speak warmly like a family member. Highlight what the test is, if anything is abnormal, what it means, and give general dietary/lifestyle advice if applicable. DO NOT cause panic. End by reminding them to consult their doctor for proper medical advice. Format your response cleanly using HTML tags like <strong> and <br> for readability on a webpage.";
      
      const parts = [{ text: promptText }];

      // Process each file
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        const base64Data = btoa(binary);
        const mimeType = file.type || 'image/jpeg';
        
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        });
      }

      const apiKey = env.GEMINI_API_KEY; 
      const payload = {
        contents: [{ parts: parts }]
      };

      const modelsToTry = [
        'gemini-3.5-flash',
        'gemini-2.5-flash',
        'gemini-flash-latest'
      ];

      let explanation = null;
      let lastError = null;

      for (const model of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          
          const aiResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const aiData = await aiResponse.json();
          
          if (aiData.error) {
            lastError = aiData.error.message;
            continue; // Move to the next model
          }

          if (aiData.candidates && aiData.candidates.length > 0) {
            explanation = aiData.candidates[0].content.parts[0].text;
            break; // Success! We found a working model.
          }
        } catch (err) {
          lastError = err.message;
        }
      }

      if (!explanation) {
        throw new Error("आपके API Key में मॉडल सपोर्ट नहीं कर रहा है। आखिरी एरर: " + lastError);
      }

      return new Response(JSON.stringify({ result: explanation }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || "Unknown server error" }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
