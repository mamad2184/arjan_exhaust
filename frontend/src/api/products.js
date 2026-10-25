const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const detailCache = new Map()
const carListsCache = new Map()
const productsRequests = new Map()
const searchCache = new Map()

const catalogCacheKey = 'arjan-exhaust-products-v1'
const searchCacheLimit = 30

async function getJson(path) {
  let response

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      headers: { Accept: 'application/json' },
    })
  } catch {
    throw new Error('از اتصال و فعال بودن سرویس محصولات اطمینان حاصل کنید.')
  }

  if (!response.ok) {
    throw new Error(
      `دریافت اطلاعات با خطای ${new Intl.NumberFormat('fa-IR').format(response.status)} روبه‌رو شد.`,
    )
  }

  return response.json()
}

function normalizeSearchKey(value = '') {
  return value.trim().replace(/\s+/g, ' ')
}

function rememberSearchResults(key, products) {
  searchCache.delete(key)
  searchCache.set(key, products)

  while (searchCache.size > searchCacheLimit) {
    const oldestKey = searchCache.keys().next().value
    searchCache.delete(oldestKey)
  }
}

export function getCachedProducts() {
  try {
    const cached = localStorage.getItem(catalogCacheKey)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

export function getCachedSearchProducts({
  search = '',
  brand = '',
  car = '',
} = {}) {
  const term = normalizeSearchKey(search)

  if (!term || brand || car) return null

  const exactMatch = searchCache.get(term)
  if (exactMatch) return exactMatch

  const cachedEntry = [...searchCache.entries()]
    .filter(([cachedTerm]) => term.startsWith(`${cachedTerm} `))
    .sort(([a], [b]) => b.length - a.length)[0]

  if (cachedEntry) return cachedEntry[1]

  return getCachedProducts()
}

export function fetchProducts({
  search = '',
  brand = '',
  car = '',
} = {}) {
  const normalizedSearch = normalizeSearchKey(search)
  const params = new URLSearchParams()

  if (normalizedSearch) params.set('search', normalizedSearch)
  if (brand) params.set('brand', brand)
  if (car) params.set('car', car)

  const query = params.toString()
  const path = `/products/${query ? `?${query}` : ''}`

  if (!productsRequests.has(path)) {
    const request = getJson(path)
      .then((data) => {
        const products = Array.isArray(data) ? data : []

        if (!query) {
          try {
            localStorage.setItem(
              catalogCacheKey,
              JSON.stringify(products),
            )
          } catch {
            // Storage may be unavailable or full.
          }
        }

        if (normalizedSearch && !brand && !car) {
          rememberSearchResults(normalizedSearch, products)
        }

        return products
      })
      .finally(() => {
        productsRequests.delete(path)
      })

    productsRequests.set(path, request)
  }

  return productsRequests.get(path)
}

export function fetchProduct(id) {
  if (!detailCache.has(id)) {
    const request = getJson(`/products/${id}/`).catch((error) => {
      detailCache.delete(id)
      throw error
    })

    detailCache.set(id, request)
  }

  return detailCache.get(id)
}

export function fetchCars(brand) {
  if (!carListsCache.has(brand)) {
    const request = getJson(
      `/cars/?brand=${encodeURIComponent(brand)}`,
    ).catch((error) => {
      carListsCache.delete(brand)
      throw error
    })

    carListsCache.set(brand, request)
  }

  return carListsCache.get(brand)
}