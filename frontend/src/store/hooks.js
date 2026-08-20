import { useDispatch, useSelector } from 'react-redux'

/** Typed-action dispatch hook for the app store. */
export const useAppDispatch = () => useDispatch()

/** Selector hook for the app store. */
export const useAppSelector = useSelector