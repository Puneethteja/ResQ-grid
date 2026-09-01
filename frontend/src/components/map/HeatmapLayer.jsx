import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
export default function HeatmapLayer({ points = [], visible = true }) {
  const map = useMap()
  const layerGroupRef = useRef(null)
  useEffect(() => {
    if (!map) return
    const group = L.layerGroup()
    layerGroupRef.current = group
    if (visible) {
      group.addTo(map)
    }
    return () => {
      if (group && map.hasLayer(group)) {
        map.removeLayer(group)
      }
    }
  }, [map, visible])
  useEffect(() => {
    const group = layerGroupRef.current
    if (!group || !map) return
    group.clearLayers()
    if (!visible || !points || points.length === 0) return
    points.forEach((p) => {
      if (p.lat == null || p.lng == null) return
      const weight = Math.max(0.25, Math.min(1.0, p.weight ?? 0.7))
      const victims = p.victimCount || 1
      const outerCorona = L.circle([p.lat, p.lng], {
        radius: 850 * (0.85 + weight * 0.45),
        fillColor: weight >= 0.7 ? '#DC2626' : weight >= 0.45 ? '#EA580C' : '#F59E0B',
        fillOpacity: 0.22 * weight,
        stroke: false,
        className: 'heatmap-corona-pulse',
      })
      const midBloom = L.circle([p.lat, p.lng], {
        radius: 420 * (0.85 + weight * 0.4),
        fillColor: weight >= 0.7 ? '#EF4444' : weight >= 0.45 ? '#F97316' : '#FBBF24',
        fillOpacity: 0.38 * weight,
        stroke: false,
      })
      const focalCore = L.circle([p.lat, p.lng], {
        radius: 180 * (0.85 + weight * 0.3),
        fillColor: weight >= 0.7 ? '#FF0000' : '#F59E0B',
        fillOpacity: 0.65 * weight,
        stroke: true,
        color: '#FECACA',
        weight: 1.5,
        opacity: 0.85,
      })
      if (p.hazardType || p.label) {
        focalCore.bindTooltip(
          `<div style="font-family: monospace; font-size: 11px; padding: 2px 4px;">
            <strong>🔥 ${p.hazardType || p.label}</strong><br/>
            <span>Intensity: ${Math.round(weight * 100)}% · ${victims} Affected</span>
          </div>`,
          { direction: 'top', offset: [0, -10] }
        )
      }
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
