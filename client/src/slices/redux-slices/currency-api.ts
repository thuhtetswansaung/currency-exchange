import type { QueryParams } from "../interfaces/pagination";
import type { CurrencyResponse, ICreateAndUpdateCurrency } from "../interfaces/currency";
import { apiSlice } from "./api";

export const currencyApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    createCurrency: builder.mutation({
      query: (data:ICreateAndUpdateCurrency) => ({
        url: "currency",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Currencies"],
    }),

    getAllCurrencies: builder.query<CurrencyResponse, QueryParams | void>({
      query: (params) => ({
        url: "currency",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Currencies"],
    }),

    // getCurrencyById: builder.query({
    //   query: (id: string) => ({
    //     url: `currency/${id}`,
    //     method: "GET",
    //   }),
    //   providesTags: ["Currencies"],
    // }),

    updateCurrency: builder.mutation({
      query: ({ id, ...data }: {id: string} & ICreateAndUpdateCurrency) => ({
        url: `currency/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Currencies"],
    }),

    archiveCurrency: builder.mutation({
      query: (id: string) => ({
        url: `currency/${id}/archive`,
        method: "PATCH",
      }),
      invalidatesTags: ["Currencies"],
    }),

    restoreCurrency: builder.mutation({
      query: (id: string) => ({
        url: `currency/${id}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: ["Currencies"],
    }),

    deleteCurrency: builder.mutation({
      query: (id: string) => ({
        url: `currency/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Currencies"],
    }),
  }),
});

export const {
    useCreateCurrencyMutation,
    useGetAllCurrenciesQuery,
    // useGetCurrencyByIdQuery,
    useUpdateCurrencyMutation,
    useArchiveCurrencyMutation,
    useRestoreCurrencyMutation,
    useDeleteCurrencyMutation,
} = currencyApiSlice;