import { describe, expect, it } from 'vitest'
import { canCommentInCommunity, canPostInCommunity } from './permissions'

function community(overrides = {}) {
  return {
    myRole: 'member',
    postingPermission: 'everyone',
    messagingPermission: 'everyone',
    commentsEnabled: true,
    ...overrides,
  }
}

describe('canPostInCommunity', () => {
  it('denies non-members regardless of permission level', () => {
    expect(canPostInCommunity(community({ myRole: null }), 'farmer')).toBe(false)
  })

  it('allows any member when everyone is permitted', () => {
    expect(canPostInCommunity(community(), 'farmer')).toBe(true)
  })

  it('denies ordinary members when experts_only is set', () => {
    expect(canPostInCommunity(community({ postingPermission: 'experts_only' }), 'farmer')).toBe(false)
  })

  it('allows experts when experts_only is set', () => {
    expect(canPostInCommunity(community({ postingPermission: 'experts_only' }), 'expert')).toBe(true)
  })

  it('denies experts when admins_only is set', () => {
    expect(canPostInCommunity(community({ postingPermission: 'admins_only' }), 'expert')).toBe(false)
  })

  it('always allows admins regardless of permission level', () => {
    expect(canPostInCommunity(community({ myRole: 'admin', postingPermission: 'admins_only' }), 'farmer')).toBe(true)
  })
})

describe('canCommentInCommunity', () => {
  it('denies everyone, including admins, when comments are disabled', () => {
    expect(canCommentInCommunity(community({ myRole: 'admin', commentsEnabled: false }), 'farmer')).toBe(false)
  })

  it('denies ordinary members when experts_only messaging is set', () => {
    expect(canCommentInCommunity(community({ messagingPermission: 'experts_only' }), 'farmer')).toBe(false)
  })

  it('allows experts when experts_only messaging is set', () => {
    expect(canCommentInCommunity(community({ messagingPermission: 'experts_only' }), 'expert')).toBe(true)
  })

  it('denies non-members', () => {
    expect(canCommentInCommunity(community({ myRole: null }), 'expert')).toBe(false)
  })
})
