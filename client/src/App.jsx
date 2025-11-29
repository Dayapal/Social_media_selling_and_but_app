
import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Marketplace from './pages/MarketPlace'
import MyListings from './pages/MyListings'
import MyOrders from './pages/MyOrders'
import Messages from './pages/Messages'
import ManageListing from './pages/ManageListing'
import ListingDetails from './pages/ListingDetails'
import Home from './pages/Home'
import Loading from './pages/Loading'
import Navbar from './components/Navbar'
import ChatBox from './components/ChatBox'
import { Toaster } from 'react-hot-toast'
import Layout from './pages/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import AllListings from './pages/admin/AllListings'
import CredentialChange from './pages/admin/CredentialChange'
import CredentialVerify from './pages/admin/CredentialVerify'
import Transactions from './pages/admin/Transactions'
import Withdrawal from './pages/admin/Withdrawal'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { getAllPublicListing, getAllUserListing } from './app/features/listingSlice.js'


const App = () => {
  const { pathname } = useLocation()
  const { getToken } = useAuth()
  const { user, isLoaded } = useUser()

  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(getAllPublicListing());
  }, []);

  useEffect(() => {
    const fetchUserListings = async () => {
      try {
        if (isLoaded && user) {
          const token = await getToken();

          if (token) {
            dispatch(getAllUserListing(token));
          } else {
            console.error("Token not found");
          }
        }
      } catch (error) {
        console.error("Failed to get token:", error);
      }
    };

    fetchUserListings();
  }, [isLoaded, user]);


  return (
    <div>
      <Toaster />
      {!pathname.includes('/admin') && <Navbar />}
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/marketplace' element={<Marketplace />} />
        <Route path='/my-listings' element={<MyListings />} />
        <Route path='/listing/:listingId' element={<ListingDetails />} />
        <Route path='/create-listing' element={<ManageListing />} />
        <Route path='/edit-listing/:id' element={<ManageListing />} />
        <Route path='/messages' element={<Messages />} />
        <Route path='/my-orders' element={<MyOrders />} />
        <Route path='/loading' element={<Loading />} />
        <Route path='/admin' element={<Layout />}>

          <Route index element={<Dashboard />} />
          <Route path='verify-credentials' element={<CredentialVerify />} />
          <Route path='change-credentials' element={<CredentialChange />} />
          <Route path='list-listings' element={< AllListings />} />
          <Route path='transactions' element={<Transactions />} />

          <Route path='withdrawal' element={<Withdrawal />} />


        </Route>
      </Routes>
      <ChatBox />
    </div>
  )
}

export default App
