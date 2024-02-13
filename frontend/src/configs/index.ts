export interface ConfigProperties {
    BASE_API: string
    BASE_IMAGE:string
}

const env = process.env.REACT_APP_ENV || 'dev'
const config = require(`./${env}`)

export default config.default
