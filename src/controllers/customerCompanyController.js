const db = require('../database');
const { getContatos } = require('./sienge1Controller');

//Altera dados de clientes na tabela customer_company do Znuny, usando o customer_id como referência. Pode ser enviado um array de objetos ou um único objeto no body da requisição. O campo customer_id é obrigatório para identificar qual registro atualizar, os demais campos são opcionais e serão atualizados apenas se fornecidos.
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
            const customerId = req.params.customerId || item.customer_id || item.customerId || item.id;
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
      AND (
            name IS DISTINCT FROM COALESCE($1, name)
         OR city IS DISTINCT FROM COALESCE($2, city)
         OR comments IS DISTINCT FROM COALESCE($3, comments)
      )
    RETURNING customer_id, name, city, comments
    `,
                [
                    name || null,
                    city || null,
                    comments || null,
                    customerId
                ]
            );

            if (result.rows.length === 0) {
                console.log('Nenhuma alteração detectada');
            } else {
                console.log('Registro atualizado:', result.rows[0]);
            }

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

async function createCustomerCompany(customerId, name, city, comments) {
    try {
        const result = await db.query(
            `
    UPDATE customer_company
    SET
        name = COALESCE($1, name),
        city = COALESCE($2, city),
        comments = COALESCE($3, comments)
    WHERE customer_id = $4
      AND (
            name IS DISTINCT FROM COALESCE($1, name)
         OR city IS DISTINCT FROM COALESCE($2, city)
         OR comments IS DISTINCT FROM COALESCE($3, comments)
      )
    RETURNING customer_id, name, city, comments
    `,
            [
                name || null,
                city || null,
                comments || null,
                customerId
            ]
        );

        return result.rows[0];

    } catch (error) {
        console.error('Erro ao inserir:', error);
        throw error;
    }
}

module.exports = {
    sync,
    createCustomerCompany
};
