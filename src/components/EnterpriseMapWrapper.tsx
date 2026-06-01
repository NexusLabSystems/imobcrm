'use client'

import dynamic from 'next/dynamic'

export const EnterpriseMap = dynamic(() => import('@/components/EnterpriseMap'), { ssr: false })
export const MapEditor = dynamic(() => import('@/components/MapEditor'), { ssr: false })
