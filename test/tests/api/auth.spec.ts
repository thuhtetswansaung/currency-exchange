import { test, expect } from "@playwright/test";

export const API_URL = "http://localhost:8080/api/v1";

test.describe('API test', () => {

    test.describe.configure({ mode: "serial" });
    //auth
    test.describe.serial("Auth", () => {

        test("should login successfully", async ({ request }) => {
            const res = await request.post(`${API_URL}/auth/login`, {
                data: {
                    email: "admin@gmail.com",
                    password: "admin123",
                },
            });

            expect(res.status()).toBe(201);

            const body = await res.json();

            expect(body.data).toHaveProperty("accessToken");
            expect(body.data).toHaveProperty("refreshToken");
            expect(body.data).toHaveProperty("email");

            expect(body.data.email).toBe("admin@gmail.com");
        });


        test("should reject invalid password", async ({ request }) => {
            const res = await request.post(`${API_URL}/auth/login`, {
                data: {
                    email: "admin@example.com",
                    password: "wrong-password",
                },
            });

            expect(res.status()).toBe(401);
        });


        test("should reject missing email", async ({ request }) => {
            const res = await request.post(`${API_URL}/auth/login`, {
                data: {
                    password: "Password123!",
                },
            });

            expect(res.status()).toBeGreaterThanOrEqual(400);
        });


        // test("should logout successfully", async ({ request }) => {

        //     const loginRes = await request.post(`${API_URL}/auth/login`, {
        //         data: {
        //             email: "admin@gmail.com",
        //             password: "admin123"
        //         }
        //     });

        //     const loginBody = await loginRes.json();



        //     await new Promise(resolve => setTimeout(resolve, 500));


        //     const accessToken = loginBody.data.accessToken;
        //     const refreshToken = loginBody.data.refreshToken;


        //     const logoutRes = await request.post(`${API_URL}/auth/logout`, {
        //         headers: {
        //             Authorization: `Bearer ${accessToken}`,
        //             "x-refresh-token": refreshToken
        //         }
        //     });

        //     expect(logoutRes.status()).toBe(200);

        // });

        test("should reject logout without access token", async ({ request }) => {
            const loginRes = await request.post(`${API_URL}/auth/login`, {
                data: {
                    email: "admin@gmail.com",
                    password: "admin123",
                },
            });

            const { refreshToken } = await loginRes.json();


            const logoutRes = await request.post(`${API_URL}/auth/logout`, {
                headers: {
                    "x-refresh-token": refreshToken,
                },
            });


            expect(logoutRes.status()).toBe(401);

            const body = await logoutRes.json();

            expect(body.message).toBe("Unauthorized, no token");
        });


        test("should reject logout without refresh token", async ({ request }) => {
            const loginRes = await request.post(`${API_URL}/auth/login`, {
                data: {
                    email: "admin@gmail.com",
                    password: "admin123",
                },
            });

            const { accessToken } = await loginRes.json();


            const logoutRes = await request.post(`${API_URL}/auth/logout`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });


            expect(logoutRes.status()).toBe(401);

            const body = await logoutRes.json();

            expect(body.message).toBe("Session expired");
        });


        test("should reject logout with expired access token", async ({ request }) => {

            const expiredToken = "expired.jwt.token";


            const logoutRes = await request.post(`${API_URL}/auth/logout`, {
                headers: {
                    Authorization: `Bearer ${expiredToken}`,
                    "x-refresh-token": "dummy-refresh-token",
                },
            });


            expect(logoutRes.status()).toBe(401);
        });


        test("should reject access to protected API after logout", async ({ request }) => {

            const loginRes = await request.post(`${API_URL}/auth/login`, {
                data: {
                    email: "admin@gmail.com",
                    password: "admin123",
                },
            });

            const { accessToken, refreshToken } = await loginRes.json();

            await request.post(`${API_URL}/auth/logout`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "x-refresh-token": refreshToken,
                },
            });

            const protectedRes = await request.get(`${API_URL}/transaction`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });


            expect(protectedRes.status()).toBe(401);
        });


        test("should reject refresh token after logout", async ({ request }) => {

            const loginRes = await request.post(`${API_URL}/auth/login`, {
                data: {
                    email: "admin@gmail.com",
                    password: "admin123",
                },
            });


            const { accessToken, refreshToken } = await loginRes.json();

            await request.post(`${API_URL}/auth/logout`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "x-refresh-token": refreshToken,
                },
            });

            const refreshRes = await request.post(`${API_URL}/auth/refresh`, {
                headers: {
                    "x-refresh-token": refreshToken,
                },
            });


            expect(refreshRes.status()).toBe(401);
        });

    });

})