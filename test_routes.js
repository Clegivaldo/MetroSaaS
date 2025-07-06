import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001/api';

async function testRoutes() {
  console.log('Testando rotas do sistema...\n');

  // Teste 1: Verificar se o servidor está rodando
  try {
    const response = await fetch(`${BASE_URL}/users`);
    console.log('✅ Servidor está rodando');
  } catch (error) {
    console.log('❌ Servidor não está rodando');
    return;
  }

  // Teste 2: Testar rota de categorias de documentos
  try {
    const response = await fetch(`${BASE_URL}/document-categories`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Rota de categorias de documentos funcionando');
      console.log(`   Encontradas ${data.length} categorias`);
    } else {
      console.log('❌ Erro na rota de categorias de documentos');
    }
  } catch (error) {
    console.log('❌ Erro ao acessar categorias de documentos:', error.message);
  }

  // Teste 3: Testar rota de documentos
  try {
    const response = await fetch(`${BASE_URL}/documents`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Rota de documentos funcionando');
      console.log(`   Encontrados ${data.length} documentos`);
    } else {
      console.log('❌ Erro na rota de documentos');
    }
  } catch (error) {
    console.log('❌ Erro ao acessar documentos:', error.message);
  }

  // Teste 4: Testar rota de padrões
  try {
    const response = await fetch(`${BASE_URL}/standards`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Rota de padrões funcionando');
      console.log(`   Encontrados ${data.length} padrões`);
    } else {
      console.log('❌ Erro na rota de padrões');
    }
  } catch (error) {
    console.log('❌ Erro ao acessar padrões:', error.message);
  }

  console.log('\nTeste concluído!');
}

testRoutes().catch(console.error); 