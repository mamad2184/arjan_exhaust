const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const detailCache = new Map()
let productsRequest = null

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
    throw new Error(`دریافت اطلاعات با خطای ${new Intl.NumberFormat('fa-IR').format(response.status)} روبه‌رو شد.`)
  }

  return response.json()
}

const catalogCacheKey = 'arjan-exhaust-products-v1'

export function getCachedProducts() {
  try {
    const cached = localStorage.getItem(catalogCacheKey)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

export function fetchProducts() {
  if (!productsRequest) {
    productsRequest = getJson('/products/')
      .then((data) => {
        try {
          localStorage.setItem(catalogCacheKey, JSON.stringify(data))
        } catch {
          // Storage may be unavailable or full; the API response still works.
        }
        return data
      })
      .finally(() => {
        productsRequest = null
      })
  }

  return productsRequest
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