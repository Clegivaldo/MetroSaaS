import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Consultar CNPJ via proxy
router.get('/:cnpj', authenticateToken, async (req, res) => {
  try {
    const { cnpj } = req.params;
    
    // Remove caracteres especiais do CNPJ
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    
    if (cnpjLimpo.length !== 14) {
      return res.status(400).json({ error: 'CNPJ deve ter 14 dígitos' });
    }

    // Fazer requisição para a API externa
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpjLimpo}`);
    
    if (!response.ok) {
      return res.status(500).json({ error: 'Erro na consulta do CNPJ' });
    }

    const data = await response.json();
    
    if (data.status === 'ERROR') {
      return res.status(404).json({ error: data.message || 'CNPJ não encontrado' });
    }

    // Retornar dados formatados
    const formattedData = {
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

    res.json(formattedData);
  } catch (error) {
    console.error('Erro ao consultar CNPJ:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;