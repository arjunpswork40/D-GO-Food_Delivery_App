const bcrypt = require('bcrypt');
require('dotenv').config();
const { makeJsonResponse } = require('./response');

module.exports = {
    timeZoneChange: async (localTimeFormat, timeZone,date) => {

        if(module.exports.isISO8601(date)) {
            const utcDate = new Date(date);
            if(module.exports.isValidTimezone(timeZone)){
                const updatedTimeZone = utcDate.toLocaleString(localTimeFormat, { timeZone: timeZone });
                return makeJsonResponse('TimeZone Changed', {date,updatedDate:updatedTimeZone,localTimeFormat,givecTimeZone:timeZone}, {}, 200, true);
            } else {
                return makeJsonResponse('TimeZone format is incorrect', {}, {date,localTimeFormat,timeZone}, 400, false);
            }
        } else {
            return makeJsonResponse('Date format is incorrect', {}, {date,localTimeFormat,timeZone}, 400, false);
        }
    },
    isISO8601: async (dateString) => {
        const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
        return iso8601Regex.test(dateString);
    },
    isValidTimezone: async (timezone) => {
        try {
            // Intl.DateTimeFormat will throw an error if timezone is invalid
            Intl.DateTimeFormat('en-US', { timeZone: timezone });
            return true;
        } catch (e) {
            return false;
        }
    }
}