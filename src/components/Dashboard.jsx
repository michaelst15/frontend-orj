import { useCallback, useEffect, useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const formatTime = (value) =>
  new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(value)

const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(value)

const createInitialAttendance = () => {
  const now = Date.now()
  return [
    { id: 'adm-1', name: 'Admin Utama', role: 'Admin', status: 'online', lastSeen: now },
    { id: 'sek-1', name: 'Sekretariat', role: 'Operator', status: 'online', lastSeen: now - 15_000 },
    { id: 'keg-1', name: 'Koordinator Kegiatan', role: 'Operator', status: 'away', lastSeen: now - 75_000 },
    { id: 'ver-1', name: 'Verifikator Data', role: 'Admin', status: 'offline', lastSeen: now - 25 * 60_000 },
  ]
}

const MetricValue = ({ value, className, spinnerClassName = 'h-5 w-5' }) => {
  return (
    <div className={className}>
      {typeof value === 'number' ? (
        formatNumber(value)
      ) : (
        <span
          className={`${spinnerClassName} inline-block animate-spin rounded-full border-2 border-black/25 border-t-black/70`}
        />
      )}
    </div>
  )
}

export default function Dashboard({ adminEmail, onLogout }) {
  const [adminName, setAdminName] = useState(() => {
    try {
      return window.localStorage.getItem('adminName') || ''
    } catch {
      return ''
    }
  })
  const [adminToken, setAdminToken] = useState(() => {
    try {
      return window.localStorage.getItem('adminToken') || ''
    } catch {
      return ''
    }
  })

  const getAuthHeaders = () => {
    if (!adminToken) return {}
    return { 'X-Session-Token': adminToken }
  }

  const fetchWithAuth = async (url, options = {}) => {
    const headers = { ...options.headers, ...getAuthHeaders() }
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    try {
      const response = await fetch(url, { 
        ...options, 
        headers,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (err) {
      clearTimeout(timeoutId)
      throw err
    }
  }
  const [now, setNow] = useState(() => Date.now())
  const [attendance, setAttendance] = useState(() => createInitialAttendance())
  const [activeMenu, setActiveMenu] = useState('data')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importTableName, setImportTableName] = useState('')
  const [importFile, setImportFile] = useState(null)
  const [importSubmitting, setImportSubmitting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [dbFamilies, setDbFamilies] = useState(null)
  const [dbRuasOrj, setDbRuasOrj] = useState(null)
  const [dbKeluargaSuami, setDbKeluargaSuami] = useState(null)
  const [dbKeluargaIstri, setDbKeluargaIstri] = useState(null)
  const [dbKeluargaAnak, setDbKeluargaAnak] = useState(null)
  const [dbKeluargaBoru, setDbKeluargaBoru] = useState(null)
  const [dbKeluargaDolidoli, setDbKeluargaDolidoli] = useState(null)
  const [dbKeluargaNamabaju, setDbKeluargaNamabaju] = useState(null)
  const [dbRuasOrjAnak, setDbRuasOrjAnak] = useState(null)
  const [dbRuasOrjBoru, setDbRuasOrjBoru] = useState(null)
  const [dbKehadiranKk, setDbKehadiranKk] = useState(null)
  const [dbKehadiranDewasa, setDbKehadiranDewasa] = useState(null)
  const [dbKehadiranAnak, setDbKehadiranAnak] = useState(null)
  const [metricsError, setMetricsError] = useState('')
  const [absensiAnggotaSearch, setAbsensiAnggotaSearch] = useState('')
  const [absensiKehadiranSearch, setAbsensiKehadiranSearch] = useState('')
  const [absensiKeluarga, setAbsensiKeluarga] = useState('')
  const [absensiPomparan, setAbsensiPomparan] = useState('')
  const [absensiSundut, setAbsensiSundut] = useState('')
  const [absensiDomisili, setAbsensiDomisili] = useState('')
  const [absensiMobile, setAbsensiMobile] = useState('')
  const [absensiDewasa, setAbsensiDewasa] = useState('')
  const [absensiAnak, setAbsensiAnak] = useState('')
  const [absensiKehadiranRows, setAbsensiKehadiranRows] = useState([])
  const [absensiKehadiranLoading, setAbsensiKehadiranLoading] = useState(false)
  const [absensiApplySubmitting, setAbsensiApplySubmitting] = useState(false)
  const [absensiFamilies, setAbsensiFamilies] = useState([])
  const [absensiFamiliesLoading, setAbsensiFamiliesLoading] = useState(false)
  const [absensiFamiliesError, setAbsensiFamiliesError] = useState('')
  const [absensiSelectedIp, setAbsensiSelectedIp] = useState('')
  const [absensiEditIp, setAbsensiEditIp] = useState('')
  const [absensiDetailLoading, setAbsensiDetailLoading] = useState(false)
  const [absensiDetailError, setAbsensiDetailError] = useState('')
  const [presentasiKehadiran, setPresentasiKehadiran] = useState(null)
  const [absensiRekapHadir, setAbsensiRekapHadir] = useState(null)
  const [dbAbsensiFamiliesCount, setDbAbsensiFamiliesCount] = useState(null)
  const [exportPdfLoading, setExportPdfLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [presentasiLoading, setPresentasiLoading] = useState(false)
  const [refreshDataKey, setRefreshDataKey] = useState(0)
  const [refreshPresentasiKey, setRefreshPresentasiKey] = useState(0)
  const [refreshAbsensiFamiliesKey, setRefreshAbsensiFamiliesKey] = useState(0)
  const [refreshAbsensiKehadiranKey, setRefreshAbsensiKehadiranKey] = useState(0)
  const [dataLoaded, setDataLoaded] = useState({
    data: false,
    absensi: false,
    absensiKehadiran: false,
    presentasi: false
  })
  const [lastRefreshKey, setLastRefreshKey] = useState({
    data: 0,
    absensiFamilies: 0,
    absensiKehadiran: 0,
    presentasi: 0
  })
  const [dataBaru, setDataBaru] = useState([])
  const [dataBaruLoaded, setDataBaruLoaded] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [refreshDataBaruKey, setRefreshDataBaruKey] = useState(0)

  const handleExportPdf = async () => {
    setExportPdfLoading(true)
    try {
      const response = await fetchWithAuth(`${apiBaseUrl}/api/absensi/kehadiran`)
      const raw = await response.text()
      let data = null
      if (raw) {
        try {
          data = JSON.parse(raw)
        } catch {
          data = null
        }
      }

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      })

      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('DATA KEHADIRAN', 148, 20, { align: 'center' })

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const dateStr = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      doc.text(`Dicetak pada: ${dateStr}`, 148, 30, { align: 'center' })

      const rows = Array.isArray(data?.rows) ? data.rows : []
      const tableData = rows.map((row) => [
        typeof row?.keluarga === 'string' ? row.keluarga : '-',
        typeof row?.mobile === 'string' && row.mobile.trim() ? row.mobile : '-',
        typeof row?.dewasa === 'number' ? row.dewasa : 0,
        typeof row?.anak === 'number' ? row.anak : 0,
        typeof row?.ompu === 'string' && row.ompu.trim() ? row.ompu : '-',
        row?.updatedAt ? new Date(row.updatedAt).toLocaleString('id-ID') : '-',
      ])

      autoTable(doc, {
        startY: 40,
        head: [['Keluarga', 'Mobile', 'Dewasa', 'Anak', 'Ompu', 'Diperbarui']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [198, 57, 43],
          textColor: 255,
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      })

      const filename = `data-kehadiran-${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(filename)
    } catch (err) {
      alert('Gagal export PDF: ' + (err?.message || 'Terjadi kesalahan'))
    } finally {
      setExportPdfLoading(false)
    }
  }

  const envApiBaseUrl = typeof import.meta.env.VITE_API_BASE_URL === 'string' ? import.meta.env.VITE_API_BASE_URL.trim() : ''
  const defaultApiBaseUrl = envApiBaseUrl || `${window.location.protocol}//${window.location.hostname}:8100`
  const [apiBaseOverride, setApiBaseOverride] = useState('')
  const apiBaseUrl = apiBaseOverride || defaultApiBaseUrl

  const refreshAbsensiRekapHadir = useCallback(async (baseUrl) => {
    const fetchRekap = async (base) => fetchWithAuth(`${base}/api/kehadiran/rekap`, { cache: 'no-store' })
    const parseRows = (rows) => {
      const out = { otuan: 0, osotargoling: 0, omogot: 0, odatup: 0 }
      const list = Array.isArray(rows) ? rows : []
      for (const r of list) {
        const key = typeof r?.key === 'string' ? r.key : ''
        const kk = typeof r?.kk === 'number' ? r.kk : 0
        if (key && Object.prototype.hasOwnProperty.call(out, key)) out[key] = kk
      }
      return out
    }

    let baseToUse = typeof baseUrl === 'string' && baseUrl.trim() ? baseUrl.trim() : apiBaseUrl
    
    try {
      let response = await fetchRekap(baseToUse)

      const raw = await response.text()
      let data = null
      if (raw) {
        try {
          data = JSON.parse(raw)
        } catch {
          data = null
        }
      }
      if (!response.ok) {
        setAbsensiRekapHadir(null)
        return
      }
      setAbsensiRekapHadir(parseRows(data?.rows))
    } catch {
      setAbsensiRekapHadir(null)
    }
  }, [apiBaseUrl])

  useEffect(() => {
    if (activeMenu !== 'data') return
    let cancelled = false

    const load = async () => {
      setDataLoading(true)
      try {
        const response = await fetchWithAuth(`${apiBaseUrl}/api/metrics`)
        const raw = await response.text()
        let data = null
        if (raw) {
          try {
            data = JSON.parse(raw)
          } catch {
            data = null
          }
        }

        if (!cancelled && response.ok) {
          if (typeof data?.families === 'number') setDbFamilies(data.families)
          if (typeof data?.ruasOrj === 'number') setDbRuasOrj(data.ruasOrj)
          if (typeof data?.keluarga?.suami === 'number') setDbKeluargaSuami(data.keluarga.suami)
          if (typeof data?.keluarga?.istri === 'number') setDbKeluargaIstri(data.keluarga.istri)
          if (typeof data?.keluarga?.anak === 'number') setDbKeluargaAnak(data.keluarga.anak)
          if (typeof data?.keluarga?.boru === 'number') setDbKeluargaBoru(data.keluarga.boru)
          if (typeof data?.keluarga?.dolidoli === 'number') setDbKeluargaDolidoli(data.keluarga.dolidoli)
          if (typeof data?.keluarga?.namarbaju === 'number') setDbKeluargaNamabaju(data.keluarga.namarbaju)
          if (typeof data?.ruasOrjDetail?.anak === 'number') setDbRuasOrjAnak(data.ruasOrjDetail.anak)
          if (typeof data?.ruasOrjDetail?.boru === 'number') setDbRuasOrjBoru(data.ruasOrjDetail.boru)
          if (typeof data?.kehadiran?.kk === 'number') setDbKehadiranKk(data.kehadiran.kk)
          if (typeof data?.kehadiran?.dewasa === 'number') setDbKehadiranDewasa(data.kehadiran.dewasa)
          if (typeof data?.kehadiran?.anak === 'number') setDbKehadiranAnak(data.kehadiran.anak)
          setMetricsError('')
          return
        }
        if (!cancelled) setMetricsError('')
      } catch {
        if (!cancelled) setMetricsError('')
      } finally {
        if (!cancelled) {
          setDataLoading(false)
          setDataLoaded(prev => ({ ...prev, data: true }))
        }
      }
    }

    if (!dataLoaded.data || refreshDataKey !== lastRefreshKey.data) {
      setLastRefreshKey(prev => ({ ...prev, data: refreshDataKey }))
      load()
    }
    return () => {
      cancelled = true
    }
  }, [activeMenu, apiBaseUrl, envApiBaseUrl, refreshDataKey, dataLoaded.data])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (activeMenu !== 'absensi') return
    let cancelled = false

    const load = async () => {
      setAbsensiFamiliesLoading(true)
      try {
        const response = await fetchWithAuth(`${apiBaseUrl}/api/absensi/keluarga`)
        const raw = await response.text()
        let data = null
        if (raw) {
          try {
            data = JSON.parse(raw)
          } catch {
            data = null
          }
        }

        if (cancelled) return

        if (!response.ok) {
          setAbsensiFamilies([])
          const statusMessage =
            response.status === 404
              ? 'Endpoint absensi belum tersedia (404). Pastikan backend sudah di-restart.'
              : `Gagal mengambil data keluarga (HTTP ${response.status}).`
          const rawMessage =
            typeof raw === 'string' && raw.trim() && raw.trim().length <= 200
              ? raw.trim()
              : typeof raw === 'string' && raw.trim()
                ? `${raw.trim().slice(0, 200)}…`
                : ''
          const errorMsg = data?.message || rawMessage || statusMessage
          if (errorMsg && !errorMsg.includes('sesi tidak valid')) {
            setAbsensiFamiliesError(errorMsg)
          }
          return
        }

        const families = Array.isArray(data?.families) ? data.families : []
        setAbsensiFamilies(families)
        setAbsensiFamiliesError('')
        if (families.length > 0 && typeof families[0]?.ip === 'string') {
          setAbsensiSelectedIp((prev) => (prev ? prev : families[0].ip))
        }
      } catch (err) {
        if (!cancelled) {
          setAbsensiFamilies([])
          const errorMsg = err?.message || 'Gagal mengambil data keluarga.'
          if (errorMsg && !errorMsg.includes('sesi tidak valid')) {
            setAbsensiFamiliesError(errorMsg)
          }
        }
      } finally {
        if (!cancelled) {
          setAbsensiFamiliesLoading(false)
          setDataLoaded(prev => ({ ...prev, absensi: true }))
        }
      }
    }

    if (!dataLoaded.absensi || refreshAbsensiFamiliesKey !== lastRefreshKey.absensiFamilies) {
      setLastRefreshKey(prev => ({ 
        ...prev, 
        absensiFamilies: refreshAbsensiFamiliesKey
      }))
      load()
    }
    return () => {
      cancelled = true
    }
  }, [activeMenu, apiBaseUrl, envApiBaseUrl, refreshAbsensiFamiliesKey, dataLoaded.absensi])

  useEffect(() => {
    if (activeMenu !== 'absensi') return
    if (!absensiSelectedIp) return
    let cancelled = false

    const load = async () => {
      setAbsensiDetailLoading(true)
      setAbsensiDetailError('')
      try {
        const response = await fetchWithAuth(
          `${apiBaseUrl}/api/absensi/detail?ip=${encodeURIComponent(absensiSelectedIp)}`
        )
        const raw = await response.text()
        let data = null
        if (raw) {
          try {
            data = JSON.parse(raw)
          } catch {
            data = null
          }
        }

        if (cancelled) return

        if (!response.ok) {
          const statusMessage = `Gagal mengambil detail (HTTP ${response.status}).`
          const rawMessage =
            typeof raw === 'string' && raw.trim() && raw.trim().length <= 200
              ? raw.trim()
              : typeof raw === 'string' && raw.trim()
                ? `${raw.trim().slice(0, 200)}…`
                : ''
          const errorMsg = data?.message || rawMessage || statusMessage
          if (errorMsg && !errorMsg.includes('sesi tidak valid')) {
            setAbsensiDetailError(errorMsg)
          }
          return
        }

        const keluarga = typeof data?.keluarga === 'string' ? data.keluarga : ''
        const subOmpu = typeof data?.subOmpu === 'string' ? data.subOmpu : ''
        const alamat = typeof data?.alamat === 'string' ? data.alamat : ''
        const sundut = typeof data?.sundut === 'string' ? data.sundut : ''
        const telp = typeof data?.telp === 'string' ? data.telp : ''

        const editIp = typeof absensiEditIp === 'string' ? absensiEditIp.trim() : ''
        const selectedIp = typeof absensiSelectedIp === 'string' ? absensiSelectedIp.trim() : ''
        const isEditingThis = editIp && selectedIp && editIp === selectedIp

        if (!isEditingThis) {
          setAbsensiKeluarga(keluarga)
          setAbsensiPomparan(subOmpu)
          setAbsensiMobile(telp)
        }
        setAbsensiDomisili(alamat)
        setAbsensiSundut(sundut)
      } catch (err) {
        if (!cancelled) {
          const errorMsg = err?.message || 'Gagal mengambil detail.'
          if (errorMsg && !errorMsg.includes('sesi tidak valid')) {
            setAbsensiDetailError(errorMsg)
          }
        }
      } finally {
        if (!cancelled) setAbsensiDetailLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [activeMenu, apiBaseUrl, absensiEditIp, absensiSelectedIp])

  useEffect(() => {
    if (activeMenu !== 'absensi') return
    let cancelled = false

    const load = async () => {
      setAbsensiKehadiranLoading(true)
      try {
        const response = await fetchWithAuth(`${apiBaseUrl}/api/absensi/kehadiran`, { cache: 'no-store' })
        const raw = await response.text()
        let data = null
        if (raw) {
          try {
            data = JSON.parse(raw)
          } catch {
            data = null
          }
        }

        if (cancelled) return

        if (!response.ok) {
          setAbsensiKehadiranRows([])
          refreshAbsensiRekapHadir()
          return
        }

        const rows = Array.isArray(data?.rows) ? data.rows : []
        setAbsensiKehadiranRows(rows)
        refreshAbsensiRekapHadir()
      } catch {
        if (!cancelled) setAbsensiKehadiranRows([])
        refreshAbsensiRekapHadir()
      } finally {
        if (!cancelled) {
          setAbsensiKehadiranLoading(false)
          setDataLoaded(prev => ({ ...prev, absensiKehadiran: true }))
        }
      }
    }

    if (!dataLoaded.absensiKehadiran || refreshAbsensiKehadiranKey !== lastRefreshKey.absensiKehadiran) {
      setLastRefreshKey(prev => ({ ...prev, absensiKehadiran: refreshAbsensiKehadiranKey }))
      load()
    }
    return () => {
      cancelled = true
    }
  }, [activeMenu, apiBaseUrl, envApiBaseUrl, refreshAbsensiKehadiranKey, dataLoaded.absensiKehadiran])

  useEffect(() => {
    if (activeMenu !== 'presentasi') return
    let cancelled = false

    const load = async () => {
      setPresentasiLoading(true)
      try {
        const fetchKehadiranMetrics = async (base) => fetchWithAuth(`${base}/api/kehadiran/metrics`, { cache: 'no-store' })
        const fetchAbsensiKeluarga = async (base) => fetchWithAuth(`${base}/api/absensi/keluarga`, { cache: 'no-store' })

        let baseToUse = apiBaseUrl
        let response = await fetchKehadiranMetrics(baseToUse)

        const raw = await response.text()
        let data = null
        if (raw) {
          try {
            data = JSON.parse(raw)
          } catch {
            data = null
          }
        }

        if (cancelled) return

        if (!response.ok) {
          setPresentasiKehadiran(null)
        } else {
          const kk = typeof data?.kehadiran?.kk === 'number' ? data.kehadiran.kk : null
          const dewasa = typeof data?.kehadiran?.dewasa === 'number' ? data.kehadiran.dewasa : null
          const anak = typeof data?.kehadiran?.anak === 'number' ? data.kehadiran.anak : null
          const jiwa =
            typeof data?.kehadiran?.jiwa === 'number'
              ? data.kehadiran.jiwa
              : typeof dewasa === 'number' && typeof anak === 'number'
                ? dewasa + anak
                : null

          setPresentasiKehadiran({ kk, dewasa, anak, jiwa })
        }

        const absensiResponse = await fetchAbsensiKeluarga(baseToUse)
        if (absensiResponse.ok) {
          const absensiRaw = await absensiResponse.text()
          let absensiData = null
          if (absensiRaw) {
            try {
              absensiData = JSON.parse(absensiRaw)
            } catch {
              absensiData = null
            }
          }
          if (!cancelled && absensiData && typeof absensiData?.count === 'number') {
            setDbAbsensiFamiliesCount(absensiData.count)
          }
        }
      } catch {
        if (!cancelled) {
          setPresentasiKehadiran(null)
        }
      } finally {
        if (!cancelled) {
          setPresentasiLoading(false)
          setDataLoaded(prev => ({ ...prev, presentasi: true }))
        }
      }
    }

    if (!dataLoaded.presentasi || refreshPresentasiKey !== lastRefreshKey.presentasi) {
      setLastRefreshKey(prev => ({ ...prev, presentasi: refreshPresentasiKey }))
      load()
    }
    return () => {
      cancelled = true
    }
  }, [activeMenu, apiBaseUrl, envApiBaseUrl, refreshPresentasiKey, dataLoaded.presentasi])

  useEffect(() => {
    let cancelled = false
    let localRefreshKey = refreshDataBaruKey

    const load = async () => {
      try {
        const response = await fetchWithAuth(`${apiBaseUrl}/api/data-baru`)
        const data = await response.json()
        if (!cancelled && response.ok && Array.isArray(data?.data)) {
          setDataBaru(data.data)
          setDataBaruLoaded(true)
        }
      } catch {
        // ignore
      }
    }

    if (!dataBaruLoaded || localRefreshKey !== 0) {
      load()
    }

    return () => {
      cancelled = true
    }
  }, [apiBaseUrl, refreshDataBaruKey, dataBaruLoaded])

  useEffect(() => {
    const id = window.setInterval(() => {
      setAttendance((prev) => {
        const next = prev.map((p) => ({ ...p }))
        const index = Math.floor(Math.random() * next.length)
        const pick = next[index]
        const roll = Math.random()
        const status = roll > 0.78 ? 'offline' : roll > 0.45 ? 'away' : 'online'
        next[index] = { ...pick, status, lastSeen: Date.now() }
        return next
      })
    }, 2500)
    return () => window.clearInterval(id)
  }, [])

  const metrics = useMemo(() => {
    const families = typeof dbFamilies === 'number' ? dbFamilies : null
    const ruasOrj = typeof dbRuasOrj === 'number' ? dbRuasOrj : null
    const keluargaSuami = typeof dbKeluargaSuami === 'number' ? dbKeluargaSuami : null
    const keluargaIstri = typeof dbKeluargaIstri === 'number' ? dbKeluargaIstri : null
    const keluargaAnak = typeof dbKeluargaAnak === 'number' ? dbKeluargaAnak : null
    const keluargaBoru = typeof dbKeluargaBoru === 'number' ? dbKeluargaBoru : null
    const keluargaDolidoli = typeof dbKeluargaDolidoli === 'number' ? dbKeluargaDolidoli : null
    const keluargaNamabaju = typeof dbKeluargaNamabaju === 'number' ? dbKeluargaNamabaju : null
    const ruasOrjAnak = typeof dbRuasOrjAnak === 'number' ? dbRuasOrjAnak : null
    const ruasOrjBoru = typeof dbRuasOrjBoru === 'number' ? dbRuasOrjBoru : null
    const kehadiranKk = typeof dbKehadiranKk === 'number' ? dbKehadiranKk : null
    const kehadiranDewasa = typeof dbKehadiranDewasa === 'number' ? dbKehadiranDewasa : null
    const kehadiranAnak = typeof dbKehadiranAnak === 'number' ? dbKehadiranAnak : null
    const realtimeOnline = attendance.filter((a) => a.status === 'online').length
    return {
      families,
      ruasOrj,
      keluargaSuami,
      keluargaIstri,
      keluargaAnak,
      keluargaBoru,
      keluargaDolidoli,
      keluargaNamabaju,
      ruasOrjAnak,
      ruasOrjBoru,
      kehadiranKk,
      kehadiranDewasa,
      kehadiranAnak,
      realtimeOnline,
    }
  }, [
    attendance,
    dbFamilies,
    dbRuasOrj,
    dbKeluargaSuami,
    dbKeluargaIstri,
    dbKeluargaAnak,
    dbKeluargaBoru,
    dbKeluargaDolidoli,
    dbKeluargaNamabaju,
    dbRuasOrjAnak,
    dbRuasOrjBoru,
    dbKehadiranKk,
    dbKehadiranDewasa,
    dbKehadiranAnak,
  ])

  const selectedAbsensiFamily = useMemo(() => {
    if (!absensiSelectedIp) return null
    return absensiFamilies.find((f) => f?.ip === absensiSelectedIp) || null
  }, [absensiFamilies, absensiSelectedIp])

  const closeImport = () => {
    if (importSubmitting) return
    setImportOpen(false)
    setImportError('')
    setImportResult(null)
  }

  const submitImport = async () => {
    if (!importTableName.trim()) {
      setImportError('Nama tabel wajib diisi.')
      return
    }
    if (!importFile) {
      setImportError('File Excel wajib diupload.')
      return
    }

    setImportSubmitting(true)
    setImportError('')
    setImportResult(null)

    try {
      const form = new FormData()
      form.append('tableName', importTableName.trim())
      form.append('file', importFile)

      const response = await fetchWithAuth(`${apiBaseUrl}/api/import-excel`, {
        method: 'POST',
        body: form,
      })

      const raw = await response.text()
      let data = null
      if (raw) {
        try {
          data = JSON.parse(raw)
        } catch {
          data = null
        }
      }
      if (!response.ok) {
        if (data?.message) {
          setImportError(data.message)
          return
        }

        setImportError(raw ? `Gagal mengimport Excel. (${response.status})` : 'Gagal mengimport Excel.')
        return
      }

      setImportResult(data)
      setImportTableName('')
      setImportFile(null)
    } catch {
      setImportError(`Gagal mengimport Excel. Pastikan backend aktif di ${apiBaseUrl}`)
    } finally {
      setImportSubmitting(false)
    }
  }

  const downloadReport = async (path, filename) => {
    const response = await fetchWithAuth(`${apiBaseUrl}${path}`)
    if (!response.ok) {
      const raw = await response.text()
      throw new Error(raw || `Gagal mengambil laporan. (${response.status})`)
    }
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const handleLaporan = async () => {
    if (reportSubmitting) return
    setReportSubmitting(true)
    try {
      await downloadReport('/api/reports/keluarga.pdf', 'rekap-keluarga.pdf')
      await downloadReport('/api/reports/ruasorj.pdf', 'rekap-ruasorj.pdf')
    } catch (err) {
      alert(err?.message || 'Gagal mengunduh laporan.')
    } finally {
      setReportSubmitting(false)
    }
  }

  const actionButtonClass =
    'rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-left text-sm font-semibold text-black/90 transition duration-150 ease-out active:scale-[0.97] hover:bg-black/[0.06] disabled:cursor-not-allowed disabled:opacity-60'

  const normalizeCount = (value) => {
    const raw = typeof value === 'string' ? value.trim() : `${value ?? ''}`.trim()
    const digitsOnly = raw.replace(/[^\d]/g, '')
    if (!digitsOnly) return 0
    const parsed = Number.parseInt(digitsOnly, 10)
    if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 0) return 0
    return parsed
  }

  const applyAbsensi = () => {
    const ip = typeof absensiSelectedIp === 'string' ? absensiSelectedIp.trim() : ''
    if (!ip) return

    const dewasa = normalizeCount(absensiDewasa)
    const anak = normalizeCount(absensiAnak)

    setAbsensiDewasa(String(dewasa))
    setAbsensiAnak(String(anak))

    const keluarga = typeof absensiKeluarga === 'string' ? absensiKeluarga.trim() : ''
    const mobile = typeof absensiMobile === 'string' ? absensiMobile.trim() : ''
    const ompu = typeof absensiPomparan === 'string' ? absensiPomparan.trim() : ''

    const payload = {
      ip,
      keluarga: keluarga || '-',
      mobile: mobile || '',
      dewasa,
      anak,
      ompu: ompu || '',
      adminEmail: adminEmail || '',
      adminName: adminName || '',
      updatedAt: Date.now(),
    }

    setAbsensiKehadiranRows((prev) => {
      const next = Array.isArray(prev) ? prev.map((p) => ({ ...p })) : []
      const index = next.findIndex((row) => row?.ip === ip)
      const localRow = {
        ...payload,
        mobile: payload.mobile || '-',
        ompu: payload.ompu || '-',
      }
      if (index >= 0) {
        next[index] = localRow
        return next
      }
      return [localRow, ...next]
    })

    setAbsensiEditIp('')
    setAbsensiSelectedIp('')
    setAbsensiKeluarga('')
    setAbsensiPomparan('')
    setAbsensiSundut('')
    setAbsensiDomisili('')
    setAbsensiMobile('')
    setAbsensiDewasa('')
    setAbsensiAnak('')
    setAbsensiDetailError('')

    setAbsensiApplySubmitting(true)
    fetchWithAuth(`${apiBaseUrl}/api/absensi/kehadiran`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const raw = await response.text()
        let data = null
        if (raw) {
          try {
            data = JSON.parse(raw)
          } catch {
            data = null
          }
        }
        if (!response.ok) {
          throw new Error(data?.message || `Gagal menyimpan kehadiran (HTTP ${response.status}).`)
        }
        const row = data?.row
        if (row && typeof row?.ip === 'string') {
          setAbsensiKehadiranRows((prev) => {
            const next = Array.isArray(prev) ? prev.map((p) => ({ ...p })) : []
            const index = next.findIndex((r) => r?.ip === row.ip)
            const normalized = {
              ip: row.ip,
              keluarga: typeof row.keluarga === 'string' ? row.keluarga : '-',
              mobile: typeof row.mobile === 'string' && row.mobile.trim() ? row.mobile : '-',
              dewasa: typeof row.dewasa === 'number' ? row.dewasa : dewasa,
              anak: typeof row.anak === 'number' ? row.anak : anak,
              ompu: typeof row.ompu === 'string' && row.ompu.trim() ? row.ompu : '-',
              createdByEmail: typeof row.createdByEmail === 'string' ? row.createdByEmail : null,
              createdByName: typeof row.createdByName === 'string' ? row.createdByName : null,
              updatedAt: typeof row.updatedAt === 'number' ? row.updatedAt : Date.now(),
            }
            if (index >= 0) {
              next[index] = normalized
              return next
            }
            return [normalized, ...next]
          })
        }

        try {
          const refreshResponse = await fetchWithAuth(`${apiBaseUrl}/api/absensi/kehadiran`, { cache: 'no-store' })
          const refreshRaw = await refreshResponse.text()
          let refreshData = null
          if (refreshRaw) {
            try {
              refreshData = JSON.parse(refreshRaw)
            } catch {
              refreshData = null
            }
          }
          if (refreshResponse.ok) {
            const rows = Array.isArray(refreshData?.rows) ? refreshData.rows : []
            setAbsensiKehadiranRows(rows)
            refreshAbsensiRekapHadir()
          }
        } catch (err) {
          void err
        }
      })
      .catch((err) => {
        alert(err?.message || 'Gagal menyimpan kehadiran.')
      })
      .finally(() => {
        setAbsensiApplySubmitting(false)
      })
  }

  const startEditAbsensiRow = (row) => {
    const ip = typeof row?.ip === 'string' ? row.ip.trim() : ''
    if (!ip) return

    setAbsensiEditIp(ip)
    setAbsensiSelectedIp(ip)
    setAbsensiKeluarga(typeof row?.keluarga === 'string' ? row.keluarga : '')
    setAbsensiMobile(typeof row?.mobile === 'string' ? row.mobile : '')
    setAbsensiPomparan(typeof row?.ompu === 'string' ? row.ompu : '')
    setAbsensiDewasa(String(typeof row?.dewasa === 'number' && row.dewasa > 0 ? row.dewasa : 0))
    setAbsensiAnak(String(typeof row?.anak === 'number' && row.anak > 0 ? row.anak : 0))
    setAbsensiDetailError('')
  }

  const updateAbsensi = async () => {
    const ip = typeof absensiEditIp === 'string' ? absensiEditIp.trim() : ''
    if (!ip) return

    const dewasa = normalizeCount(absensiDewasa)
    const anak = normalizeCount(absensiAnak)

    setAbsensiDewasa(String(dewasa))
    setAbsensiAnak(String(anak))

    const keluarga = typeof absensiKeluarga === 'string' ? absensiKeluarga.trim() : ''
    const mobile = typeof absensiMobile === 'string' ? absensiMobile.trim() : ''
    const ompu = typeof absensiPomparan === 'string' ? absensiPomparan.trim() : ''
    const domisili = typeof absensiDomisili === 'string' ? absensiDomisili.trim() : ''
    const sundut = typeof absensiSundut === 'string' ? absensiSundut.trim() : ''

    const payload = {
      ip,
      keluarga: keluarga || '-',
      mobile: mobile || '',
      dewasa,
      anak,
      ompu: ompu || '',
      updatedAt: Date.now(),
    }

    setAbsensiKehadiranRows((prev) => {
      const next = Array.isArray(prev) ? prev.map((p) => ({ ...p })) : []
      const index = next.findIndex((r) => r?.ip === ip)
      const localRow = {
        ...payload,
        mobile: payload.mobile || '-',
        ompu: payload.ompu || '-',
      }
      if (index >= 0) {
        next[index] = localRow
        return next
      }
      return [localRow, ...next]
    })

    setAbsensiApplySubmitting(true)
    try {
      let baseToUse = apiBaseUrl
      const postAbsensiDetail = async (base) =>
        fetchWithAuth(`${base}/api/absensi/detail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ip, domisili, sundut, telp: mobile }),
          cache: 'no-store',
        })

      let detailResponse = await postAbsensiDetail(baseToUse)

      const detailRaw = await detailResponse.text()
      let detailData = null
      if (detailRaw) {
        try {
          detailData = JSON.parse(detailRaw)
        } catch {
          detailData = null
        }
      }
      if (!detailResponse.ok) {
        throw new Error(detailData?.message || `Gagal update detail (HTTP ${detailResponse.status}).`)
      }

      const response = await fetchWithAuth(`${baseToUse}/api/absensi/kehadiran`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })
      const raw = await response.text()
      let data = null
      if (raw) {
        try {
          data = JSON.parse(raw)
        } catch {
          data = null
        }
      }
      if (!response.ok) {
        throw new Error(data?.message || `Gagal update kehadiran (HTTP ${response.status}).`)
      }
      const row = data?.row
      if (row && typeof row?.ip === 'string') {
        setAbsensiKehadiranRows((prev) => {
          const next = Array.isArray(prev) ? prev.map((p) => ({ ...p })) : []
          const index = next.findIndex((r) => r?.ip === row.ip)
          const normalized = {
            ip: row.ip,
            keluarga: typeof row.keluarga === 'string' ? row.keluarga : '-',
            mobile: typeof row.mobile === 'string' && row.mobile.trim() ? row.mobile : '-',
            dewasa: typeof row.dewasa === 'number' ? row.dewasa : dewasa,
            anak: typeof row.anak === 'number' ? row.anak : anak,
            ompu: typeof row.ompu === 'string' && row.ompu.trim() ? row.ompu : '-',
            updatedAt: typeof row.updatedAt === 'number' ? row.updatedAt : Date.now(),
          }
          if (index >= 0) {
            next[index] = normalized
            return next
          }
          return [normalized, ...next]
        })
      }

      const refreshResponse = await fetchWithAuth(`${baseToUse}/api/absensi/kehadiran`, { cache: 'no-store' })
      const refreshRaw = await refreshResponse.text()
      let refreshData = null
      if (refreshRaw) {
        try {
          refreshData = JSON.parse(refreshRaw)
        } catch {
          refreshData = null
        }
      }
      if (refreshResponse.ok) {
        const rows = Array.isArray(refreshData?.rows) ? refreshData.rows : []
        setAbsensiKehadiranRows(rows)
        refreshAbsensiRekapHadir(baseToUse)
      }

      setAbsensiEditIp('')
      setAbsensiSelectedIp('')
      setAbsensiKeluarga('')
      setAbsensiPomparan('')
      setAbsensiSundut('')
      setAbsensiDomisili('')
      setAbsensiMobile('')
      setAbsensiDewasa('')
      setAbsensiAnak('')
      setAbsensiDetailError('')
    } catch (err) {
      alert(err?.message || 'Gagal update data.')
    } finally {
      setAbsensiApplySubmitting(false)
    }
  }

  const deleteAbsensiRow = async (ip) => {
    const value = typeof ip === 'string' ? ip.trim() : ''
    if (!value) return
    try {
      const response = await fetchWithAuth(`${apiBaseUrl}/api/absensi/kehadiran?ip=${encodeURIComponent(value)}`, {
        method: 'DELETE',
      })
      const raw = await response.text()
      let data = null
      if (raw) {
        try {
          data = JSON.parse(raw)
        } catch {
          data = null
        }
      }
      if (!response.ok) {
        throw new Error(data?.message || `Gagal menghapus (HTTP ${response.status}).`)
      }
      setAbsensiEditIp((prev) => (prev === value ? '' : prev))
      setAbsensiKehadiranRows((prev) => (Array.isArray(prev) ? prev.filter((r) => r?.ip !== value) : []))
      refreshAbsensiRekapHadir()
    } catch (err) {
      alert(err?.message || 'Gagal menghapus data.')
    }
  }

  const clearAbsensiRows = async () => {
    try {
      const response = await fetchWithAuth(`${apiBaseUrl}/api/absensi/kehadiran/all`, { method: 'DELETE' })
      const raw = await response.text()
      let data = null
      if (raw) {
        try {
          data = JSON.parse(raw)
        } catch {
          data = null
        }
      }
      if (!response.ok) {
        throw new Error(data?.message || `Gagal menghapus semua (HTTP ${response.status}).`)
      }
      setAbsensiEditIp('')
      setAbsensiKehadiranRows([])
      refreshAbsensiRekapHadir()
    } catch (err) {
      alert(err?.message || 'Gagal menghapus semua data.')
    }
  }

  const absensiKehadiranStats = useMemo(() => {
    const rows = Array.isArray(absensiKehadiranRows) ? absensiKehadiranRows : []
    const kk = rows.length
    let dewasa = 0
    let anak = 0
    for (const r of rows) {
      dewasa += typeof r?.dewasa === 'number' ? r.dewasa : 0
      anak += typeof r?.anak === 'number' ? r.anak : 0
    }
    return { kk, dewasa, anak, jiwa: dewasa + anak }
  }, [absensiKehadiranRows])

  const absensiKehadiranFiltered = useMemo(() => {
    const rows = Array.isArray(absensiKehadiranRows) ? absensiKehadiranRows : []
    const q = typeof absensiKehadiranSearch === 'string' ? absensiKehadiranSearch.trim().toLowerCase() : ''
    if (!q) return rows
    return rows.filter((row) => {
      const keluarga = typeof row?.keluarga === 'string' ? row.keluarga.toLowerCase() : ''
      return keluarga.includes(q)
    })
  }, [absensiKehadiranRows, absensiKehadiranSearch])

  const absensiKehadiranIpSet = useMemo(() => {
    const rows = Array.isArray(absensiKehadiranRows) ? absensiKehadiranRows : []
    const set = new Set()
    for (const r of rows) {
      const ip = typeof r?.ip === 'string' ? r.ip.trim() : ''
      if (ip) set.add(ip)
    }
    return set
  }, [absensiKehadiranRows])

  const getAbsensiFamilyNames = (family) => {
    const isUnknown = (value) => {
      const v = String(value || '').trim()
      if (!v) return true
      const cleaned = v.replace(/[.,\s]/g, '')
      if (!cleaned) return true
      return /^[?-]+$/.test(cleaned)
    }
    const out = []
    const pushParts = (value) => {
      if (typeof value !== 'string') return
      const parts = value
        .split(',')
        .map((p) => p.trim())
        .filter((p) => !isUnknown(p))
      for (const p of parts) out.push(p)
    }
    const pushArray = (values) => {
      if (!Array.isArray(values)) return
      for (const v of values) {
        const s = String(v || '').trim()
        if (!isUnknown(s)) out.push(s)
      }
    }
    pushParts(family?.suami)
    pushParts(family?.isteri)
    pushArray(family?.anak)
    pushArray(family?.boru)
    return out
  }

  const getAbsensiFamilyDisplay = (family) => {
    const suamiValue = typeof family?.suami === 'string' ? family.suami : ''
    const isteriValue = typeof family?.isteri === 'string' ? family.isteri : ''
    const isUnknown = (value) => {
      const v = String(value || '').trim()
      if (!v) return true
      const cleaned = v.replace(/[.,\s]/g, '')
      if (!cleaned) return true
      return /^[?-]+$/.test(cleaned)
    }
    const pickFirst = (value) => {
      if (typeof value !== 'string') return ''
      const parts = value
        .split(',')
        .map((p) => p.trim())
        .filter((p) => !isUnknown(p))
      return parts[0] || ''
    }
    const suamiName = pickFirst(suamiValue)
    const isteriName = pickFirst(isteriValue)
    return `${suamiName || '-'} / ${isteriName || '-'}`
  }

  const absensiFamiliesVisible = useMemo(() => {
    const rows = Array.isArray(absensiFamilies) ? absensiFamilies : []
    const q = typeof absensiAnggotaSearch === 'string' ? absensiAnggotaSearch.trim().toLowerCase() : ''
    const selectedIp = typeof absensiSelectedIp === 'string' ? absensiSelectedIp.trim() : ''
    return rows.filter((family) => {
      const ip = typeof family?.ip === 'string' ? family.ip.trim() : ''
      if (!ip) return false
      if (!q && selectedIp && ip === selectedIp) return false
      if (absensiKehadiranIpSet.has(ip)) return false
      if (!q) return true
      const names = getAbsensiFamilyNames(family)
      const searchable = `${names.join(' ')} ${ip} ${getAbsensiFamilyDisplay(family)}`.toLowerCase()
      return searchable.includes(q)
    })
  }, [absensiFamilies, absensiKehadiranIpSet, absensiAnggotaSearch, absensiSelectedIp])

  const resetAbsensi = () => {
    setAbsensiAnggotaSearch('')
    setAbsensiKehadiranSearch('')
    setAbsensiSelectedIp('')
    setAbsensiEditIp('')
    setAbsensiKeluarga('')
    setAbsensiPomparan('')
    setAbsensiSundut('')
    setAbsensiDomisili('')
    setAbsensiMobile('')
    setAbsensiDewasa('')
    setAbsensiAnak('')
    setAbsensiDetailError('')
  }

  return (
    <div className="min-h-screen bg-white font-['Plus_Jakarta_Sans'] text-[#0b0b0b] antialiased">
      <div className="fixed inset-x-0 top-0 z-[1200] border-b border-black/10 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#c0392b] to-[#f1c40f] text-[#111111]">
              <span className="text-lg font-black">♦</span>
            </div>
            <div>
              <div className="font-['Space_Grotesk'] text-lg font-bold leading-tight tracking-tight">
                Dashboard Admin
              </div>
              <div className="text-xs text-black/60">{adminEmail}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-4 py-2 text-sm text-black/80 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Real-time aktif</span>
              <span className="text-black/40">•</span>
              <span className="tabular-nums text-black/70">{formatTime(new Date(now))}</span>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-black/[0.03] text-black/80 transition hover:bg-black/[0.06]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {dataBaru.filter(d => !d.is_read).length > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#c0392b] text-xs font-bold text-white">
                    {dataBaru.filter(d => !d.is_read).length}
                  </span>
                ) : null}
              </button>
              {notificationsOpen ? (
                <>
                  <div 
                    className="fixed inset-0 z-[1499] sm:hidden"
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="fixed right-5 left-5 top-20 z-[1500] max-w-full rounded-2xl border border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] sm:absolute sm:left-auto sm:right-0 sm:w-80">
                  <div className="border-b border-black/10 px-4 py-3">
                    <div className="font-bold text-black/90">Notifikasi</div>
                    <div className="text-xs text-black/60">Pesan baru dari pengunjung</div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {dataBaru.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-black/60">
                        Belum ada pesan
                      </div>
                    ) : (
                      <div className="divide-y divide-black/10">
                        {dataBaru.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSelectedNotification(item)
                              if (!item.is_read) {
                                fetchWithAuth(`${apiBaseUrl}/api/data-baru/${item.id}/read`, {
                                  method: 'PUT'
                                }).then(() => {
                                  setDataBaru(prev => prev.map(i => i.id === item.id ? { ...i, is_read: true } : i))
                                })
                              }
                            }}
                            className={`w-full px-4 py-3 text-left transition ${!item.is_read ? 'bg-[#f1c40f]/10' : 'bg-transparent'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-black/90">{item.nama_lengkap}</div>
                              {!item.is_read ? (
                                <span className="h-2 w-2 rounded-full bg-[#c0392b]" />
                              ) : null}
                            </div>
                            <div className="mt-1 text-xs text-black/60">
                              {new Date(item.created_at).toLocaleString('id-ID')}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-black/10 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setRefreshDataBaruKey(prev => prev + 1)}
                      className="w-full rounded-xl border border-black/10 bg-black/[0.03] px-4 py-2 text-sm font-semibold text-black/80 transition hover:bg-black/[0.06]"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                </>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-black/10 bg-black/[0.03] px-4 py-2 text-sm font-semibold text-black/90 transition hover:bg-black/[0.06]"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1200px] px-5 pt-24 pb-16">
        {importOpen ? (
          <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/70 px-5 py-10 backdrop-blur-sm">
            <div className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between gap-4 border-b border-black/10 px-6 py-4">
                <div>
                  <div className="font-['Space_Grotesk'] text-lg font-bold tracking-tight">Import File Excel</div>
                  <div className="mt-1 text-xs text-black/60">Buat tabel sesuai nama & isi dari file</div>
                </div>
                <button
                  type="button"
                  onClick={closeImport}
                  className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-sm text-black/80 transition hover:bg-black/[0.06]"
                >
                  Tutup
                </button>
              </div>

              <div className="space-y-4 px-6 py-5">
                <div>
                  <div className="text-sm font-semibold text-black/80">Nama tabel</div>
                  <input
                    value={importTableName}
                    onChange={(e) => setImportTableName(e.target.value)}
                    placeholder="contoh: data_keluarga"
                    className="mt-2 w-full rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black outline-none transition focus:border-black/20"
                    disabled={importSubmitting}
                  />
                  <div className="mt-2 text-xs text-black/50">
                    Hanya huruf/angka/underscore, tidak boleh diawali angka.
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-black/80">Nama file</div>
                  <div className="mt-2 rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black/80">
                    {importFile ? importFile.name : '-'}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-black/80">Upload Excel</div>
                  <input
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="mt-2 w-full rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black/70 file:mr-4 file:rounded-lg file:border-0 file:bg-black/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-black/15"
                    disabled={importSubmitting}
                  />
                </div>

                {importError ? (
                  <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    {importError}
                  </div>
                ) : null}

                {importResult?.ok ? (
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    Berhasil: tabel <span className="font-semibold">{importResult.tableName}</span> dibuat, data
                    masuk <span className="font-semibold">{importResult.inserted}</span> baris.
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-black/10 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeImport}
                  className="rounded-xl border border-black/10 bg-black/[0.03] px-5 py-3 text-sm font-semibold text-black/90 transition hover:bg-black/[0.06]"
                  disabled={importSubmitting}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={submitImport}
                  className="rounded-xl bg-gradient-to-r from-[#c0392b] to-[#f1c40f] px-5 py-3 text-sm font-semibold text-[#111111] transition hover:opacity-95 disabled:opacity-60"
                  disabled={importSubmitting}
                >
                  {importSubmitting ? 'Mengirim...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {selectedNotification ? (
          <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/70 px-5 py-10 backdrop-blur-sm">
            <div className="w-full max-w-[600px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.25)] animate-[zoomIn_0.3s_ease-out]">
              <style>{`
                @keyframes zoomIn {
                  from { transform: scale(0.9); opacity: 0; }
                  to { transform: scale(1); opacity: 1; }
                }
              `}</style>
              <div className="flex items-center justify-between gap-4 border-b border-black/10 px-6 py-4">
                <div>
                  <div className="font-['Space_Grotesk'] text-lg font-bold tracking-tight">
                    Pesan Baru dari {selectedNotification.nama_lengkap}
                  </div>
                  <div className="mt-1 text-xs text-black/60">
                    {new Date(selectedNotification.created_at).toLocaleString('id-ID')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNotification(null)}
                  className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-sm text-black/80 transition hover:bg-black/[0.06]"
                >
                  Tutup
                </button>
              </div>

              <div className="space-y-4 px-6 py-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[1px] text-black/60">Nama Lengkap</div>
                  <div className="mt-1 text-lg font-semibold text-black/90">{selectedNotification.nama_lengkap}</div>
                </div>
                {selectedNotification.email ? (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[1px] text-black/60">Email</div>
                    <div className="mt-1 text-sm text-black/80">{selectedNotification.email}</div>
                  </div>
                ) : null}
                {selectedNotification.domisili ? (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[1px] text-black/60">Domisili</div>
                    <div className="mt-1 text-sm text-black/80">{selectedNotification.domisili}</div>
                  </div>
                ) : null}
                {selectedNotification.pesan ? (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[1px] text-black/60">Pesan / Kontribusi</div>
                    <div className="mt-2 rounded-xl border border-black/10 bg-black/[0.02] p-4 text-sm text-black/80">
                      {selectedNotification.pesan}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-black/10 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setSelectedNotification(null)}
                  className="w-full rounded-xl bg-gradient-to-r from-[#c0392b] to-[#f1c40f] px-5 py-3 text-sm font-semibold text-[#111111] transition hover:opacity-95"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-6 md:flex-row">
          <aside className="h-max w-full shrink-0 md:sticky md:top-24 md:w-[280px]">
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-black/[0.02] p-4">
              <div className="px-2 pb-3 text-xs font-semibold uppercase tracking-[1px] text-black/50 hidden md:block">Menu</div>
              <div className="flex flex-row overflow-x-auto gap-2 md:flex-col md:overflow-x-visible pb-1 md:pb-0">
                <button
                  type="button"
                  onClick={() => setActiveMenu('data')}
                  className={`shrink-0 w-auto md:w-full rounded-xl border px-4 py-3 text-center md:text-left text-sm font-semibold transition ${
                    activeMenu === 'data'
                      ? 'border-black/20 bg-black/[0.06] text-black'
                      : 'border-black/10 bg-black/[0.03] text-black/80 hover:bg-black/[0.06]'
                  }`}
                >
                  <div>Data</div>
                  <div className="mt-1 text-xs font-normal text-black/60 hidden md:block">Monitoring keluarga & ruasORJ</div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMenu('absensi')}
                  className={`shrink-0 w-auto md:w-full rounded-xl border px-4 py-3 text-center md:text-left text-sm font-semibold transition ${
                    activeMenu === 'absensi'
                      ? 'border-black/20 bg-black/[0.06] text-black'
                      : 'border-black/10 bg-black/[0.03] text-black/80 hover:bg-black/[0.06]'
                  }`}
                >
                  <div>Absensi</div>
                  <div className="mt-1 text-xs font-normal text-black/60 hidden md:block">Kehadiran real-time</div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMenu('presentasi')}
                  className={`shrink-0 w-auto md:w-full rounded-xl border px-4 py-3 text-center md:text-left text-sm font-semibold transition ${
                    activeMenu === 'presentasi'
                      ? 'border-black/20 bg-black/[0.06] text-black'
                      : 'border-black/10 bg-black/[0.03] text-black/80 hover:bg-black/[0.06]'
                  }`}
                >
                  <div>Presentasi</div>
                  <div className="mt-1 text-xs font-normal text-black/60 hidden md:block">Grafik & persentase</div>
                </button>
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1 space-y-6">
            {activeMenu === 'data' ? (
              <>
                <div className="overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-r from-black/[0.03] to-black/[0.01] relative">
                  <button
                    type="button"
                    onClick={() => setRefreshDataKey(prev => prev + 1)}
                    className="absolute top-2 right-4 flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 bg-white shadow-sm transition hover:bg-black/[0.02] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={dataLoading}
                  >
                    {dataLoading ? (
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-black/25 border-t-black/70" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                      </svg>
                    )}
                  </button>
                  <div className="flex flex-col gap-8 px-6 py-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold uppercase tracking-[1px] text-[#c0392b]">
                        Admin Monitoring
                      </div>
                      <h1 className="mt-3 font-['Space_Grotesk'] text-3xl font-bold text-black tracking-tight">
                        Monitoring Keluarga & ruasORJ
                      </h1>
                      <p className="mt-2 max-w-[70ch] text-sm text-black/65">
                        Ringkasan data keluarga & ruasORJ, status verifikasi, serta pembaruan data otomatis.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <button
                        type="button"
                        className={actionButtonClass}
                        disabled
                        style={{ opacity: 0.4, cursor: 'not-allowed' }}
                      >
                        Tambah Data
                        <div className="mt-1 text-xs font-normal text-black/60">Input keluarga</div>
                      </button>
                      <button
                        type="button"
                        className={actionButtonClass}
                        disabled
                        style={{ opacity: 0.4, cursor: 'not-allowed' }}
                      >
                        Verifikasi
                        <div className="mt-1 text-xs font-normal text-black/60">Data pending</div>
                      </button>
                      <button
                        type="button"
                        onClick={handleLaporan}
                        className={actionButtonClass}
                        disabled={reportSubmitting}
                      >
                        {reportSubmitting ? (
                          <span className="inline-flex items-center gap-1">
                            <span>Tunggu</span>
                            <span className="inline-flex">
                              <span className="animate-pulse [animation-delay:0ms] [animation-duration:900ms]">.</span>
                              <span className="animate-pulse [animation-delay:200ms] [animation-duration:900ms]">.</span>
                              <span className="animate-pulse [animation-delay:400ms] [animation-duration:900ms]">.</span>
                            </span>
                          </span>
                        ) : (
                          <span>Laporan</span>
                        )}
                        <div className="mt-1 text-xs font-normal text-black/60">Rekap & export</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImportOpen(true)
                          setImportError('')
                          setImportResult(null)
                        }}
                        className={actionButtonClass}
                        disabled
                        style={{ opacity: 0.4, cursor: 'not-allowed' }}
                      >
                        Import Excel
                        <div className="mt-1 text-xs font-normal text-black/60">Buat tabel</div>
                      </button>
                    </div>
                  </div>
                </div>

                {dataLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <span className="h-10 w-10 animate-spin rounded-full border-3 border-black/20 border-t-black/60" />
                  </div>
                ) : (
                  <section className="grid grid-cols-1 gap-6 md:grid-cols-4">
                    <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-6">
                      <div className="text-sm font-semibold text-black/70">Jumlah Data Keluarga</div>
                      <MetricValue
                        value={metrics.families}
                        className="mt-2 text-3xl font-black tabular-nums tracking-tight"
                        spinnerClassName="h-6 w-6"
                      />
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10">
                        <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#c0392b] to-[#f1c40f]" />
                      </div>
                      <div className="mt-2 text-xs text-black/55">
                        {metricsError ? metricsError : 'Update otomatis'}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-6">
                      <div className="text-sm font-semibold text-black/70">Jumlah Data Ruas ORJ</div>
                      <MetricValue
                        value={metrics.ruasOrj}
                        className="mt-2 text-3xl font-black tabular-nums tracking-tight"
                        spinnerClassName="h-6 w-6"
                      />
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10">
                        <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#c0392b] to-[#f1c40f]" />
                      </div>
                      <div className="mt-2 text-xs text-black/55">Update otomatis</div>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-6">
                      <div className="text-sm font-semibold text-black/70">Keluarga</div>
                      <div className="mt-4 overflow-hidden rounded-xl border border-black/10 bg-black/[0.03]">
                        <div className="grid grid-cols-2">
                          <div className="min-w-0 px-4 py-3">
                            <div className="text-xs font-semibold text-black/55">Suami</div>
                            <MetricValue
                              value={metrics.keluargaSuami}
                              className="mt-1 whitespace-nowrap text-[clamp(0.9rem,2.6vw,1.15rem)] font-black tabular-nums leading-none tracking-tight"
                              spinnerClassName="h-4 w-4"
                            />
                          </div>
                          <div className="min-w-0 border-l border-black/10 px-4 py-3">
                            <div className="text-xs font-semibold text-black/55">Isteri</div>
                            <MetricValue
                              value={metrics.keluargaIstri}
                              className="mt-1 whitespace-nowrap text-[clamp(0.9rem,2.6vw,1.15rem)] font-black tabular-nums leading-none tracking-tight"
                              spinnerClassName="h-4 w-4"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 overflow-hidden rounded-xl border border-black/10 bg-black/[0.03]">
                        <div className="grid grid-cols-2">
                          <div className="min-w-0 px-3 py-3 md:px-4">
                            <div className="text-xs font-semibold text-black/55">Anak</div>
                            <MetricValue
                              value={metrics.keluargaAnak}
                              className="mt-1 whitespace-nowrap text-[clamp(0.9rem,2.6vw,1.15rem)] font-black tabular-nums leading-none tracking-tight"
                              spinnerClassName="h-4 w-4"
                            />
                          </div>
                          <div className="min-w-0 border-l border-black/10 px-3 py-3 md:px-4">
                            <div className="text-xs font-semibold text-black/55">Boru</div>
                            <MetricValue
                              value={metrics.keluargaBoru}
                              className="mt-1 whitespace-nowrap text-[clamp(0.9rem,2.6vw,1.15rem)] font-black tabular-nums leading-none tracking-tight"
                              spinnerClassName="h-4 w-4"
                            />
                          </div>
                          <div className="min-w-0 border-t border-black/10 px-3 py-3 md:px-4">
                            <div className="text-xs font-semibold text-black/55">Dolidoli</div>
                            <MetricValue
                              value={metrics.keluargaDolidoli}
                              className="mt-1 whitespace-nowrap text-[clamp(0.9rem,2.6vw,1.15rem)] font-black tabular-nums leading-none tracking-tight"
                              spinnerClassName="h-4 w-4"
                            />
                          </div>
                          <div className="min-w-0 border-l border-t border-black/10 px-3 py-3 md:px-4">
                            <div className="text-[11px] font-semibold leading-none text-black/55">Namabaju</div>
                            <MetricValue
                              value={metrics.keluargaNamabaju}
                              className="mt-1 whitespace-nowrap text-[clamp(0.9rem,2.6vw,1.15rem)] font-black tabular-nums leading-none tracking-tight"
                              spinnerClassName="h-4 w-4"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-6">
                      <div className="text-sm font-semibold text-black/70">Ruas ORJ</div>
                      <div className="mt-4 overflow-hidden rounded-xl border border-black/10 bg-black/[0.03]">
                        <div className="grid grid-cols-2">
                          <div className="min-w-0 px-4 py-3">
                            <div className="text-xs font-semibold text-black/55">Anak</div>
                            <MetricValue
                              value={metrics.ruasOrjAnak}
                              className="mt-1 whitespace-nowrap text-[clamp(0.9rem,2.6vw,1.15rem)] font-black tabular-nums leading-none tracking-tight"
                              spinnerClassName="h-4 w-4"
                            />
                          </div>
                          <div className="min-w-0 border-l border-black/10 px-4 py-3">
                            <div className="text-xs font-semibold text-black/55">Boru</div>
                            <MetricValue
                              value={metrics.ruasOrjBoru}
                              className="mt-1 whitespace-nowrap text-[clamp(0.9rem,2.6vw,1.15rem)] font-black tabular-nums leading-none tracking-tight"
                              spinnerClassName="h-4 w-4"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}
              </>
            ) : null}

            {activeMenu === 'absensi' ? (
              <>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
                  <section className="overflow-hidden rounded-2xl border border-black/10 bg-black/[0.02] relative">
                    <button
                      type="button"
                      onClick={() => setRefreshAbsensiFamiliesKey(prev => prev + 1)}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 bg-white shadow-sm transition hover:bg-black/[0.02] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={absensiFamiliesLoading}
                    >
                      {absensiFamiliesLoading ? (
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-black/25 border-t-black/70" />
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                          <path d="M21 3v5h-5" />
                        </svg>
                      )}
                    </button>
                    <div className="border-b border-black/10 bg-gradient-to-r from-[#f1c40f]/20 to-[#f7d46a]/10 px-4 py-3">
                      <div className="text-center text-sm font-extrabold tracking-wide text-black/80">
                        DAFTAR ANGGOTA <span className="text-[#c0392b]">ORJ</span> (
                        <span className="text-black/60">
                          {absensiFamiliesLoading ? '… KK' : `${absensiFamiliesVisible.length.toLocaleString('id-ID')} KK`}
                        </span>
                        )
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="h-[420px] overflow-hidden rounded-xl border border-black/10 bg-[#f7f1dd]">
                        <div className="h-full overflow-y-auto p-3">
                          {absensiFamiliesLoading || absensiFamilies.length === 0 ? (
                            <div className="flex items-center justify-center py-10">
                              <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black/60" />
                            </div>
                          ) : absensiFamiliesError ? (
                            <div className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-4 text-sm text-black/70">
                              {absensiFamiliesError}
                            </div>
                          ) : absensiFamiliesVisible.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-black/15 bg-black/[0.02] px-4 py-6 text-center">
                              <div className="text-sm font-semibold text-black/80">Tidak ada anggota tersisa</div>
                              <div className="mt-1 text-xs text-black/55">Semua anggota sudah masuk ke data kehadiran.</div>
                            </div>
                          ) : (
                            <div className="divide-y divide-black/10">
                              {absensiFamiliesVisible.map((family) => {
                                const selected = family?.ip === absensiSelectedIp
                                const display = getAbsensiFamilyDisplay(family)
                                return (
                                  <button
                                    key={family?.ip || family?.display}
                                    type="button"
                                    onClick={() => setAbsensiSelectedIp(family?.ip || '')}
                                    className={`w-full px-4 py-2 text-left transition ${
                                      selected ? 'bg-black/[0.04]' : 'bg-transparent hover:bg-black/[0.02]'
                                    }`}
                                  >
                                    <div className="text-sm font-semibold leading-snug text-black/90">{display}</div>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-black/10 bg-black/[0.03] px-4 py-3 text-center text-xs font-bold tracking-[2px] text-black/70">
                      IANAKHON:
                    </div>
                    <div className="overflow-hidden rounded-b-2xl border-t border-black/10 bg-white">
                      <div className="p-4">
                        {selectedAbsensiFamily ? (
                          <div className="space-y-4">
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold uppercase tracking-[1px] text-black/60">
                                Anak
                              </div>
                              {Array.isArray(selectedAbsensiFamily?.anak) && selectedAbsensiFamily.anak.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {selectedAbsensiFamily.anak.map((name) => (
                                    <span
                                      key={`anak-${name}`}
                                      className="rounded-full border border-black/10 bg-black/[0.02] px-3 py-1 text-xs font-semibold text-black/75"
                                    >
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-2 text-sm text-black/55">—</div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="text-xs font-extrabold uppercase tracking-[1px] text-black/60">
                                Boru
                              </div>
                              {Array.isArray(selectedAbsensiFamily?.boru) && selectedAbsensiFamily.boru.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {selectedAbsensiFamily.boru.map((name) => (
                                    <span
                                      key={`boru-${name}`}
                                      className="rounded-full border border-black/10 bg-black/[0.02] px-3 py-1 text-xs font-semibold text-black/75"
                                    >
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-2 text-sm text-black/55">—</div>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-2xl border border-black/10 bg-black/[0.02]">
                    <div className="border-b border-black/10 bg-white/70 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex w-full flex-1 items-center gap-3">
                          <input
                            value={absensiAnggotaSearch}
                            onChange={(e) => setAbsensiAnggotaSearch(e.target.value)}
                            placeholder="Cari..."
                            className="h-10 w-full rounded-xl border border-black/10 bg-black/[0.03] px-4 text-sm text-black outline-none transition focus:border-black/20 sm:max-w-[420px]"
                          />
                          <button type="button" onClick={resetAbsensi} className={actionButtonClass}>
                            Reset
                          </button>
                        </div>

                        <div className="flex w-full flex-col items-end gap-1 lg:w-auto">
                          <div className="text-sm text-black/70 tabular-nums">
                            {new Intl.DateTimeFormat('id-ID', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            }).format(new Date(now))}{' '}
                            {formatTime(new Date(now))}
                          </div>
                          <div className="font-['Space_Grotesk'] text-2xl font-extrabold tracking-tight text-[#ff8a00]">
                            Bonataon 2026
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      {absensiDetailLoading ? (
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-black/70">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/60" />
                          Memuat data anggota...
                        </div>
                      ) : absensiDetailError ? (
                        <div className="mb-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-black/70">
                          {absensiDetailError}
                        </div>
                      ) : null}
                      <div className="grid grid-cols-1 gap-3">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[110px_1fr] sm:items-center">
                          <div className="shrink-0 rounded-lg bg-black/[0.05] px-3 py-2 text-sm font-semibold text-black/90">
                            Keluarga
                          </div>
                          <input
                            value={absensiKeluarga}
                            onChange={(e) => setAbsensiKeluarga(e.target.value)}
                            className="h-10 w-full rounded-xl border border-black/10 bg-black/[0.03] px-4 text-sm text-black outline-none transition focus:border-black/20"
                            placeholder="-"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[110px_1fr] sm:items-center">
                          <div className="shrink-0 rounded-lg bg-black/[0.05] px-3 py-2 text-sm font-semibold text-black/90">
                            Pomparan
                          </div>
                          <input
                            value={absensiPomparan}
                            onChange={(e) => setAbsensiPomparan(e.target.value)}
                            className="h-10 w-full rounded-xl border border-black/10 bg-black/[0.03] px-4 text-sm text-black outline-none transition focus:border-black/20"
                            placeholder="-"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[110px_1fr] sm:items-start">
                          <div className="shrink-0 rounded-lg bg-black/[0.05] px-3 py-2 text-sm font-semibold text-black/90">
                            Domisili
                          </div>
                          <textarea
                            value={absensiDomisili}
                            onChange={(e) => setAbsensiDomisili(e.target.value)}
                            className="h-[88px] w-full resize-none rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black outline-none transition focus:border-black/20"
                            placeholder="-"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[110px_1fr] sm:items-center">
                          <div className="shrink-0 rounded-lg bg-black/[0.05] px-3 py-2 text-sm font-semibold text-black/90">
                            Sundut
                          </div>
                          <input
                            value={absensiSundut}
                            onChange={(e) => setAbsensiSundut(e.target.value)}
                            className="h-10 w-full rounded-xl border border-black/10 bg-black/[0.03] px-4 text-sm text-black outline-none transition focus:border-black/20"
                            placeholder="-"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[110px_1fr] sm:items-start">
                          <div className="shrink-0 rounded-lg bg-black/[0.05] px-3 py-2 text-sm font-semibold text-black/90">
                            Mobile
                          </div>
                          <textarea
                            value={absensiMobile}
                            onChange={(e) => setAbsensiMobile(e.target.value)}
                            className="h-[88px] w-full resize-none rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black outline-none transition focus:border-black/20"
                            placeholder="-"
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="min-w-0 overflow-hidden rounded-2xl border border-black/10 bg-white p-4">
                          <div className="space-y-4">
                            <div className="space-y-1 text-center">
                              <div className="text-[11px] font-extrabold uppercase tracking-[2px] text-black/60">
                                Kehadiran
                              </div>
                              <div className="font-['Space_Grotesk'] text-xl font-extrabold tracking-tight text-black/90">
                                Tamu
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#f1c40f]/40 bg-[#f1c40f]/10 px-4 py-4 text-[#111111]">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f1c40f]/35">
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-5 w-5 text-[#111111]"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
                                    <path d="M4 20a8 8 0 0 1 16 0" />
                                  </svg>
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-black/70">Dewasa</div>
                                  <input
                                    inputMode="numeric"
                                    type="text"
                                    pattern="[0-9]*"
                                    value={absensiDewasa}
                                    onChange={(e) => setAbsensiDewasa(e.target.value.replace(/[^\d]/g, ''))}
                                    className="mt-1 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-2xl font-black tabular-nums leading-none text-black/90 outline-none transition focus:border-black/20"
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                              <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#f1c40f]/35 bg-[#f7d46a]/20 px-4 py-4 text-[#111111]">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f7d46a]/35">
                                  <svg
                                    viewBox="0 0 24 24"
                                    className="h-5 w-5 text-[#111111]"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
                                    <path d="M4 20a8 8 0 0 1 16 0" />
                                  </svg>
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-black/70">Anak</div>
                                  <input
                                    inputMode="numeric"
                                    type="text"
                                    pattern="[0-9]*"
                                    value={absensiAnak}
                                    onChange={(e) => setAbsensiAnak(e.target.value.replace(/[^\d]/g, ''))}
                                    className="mt-1 h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-2xl font-black tabular-nums leading-none text-black/90 outline-none transition focus:border-black/20"
                                    placeholder="0"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="min-w-0 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                              <div className="border-b border-black/10 bg-gradient-to-r from-[#f1c40f]/25 to-white px-4 py-3 text-xs font-extrabold uppercase tracking-[1px] text-black/80">
                                Rekap Hadir
                              </div>
                              <div className="grid grid-cols-1 gap-2 p-4 text-xs text-black/80 sm:grid-cols-2">
                                <div className="rounded-xl border border-black/10 bg-black/[0.02] px-3 py-2">
                                  O. TUAN:{' '}
                                  {absensiRekapHadir ? `${formatNumber(absensiRekapHadir.otuan)} KK` : '—'}
                                </div>
                                <div className="rounded-xl border border-black/10 bg-black/[0.02] px-3 py-2">
                                  O. SOTARGOLING:{' '}
                                  {absensiRekapHadir ? `${formatNumber(absensiRekapHadir.osotargoling)} KK` : '—'}
                                </div>
                                <div className="rounded-xl border border-black/10 bg-black/[0.02] px-3 py-2">
                                  O. MOGOT:{' '}
                                  {absensiRekapHadir ? `${formatNumber(absensiRekapHadir.omogot)} KK` : '—'}
                                </div>
                                <div className="rounded-xl border border-black/10 bg-black/[0.02] px-3 py-2">
                                  O. DATU P.:{' '}
                                  {absensiRekapHadir ? `${formatNumber(absensiRekapHadir.odatup)} KK` : '—'}
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2">
                              {absensiEditIp ? (
                                <button
                                  type="button"
                                  className={actionButtonClass}
                                  onClick={updateAbsensi}
                                  disabled={absensiDetailLoading || absensiApplySubmitting}
                                >
                                  {absensiApplySubmitting ? (
                                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black/70" />
                                  ) : (
                                    'Update'
                                  )}
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className={actionButtonClass}
                                onClick={applyAbsensi}
                                disabled={absensiDetailLoading || absensiApplySubmitting || !absensiSelectedIp}
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white relative">
                        <button
                          type="button"
                          onClick={() => setRefreshAbsensiKehadiranKey(prev => prev + 1)}
                          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 bg-white shadow-sm transition hover:bg-black/[0.02] disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={absensiKehadiranLoading}
                        >
                          {absensiKehadiranLoading ? (
                            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-black/25 border-t-black/70" />
                          ) : (
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                              <path d="M21 3v5h-5" />
                            </svg>
                          )}
                        </button>
                        <div className="flex flex-col gap-3 border-b border-black/10 bg-gradient-to-r from-[#f1c40f]/20 to-[#f7d46a]/10 px-4 py-3 md:flex-row md:items-center md:justify-between">
                          <div className="text-sm font-bold text-black/80">
                            DATA KEHADIRAN <span className="text-black/40">|</span>{' '}
                            {formatNumber(absensiKehadiranStats.kk)} KK <span className="text-black/40">|</span>{' '}
                            Dewasa: {formatNumber(absensiKehadiranStats.dewasa)} <span className="text-black/40">/</span> Anak:{' '}
                            {formatNumber(absensiKehadiranStats.anak)} <span className="text-black/40">|</span> TOTAL:{' '}
                            {formatNumber(absensiKehadiranStats.jiwa)} Jiwa
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className={actionButtonClass}
                              onClick={clearAbsensiRows}
                              disabled={absensiKehadiranLoading || absensiApplySubmitting || absensiKehadiranRows.length === 0}
                            >
                              Hapus Semua
                            </button>
                            <div className="text-sm font-semibold text-black/70">Cari</div>
                            <input
                              value={absensiKehadiranSearch}
                              onChange={(e) => setAbsensiKehadiranSearch(e.target.value)}
                              className="h-9 w-52 rounded-xl border border-black/10 bg-black/[0.03] px-3 text-sm text-black outline-none transition focus:border-black/20"
                              placeholder="-"
                            />
                          </div>
                        </div>

                        <div className="w-full overflow-x-auto">
                          <div className="min-w-max">
                              <div className="grid min-w-max grid-cols-[minmax(140px,1.4fr)_minmax(110px,1fr)_minmax(56px,0.55fr)_minmax(56px,0.55fr)_minmax(110px,1fr)_minmax(110px,0.8fr)_minmax(92px,0.65fr)] border-b border-black/10 bg-black/[0.03] px-4 py-3 text-xs font-semibold uppercase tracking-[1px] text-black/60">
                                <div className="min-w-0">Keluarga</div>
                                <div className="min-w-0">Mobile</div>
                                <div className="min-w-0 text-center">Dewasa</div>
                                <div className="min-w-0 text-center">Anak</div>
                                <div className="min-w-0">Ompu</div>
                                <div className="min-w-0">Ditambah oleh</div>
                                <div className="min-w-0 text-right">Aksi</div>
                              </div>
                              {absensiKehadiranLoading ? (
                                <div className="px-4 py-8 text-center text-sm text-black/60">Memuat data kehadiran...</div>
                              ) : absensiKehadiranFiltered.length === 0 ? (
                                <div className="px-4 py-8 text-center text-sm text-black/60">Belum ada data kehadiran.</div>
                              ) : (
                                <div className="divide-y divide-black/10">
                                  {absensiKehadiranFiltered.map((row) => (
                                    <div
                                      key={row?.ip || row?.updatedAt}
                                      className="grid min-w-max grid-cols-[minmax(140px,1.4fr)_minmax(110px,1fr)_minmax(56px,0.55fr)_minmax(56px,0.55fr)_minmax(110px,1fr)_minmax(110px,0.8fr)_minmax(92px,0.65fr)] px-4 py-3 text-sm text-black/80"
                                    >
                                      <div className="min-w-0 whitespace-nowrap font-semibold text-black/90">
                                        {typeof row?.keluarga === 'string' ? row.keluarga : '-'}
                                      </div>
                                      <div className="min-w-0 whitespace-nowrap">
                                        {typeof row?.mobile === 'string' && row.mobile.trim() ? row.mobile : '-'}
                                      </div>
                                      <div className="min-w-0 text-center font-semibold tabular-nums">
                                        {formatNumber(typeof row?.dewasa === 'number' ? row.dewasa : 0)}
                                      </div>
                                      <div className="min-w-0 text-center font-semibold tabular-nums">
                                        {formatNumber(typeof row?.anak === 'number' ? row.anak : 0)}
                                      </div>
                                      <div className="min-w-0 whitespace-nowrap">
                                        {typeof row?.ompu === 'string' && row.ompu.trim() ? row.ompu : '-'}
                                      </div>
                                      <div className="min-w-0 whitespace-nowrap">
                                        {typeof row?.createdByName === 'string' && row.createdByName.trim() ? (
                                          <span className="inline-flex items-center gap-1 rounded-full border border-[#f1c40f]/30 bg-[#f1c40f]/10 px-2 py-1 text-xs font-semibold text-black/80">
                                            {row.createdByName}
                                          </span>
                                        ) : (
                                          <span className="text-xs text-black/40">—</span>
                                        )}
                                      </div>
                                      <div className="min-w-0 flex items-center justify-end gap-2">
                                        <button
                                          type="button"
                                          className="rounded-lg border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold text-black/80 transition hover:bg-black/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
                                          onClick={() => startEditAbsensiRow(row)}
                                          disabled={absensiApplySubmitting}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-black/80 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                                          onClick={() => deleteAbsensiRow(row?.ip)}
                                          disabled={absensiApplySubmitting}
                                        >
                                          Hapus
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                      </div>
                    </div>
                  </section>
                </div>
              </>
            ) : null}

            {activeMenu === 'presentasi' ? (
              <>
                <div className="overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-r from-black/[0.03] to-black/[0.01] relative">
                  <button
                    type="button"
                    onClick={() => setRefreshPresentasiKey(prev => prev + 1)}
                    className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 bg-white shadow-sm transition hover:bg-black/[0.02] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={presentasiLoading}
                  >
                    {presentasiLoading ? (
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-black/25 border-t-black/70" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                      </svg>
                    )}
                  </button>
                  <div className="flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold uppercase tracking-[1px] text-[#c0392b]">
                        Grafik Kehadiran
                      </div>
                      <h1 className="mt-3 font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-black">
                        Presentasi Kehadiran
                      </h1>
                      <p className="mt-2 max-w-[70ch] text-sm text-black/65">
                        Ringkasan visual jumlah KK terdata dibanding target, serta progres pengisian data kehadiran.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black/80">
                        Target: <span className="font-black tabular-nums text-black">
                          {typeof dbAbsensiFamiliesCount === 'number' ? dbAbsensiFamiliesCount.toLocaleString('id-ID') : '—'} KK
                        </span>
                      </div>
                      <div className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-black/80">
                        Terdata:{' '}
                        <span className="font-black tabular-nums text-black">
                          {typeof presentasiKehadiran?.kk === 'number' ? presentasiKehadiran.kk.toLocaleString('id-ID') : '—'}
                        </span>{' '}
                        KK
                      </div>
                      <button
                        type="button"
                        className={actionButtonClass}
                        onClick={handleExportPdf}
                        disabled={exportPdfLoading}
                      >
                        {exportPdfLoading ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black/70" />
                            <span>Memproses</span>
                          </span>
                        ) : (
                          'Export PDF'
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {presentasiLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <span className="h-10 w-10 animate-spin rounded-full border-3 border-black/20 border-t-black/60" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <section className="overflow-hidden rounded-2xl border border-black/10 bg-white p-6 lg:col-span-2">
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-black/70">Progres KK</div>
                          <div className="mt-1 font-['Space_Grotesk'] text-2xl font-extrabold tracking-tight text-black/90">
                            Terdata vs Target
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-semibold text-black/70">
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#f1c40f]" />
                            Terdata
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
                            Sisa
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr] md:items-center">
                        <div className="flex items-center justify-center">
                          {typeof presentasiKehadiran?.kk !== 'number' || typeof dbAbsensiFamiliesCount !== 'number' ? (
                            <span className="h-10 w-10 animate-spin rounded-full border-2 border-black/20 border-t-black/60" />
                          ) : (
                            (() => {
                              const target = dbAbsensiFamiliesCount
                              const total = presentasiKehadiran.kk
                              const pct = target > 0 ? Math.max(0, Math.min(100, (total / target) * 100)) : 0
                              const pctText = `${pct.toFixed(1)}%`
                              return (
                                <div className="relative h-44 w-44">
                                  <div
                                    className="h-full w-full rounded-full border border-black/10"
                                    style={{
                                      background: `conic-gradient(#f1c40f ${pct}%, rgba(0,0,0,0.08) 0)`,
                                    }}
                                  />
                                  <div className="absolute inset-4 rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]" />
                                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <div className="text-xs font-semibold uppercase tracking-[2px] text-black/60">
                                      Progres
                                    </div>
                                    <div className="mt-1 font-['Space_Grotesk'] text-3xl font-black tracking-tight text-black">
                                      {pctText}
                                    </div>
                                    <div className="mt-1 text-xs text-black/55">
                                      {total.toLocaleString('id-ID')} / {target.toLocaleString('id-ID')} KK
                                    </div>
                                  </div>
                                </div>
                              )
                            })()
                          )}
                        </div>

                        <div className="min-w-0">
                          {typeof presentasiKehadiran?.kk !== 'number' || typeof dbAbsensiFamiliesCount !== 'number' ? (
                            <div className="space-y-3">
                              <div className="h-3 w-full animate-pulse rounded-full bg-black/10" />
                              <div className="h-3 w-5/6 animate-pulse rounded-full bg-black/10" />
                              <div className="h-3 w-2/3 animate-pulse rounded-full bg-black/10" />
                            </div>
                          ) : (
                            (() => {
                              const target = dbAbsensiFamiliesCount
                              const total = presentasiKehadiran.kk
                              const sisa = Math.max(0, target - total)
                              const pct = target > 0 ? Math.max(0, Math.min(100, (total / target) * 100)) : 0
                              return (
                                <div className="space-y-4">
                                  <div className="overflow-hidden rounded-2xl border border-black/10 bg-black/[0.02] p-4">
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="text-sm font-semibold text-black/70">Terdata</div>
                                      <div className="text-lg font-black tabular-nums text-black">
                                        {total.toLocaleString('id-ID')}
                                      </div>
                                    </div>
                                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/10">
                                      <div
                                        className="h-full rounded-full bg-gradient-to-r from-[#f1c40f] to-[#f7d46a]"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>

                                  <div className="overflow-hidden rounded-2xl border border-black/10 bg-black/[0.02] p-4">
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="text-sm font-semibold text-black/70">Sisa ke Target</div>
                                      <div className="text-lg font-black tabular-nums text-black">
                                        {sisa.toLocaleString('id-ID')}
                                      </div>
                                    </div>
                                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/10">
                                      <div
                                        className="h-full rounded-full bg-black/20"
                                        style={{ width: `${100 - pct}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )
                            })()
                          )}
                        </div>
                      </div>
                    </section>

                    <aside className="overflow-hidden rounded-2xl border border-black/10 bg-white p-6">
                      <div className="text-sm font-semibold text-black/70">Status Data</div>
                      <div className="mt-1 font-['Space_Grotesk'] text-2xl font-extrabold tracking-tight text-black/90">
                        Kehadiran
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-4">
                          <div className="text-xs font-extrabold uppercase tracking-[2px] text-black/60">
                            Data Kehadiran
                          </div>
                          <div className="mt-2 text-sm text-black/65">
                            Grafik ini akan terisi otomatis setelah data kehadiran (dewasa/anak) mulai dicatat.
                          </div>
                        </div>

                        <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-black/70">Terdata KK</div>
                            <div className="text-base font-black tabular-nums text-black">
                              {typeof presentasiKehadiran?.kk === 'number' ? presentasiKehadiran.kk.toLocaleString('id-ID') : '—'}
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[#f1c40f]" />
                            <div className="text-xs font-semibold text-black/60">Sumber: tabel daftar_kehadiran</div>
                          </div>
                        </div>
                      </div>
                    </aside>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
