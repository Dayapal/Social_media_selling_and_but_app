import {
  ArrowDownCircleIcon,
  BanIcon,
  CheckCircle,
  Clock,
  CoinsIcon,
  DollarSign,
  Edit,
  Eye,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  Plus,
  StarIcon,
  TrashIcon,
  TrendingUp,
  User,
  WalletIcon,
  XCircle
} from "lucide-react";

import React, { useState } from "react";
import api from "../configs/axios.js";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/StatCard";
import { platformIcons } from "../assets/assets";
import CredentialSubmission from "../components/CredentialSubmission";
import WithdrawModel from "../components/WithdrawModel";
import { useAuth } from "@clerk/clerk-react";
import {
  getAllPublicListing,
  getAllUserListing,
} from "../app/features/listingSlice";

const MyListings = () => {
  const { userListings = [], balance = {} } = useSelector(
    (state) => state.listing
  );

  const currency = import.meta.env.VITE_CURRENCY || "$";
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const dispatch = useDispatch();

  const [showCredentialSubmission, setShowCredentialSubmission] =
    useState(null);
  const [showWithdrawal, setShowWithdrawal] = useState(null);

  const totalValue = userListings.reduce(
    (sum, listing) => sum + (listing.price || 0),
    0
  );

  const activeListings = userListings.filter(
    (listing) => listing.status === "active"
  ).length;

  const soldListings = userListings.filter(
    (listing) => listing.status === "sold"
  ).length;

  const formatNumber = (num) => {
    if (!num && num !== 0) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="size-3.5" />;
      case "ban":
        return <BanIcon className="size-3.5" />;
      case "sold":
        return <DollarSign className="size-3.5" />;
      case "inactive":
        return <XCircle className="size-3.5" />;
      default:
        return <Clock className="size-3.5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-800";
      case "ban":
        return "text-red-800";
      case "sold":
        return "text-indigo-800";
      case "inactive":
        return "text-gray-800";
      default:
        return "text-gray-800";
    }
  };

  const toggleStatus = async (listingId) => {
    try {
      toast.loading("Updating listing status...");
      const token = await getToken();
      const { data } = await api.put(
        `/api/listing/${listingId}/status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      dispatch(getAllUserListing(token));
      dispatch(getAllPublicListing());
      toast.dismissAll();
      toast.success(data.message);
    } catch (error) {
      toast.dismissAll();
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  const deleteListing = async (listingId) => {
    try {
    
      const confirmDel = window.confirm(
        "Are you sure you want to delete this listing? If credentials changed, new credentials will be emailed to you."
      );
      if (!confirmDel) return;

      toast.loading("Deleting listing...");
      const token = await getToken();

      // FIXED: Removed accidental space in API route
      const { data } = await api.delete(`/api/listing/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      dispatch(getAllUserListing(token));
      dispatch(getAllPublicListing());
      toast.dismissAll();
      toast.success(data.message);
    } catch (error) {
      toast.dismissAll();
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  const markAsFeatured = async (listingId) => {
    try {
      toast.loading("Featuring listing...");
      const token = await getToken();
      const { data } = await api.put(
        `/api/listing/featured/${listingId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      dispatch(getAllUserListing(token));
      dispatch(getAllPublicListing());
      toast.dismissAll();
      toast.success(data.message);
    } catch (error) {
      toast.dismissAll();
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-32 pt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Listings</h1>
          <p>Manage your social media account listings</p>
        </div>

        <button
          onClick={() => navigate("/create-listing")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded font-medium flex items-center space-x-2 mt-4 md:mt-0"
        >
          <Plus className="size-4" />
          <span>New Listing</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Listings"
          value={userListings.length}
          icon={<Eye className="size-6 text-indigo-600" />}
        />

        <StatCard
          title="Active Listings"
          value={activeListings}
          icon={<CheckCircle className="size-6 text-green-600" />}
        />

        <StatCard
          title="Sold"
          value={soldListings}
          icon={<TrendingUp className="size-6 text-indigo-600" />}
        />

        <StatCard
          title="Total Value"
          value={`${currency} ${totalValue.toLocaleString()}`}
          icon={<DollarSign className="size-6 text-yellow-600" />}
        />
      </div>

      {/* Balance Section */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 xl:gap-20 p-6 mb-10 bg-white rounded-xl border border-gray-200">
        {[
          { label: "Earned", value: balance.earned || 0, icon: WalletIcon },
          { label: "Withdrawn", value: balance.withdrawn || 0, icon: ArrowDownCircleIcon },
          { label: "Available", value: balance.available || 0, icon: CoinsIcon },
        ].map((item, index) => (
          <div
            key={index}
            onClick={() => item.label === "Available" && setShowWithdrawal(true)}
            className="flex flex-1 items-center justify-between p-4 rounded-lg border border-gray-100 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <item.icon className="text-gray-500 w-6 h-6" />
              <span className="font-medium text-gray-600">{item.label}</span>
            </div>
            <span className="text-xl font-medium text-gray-700">
              {currency} {item.value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Listings */}
      {userListings.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-2">
            No listings yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start by creating your first listing
          </p>

          <button
            onClick={() => navigate("/create-listing")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Create First Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userListings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-lg shadow-gray-200/70 transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 justify-between mb-4">
                  {platformIcons[listing.platform]}

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {listing.title}
                      </h3>

                      <div className="flex items-center gap-2">
                        {/* Credential info */}
                        <div className="relative group">
                          <LockIcon size={14} />
                          <div className="invisible group-hover:visible absolute right-0 top-0 pt-4 z-10">
                            <div className="bg-white text-gray-600 text-xs rounded border border-gray-200 p-2 px-3 w-max">
                              {!listing.isCredentialSubmitted && (
                                <>
                                  <button
                                    onClick={() =>
                                      setShowCredentialSubmission(listing)
                                    }
                                    className="flex items-center gap-2"
                                  >
                                    Add Credentials
                                  </button>
                                  <hr className="border-gray-200 my-2" />
                                </>
                              )}

                              <button>
                                Status:{" "}
                                <span
                                  className={
                                    listing.isCredentialSubmitted
                                      ? listing.isCredentialVerified
                                        ? listing.isCredentialChanged
                                          ? "text-green-600"
                                          : "text-indigo-600"
                                        : "text-yellow-600"
                                      : "text-red-600"
                                  }
                                >
                                  {listing.isCredentialSubmitted
                                    ? listing.isCredentialVerified
                                      ? listing.isCredentialChanged
                                        ? "Changed"
                                        : "Verified"
                                      : "Submitted"
                                    : "Not Submitted"}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Feature */}
                        {listing.status === "active" && (
                          <StarIcon
                            onClick={() => markAsFeatured(listing.id)}
                            size={18}
                            className={`text-yellow-500 cursor-pointer ${listing.featured ? "fill-yellow-500" : ""
                              }`}
                          />
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600">
                      <span>@{listing.username}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="size-4 text-gray-400" />
                      <span>
                        {formatNumber(listing.followers_count)} followers
                      </span>
                    </div>

                    <span
                      className={`flex items-center justify-end gap-1 ${getStatusColor(
                        listing.status
                      )}`}
                    >
                      {getStatusIcon(listing.status)}{" "}
                      <span>{listing.status}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <TrendingUp className="size-4 text-gray-400" />
                      <span>{listing.engagement_rate}% engagement</span>
                    </div>
                  </div>

                  {/* Price + Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-2xl font-bold text-gray-800">
                      {currency} {listing.price?.toLocaleString()}
                    </span>

                    <div className="flex items-center space-x-2">
                      {listing.status !== "sold" && (
                        <button
                          onClick={() => deleteListing(listing.id)}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-red-500"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      )}

                      <button
                        onClick={() =>
                          navigate(`/edit-listing/${listing.id}`)
                        }
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-indigo-600"
                      >
                        <Edit className="size-4" />
                      </button>

                      <button
                        onClick={() => toggleStatus(listing.id)}
                        className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-indigo-600"
                      >
                        {listing.status === "active" ? (
                          <EyeOffIcon className="size-4" />
                        ) : (
                          <EyeIcon className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Credential Modal */}
      {showCredentialSubmission && (
        <CredentialSubmission
          listing={showCredentialSubmission}
          onClose={() => setShowCredentialSubmission(null)}
        />
      )}

      {/* Withdraw Modal */}
      {showWithdrawal && <WithdrawModel onClose={() => setShowWithdrawal(null)} />}

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 p-4 text-center mt-28">
        <p className="text-sm text-gray-500">
          © 2025 <span className="text-indigo-600">Dedicated Daya Pal</span>. All
          rights reserved.
        </p>
      </div>
    </div>
  );
};

export default MyListings;
