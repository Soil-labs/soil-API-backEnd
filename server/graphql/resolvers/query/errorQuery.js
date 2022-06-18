const { ErrorLog } = require('../../../models/error');

module.exports = {
            errors: async (parent, args, context, info) => {
            try {
                const errors = await ErrorLog.find({})

                const stringErrors = errors.map(err => {
                    err = err.toJSON();
                    if (err.createdAt) err.createdAt = Date(err.createdAt)
                    return err
                }) 

                return stringErrors
            } catch (err) {
                throw err
            }
        }
}