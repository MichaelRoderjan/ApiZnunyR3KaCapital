const {
    addCustomerCompanyAdd,
    addCustomerUserAdd,
} = require('./znunyConsoleService');

function extractEmails(value) {
    const regex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
    const emails = String(value || '').match(regex) || [];

    return [...new Set(emails.map((email) => email.toLowerCase()))];
}

function makeLogin(email, customerId) {
    const [local, domainFull = ''] = email.split('@');
    const domain = domainFull.split('.')[0];

    return `${local}_${domain}_${customerId}`
        .replace(/[^a-zA-Z0-9._-]/g, '')
        .substring(0, 80);
}

async function syncCustomerToZnuny(data) {
    const origem = String(data.origem || '').trim();

    const rawCustomerId = String(
        data.id ||
        data.cod_filial ||
        data.customerId ||
        ''
    ).trim();

    const customerId = rawCustomerId;

    const name = String(data.name || data.razao_social || data.nome || '').trim();
    const city = formatCpfCnpj(data.cpf_cnpj).trim();
    const comentario = String(data.comentario || data.comment || '').trim();
    const emailField = `${data.email || ''};${data.email_extra || ''};${data.emails || ''}`;

    if (!rawCustomerId) throw new Error('ID do cliente não informado.');
    if (!name) throw new Error('Nome/Razão Social não informado.');

    const emails = extractEmails(emailField);

    if (!emails.length) throw new Error('Nenhum e-mail válido encontrado.');

    const result = {
        origem,
        rawCustomerId,
        customerId,
        comentario,
        company: null,
        users: [],
        errors: [],
    };

    try {
        result.company = await addCustomerCompanyAdd({
            customerId,
            name,
            city: city || '-',
            comment: comentario || ''
        });
    } catch (error) {
        result.errors.push({
            step: 'company',
            customerId,
            message: error.message,
            stderr: error.stderr,
        });
    }

    for (const email of emails) {
        const login = makeLogin(email, customerId);

        try {
            const created = await addCustomerUserAdd({
                login,
                customerId,
                email,
                firstName: name.substring(0, 50),
                lastName: 'Cliente',
                comment: comentario,
            });

            result.users.push({
                email,
                login,
                customerId,
                status: 'created',
                response: created,
            });
        } catch (error) {
            result.errors.push({
                step: 'user',
                customerId,
                email,
                login,
                message: error.message,
                stderr: error.stderr,
            });
        }
    }

    return result;
}

//converte string de 11 ou 14 dígitos para formato de CPF ou CNPJ respectivamente
function formatCpfCnpj(celula) {

    let formatado = "";

    if (celula.length === 11) {
        // CPF
        for (let i = 0; i < celula.length; i++) {
            formatado += celula[i];

            if (i === 2 || i === 5) {
                formatado += ".";
            } else if (i === 8) {
                formatado += "-";
            }
        }
    } else if (celula.length === 14) {
        // CNPJ
        for (let i = 0; i < celula.length; i++) {
            formatado += celula[i];

            if (i === 1 || i === 4) {
                formatado += ".";
            } else if (i === 7) {
                formatado += "/";
            } else if (i === 11) {
                formatado += "-";
            }
        }
    } else {
        return celula;
    }

    return formatado;
}

module.exports = {
    syncCustomerToZnuny,
};
