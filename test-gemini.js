/**
 * Test Gemini API
 * Usage: node test-gemini.js YOUR_API_KEY
 */

const apiKey = process.argv[2];

if (!apiKey) {
  console.log('❌ Usage: node test-gemini.js YOUR_API_KEY');
  console.log('\n💡 Obtenez votre clé gratuite sur: https://aistudio.google.com/app/apikey');
  process.exit(1);
}

async function testGemini() {
  console.log('🔍 Test de la clé API Gemini...\n');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: 'Réponds juste "OK" si tu me reçois.' }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 100
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.log('❌ Erreur API Gemini:');
      console.log(JSON.stringify(error, null, 2));
      return;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('✅ Gemini fonctionne !');
    console.log('\n📝 Réponse:', text);
    console.log('\n💰 Infos:');
    console.log('  - Modèle: gemini-1.5-flash');
    console.log('  - Gratuit: 1500 requêtes/jour');
    console.log('  - Limite: 60 requêtes/minute');

  } catch (error) {
    console.log('❌ Erreur réseau:', error.message);
  }
}

testGemini();
