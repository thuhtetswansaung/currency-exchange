import { redis } from "../config/redis";


export const setCache = async(key: string, value: any, timeout: 60) => {
    try {
        await redis.set(key, JSON.stringify(value))
        await redis.expire(key, timeout)
    } catch (error) {
        console.error("Redis SET error:", error);
    }
}


export const getCache = async(key: string) => {
    try {
        const data = await redis.get(key)
        if(!data) return null
        return JSON.parse(data)
    } catch (error) {
        console.error("Redis GET error:", error);
        return null;
    }
}