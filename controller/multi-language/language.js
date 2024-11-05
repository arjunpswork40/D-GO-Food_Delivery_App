const { makeJsonResponse } = require("../../utils/response")
const English = require("../../utils/multi-language-dictionaries/english")
const Portuguese = require("../../utils/multi-language-dictionaries/portuguese")
const AvailableLanguages = require("../../utils/multi-language-dictionaries/availableLanguages");

class controller {
  static async changeLanguage(req, res, next) {
      const { language } = req.body
      const availableLanguages = AvailableLanguages.languages;
      if(availableLanguages.includes(language)) {
        try {
          let dictionary  = English.language;
          switch(language) {
            case 'portuguese':
              dictionary = Portuguese.Portuguese;
            default:
              dictionary = dictionary;
          }
  
  
          return res.status(200).json(makeJsonResponse('Language Dictinory', {}, { message:`Language dictinory for ${language}`,dictionary }, 200, true));
        } catch (error) {
          console.log(error);
          
            return res.status(500).json(makeJsonResponse('Internal Error', {}, { message: error.message ?? "Internal error occured" }, 500, false));
        }
      } else {
        return res.status(400).json(makeJsonResponse('Language not supported', {}, { message:  `${language} is not available`  }, 400, false));
      }
      
  }
}


module.exports = controller