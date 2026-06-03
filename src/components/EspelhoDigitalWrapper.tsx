'use client'

import dynamic from 'next/dynamic'

export const EspelhoDigital = dynamic(() => import('@/components/EspelhoDigital'), { ssr: false })
