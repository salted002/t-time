import { useContext } from 'react'

import { ConfirmContext } from '@/context/ConfirmContext'

export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) {
    throw new Error('useConfirm은 ConfirmProvider 안에서만 쓸 수 있습니다')
  }
  return confirm
}
