/**
 * Test OpenAI API
 * Usage: node test-openai.js YOUR_API_KEY
 */

const apiKey = process.argv[2];

if (!apiKey) {
  console.log('❌ Usage: node test-openai.js YOUR_API_KEY');
  console.log('\n💡 Obtenez votre clé sur: https://platform.openai.com/api-keys');
  process.exit(1);
}

async function testOpenAI() {
  console.log('🔍 Test de la clé API OpenAI...\n');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Réponds juste "OK" si tu me reçois.' }
        ],
        temperature: 0.7,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('❌ Erreur API OpenAI:');
      console.log(JSON.stringify(error, null, 2));

      if (error.error?.code === 'insufficient_quota') {
        console.log('\n💡 Votre clé n\'a plus de crédit (expected "no money")');
        console.log('   Mais la clé est valide !');
      }
      return;
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';

    console.log('✅ OpenAI fonctionne !');
    console.log('\n📝 Réponse:', text);
    console.log('\n💰 Usage:');
    console.log(`  - Tokens: ${data.usage.total_tokens}`);
    console.log(`  - Coût estimé: ~$${(data.usage.total_tokens / 1000 * 0.001).toFixed(5)}`);

  } catch (error) {
    console.log('❌ Erreur réseau:', error.message);
  }
}

testOpenAI();
