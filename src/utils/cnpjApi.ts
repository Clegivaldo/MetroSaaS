// Função para consultar CNPJ na API pública
export async function consultarCNPJ(cnpj: string) {
  try {
    // Remove caracteres especiais do CNPJ
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    
    if (cnpjLimpo.length !== 14) {
      throw new Error('CNPJ deve ter 14 dígitos');
    }

    // Usando a API pública do ReceitaWS
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpjLimpo}`);
    
    if (!response.ok) {
      throw new Error('Erro na consulta do CNPJ');
    }

    const data = await response.json();
    
    if (data.status === 'ERROR') {
      throw new Error(data.message || 'CNPJ não encontrado');
    }

    return {
      nome: data.nome || data.fantasia,
      razaoSocial: data.nome,
      nomeFantasia: data.fantasia,
      cnpj: data.cnpj,
      email: data.email,
      telefone: data.telefone,
      endereco: data.logradouro,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      cidade: data.municipio,
      estado: data.uf,
      cep: data.cep,
      situacao: data.situacao,
      atividade: data.atividade_principal?.[0]?.text
    };
  } catch (error) {
    console.error('Erro ao consultar CNPJ:', error);
    throw error;
  }
}

// Função para formatar CNPJ
export function formatarCNPJ(cnpj: string): string {
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
  return cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

// Função para validar CNPJ
export function validarCNPJ(cnpj: string): boolean {
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
  
  if (cnpjLimpo.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpjLimpo)) return false;
  
  // Validação dos dígitos verificadores
  let soma = 0;
  let peso = 2;
  
  for (let i = 11; i >= 0; i--) {
    soma += parseInt(cnpjLimpo.charAt(i)) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  
  const digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  
  if (parseInt(cnpjLimpo.charAt(12)) !== digito1) return false;
  
  soma = 0;
  peso = 2;
  
  for (let i = 12; i >= 0; i--) {
    soma += parseInt(cnpjLimpo.charAt(i)) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  
  const digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  
  return parseInt(cnpjLimpo.charAt(13)) === digito2;
}