const db = require('../database');

const sync = async (req, res) => {

  const companies = req.body;

  try {

    for (const item of companies) {

      await db.query(
        `
        UPDATE customer_company
        SET
          name = $1,
          city = $2,
          comments = $3
        WHERE customer_id = $4
        `,
        [
          item.name,
          item.city,
          item.comments,
          item.customer_id
        ]
      );

    }

    return res.status(200).json({
      success: true,
      message: 'Atualizado com sucesso'
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      error: error.message
    });

  }

};

module.exports = {
  sync
};