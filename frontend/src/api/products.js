const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (
  import.meta.env.DEV
    ? 'http://127.0.0.1:8000'
    : 'https://arjan-exhaust-api.onrender.com'
)

const detailCache = new Map()
const carListsCache = new Map()
const productsRequests = new Map()
const productsPageCache = new Map()
const productsPageCacheLimit = 30
const productsPageCacheTtl = 30_000
const searchCache = new Map()

const catalogCacheKey = 'arjan-exhaust-products-v1'
const searchCacheLimit = 30

async function getJson(path) {
  let response

  try {
    response = await fetch(
      `${import.meta.env.DEV ? '' : apiBaseUrl}${path}`,
      {
        headers: { Accept: 'application/json' },
      },
    )
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

function buildProductsPath({ search = '', brand = '', car = '', page = 1 } = {}) {
  const params = new URLSearchParams()
  const normalizedSearch = normalizeSearchKey(search)

  if (normalizedSearch) params.set('search', normalizedSearch)
  if (brand) params.set('brand', brand)
  if (car) params.set('car', car)
  params.set('page', String(page))

  return `/products/?${params.toString()}`
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

export function fetchProductsPage({
  search = '',
  brand = '',
  car = '',
  page = 1,
} = {}) {
  const path = buildProductsPath({ search, brand, car, page })
  const cached = productsPageCache.get(path)

  if (cached && cached.expiresAt > Date.now()) {
    productsPageCache.delete(path)
    productsPageCache.set(path, cached)
    return Promise.resolve(cached.data)
  }

  if (cached) productsPageCache.delete(path)

  if (!productsRequests.has(path)) {
    const request = getJson(path)
      .then((data) => {
        // Support the paginated response and legacy array responses.
        const result = Array.isArray(data)
          ? {
              count: data.length,
              next: null,
              previous: null,
              results: data,
            }
          : {
              count: data.count ?? 0,
              next: data.next ?? null,
              previous: data.previous ?? null,
              results: Array.isArray(data.results) ? data.results : [],
            }

        productsPageCache.set(path, {
          data: result,
          expiresAt: Date.now() + productsPageCacheTtl,
        })

        while (productsPageCache.size > productsPageCacheLimit) {
          const oldestKey = productsPageCache.keys().next().value
          productsPageCache.delete(oldestKey)
        }

        return result
      })
      .finally(() => {
        productsRequests.delete(path)
      })

    productsRequests.set(path, request)
  }

  return productsRequests.get(path)
}

export async function fetchProducts(filters = {}) {
  const result = await fetchProductsPage({ ...filters, page: 1 })
  const products = result.results

  if (!filters.search && !filters.brand && !filters.car) {
    try {
      localStorage.setItem(catalogCacheKey, JSON.stringify(products))
    } catch {
      // Storage may be unavailable or full.
    }
  }

  const normalizedSearch = normalizeSearchKey(filters.search || '')

  if (normalizedSearch && !filters.brand && !filters.car) {
    rememberSearchResults(normalizedSearch, products)
  }

  return products
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