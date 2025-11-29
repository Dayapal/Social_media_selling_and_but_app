import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../configs/axios";

// Get All public listings
export const getAllPublicListing = createAsyncThunk(
  "listing/getAllPublicListing",
  async () => {
    try {
      const { data } = await api.get("/api/listing/public");
      // Expect backend to return: { listings: [...] }
      return data ?? { listings: [] };
    } catch (error) {
      console.error("getAllPublicListing error:", error);
      // return consistent shape
      return { listings: [] };
    }
  }
);

// Get all user listings
// NOTE: This thunk expects a token string (not a function).
export const getAllUserListing = createAsyncThunk(
  "listing/getAllUserListing",
  async (token) => {
    try {
      const { data } = await api.get("/api/listing/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Expect backend to return: { listings: [...], balance: {earned, withdrawn, available}}
      return data ?? { listings: [], balance: { earned: 0, withdrawn: 0, available: 0 } };
    } catch (error) {
      console.error("getAllUserListing error:", error);
      return { listings: [], balance: { earned: 0, withdrawn: 0, available: 0 } };
    }
  }
);

const listingSlice = createSlice({
  name: "listing",
  initialState: {
    listings: [],
    userListings: [],
    balance: {
      earned: 0,
      withdrawn: 0,
      available: 0,
    },
    status: "idle",
    error: null,
  },
  reducers: {
    setListings: (state, action) => {
      state.listings = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllPublicListing.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getAllPublicListing.fulfilled, (state, action) => {
        // action.payload expected: { listings: [...] }
        state.status = "succeeded";
        state.listings = action.payload?.listings ?? [];
      })
      .addCase(getAllPublicListing.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error?.message ?? "Failed to fetch public listings";
      })

      .addCase(getAllUserListing.pending, (state) => {
        state.status = "loading";
      })
      .addCase(getAllUserListing.fulfilled, (state, action) => {
        // action.payload expected: { listings: [...], balance: {...} }
        state.status = "succeeded";
        state.userListings = action.payload?.listings ?? [];
        state.balance = action.payload?.balance ?? { earned: 0, withdrawn: 0, available: 0 };
      })
      .addCase(getAllUserListing.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error?.message ?? "Failed to fetch user listings";
        state.userListings = [];
        state.balance = { earned: 0, withdrawn: 0, available: 0 };
      });
  },
});

export const { setListings } = listingSlice.actions;
export default listingSlice.reducer;
