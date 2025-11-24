import { ArrowLeftIcon, FilterIcon, Search } from 'lucide-react'
import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import ListingCard from '../components/ListingCard'
import FilterSidebar from '../components/FilterSidebar'

const Marketplace = () => {
  const [searchParams] =useSearchParams();
  const search = searchParams.get("search") || "";
  const navigate = useNavigate()
  const [showFilterPhone, setShowFilterPhone] = useState(false)

  const { listings = [] } = useSelector((state) => state.listing || {})

  const [filters, setFilters] = useState({
    platform: [],        // keep as array to match checkboxes
    maxPrice: 100000,
    minFollowers: 0,
    niche: [],           // keep as array if you allow multi-select niches (or null if single)
    varified: false,     // keep consistent with your data (consider renaming to "verified")
    monetized: false,
  })

  const filteredListings = listings.filter((listing) => {
    // guard: listing must exist
    if (!listing) return false

    // Platform (multi select)
    if (filters.platform && filters.platform.length > 0) {
      // if the listing's platform is not included in selected filters -> exclude
      if (!filters.platform.includes(listing.platform)) return false
    }

    // Price (assumes listing.price exists; change to correct field if different)
    if (filters.maxPrice != null) {
      if (listing.price > filters.maxPrice) return false
    }

    // Followers (assumes listing.followers_count)
    if (filters.minFollowers) {
      if ((listing.followers_count || 0) < filters.minFollowers) return false
    }

    // Niche (multi select)
    if (filters.niche && filters.niche.length > 0) {
      // if listing.niche is a string and not in the selected niches -> exclude
      if (!filters.niche.includes(listing.niche)) return false
    }

    // Verified (varified)
    if (filters.varified) {
      // require listing.varified to be truthy
      if (listing.varified !== filters.varified) return false
    }

    // Monetized
    if (filters.monetized) {
      if (listing.monetized !== filters.monetized) return false
    }

    if(search){
      const trimed = search.trim();
      if(
        !listing.title.toLowerCase().includes(trimed.toLocaleLowerCase()) &&
        !listing.username.toLowerCase().includes(trimed.toLocaleLowerCase()) &&
        !listing.description.toLowerCase().includes(trimed.toLocaleLowerCase()) &&
        !listing.platform.toLowerCase().includes(trimed.toLocaleLowerCase()) &&
        !listing.niche.toLowerCase().includes(trimed.toLocaleLowerCase())
      )
      return false

    }

    return true
  })


  return (
    <div className='px-6 md:px-16 lg:px-24 xl:px-32'>

      <div className='flex items-center justify-between text-slate-500'>
        <button onClick={() => { navigate('/'); scrollTo(0, 0) }} className='flex items-center gap-2 py-5'>
          <ArrowLeftIcon className='size-4' />
          Back To Home</button>


        <button onClick={() => setShowFilterPhone(true)} className='flex sm:hidden items-center 
      gap-2 py-5'>
          <FilterIcon className='size-4' />
          Filters</button>
      </div>

      <div className='relative flex items-start justify-between gap-8 pb-8'>
        <FilterSidebar
          setFilters={setFilters}
          filters={filters}
          setShowFilterPhone={setShowFilterPhone}
          showFilterPhone={showFilterPhone}
        />

        <div className='flex-1 grid xl:grid-cols-2 gap-4'>
          {filteredListings.sort((a, b) => a.featured ? -1 : b.featured ? 1 : 0).map((listings, index) => (
            <ListingCard listing={listings} key={index} />
          ))}
        </div>

      </div>
    </div>
  )
}

export default Marketplace
