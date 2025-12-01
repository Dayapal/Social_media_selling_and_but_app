import React, { useEffect, useMemo, useState } from 'react'
import { Search, MessageCircle } from 'lucide-react'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { dummyChats } from '../assets/assets'
import { useDispatch } from 'react-redux'
import { setChat } from '../app/features/chatSlice'
import { useAuth, useUser } from '@clerk/clerk-react'
import api from '../configs/axios'
import { toast } from 'react-hot-toast'


const Message = () => {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const dispatch = useDispatch()
  const [chats, setChats] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)


  const formatTime = (dateString) => {
    if (!dateString) return;
    const date = parseISO(dateString);

    if (isToday(date)) return "Today " + format(date, "hh:mm a");
    if (isYesterday(date)) return "Yesterday " + format(date, "hh:mm a");

    return format(date, "MMM d, yyyy");
  };

  const fetchUserChats = async () => {
    try {
      const token = await getToken();
      const { data } = await api.get(`/api/chat/user`, { headers: { Authorization: `Bearer ${token}` } })
      setChats(data.chats)
      setLoading(false)

    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
      console.log(error)
      setLoading(false)

    }
  }

  const handleOpenChat = (chat) => {
    dispatch(setChat({ listing: chat.listing, chatId: chat.id }))

  }

  const filteredChats = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return chats.filter((chat) => {
      const chatUser =
        chat.chatUserId === user?.id ? chat.ownerUser : chat.chatUser;

      const title = chat?.listing?.title?.toLowerCase() || "";
      const name = chatUser?.name?.toLowerCase() || "";

      return title.includes(query) || name.includes(query);
    });
  }, [chats, searchQuery])

  useEffect(() => {

    if (user && isLoaded) {
      fetchUserChats();
      const interval = setInterval(fetchUserChats, 10 * 1000);
      return () => clearInterval(interval);
    }

  }, [user, isLoaded])

  return (
    <div className='mx-auto min-h-screen px-6 md:px-16 lg:px-24 xl:px-32'>
      <div className='py-10'>

        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-800 mb-2'>Messages</h1>
          <p className='text-gray-600'>Chat with buyers and sellers</p>
        </div>

        {/* Search */}
        <div className='relative max-w-xl mb-8'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
          <input
            type="text"
            placeholder='Search conversations...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-indigo-500'
          />
        </div>

        {/* Chat List */}
        {loading ? (
          <div className='text-center text-gray-500 py-20'>
            Loading messages...
          </div>
        ) : filteredChats.length === 0 ? (
          <div className='bg-white rounded-lg border border-gray-200 p-16 text-center'>
            <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <MessageCircle className='w-8 h-8 text-gray-400' />
            </div>
            <h3 className='text-xl font-medium text-gray-800 mb-2'>
              {searchQuery ? "No Chat Found" : "No messages yet"}
            </h3>
            <p className='text-gray-600'>
              {searchQuery
                ? "Try a different search term"
                : `Start a conversation by viewing a listing and clicking "Chat with Seller"`}
            </p>
          </div>
        ) : (
          <div className='bg-white rounded-lg border border-gray-200 divide-y divide-gray-200'>
            {filteredChats.map((chat) => {
              const chatUser =
                chat.chatUserId === user?.id ? chat.ownerUser : chat.chatUser;

              return (
                <button onClick={() => handleOpenChat(chat)}
                  key={chat.id}
                  className='w-full p-4 hover:bg-gray-50 transition-colors text-left'
                >
                  <div className='flex items-center space-x-4'>
                    <img
                      src={chatUser?.image}
                      alt={chatUser?.name}
                      className='w-12 h-12 rounded-lg object-cover'
                    />

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between mb-1'>
                        <h3 className='font-semibold text-gray-800 truncate'>
                          {chat.listing?.title}
                        </h3>
                        <span className='text-xs text-gray-500 shrink-0 ml-2'>
                          {formatTime(chat.updatedAt)}
                        </span>
                      </div>

                      <p className='text-sm text-gray-600 truncate mb-1'>
                        {chatUser?.name}
                      </p>

                      <p
                        className={`text-sm truncate ${!chat.isLastMessageRead &&
                          chat.lastMessageSenderId !== user?.id
                          ? "text-indigo-600 font-medium"
                          : "text-gray-500"
                          }`}
                      >
                        {chat.lastMessage || "No message yet"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Message
