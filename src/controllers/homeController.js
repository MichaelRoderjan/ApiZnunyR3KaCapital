exports.home = (req, res) => {
    res.send(`<strong>A API foi aberta na data ${process.env.CREATION_DATE}</strong>`);
};