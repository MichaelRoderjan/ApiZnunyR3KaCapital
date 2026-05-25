const db = require('../database');

const sync = async (req, res) => {
    const companies = Array.isArray(req.body) ? req.body : [req.body];

    try {
        if (!companies.length) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum cliente enviado para atualização.',
            });
        }

        const atualizados = [];

        for (const item of companies) {
            const customerId = item.customer_id || item.customerId || item.id;
            const name = item.name || item.nome || item.razao_social;
            const city = item.city || item.cidade || item.cpf_cnpj || '-';
            const comments = item.comments || item.comment || item.comentario || 'Vokkan';

            if (!customerId) {
                throw new Error('customer_id/customerId não informado.');
            }

            const result = await db.query(
                `
                UPDATE customer_company
                SET
                    name = COALESCE($1, name),
                    city = COALESCE($2, city),
                    comments = COALESCE($3, comments)
                WHERE customer_id = $4
                RETURNING customer_id, name, city, comments
                `,
                [
                    name || null,
                    city || null,
                    comments || null,
                    customerId
                ]
            );

            atualizados.push({
                customerId,
                atualizado: result.rowCount > 0,
                dados: result.rows[0] || null,
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Atualização finalizada.',
            total: atualizados.length,
            atualizados,
        });

    } catch (error) {
        console.error('Erro ao atualizar customer_company:', error);

        return res.status(500).json({
            success: false,
            message: 'Erro ao atualizar customer_company.',
            error: error.message
        });
    }
};

module.exports = {
    sync
};
