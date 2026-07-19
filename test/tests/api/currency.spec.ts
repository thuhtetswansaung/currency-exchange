import test, { expect } from "@playwright/test";

export const API_URL = "http://localhost:8080/api/v1";

function generateCurrencyCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const letter = chars[Math.floor(Math.random() * chars.length)];
    const number = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");

    return `${letter}${number}`;
}


test.describe('Currency API Test', () => {
    test.describe("Currency Conversion", () => {

        const USD_ID = "69c6039c831c0fd1f39252f5";
        const EUR_ID = "6a0595b246f2bfd6adfade68";
        const JPY_ID = "6a04691cbce9b151d35d04d3";
        const INACTIVE_CURRENCY_ID = "6a0c2314a28ec0f4b69f412a";



        test("should convert currency directly", async ({ request }) => {

            const res = await request.post(`${API_URL}/conversion`, {
                data: {
                    fromCurrency: USD_ID,
                    toCurrency: EUR_ID,
                    amount: 100
                }
            });


            expect(res.status()).toBe(200);


            const body = await res.json();


            expect(body.success).toBe(true);

            expect(body.data.type)
                .toBe("direct");

            expect(body.data.steps.length)
                .toBe(1);

            expect(body.data.finalAmount)
                .toBeGreaterThan(0);

            expect(body.data.finalRate)
                .toBeGreaterThan(0);

        });



        test("should convert currency using bridge rate", async ({ request }) => {

            const res = await request.post(`${API_URL}/conversion`, {
                data: {
                    fromCurrency: EUR_ID,
                    toCurrency: JPY_ID,
                    amount: 100
                }
            });


            expect(res.status()).toBe(200);


            const body = await res.json();


            expect(body.success)
                .toBe(true);


            expect(body.data.type)
                .toBe("bridge");


            expect(body.data.steps.length)
                .toBe(2);


            expect(body.data.finalAmount)
                .toBeGreaterThan(0);

        });



        test("should reject invalid currency", async ({ request }) => {

            const res = await request.post(`${API_URL}/conversion`, {
                data: {
                    fromCurrency: "654321abcdef000000000000",
                    toCurrency: EUR_ID,
                    amount: 100
                }
            });


            expect(res.status())
                .toBe(400);


            const body = await res.json();


            expect(body.message)
                .toBe("Selected currency no longer exists");

        });



        test("should reject inactive currency", async ({ request }) => {

            const res = await request.post(`${API_URL}/conversion`, {
                data: {
                    fromCurrency: INACTIVE_CURRENCY_ID,
                    toCurrency: EUR_ID,
                    amount: 100
                }
            });


            expect(res.status())
                .toBe(400);


            const body = await res.json();


            expect(body.message)
                .toBe("Selected currency no longer exists");

        });


    });

    test.describe("Currency Management", () => {
        let accessToken = "";

        test.beforeAll(async ({ request }) => {
            const loginRes = await request.post(`${API_URL}/auth/login`, {
                data: {
                    email: "admin@gmail.com",
                    password: "admin123",
                },
            });

            expect(loginRes.status()).toBe(201);

            const body = await loginRes.json();
            accessToken = body.data.accessToken;
        });

        test("should get all currencies", async ({ request }) => {
            const res = await request.get(`${API_URL}/currency`);

            expect(res.status()).toBe(200);

            const body = await res.json();

            expect(body.success).toBe(true);
            expect(body.data.length).toBeGreaterThan(0);
        });

        test("should create currency successfully", async ({ request }) => {
            const code = generateCurrencyCode()

            const res = await request.post(`${API_URL}/currency`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    code,
                    name: "Test Currency",
                    symbol: "$",
                },
            });

            const body = await res.json();

            if (res.status() !== 201) {
                console.error(body);
            }

            expect(res.status()).toBe(201);



            expect(body.data).toBeDefined();

            expect(body.success).toBe(true);
            expect(body.data.code).toBe(code);
        });

        test("should reject duplicate currency code", async ({ request }) => {
            const res = await request.post(`${API_URL}/currency`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    code: "USD",
                    name: "Duplicate",
                    symbol: "$",
                },
            });

            expect(res.status()).toBe(400);

            const body = await res.json();

            expect(body.message).toBe("Currency code already exists");
        });

        test("should update currency", async ({ request }) => {
            const create = await request.post(`${API_URL}/currency`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    code: generateCurrencyCode(),
                    name: "Old Name",
                    symbol: "$",
                },
            });

            expect(create.status()).toBe(201);
            const created = await create.json();
            expect(created.data).toBeDefined();


            const res = await request.put(
                `${API_URL}/currency/${created.data._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    data: {
                        name: "Updated Name",
                    },
                }
            );

            const body = await res.json();

            if (res.status() !== 201) {
                console.error(body);
            }

            expect(res.status()).toBe(200);

            expect(body.data.name).toBe("Updated Name");
        });

        test("should archive currency", async ({ request }) => {
            const create = await request.post(`${API_URL}/currency`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    code: generateCurrencyCode(),
                    name: "Archive",
                    symbol: "$",
                },
            });

            expect(create.status()).toBe(201);
            const created = await create.json();
            expect(created.data).toBeDefined();

            const res = await request.patch(
                `${API_URL}/currency/${created.data._id}/archive`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            expect(res.status()).toBe(200);
        });

        test("should restore currency", async ({ request }) => {
            const create = await request.post(`${API_URL}/currency`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    code: generateCurrencyCode(),
                    name: "Restore",
                    symbol: "$",
                },
            });

            expect(create.status()).toBe(201);
            const created = await create.json();
            expect(created.data).toBeDefined();


            await request.patch(
                `${API_URL}/currency/${created.data._id}/archive`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            const restore = await request.patch(
                `${API_URL}/currency/${created.data._id}/restore`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            expect(restore.status()).toBe(200);
        });

        test("should delete currency", async ({ request }) => {
            const create = await request.post(`${API_URL}/currency`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    code: generateCurrencyCode(),
                    name: "Delete",
                    symbol: "$",
                },
            });
            expect(create.status()).toBe(201);
            const created = await create.json();
            expect(created.data).toBeDefined();
            const res = await request.delete(
                `${API_URL}/currency/${created.data._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            expect(res.status()).toBe(200);
        });
    });
})
