const SiengeContatoService = require('../services/siengeContatoService');
const { syncCustomerToZnuny } = require('../services/customerSyncService');

const getContatos = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 0;
        const ignoreCache = req.query.ignoreCache === 'true';
        const user = req.query.user || '';

        const resultado = await SiengeContatoService.listarContatos({
            limit,
            ignoreCache,
            user,
        });

        return res.status(200).json(resultado);

    } catch (error) {
        console.error('Erro ao buscar contatos:', error);

        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar contatos.',
            detalhe: error.message,
        });
    }
};

const sincronizarClienteZnuny = async (req, res) => {
    try {
        const resultadoContatos = await SiengeContatoService.listarContatos({
            limit: 0,
            ignoreCache: true,
        });

        const contatos = resultadoContatos.dados;

        const resultadoSync = {
            total: contatos.length,
            sincronizados: 0,
            falhas: [],
        };

        for (const cliente of contatos) {
            try {
                await syncCustomerToZnuny(cliente);
                resultadoSync.sincronizados++;
            } catch (error) {
                resultadoSync.falhas.push({
                    clienteId: cliente.id,
                    nome: cliente.name,
                    email: cliente.email,
                    erro: error.message,
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Sincronização com Znuny finalizada.',
            resultado: resultadoSync,
        });

    } catch (error) {
        console.error('Erro ao sincronizar clientes com Znuny:', error);

        return res.status(500).json({
            success: false,
            message: 'Erro ao sincronizar clientes com Znuny.',
            detalhe: error.message,
        });
    }
};

module.exports = {
    getContatos,
    sincronizarClienteZnuny,
};