import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

export default function HeatmapLayer({ points = [], visible = true }) {
  const map = useMap()
  const groupRef = useRef(null)

  useEffect(() => {
    if (!map) return

    const group = L.layerGroup()
    groupRef.current = group

    if (visible) {
      group.addTo(map)
    }

    return () => {
      if (group && map.hasLayer(group)) {
        map.removeLayer(group)
      }
    }
  }, [map])

  useEffect(() => {
    const group = groupRef.current
    if (!group || !map) return

    group.clearLayers()

    if (!visible || !points || points.length === 0) return

    // Render multi-tier vibrant thermal circles that automatically scale with map zoom
    points.forEach((p) => {
      if (p.lat == null || p.lng == null) return
      const weight = Math.max(0.3, Math.min(1.0, p.weight ?? 0.7))

      // Outer thermal dispersion corona (650m radius)
      const outerCorona = L.circle([p.lat, p.lng], {
        radius: 650 * (0.8 + weight * 0.4),
        fillColor: weight >= 0.75 ? '#DC2626' : '#F59E0B',
        fillOpacity: 0.22 * weight,
        stroke: false,
        className: 'heatmap-corona-pulse',
      })

      // Mid-range intensity bloom (320m radius)
      const midBloom = L.circle([p.lat, p.lng], {
        radius: 320 * (0.8 + weight * 0.4),
        fillColor: weight >= 0.75 ? '#EA580C' : '#FBBF24',
        fillOpacity: 0.38 * weight,
        stroke: false,
      })

      // Intense focal core (120m radius)
      const focalCore = L.circle([p.lat, p.lng], {
        radius: 120 * (0.8 + weight * 0.3),
        fillColor: weight >= 0.75 ? '#EF4444' : '#F59E0B',
        fillOpacity: 0.60 * weight,
        stroke: true,
        color: '#F87171',
        weight: 1.5,
        opacity: 0.7,
      })

      group.addLayer(outerCorona)
      group.addLayer(midBloom)
      group.addLayer(focalCore)
    })

    if (visible && !map.hasLayer(group)) {
      group.addTo(map)
    }
  }, [points, visible, map])

  return null
}