import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import communitiesReducer from '@/store/slices/communitiesSlice'
import postsReducer from '@/store/slices/postsSlice'
import { CreatePostPage } from './CreatePostPage'

vi.mock('@/services', () => ({
  postsService: {
    createPost: vi.fn(),
  },
  communitiesService: {
    getCommunity: vi.fn(),
  },
}))

function renderCreatePostPage(initialPath = '/create') {
  const store = configureStore({ reducer: { posts: postsReducer, communities: communitiesReducer } })
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <CreatePostPage />
      </MemoryRouter>
    </Provider>,
  )
}

describe('CreatePostPage typing', () => {
  it('keeps the title field focused while typing continuously', async () => {
    const user = userEvent.setup()
    renderCreatePostPage()

    const input = screen.getByLabelText(/title/i)
    await user.click(input)
    await user.type(input, 'Preparing your soil before the rains')

    expect(input).toHaveValue('Preparing your soil before the rains')
    expect(input).toHaveFocus()
  })

  it('keeps the content field focused while typing a full paragraph', async () => {
    const user = userEvent.setup()
    renderCreatePostPage()

    const textarea = screen.getByLabelText(/content/i)
    const paragraph = 'Neem oil is an effective and affordable way to control common pests on tomatoes.'
    await user.click(textarea)
    await user.type(textarea, paragraph)

    expect(textarea).toHaveValue(paragraph)
    expect(textarea).toHaveFocus()
  })
})

describe('CreatePostPage formatted content', () => {
  it('preserves pasted multiline, formatted content and keeps typing afterwards without losing focus', async () => {
    const user = userEvent.setup()
    renderCreatePostPage()

    const textarea = screen.getByLabelText(/content/i)
    await user.click(textarea)

    const pasted = '**Clear Debris and Weeds**\n\n* Remove rocks.\n* Remove weeds.'
    await user.paste(pasted)
    expect(textarea).toHaveValue(pasted)
    expect(textarea).toHaveFocus()

    await user.type(textarea, '\nMore notes.')
    expect(textarea).toHaveValue(`${pasted}\nMore notes.`)
    expect(textarea).toHaveFocus()
  })

  it('wraps the selected text in ** when the Bold toolbar button is used', async () => {
    const user = userEvent.setup()
    renderCreatePostPage()

    const textarea = screen.getByLabelText(/content/i)
    await user.click(textarea)
    await user.type(textarea, 'important')
    textarea.setSelectionRange(0, 'important'.length)

    await user.click(screen.getByRole('button', { name: /bold/i }))

    expect(textarea).toHaveValue('**important**')
  })

  it('shows a rendered preview of the current draft under the Preview tab', async () => {
    const user = userEvent.setup()
    renderCreatePostPage()

    const textarea = screen.getByLabelText(/content/i)
    await user.click(textarea)
    await user.type(textarea, '**Bold section**')

    await user.click(screen.getByRole('tab', { name: /preview/i }))

    expect(screen.getByText('Bold section').tagName).toBe('STRONG')
  })
})

describe('CreatePostPage announcement visibility', () => {
  it('does not show the announcement option for a general feed post', () => {
    renderCreatePostPage('/create')
    expect(screen.queryByText(/post as community announcement/i)).not.toBeInTheDocument()
  })

  it('does not show the announcement option for a community post when the viewer is not an admin', async () => {
    const { communitiesService } = await import('@/services')
    communitiesService.getCommunity.mockResolvedValue({
      id: 7,
      name: 'Maize Farmers',
      myRole: 'member',
      members: [],
      creator: null,
    })

    renderCreatePostPage('/create?communityId=7')

    await waitFor(() => expect(communitiesService.getCommunity).toHaveBeenCalled())
    expect(screen.queryByText(/post as community announcement/i)).not.toBeInTheDocument()
  })

  it('shows the announcement option for a community post when the viewer is an admin', async () => {
    const { communitiesService } = await import('@/services')
    communitiesService.getCommunity.mockResolvedValue({
      id: 8,
      name: 'Maize Farmers',
      myRole: 'admin',
      members: [],
      creator: null,
    })

    renderCreatePostPage('/create?communityId=8')

    expect(await screen.findByText(/post as community announcement/i)).toBeInTheDocument()
  })
})
