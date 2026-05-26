const { execFile } = require('child_process');

function runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
        execFile(command, args, { timeout: 120000 }, (error, stdout, stderr) => {
            if (error) {
                return reject({
                    message: error.message,
                    stdout,
                    stderr,
                });
            }

            resolve(stdout);
        });
    });
}

async function runZnunyConsole(args) {
    const znunyConsole = process.env.ZNUNY_CONSOLE || '/opt/znuny/bin/znuny.Console.pl';
    const znunyUser = process.env.ZNUNY_USER || 'znuny';

    return runCommand('sudo', [
        '-u',
        znunyUser,
        znunyConsole,
        ...args,
    ]);
}

async function addCustomerCompanyAdd({ customerId, name, city, comment }) {
    return runZnunyConsole([
        'Admin::CustomerCompany::Add',
        '--customer-id', customerId,
        '--name', name,
        '--city', city || '-',
        '--comment', comment || 'Vokkan',
        '--no-ansi',
    ]);

    addCustomerCompanyUpdate({ customerId, name, city, comment });
}

async function addCustomerCompanyUpdate({ customerId, name, city, comment }) {
    return runZnunyConsole([
        'Admin::CustomerCompany::Update',
        '--customer-id', customerId,
        '--name', name,
        '--city', city || '-',
        '--comment', comment || 'Vokkan',
        '--no-ansi',
    ]);
}

async function addCustomerUserAdd({ login, customerId, email, firstName, lastName }) {
    return runZnunyConsole([
        'Admin::CustomerUser::Add',
        '--user-name', login,
        '--first-name', firstName,
        '--last-name', lastName || 'Cliente',
        '--email-address', email,
        '--customer-id', customerId,
        '--no-ansi',
    ]);

    addCustomerUserUpdate({ login, customerId, email, firstName, lastName });
}

async function addCustomerUserUpdate({ login, customerId, email, firstName, lastName }) {
    return runZnunyConsole([
        'Admin::CustomerUser::Update',
        '--user-name', login,
        '--first-name', firstName,
        '--last-name', lastName || 'Cliente',
        '--email-address', email,
        '--customer-id', customerId,
        '--no-ansi',
    ]);
}

module.exports = {
    addCustomerCompanyAdd,
    addCustomerCompanyUpdate,
    addCustomerUserAdd,
    addCustomerUserUpdate,
};
