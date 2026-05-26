exports.home = (req, res) => {
    res.send(`<strong>A API foi aberta na data ${process.env.CREATION_DATE}</strong>`);
};

const { exec } = require('child_process');

exports.clearCache = async (req, res) => {
    const cmd1 = 'sudo -u znuny /opt/znuny/bin/znuny.Console.pl Maint::Cache::Delete';
    const cmd2 = 'sudo -u znuny /opt/znuny/bin/znuny.Console.pl Maint::Loader::CacheCleanup';

    exec(cmd1, (err1, stdout1, stderr1) => {
        if (err1) {
            return res.status(500).json({
                error: 'Erro ao executar Maint::Cache::Delete',
                details: stderr1 || err1.message
            });
        }

        exec(cmd2, (err2, stdout2, stderr2) => {

            if (err2) {
                return res.status(500).json({
                    error: 'Erro ao executar Maint::Loader::CacheCleanup',
                    details: stderr2 || err2.message
                });
            }

            return res.json({
                success: true,
                cacheDelete: stdout1,
                cacheCleanup: stdout2
            });
        });
    });
};