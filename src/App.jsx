import { useState, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import MapView from './components/MapView'
import DataLog from './components/DataLog'
import ScanResults from './components/ScanResults'
import './App.css'

function App() {
  const [locationData, setLocationData] = useState({
    zoneName: 'Area A-01',
    latitude: 34.2257,
    longitude: -117.8512,
    gpsAccuracy: 2.3
  })

  const [scanConfig, setScanConfig] = useState({
    scanArea: '50 m × 50 m',
    boundaryArea: '200 m × 200 m',
    estimatedDuration: '~ 15 min'
  })

  // Scan target position (where the robot will scan, can be dragged within boundary)
  const [scanTarget, setScanTarget] = useState({
    lat: 34.2257,
    lng: -117.8512
  })

  const [robotStatus, setRobotStatus] = useState({
    battery: 100,
    storageUsed: 0,
    storageTotal: 8,
    signalStrength: 'Good',
    operatingState: 'Idle'
  })

  const [environmentalData, setEnvironmentalData] = useState({
    airTemperature: null,
    airHumidity: null,
    windSpeed: null
  })

  const [scanHistory, setScanHistory] = useState([
    { id: 1, zone: 'Area A-01', date: '2026.02.01', riskLevel: 'high' },
    { id: 2, zone: 'Area B-03', date: '2026.01.28', riskLevel: 'low' }
  ])

  const [scanLogs, setScanLogs] = useState([
    {
      id: 1,
      date: '26.01.23',
      time: '14.30',
      zone: 'A-01',
      avgAirTemp: 28.2,
      avgHumidity: 66,
      avgPlantTemp: 29.4,
      fuelLoad: 'High'
    },
    {
      id: 2,
      date: '25.07.28',
      time: '15.30',
      zone: 'B-03',
      avgAirTemp: 29.2,
      avgHumidity: 56,
      avgPlantTemp: 30.4,
      fuelLoad: 'Low'
    }
  ])

  // Past examination GPS points (from previous scans) - with full scan result data
  const [mapMarkers, setMapMarkers] = useState([
    { 
      id: 1, 
      lat: 34.228, 
      lng: -117.858, 
      riskLevel: 'low',
      scanData: {
        zoneId: 'B-03',
        location: 'Area B-03',
        areaSize: '50 m × 50 m',
        duration: '14 min 22 sec',
        completedAt: '28 Jan 2026 15:30',
        riskLevel: 'Low',
        avgPlantTemp: 26.2,
        avgAirTemp: 25.8,
        tempDiff: 0.4,
        fuelLoad: 'Low',
        fuelDensity: 0.32,
        biomass: 0.8,
        recommendations: [
          'Area is healthy',
          'No immediate action required',
          'Schedule routine check in 30 days'
        ],
        latitude: '34.228000',
        longitude: '-117.858000'
      }
    },
    { 
      id: 2, 
      lat: 34.223, 
      lng: -117.845, 
      riskLevel: 'medium',
      scanData: {
        zoneId: 'C-07',
        location: 'Area C-07',
        areaSize: '50 m × 50 m',
        duration: '15 min 08 sec',
        completedAt: '25 Jan 2026 10:15',
        riskLevel: 'Medium',
        avgPlantTemp: 30.1,
        avgAirTemp: 28.2,
        tempDiff: 1.9,
        fuelLoad: 'Medium',
        fuelDensity: 0.55,
        biomass: 1.3,
        recommendations: [
          'Monitor area closely',
          'Consider preventive measures',
          'Re-scan in 14 days'
        ],
        latitude: '34.223000',
        longitude: '-117.845000'
      }
    },
    { 
      id: 3, 
      lat: 34.230, 
      lng: -117.842, 
      riskLevel: 'high',
      scanData: {
        zoneId: 'A-01',
        location: 'Area A-01',
        areaSize: '50 m × 50 m',
        duration: '15 min 45 sec',
        completedAt: '01 Feb 2026 14:30',
        riskLevel: 'High',
        avgPlantTemp: 34.5,
        avgAirTemp: 29.0,
        tempDiff: 5.5,
        fuelLoad: 'High',
        fuelDensity: 0.85,
        biomass: 2.1,
        recommendations: [
          'Immediate action required',
          'High fire risk detected',
          'Inspect and clear dry vegetation'
        ],
        latitude: '34.230000',
        longitude: '-117.842000'
      }
    }
  ])

  const [isScanning, setIsScanning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanPhase, setScanPhase] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [scanResultData, setScanResultData] = useState(null)
  const scanIntervalRef = useRef(null)

  // Simulate scan progress
  useEffect(() => {
    if (isScanning && !isPaused) {
      if (scanProgress === 0) {
        setScanPhase('Initializing...')
      }
      
      scanIntervalRef.current = setInterval(() => {
        setScanProgress(prev => {
          const newProgress = prev + Math.random() * 2 + 0.5
          
          // Update phase based on progress
          if (newProgress < 10) {
            setScanPhase('Initializing sensors...')
          } else if (newProgress < 25) {
            setScanPhase('Calibrating thermal camera...')
          } else if (newProgress < 40) {
            setScanPhase('Scanning quadrant 1/4...')
          } else if (newProgress < 55) {
            setScanPhase('Scanning quadrant 2/4...')
          } else if (newProgress < 70) {
            setScanPhase('Scanning quadrant 3/4...')
          } else if (newProgress < 85) {
            setScanPhase('Scanning quadrant 4/4...')
          } else if (newProgress < 95) {
            setScanPhase('Processing data...')
          } else {
            setScanPhase('Finalizing report...')
          }
          
          if (newProgress >= 100) {
            clearInterval(scanIntervalRef.current)
            setIsScanning(false)
            setRobotStatus(prev => ({ ...prev, operatingState: 'Idle' }))
            setScanPhase('Scan complete!')
            
            // Generate scan results after a short delay
            setTimeout(() => {
              const now = new Date()
              setScanResultData({
                zoneId: locationData.zoneName.split(' ').pop() || 'A-01',
                location: locationData.zoneName,
                areaSize: scanConfig.scanArea,
                duration: '15 min 32 sec',
                completedAt: now.toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                }) + ' ' + now.toLocaleTimeString('en-GB', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }),
                riskLevel: 'High',
                avgPlantTemp: 33.0,
                avgAirTemp: 29.3,
                tempDiff: 3.7,
                fuelLoad: 'High',
                fuelDensity: 0.78,
                biomass: 1.9,
                recommendations: [
                  'Action required',
                  'Inspect area immediately',
                  'Check for pests or drought'
                ],
                latitude: scanTarget.lat.toFixed(6),
                longitude: scanTarget.lng.toFixed(6)
              })
              setShowResults(true)
            }, 1000)
            
            return 100
          }
          return newProgress
        })
      }, 500)
    }
    
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
    }
  }, [isScanning, isPaused])

  const handleStartScan = () => {
    setIsScanning(true)
    setIsPaused(false)
    setScanProgress(0)
    setRobotStatus(prev => ({ ...prev, operatingState: 'Scanning' }))
  }

  const handlePauseScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }
    setIsPaused(true)
    setScanPhase('Paused')
    setRobotStatus(prev => ({ ...prev, operatingState: 'Paused' }))
  }

  const handleResumeScan = () => {
    setIsPaused(false)
    setRobotStatus(prev => ({ ...prev, operatingState: 'Scanning' }))
  }

  const handleStopScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }
    setIsScanning(false)
    setIsPaused(false)
    setScanProgress(0)
    setScanPhase('')
    setRobotStatus(prev => ({ ...prev, operatingState: 'Idle' }))
  }

  const handleScanTargetChange = (newTarget) => {
    setScanTarget(newTarget)
  }

  const handleBackFromResults = () => {
    setShowResults(false)
    setScanProgress(0)
    setScanPhase('')
  }

  // Handle clicking on a history marker to view its scan results
  const handleMarkerClick = (marker) => {
    if (marker.scanData) {
      setScanResultData(marker.scanData)
      setShowResults(true)
    }
  }

  // Show scan results page
  if (showResults && scanResultData) {
    return <ScanResults scanData={scanResultData} onBack={handleBackFromResults} />
  }

  return (
    <div className="dashboard">
      <Sidebar
        locationData={locationData}
        setLocationData={setLocationData}
        scanConfig={scanConfig}
        scanTarget={scanTarget}
        robotStatus={robotStatus}
        environmentalData={environmentalData}
        scanHistory={scanHistory}
        isScanning={isScanning}
        isPaused={isPaused}
        scanProgress={scanProgress}
        scanPhase={scanPhase}
        onStartScan={handleStartScan}
        onPauseScan={handlePauseScan}
        onResumeScan={handleResumeScan}
        onStopScan={handleStopScan}
      />
      <main className="main-content">
        <MapView
          center={[locationData.latitude, locationData.longitude]}
          markers={mapMarkers}
          robotPosition={{ lat: locationData.latitude, lng: locationData.longitude }}
          onScanTargetChange={handleScanTargetChange}
          onMarkerClick={handleMarkerClick}
        />
        <DataLog logs={scanLogs} />
      </main>
    </div>
  )
}

export default App

