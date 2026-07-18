import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authStore'

interface BookmarkState {
  bookmarksByUser: Record<string, string[]>
  toggleBookmark: (id: string) => void
  isBookmarked: (id: string) => boolean
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarksByUser: {},
      toggleBookmark: (id: string) => {
        const userId = useAuthStore.getState().user?.id || 'guest'
        const currentMap = get().bookmarksByUser || {}
        const userBookmarks = currentMap[userId] || []
        const exists = userBookmarks.includes(id)
        const updated = exists
          ? userBookmarks.filter((item) => item !== id)
          : [...userBookmarks, id]
        set({
          bookmarksByUser: {
            ...currentMap,
            [userId]: updated,
          },
        })
      },
      isBookmarked: (id: string) => {
        const userId = useAuthStore.getState().user?.id || 'guest'
        const currentMap = get().bookmarksByUser || {}
        return (currentMap[userId] || []).includes(id)
      },
    }),
    {
      name: 'studyou_bookmarks_v2',
    },
  ),
)

const EMPTY_ARRAY: string[] = []

export function useBookmarkedIds() {
  const userId = useAuthStore((s) => s.user?.id) || 'guest'
  return useBookmarkStore((s) => s.bookmarksByUser[userId] || EMPTY_ARRAY)
}
