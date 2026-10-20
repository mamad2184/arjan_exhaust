import { useEffect, useRef, useState } from 'react'
import { fetchProduct, fetchProducts, getCachedProducts } from './api/products'
import './App.css'

function formatPrice(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return value

  return new Intl.NumberFormat('fa-IR', {
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatId(value, width = 0) {
  const id = String(value).padStart(width, '0')
  return new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(Number(id))
}

function ProductCard({ product, onSelect }) {
  const imageUrl = product.image_url || ''

  return (
    <button
      className="product-card"
      onClick={() => onSelect(product)}
      type="button"
    >
      <span className="product-image-wrap">
        {imageUrl ? (
          <img className="product-image" src={imageUrl} alt={product.name} loading="lazy" decoding="async" fetchPriority="low" />
        ) : (
          <span className="product-image-fallback" aria-hidden="true">
            <span className="fallback-mark">کد / {formatId(product.id, 2)}</span>
            <span className="fallback-name">ارجان<br />اگزوز</span>
          </span>
        )}
        <span className="image-index">{formatId(product.id, 3)}</span>
      </span>
      <span className="product-info">
        <span className="product-name">{product.name}</span>
        <span className="product-card-bottom">
          <span className="product-price">
            <span className="eyebrow">قیمت</span>
            <strong>{formatPrice(product.price)}</strong>
          </span>
          <span className="product-link">مشاهده جزئیات <span aria-hidden="true">&#8598;</span></span>
        </span>
      </span>
    </button>
  )
}

function ProductDialog({ product, onClose }) {
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const closeButtonRef = useRef(null)

  useEffect(() => {
    let active = true
    document.body.classList.add('dialog-open')
    closeButtonRef.current?.focus()

    fetchProduct(product.id)
      .then((data) => {
        if (active) setDetail(data)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      active = false
      document.body.classList.remove('dialog-open')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [product.id, onClose])

  const images = detail?.images?.filter((image) => image.image_url) ?? []
  const carIds = detail?.cars ?? []

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section
        aria-labelledby="dialog-title"
        aria-modal="true"
        className="product-dialog"
        role="dialog"
      >
        <div className="dialog-topline">
          <span className="eyebrow">جزئیات محصول / {formatId(product.id, 3)}</span>
          <button aria-label="بستن" className="close-button" onClick={onClose} ref={closeButtonRef} type="button">
            بستن <span aria-hidden="true">&#215;</span>
          </button>
        </div>

        <div className="dialog-content">
          <div className="dialog-gallery">
            {images.length > 0 ? (
              images.map((image) => (
                <img key={image.id} src={image.image_url} alt={product.name} loading="lazy" decoding="async" />
              ))
            ) : (
              <div className="dialog-image-fallback" aria-hidden="true">
                <span>ارجان<br />اگزوز</span>
              </div>
            )}
          </div>
          <div className="dialog-copy">
            <p className="eyebrow">ارجان اگزوز / کاتالوگ</p>
            <h2 id="dialog-title">{product.name}</h2>
            <p className="dialog-price">{formatPrice(product.price)}</p>
            {loading && <p className="dialog-message">در حال دریافت اطلاعات محصول...</p>}
            {error && <p className="dialog-message error-message">{error}</p>}
            {detail && (
              <>
                <div className="detail-section">
                  <h3>توضیحات</h3>
                  <p className="description">{detail.description || 'توضیحی برای این محصول ثبت نشده است.'}</p>
                </div>
                <div className="detail-section fitment-section">
                  <h3>خودروهای سازگار</h3>
                  {carIds.length > 0 ? (
                    <ul className="fitment-list">
                      {carIds.map((carId) => <li key={carId}>شناسه خودرو {formatId(carId)}</li>)}
                    </ul>
                  ) : (
                    <p className="description">اطلاعاتی درباره خودروهای سازگار ثبت نشده است.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState('all')

  const brandFilters = [
    { id: 'all', label: 'همه' },
    { id: 'saipa', label: 'سایپا' },
    { id: 'iran_khodro', label: 'ایرانخودرو' },
    { id: 'other', label: 'ماشین‌های دیگر' },
  ]

  const filteredProducts = selectedBrand === 'all'
    ? products
    : products.filter((product) => product.cars?.some((car) => car.brand === selectedBrand))

  useEffect(() => {
    let active = true
    const cachedProducts = getCachedProducts()

    if (Array.isArray(cachedProducts)) {
      setProducts(cachedProducts)
      setLoading(false)
    }

    fetchProducts()
      .then((data) => {
        if (!active) return
        setProducts(Array.isArray(data) ? data : [])
        setError('')
      })
      .catch((requestError) => {
        if (active && !Array.isArray(cachedProducts)) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const retryCatalog = () => {
    setLoading(true)
    setError('')
    setReloadKey((key) => key + 1)
  }

  return (
    <div className="store-layout">
      {sidebarOpen && (
        <button
          aria-label="بستن منو"
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          type="button"
        />
      )}
      <aside aria-label="منوی فروشگاه" className={`store-sidebar${sidebarOpen ? ' is-open' : ''}`} id="store-sidebar" inert={!sidebarOpen}>
        <a aria-label="صفحه اصلی ارجان اگزوز" className="brand" href="#top" onClick={() => setSidebarOpen(false)}>
          <span className="brand-mark">ا</span>
          <span className="brand-name">ارجان<span>اگزوز</span></span>
        </a>
        <p className="sidebar-caption">قطعات تخصصی سیستم اگزوز</p>
        <div className="sidebar-rule" />
        <p className="sidebar-label">فروشگاه</p>
        <nav aria-label="دسته‌بندی محصولات بر اساس خودرو" className="sidebar-nav">
          {brandFilters.map((filter, index) => (
            <button
              aria-current={selectedBrand === filter.id ? 'page' : undefined}
              className="sidebar-link"
              key={filter.id}
              onClick={() => {
                setSelectedBrand(filter.id)
                setSidebarOpen(false)
              }}
              type="button"
            >
              <span className="sidebar-link-index">{formatId(index + 1, 2)}</span>
              <span>{filter.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="sidebar-accent" />
          <span>ارجان اگزوز</span>
          <small>قطعات برای مسیر پیش رو</small>
        </div>
      </aside>

      <div className="store-main">
        <header className="content-header">
          <button
            aria-controls="store-sidebar"
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? 'بستن منو' : 'باز کردن منو'}
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((open) => !open)}
            type="button"
          >
            <span className="menu-glyph" aria-hidden="true"><i /><i /><i /></span>
          </button>
          <div className="breadcrumbs"><span>فروشگاه</span><span aria-hidden="true">/</span><strong>کاتالوگ</strong></div>
          <span className="header-caption">ارجان اگزوز / قطعات تخصصی</span>
        </header>

        <main className="catalog-page" id="top">
          <section aria-labelledby="page-title" className="catalog-intro-block">
            <div>
              <p className="eyebrow">فروشگاه ارجان / سیستم اگزوز</p>
              <h1 id="page-title">قطعات سیستم اگزوز</h1>
              <p className="intro-description">محصولات موجود را ببینید و برای مشخصات و خودروهای سازگار، جزئیات هر محصول را باز کنید.</p>
            </div>
            <div className="catalog-status">
              <span className="status-dot" />
              <span>کاتالوگ محصولات</span>
            </div>
          </section>

          <section aria-labelledby="catalog-title" className="catalog-content" id="catalog">
            <div className="catalog-toolbar">
              <h2 id="catalog-title">{brandFilters.find((filter) => filter.id === selectedBrand)?.label || 'همه'} محصولات</h2>
              <span className="product-count" aria-live="polite">
                {loading ? 'در حال بارگذاری' : `${formatId(filteredProducts.length)} محصول`}
              </span>
            </div>

            {error ? (
              <div className="catalog-state" role="alert">
                <p className="eyebrow">خطا در ارتباط</p>
                <h3>دسترسی به کاتالوگ ممکن نیست.</h3>
                <p>{error}</p>
                <button className="text-button" onClick={retryCatalog} type="button">تلاش دوباره <span aria-hidden="true">&#8592;</span></button>
              </div>
            ) : loading ? (
              <div className="product-grid" aria-label="در حال بارگذاری محصولات">
                {Array.from({ length: 4 }, (_, index) => <div className="product-skeleton" key={index} />)}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} onSelect={setSelectedProduct} product={product} />
                ))}
              </div>
            ) : (
              <div className="catalog-state empty-state">
                <p className="eyebrow">هنوز محصولی ثبت نشده</p>
                <h3>کاتالوگ در حال آماده‌سازی است.</h3>
                <p>{selectedBrand === 'all' ? 'با ثبت محصولات جدید، آن‌ها را در همین‌جا خواهید دید.' : 'فعلاً محصولی برای این دسته‌بندی ثبت نشده است.'}</p>
              </div>
            )}
          </section>

          <footer className="store-footer">
            <span>ارجان اگزوز</span>
            <span>فهرست قطعات سیستم اگزوز</span>
          </footer>
        </main>
      </div>

      {selectedProduct && <ProductDialog onClose={() => setSelectedProduct(null)} product={selectedProduct} />}
    </div>
  )
}

export default App
