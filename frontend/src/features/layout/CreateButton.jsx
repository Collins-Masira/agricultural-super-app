import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui'
import { PlusIcon } from '@/components/icons'
import './layout.css'

export function CreateButton({ variant = 'sidebar' }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  function choose(path) {
    setOpen(false)
    navigate(path)
  }

  return (
    <>
      {variant === 'sidebar' ? (
        <button type="button" className="asa-sidebar__link asa-sidebar__link--button" onClick={() => setOpen(true)}>
          <PlusIcon />
          <span>Create</span>
        </button>
      ) : (
        <button type="button" className="asa-bottom-nav__create" onClick={() => setOpen(true)} aria-label="Create">
          <PlusIcon width={22} height={22} />
        </button>
      )}

      <Modal open={open} title="Create" onClose={() => setOpen(false)}>
        <div className="asa-create-menu">
          <button type="button" className="asa-create-menu__option" onClick={() => choose('/create')}>
            <span className="asa-create-menu__icon" aria-hidden="true">
              📝
            </span>
            <span className="asa-create-menu__text">
              <strong>Post</strong>
              <small>Share an update with the community</small>
            </span>
          </button>
          <button type="button" className="asa-create-menu__option" onClick={() => choose('/create/story')}>
            <span className="asa-create-menu__icon" aria-hidden="true">
              📸
            </span>
            <span className="asa-create-menu__text">
              <strong>Story</strong>
              <small>Share a photo that disappears from your feed</small>
            </span>
          </button>
          <button type="button" className="asa-create-menu__option" onClick={() => choose('/create/reel')}>
            <span className="asa-create-menu__icon" aria-hidden="true">
              🎬
            </span>
            <span className="asa-create-menu__text">
              <strong>Reel</strong>
              <small>Share a short farm video</small>
            </span>
          </button>
        </div>
      </Modal>
    </>
  )
}
