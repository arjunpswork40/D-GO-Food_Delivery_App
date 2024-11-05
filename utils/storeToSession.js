module.exports = {

    storeCategorySaveOldFormValuesAndErrorsToSession: (req, formValues, formErrors) => {
        delete req.session.formValidationError;
        req.session.formValidationError = [formErrors];
        delete req.session.oldFormValues;
        req.session.oldFormValues = formValues;
    }

};
