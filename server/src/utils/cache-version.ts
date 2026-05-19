import { redis } from "../config/redis"

export const getVersion = async(key: string) => {
    const version = await redis.get(key)
    return version || '1'
}

export const bumpVersion = async(key: string) => {
    await redis.incr(key)
}