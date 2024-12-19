const mongoose = require("mongoose")
const Schema = mongoose.Schema


const applicationStaticSchema = new Schema(
    {
        heading: {
            type: String,
            required: true
          },
          description: {
              type: String,
              required: true
          },
          createdAt: {
              type: Date,
              default: Date.now,
          },
          updatedAt: {
              type: Date,
              default: Date.now,
          },
    },
    {
        timestamps: true,
    }
  )
  
module.exports = mongoose.model('ApplicationStatic', applicationStaticSchema)