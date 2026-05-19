import { User } from "../models/user";
import { QueryOptions } from "../utils/pagination";
import { AppError } from "../utils/app-error";
import { bumpVersion, getVersion } from "../utils/cache-version";
import { getCache, setCache } from "../utils/cache";

class UserService {
  async getAllUsers(query: QueryOptions) {

    const version:any = await getVersion("users:version")
    const cacheKey = `users:v${version}:${JSON.stringify(query)}`
    const cached = await getCache(cacheKey)
    if (cached) {
      console.log("Cache hit user");
      return cached;
    }

    console.log("Cache miss user");

    const { page, limit, skip, search, sortBy, order, isActive } = query;

    const filter: any = {isActive: isActive ?? true };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ [sortBy]: order === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    const result = {
      data: users,
        total,
        page,
        totalPages: limit > 0 ? Math.ceil(total / limit) : 1
    }

    await setCache(cacheKey, result, 60)

    return result;
  }

  // async getUserById(userId: string){
  //   const user = await User.findById(userId).select({
  //       name: 1,
  //       email: 1,
  //       role: 1,
  //       isActive: 1
  //   })

  //   if(!user){
  //       throw new AppError('No user found', 404)
  //   }

  //   return {
  //       data: user
  //   }
  // }

  async softDeleteUser(userId: string) {

        const user = await User.findById(userId)

        if (!user) {
            throw new AppError("User not found", 404);
        }

        await User.updateOne(
            {_id:userId},
            {isActive: false}
        )

        await bumpVersion("users:version")
        await bumpVersion('transaction:version')
        await bumpVersion('transactions:version')

        return true
    }

    async restoreUser(userId: string){
        const user = await User.findById(userId);

        if (!user) {
            throw new AppError("User not found", 404);
        }

        if (user.isActive === true) {
            throw new AppError("User is not archived", 400);
        }

        await User.updateOne(
            {_id: userId},
            {isActive: true}
        );

        await bumpVersion("users:version")
        await bumpVersion('transaction:version')
        await bumpVersion('transactions:version')

        return true
    }

    async permanentDeleteUser(userId: string) {

        const user = await User.findById(userId);

        if (!user) {
            throw new AppError("user not found", 404)
        }

        await User.deleteOne({_id:userId})

        await bumpVersion("users:version")
        await bumpVersion('transaction:version')
        await bumpVersion('transactions:version')

        return true
    }
}

export default UserService;