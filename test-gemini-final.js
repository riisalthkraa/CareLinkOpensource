/**
 * Test final Gemini avec les bons modèles
 */

const apiKey = 'AIzaSyBedSTR_DeOiWuGB0Fj33OprBfGjHewzrY';

async function testModel(modelName) {
  console.log(`\n🔍 Test: ${modelName}...`);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Réponds juste "Bonjour ! Je fonctionne parfaitement."' }]
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
      console.log(`   ❌ ${error.error?.message?.substring(0, 100)}...`);
      return false;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log(`   ✅ FONCTIONNE !`);
    console.log(`   📝 Réponse: ${text}`);

    if (data.usageMetadata) {
      console.log(`   📊 Tokens: ${data.usageMetadata.totalTokenCount}`);
    }

    return true;
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 TEST FINAL GEMINI API\n');

  const models = [
    'gemini-2.5-flash',          // Dernier modèle flash
    'gemini-2.0-flash',          // Stable
    'gemini-2.5-pro',            // Plus puissant
    'gemini-flash-latest',       // Alias latest
  ];

  let success = false;
  for (const model of models) {
    const result = await testModel(model);
    if (result) {
      success = true;
      console.log(`\n\n✅ MODÈLE RECOMMANDÉ POUR CARELINK: ${model}`);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 2000)); // Pause 2s
  }

  if (success) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ GEMINI EST OPÉRATIONNEL !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 POUR CONFIGURER DANS CARELINK:');
    console.log('   1. Lancez CareLink');
    console.log('   2. Allez dans Configuration');
    console.log('   3. Sélectionnez "Google Gemini"');
    console.log('   4. Modèle: gemini-2.5-flash (ou gemini-2.0-flash)');
    console.log('   5. Clé API: AIzaSyBedSTR_DeOiWuGB0Fj33OprBfGjHewzrY');
    console.log('');
  } else {
    console.log('\n❌ Aucun modèle disponible - Vérifiez votre quota');
  }
}

main();
