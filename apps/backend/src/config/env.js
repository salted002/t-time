require('dotenv').config()

const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwt: {
    secret: process.env.JWT_SECRET || 'secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  bcrypt: {
    saltRounds: parseInt(process.env.SALT_ROUNDS || '10', 10),
  },
  sms: {
    apiKey: process.env.COOLSMS_API_KEY || '',
    apiSecret: process.env.COOLSMS_API_SECRET || '',
  },
  ai: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    apiKey: process.env.AZURE_OPENAI_API_KEY || '',
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || '',
  },
}

module.exports = config
