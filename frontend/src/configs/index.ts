import development from "./development.ts";
import docker from "./docker.ts";


export interface ConfigProperties {
    BASE_API: string
}

const mode = import.meta.env.MODE

const configs: { [key: string]: ConfigProperties } = {
    development,
    docker,
}

export default configs[mode]
