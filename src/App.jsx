import { useCallback, useEffect, useRef, useState } from 'react'
import Dashboard from './components/Dashboard'
import foto2 from './assets/foto2.jpg'
import anonim from './assets/anonim.jpg'
import raja from './assets/raja.jpg'
import padan from './assets/padan.jpg'
import kampung from './assets/kampung.jpg'

function SilsilahFlow() {
  const containerRef = useRef(null)
  const transformLayerRef = useRef(null)
  const svgLayerRef = useRef(null)
  const nodesContainerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    const transformLayer = transformLayerRef.current
    const svgLayer = svgLayerRef.current
    const nodesContainer = nodesContainerRef.current

    if (!container || !transformLayer || !svgLayer || !nodesContainer) return

    const treeData = {
      id: 'root',
      name: 'R.Lumban Tobing',
      children: [
        { id: 'r-nadjurdjur', name: 'R.Nadjurdjur' },
        {
          id: 'sariburadja',
          name: 'Sariburadja',
          children: [
            { id: 'datu-toktang-diadji', name: 'Datu Toktang Diadji' },
            {
              id: 'tumonggo-tua',
              name: 'Tumonggo Tua',
              children: [
                {
                  id: 'namorahin',
                  name: 'Namorahian',
                  children: [
                    {
                      id: 'orj-idjaedjae',
                      name: 'O.R.idjaedjae',
                      children: [
                        { id: 'o-tuan', name: 'O.Tuan' },
                        { id: 'o-taragoling', name: 'O.Taragoling' },
                        { id: 'o-mogot', name: 'O.Mogot' },
                        { id: 'datu-panganganaa-a', name: 'Datu Panganganaa' },
                      ],
                    },
                    {
                      id: 'bonan-dolok',
                      name: 'Bonan Dolok',
                      children: [
                        {
                          id: 'panguluradja',
                          name: 'Panguluradja',
                          children: [
                            { id: 'o-sumurung', name: 'O.Sumurung' },
                            { id: 'o-sumuntul', name: 'O.Sumuntul' },
                            { id: 'o-somale', name: 'O.Somale' },
                          ],
                        },
                        { id: 'namora-sende', name: 'Namora Sende' },
                        { id: 'panahan-tunggal', name: 'Panahan Tunggal' },
                      ],
                    },
                    {
                      id: 'parumarea',
                      name: 'Parumarea',
                      children: [
                        { id: 'danggur-soaloan', name: 'Danggur Soaloan' },
                        { id: 'o-ranggas', name: 'O.Ranggas' },
                        { id: 'paima-tahi', name: 'Paima Tahi' },
                        { id: 'datu-panganganaa-b', name: 'Datu Panganganaa' },
                      ],
                    },
                  ],
                },
                {
                  id: 'rangkea-sipapagan',
                  name: 'Rangkea Sipapagan',
                  children: [
                    { id: 'r-orang-marberang', name: 'R.Orang Marberang' },
                    { id: 'porhislaga', name: 'Porhislaga' },
                    { id: 'sahapanaluan', name: 'Sahapanaluan' },
                    { id: 'lenge2-ampang', name: 'Lenge2 Ampang' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    const CONFIG = {
      nodeWidth: 160,
      nodeHeight: 32,
      verticalGap: 70,
      startY: 20,
      virtualWidth: 1600,
    }

    let nodes = []
    let edges = []
    let scale = 1
    let pointX = 0
    let pointY = 0

    const updateTransform = () => {
      transformLayer.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`
    }

    const POSITION = {
      root: { x: 0.56, row: 0 },

      'r-nadjurdjur': { x: 0.2, row: 1 },
      sariburadja: { x: 0.82, row: 1 },

      'datu-toktang-diadji': { x: 0.88, row: 2 },
      'tumonggo-tua': { x: 0.58, row: 2 },

      namorahin: { x: 0.28, row: 3 },
      'rangkea-sipapagan': { x: 0.68, row: 3 },

      'orj-idjaedjae': { x: 0.12, row: 4 },
      'bonan-dolok': { x: 0.38, row: 4 },
      parumarea: { x: 0.56, row: 4 },
      'r-orang-marberang': { x: 0.86, row: 4 },

      'o-tuan': { x: 0.12, row: 5 },
      panguluradja: { x: 0.3, row: 5 },
      'namora-sende': { x: 0.4, row: 5 },
      'panahan-tunggal': { x: 0.48, row: 5 },
      'danggur-soaloan': { x: 0.62, row: 5 },
      porhislaga: { x: 0.86, row: 5 },

      'o-taragoling': { x: 0.12, row: 6 },
      'o-ranggas': { x: 0.58, row: 6 },
      sahapanaluan: { x: 0.86, row: 6 },

      'o-mogot': { x: 0.12, row: 7 },
      'paima-tahi': { x: 0.58, row: 7 },
      'lenge2-ampang': { x: 0.86, row: 7 },

      'datu-panganganaa-a': { x: 0.12, row: 8 },
      'datu-panganganaa-b': { x: 0.58, row: 8 },

      'o-sumurung': { x: 0.25, row: 9 },
      'o-sumuntul': { x: 0.36, row: 9 },
      'o-somale': { x: 0.47, row: 9 },
    }

    const assignPresetCoordinates = (node) => {
      const pos = POSITION[node.id]
      if (pos) {
        node._x = pos.x * CONFIG.virtualWidth
        node._y = CONFIG.startY + pos.row * CONFIG.verticalGap
        node._depth = pos.row
      } else {
        node._x = CONFIG.virtualWidth * 0.5
        node._y = CONFIG.startY
        node._depth = 0
      }

      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => assignPresetCoordinates(child))
      }
    }

    const drawNode = (node) => {
      nodes.push(node)

      const el = document.createElement('div')
      el.className = 'silsilah-node'
      el.dataset.id = node.id
      el.dataset.level = node.level || ''
      el.dataset.group = node.group || ''

      el.style.left = `${node._x - CONFIG.nodeWidth / 2}px`
      el.style.top = `${node._y}px`

      const nodeLabel = String(node.name || '').replaceAll('\n', '<br/>')
      el.innerHTML = `
        <div class="silsilah-node-name">${nodeLabel}</div>
      `

      nodesContainer.appendChild(el)

      if (node.children) {
        node.children.forEach((child) => {
          edges.push([node, child])
          drawNode(child)
        })
      }
    }

    const playEntranceAnimation = () => {
      const sortedNodes = [...nodes].sort((a, b) => (a._depth || 0) - (b._depth || 0))
      sortedNodes.forEach((node, index) => {
        const el = nodesContainer.querySelector(`.silsilah-node[data-id="${node.id}"]`)
        if (!el) return
        window.setTimeout(() => {
          el.style.animation = 'silsilahNodeEnter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
        }, index * 120)
      })
    }

    const replayAnimation = () => {
      nodesContainer.querySelectorAll('.silsilah-node').forEach((el) => {
        el.style.animation = 'none'
        el.style.opacity = '0'
        el.style.transform = 'translateY(20px)'
        void el.offsetWidth
      })
      playEntranceAnimation()
    }

    const getBounds = (node) => {
      let minX = node._x - CONFIG.nodeWidth / 2
      let maxX = node._x + CONFIG.nodeWidth / 2
      let minY = node._y
      let maxY = node._y + CONFIG.nodeHeight

      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => {
          const b = getBounds(child)
          minX = Math.min(minX, b.minX)
          maxX = Math.max(maxX, b.maxX)
          minY = Math.min(minY, b.minY)
          maxY = Math.max(maxY, b.maxY)
        })
      }

      return { minX, maxX, minY, maxY }
    }

    const renderFlow = () => {
      nodesContainer.innerHTML = ''
      svgLayer.innerHTML = ''
      nodes = []
      edges = []

      const containerWidth = container.clientWidth || window.innerWidth
      const containerHeight = container.clientHeight || 650
      assignPresetCoordinates(treeData)

      const bounds = getBounds(treeData)
      const treeWidth = bounds.maxX - bounds.minX
      const treeHeight = bounds.maxY - bounds.minY
      const padding = 24

      scale = Math.min(
        (containerWidth - padding * 2) / treeWidth,
        (containerHeight - padding * 2) / treeHeight,
        1,
      )

      pointX = (containerWidth - treeWidth * scale) / 2 - bounds.minX * scale
      pointY = (containerHeight - treeHeight * scale) / 2 - bounds.minY * scale
      updateTransform()

      drawNode(treeData)
      requestAnimationFrame(() => {
        svgLayer.innerHTML = ''
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
        marker.setAttribute('id', 'silsilah-arrow')
        marker.setAttribute('viewBox', '0 0 10 10')
        marker.setAttribute('refX', '9')
        marker.setAttribute('refY', '5')
        marker.setAttribute('markerWidth', '6')
        marker.setAttribute('markerHeight', '6')
        marker.setAttribute('orient', 'auto')
        const markerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        markerPath.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z')
        markerPath.setAttribute('fill', '#111111')
        marker.appendChild(markerPath)
        defs.appendChild(marker)
        svgLayer.appendChild(defs)

        const elementById = new Map(
          Array.from(nodesContainer.querySelectorAll('.silsilah-node')).map((el) => [el.dataset.id, el]),
        )

        const drawConnection = (parent, child) => {
          const parentEl = elementById.get(parent.id)
          const childEl = elementById.get(child.id)
          if (!parentEl || !childEl) return

          const x1 = parent._x
          const y1 = parent._y + parentEl.offsetHeight
          const x2 = child._x
          const y2 = child._y
          const elbowY = y1 + 18
          const arrowEndY = y2 - 2
          const d = `M ${x1} ${y1} V ${elbowY} H ${x2} V ${arrowEndY}`

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
          path.setAttribute('d', d)
          path.setAttribute('marker-end', 'url(#silsilah-arrow)')
          path.classList.add('silsilah-connection-path')
          svgLayer.appendChild(path)

          const flowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
          flowPath.setAttribute('d', d)
          flowPath.classList.add('silsilah-flow-anim')
          flowPath.style.animationDelay = `${Math.random() * 2}s`
          svgLayer.appendChild(flowPath)
        }

        edges.forEach(([parent, child]) => drawConnection(parent, child))
      })
      replayAnimation()
    }

    const resizeObserver = new ResizeObserver(() => {
      renderFlow()
    })
    resizeObserver.observe(container)

    renderFlow()

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="silsilah-flow-container h-[80vh] w-full overflow-hidden rounded-[20px] border border-black/10 bg-white"
      >
        <div ref={transformLayerRef} className="silsilah-transform-layer">
          <svg ref={svgLayerRef} className="silsilah-connections" />
          <div ref={nodesContainerRef} className="silsilah-nodes-container" />
        </div>
      </div>
    </div>
  )
}

function App() {
  const [loaderHidden, setLoaderHidden] = useState(false)
  const [loaderText, setLoaderText] = useState('')
  const [loaderDone, setLoaderDone] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [loginMounted, setLoginMounted] = useState(false)
  const [loginVisible, setLoginVisible] = useState(false)
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginSubmitting, setLoginSubmitting] = useState(false)
  const [formNama, setFormNama] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formTelepon, setFormTelepon] = useState('')
  const [formDomisili, setFormDomisili] = useState('')
  const [formPesan, setFormPesan] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [homeResetKey, setHomeResetKey] = useState(0)
  const [adminAuthed, setAdminAuthed] = useState(() => {
    try {
      return window.localStorage.getItem('adminAuthed') === '1'
    } catch {
      return false
    }
  })
  
  useEffect(() => {
    if (!adminAuthed) {
      setFormNama('')
      setFormEmail('')
      setFormDomisili('')
      setFormPesan('')
    }
  }, [adminAuthed])
  const [adminEmail, setAdminEmail] = useState(() => {
    try {
      return window.localStorage.getItem('adminEmail') || ''
    } catch {
      return ''
    }
  })
  const [loginError, setLoginError] = useState('')
  const loginFirstFieldRef = useRef(null)
  const loginFormRef = useRef(null)
  const inactivityTimeoutRef = useRef(null)
  const INACTIVITY_LIMIT = 5 * 60 * 1000
  const [justLoggedIn, setJustLoggedIn] = useState(false)

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
    }
    if (adminAuthed) {
      inactivityTimeoutRef.current = setTimeout(() => {
        setAdminAuthed(false)
        setAdminEmail('')
        try {
          window.localStorage.removeItem('adminAuthed')
          window.localStorage.removeItem('adminEmail')
          window.localStorage.removeItem('adminName')
          window.localStorage.removeItem('adminToken')
        } catch {
          // ignore
        }
      }, INACTIVITY_LIMIT)
    }
  }, [adminAuthed])

  const handleLogoutWithCleanup = async () => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
    }
    await handleLogout()
  }

  useEffect(() => {
    if (!adminAuthed) {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
      return
    }

    resetInactivityTimer()

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    const handleActivity = () => resetInactivityTimer()

    events.forEach(event => {
      window.addEventListener(event, handleActivity, true)
    })

    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
      events.forEach(event => {
        window.removeEventListener(event, handleActivity, true)
      })
    }
  }, [adminAuthed, resetInactivityTimer])

  const handleLogout = async () => {
    const envApiBaseUrl = typeof import.meta.env.VITE_API_BASE_URL === 'string' ? import.meta.env.VITE_API_BASE_URL.trim() : ''
    const defaultApiBaseUrl = envApiBaseUrl || 'https://backend-orj-michaelst152166-n1rpe68q.leapcell.dev'
    const apiBaseUrl = defaultApiBaseUrl

    setAdminAuthed(false)
    setAdminEmail('')
    try {
      window.localStorage.removeItem('adminAuthed')
      window.localStorage.removeItem('adminEmail')
      window.localStorage.removeItem('adminName')
      window.localStorage.removeItem('adminToken')
    } catch {
      // ignore
    }

    const token = window.localStorage.getItem('adminToken') || ''
    if (token) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        fetch(`${apiBaseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: { 'X-Session-Token': token },
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId))
      } catch {
        // ignore
      }
    }
    
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    setHomeResetKey(prev => prev + 1)
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }



  useEffect(() => {
    const fullText = 'Persatuan Tobing Ompu Raja Jae Jae'
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

    if (reduceMotion) {
      const rafId = window.requestAnimationFrame(() => {
        setLoaderText(fullText)
        setLoaderDone(true)
      })
      const timeoutId = window.setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
        setLoaderHidden(true)
      }, 400)
      return () => {
        window.cancelAnimationFrame(rafId)
        window.clearTimeout(timeoutId)
      }
    }

    let index = 0
    const intervalId = window.setInterval(() => {
      index += 1
      setLoaderText(fullText.slice(0, index))
      if (index >= fullText.length) {
        window.clearInterval(intervalId)
        setLoaderDone(true)
        window.setTimeout(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
          setLoaderHidden(true)
        }, 500)
      }
    }, 120)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px',
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('active')
      })
    }, observerOptions)

    const targets = document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
    targets.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
    }
  }, [])

  const closeNav = () => setNavOpen(false)

  const openLogin = () => {
    closeNav()
    setLoginMounted(true)
    setLoginError('')
    requestAnimationFrame(() => setLoginVisible(true))
  }

  const closeLogin = () => {
    setLoginVisible(false)
    window.setTimeout(() => setLoginMounted(false), 200)
  }

  useEffect(() => {
    if (!loginMounted) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeLogin()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [loginMounted])

  useEffect(() => {
    if (!loginVisible) return
    window.setTimeout(() => loginFirstFieldRef.current?.focus(), 0)
  }, [loginVisible])

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    const envApiBaseUrl = typeof import.meta.env.VITE_API_BASE_URL === 'string' ? import.meta.env.VITE_API_BASE_URL.trim() : ''
    const defaultApiBaseUrl = envApiBaseUrl || 'https://backend-orj-michaelst152166-n1rpe68q.leapcell.dev'
    const apiBaseUrl = defaultApiBaseUrl

    console.log('Submitting form:', {
      nama_lengkap: formNama, 
      email: formEmail, 
      telepon: formTelepon,
      domisili: formDomisili, 
      pesan: formPesan 
    })

    setFormSubmitting(true)
    setFormSuccess(false)

    try {
      const response = await fetch(`${apiBaseUrl}/api/data-baru`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nama_lengkap: formNama, 
          email: formEmail, 
          telepon: formTelepon,
          domisili: formDomisili, 
          pesan: formPesan 
        }),
      })

      const data = await response.json()
      if (!response.ok || !data?.ok) {
        alert(data?.message || 'Gagal mengirim data, silakan coba lagi.')
        setFormSubmitting(false)
        return
      }

      setFormSuccess(true)
      setFormNama('')
      setFormEmail('')
      setFormTelepon('')
      setFormDomisili('')
      setFormPesan('')
      
      setTimeout(() => {
        setFormSuccess(false)
        setFormSubmitting(false)
      }, 3000)
    } catch {
      alert('Terjadi kesalahan saat mengirim data, silakan coba lagi.')
      setFormSubmitting(false)
    }
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    if (loginSubmitting) return

    const email = String(loginIdentifier).trim()
    const password = String(loginPassword)

    if (!email || !password) {
      setLoginError('Email dan password wajib diisi.')
      return
    }

    const envApiBaseUrl = typeof import.meta.env.VITE_API_BASE_URL === 'string' ? import.meta.env.VITE_API_BASE_URL.trim() : ''
    const defaultApiBaseUrl = envApiBaseUrl || 'https://backend-orj-michaelst152166-n1rpe68q.leapcell.dev'
    const apiBaseUrl = defaultApiBaseUrl

    try {
      setLoginSubmitting(true)
      setLoginError('')
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
      const warmup = async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        try {
          await fetch(`${apiBaseUrl}/health`, { method: 'GET', cache: 'no-store', signal: controller.signal })
        } catch {
          // ignore
        } finally {
          clearTimeout(timeoutId)
        }
      }

      const postLogin = async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 12000)
        try {
          return await fetch(`${apiBaseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            signal: controller.signal,
          })
        } finally {
          clearTimeout(timeoutId)
        }
      }

      await warmup()

      let response = null
      let lastErr = null
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          response = await postLogin()
          break
        } catch (e) {
          lastErr = e
          if (attempt < 2) await sleep(800 * Math.pow(2, attempt))
        }
      }
      if (!response) {
        throw lastErr || new Error('Gagal menghubungi backend')
      }

      const raw = await response.text()
      let data = null
      if (raw) {
        try {
          data = JSON.parse(raw)
        } catch {
          data = null
        }
      }

      if (!response.ok || !data?.ok) {
        setLoginError(data?.message || 'Email atau password salah.')
        return
      }

      if (!data?.token || !data?.email || !data?.name) {
        setLoginError('Gagal masuk. Silakan coba lagi.')
        return
      }

      setAdminAuthed(true)
      setAdminEmail(data.email)
      setJustLoggedIn(true)
      try {
        window.localStorage.setItem('adminAuthed', '1')
        window.localStorage.setItem('adminEmail', data.email)
        window.localStorage.setItem('adminName', data.name)
        window.localStorage.setItem('adminToken', data.token)
      } catch {
        // ignore
      }
      setLoginIdentifier('')
      setLoginPassword('')
      setLoginError('')
      closeLogin()
      
      setTimeout(() => {
        setJustLoggedIn(false)
      }, 5000)
      
      return
    } catch (err) {
      const msg = typeof err?.message === 'string' ? err.message : ''
      setLoginError(
        'Terjadi kesalahan. Pastikan backend aktif di ' +
          apiBaseUrl +
          (msg ? ' (' + msg + ')' : '') +
          '. Jika ini serverless, tunggu 5-15 detik lalu coba lagi.'
      )
    } finally {
      setLoginSubmitting(false)
    }
  }

  if (adminAuthed) {
    return <Dashboard adminEmail={adminEmail} onLogout={handleLogoutWithCleanup} />
  }

  return (
    <div key={homeResetKey}>
      <div
        id="loader"
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#111111] transition-opacity duration-700"
        style={
          loaderHidden
            ? {
                opacity: 0,
                visibility: 'hidden',
              }
            : undefined
        }
      >
        <div>
          <h1
            className="font-serif text-3xl text-center text-white sm:text-5xl"
            aria-label="Persatuan Tobing Ompu Raja Jae Jae"
          >
            {loaderText}
            {!loaderDone ? <span className="ml-1 inline-block w-[10px] animate-pulse">|</span> : null}
          </h1>
        </div>
      </div>

      <header
        id="header"
        className={`fixed top-0 z-[1000] w-full transition-all duration-500 ${
          scrolled
            ? 'border-b border-white/10 bg-[rgba(17,17,17,0.9)] py-2.5 backdrop-blur-md'
            : ''
        }`}
      >
        <div className="mx-auto max-w-[1200px] px-5">
          <nav
            className={`flex items-center justify-between transition-all duration-500 ${
              scrolled ? 'h-[60px]' : 'h-20'
            }`}
          >
            <div className="flex items-center gap-2.5 font-serif text-[1.1rem] font-bold text-white sm:text-[1.8rem]">
              <span className="text-[#c0392b]">♦</span> TOBING O.R. JAE JAE
            </div>
            <button
              type="button"
              className="z-[1001] bg-transparent text-[1.8rem] text-white md:hidden"
              aria-label="Menu"
              onClick={() => setNavOpen((open) => !open)}
            >
              {navOpen ? '×' : '☰'}
            </button>
            <ul
              className={`fixed top-0 right-0 z-[999] flex h-screen w-4/5 flex-col items-center justify-start gap-8 overflow-y-auto border-l border-white/10 bg-[rgba(17,17,17,0.98)] pt-16 pb-20 transition-transform duration-500 md:static md:z-auto md:h-auto md:w-auto md:translate-x-0 md:flex-row md:justify-end md:gap-10 md:overflow-visible md:border-0 md:bg-transparent md:py-0 md:transition-none ${
                navOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <li className="md:hidden">
                <div className="flex w-full items-center justify-center gap-2.5 font-serif text-2xl font-bold text-white">
                  <span className="text-[#c0392b]">♦</span> Tobing O.R. Jae Jae
                </div>
              </li>
              <li>
                <a
                  href="#beranda"
                  onClick={closeNav}
                  className="relative py-1 text-sm font-medium text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#c0392b] after:transition-[width] after:duration-300 after:content-[''] hover:after:w-full"
                >
                  Beranda
                </a>
              </li>
              <li>
                <a
                  href="#filosofi"
                  onClick={closeNav}
                  className="relative py-1 text-sm font-medium text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#c0392b] after:transition-[width] after:duration-300 after:content-[''] hover:after:w-full"
                >
                  Filosofi
                </a>
              </li>
              <li>
                <a
                  href="#silsilah"
                  onClick={closeNav}
                  className="relative py-1 text-sm font-medium text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#c0392b] after:transition-[width] after:duration-300 after:content-[''] hover:after:w-full"
                >
                  Silsilah
                </a>
              </li>
              <li>
                <a
                  href="#budaya"
                  onClick={closeNav}
                  className="relative py-1 text-sm font-medium text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#c0392b] after:transition-[width] after:duration-300 after:content-[''] hover:after:w-full"
                >
                  Warisan
                </a>
              </li>
              <li>
                <a
                  href="#keluarga"
                  onClick={closeNav}
                  className="relative py-1 text-sm font-medium text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#c0392b] after:transition-[width] after:duration-300 after:content-[''] hover:after:w-full"
                >
                  Keluarga
                </a>
              </li>
              <li>
                <a
                  href="#gabung"
                  onClick={closeNav}
                  className="relative py-1 text-sm font-medium text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#c0392b] after:transition-[width] after:duration-300 after:content-[''] hover:after:w-full"
                >
                  Gabung
                </a>
              </li>
              <li className="mt-2 md:mt-0">
                <button
                  type="button"
                  onClick={openLogin}
                  className="inline-block rounded-full border border-[#f1c40f] bg-[#f1c40f] px-8 py-3 text-sm font-semibold uppercase tracking-[1px] text-[#111111] transition hover:bg-transparent hover:text-[#f1c40f]"
                >
                  Masuk
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {loginMounted ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-title"
          className={`fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm transition-opacity duration-200 ${
            loginVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeLogin()
          }}
        >
          <div
            className={`w-full max-w-md transform rounded-2xl border border-white/10 bg-[rgba(17,17,17,0.95)] shadow-[0_25px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-all duration-200 ease-out ${
              loginVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 pt-6 pb-5">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[1px] text-[#f1c40f]">
                  <span className="text-[#c0392b]">♦</span> Admin
                </div>
                <h2 id="login-title" className="font-serif text-2xl text-white">
                  Masuk
                </h2>
                <p className="mt-1 text-sm text-white/70">Silakan masukkan akun Anda untuk melanjutkan.</p>
              </div>
              <button
                type="button"
                aria-label="Tutup"
                onClick={closeLogin}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white/90 transition hover:bg-white/10"
              >
                ×
              </button>
            </div>

            <form ref={loginFormRef} className="px-6 pt-6 pb-6" onSubmit={handleLoginSubmit}>
              <div className="space-y-4">
                {loginError ? (
                  <div className="rounded-xl border border-[#c0392b]/30 bg-[#c0392b]/10 px-4 py-3 text-sm text-white">
                    {loginError}
                  </div>
                ) : null}
                <div>
                  <label htmlFor="login-identifier" className="mb-2 block text-sm font-semibold text-white/90">
                    Email / Username
                  </label>
                  <input
                    ref={loginFirstFieldRef}
                    id="login-identifier"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    autoComplete="username"
                    placeholder="contoh: tobingsolid / email@domain.com"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/40 transition focus:border-[#f1c40f] focus:bg-white/10 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="login-password" className="block text-sm font-semibold text-white/90">
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs font-semibold text-[#f1c40f] transition hover:text-white"
                      onClick={() => alert('Silakan hubungi admin untuk reset password.')}
                    >
                      Lupa password?
                    </button>
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/40 transition focus:border-[#f1c40f] focus:bg-white/10 focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginSubmitting}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c0392b] to-[#f1c40f] px-5 py-3.5 text-sm font-bold uppercase tracking-[1px] text-[#111111] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loginSubmitting ? (
                    <>
                      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-black/25 border-t-black/70" />
                      Memproses...
                    </>
                  ) : (
                    'Masuk'
                  )}
                </button>

                <div className="text-center text-xs text-white/60">
                  Dengan masuk, Anda menyetujui kebijakan dan aturan yang berlaku.
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <section id="beranda" className="bg-hero relative flex h-screen items-center justify-center text-center text-white">
        <div className="z-10 mx-auto max-w-[800px] px-5">
          <h1 className="mt-20 mb-6 text-[4.5rem] leading-[1.1] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] max-md:text-[2.8rem]">
            Persatuan Tobing O.R. Jae Jae
          </h1>
          <p className="mb-10 text-[1.3rem] font-light text-[#ddd] max-md:text-base">
            Menggabungkan kearifan lokal Batak dengan semangat modern. Bersama membangun persaudaraan yang
            abadi.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#filosofi"
              className="inline-block rounded-full border border-[#c0392b] bg-[#c0392b] px-9 py-3.5 text-sm font-semibold uppercase tracking-[1px] text-white transition hover:bg-white hover:text-[#c0392b]"
            >
              Jelajahi Budaya
            </a>
            <a
              href="#keluarga"
              className="inline-block rounded-full border border-[#f1c40f] bg-transparent px-9 py-3.5 text-sm font-semibold uppercase tracking-[1px] text-[#f1c40f] transition hover:bg-[#f1c40f] hover:text-[#111111] hover:shadow-[0_0_20px_rgba(241,196,15,0.4)]"
            >
              Lihat Keluarga
            </a>
          </div>
        </div>
      </section>

      <section id="filosofi" className="bg-[#111111] py-[100px]">
        <div className="mx-auto max-w-[1200px] px-5">
          <div className="grid grid-cols-1 items-center gap-20 md:grid-cols-2">
            <div className="reveal-left relative after:absolute after:-left-5 after:-top-5 after:right-5 after:bottom-5 after:border-2 after:border-[#c0392b] after:content-['']">
              <img
                src={foto2}
                alt="Pemandangan Danau Toba"
                className="relative z-10 rounded-[5px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] grayscale transition hover:grayscale-0 hover:scale-[1.02]"
              />
            </div>
            <div className="reveal-right max-md:text-center">
              <h2 className="mb-6 text-[2.5rem]">Satuan Hati dalam Persaudaraan</h2>
              <p className="mb-6 font-light text-[#bbb]">
                Marga Tobing O.R. Jae Jae adalah simbol kekuatan dalam kebersamaan. Di era modern ini, kami
                berkomitmen untuk mentransformasikan nilai-nilai luhur leluhur menjadi tindakan nyata yang
                relevan.
              </p>
              <div className="my-6 border-l-[3px] border-[#f1c40f] pl-5 font-serif text-xl italic text-[#f1c40f]">
                &quot;Tak ada perbedaan, hanya ada sebuah persatuan dan persaudaraan yang menguatkan&quot;
              </div>
              <p className="mb-6 font-light text-[#bbb]">
                Kami tidak hanya menyambung tali silsilah, tetapi membangun jaringan kolaborasi antar
                anggota keluarga yang tersebar di nusantara.
              </p>
              <a
                href="#"
                className="inline-block rounded-full border border-[#c0392b] bg-[#c0392b] px-9 py-3.5 text-sm font-semibold uppercase tracking-[1px] text-white transition hover:bg-white hover:text-[#c0392b]"
              >
                Pelajari Sejarah
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="silsilah" className="bg-[#fdfbf7] py-[100px] text-[#111111]">
        <div className="mx-auto max-w-[1200px] px-5">
          <div className="reveal text-center">
            <h2 className="mb-4 inline-block bg-gradient-to-r from-[#f1c40f] to-[#111111] bg-clip-text text-5xl font-serif font-bold text-transparent">
              Silsilah Tobing
            </h2>
          </div>

          <div className="reveal mt-8">
            <SilsilahFlow />
          </div>
        </div>
      </section>

      <section id="budaya" className="bg-[#111111] py-[100px]">
        <div className="mx-auto max-w-[1200px] px-5">
          <div className="reveal text-center">
            <h2 className="mb-4 inline-block bg-gradient-to-r from-[#f1c40f] to-white bg-clip-text text-5xl font-serif font-bold text-transparent">
              Warisan Leluhur
            </h2>
            <p className="mx-auto mb-16 max-w-[700px] text-base text-[#aaa]">
              Tokoh Raja Tobing dan keberagaman lainnya
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="reveal overflow-hidden rounded-[15px] border border-white/10 bg-white/5 transition hover:-translate-y-2.5 hover:border-[#c0392b] hover:bg-white/10">
              <div className="h-[220px] overflow-hidden">
                <img
                  src={raja}
                  alt="Raja Tobing"
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                />
              </div>
              <div className="p-8">
                <h3 className="mb-4 text-[1.4rem] font-semibold text-[#f1c40f]">Raja Tobing</h3>
                <p className="text-[0.95rem] text-[#ccc]">
                  Salah satu tokoh raja Tobing yang terkenal adalah Raja Pontas Lumban Tobing, tapi masih ada
                  beberapa lainnya.
                </p>
              </div>
            </div>

            <div
              className="reveal overflow-hidden rounded-[15px] border border-white/10 bg-white/5 transition hover:-translate-y-2.5 hover:border-[#c0392b] hover:bg-white/10"
              style={{ transitionDelay: '0.1s' }}
            >
              <div className="h-[220px] overflow-hidden">
                <img
                  src={padan}
                  alt="Si Opat Pisoran"
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                />
              </div>
              <div className="p-8">
                <h3 className="mb-4 text-[1.4rem] font-semibold text-[#f1c40f]">Si Opat Pisoran</h3>
                <p className="text-[0.95rem] text-[#ccc]">
                  Lumban Tobing termasuk dalam golongan kesatuan marga dengan Hutabarat, Hutagalung, dan
                  Panggabean.
                </p>
              </div>
            </div>

            <div
              className="reveal overflow-hidden rounded-[15px] border border-white/10 bg-white/5 transition hover:-translate-y-2.5 hover:border-[#c0392b] hover:bg-white/10"
              style={{ transitionDelay: '0.2s' }}
            >
              <div className="h-[220px] overflow-hidden">
                <img
                  src={kampung}
                  alt="Daerah Asal"
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                />
              </div>
              <div className="p-8">
                <h3 className="mb-4 text-[1.4rem] font-semibold text-[#f1c40f]">Daerah Asal</h3>
                <p className="text-[0.95rem] text-[#ccc]">
                  Marga Tobing (atau lengkapnya Lumbantobing) berasal dari daerah Pearaja, Tarutung, Tapanuli
                  Utara, Sumatera Utara
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="keluarga" className="bg-[#fdfbf7] py-[100px] text-[#111111]">
        <div className="mx-auto max-w-[1200px] px-5">
          <div className="reveal text-center">
            <h2 className="mb-4 inline-block bg-gradient-to-r from-[#f1c40f] to-[#111111] bg-clip-text text-5xl font-serif font-bold text-transparent">
              Pengurus
            </h2>
            <p className="mx-auto mb-16 max-w-[600px] text-[1.1rem] text-[#666]">
              Kumpulan Anggota Keluarga Besar Marga Tobing O.R. Jae Jae
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="reveal overflow-hidden rounded-[15px] bg-white pb-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition hover:-translate-y-3.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]">
              <div className="h-[350px] overflow-hidden bg-[#eee]">
                <img
                  src={anonim}
                  alt="Foto Anggota"
                  className="h-full w-full object-cover object-top transition-transform duration-500 hover:scale-110"
                />
              </div>
              <div className="px-5 pt-6">
                <span className="mb-2 block text-sm font-bold uppercase tracking-[1px] text-[#c0392b]">
                  Ketua Adat
                </span>
                <h3 className="mb-1 font-serif text-[1.4rem] font-bold text-[#111111]">R. Lumban Tobing</h3>
                <div className="text-sm text-[#777]">Medan, Sumatera Utara</div>
              </div>
            </div>

            <div
              className="reveal overflow-hidden rounded-[15px] bg-white pb-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition hover:-translate-y-3.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
              style={{ transitionDelay: '0.1s' }}
            >
              <div className="h-[350px] overflow-hidden bg-[#eee]">
                <img
                  src={anonim}
                  alt="Foto Anggota"
                  className="h-full w-full object-cover object-top transition-transform duration-500 hover:scale-110"
                />
              </div>
              <div className="px-5 pt-6">
                <span className="mb-2 block text-sm font-bold uppercase tracking-[1px] text-[#c0392b]">
                  Ketua Panitia
                </span>
                <h3 className="mb-1 font-serif text-[1.4rem] font-bold text-[#111111]">J. Lumban Tobing</h3>
                <div className="text-sm text-[#777]">Jakarta, DKI Jakarta</div>
              </div>
            </div>

            <div
              className="reveal overflow-hidden rounded-[15px] bg-white pb-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition hover:-translate-y-3.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
              style={{ transitionDelay: '0.2s' }}
            >
              <div className="h-[350px] overflow-hidden bg-[#eee]">
                <img
                  src={anonim}
                  alt="Foto Anggota"
                  className="h-full w-full object-cover object-top transition-transform duration-500 hover:scale-110"
                />
              </div>
              <div className="px-5 pt-6">
                <span className="mb-2 block text-sm font-bold uppercase tracking-[1px] text-[#c0392b]">
                  Sekretaris
                </span>
                <h3 className="mb-1 font-serif text-[1.4rem] font-bold text-[#111111]">
                  S. Lumban Tobing, S.E.
                </h3>
                <div className="text-sm text-[#777]">Bandung, Jawa Barat</div>
              </div>
            </div>

            <div
              className="reveal overflow-hidden rounded-[15px] bg-white pb-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition hover:-translate-y-3.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
              style={{ transitionDelay: '0.3s' }}
            >
              <div className="h-[350px] overflow-hidden bg-[#eee]">
                <img
                  src={anonim}
                  alt="Foto Anggota"
                  className="h-full w-full object-cover object-top transition-transform duration-500 hover:scale-110"
                />
              </div>
              <div className="px-5 pt-6">
                <span className="mb-2 block text-sm font-bold uppercase tracking-[1px] text-[#c0392b]">
                  Kadis Seni Budaya
                </span>
                <h3 className="mb-1 font-serif text-[1.4rem] font-bold text-[#111111]">St. Lumban Tobing</h3>
                <div className="text-sm text-[#777]">Pematang Siantar</div>
              </div>
            </div>
          </div>

          <div className="reveal mt-12 text-center">
            <a
              href="#"
              className="inline-block rounded-full border border-[#c0392b] bg-[#c0392b] px-9 py-3.5 text-sm font-semibold uppercase tracking-[1px] text-white transition hover:bg-white hover:text-[#c0392b]"
            >
              Lihat Seluruh Anggota
            </a>
          </div>
        </div>
      </section>

      <section id="gabung" className="bg-join py-[100px] text-white">
        <div className="mx-auto max-w-[1200px] px-5">
          <div className="reveal text-center">
            <h2 className="mb-4 inline-block bg-gradient-to-r from-[#f1c40f] to-white bg-clip-text text-5xl font-serif font-bold text-transparent">
              Bergabung Bersama Kami
            </h2>
            <p className="mx-auto mb-16 max-w-[600px] text-[1.1rem] text-[#ccc]">
              Silakan isi data diri Anda untuk terdaftar dalam database Marga Tobing O.R. Jae Jae.
            </p>
          </div>

          <div className="reveal mx-auto max-w-[600px] rounded-[20px] border border-white/10 bg-white/5 p-12 shadow-[0_25px_50px_rgba(0,0,0,0.5)] backdrop-blur-[15px] max-md:p-8">
            <form action="#" method="POST" onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="nama" className="mb-2 block text-sm font-semibold text-[#f1c40f]">
                  Nama Lengkap (Beserta Marga)
                </label>
                <input
                  type="text"
                  id="nama"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Jhon Lumban Tobing"
                  required
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/60 transition focus:border-[#c0392b] focus:bg-white/10 focus:outline-none"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#f1c40f]">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/60 transition focus:border-[#c0392b] focus:bg-white/10 focus:outline-none"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="telepon" className="mb-2 block text-sm font-semibold text-[#f1c40f]">
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  id="telepon"
                  value={formTelepon}
                  onChange={(e) => setFormTelepon(e.target.value)}
                  placeholder="081234567890"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/60 transition focus:border-[#c0392b] focus:bg-white/10 focus:outline-none"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="asal" className="mb-2 block text-sm font-semibold text-[#f1c40f]">
                  Domisili (Kota)
                </label>
                <input
                  type="text"
                  id="asal"
                  value={formDomisili}
                  onChange={(e) => setFormDomisili(e.target.value)}
                  placeholder="Kota Anda saat ini"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/60 transition focus:border-[#c0392b] focus:bg-white/10 focus:outline-none"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="pesan" className="mb-2 block text-sm font-semibold text-[#f1c40f]">
                  Pesan / Kontribusi
                </label>
                <textarea
                  id="pesan"
                  rows={4}
                  value={formPesan}
                  onChange={(e) => setFormPesan(e.target.value)}
                  placeholder="Ceritakan minat Anda bergabung..."
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3.5 text-white placeholder:text-white/60 transition focus:border-[#c0392b] focus:bg-white/10 focus:outline-none"
                />
              </div>
              <div className="text-center">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#c0392b] bg-[#c0392b] px-9 py-3.5 text-sm font-semibold uppercase tracking-[1px] text-white transition hover:bg-white hover:text-[#c0392b] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {formSubmitting ? (
                    <>
                      <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Mengirim...
                    </>
                  ) : (
                    'Kirim Data'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {formSuccess ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-5 py-10 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-center animate-[zoomIn_0.4s_ease-out]">
            <style>{`
              @keyframes zoomIn {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
            `}</style>
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
              <svg viewBox="0 0 24 24" className="h-12 w-12 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <div className="text-3xl font-serif font-bold text-white">Berhasil!</div>
            <div className="text-white/80">Terima kasih! Data Anda akan kami verifikasi.</div>
          </div>
        </div>
      ) : null}

      <footer id="kontak" className="border-t border-white/5 bg-[#050505] pb-8 pt-20 text-[#888]">
        <div className="mx-auto max-w-[1200px] px-5">
          <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-3">
            <div>
              <h3 className="relative mb-6 text-[1.4rem] font-serif font-bold text-white after:mt-2 after:block after:h-[3px] after:w-10 after:bg-[#c0392b] after:content-['']">
                Tobing O.R. Jae Jae
              </h3>
              <p>
                Wadah modern untuk persaudaraan yang tak lekang oleh waktu. Menjaga identitas Batak di tengah
                arus globalisasi.
              </p>
            </div>
            <div>
              <h3 className="relative mb-6 text-[1.4rem] font-serif font-bold text-white after:mt-2 after:block after:h-[3px] after:w-10 after:bg-[#c0392b] after:content-['']">
                Navigasi
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#beranda" className="text-[0.95rem] transition hover:pl-1 hover:text-[#f1c40f]">
                    Beranda
                  </a>
                </li>
                <li>
                  <a href="#filosofi" className="text-[0.95rem] transition hover:pl-1 hover:text-[#f1c40f]">
                    Sejarah Marga
                  </a>
                </li>
                <li>
                  <a href="#silsilah" className="text-[0.95rem] transition hover:pl-1 hover:text-[#f1c40f]">
                    Silsilah Tobing
                  </a>
                </li>
                <li>
                  <a href="#keluarga" className="text-[0.95rem] transition hover:pl-1 hover:text-[#f1c40f]">
                    Data Keluarga
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="relative mb-6 text-[1.4rem] font-serif font-bold text-white after:mt-2 after:block after:h-[3px] after:w-10 after:bg-[#c0392b] after:content-['']">
                Hubungi Kami
              </h3>
              <ul className="space-y-3 text-[0.95rem]">
                <li>Jl. Batak No. 123, Medan</li>
                <li>Email: info@lumbantobing.orj.id</li>
                <li>WhatsApp: +62 812 3456 7890</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 text-center text-sm">
            <p>&copy; 2023 Persatuan Marga Tobing O.R. Jae Jae. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
