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
    const origem = String(data.origem || 'V').trim();

    const rawCustomerId = String(
        data.id ||
        data.cod_filial ||
        data.customerId ||
        ''
    ).trim();

    const customerId = rawCustomerId.startsWith(origem)
        ? rawCustomerId
        : `${origem}${rawCustomerId}`;

    const name = String(data.name || data.razao_social || data.nome || '').trim();
    const cpf = String(data.cpf || '').trim();
    const cnpj = String(data.cnpj || data.inscrfederal || '').trim();
    const city = String(data.city || data.cidade || data.cpf_cnpj || cnpj || cpf || '-').trim();
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
            city: cpf || cnpj || '-',
            comment: comentario || 'Vokkan'
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

module.exports = {
    syncCustomerToZnuny,
};
