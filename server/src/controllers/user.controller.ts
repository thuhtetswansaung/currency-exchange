import { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler";
import { buildQuery } from "../utils/pagination";
import UserService from "../services/user.service";
import { AuthRequest } from "../middlewares/authentication";

const userService = new UserService()

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
    const query = buildQuery(req)
    const result = await userService.getAllUsers(query);

    res.json({
        success: true,
        data: result.data,
        pagination: {
            page: result.page,
            total: result.total,
            totalPages: result.totalPages,
            limit: query.limit,
        }
    });
});

// export const getUserById = asyncHandler(async (req: Request, res: Response) => {

//   const { userId } = req.params as { userId: string };

//   const user = await userService.getUserById(userId);

//   res.json({
//     success: true,
//     data: user
//   });

// });

// export const getCurrentUser = asyncHandler( async (req: AuthRequest, res: Response) => {

//     const user = await userService.getUserById(req.user!._id);

//     res.json({
//       success: true,
//       data: user
//     });

//   }
// );

export const softDeleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {

  const { userId } = req.params as { userId: string };

  const result = await userService.softDeleteUser(userId)

  res.status(200).json(result);


});

export const restoreUser = asyncHandler(async (req: AuthRequest, res: Response) => {

  const { userId } = req.params as { userId: string };

  const result = await userService.restoreUser(userId)

  res.status(200).json(result);


});

export const permanentDeleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {

  const { userId } = req.params as { userId: string };

  const result = await userService.permanentDeleteUser(userId)

  res.status(200).json(result);


});
