/**
 * Diagnostic complet Gemini API
 */

const apiKey = 'AIzaSyBedSTR_DeOiWuGB0Fj33OprBfGjHewzrY';

console.log('🔍 DIAGNOSTIC GEMINI API\n');
console.log('📋 Clé API:', apiKey);
console.log('');

async function listModels() {
  console.log('📚 1. Liste des modèles disponibles...\n');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      const error = await response.json();
      console.log('❌ Erreur:', error.error?.message);

      if (error.error?.status === 'PERMISSION_DENIED') {
        console.log('\n💡 SOLUTION:');
        console.log('   1. Allez sur: https://aistudio.google.com/app/apikey');
        console.log('   2. Activez "Generative Language API"');
        console.log('   3. Vérifiez que votre clé a les permissions');
      }

      return null;
    }

    const data = await response.json();
    console.log(`✅ ${data.models?.length || 0} modèles trouvés:\n`);

    if (data.models) {
      data.models.forEach(model => {
        const name = model.name.replace('models/', '');
        const methods = model.supportedGenerationMethods || [];
        console.log(`   - ${name}`);
        console.log(`     Méthodes: ${methods.join(', ')}`);
      });
    }

    return data.models;
  } catch (error) {
    console.log('❌ Erreur réseau:', error.message);
    return null;
  }
}

async function testModel(modelName) {
  console.log(`\n📝 2. Test du modèle: ${modelName}...\n`);

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
            parts: [{ text: 'Dis juste "OK"' }]
          }]
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.log('❌ Erreur:', error.error?.message);

      if (error.error?.message?.includes('quota')) {
        console.log('\n💡 SOLUTION QUOTA:');
        console.log('   - Attendez 24h pour reset du quota gratuit');
        console.log('   - OU activez la facturation sur: https://console.cloud.google.com/');
        console.log('   - OU créez un nouveau projet Google Cloud');
      }

      return false;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('✅ FONCTIONNE !');
    console.log('   Réponse:', text);
    return true;
  } catch (error) {
    console.log('❌ Erreur:', error.message);
    return false;
  }
}

async function main() {
  const models = await listModels();

  if (models && models.length > 0) {
    // Tester le premier modèle disponible
    const firstModel = models[0].name.replace('models/', '');
    await testModel(firstModel);
  }

  console.log('\n\n📊 RÉSUMÉ:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('🔑 Votre clé API:', apiKey.substring(0, 20) + '...');
  console.log('');
  console.log('📍 Pour vérifier votre quota:');
  console.log('   https://ai.dev/usage');
  console.log('');
  console.log('🛠️  Pour gérer vos clés:');
  console.log('   https://aistudio.google.com/app/apikey');
  console.log('');
  console.log('💰 Limites gratuites Gemini:');
  console.log('   - 15 requêtes/minute');
  console.log('   - 1500 requêtes/jour');
  console.log('   - 1M tokens/jour');
  console.log('');
}

main();
