import { User } from "../models/user";
import { IUpdateUser, IUser } from "../interface/IUser";
import { AppError } from "../utils/app-error";
import bcrypt from 'bcrypt'
import generateTokens from "../utils/token";
import { redis } from "../config/redis";
import { config } from "../config/config";
import jwt from 'jsonwebtoken'
import { bumpVersion } from "../utils/cache-version";

class AuthService {
    async register(data: IUser) {
        const existiingUser = await User.findOne({ email: data.email })

        if (existiingUser) {
            throw new AppError("User already exists", 409)
        }

        const hashPassword = await bcrypt.hash(data.password, 10)

        const user = await User.create({
            ...data,
            password: hashPassword
        })

        await bumpVersion("users:version")

        return { data: user }
    }

    async login(email: string, password: string) {

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            throw new AppError("Invalid credentials", 401);
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            throw new AppError("Invalid credentials", 401);
        }

        if (user.isActive === false) {
            throw new AppError("User is inactive", 400);
        }

        const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.role);

        await redis.set(`rt:${refreshToken}`, user._id.toString(), {
            EX: 7 * 24 * 60 * 60
        })

        return {
            accessToken,
            refreshToken,
            name: user.name,
            email: user.email,
            role: user.role
        };
    }

    async refresh(refreshToken: string) {
        try {
            const decoded: any = jwt.verify(
                refreshToken,
                config.JWT_REFRESH_TOKEN!
            );

            const stored = await redis.get(`rt:${refreshToken}`);

            if (!stored) {
                throw new AppError("Invalid refresh token", 401);
            }

            const user = await User.findById(decoded.id);

            if (!user) {
                throw new AppError("User not found", 404);
            }

            if (user.isActive === false) {
                throw new AppError("User is inactive", 400);
            }

            const tokens = generateTokens(user._id.toString(), user.role);

            await redis.del(`rt:${refreshToken}`);
            await redis.set(`rt:${tokens.refreshToken}`, user._id.toString(), {
                EX: 7 * 24 * 60 * 60
            });

            return tokens;

        } catch {
            throw new AppError("Invalid refresh token", 401);
        }
    }


    async logout(accessToken: string, refreshToken: string) {
        let decoded: any;

        try {
            decoded = jwt.verify(accessToken, config.JWT_ACCESS_TOKEN!);
        } catch {
            throw new AppError("Invalid or expired access token", 401);
        }

        if (!decoded?.exp) {
            throw new AppError("Invalid token payload", 400);
        }

        const expiresIn = Math.max(
            decoded.exp - Math.floor(Date.now() / 1000),
            0
        );

        // blacklist access token
        await redis.set(`bl:${accessToken}`, "true", {
            EX: expiresIn,
        });

        // delete refresh token
        await redis.del(`rt:${refreshToken}`);

        return true;
    }

    async changePassword(userId: string, newPassword: string) {

        const user = await User.findById(userId).select('+password');

        if (!user) {
            throw new AppError("User not found", 404);
        }

        const samePasswrod = await bcrypt.compare(newPassword, user.password);

        if (samePasswrod) {
            throw new AppError("New password must be different", 401);
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        await bumpVersion("users:version")

        return true
    }

    async updateUser(userId: string, data: IUpdateUser) {
        const { ...updateData } = data;

        const user = await User.findById(userId)

        if (!user) {
            throw new AppError("User not found", 404);
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        await bumpVersion("users:version")
        await bumpVersion('transaction:version')
        await bumpVersion('transactions:version')

        return {
            data: updatedUser
        };
    }

}

export default AuthService