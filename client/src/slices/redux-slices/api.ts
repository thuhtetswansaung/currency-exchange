import { createApi, fetchBaseQuery, type BaseQueryFn } from "@reduxjs/toolkit/query/react"


const baseUrl = 
    import.meta.env.VITE_MODE === 'development'?
    import.meta.env.VITE_LOCAL_API_URL : 
    import.meta.env.VITE_API_URL 

const baseQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) =>{
        const accessToken = localStorage.getItem('accessToken')
        const refreshToken = localStorage.getItem('refreshToken')

        if(accessToken){
            headers.set("Authorization", `Bearer ${accessToken}`)
        }

        if(refreshToken){
            headers.set("x-refresh-token", `${refreshToken}`)
        }

        return headers
    }
})

const baseQueryWithReAuth: BaseQueryFn = async(args, api, extraOptions) =>{
    let result: any = await baseQuery(args, api, extraOptions)

    if(result.error && result.error.status === 401){
        const refreshToken = localStorage.getItem("refreshToken")

        if(!refreshToken) return result

        const refreshResult: any = await baseQuery(
            {
            url: "/auth/refresh",
            method: "POST"
            },
            api,
            extraOptions
        )

        if(refreshResult.data){
            const { accessToken, refreshToken: newRefreshToken} = refreshResult.data.data
            
            localStorage.setItem("accessToken", accessToken)
            localStorage.setItem("refreshToken", newRefreshToken)

            result = await baseQuery(args, api, extraOptions)
        }
        else{
            localStorage.removeItem("accessToken")
            localStorage.removeItem("refreshToken")
        }
    }
    return result
}

export const apiSlice = createApi({
    reducerPath: "apiSlice",
    baseQuery: baseQueryWithReAuth,
    keepUnusedDataFor: 0,
    tagTypes: ["Users", "Currencies", "ExchangeRates","PaymentMethods", "Transactions", "RateHistories", "RateChart", "Photos"],
    endpoints: ()=>({})
})