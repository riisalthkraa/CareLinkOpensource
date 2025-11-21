/**
 * Test tous les modèles Gemini disponibles
 */

const apiKey = 'AIzaSyBedSTR_DeOiWuGB0Fj33OprBfGjHewzrY';

async function testModel(modelName, apiVersion) {
  console.log(`\n🔍 Test: ${modelName} (${apiVersion})`);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: 'Réponds juste "OK"' }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 50
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.log(`   ❌ ${error.error?.message || 'Erreur'}`);
      return false;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log(`   ✅ FONCTIONNE ! Réponse: ${text}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Erreur réseau: ${error.message}`);
    return false;
  }
}

async function testAll() {
  console.log('🚀 Test de tous les modèles Gemini disponibles...');

  const models = [
    // Version v1
    { name: 'gemini-pro', version: 'v1' },
    { name: 'gemini-1.0-pro', version: 'v1' },

    // Version v1beta
    { name: 'gemini-pro', version: 'v1beta' },
    { name: 'gemini-1.5-pro', version: 'v1beta' },
    { name: 'gemini-1.5-flash', version: 'v1beta' },
    { name: 'gemini-1.5-flash-latest', version: 'v1beta' },
    { name: 'gemini-2.0-flash-exp', version: 'v1beta' },
  ];

  for (const model of models) {
    await testModel(model.name, model.version);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pause 1s
  }

  console.log('\n\n✅ Tests terminés !');
}

testAll();
