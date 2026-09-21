import { useEffect, useState } from 'react'

export const mediaQuery = {
    mobile: 'width <= 768px',
    tablet: '768px <= width < 1024px',
    pc: '1024px <= width',
    pcLess: 'width < 1024px',
} as const

export const useMediaQuery = (query: typeof mediaQuery[keyof typeof mediaQuery]) => {

    const formattedQuery = `(${query})`
    const [match, setMatch] = useState(matchMedia(formattedQuery).matches)

    useEffect(() => {
        const mql = matchMedia(formattedQuery)

        if (mql.media === 'not all' || mql.media === 'invalid') {
            console.error(`useMediaQuery Error: Invalid media query`)
        }

        mql.onchange = (e) => {
            setMatch(e.matches)
        }

        return () => {
            mql.onchange = null
        }
    }, [formattedQuery, setMatch])

    return match
}